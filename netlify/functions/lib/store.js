const { getStore } = require("@netlify/blobs");

function store(name) {
  return getStore(name);
}

module.exports = { store };
