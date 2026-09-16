// Escapes regex metacharacters so user-supplied search terms can be used
// safely in a $regex filter without enabling ReDoS or unintended patterns.
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Keeps only values from the given schema enum, dropping anything else
// (e.g. an attacker sending arbitrary strings into a $regex-free field).
function whitelist(value, allowed) {
  return allowed.includes(value) ? value : undefined;
}

module.exports = { escapeRegex, whitelist };
