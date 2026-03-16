const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

const generateToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/setup — only works if NO users exist yet
router.post('/setup', async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) return res.status(403).json({ message: 'Setup already complete. Contact your admin to create accounts.' });
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password, role: 'admin' });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, token: generateToken(user._id),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/auth/setup-status — check if setup is needed
router.get('/setup-status', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ needsSetup: count === 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, token: generateToken(user._id),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/auth/users — list all staff (admin only)
router.get('/users', protect, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/auth/users — create new staff account (admin only)
router.post('/users', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, role });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/auth/users/:id — update role or name (admin only)
router.put('/users/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/auth/users/:id (admin only, can't delete yourself)
router.delete('/users/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: "You can't delete your own account" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/auth/me/password — change own password
router.put('/me/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;