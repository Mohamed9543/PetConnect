const asyncHandler = require("express-async-handler");
const Animal = require("../models/Animal");
const Report = require("../models/Report");
const { toPublicReport, fuzzCoordinates } = require("../utils/geo");
const { normalizeText, detectSpecies, detectCity, detectNearMe, detectIntents } = require("../utils/darija");
const { SYSTEM_PROMPT } = require("../utils/assistantPrompt");
const anthropic = require("../config/anthropic");

// The assistant runs a two-stage pipeline:
//
//   1. Local, deterministic pass (utils/darija.js): pull species/city/intent
//      out of the message (French, English, Arabic, Darija, Arabizi all
//      handled via loose multilingual keyword matching) and run a REAL
//      MongoDB search against Animal/Report — never guesses at data.
//   2. LLM pass (if ANTHROPIC_API_KEY is set): a single call that gets the
//      system prompt, the recent conversation, and the exact real results
//      from step 1, and writes a short, natural reply in whatever
//      language/dialect the user used — grounded only in that data.
//
// Without an API key, step 2 is skipped and the original rule-based canned
// replies (French only) are used instead, so nothing regresses if the key
// isn't configured yet.

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
const MAX_HISTORY_MESSAGES = 6;

function sanitizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .filter((entry) => entry && (entry.role === "user" || entry.role === "assistant") && typeof entry.text === "string")
    .slice(-MAX_HISTORY_MESSAGES)
    .map((entry) => ({ role: entry.role, content: entry.text.slice(0, 1000) }));
}

async function searchLostOrFound({ type, species, city, req }) {
  const filter = { status: { $in: ["active", "in_progress"] }, type };
  if (species) filter.animalType = species;

  let reports = await Report.find(filter).populate("user", "firstName lastName avatar").sort({ createdAt: -1 }).limit(20);
  if (city) {
    reports = reports.filter((r) => (r.location.address || "").toLowerCase().includes(city));
  }
  return reports.slice(0, 5).map((r) => toPublicReport(r, req.user?._id));
}

async function searchAdoption({ species, city }) {
  const filter = { status: "available" };
  if (species) filter.type = species;

  let animals = await Animal.find(filter).populate("owner", "firstName lastName avatar").sort({ createdAt: -1 }).limit(20);
  if (city) {
    animals = animals.filter((a) => (a.location?.city || "").toLowerCase().includes(city));
  }
  return animals.slice(0, 5).map((a) => {
    const obj = a.toObject();
    if (obj.location?.latitude) Object.assign(obj.location, fuzzCoordinates(obj.location.latitude, obj.location.longitude));
    return obj;
  });
}

// Compact, LLM-friendly summary of the real results — this (and nothing
// else) is what the model is allowed to talk about as fact.
function toDataBlock({ intent, species, city, nearMe, results }) {
  return {
    intentDetected: intent || null,
    speciesFilter: species || null,
    cityFilter: city || null,
    nearMeRequested: nearMe,
    resultCount: results.length,
    results: results.map((r) => ({
      id: r._id,
      kind: r.reference ? "report" : "animal",
      name: r.name || r.animalName || null,
      species: r.type || r.animalType || null,
      breed: r.breed || null,
      city: r.location?.city || r.location?.address || null,
      status: r.status || null,
      reference: r.reference || null,
    })),
  };
}

