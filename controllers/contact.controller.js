const ContactQuery = require('../models/contact.model');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/emailSender'); // <-- ADD THIS

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

    // ✉️ Send Email to Admin
    const emailSubject = `📨 New Contact Form Submission from ${fullName}`;
    const emailHtml = `
      <h2>New Contact Query</h2>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${workEmail}</p>
      <p><strong>Phone:</strong> ${phoneNumber || 'N/A'}</p>
      <p><strong>Company:</strong> ${company || 'N/A'}</p>
      <p><strong>Topics:</strong> ${(Array.isArray(topics) ? topics : [topics]).join(', ')}</p>
      <p><strong>Message:</strong><br>${message}</p>
    `;

    await sendEmail({ subject: emailSubject, html: emailHtml });

    return res.status(201).json({
      success: true,
      message: 'Your query has been received!'
    });

  } catch (error) {
    console.error('Error saving contact form:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
// Note: Ensure that the sendEmail utility is properly configured to send emails using your email service provider.