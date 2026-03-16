const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

const pledgeSchema = new mongoose.Schema({
  member:      { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  title:       { type: String, required: true },
  amount:      { type: Number, required: true },
  fulfilled:   { type: Number, default: 0 },
  dueDate:     { type: Date },
  status:      { type: String, enum: ['active','fulfilled','cancelled'], default: 'active' },
  notes:       { type: String },
}, { timestamps: true });

const Pledge = mongoose.models.Pledge || mongoose.model('Pledge', pledgeSchema);

// GET all pledges
router.get('/', protect, async (req, res) => {
  try {
    const pledges = await Pledge.find()
      .populate('member', 'firstName lastName whatsapp')
      .sort({ createdAt: -1 });
    res.json(pledges);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create pledge
router.post('/', protect, async (req, res) => {
  try {
    const pledge = await Pledge.create(req.body);
    await pledge.populate('member', 'firstName lastName');
    res.status(201).json(pledge);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update pledge (record fulfilment)
router.put('/:id', protect, async (req, res) => {
  try {
    const pledge = await Pledge.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('member', 'firstName lastName');
    if (!pledge) return res.status(404).json({ message: 'Pledge not found' });
    // Auto-mark fulfilled
    if (pledge.fulfilled >= pledge.amount) {
      pledge.status = 'fulfilled';
      await pledge.save();
    }
    res.json(pledge);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await Pledge.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
