const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const now = new Date();
    const currentYear  = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Total members
    const totalMembers = await Member.countDocuments({ status: 'active' });

    // New members this year
    const newThisYear = await Member.countDocuments({
      membershipDate: { $gte: new Date(`${currentYear}-01-01`) },
    });

    // Total collected this year
    const collectedResult = await Payment.aggregate([
      { $match: { year: currentYear } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalCollected = collectedResult[0]?.total || 0;

    // This month
    const monthResult = await Payment.aggregate([
      { $match: { year: currentYear, month: currentMonth } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const thisMonth = monthResult[0]?.total || 0;

    // Monthly breakdown (last 6 months)
    const monthlyBreakdown = await Payment.aggregate([
      { $match: { year: currentYear } },
      { $group: { _id: '$month', total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]);

    // Recent payments
    const recentPayments = await Payment.find()
      .populate('member', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(6);

    // Members who haven't paid this month (pending dues)
    const paidThisMonth = await Payment.distinct('member', {
      type: { $in: ['dues', 'tithe'] },
      year: currentYear,
      month: currentMonth,
    });
    const pendingCount = await Member.countDocuments({
      status: 'active',
      _id: { $nin: paidThisMonth },
    });

    res.json({
      totalMembers,
      newThisYear,
      totalCollected,
      thisMonth,
      pendingCount,
      monthlyBreakdown,
      recentPayments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
