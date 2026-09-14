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

  const id = (body.id || "").toString();
  const voterId = (body.voterId || "").toString().slice(0, 100);
  if (!id || !voterId) {
    return { statusCode: 400, body: JSON.stringify({ error: "id and voterId are required." }) };
  }

  const wallStore = store("wall");
  const doc = await wallStore.get(id, { type: "json" });
  if (!doc) {
    return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
  }

  doc.voters = doc.voters || [];
  if (doc.voters.includes(voterId)) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, alreadyVoted: true, entry: doc }),
    };
  }

  doc.voters.push(voterId);
  doc.votes = (doc.votes || 0) + 1;
  await wallStore.setJSON(id, doc);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, alreadyVoted: false, entry: doc }),
  };
};
