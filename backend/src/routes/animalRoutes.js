const express = require("express");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { createAnimalValidator } = require("../validators/animalValidators");
const {
  getAnimals,
  getMyAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  removeAnimalImage,
  deleteAnimal,
} = require("../controllers/animalController");

const router = express.Router();

router.get("/", getAnimals);
router.get("/mine", protect, getMyAnimals);
router.get("/:id", getAnimalById);
router.post("/", protect, upload.array("images", 6), createAnimalValidator, validate, createAnimal);
router.put("/:id", protect, upload.array("images", 6), updateAnimal);
router.put("/:id/remove-image", protect, removeAnimalImage);
router.delete("/:id", protect, deleteAnimal);

module.exports = router;
