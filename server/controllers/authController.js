const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const { sendOTP, sendResetOTP } = require("../utils/sendEmail");

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ msg: "User already exists" });
      }
      existingUser.otp = otp;
      existingUser.otpExpires = Date.now() + 5 * 60 * 1000;
      await existingUser.save();
      await sendOTP(email, otp);
      return res.json({ msg: "OTP resent to email" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name, email,
      password: hashed,
      role,
      otp,
      otpExpires: Date.now() + 5 * 60 * 1000,
      isVerified: false,
    });

    await sendOTP(email, otp);
    res.json({ msg: "OTP sent to email" });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// VERIFY OTP (registration)
// ─────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ msg: "Account verified", token, user });

  } catch (err) {
    res.status(500).json(err);
  }
};

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(400).json({ msg: "Please verify your email first" });
    }

    if (!user.password) {
      return res.status(400).json({ msg: "Use Google login" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch (err) {
    res.status(500).json(err);
  }
};

// ─────────────────────────────────────────
// GOOGLE LOGIN
// ─────────────────────────────────────────
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ msg: "No token provided" });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name, email,
        password: null,
        avatar: picture,
        role: "user",
        isVerified: true,
      });
    }

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token: jwtToken, user });

  } catch (err) {
    console.error("Google Login Error:", err);
    res.status(500).json({ msg: "Google login failed" });
  }
};

// ─────────────────────────────────────────
// FORGOT PASSWORD — send OTP
// ─────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // Always respond with success to prevent email enumeration
    if (!user || !user.isVerified) {
      return res.json({ msg: "If this email exists, an OTP has been sent." });
    }

    if (!user.password) {
      return res.status(400).json({ msg: "This account uses Google login. No password to reset." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendResetOTP(email, otp);

    res.json({ msg: "OTP sent to your email" });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// VERIFY RESET OTP
// ─────────────────────────────────────────
exports.verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    if (user.resetOtp !== otp || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // OTP is valid — issue a short-lived reset token
    const resetToken = jwt.sign(
      { id: user._id, purpose: "reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ msg: "OTP verified", resetToken });

  } catch (err) {
    console.error("VERIFY RESET OTP ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// RESET PASSWORD — set new password
// ─────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ msg: "Reset session expired. Please start again." });
    }

    if (decoded.purpose !== "reset") {
      return res.status(400).json({ msg: "Invalid reset token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    res.json({ msg: "Password reset successfully" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};