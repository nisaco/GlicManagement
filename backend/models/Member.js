const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    // Personal Info
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, trim: true, lowercase: true },
    phone:     { type: String, trim: true },
    whatsapp:  { type: String, trim: true }, // WhatsApp number e.g. 233244001001
    dob:       { type: Date },
    photo:     { type: String, default: null }, // base64 or URL

    // Church Info
    membershipDate: { type: Date, default: Date.now },
    baptismDate:    { type: Date },
    status: {
      type: String,
      enum: ['active', 'inactive', 'visitor'],
      default: 'active',
    },
    role: {
      type: String,
      enum: ['member', 'deacon', 'elder', 'pastor', 'youth', 'visitor'],
      default: 'member',
    },
    departments: [{ type: String }], // e.g. ['Choir', 'Ushering']

    // Family
    household: { type: String }, // household/family group name
    familyRole: {
      type: String,
      enum: ['head', 'spouse', 'child', 'other'],
      default: 'head',
    },

    // Dues
    duesAmount:    { type: Number, default: 200 }, // monthly dues amount in GHS
    duesFrequency: { type: String, enum: ['monthly', 'quarterly', 'annual'], default: 'monthly' },

    notes: { type: String },
  },
  { timestamps: true }
);

// Virtual: full name
memberSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

memberSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);
