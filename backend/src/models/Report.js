const mongoose = require("mongoose");

const REPORT_STATUSES = ["active", "in_progress", "found", "resolved"];

const reportSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    type: { type: String, enum: ["lost", "found"], required: true },
    animalName: { type: String, trim: true },
    animalType: { type: String, enum: ["dog", "cat", "other"], required: true },
    breed: { type: String, trim: true },
    color: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "unknown"], default: "unknown" },
    description: { type: String, trim: true },
    images: [{ type: String }],
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String },
    },
    date: { type: Date, required: true },
    contact: { type: String, required: true },
    status: { type: String, enum: REPORT_STATUSES, default: "active" },
    statusHistory: [
      {
        status: { type: String, enum: REPORT_STATUSES },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Placeholder for future image-recognition matching (see
    // routes/visionRoutes.js). No model is integrated yet — this field is
    // never populated today and matching.js does not read it.
    imageAnalysis: {
      status: { type: String, enum: ["not_available", "pending", "done"], default: "not_available" },
      tags: [{ type: String }],
      processedAt: { type: Date },
    },
  },
  { timestamps: true }
);

reportSchema.index({ "location.latitude": 1, "location.longitude": 1 });

reportSchema.statics.STATUSES = REPORT_STATUSES;

module.exports = mongoose.model("Report", reportSchema);
