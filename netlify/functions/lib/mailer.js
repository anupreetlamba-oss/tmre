const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD are not set on this site's environment variables.");
  }
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  const from = process.env.GMAIL_USER;
  return t.sendMail({
    from: `TMRE Experience Zone <${from}>`,
    to,
    subject,
    text,
    html: html || undefined,
  });
}

module.exports = { sendMail };
