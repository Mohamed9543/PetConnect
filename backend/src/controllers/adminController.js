const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Animal = require("../models/Animal");
const Report = require("../models/Report");
const Flag = require("../models/Flag");
const AdoptionRequest = require("../models/AdoptionRequest");

const getStats = asyncHandler(async (req, res) => {
  const [
    users,
    animals,
    adoptedAnimals,
    openReports,
    foundReports,
    associations,
    pendingFlags,
    totalLostFoundReports,
  ] = await Promise.all([
    User.countDocuments(),
    Animal.countDocuments(),
    Animal.countDocuments({ status: "adopted" }),
    Report.countDocuments({ status: { $in: ["active", "in_progress"] } }),
    Report.countDocuments({ type: "found", status: "resolved" }),
    User.countDocuments({ role: "association" }),
    Flag.countDocuments({ status: "pending" }),
    Report.countDocuments({ type: { $in: ["lost", "found"] } }),
  ]);

  const adoptionRate = animals > 0 ? Math.round((adoptedAnimals / animals) * 1000) / 10 : 0;
  const foundRate = totalLostFoundReports > 0 ? Math.round((foundReports / totalLostFoundReports) * 1000) / 10 : 0;

  res.json({
    users,
    animals,
    adoptedAnimals,
    openReports,
    foundReports,
    associations,
    pendingFlags,
    adoptionRate,
    foundRate,
  });
});

const RANGE_CONFIG = {
  today: { hours: 24, unit: "hour" },
  "7d": { hours: 24 * 7, unit: "day" },
  "30d": { hours: 24 * 30, unit: "day" },
  "3m": { hours: 24 * 90, unit: "week" },
  "1y": { hours: 24 * 365, unit: "month" },
};

async function bucketedCounts(Model, since, unit, extraMatch) {
  const rows = await Model.aggregate([
    { $match: { createdAt: { $gte: since }, ...extraMatch } },
    { $group: { _id: { $dateTrunc: { date: "$createdAt", unit } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((row) => ({ date: row._id, count: row.count }));
}

const getTimeseries = asyncHandler(async (req, res) => {
  const range = RANGE_CONFIG[req.query.range] ? req.query.range : "7d";
  const { hours, unit } = RANGE_CONFIG[range];
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const [users, animals, adoptions, reports] = await Promise.all([
    bucketedCounts(User, since, unit),
    bucketedCounts(Animal, since, unit),
    bucketedCounts(AdoptionRequest, since, unit, { status: "accepted" }),
    bucketedCounts(Report, since, unit),
  ]);

  res.json({ range, series: { users, animals, adoptions, reports } });
});

function buildPagination(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

const getUsers = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { organizationName: { $regex: search, $options: "i" } },
    ];
  }
  if (role) filter.role = role;
  if (status === "blocked") filter.isBlocked = true;
  if (status === "active") filter.isBlocked = false;
  if (status === "verified") filter.verified = true;
  if (status === "unverified") filter.verified = false;

  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ data, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

const getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }

  const [animals, reports, adoptionRequests] = await Promise.all([
    Animal.find({ owner: user._id }).sort({ createdAt: -1 }),
    Report.find({ user: user._id }).sort({ createdAt: -1 }),
    AdoptionRequest.find({ $or: [{ requester: user._id }, { owner: user._id }] })
      .populate("animal", "name type images")
      .sort({ createdAt: -1 }),
  ]);

  res.json({ user, animals, reports, adoptionRequests });
});

const getAnimalsAdmin = asyncHandler(async (req, res) => {
  const { search, type, status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { breed: { $regex: search, $options: "i" } },
      { "location.city": { $regex: search, $options: "i" } },
    ];
  }
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    Animal.find(filter).populate("owner", "firstName lastName email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Animal.countDocuments(filter),
  ]);

  res.json({ data, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

const getReportsAdmin = asyncHandler(async (req, res) => {
  const { search, type, status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};
  if (search) {
    filter.$or = [
      { animalName: { $regex: search, $options: "i" } },
      { reference: { $regex: search, $options: "i" } },
    ];
  }
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    Report.find(filter).populate("user", "firstName lastName email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Report.countDocuments(filter),
  ]);

  res.json({ data, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json(user);
});

const verifyAssociation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }
  if (user.role !== "association") {
    res.status(400);
    throw new Error("Seuls les comptes association peuvent être vérifiés");
  }
  user.verified = !user.verified;
  await user.save();
  res.json(user);
});

const deleteAnimalAdmin = asyncHandler(async (req, res) => {
  await Animal.findByIdAndDelete(req.params.id);
  res.json({ message: "Annonce supprimée" });
});

const resolveReport = asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: "resolved", $push: { statusHistory: { status: "resolved" } } },
    { new: true }
  );
  res.json(report);
});

module.exports = {
  getStats,
  getTimeseries,
  getUsers,
  getUserDetail,
  getAnimalsAdmin,
  getReportsAdmin,
  blockUser,
  verifyAssociation,
  deleteAnimalAdmin,
  resolveReport,
};
