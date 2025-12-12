const ContactQuery = require("../models/contact.model");
const { validationResult } = require("express-validator");
const sendEmail = require("../utils/emailSender");

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

// exports.submitContactForm = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     const {
//       fullName,
//       workEmail,
//       phoneNumber,
//       company,
//       topics,
//       message,
//       attachmentLinks // May be single or multiple
//     } = req.body;

//     // Process uploaded files
//     const uploadedFiles = req.files?.map(file => file.path) || [];

//     // Process shared links
//     const driveLinks = Array.isArray(attachmentLinks)
//       ? attachmentLinks.filter(link => isValidUrl(link))
//       : attachmentLinks && isValidUrl(attachmentLinks)
//         ? [attachmentLinks]
//         : [];

//     const attachments = [...uploadedFiles, ...driveLinks];

//     // Save to DB
//     const contactEntry = new ContactQuery({
//       fullName,
//       workEmail,
//       phoneNumber,
//       company,
//       topics: Array.isArray(topics) ? topics : [topics],
//       message,
//       attachments
//     });

//     await contactEntry.save();

//     // ✉️ Send Email
//     const emailSubject = `📨 New Contact Form Submission from ${fullName}`;
//     const emailHtml = `
//       <h2>New Contact Query</h2>
//       <p><strong>Name:</strong> ${fullName}</p>
//       <p><strong>Email:</strong> ${workEmail}</p>
//       <p><strong>Phone:</strong> ${phoneNumber || 'N/A'}</p>
//       <p><strong>Company:</strong> ${company || 'N/A'}</p>
//       <p><strong>Topics:</strong> ${(Array.isArray(topics) ? topics : [topics]).join(', ')}</p>
//       <p><strong>Message:</strong><br>${message}</p>
//       ${attachments.length > 0 ? `
//         <p><strong>Attachments:</strong></p>
//         <ul>
//           ${attachments.map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`).join('')}
//         </ul>
//       ` : ''}
//     `;

//     await sendEmail({ subject: emailSubject, html: emailHtml });

//     return res.status(201).json({
//       success: true,
//       message: 'Your query has been received!'
//     });

//   } catch (error) {
//     console.error('Error saving contact form:', error);
//     return res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

exports.submitContactForm = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { fullName, workEmail, company, message, attachmentLinks } = req.body;

  const sanitize = (str = "") => String(str).replace(/[<>]/g, ""); // prevent HTML injection

  const fromPage = sanitize(
    req.query.fromPage || req.params.fromPage || "website"
  );
  const typeofQuery = sanitize(
    req.query.typeofQuery || req.params.typeofQuery || "general inquiry"
  );


    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const uploadedFiles =
      req.files?.map((file) => `${baseUrl}/${file.path.replace(/\\/g, "/")}`) ||
      [];

    const driveLinks = Array.isArray(attachmentLinks)
      ? attachmentLinks.filter((link) => isValidUrl(link))
      : attachmentLinks && isValidUrl(attachmentLinks)
        ? [attachmentLinks]
        : [];

    const attachments = [...uploadedFiles, ...driveLinks];

    // Save to DB ✅
    const contactEntry = new ContactQuery({
      fullName,
      workEmail,
      company,
      message,
      attachments,
      fromPage,
      typeofQuery,
    });
    await contactEntry.save();

    // Return response to user immediately ✅
    res.status(201).json({
      success: true,
      message: "Your query has been received!",
    });

    // Background Email send (non-blocking) ✅
    const emailSubject = `📨 New Contact Form Submission from ${fullName}`;
    const emailHtml = `
      <h2>New Contact Query</h2>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${workEmail}</p>
      <p><strong>Company:</strong> ${company || "N/A"}</p>
      <p><strong>Message:</strong><br>${message}</p>
      ${
        attachments.length > 0
          ? `
        <p><strong>Attachments:</strong></p>
        <ul>
          ${attachments.map((link) => `<li><a href="${link}" target="_blank">${link}</a></li>`).join("")}
        </ul>
      `
          : ""
      }
    `;

    setImmediate(async () => {
      try {
        await sendEmail({ subject: emailSubject, html: emailHtml });
      } catch (err) {
        console.error("❌ Failed to send email:", err.message);
      }
    });
  } catch (error) {
    console.error("Error saving contact form:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Instant file upload handler
exports.instantUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // Return file path or name as reference
  res.json({ filePath: req.file.path, fileName: req.file.filename });
};
