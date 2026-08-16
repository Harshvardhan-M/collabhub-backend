const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  return transporter;
};

/**
 * Sends an email if SMTP is configured; otherwise logs it to the console.
 * This means password reset works out of the box in development/testing
 * without requiring real email credentials.
 */
const sendEmail = async ({ to, subject, text }) => {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    console.log('\n--- Email (SMTP not configured, logging instead) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log('-----------------------------------------------------\n');
    return { delivered: false, logged: true };
  }

  await activeTransporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@collabhub.local',
    to,
    subject,
    text,
  });

  return { delivered: true, logged: false };
};

module.exports = { sendEmail };
