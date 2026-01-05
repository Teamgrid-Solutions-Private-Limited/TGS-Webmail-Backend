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

    const {
      fullName,
      workEmail,
      company,
      message,
      attachmentLinks,
      fromPage,
      typeofQuery,
    } = req.body;

    const sanitize = (str = "") => String(str).replace(/[<>]/g, ""); // prevent HTML injection

    const sanitizedFromPage = sanitize(fromPage || "website");
    const sanitizedTypeofQuery = sanitize(typeofQuery || "general inquiry");

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
      fromPage: sanitizedFromPage,
      typeofQuery: sanitizedTypeofQuery,
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
      <h2>${typeofQuery} from ${fromPage}</h2>
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
        // Email to admin
        await sendEmail({
          subject: emailSubject,
          html: emailHtml,
          replyTo: workEmail,
          to: process.env.EMAIL_TO,
        });
        console.log("✅ Email successfully sent to:", process.env.EMAIL_TO);

        // Confirmation email to submitter
        const confirmationSubject =
          "Thank you for contacting Teamgrid Solutions";

        const confirmationHtml = `
  <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
    <p>Dear ${fullName},</p>

    <p>
      We have received your message and our team will review it shortly.
    </p>

    <p>
      If you need to add any additional information, you may reply to this email.
    </p>

    <p>
      Best regards,<br>
      <strong>Teamgrid Solutions</strong>
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;">

    <p style="font-size: 12px; color: #777;">
      This is an automated acknowledgment email. Please do not share sensitive or confidential information via email.
    </p>
  </div>
`;

        await sendEmail({
          subject: confirmationSubject,
          html: confirmationHtml,
          to: workEmail,
        });
        console.log("✅ Confirmation email sent to submitter:", workEmail);
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
