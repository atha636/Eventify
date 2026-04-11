const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");

const {
  register,
  login,
  googleLogin,
  verifyOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  updateProfile,    // ← NEW
  changePassword,   // ← NEW
} = require("../controllers/authController");

// ── Public ────────────────────────────────────────────────────────
router.post("/register",    register);
router.post("/login",       login);
router.post("/google",      googleLogin);
router.post("/verify-otp",  verifyOTP);

// ── Forgot Password Flow ──────────────────────────────────────────
router.post("/forgot-password",    forgotPassword);
router.post("/verify-reset-otp",   verifyResetOTP);
router.post("/reset-password",     resetPassword);

// ── Profile (protected) ───────────────────────────────────────────
router.put("/update-profile",  auth, updateProfile);   // ← NEW
router.put("/change-password", auth, changePassword);  // ← NEW

module.exports = router;