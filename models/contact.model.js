// models/ContactQuery.js
const mongoose = require('mongoose');

const ContactQuerySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  workEmail: { type: String, required: true },
  company: { type: String },
  pricingType: { type: String },
  fromPage: { type: String },
  typeofQuery: { type: String },
  message: { type: String, required: true },
  attachments: [{ type: String }], // URLs or file paths
  website: {type: String},
  timeline: {type: String},
  preferredEngagementType: {type: String},
  additionalNotes: {type: String},
  
}, {
  timestamps: true
});

module.exports = mongoose.model("contactqueries", ContactQuerySchema);
