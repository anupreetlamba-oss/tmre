// API endpoint for a cloud recording/transcription tool to push a session
// recording in automatically, as an alternative to the manual /upload.html
// form. Most cloud recorders (Otter, Fireflies, Read.ai, Fathom, etc.) hand
// you a webhook with a hosted link to the recording rather than the raw
// audio bytes, so this takes a URL, not a file upload.
//
// POST /.netlify/functions/submit-recording
// Headers: Content-Type: application/json
// Body: { "apiKey": "...", "sessionTitle": "...", "recordingUrl": "...", "notes": "optional" }
const { submitForm } = require("./lib/netlify-api");

// Simple shared-secret check, same security model as the jury tool's
// passphrase - fine for a small trusted set of integrations, not a real
// auth system. Change this before sharing the API with anyone.
const API_KEY = "tmre-recorder-2026";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  if (body.apiKey !== API_KEY) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid or missing apiKey" }) };
  }

  const sessionTitle = (body.sessionTitle || "").toString().trim();
  const recordingUrl = (body.recordingUrl || "").toString().trim();
  const notes = (body.notes || "").toString().trim();

  if (!sessionTitle || !recordingUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "sessionTitle and recordingUrl are required" }),
    };
  }

  try {
    await submitForm("session-recording", { sessionTitle, recordingUrl, notes, source: "api" });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
