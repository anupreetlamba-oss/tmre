// Thin wrapper around Netlify's own REST API, used to read back Form
// submissions server-side (for the public wall tally and the Concierge's
// opted-in list). Reuses the site ID + PAT already saved as
// NETLIFY_BLOBS_SITE_ID / NETLIFY_BLOBS_TOKEN.
const API = "https://api.netlify.com/api/v1";

function creds() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (!siteID || !token) {
    throw new Error("NETLIFY_BLOBS_SITE_ID / NETLIFY_BLOBS_TOKEN are not set.");
  }
  return { siteID, token };
}

async function apiGet(path) {
  const { token } = creds();
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Netlify API ${path} -> ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function listForms() {
  const { siteID } = creds();
  return apiGet(`/sites/${siteID}/forms`);
}

async function getFormSubmissionsByName(formName) {
  const forms = await listForms();
  const form = forms.find((f) => f.name === formName);
  if (!form) return [];
  const submissions = await apiGet(`/forms/${form.id}/submissions`);
  return submissions;
}

async function submitForm(formName, fields) {
  const siteURL = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (!siteURL) throw new Error("No site URL available to submit a form to.");
  const body = new URLSearchParams({ "form-name": formName, ...fields }).toString();
  const res = await fetch(siteURL + "/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Form submit to ${formName} -> ${res.status}`);
  }
}

module.exports = { listForms, getFormSubmissionsByName, submitForm };
