// Lightweight, local (non-LLM) helpers used to pull real search filters
// (species/city/intent) out of a message written in French, English, Arabic,
// Tunisian Darija, or Arabizi — *before* we ever call the LLM. This keeps the
// actual database search deterministic and fast (no API call needed just to
// know "the user is talking about cats"), while the LLM is reserved for what
// it's actually good at: understanding free-form phrasing and writing a
// natural reply. See assistantController.js for how the two fit together.
//
// Keyword lists deliberately list BOTH the Arabizi-digit spelling (9, 7, 5,
// 8, 3 used as letters — "n7eb", "9attous") and a Latin-letter respelling
// ("nheb", "qattous"), since Darija has no fixed orthography and either is
// common. Matching is substring-based, not exact-word, to tolerate the
// endless minor spelling variants (chnowa/chnoa/chnia/chneya...).

function normalizeText(raw) {
  return (raw || "").toLowerCase().trim().replace(/\s+/g, " ");
}

const SPECIES_KEYWORDS = {
  dog: [
    "chien", "chiot", "dog", "puppy",
    "كلب", "كلاب", "جرو", "كلبة",
    "kelb", "kalb", "klib", "jrou", "jarw",
  ],
  cat: [
    "chat", "chaton", "cat", "kitten",
    "قط", "قطوس", "قطة", "قطوسة", "هرة",
    "9attous", "9atous", "qattous", "gattous", "gatous", "herra",
  ],
};

const CITY_HINTS = [
  "tunis", "ariana", "sfax", "sousse", "bizerte", "gabes", "gabès", "kairouan", "nabeul",
  "monastir", "gafsa", "medenine", "médenine", "tozeur", "mahdia", "kef", "siliana",
  "ben arous", "béja", "beja", "jendouba", "kasserine", "sidi bouzid", "tataouine",
  "zaghouan", "kebili", "marsa", "la marsa", "carthage", "manouba", "goulette", "la goulette",
  "تونس", "أريانة", "اريانة", "صفاقس", "سوسة", "بنزرت", "قابس", "القيروان", "نابل",
  "المنستير", "قفصة", "مدنين", "توزر", "المهدية", "الكاف", "سليانة", "بن عروس",
  "باجة", "جندوبة", "القصرين", "سيدي بوزيد", "تطاوين", "زغوان", "قبلي", "المرسى",
  "قرطاج", "منوبة", "حلق الوادي",
];

// Each intent maps to a bag of keywords across every language/register we
// need to recognize. A message can legitimately match more than one intent
// (e.g. a message that's both about a dog and about reporting it) — callers
// decide priority.
const INTENT_KEYWORDS = {
  adoption_search: [
    "adopt", "tebni", "tabni", "tbanni", "tbanna", "tbena", "netbanna", "netbena", "natbanna", "ntabena",
    "n7eb net", "nheb net",
    "تبني", "نتبنى", "أتبنى", "لتبني", "للتبني", "تبنّي",
  ],
  lost_pet: [
    "perdu", "disparu", "lost", "mef9oud", "mefkoud", "mefqoud", "mfa9ad", "mche", "ma3adech", "madech",
    "ضاع", "ضايع", "مفقود", "مشى", "ماعادش",
  ],
  found_pet: [
    "trouvé", "trouve", "found", "l9it", "l9itou", "lqit", "lgit", "chera3", "chera'", "fi chera3", "fel chera3",
    "لقيت", "لقاي", "لقاه", "في الشارع",
  ],
  report_animal: [
    "signalement", "signaler", "report", "sajel", "sajlou", "nsajel", "nsajlou", "n3amel signalement",
    "namel signalement", "n3mel signalement",
    "بلغ", "أبلغ", "نبلغ", "تسجيل", "نسجل",
  ],
  contact_owner: [
    "contacter", "contact le", "contact owner", "n7ki m3a", "nheb nehki", "n7eb ne7ki", "nehki m3a",
    "أحكي مع", "نحكي مع", "صاحب الحيوان", "مالك الحيوان",
  ],
  messaging: [
    "message", "messagerie", "msg", "nbaath", "nab3ath", "n3ath", "nbeat", "n7eb nab3ath", "nheb nab3ath",
    "رسالة", "أبعث رسالة", "نبعث",
  ],
  location: [
    "carte", "map", "près de", "proche", "9rib", "qrib", "9rib menni", "9rib mni", "qrib menni", "hdaya",
    "قريب", "حدايا", "خريطة",
  ],
  favorites: ["favoris", "favorite", "favorites", "fav", "المفضلة", "مفضلة"],
  animal_details: ["détails", "details", "معلومات عن", "تفاصيل"],
};

function detectSpecies(text) {
  for (const [species, keywords] of Object.entries(SPECIES_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return species;
  }
  return null;
}

function detectCity(text) {
  return CITY_HINTS.find((city) => text.includes(city)) || null;
}

function detectNearMe(text) {
  return /(9rib|qrib)\s*(menni|mni|meni)?|hdaya|حدايا|قريب مني|قريب لي|près de moi|near me/.test(text);
}

// Returns every intent whose keywords appear in the (already-normalized)
// text. Order follows INTENT_KEYWORDS declaration order.
function detectIntents(text) {
  return Object.entries(INTENT_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => text.includes(k)))
    .map(([intent]) => intent);
}

module.exports = {
  normalizeText,
  detectSpecies,
  detectCity,
  detectNearMe,
  detectIntents,
};
