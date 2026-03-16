const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['tithe', 'dues', 'building_fund', 'welfare', 'youth_levy', 'offering', 'other'],
      default: 'dues',
    },
    method: {
      type: String,
      enum: ['cash', 'momo', 'bank_transfer', 'cheque'],
      default: 'cash',
    },
    month:      { type: Number }, // 1-12, which month this dues covers
    year:       { type: Number }, // which year
    reference:  { type: String }, // receipt number or transaction ref
    notes:      { type: String },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
