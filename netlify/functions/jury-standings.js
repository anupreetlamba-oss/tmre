// Internal-only: blends jury scores (originality + evidence, 50%) with the
// public vote (50%) into the ranking that gets announced live at TMRE.
// Not linked from the public site — reachable only by whoever has the URL.
const { getFormSubmissionsByName } = require("./lib/netlify-api");
const { getWallEntries } = require("./lib/wall-data");

exports.handler = async function () {
  try {
    const [entries, scoreSubmissions] = await Promise.all([
      getWallEntries(),
      getFormSubmissionsByName("jury-score"),
    ]);

    // Keep only each judge's latest score per entry (a re-score overwrites,
    // it doesn't average with their own earlier attempt).
    const latestByJudgeAndEntry = new Map();
    for (const s of scoreSubmissions) {
      const d = s.data || {};
      if (!d.submissionId || !d.judgeName) continue;
      const key = d.submissionId + "::" + d.judgeName.trim().toLowerCase();
      const prev = latestByJudgeAndEntry.get(key);
      if (!prev || new Date(s.created_at) > new Date(prev.created_at)) {
        latestByJudgeAndEntry.set(key, {
          submissionId: d.submissionId,
          judgeName: d.judgeName,
          originality: Number(d.originality) || 0,
          evidence: Number(d.evidence) || 0,
          created_at: s.created_at,
        });
      }
    }

    const scoresByEntry = {};
    for (const rec of latestByJudgeAndEntry.values()) {
      if (!scoresByEntry[rec.submissionId]) scoresByEntry[rec.submissionId] = [];
      scoresByEntry[rec.submissionId].push(rec);
    }

    const maxVotes = Math.max(1, ...entries.map((e) => e.votes));

    const standings = entries.map((e) => {
      const judgeScores = scoresByEntry[e.id] || [];
      const juryAvgOutOf10 = judgeScores.length
        ? judgeScores.reduce((sum, r) => sum + r.originality + r.evidence, 0) / judgeScores.length
        : null;
      const juryScore100 = juryAvgOutOf10 === null ? null : (juryAvgOutOf10 / 10) * 100;
      const publicScore100 = (e.votes / maxVotes) * 100;
      const blended =
        juryScore100 === null
          ? null // no jury score yet -> can't compute a real blended rank
          : 0.5 * juryScore100 + 0.5 * publicScore100;

      return {
        id: e.id,
        obvious: e.obvious,
        signal: e.signal,
        who: e.who,
        votes: e.votes,
        judgeCount: judgeScores.length,
        judges: judgeScores.map((r) => ({
          judgeName: r.judgeName,
          originality: r.originality,
          evidence: r.evidence,
        })),
        juryScore100: juryScore100 === null ? null : Math.round(juryScore100 * 10) / 10,
        publicScore100: Math.round(publicScore100 * 10) / 10,
        blended: blended === null ? null : Math.round(blended * 10) / 10,
      };
    });

    standings.sort((a, b) => {
      if (a.blended === null && b.blended === null) return b.votes - a.votes;
      if (a.blended === null) return 1;
      if (b.blended === null) return -1;
      return b.blended - a.blended;
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ ok: true, standings }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
