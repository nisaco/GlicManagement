const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    members:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
    channel:  { type: String, default: 'whatsapp' },
    template: { type: String, enum: ['gentle', 'firm', 'final'], default: 'gentle' },
    message:  { type: String },
    sentBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    count:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);
