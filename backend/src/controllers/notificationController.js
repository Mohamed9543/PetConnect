const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const User = require("../models/User");

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json(notifications);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error("Notification introuvable");
  }
  res.json(notification);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: "Notifications marquées comme lues" });
});

const getPreferences = asyncHandler(async (req, res) => {
  res.json(req.user.notificationPreferences);
});

const updatePreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { messages, matches, nearbyReports, adoptionUpdates } = req.body;
  if (messages !== undefined) user.notificationPreferences.messages = messages;
  if (matches !== undefined) user.notificationPreferences.matches = matches;
  if (nearbyReports !== undefined) user.notificationPreferences.nearbyReports = nearbyReports;
  if (adoptionUpdates !== undefined) user.notificationPreferences.adoptionUpdates = adoptionUpdates;
  await user.save();
  res.json(user.notificationPreferences);
});

module.exports = { getNotifications, markAsRead, markAllAsRead, getPreferences, updatePreferences };
