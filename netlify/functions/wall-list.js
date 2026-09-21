const { getWallEntries } = require("./lib/wall-data");

exports.handler = async function () {
  try {
    const entries = await getWallEntries();
    entries.sort((a, b) => b.votes - a.votes || new Date(b.createdAt) - new Date(a.createdAt));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ ok: true, entries }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
