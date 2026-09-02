const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    // Set only for accounts created/linked via "Continuer avec Google" — lets us
    // find the account on a later Google sign-in without relying on email alone.
    googleId: { type: String, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String, default: "" },
    city: { type: String, trim: true },
    role: { type: String, enum: ["user", "association", "admin"], default: "user" },
    rating: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    pushToken: { type: String, default: "" },

    // Shelter / association professional profile (role: "association" only).
    organizationName: { type: String, trim: true },
    organizationDescription: { type: String, trim: true },
    verified: { type: Boolean, default: false },

    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    notificationPreferences: {
      messages: { type: Boolean, default: true },
      matches: { type: Boolean, default: true },
      nearbyReports: { type: Boolean, default: true },
      adoptionUpdates: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
