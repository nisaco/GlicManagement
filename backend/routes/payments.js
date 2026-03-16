const express = require('express');
const router  = express.Router();
const Payment = require('../models/Payment');
const Member  = require('../models/Member');
const { protect } = require('../middleware/auth');

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
// Returns which months a member has already paid for in a given year
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

    // monthsData = [{ month, year }, { month, year }, ...] for multi-month/multi-year
    if (monthsData && Array.isArray(monthsData) && monthsData.length > 0) {
      const created = [];
      for (const { month, year } of monthsData) {
        const payment = await Payment.create({ ...rest, month, year });
        await payment.populate('member', 'firstName lastName');
        created.push(payment);
      }
      return res.status(201).json(created);
    }

    // Legacy single payment
    const payment = await Payment.create(req.body);
    await payment.populate('member', 'firstName lastName');
    res.status(201).json(payment);
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

        // Parse months
        let monthList = [];
        const rawMonths = row.months || row.month || '';
        if (!rawMonths || rawMonths === '') {
          monthList = [null];
        } else {
          const str = String(rawMonths).trim();
          if (str.includes('-')) {
            const [start, end] = str.split('-').map(Number);
            for (let m = start; m <= end; m++) monthList.push(m);
          } else if (str.includes(',')) {
            monthList = str.split(',').map(s => Number(s.trim())).filter(n => n >= 1 && n <= 12);
          } else {
            monthList = [Number(str)];
          }
        }

        for (const month of monthList) {
          await Payment.create({
            member:    member._id,
            amount:    Number(row.amount),
            type:      row.type?.toLowerCase().trim().replace(/\s+/g,'_')   || 'dues',
            method:    row.method?.toLowerCase().trim().replace(/\s+/g,'_') || 'cash',
            month:     month || null,
            year:      Number(row.year),
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
      message: `Import complete: ${results.created} records added, ${results.skipped} rows skipped`,
      ...results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message }); }
});

module.exports = router;