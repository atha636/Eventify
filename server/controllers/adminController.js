const User    = require("../models/User");
const Vendor  = require("../models/Vendor");
const Booking = require("../models/Booking");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");

// ─────────────────────────────────────────
// ADMIN REGISTER (secret-key protected)
// ─────────────────────────────────────────
exports.adminRegister = async (req, res) => {
  const { name, email, password, adminSecret } = req.body;

  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ msg: "Invalid admin secret key" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      email,
      password: hashed,
      role: "admin",
      isVerified: true,
    });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      msg: "Admin account created",
      token,
      user: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error("ADMIN REGISTER ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// ADMIN LOGIN
// ─────────────────────────────────────────
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ msg: "Not an admin account" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalVendors, totalBookings, pendingBookings] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Vendor.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
    ]);

    // Revenue = sum of approved booking prices
    const revenueAgg = await Booking.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$packagePrice" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Recent 5 bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email")
      .populate("vendorId", "title serviceType");

    res.json({ totalUsers, totalVendors, totalBookings, pendingBookings, totalRevenue, recentBookings });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// USERS — GET ALL
// ─────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password -otp -otpExpires -resetOtp -resetOtpExpires")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// USERS — DELETE
// ─────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role === "admin") return res.status(403).json({ msg: "Cannot delete admin" });

    await User.findByIdAndDelete(req.params.id);
    // Also remove their vendor services & bookings
    await Vendor.deleteMany({ vendorId: req.params.id });
    await Booking.deleteMany({ userId: req.params.id });

    res.json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// USERS — UPDATE ROLE
// ─────────────────────────────────────────
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!["user", "vendor"].includes(role)) {
    return res.status(400).json({ msg: "Invalid role. Use 'user' or 'vendor'" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "Role updated", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// SERVICES — GET ALL
// ─────────────────────────────────────────
exports.getServices = async (req, res) => {
  try {
    const services = await Vendor.find()
      .populate("vendorId", "name email")
      .sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// SERVICES — DELETE
// ─────────────────────────────────────────
exports.deleteService = async (req, res) => {
  try {
    const service = await Vendor.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ msg: "Service not found" });
    await Booking.deleteMany({ vendorId: req.params.id });
    res.json({ msg: "Service deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// SERVICES — TOGGLE APPROVAL
// ─────────────────────────────────────────
exports.toggleServiceApproval = async (req, res) => {
  try {
    const service = await Vendor.findById(req.params.id);
    if (!service) return res.status(404).json({ msg: "Service not found" });

    service.isApproved = !service.isApproved;
    await service.save();

    res.json({ msg: `Service ${service.isApproved ? "approved" : "suspended"}`, service });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// BOOKINGS — GET ALL
// ─────────────────────────────────────────
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate("vendorId", "title serviceType location")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// BOOKINGS — UPDATE STATUS
// ─────────────────────────────────────────
exports.updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "approved", "rejected", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ msg: "Invalid status" });
  }

  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("userId", "name email").populate("vendorId", "title");

    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    res.json({ msg: "Status updated", booking });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// BOOKINGS — DELETE
// ─────────────────────────────────────────
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    res.json({ msg: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};