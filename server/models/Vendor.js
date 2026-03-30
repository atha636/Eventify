const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  serviceType: String,
  title: String,
  description: String,
  images: [String],
  packages: [
    {
      name: String,
      price: Number,
      details: String
    }
  ],
  location: String,
  isApproved: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Vendor", vendorSchema);