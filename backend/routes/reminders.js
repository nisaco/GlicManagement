const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');

// GET /api/reminders/overdue  — members who haven't paid this month
router.get('/overdue', protect, async (req, res) => {
  try {
    const now = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;

    // Find members who HAVE paid dues this month
    const paidIds = await Payment.distinct('member', {
      type: { $in: ['dues', 'tithe'] },
      year,
      month,
    });

    // Find active members NOT in that list
    const overdue = await Member.find({
      status: 'active',
      _id: { $nin: paidIds },
    }).select('firstName lastName whatsapp phone duesAmount departments role');

    // Calculate how many months each member is behind
    // (simplified: check last payment date)
    const result = [];
    for (const m of overdue) {
      const lastPayment = await Payment.findOne({
        member: m._id,
        type: { $in: ['dues', 'tithe'] },
      }).sort({ year: -1, month: -1 });

      let monthsBehind = 1;
      if (lastPayment) {
        const diff =
          (year - lastPayment.year) * 12 + (month - lastPayment.month);
        monthsBehind = Math.max(1, diff);
      }

      result.push({
        _id: m._id,
        name: `${m.firstName} ${m.lastName}`,
        whatsapp: m.whatsapp || m.phone,
        duesAmount: m.duesAmount,
        totalOwed: m.duesAmount * monthsBehind,
        monthsBehind,
        role: m.role,
        departments: m.departments,
        status: monthsBehind >= 2 ? 'overdue' : 'due',
      });
    }

    res.json(result.sort((a, b) => b.monthsBehind - a.monthsBehind));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reminders/log  — save a reminder log after sending
router.post('/log', protect, async (req, res) => {
  try {
    const { memberIds, template, message } = req.body;
    const reminder = await Reminder.create({
      members: memberIds,
      channel: 'whatsapp',
      template,
      message,
      sentBy: req.user._id,
      count: memberIds.length,
    });
    res.status(201).json(reminder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/reminders/history
router.get('/history', protect, async (req, res) => {
  try {
    const history = await Reminder.find()
      .populate('sentBy', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
