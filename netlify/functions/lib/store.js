const { getStore } = require("@netlify/blobs");

function store(name) {
  // Netlify normally auto-injects Blobs credentials into functions. When that
  // context isn't present (seen on some deploy paths), fall back to explicit
  // manual configuration using a site ID + API token set as env vars.
  if (process.env.NETLIFY_BLOBS_SITE_ID && process.env.NETLIFY_BLOBS_TOKEN) {
    return getStore(name, {
      siteID: process.env.NETLIFY_BLOBS_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
    });
  }
  return getStore(name);
}

module.exports = { store };
