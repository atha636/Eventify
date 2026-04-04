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
    enum: ["pending", "approved", "rejected", "cancelled" ],
    default: "pending"
  }

}, { timestamps: true }); // ✅ ADD THIS

module.exports = mongoose.model("Booking", bookingSchema);