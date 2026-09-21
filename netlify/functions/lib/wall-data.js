const { getFormSubmissionsByName } = require("./netlify-api");

// Public submissions + vote tally — shared by wall-list (public feed) and
// jury-standings (internal blended ranking).
async function getWallEntries() {
  const [submissions, votes] = await Promise.all([
    getFormSubmissionsByName("wall-submission"),
    getFormSubmissionsByName("wall-vote"),
  ]);

  // One vote per (voterId, targetId) pair, no matter how many times it's
  // submitted — closes the gap where the vote-disable state was purely
  // client-side and the server counted every submission unconditionally.
  const seenVotes = new Set();
  const voteCounts = {};
  for (const v of votes) {
    const targetId = v.data && v.data.targetId;
    const voterId = (v.data && v.data.voterId) || v.id; // fall back to submission id if voterId is missing
    if (!targetId) continue;
    const key = targetId + "::" + voterId;
    if (seenVotes.has(key)) continue;
    seenVotes.add(key);
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
