const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { protect } = require('../middleware/auth');

// GET /api/members  — list all with optional filters
router.get('/', protect, async (req, res) => {
  try {
    const { status, department, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (department) query.departments = department;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
        { phone:     { $regex: search, $options: 'i' } },
      ];
    }
    const members = await Member.find(query).sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/members/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/members
router.post('/', protect, async (req, res) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/members/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/members/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// POST /api/members/bulk-import — import multiple members at once
router.post('/bulk-import', protect, async (req, res) => {
  try {
    const { members } = req.body;
    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'No members provided' });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (const row of members) {
      try {
        // Skip rows with no first name or last name
        if (!row.firstName?.trim() || !row.lastName?.trim()) {
          results.skipped++;
          continue;
        }
        // Check for duplicate by name + whatsapp
        const existing = await Member.findOne({
          firstName: { $regex: new RegExp(`^${row.firstName.trim()}$`, 'i') },
          lastName:  { $regex: new RegExp(`^${row.lastName.trim()}$`,  'i') },
        });
        if (existing) { results.skipped++; continue; }

        await Member.create({
          firstName:      row.firstName?.trim(),
          lastName:       row.lastName?.trim(),
          email:          row.email?.trim()      || '',
          phone:          row.phone?.toString().trim()    || '',
          whatsapp:       row.whatsapp?.toString().trim() || '',
          location:       row.location?.trim()   || '',
          role:           row.role?.toLowerCase().trim() || 'member',
          status:         row.status?.toLowerCase().trim() || 'active',
          duesAmount:     Number(row.duesAmount) || 200,
          departments:    row.departments ? row.departments.split(',').map(d => d.trim()).filter(Boolean) : [],
          notes:          row.notes?.trim() || '',
          membershipDate: row.membershipDate ? new Date(row.membershipDate) : new Date(),
        });
        results.created++;
      } catch (err) {
        results.errors.push(`${row.firstName} ${row.lastName}: ${err.message}`);
      }
    }

    res.json({
      message: `Import complete: ${results.created} added, ${results.skipped} skipped`,
      ...results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
