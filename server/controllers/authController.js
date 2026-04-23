const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const {
  sendOTP,
  sendResetOTP,
  sendVendorVerificationRequest,
} = require("../utils/sendEmail");

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUser) {
      if (existingUser.isVerified) return res.status(400).json({ msg: "User already exists" });
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
      // Vendors start as pending verification
      isProfileVerified: role === "vendor" ? "pending" : "approved",
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

    // Notify admin when a vendor verifies email
    if (user.role === "vendor") {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      sendVendorVerificationRequest({
        vendorName:  user.name,
        vendorEmail: user.email,
        adminEmail,
      }).catch((e) => console.error("Admin notify error (non-fatal):", e.message));
    }

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
    if (!user.isVerified) return res.status(400).json({ msg: "Please verify your email first" });
    if (!user.password) return res.status(400).json({ msg: "Use Google login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json(err);
  }
};

// ─────────────────────────────────────────
// GOOGLE LOGIN — FIXED
// ─────────────────────────────────────────
exports.googleLogin = async (req, res) => {
  try {
    const { token, role } = req.body; // ← FIXED: destructure role from request
    if (!token) return res.status(400).json({ msg: "No token provided" });

    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const { name, email, picture } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (!user) {
      // ── NEW USER: use the role they selected on the register page ──
      const assignedRole = role === "vendor" ? "vendor" : "user"; // safe fallback to "user"

      user = await User.create({
        name,
        email,
        password: null,
        avatar: picture,
        role: assignedRole,                                              // ← FIXED: use selected role
        isVerified: true,
        isProfileVerified: assignedRole === "vendor" ? "pending" : "approved", // ← FIXED: vendors start pending
      });

      // Notify admin if a new vendor registers via Google
      if (assignedRole === "vendor") {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        sendVendorVerificationRequest({
          vendorName:  user.name,
          vendorEmail: user.email,
          adminEmail,
        }).catch((e) => console.error("Admin notify error (non-fatal):", e.message));
      }
    }
    // ── EXISTING USER: keep their stored role — do NOT overwrite ──

    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
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
    if (!user || !user.isVerified) return res.json({ msg: "If this email exists, an OTP has been sent." });
    if (!user.password) return res.status(400).json({ msg: "This account uses Google login. No password to reset." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
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
    const resetToken = jwt.sign({ id: user._id, purpose: "reset" }, process.env.JWT_SECRET, { expiresIn: "15m" });
    res.json({ msg: "OTP verified", resetToken });
  } catch (err) {
    console.error("VERIFY RESET OTP ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;
  try {
    let decoded;
    try { decoded = jwt.verify(resetToken, process.env.JWT_SECRET); }
    catch { return res.status(400).json({ msg: "Reset session expired. Please start again." }); }

    if (decoded.purpose !== "reset") return res.status(400).json({ msg: "Invalid reset token" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();
    res.json({ msg: "Password reset successfully" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// UPDATE PROFILE (name + email)
// PUT /api/auth/update-profile
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ msg: "Name and email are required" });
  }
  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing && existing._id.toString() !== req.user.id) {
      return res.status(400).json({ msg: "Email already in use by another account" });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim(), email: email.toLowerCase().trim() },
      { returnDocument: 'after', select: "-password -otp -otpExpires -resetOtp -resetOtpExpires" }
    );
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "Profile updated", user });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// CHANGE PASSWORD
// PUT /api/auth/change-password
// ─────────────────────────────────────────
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: "Both current and new passwords are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ msg: "New password must be at least 6 characters" });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (!user.password) return res.status(400).json({ msg: "This account uses Google login — no password to change" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ msg: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};