const nodemailer = require("nodemailer");

const sendEmail = async ({ subject, html, replyTo, to }) => {
  // Create transporter on each call to ensure env vars are loaded
  const transporter = nodemailer.createTransport({
    host: "mail.smtp2go.com",
    port: 2525,
    secure: false,
    auth: {
      user: process.env.SMTP2GO_USERNAME,
      pass: process.env.SMTP2GO_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Contact Us" <${process.env.SMTP2GO_FROM_EMAIL}>`, // verified sender
    to: to || process.env.EMAIL_TO, // support inbox (default) or custom recipient
    replyTo, // user's email
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
