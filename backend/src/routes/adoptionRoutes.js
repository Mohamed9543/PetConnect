const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createAdoptionRequest,
  getMyAdoptionRequests,
  updateAdoptionRequest,
} = require("../controllers/adoptionController");

const router = express.Router();

router.post("/", protect, createAdoptionRequest);
router.get("/my", protect, getMyAdoptionRequests);
router.put("/:id", protect, updateAdoptionRequest);

module.exports = router;
