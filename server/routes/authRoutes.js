const express = require("express");
const router = express.Router();

const { register, login, googleLogin, verifyOTP } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

// 🔥 ADD THIS
router.post("/verify-otp", verifyOTP);

module.exports = router;