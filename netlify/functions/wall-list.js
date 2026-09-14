const { store } = require("./lib/store");

exports.handler = async function () {
  const wallStore = store("wall");
  const { blobs } = await wallStore.list();

  const entries = await Promise.all(
    blobs.map((b) => wallStore.get(b.key, { type: "json" }))
  );

  const clean = entries
    .filter(Boolean)
    .map((e) => ({
      id: e.id,
      obvious: e.obvious,
      signal: e.signal,
      who: e.who,
      votes: e.votes || 0,
      createdAt: e.createdAt,
    }))
    .sort((a, b) => (b.votes - a.votes) || (new Date(b.createdAt) - new Date(a.createdAt)));

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ ok: true, entries: clean }),
  };
};
