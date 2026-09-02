const express = require("express");
const { protect } = require("../middleware/auth");
const { ask } = require("../controllers/assistantController");

const router = express.Router();

router.post("/ask", protect, ask);

module.exports = router;
