const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: { 
    type: String, 
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  otp: String,
  otpExpires: Date,

  isVerified: {
    type: Boolean,
    default: false
  },

  role: {
    type: String,
    enum: ["user", "vendor", "admin"],
    default: "user"
  }
});

module.exports = mongoose.model("User", userSchema);