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

  // ── Date Change Request ──────────────────────────────────────────
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