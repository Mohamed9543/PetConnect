const asyncHandler = require("express-async-handler");
const Favorite = require("../models/Favorite");

const addFavorite = asyncHandler(async (req, res) => {
  const { animalId } = req.params;
  const existing = await Favorite.findOne({ user: req.user._id, animal: animalId });
  if (existing) {
    return res.status(200).json(existing);
  }
  const favorite = await Favorite.create({ user: req.user._id, animal: animalId });
  res.status(201).json(favorite);
});

const removeFavorite = asyncHandler(async (req, res) => {
  const { animalId } = req.params;
  await Favorite.findOneAndDelete({ user: req.user._id, animal: animalId });
  res.json({ message: "Retiré des favoris" });
});

const getFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id }).populate({
    path: "animal",
    populate: { path: "owner", select: "firstName lastName avatar rating" },
  });
  res.json(favorites.map((favorite) => favorite.animal));
});

module.exports = { addFavorite, removeFavorite, getFavorites };
