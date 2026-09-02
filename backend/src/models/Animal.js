const mongoose = require("mongoose");

const animalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["dog", "cat", "other"], required: true },
    breed: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    age: { type: Number, required: true },
    ageCategory: { type: String, enum: ["baby", "young", "adult"], required: true },
    color: { type: String, trim: true },
    description: { type: String, trim: true },
    images: [{ type: String }],
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      city: { type: String },
    },
    vaccinated: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["available", "pending", "adopted"],
      default: "available",
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

animalSchema.index({ "location.latitude": 1, "location.longitude": 1 });

module.exports = mongoose.model("Animal", animalSchema);
