const Notification = require("../models/Notification");
const User = require("../models/User");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const PREFERENCE_BY_TYPE = {
  message: "messages",
  match: "matches",
  nearby_report: "nearbyReports",
  adoption_status: "adoptionUpdates",
  listing_status: "adoptionUpdates",
};

async function sendExpoPush(pushToken, title, body, data) {
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;
  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: pushToken, title, body, data, sound: "default" }),
    });
  } catch (error) {
    console.error("Expo push failed:", error.message);
  }
}

// Persists an in-app notification and best-effort fires a push notification,
// respecting the recipient's notification preferences for that type.
async function notifyUser(userId, { type, title, body, data = {} }) {
  const user = await User.findById(userId).select("pushToken notificationPreferences");
  if (!user) return null;

  const preferenceKey = PREFERENCE_BY_TYPE[type];
  const allowed = !preferenceKey || user.notificationPreferences?.[preferenceKey] !== false;
  if (!allowed) return null;

  const notification = await Notification.create({ user: userId, type, title, body, data });
  sendExpoPush(user.pushToken, title, body, data);
  return notification;
}

module.exports = { notifyUser, sendExpoPush };
