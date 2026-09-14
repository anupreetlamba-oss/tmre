const { store } = require("./lib/store");

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

  const obvious = (body.obvious || "").toString().trim().slice(0, 400);
  const signal = (body.signal || "").toString().trim().slice(0, 400);
  const anonymous = !!body.anonymous;
  const name = (body.name || "").toString().trim().slice(0, 100);
  const company = (body.company || "").toString().trim().slice(0, 100);

  if (!obvious || !signal) {
    return { statusCode: 400, body: JSON.stringify({ error: "Both fields are required." }) };
  }

  const id = "sub_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  const who = anonymous
    ? "Submitted anonymously"
    : [name || "Someone", company].filter(Boolean).join(" · ");

  const doc = {
    id,
    obvious,
    signal,
    who,
    anonymous,
    votes: 0,
    voters: [],
    createdAt: new Date().toISOString(),
  };

  const wallStore = store("wall");
  await wallStore.setJSON(id, doc);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, entry: doc }),
  };
};
