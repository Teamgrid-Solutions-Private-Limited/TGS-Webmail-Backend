const nodemailer = require('nodemailer');

const createGmailTransport = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
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
    // Verify connection before sending
    await transporter.verify();
    
    const info = await transporter.sendMail(message);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);

    // In development, ignore certain errors if credentials are missing
    if (
      process.env.NODE_ENV === 'development' &&
      (error.code === 'EAUTH' || error.code === 'ESOCKET' || error.code === 'ETIMEDOUT')
    ) {
      console.warn('[DEV MODE] Ignoring email failure due to config/network issue.');
      return;
    }

    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
