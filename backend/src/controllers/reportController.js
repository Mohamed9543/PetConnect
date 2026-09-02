const asyncHandler = require("express-async-handler");
const Report = require("../models/Report");
const { uploadImages } = require("../utils/uploadToCloudinary");
const { generateReference } = require("../utils/reference");
const { distanceKm, toPublicReport } = require("../utils/geo");
const { findMatches } = require("../utils/matching");
const { notifyUser } = require("../utils/notify");

function applyDistanceFilter(reports, query) {
  const { lat, lng, radiusKm } = query;
  if (!lat || !lng || !radiusKm) return reports;
  const originLat = Number(lat);
  const originLng = Number(lng);
  const radius = Number(radiusKm);
  return reports.filter(
    (report) => distanceKm(originLat, originLng, report.location.latitude, report.location.longitude) <= radius
  );
}

const getReports = asyncHandler(async (req, res) => {
  const { type, animalType, status } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (animalType) filter.animalType = animalType;
  filter.status = status || { $in: ["active", "in_progress"] };

  const reports = await Report.find(filter).populate("user", "firstName lastName avatar phone").sort({ createdAt: -1 });
  const filtered = applyDistanceFilter(reports, req.query);
  res.json(filtered.map((report) => toPublicReport(report, req.user?._id)));
});

const getLostReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ type: "lost", status: { $in: ["active", "in_progress"] } })
    .populate("user", "firstName lastName avatar phone")
    .sort({ createdAt: -1 });
  const filtered = applyDistanceFilter(reports, req.query);
  res.json(filtered.map((report) => toPublicReport(report, req.user?._id)));
});

const getFoundReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ type: "found", status: { $in: ["active", "in_progress"] } })
    .populate("user", "firstName lastName avatar phone")
    .sort({ createdAt: -1 });
  const filtered = applyDistanceFilter(reports, req.query);
  res.json(filtered.map((report) => toPublicReport(report, req.user?._id)));
});

const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(reports);
});

const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate("user", "firstName lastName avatar phone");
  if (!report) {
    res.status(404);
    throw new Error("Signalement introuvable");
  }
  res.json(toPublicReport(report, req.user?._id));
});

const getReportMatches = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error("Signalement introuvable");
  }
  const matches = await findMatches(Report, report);
  res.json(
    matches.map(({ report: candidate, score }) => ({
      score,
      report: toPublicReport(candidate, req.user?._id),
    }))
  );
});

const createReport = asyncHandler(async (req, res) => {
  const { type, animalName, animalType, breed, color, gender, description, latitude, longitude, address, date, contact } = req.body;

  const images = await uploadImages(req.files, "petconnect/reports");

  const report = await Report.create({
    reference: generateReference(type === "lost" ? "PRD" : "TRV"),
    type,
    animalName,
    animalType,
    breed,
    color,
    gender,
    description,
    images,
    location: { latitude, longitude, address },
    date,
    contact,
    user: req.user._id,
    statusHistory: [{ status: "active" }],
  });

  res.status(201).json(report);

  // Proximity alert: tell both sides about a promising lost/found match.
  // Runs after the response is sent — a slow or failed match/notify pass
  // should never delay or break report creation for the reporting user.
  try {
    const matches = await findMatches(Report, report, { minScore: 55, limit: 5 });
    for (const { report: candidate, score } of matches) {
      const kind = report.type === "lost" ? "un animal trouvé" : "un animal perdu";
      await notifyUser(report.user, {
        type: "match",
        title: "Correspondance potentielle 🐾",
        body: `${kind.charAt(0).toUpperCase() + kind.slice(1)} pourrait correspondre à votre signalement (${score}% de pertinence).`,
        data: { reportId: report._id.toString(), matchId: candidate._id.toString(), score },
      });
      await notifyUser(candidate.user, {
        type: "match",
        title: "Correspondance potentielle 🐾",
        body: `Un nouveau signalement pourrait correspondre à celui que vous avez publié (${score}% de pertinence).`,
        data: { reportId: candidate._id.toString(), matchId: report._id.toString(), score },
      });
    }
  } catch (error) {
    console.error("Matching/notify pass failed:", error.message);
  }
});

const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error("Signalement introuvable");
  }
  if (report.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Action non autorisée");
  }

  const fields = ["animalName", "animalType", "breed", "color", "gender", "description", "date", "contact"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) report[field] = req.body[field];
  });

  if (req.body.status && req.body.status !== report.status) {
    if (!Report.STATUSES.includes(req.body.status)) {
      res.status(400);
      throw new Error("Statut invalide");
    }
    report.status = req.body.status;
    report.statusHistory.push({ status: req.body.status });
  }

  await report.save();
  res.json(report);
});

const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error("Signalement introuvable");
  }
  if (report.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Action non autorisée");
  }
  await report.deleteOne();
  res.json({ message: "Signalement supprimé" });
});

module.exports = {
  getReports,
  getLostReports,
  getFoundReports,
  getMyReports,
  getReportById,
  getReportMatches,
  createReport,
  updateReport,
  deleteReport,
};
