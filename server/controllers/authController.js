const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const { sendOTP } = require("../utils/sendEmail");

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 🔥 CASE 1: USER EXISTS → RESEND OTP
    if (existingUser) {
      // if already verified → block
      if (existingUser.isVerified) {
        return res.status(400).json({ msg: "User already exists" });
      }

      // resend OTP
      existingUser.otp = otp;
      existingUser.otpExpires = Date.now() + 5 * 60 * 1000;

      await existingUser.save();
      await sendOTP(email, otp);

      return res.json({ msg: "OTP resent to email" });
    }

    // 🔥 CASE 2: NEW USER
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
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

res.json({
  msg: "Account verified",
  token,
  user
});

  } catch (err) {
    res.status(500).json(err);
  }
};

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

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ msg: "No token provided" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { name, email, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
  name,
  email,
  password: null,
  avatar: picture,
  role: "user",
  isVerified: true, // 🔥 IMPORTANT
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