const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const { protect } = require('../middleware/auth');

const logSchema = new mongoose.Schema({
  action:      { type: String, required: true },
  category:    { type: String, enum: ['payment','member','attendance','import','reminder','pledge','other'], default: 'other' },
  description: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  meta:        { type: Object },
}, { timestamps: true });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', logSchema);

// GET /api/activity — fetch recent activity
router.get('/', protect, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const logs  = await ActivityLog.find()
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/activity — log an action
router.post('/', protect, async (req, res) => {
  try {
    const { action, category, description, meta } = req.body;
    const log = await ActivityLog.create({
      action, category, description, meta,
      performedBy: req.user._id,
    });
    res.status(201).json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = { router, ActivityLog };