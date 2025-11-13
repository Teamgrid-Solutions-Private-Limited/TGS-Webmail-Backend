const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async ({ subject, html }) => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const to = process.env.EMAIL_TO;

  if (!host || !user || !pass || !to) {
    console.error("❌ Email config missing. Required: EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_TO");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user, pass },
      logger: true,
      debug: true,
    });

    try {
      await transporter.verify();
      console.log("✅ SMTP connection verified");
    } catch (verifyErr) {
      console.error("❌ SMTP verify failed:", verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
    }

    const info = await transporter.sendMail({
      from: `"Contact Us" <${user}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    if (info.accepted && info.accepted.length) {
      console.log("✅ Accepted:", info.accepted.join(", "));
    }
    if (info.rejected && info.rejected.length) {
      console.warn("⚠️ Rejected:", info.rejected.join(", "));
    }
  } catch (err) {
    const code = err && err.code ? err.code : undefined;
    const response = err && err.response ? err.response : undefined;
    console.error("❌ Email send error:", code || "", response || "", err.message || err);
  }
};

module.exports = sendEmail;
