// Manual diagnostic: GET /.netlify/functions/test-email?to=you@example.com
// Sends one test email through the configured Gmail account so we can confirm
// GMAIL_USER / GMAIL_APP_PASSWORD actually work before relying on the
// scheduled notify-sessions function.
const { sendMail } = require("./lib/mailer");

exports.handler = async function (event) {
  const to = (event.queryStringParameters && event.queryStringParameters.to) || process.env.GMAIL_USER;
  if (!to) {
    return { statusCode: 400, body: JSON.stringify({ error: "Pass ?to=you@example.com" }) };
  }
  try {
    await sendMail({
      to,
      subject: "TMRE Experience Zone — test email",
      text: "If you're reading this, Gmail SMTP sending from the Netlify function is working.",
    });
    return { statusCode: 200, body: JSON.stringify({ ok: true, sentTo: to }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
