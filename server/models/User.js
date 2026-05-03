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

  // ── Vendor profile verification by admin ─────────────────────────
  // "pending"  = vendor registered, waiting for admin review
  // "approved" = admin has verified this vendor — can take bookings
  // "rejected" = admin rejected this vendor profile
  isProfileVerified: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  profileRejectionReason: {
    type: String,
    default: "",
  },
  // ──────────────────────────────────────────────────────────────────

  // ── Vendor Trust Badge ────────────────────────────────────────────
  // true = admin has awarded this vendor the "Verified" badge
  // This is separate from isProfileVerified (profile approval).
  // isProfileVerified = "can this vendor operate on the platform?"
  // isVendorVerified  = "has admin given this vendor a trust badge?"
  isVendorVerified: {
    type: Boolean,
    default: false,
  },
  // ──────────────────────────────────────────────────────────────────

  // ── Vendor Onboarding Welcome Screen ─────────────────────────────
  // false = vendor has never seen the "Why Join Evencers" screen
  //         → redirect to /vendor/welcome after first login
  // true  = vendor has already seen and dismissed the welcome screen
  //         → go straight to dashboard on subsequent logins
  // Only meaningful when role === "vendor"
  hasSeenWelcome: {
    type: Boolean,
    default: false,
  },
  // ──────────────────────────────────────────────────────────────────

  // ── Favorites ─────────────────────────────────────────────────────
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor"
  }]
  // ──────────────────────────────────────────────────────────────────
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);