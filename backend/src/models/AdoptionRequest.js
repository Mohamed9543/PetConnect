const mongoose = require("mongoose");

const adoptionRequestSchema = new mongoose.Schema(
  {
    animal: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Belt-and-braces alongside the controller's pre-check: a partial unique
// index so a double-click / race condition can't create two live requests
// for the same animal by the same requester. Only applies while a request
// is pending/accepted — a rejected request doesn't block trying again.
adoptionRequestSchema.index(
  { animal: 1, requester: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "accepted"] } } }
);

module.exports = mongoose.model("AdoptionRequest", adoptionRequestSchema);
