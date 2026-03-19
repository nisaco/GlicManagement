const express = require('express');
const router  = express.Router();
const Payment = require('../models/Payment');
const Member  = require('../models/Member');
const { protect } = require('../middleware/auth');

// Helper — check if a payment already exists for member+month+year+type
const paymentExists = async (memberId, month, year, type) => {
  if (!month) return false;
  const existing = await Payment.findOne({
    member: memberId,
    month:  Number(month),
    year:   Number(year),
    type:   type || 'dues',
  });
  return !!existing;
};

// GET /api/payments
router.get('/', protect, async (req, res) => {
  try {
    const { member, type, year, month } = req.query;
    const query = {};
    if (member) query.member = member;
    if (type)   query.type   = type;
    if (year)   query.year   = Number(year);
    if (month)  query.month  = Number(month);
    const payments = await Payment.find(query)
      .populate('member', 'firstName lastName whatsapp phone')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/payments/paid-months?member=id&year=2024
router.get('/paid-months', protect, async (req, res) => {
  try {
    const { member, year } = req.query;
    if (!member || !year) return res.json({ months: [] });
    const payments = await Payment.find({
      member, year: Number(year), month: { $ne: null },
    }).select('month');
    res.json({ months: payments.map(p => p.month) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/payments/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('member', 'firstName lastName whatsapp phone');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/payments — supports multiple months across years
router.post('/', protect, async (req, res) => {
  try {
    const { monthsData, ...rest } = req.body;

    if (monthsData && Array.isArray(monthsData) && monthsData.length > 0) {
      const created  = [];
      const skipped  = [];

      for (const { month, year } of monthsData) {
        // Skip if this month already has a record
        const exists = await paymentExists(rest.member, month, year, rest.type);
        if (exists) { skipped.push(`${month}/${year}`); continue; }

        const payment = await Payment.create({ ...rest, month, year });
        await payment.populate('member', 'firstName lastName');
        created.push(payment);
      }

      return res.status(201).json({
        payments: created,
        skipped,
        message: skipped.length > 0
          ? `${created.length} saved, ${skipped.length} skipped (already paid)`
          : `${created.length} payment${created.length > 1 ? 's' : ''} saved`,
      });
    }

    // Single payment — check duplicate too
    if (req.body.month) {
      const exists = await paymentExists(req.body.member, req.body.month, req.body.year, req.body.type);
      if (exists) return res.status(400).json({ message: `A ${req.body.type} payment for ${req.body.month}/${req.body.year} already exists for this member.` });
    }

    const payment = await Payment.create(req.body);
    await payment.populate('member', 'firstName lastName');
    res.status(201).json({ payments: [payment], message: '1 payment saved' });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/payments/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/payments/bulk-import
router.post('/bulk-import', protect, async (req, res) => {
  try {
    const { payments } = req.body;
    if (!payments || !Array.isArray(payments) || payments.length === 0)
      return res.status(400).json({ message: 'No payments provided' });

    const results = { created: 0, skipped: 0, errors: [] };

    for (const row of payments) {
      try {
        if (!row.amount || !row.year) {
          results.errors.push('Skipped row — missing amount or year');
          results.skipped++; continue;
        }

        // Find member
        let member = null;
        if (row.memberName?.trim()) {
          const fullName  = row.memberName.trim();
          const parts     = fullName.split(/\s+/);
          const firstName = parts[0];
          const lastName  = parts.slice(1).join(' ');

          if (lastName) {
            member = await Member.findOne({
              firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
              lastName:  { $regex: new RegExp(`^${lastName}$`, 'i') },
            });
          }
          if (!member && lastName) {
            member = await Member.findOne({
              firstName: { $regex: new RegExp(firstName, 'i') },
              lastName:  { $regex: new RegExp(lastName, 'i') },
            });
          }
          if (!member) {
            const all = await Member.find({});
            member = all.find(m =>
              `${m.firstName} ${m.lastName}`.toLowerCase() === fullName.toLowerCase() ||
              `${m.lastName} ${m.firstName}`.toLowerCase() === fullName.toLowerCase()
            );
          }
          if (!member) {
            results.errors.push(`Member not found: "${row.memberName}"`);
            results.skipped++; continue;
          }
        }

        if (!member) { results.skipped++; continue; }

        // Parse months — "3", "1,2,3", "1-6", "1-12"
        let monthList = [];
        const rawMonths = row.months || row.month || '';

        if (!rawMonths || rawMonths === '') {
          monthList = [null];
        } else {
          const str = String(rawMonths).trim();
          if (str.includes('-')) {
            const [start, end] = str.split('-').map(Number);
            for (let m = Math.max(1,start); m <= Math.min(12,end); m++) monthList.push(m);
          } else if (str.includes(',')) {
            monthList = str.split(',').map(s => Number(s.trim())).filter(n => n >= 1 && n <= 12);
          } else {
            const n = Number(str);
            if (n >= 1 && n <= 12) monthList = [n];
            else monthList = [null];
          }
        }

        // Remove duplicates in the list itself
        monthList = [...new Set(monthList)];

        const type   = row.type?.toLowerCase().trim().replace(/\s+/g,'_') || 'dues';
        const method = row.method?.toLowerCase().trim().replace(/\s+/g,'_') || 'cash';
        const year   = Number(row.year);
        const amount = Number(row.amount);

        for (const month of monthList) {
          // Skip if already exists in DB
          if (month) {
            const exists = await paymentExists(member._id, month, year, type);
            if (exists) { results.skipped++; continue; }
          }

          await Payment.create({
            member:    member._id,
            amount,
            type,
            method,
            month:     month || null,
            year,
            reference: row.reference?.trim() || '',
            notes:     row.notes?.trim()     || '',
          });
          results.created++;
        }

      } catch (err) {
        results.errors.push(`Error: ${err.message}`);
      }
    }

    res.json({
      message: `Import complete: ${results.created} records added, ${results.skipped} skipped (duplicates or errors)`,
      ...results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;