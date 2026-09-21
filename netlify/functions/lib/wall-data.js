const { getFormSubmissionsByName } = require("./netlify-api");

// Public submissions + vote tally — shared by wall-list (public feed) and
// jury-standings (internal blended ranking).
async function getWallEntries() {
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
  return entries;
}

module.exports = { getWallEntries };
