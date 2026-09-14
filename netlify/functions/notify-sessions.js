// Runs every 5 minutes (see netlify.toml). Checks the live TMRE agenda against
// the current time and, for each session that just started or just ended,
// emails everyone who opted into that track via the Session Concierge form.
//
// Timezone note: TMRE 2026 runs Oct 5-7 in Denver, which is Mountain Daylight
// Time (UTC-6) during that window (DST doesn't end until early November).
// Session times in sessions.json are Denver wall-clock times, so we convert
// by adding 6 hours to get UTC.

const { store } = require("./lib/store");
const { sendMail } = require("./lib/mailer");
const sessions = require("./data/sessions.json");

const DENVER_OFFSET_HOURS = 6; // MDT = UTC-6
const WINDOW_MINUTES = 5; // matches the cron cadence

function parseDenverTimeToUTC(dateStr, timeStr) {
  // dateStr: "2026-10-05", timeStr: "10:10am"
  const m = /^(\d+):(\d+)\s*(am|pm)$/i.exec(timeStr.trim());
  if (!m) return null;
  let [, h, min, ap] = m;
  h = parseInt(h, 10);
  min = parseInt(min, 10);
  if (/pm/i.test(ap) && h !== 12) h += 12;
  if (/am/i.test(ap) && h === 12) h = 0;
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h + DENVER_OFFSET_HOURS, min));
}

function inWindow(target, now) {
  if (!target) return false;
  const diffMin = (now - target) / 60000;
  return diffMin >= 0 && diffMin < WINDOW_MINUTES;
}

async function getOptedInEmails(track) {
  const optins = store("optins");
  const { blobs } = await optins.list();
  const docs = await Promise.all(blobs.map((b) => optins.get(b.key, { type: "json" })));
  return docs.filter(Boolean).filter((d) => (d.tracks || []).includes(track));
}

async function alreadyNotified(key) {
  const notified = store("notified");
  const v = await notified.get(key);
  return !!v;
}

async function markNotified(key) {
  const notified = store("notified");
  await notified.set(key, "1");
}

exports.handler = async function () {
  const now = new Date();
  const results = [];

  for (const s of sessions) {
    if (!s.track) continue; // skip registration/breakfast/etc with no track
    const startUTC = parseDenverTimeToUTC(s.date, s.start);
    const endUTC = parseDenverTimeToUTC(s.date, s.end);

    const startKey = `${s.id}_start`;
    const endKey = `${s.id}_end`;

    if (inWindow(startUTC, now) && !(await alreadyNotified(startKey))) {
      const people = await getOptedInEmails(s.track);
      const speakerNames = (s.speakers || []).map((p) => p.name).join(", ");
      for (const p of people) {
        await sendMail({
          to: p.email,
          subject: `Starting now: ${s.title}`,
          text: `${s.title} is starting now.${speakerNames ? `\nSpeaker(s): ${speakerNames}` : ""}\nTrack: ${s.track}\n\nSee you there!`,
        });
      }
      await markNotified(startKey);
      results.push({ session: s.title, type: "start", notified: people.length });
    }

    if (inWindow(endUTC, now) && !(await alreadyNotified(endKey))) {
      const people = await getOptedInEmails(s.track);
      for (const p of people) {
        await sendMail({
          to: p.email,
          subject: `Highlight: ${s.title}`,
          text: `${s.title} just wrapped.\n\nTrack: ${s.track}\n\n(A fuller takeaway will land here once a real note-taker/transcript feed is wired in — for now this confirms the session ended.)`,
        });
      }
      await markNotified(endKey);
      results.push({ session: s.title, type: "end", notified: people.length });
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, checkedAt: now.toISOString(), fired: results }),
  };
};
