const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Protect — requires valid JWT
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid' });
  }
};

// requireRole('admin') or requireRole('admin', 'secretary')
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (req.user.role === 'admin' || roles.includes(req.user.role)) return next();
  return res.status(403).json({ message: `Access denied. Required: ${roles.join(' or ')}` });
};

const canAccessFinance  = requireRole('admin', 'treasurer');
const canManageMembers  = requireRole('admin', 'secretary');

module.exports = { protect, requireRole, canAccessFinance, canManageMembers };