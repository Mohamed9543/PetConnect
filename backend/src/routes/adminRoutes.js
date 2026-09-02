const express = require("express");
const { protect, admin } = require("../middleware/auth");
const {
  getStats,
  getTimeseries,
  getUsers,
  getUserDetail,
  getAnimalsAdmin,
  getReportsAdmin,
  blockUser,
  verifyAssociation,
  deleteAnimalAdmin,
  resolveReport,
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect, admin);
router.get("/stats", getStats);
router.get("/stats/timeseries", getTimeseries);
router.get("/users", getUsers);
router.get("/users/:id", getUserDetail);
router.get("/animals", getAnimalsAdmin);
router.get("/reports", getReportsAdmin);
router.put("/users/:id/block", blockUser);
router.put("/users/:id/verify", verifyAssociation);
router.delete("/animals/:id", deleteAnimalAdmin);
router.put("/reports/:id/resolve", resolveReport);

module.exports = router;
