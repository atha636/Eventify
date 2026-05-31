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
  isVendorVerified: {
    type: Boolean,
    default: false,
  },
  // ──────────────────────────────────────────────────────────────────

  // ── Vendor Onboarding Welcome Screen ─────────────────────────────
  hasSeenWelcome: {
    type: Boolean,
    default: false,
  },
  // ──────────────────────────────────────────────────────────────────

  // ── Vendor Identity Code ──────────────────────────────────────────
  // A unique 6-character alphanumeric code assigned to every vendor
  // at registration. Used to identify the vendor in bookings/receipts.
  // Format: first 2 letters of name (uppercased) + 4 random digits
  // e.g. "AT8273" for vendor "Atharv Patidar"
  // Only meaningful when role === "vendor"
  vendorCode: {
    type: String,
    default: null,
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