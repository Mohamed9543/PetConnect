const express = require("express");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const { getUserById, updateProfile, toggleBlockUser, getBlockedUsers } = require("../controllers/userController");

const router = express.Router();

router.put("/profile", protect, upload.single("avatar"), updateProfile);
router.get("/blocked", protect, getBlockedUsers);
router.post("/:id/block", protect, toggleBlockUser);
router.get("/:id", protect, getUserById);

module.exports = router;
