const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  name:     { type: String },
  price:    { type: Number },
  features: [String],
});

const serviceSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    serviceType: {
      type: String,
      lowercase: true,   // ✅ always stored lowercase — no more case mismatch
      trim: true,
    },
    title:       { type: String, trim: true },
    description: { type: String, trim: true },
    location:    { type: String, trim: true },
    images:      [String],
    packages:    [packageSchema],

    // ✅ default true — new services always visible without manual approval
    isApproved: {
      type: Boolean,
      default: true,
    },

    rating: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", serviceSchema);