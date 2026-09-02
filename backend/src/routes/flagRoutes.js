const express = require("express");
const { protect, admin } = require("../middleware/auth");
const { createFlag, getFlags, updateFlagStatus } = require("../controllers/flagController");

const router = express.Router();

router.post("/", protect, createFlag);
router.get("/", protect, admin, getFlags);
router.put("/:id", protect, admin, updateFlagStatus);

module.exports = router;
