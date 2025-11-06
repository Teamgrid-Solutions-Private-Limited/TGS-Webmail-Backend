// models/ContactQuery.js
const mongoose = require('mongoose');

const ContactQuerySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  workEmail: { type: String, required: true },
  company: { type: String },
  message: { type: String, required: true },
  attachments: [{ type: String }], // URLs or file paths
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("contactqueries", ContactQuerySchema);
