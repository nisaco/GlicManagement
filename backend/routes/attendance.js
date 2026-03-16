const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

// Attendance schema (inline for simplicity)
const attendanceSchema = new mongoose.Schema({
  date:    { type: Date, required: true },
  service: { type: String, enum: ['sunday_main', 'sunday_second', 'midweek', 'friday', 'special'], default: 'sunday_main' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  totalCount: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

// GET /api/attendance
router.get('/', protect, async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate('members', 'firstName lastName')
      .sort({ date: -1 })
      .limit(50);
    res.json(records);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/attendance/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth();

    const thisMonth = await Attendance.find({
      date: { $gte: new Date(year, month, 1), $lt: new Date(year, month + 1, 1) }
    });

    const avgAttendance = thisMonth.length
      ? Math.round(thisMonth.reduce((s, r) => s + r.totalCount, 0) / thisMonth.length)
      : 0;

    const lastRecord = await Attendance.findOne().sort({ date: -1 });

    res.json({
      thisMonthServices: thisMonth.length,
      avgAttendance,
      lastServiceCount: lastRecord?.totalCount || 0,
      lastServiceDate:  lastRecord?.date || null,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/attendance
router.post('/', protect, async (req, res) => {
  try {
    const { date, service, members, totalCount, notes } = req.body;
    const record = await Attendance.create({ date, service, members, totalCount: totalCount || members.length, notes });
    res.status(201).json(record);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/attendance/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
