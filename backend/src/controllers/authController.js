const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { uploadBuffer } = require("../utils/uploadToCloudinary");
const { generateOtp, hashOtp } = require("../utils/otp");
const { sendPasswordResetOtp } = require("../utils/email");
const { generatePasswordResetToken, verifyPasswordResetToken } = require("../utils/passwordResetToken");

const MAX_OTP_ATTEMPTS = 5;

const googleClientIds = [
  process.env.GOOGLE_WEB_CLIENT_ID,
  process.env.GOOGLE_IOS_CLIENT_ID,
  process.env.GOOGLE_ANDROID_CLIENT_ID,
].filter(Boolean);
const googleClient = new OAuth2Client();

function toAuthResponse(user) {
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar,
    city: user.city,
    role: user.role,
    organizationName: user.organizationName,
    verified: user.verified,
    token: generateToken(user._id),
  };
}

const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, city, role, organizationName, organizationDescription } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("Un compte existe déjà avec cet email");
  }

  let avatar = "";
  if (req.file) {
    avatar = await uploadBuffer(req.file.buffer, "petconnect/avatars");
  }

  const isAssociation = role === "association";

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    city,
    avatar,
    role: isAssociation ? "association" : "user",
    organizationName: isAssociation ? organizationName : undefined,
    organizationDescription: isAssociation ? organizationDescription : undefined,
  });

  res.status(201).json(toAuthResponse(user));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Email ou mot de passe incorrect");
  }
  if (user.isBlocked) {
    res.status(403);
    throw new Error("Compte bloqué");
  }

  res.json(toAuthResponse(user));
});

const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400);
    throw new Error("Jeton Google manquant");
  }
  if (googleClientIds.length === 0) {
    res.status(500);
    throw new Error("Connexion Google non configurée côté serveur");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: googleClientIds });
    payload = ticket.getPayload();
  } catch (error) {
    res.status(401);
    throw new Error("Jeton Google invalide");
  }

  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] }).select(
    "+password +googleId"
  );

  if (!user) {
    user = await User.create({
      firstName: payload.given_name || payload.name || "Utilisateur",
      lastName: payload.family_name || "",
      email: payload.email,
      // Google-only accounts never use this password (they always sign in via
      // Google), but the schema requires one — a random unusable value fills it.
      password: crypto.randomBytes(32).toString("hex"),
      avatar: payload.picture || "",
      googleId: payload.sub,
    });
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    await user.save();
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error("Compte bloqué");
  }

  res.json(toAuthResponse(user));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if (user) {
    const otp = generateOtp();
    user.passwordResetOtpHash = hashOtp(otp);
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetAttempts = 0;
    await user.save();
    await sendPasswordResetOtp(user.email, otp);
  }

  res.json({ message: "Si un compte existe avec cet email, un code de vérification a été envoyé." });
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email }).select(
    "+passwordResetOtpHash +passwordResetExpires +passwordResetAttempts"
  );

  const invalid = () => {
    res.status(400);
    throw new Error("Code invalide ou expiré. Redemandez un code.");
  };

  if (!user || !user.passwordResetOtpHash || !user.passwordResetExpires) invalid();
  if (user.passwordResetExpires < new Date()) invalid();
  if (user.passwordResetAttempts >= MAX_OTP_ATTEMPTS) invalid();

  if (user.passwordResetOtpHash !== hashOtp(otp)) {
    user.passwordResetAttempts += 1;
    await user.save();
    res.status(400);
    throw new Error("Code incorrect.");
  }

  user.passwordResetOtpHash = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetAttempts = 0;
  await user.save();

  res.json({ resetToken: generatePasswordResetToken(user._id) });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  let decoded;
  try {
    decoded = verifyPasswordResetToken(resetToken);
  } catch (error) {
    res.status(400);
    throw new Error("Ce lien de réinitialisation est invalide ou a expiré. Recommencez.");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Mot de passe mis à jour avec succès." });
});

module.exports = { register, login, getMe, googleAuth, forgotPassword, verifyResetOtp, resetPassword };