async function generateLlmReply({ question, history, dataBlock }) {
  const system = `${SYSTEM_PROMPT}\n\nDONNÉES RÉELLES DISPONIBLES (JSON — seule source de vérité, ne rien inventer au-delà) :\n${JSON.stringify(dataBlock)}`;

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 400,
    system,
    messages: [...history, { role: "user", content: question }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text?.trim() || null;
}

// Original French-only canned replies — kept as-is as the fallback path when
// no LLM is configured or the LLM call fails, so behavior never regresses.
function fallbackReply({ intent, species, city, results }) {
  if (intent === "found_pet_advice") {
    return {
      kind: "suggestion",
      message:
        "💡 Conseil général (pas une donnée réelle) :\n\n" +
        "1. Mettez l'animal en sécurité, sans le forcer si vous ne le connaissez pas.\n" +
        "2. Prenez des photos claires (visage, corps, signes distinctifs).\n" +
        "3. Publiez un signalement \"Animal trouvé\" dans l'app avec la localisation précise.\n" +
        "4. Consultez la carte et les signalements \"Animal perdu\" à proximité pour une correspondance rapide.\n" +
        "5. Si l'animal porte un collier/tatouage, contactez un vétérinaire pour vérifier une puce d'identification.",
    };
  }

  if (intent === "lost_pet" || intent === "found_pet") {
    const label = intent === "lost_pet" ? "perdu" : "trouvé";
    return {
      kind: "data",
      message:
        results.length > 0
          ? `📋 ${results.length} résultat(s) réel(s) trouvé(s) dans les signalements "${label}"${
              species ? ` (${species === "dog" ? "chiens" : "chats"})` : ""
            }${city ? ` près de ${city}` : ""} :`
          : `Aucun signalement réel ne correspond pour l'instant${species ? ` pour cette espèce` : ""}${city ? ` près de ${city}` : ""}. Consultez la carte pour élargir la recherche.`,
      results,
    };
  }

  if (intent === "adoption_search") {
    return {
      kind: "data",
      message:
        results.length > 0
          ? `📋 ${results.length} animal(aux) réel(s) disponible(s) à l'adoption${
              species ? ` (${species === "dog" ? "chiens" : "chats"})` : ""
            }${city ? ` près de ${city}` : ""} :`
          : `Aucun animal réel à adopter ne correspond pour l'instant${city ? ` près de ${city}` : ""}. Réessayez plus tard ou élargissez votre recherche dans l'onglet Adoption.`,
      results,
    };
  }

  return {
    kind: "unknown",
    message:
      "💡 Je peux vous aider avec deux choses pour l'instant :\n\n" +
      "• Chercher de vrais signalements (« Y a-t-il des chiens perdus à Tunis ? »)\n" +
      "• Chercher de vrais animaux à adopter (« Je cherche un chat à adopter à Sfax »)\n\n" +
      "Pour tout le reste, utilisez la recherche, la carte ou les filtres de l'application.",
  };
}

const ask = asyncHandler(async (req, res) => {
  const question = (req.body.question || "").trim();
  if (!question) {
    res.status(400);
    throw new Error("Merci de poser une question.");
  }

  const normalized = normalizeText(question);
  const species = detectSpecies(normalized);
  const city = detectCity(normalized);
  const nearMe = detectNearMe(normalized);
  const intents = detectIntents(normalized);
  const asksWhatToDo = /(que|quoi).{0,15}faire|comment faire|what (should|to) do|kifeh na3mel|شنوة نعمل|كيفاش نعمل/.test(normalized);

  let intent = null;
  let results = [];

  if (intents.includes("found_pet") && asksWhatToDo && !species && !city) {
    intent = "found_pet_advice";
  } else if (intents.includes("lost_pet")) {
    intent = "lost_pet";
    results = await searchLostOrFound({ type: "lost", species, city, req });
  } else if (intents.includes("found_pet")) {
    intent = "found_pet";
    results = await searchLostOrFound({ type: "found", species, city, req });
  } else if (intents.includes("adoption_search") || (species && !intents.length)) {
    intent = "adoption_search";
    results = await searchAdoption({ species, city });
  } else if (intents.length > 0) {
    // report_animal / contact_owner / messaging / location / favorites /
    // animal_details — no real search needed, the LLM (or fallback) just
    // gives procedural guidance for these.
    intent = intents[0];
  }

  const dataBlock = toDataBlock({ intent, species, city, nearMe, results });
  const fallback = fallbackReply({ intent, species, city, results });

  if (!anthropic) {
    return res.json(fallback);
  }

  try {
    const history = sanitizeHistory(req.body.history);
    const message = await generateLlmReply({ question, history, dataBlock });
    if (!message) throw new Error("Empty LLM response");
    return res.json({ kind: fallback.kind, message, results });
  } catch (error) {
    console.error("Assistant LLM call failed, using fallback reply:", error.message);
    return res.json(fallback);
  }
});

module.exports = { ask };
