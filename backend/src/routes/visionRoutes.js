const express = require("express");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Architecture placeholder for future image-recognition matching (see
// Report.imageAnalysis in models/Report.js). No vision model is integrated —
// this intentionally returns 501 rather than pretending to analyze anything,
// so the mobile app can show an honest "coming soon" state instead of a fake
// result.
router.post("/analyze", protect, (req, res) => {
  res.status(501).json({
    message:
      "La reconnaissance d'image n'est pas encore disponible. Cette fonctionnalité est prévue pour une prochaine version.",
    status: "not_available",
  });
});

module.exports = router;
