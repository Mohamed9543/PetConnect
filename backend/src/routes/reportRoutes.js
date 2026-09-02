const express = require("express");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { createReportValidator } = require("../validators/reportValidators");
const {
  getReports,
  getLostReports,
  getFoundReports,
  getMyReports,
  getReportById,
  getReportMatches,
  createReport,
  updateReport,
  deleteReport,
} = require("../controllers/reportController");

const router = express.Router();

router.get("/", getReports);
router.get("/lost", getLostReports);
router.get("/found", getFoundReports);
router.get("/mine", protect, getMyReports);
router.get("/:id", getReportById);
router.get("/:id/matches", getReportMatches);
router.post("/", protect, upload.array("images", 6), createReportValidator, validate, createReport);
router.put("/:id", protect, updateReport);
router.delete("/:id", protect, deleteReport);

module.exports = router;
