const express = require("express");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { registerValidator, loginValidator } = require("../validators/authValidators");
const { register, login, getMe, googleAuth } = require("../controllers/authController");

const router = express.Router();

router.post("/register", upload.single("avatar"), registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/google", googleAuth);
router.get("/me", protect, getMe);

module.exports = router;
