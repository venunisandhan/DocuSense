
const nodemailer = require('nodemailer');

const env = require('../config/env');

const logger = require('../utils/logger');

let transporter = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (!transporter) {
    logger.info(`[DEV] Password reset link for ${toEmail}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: toEmail,
    subject: 'Reset your DocuSense password',
    text: `Click the link below to reset your password. This link expires in 15 minutes.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `<p>Click the link below to reset your password. This link expires in 15 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  });
}

module.exports = { sendPasswordResetEmail };