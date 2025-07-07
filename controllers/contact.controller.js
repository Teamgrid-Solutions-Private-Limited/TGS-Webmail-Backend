const ContactQuery = require('../models/contact.model');
const { validationResult } = require('express-validator');

exports.submitContactForm = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      fullName,
      workEmail,
      phoneNumber,
      company,
      topics,
      message
    } = req.body;

    const attachments = req.files?.map(file => file.path) || [];

    const contactEntry = new ContactQuery({
      fullName,
      workEmail,
      phoneNumber,
      company,
      topics: Array.isArray(topics) ? topics : [topics],
      message,
      attachments
    });

    await contactEntry.save();
    res.status(201).json({ success: true, message: 'Your query has been received!' });

  } catch (error) {
    console.error('Error saving contact form:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
