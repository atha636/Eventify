const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor"
  },

  packageName: String,
  packagePrice: Number,

  date: Date,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending"
  },

  // ── USER DETAILS (filled at booking time) ──────────────────────
  userDetails: {
    name:    { type: String, default: "" },
    phone:   { type: String, default: "" },
    address: { type: String, default: "" },
  },
  // ────────────────────────────────────────────────────────────────

  // ── PAYMENT FIELDS ───────────────────────────────────────────────
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    sparse: true
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },
  paidAt: Date,
  // ────────────────────────────────────────────────────────────────

  // ── DATE CHANGE REQUEST ─────────────────────────────────────────
  dateChangeRequest: {
    requestedDate: { type: Date, default: null },
    reason:        { type: String, default: "" },
    status: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none"
    },
    requestedAt: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
  },
  // ────────────────────────────────────────────────────────────────

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);