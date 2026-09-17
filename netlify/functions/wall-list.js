const { getFormSubmissionsByName } = require("./lib/netlify-api");

exports.handler = async function () {
  try {
    const [submissions, votes] = await Promise.all([
      getFormSubmissionsByName("wall-submission"),
      getFormSubmissionsByName("wall-vote"),
    ]);

    const voteCounts = {};
    for (const v of votes) {
      const targetId = v.data && v.data.targetId;
      if (!targetId) continue;
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    }

    const seen = new Set();
    const entries = [];
    for (const s of submissions) {
      const d = s.data || {};
      const id = d.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      entries.push({
        id,
        obvious: d.obvious || "",
        signal: d.signal || "",
        who: d.who || "Submitted anonymously",
        votes: voteCounts[id] || 0,
        createdAt: s.created_at,
      });
    }

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
