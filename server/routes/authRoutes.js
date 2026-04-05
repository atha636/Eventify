const express = require("express");
const router = express.Router();

const {
  register,
  login,
  googleLogin,
  verifyOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/verify-otp", verifyOTP);

// ── Forgot Password Flow ──────────────────
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

module.exports = router;