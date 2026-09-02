const { distanceKm } = require("./geo");

// Rule-based similarity score between a "lost" and a "found" report, 0-100.
// This is deliberately simple and explainable (no ML) — see PetConnect AI
// Assistant notes for where a real vision model would slot in later.
function scoreMatch(a, b) {
  if (a.animalType !== b.animalType) return 0;

  let score = 35; // baseline: same species within the search radius

  if (a.breed && b.breed && a.breed.trim().toLowerCase() === b.breed.trim().toLowerCase()) {
    score += 20;
  }
  if (a.color && b.color && a.color.trim().toLowerCase() === b.color.trim().toLowerCase()) {
    score += 15;
  }
  if (a.gender && b.gender && a.gender !== "unknown" && b.gender !== "unknown" && a.gender === b.gender) {
    score += 10;
  }

  const km = distanceKm(a.location.latitude, a.location.longitude, b.location.latitude, b.location.longitude);
  if (km <= 1) score += 15;
  else if (km <= 5) score += 10;
  else if (km <= 15) score += 5;
  else if (km > 40) score -= 15;

  const daysApart = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / (1000 * 60 * 60 * 24);
  if (daysApart <= 2) score += 5;
  else if (daysApart > 30) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Finds candidate reports of the opposite type ("lost" <-> "found") for a
// given report, scored and sorted, above a minimum relevance threshold.
async function findMatches(Report, report, { minScore = 40, limit = 10 } = {}) {
  const oppositeType = report.type === "lost" ? "found" : "lost";
  const candidates = await Report.find({
    type: oppositeType,
    animalType: report.animalType,
    status: { $in: ["active", "in_progress"] },
  }).populate("user", "firstName lastName avatar");

  return candidates
    .map((candidate) => ({ report: candidate, score: scoreMatch(report, candidate) }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { scoreMatch, findMatches };
