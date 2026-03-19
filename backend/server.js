const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/members',    require('./routes/members'));
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/reminders',  require('./routes/reminders'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/pledges',    require('./routes/pledges'));
app.use('/api/activity', require('./routes/activitylog').router);

// Serve React frontend in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ONE-TIME cleanup — remove duplicate payments (same member+month+year+type)
app.delete('/api/admin/cleanup-duplicates', async (req, res) => {
  try {
    const Payment  = require('./models/Payment');
    const payments = await Payment.find({ month: { $ne: null } }).sort({ createdAt: 1 });
    const seen     = new Set();
    const toDelete = [];

    for (const p of payments) {
      const key = `${p.member}-${p.month}-${p.year}-${p.type}`;
      if (seen.has(key)) {
        toDelete.push(p._id);
      } else {
        seen.add(key);
      }
    }

    await Payment.deleteMany({ _id: { $in: toDelete } });
    res.json({ message: `Cleaned up ${toDelete.length} duplicate records` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error('DB connection error:', err));
