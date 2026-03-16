const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

// GET /api/payments
router.get('/', protect, async (req, res) => {
  try {
    const { memberId, type, year, month } = req.query;
    const query = {};
    if (memberId) query.member = memberId;
    if (type)     query.type = type;
    if (year)     query.year = Number(year);
    if (month)    query.month = Number(month);
    const payments = await Payment.find(query)
      .populate('member', 'firstName lastName whatsapp')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments
router.post('/', protect, async (req, res) => {
  try {
    const payment = await Payment.create({ ...req.body, recordedBy: req.user._id });
    await payment.populate('member', 'firstName lastName');
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/payments/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('member', 'firstName lastName');
    if (!payment) return res.status(404).json({ message: 'Not found' });
    res.json(payment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/payments/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// POST /api/payments/bulk-import
router.post('/bulk-import', protect, async (req, res) => {
  try {
    const { payments } = req.body;
    if (!payments || !Array.isArray(payments) || payments.length === 0)
      return res.status(400).json({ message: 'No payments provided' });

    const Member = require('../models/Member');
    const results = { created: 0, skipped: 0, errors: [] };

    for (const row of payments) {
      try {
        // Must have amount and year
        if (!row.amount || !row.year) { results.skipped++; continue; }

        // Find member by name or skip
        let memberId = row.memberId;
        if (!memberId && row.memberName) {
          const parts     = row.memberName.trim().split(' ');
          const firstName = parts[0];
          const lastName  = parts.slice(1).join(' ');
          const member    = await Member.findOne({
            firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
            lastName:  { $regex: new RegExp(`^${lastName}$`,  'i') },
          });
          if (!member) {
            results.errors.push(`Member not found: "${row.memberName}" — make sure name matches exactly`);
            results.skipped++;
            continue;
          }
          memberId = member._id;
        }

        if (!memberId) { results.skipped++; continue; }

        await Payment.create({
          member:    memberId,
          amount:    Number(row.amount),
          type:      row.type?.toLowerCase().trim().replace(/\s+/g,'_') || 'dues',
          method:    row.method?.toLowerCase().trim().replace(/\s+/g,'_') || 'cash',
          month:     row.month ? Number(row.month) : null,
          year:      Number(row.year),
          reference: row.reference?.trim() || '',
          notes:     row.notes?.trim()     || '',
        });
        results.created++;
      } catch (err) {
        results.errors.push(`Row error: ${err.message}`);
      }
    }

    res.json({
      message: `Import complete: ${results.created} records added, ${results.skipped} skipped`,
      ...results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
