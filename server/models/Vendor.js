const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  name:     { type: String },
  price:    { type: Number },
  features: [String],
});

// Each entry = one date with available/unavailable flag
const availabilitySchema = new mongoose.Schema({
  date:      { type: Date, required: true },
  available: { type: Boolean, default: true },
}, { _id: false });

const serviceSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorName: {
      type: String,
      trim: true,
    },
    serviceType: {
      type: String,
      lowercase: true,
      trim: true,
    },
    title:       { type: String, trim: true },
    description: { type: String, trim: true },
    location:    { type: String, trim: true },
    images:      [String],
    packages:    [packageSchema],

    // Availability calendar — array of { date, available }
    // Dates not in this array are considered AVAILABLE by default
    availability: [availabilitySchema],

    isApproved: {
      type: Boolean,
      default: true,
    },
    rating: { type: Number },
  },
  { timestamps: true }
);

// Index for fast date-range queries on availability
serviceSchema.index({ "availability.date": 1 });

module.exports = mongoose.model("Vendor", serviceSchema);