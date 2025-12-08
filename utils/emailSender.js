const nodemailer = require('nodemailer');

const createGmailTransport = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });
};

const createCustomTransport = () => {
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const isSecure = port === 465;
  const useTLS = port === 587 || port === 25;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: isSecure,
    requireTLS: useTLS,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  });
};

const sendEmail = async ({ subject, html }) => {
  // Skip email in development if credentials are missing
  if (
    process.env.NODE_ENV === 'development' &&
    (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)
  ) {
    console.warn('[DEV MODE] Skipping email - credentials not configured');
    return;
  }

  // Validate required environment variables for production
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_TO) {
    throw new Error('Missing required email configuration: EMAIL_USER, EMAIL_PASS, EMAIL_TO');
  }

  // Determine which transporter to use
  const transporter =
    process.env.EMAIL_HOST === 'smtp.gmail.com' || !process.env.EMAIL_HOST
      ? createGmailTransport()
      : createCustomTransport();

  const message = {
    from: `"Contact Us" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: subject,
    html: html,
  };

  try {
    // Send email directly (connection happens during sendMail)
    // Verification is skipped to avoid timeout issues - sendMail will connect anyway
    const info = await transporter.sendMail(message);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);

    // In development only, ignore certain errors if credentials are missing
    if (
      process.env.NODE_ENV === 'development' &&
      (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) &&
      (error.code === 'EAUTH' || error.code === 'ESOCKET')
    ) {
      console.warn('[DEV MODE] Ignoring email failure due to missing credentials.');
      return;
    }

    // In production, always throw errors
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;
