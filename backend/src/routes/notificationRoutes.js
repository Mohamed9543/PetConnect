const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);

module.exports = router;
