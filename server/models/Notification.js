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
      // ── Booking flow ─────────────────────────────────────────
      "booking_received",       // vendor: new booking from user
      "booking_approved",       // user:   vendor approved
      "booking_rejected",       // user:   vendor rejected
      "payment_pending",        // user:   pay now to confirm
      "payment_done",           // vendor: user paid

      // ── CHANGE 1: Service management ────────────────────────
      "service_updated",        // vendor: admin edited title / removed image
      "service_live_soon",      // vendor: profile approved → services going live
      "profile_rejected",       // vendor: profile rejected by admin

      // ── CHANGE 2: Date + Address change flow ─────────────────
      "date_change_requested",  // vendor: user wants to change date/address
      "date_change_approved",   // user:   vendor approved the change
      "date_change_rejected",   // user:   vendor rejected the change
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