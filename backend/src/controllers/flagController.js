const asyncHandler = require("express-async-handler");
const Flag = require("../models/Flag");

const createFlag = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason } = req.body;
  if (!targetType || !targetId || !reason?.trim()) {
    res.status(400);
    throw new Error("Merci de préciser le motif du signalement");
  }

  const flag = await Flag.create({
    reporter: req.user._id,
    targetType,
    targetId,
    reason: reason.trim(),
  });

  res.status(201).json(flag);
});

const getFlags = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const flags = await Flag.find(filter).populate("reporter", "firstName lastName avatar").sort({ createdAt: -1 });
  res.json(flags);
});

const updateFlagStatus = asyncHandler(async (req, res) => {
  const flag = await Flag.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!flag) {
    res.status(404);
    throw new Error("Signalement introuvable");
  }
  res.json(flag);
});

module.exports = { createFlag, getFlags, updateFlagStatus };
