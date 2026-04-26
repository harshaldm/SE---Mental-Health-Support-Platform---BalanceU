const nodemailer = require('nodemailer');
const logger = require('./logger');

// ─── Nodemailer Transporter ───
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email notification.
 */
const sendNotification = async (to, subject, htmlContent) => {
  logger.start(`[sendNotification] -> Preparing email for {${to}}...`);
  try {
    const info = await transporter.sendMail({
      from: `"BalanceU" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    logger.success(`[sendNotification] -> Email delivered to {${to}}. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`[sendNotification] -> Dispatch failed for {${to}}`, error);
    return null;
  }
};

module.exports = sendNotification;
