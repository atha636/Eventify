const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  name:     { type: String },
  price:    { type: Number },
  features: [String],
});

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

    // ── Legacy single-string location (kept for backwards compat) ──
    location:  { type: String, trim: true },

    // ── NEW: multi-city array ──
    locations: [{ type: String, trim: true }],

    images:   [String],
    packages: [packageSchema],

    // ── NEW: decor-specific fields ──
    timeSlots: [{ type: String, trim: true }],
    price:     { type: Number },

    availability: [availabilitySchema],

    isApproved: {
      type: Boolean,
      default: true,
    },

    // ── Reviews aggregate (kept in sync by reviewController) ──
    // `rating` = average of all Review docs for this vendor, rounded to 1dp.
    // `reviewCount` = how many reviews make up that average.
    rating:      { type: Number },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.index({ "availability.date": 1 });

module.exports = mongoose.model("Vendor", serviceSchema);