const express = require("express");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyResetOtpValidator,
  resetPasswordValidator,
} = require("../validators/authValidators");
const {
  register,
  login,
  getMe,
  googleAuth,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", upload.single("avatar"), registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/google", googleAuth);
router.get("/me", protect, getMe);
router.post("/forgot-password", forgotPasswordValidator, validate, forgotPassword);
router.post("/verify-reset-otp", verifyResetOtpValidator, validate, verifyResetOtp);
router.post("/reset-password", resetPasswordValidator, validate, resetPassword);

module.exports = router;
