// TEMPORARY diagnostic — not for production use, remove once Blobs auth is sorted.
// Accepts siteID/token via query params ONLY (never from env, never committed)
// so we can test a known-good token against this exact site without ever
// putting a secret in the repo.
const { getStore } = require("@netlify/blobs");

exports.handler = async function (event) {
  const q = event.queryStringParameters || {};
  const siteID = q.siteid;
  const token = q.token;
  if (!siteID || !token) {
    return { statusCode: 400, body: JSON.stringify({ error: "pass ?siteid=...&token=..." }) };
  }
  try {
    const store = getStore("debug-store", { siteID, token });
    await store.set("ping", "pong");
    const val = await store.get("ping");
    return { statusCode: 200, body: JSON.stringify({ ok: true, val }) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, name: err.name, message: err.message }),
    };
  }
};
