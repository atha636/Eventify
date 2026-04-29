const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "User",
    required: true,
    index:    true,
  },

  type: {
  type: String,
  enum: [
  "booking_received",
  "booking_approved",
  "booking_rejected",
  "payment_pending",
  "payment_done",

  "service_updated",
  "service_live_soon",
  "profile_rejected",

  "date_change_requested",
  "date_change_approved",
  "date_change_rejected",

  // ✅ ADD THESE TWO
  "vendor_verified",
  "vendor_unverified"
],
  required: true,
},

  title:   { type: String, required: true },
  message: { type: String, required: true },

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  "Booking",
  },

  isRead: { type: Boolean, default: false },

}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);