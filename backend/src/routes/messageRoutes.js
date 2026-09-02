const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getConversations,
  getConversationInfo,
  getMessages,
  startConversation,
  sendMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/", protect, getConversations);
router.post("/start", protect, startConversation);
router.get("/:conversationId/info", protect, getConversationInfo);
router.get("/:conversationId", protect, getMessages);
router.post("/", protect, sendMessage);

module.exports = router;
