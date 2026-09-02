const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "message",
  "match",
  "nearby_report",
  "adoption_status",
  "listing_status",
  "reminder",
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.statics.TYPES = NOTIFICATION_TYPES;

module.exports = mongoose.model("Notification", notificationSchema);
