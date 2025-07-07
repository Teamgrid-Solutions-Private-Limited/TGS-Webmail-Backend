// models/ContactQuery.js
const mongoose = require('mongoose');

const ContactQuerySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  workEmail: { type: String, required: true },
  phoneNumber: { type: String },
  company: { type: String },
  topics: [{ type: String }],
  message: { type: String, required: true },
  attachments: [{ type: String }], // URLs or file paths
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContactQuery', ContactQuerySchema);
