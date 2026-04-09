const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
  },
  otp: String,
  otpExpires: Date,
  resetOtp: String,
  resetOtpExpires: Date,
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ["user", "vendor", "admin"],
    default: "user"
  },

  // ── Favorites ───────────────────────────────────────────────────
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor"
  }]
  // ────────────────────────────────────────────────────────────────
});

module.exports = mongoose.model("User", userSchema);