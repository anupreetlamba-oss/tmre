const { store } = require("./lib/store");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const name = (body.name || "").toString().trim().slice(0, 100);
  const email = (body.email || "").toString().trim().toLowerCase().slice(0, 200);
  const tracks = Array.isArray(body.tracks) ? body.tracks.map(String).slice(0, 20) : [];

  if (!name || !EMAIL_RE.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "A name and valid email are required." }) };
  }
  if (!tracks.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "Pick at least one track." }) };
  }

  const optins = store("optins");
  const doc = { name, email, tracks, updatedAt: new Date().toISOString() };
  await optins.setJSON(email, doc);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
