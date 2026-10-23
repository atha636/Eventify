const mongoose = require("mongoose");

// ── Review ──────────────────────────────────────────────────────────────────
// One review per (vendor, user) pair — a user can edit their review later but
// can't post a second one for the same vendor. Only users with at least one
// "approved" booking for that vendor are allowed to create a review (enforced
// in the controller, not here — schema stays storage-only).
const reviewSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Snapshot of the reviewer's name at review time (survives name changes)
    userName: { type: String, required: true, trim: true },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: "" },

    // Vendor can post a single public reply to a review
    vendorReply: {
      message: { type: String, trim: true, maxlength: 500, default: "" },
      repliedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// One review per user per vendor
reviewSchema.index({ vendorId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ vendorId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);