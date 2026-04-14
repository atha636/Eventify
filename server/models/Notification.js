const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  type: {
    type: String,
    enum: [
      "booking_received",    // vendor gets this when user books
      "booking_approved",    // user gets this when vendor approves
      "booking_rejected",    // user gets this when vendor rejects
      "payment_pending",     // user gets this → "Pay Now to confirm"
      "payment_done",        // vendor gets this when user pays
    ],
    required: true,
  },

  title: { type: String, required: true },
  message: { type: String, required: true },

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },

  isRead: { type: Boolean, default: false },

}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);