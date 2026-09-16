const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { uploadBuffer } = require("../utils/uploadToCloudinary");

// Public-safe profile fields only — never phone/email/pushToken/role/
// blockedUsers, which the full document otherwise carries.
const PUBLIC_PROFILE_FIELDS =
  "firstName lastName avatar rating role verified organizationName organizationDescription createdAt";

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(PUBLIC_PROFILE_FIELDS);
  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }
  res.json(user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, city, pushToken, organizationName, organizationDescription } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;
  if (city) user.city = city;
  if (pushToken) user.pushToken = pushToken;

  if (user.role === "association") {
    if (organizationName !== undefined) user.organizationName = organizationName;
    if (organizationDescription !== undefined) user.organizationDescription = organizationDescription;
  }

  if (req.file) {
    user.avatar = await uploadBuffer(req.file.buffer, "petconnect/avatars");
  }

  await user.save();
  res.json(user);
});

const toggleBlockUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user._id.toString()) {
    res.status(400);
    throw new Error("Vous ne pouvez pas vous bloquer vous-même");
  }

  const targetExists = await User.exists({ _id: targetId });
  if (!targetExists) {
    res.status(404);
    throw new Error("Utilisateur introuvable");
  }

  const user = await User.findById(req.user._id);
  const alreadyBlocked = user.blockedUsers.some((id) => id.toString() === targetId);

  if (alreadyBlocked) {
    user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== targetId);
  } else {
    user.blockedUsers.push(targetId);
  }

  await user.save();
  res.json({ blocked: !alreadyBlocked });
});

const getBlockedUsers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("blockedUsers", "firstName lastName avatar");
  res.json(user.blockedUsers);
});

module.exports = { getUserById, updateProfile, toggleBlockUser, getBlockedUsers };
