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

module.exports = router;
