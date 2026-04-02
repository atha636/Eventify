const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  
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