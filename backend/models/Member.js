const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, trim: true, lowercase: true },
    phone:     { type: String, trim: true },
    whatsapp:  { type: String, trim: true },
    dob:       { type: Date },
    photo:     { type: String, default: null },

    membershipDate: { type: Date, default: Date.now },
    baptismDate:    { type: Date },
    status: {
      type: String,
      enum: ['active', 'inactive', 'visitor'],
      default: 'active',
    },
    role: {
      type: String,
      enum: ['bishop', 'deaconess', 'reverend', 'member', 'deacon', 'elder', 'pastor', 'youth', 'visitor'],
      default: 'member',
    },
    departments: [{ type: String }],
    location:    { type: String, trim: true },
    duesAmount:  { type: Number, default: 200 },
    duesFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      default: 'monthly',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

memberSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
memberSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);