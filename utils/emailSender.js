const nodemailer = require("nodemailer");

const sendEmail = async ({ subject, html }) => {
  try {
    // Validate required environment variables
    const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_TO'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Parse port as number and determine secure setting
    const port = parseInt(process.env.EMAIL_PORT, 10);
    if (isNaN(port)) {
      throw new Error(`Invalid EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    }

    // Port 465 uses SSL (secure: true), port 587 uses TLS (secure: false, requireTLS: true)
    const isSecure = port === 465;
    const useTLS = port === 587 || port === 25;

    // Create transporter with production-ready configuration
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: port,
      secure: isSecure, // true for 465, false for other ports
      requireTLS: useTLS, // true for 587, false for 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // TLS configuration for production environments
      tls: {
        // Do not fail on invalid certificates (useful for self-signed certs)
        rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
        // Minimum TLS version
        minVersion: 'TLSv1.2',
      },
      // Connection timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
      // Retry configuration
      pool: false,
      maxConnections: 1,
      maxMessages: 3,
    });

    // Verify connection before sending (optional but recommended)
    try {
      await transporter.verify();
      console.log('✅ SMTP server is ready to send emails');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError.message);
      // Continue anyway - some servers don't support verification
    }

    const mailOptions = {
      from: `"Contact Us" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject,
      html,
      // Add error handling for email sending
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
    throw error; // Re-throw to allow caller to handle
  }
};

module.exports = sendEmail;
