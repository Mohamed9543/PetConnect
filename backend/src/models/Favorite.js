const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    animal: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, animal: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
