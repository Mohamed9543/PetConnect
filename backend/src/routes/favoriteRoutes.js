const express = require("express");
const { protect } = require("../middleware/auth");
const { addFavorite, removeFavorite, getFavorites } = require("../controllers/favoriteController");

const router = express.Router();

router.get("/", protect, getFavorites);
router.post("/:animalId", protect, addFavorite);
router.delete("/:animalId", protect, removeFavorite);

module.exports = router;
