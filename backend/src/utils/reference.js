// Short, human-readable reference codes for reports (e.g. "PRD-7K2N4Q"),
// used so a user can quote/share a specific signalement without its Mongo _id.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

function generateReference(prefix) {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}-${code}`;
}

module.exports = { generateReference };
