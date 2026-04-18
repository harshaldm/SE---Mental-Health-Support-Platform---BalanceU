const nodemailer = require('nodemailer');

// ─── Nodemailer Transporter ───
// Uses environment variables for SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email notification.
 * @param {string} to       - Recipient email address
 * @param {string} subject  - Email subject line
 * @param {string} htmlContent - HTML body of the email
 */
const sendNotification = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: `"BalanceU" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    // Log but don't crash the app — email is non-blocking
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return null;
  }
};

module.exports = sendNotification;
