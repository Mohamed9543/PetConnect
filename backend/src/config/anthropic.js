const Anthropic = require("@anthropic-ai/sdk");

// The assistant works without a key (falls back to the old rule-based canned
// replies — see assistantController.js), so this stays null instead of
// throwing at boot. Set ANTHROPIC_API_KEY in .env to enable natural,
// multilingual (incl. Tunisian Darija/Arabizi) replies.
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

module.exports = anthropic;
