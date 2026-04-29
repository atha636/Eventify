const User         = require("../models/User");
const Vendor       = require("../models/Vendor");
const Booking      = require("../models/Booking");
const Notification = require("../models/Notification");
const bcrypt       = require("bcryptjs");
const jwt          = require("jsonwebtoken");
const {
  sendVendorVerificationResult,
  sendEmail,
} = require("../utils/sendEmail");

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
    const admin  = await User.create({ name, email, password: hashed, role: "admin", isVerified: true });
    const token  = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ msg: "Admin account created", token, user: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
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
    const user  = await User.findOne({ email });
    if (!user || user.role !== "admin") return res.status(403).json({ msg: "Not an admin account" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
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
    const [totalUsers, totalVendors, totalBookings, pendingBookings, pendingVendors] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Vendor.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "vendor", isProfileVerified: "pending" }),
    ]);
    const revenueAgg = await Booking.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$packagePrice" } } },
    ]);
    const totalRevenue   = revenueAgg[0]?.total || 0;
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 }).limit(5)
      .populate("userId", "name email")
      .populate("vendorId", "title serviceType");
    res.json({ totalUsers, totalVendors, totalBookings, pendingBookings, pendingVendors, totalRevenue, recentBookings });
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
  if (!["user", "vendor"].includes(role)) return res.status(400).json({ msg: "Invalid role. Use 'user' or 'vendor'" });
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { returnDocument: "after", select: "-password" });
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
    const services = await Vendor.find().populate("vendorId", "name email isVendorVerified").sort({ createdAt: -1 });
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
// SERVICES — EDIT TITLE (admin)
// PUT /api/admin/services/:id/title
// ─────────────────────────────────────────
exports.editServiceTitle = async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ msg: "Title is required" });
  }
  try {
    const service = await Vendor.findByIdAndUpdate(
      req.params.id,
      { title: title.trim() },
      { returnDocument: "after" }
    ).populate("vendorId", "name email");

    if (!service) return res.status(404).json({ msg: "Service not found" });

    setImmediate(async () => {
      try {
        const vendorUser = service.vendorId;
        if (vendorUser?._id) {
          await Notification.create({
            userId:    vendorUser._id,
            type:      "service_updated",
            title:     "Service Title Updated by Admin",
            message:   `Admin has updated your service title to "${service.title}". Your service is still active.`,
            bookingId: null,
          });
        }
        if (vendorUser?.email) {
          await sendEmail({
            to:      vendorUser.email,
            subject: "Your Service Title Was Updated ✏️",
            text:    `Hello ${vendorUser.name},\n\nAdmin has updated your service title to:\n"${service.title}"\n\nYour service remains active on Evencers.\n\n- Evencers Team`,
          }).catch(() => {});
        }
      } catch (e) {
        console.error("editServiceTitle notification error:", e.message);
      }
    });

    res.json({ msg: "Title updated", service });
  } catch (err) {
    console.error("EDIT SERVICE TITLE ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─────────────────────────────────────────
// SERVICES — DELETE SINGLE IMAGE (admin)
// DELETE /api/admin/services/:id/images
// ─────────────────────────────────────────
exports.deleteServiceImage = async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ msg: "imageUrl is required" });

  try {
    const service = await Vendor.findById(req.params.id).populate("vendorId", "name email");
    if (!service) return res.status(404).json({ msg: "Service not found" });

    if (!service.images.includes(imageUrl)) {
      return res.status(404).json({ msg: "Image not found in this service" });
    }

    if (service.images.length <= 1) {
      return res.status(400).json({ msg: "Cannot delete the last image. A service must have at least one image." });
    }

    service.images = service.images.filter((img) => img !== imageUrl);
    await service.save();

    setImmediate(async () => {
      try {
        const vendorUser = service.vendorId;
        if (vendorUser?._id) {
          await Notification.create({
            userId:    vendorUser._id,
            type:      "service_updated",
            title:     "Service Image Removed by Admin",
            message:   `Admin has removed an image from your service "${service.title}". Your service has ${service.images.length} image(s) remaining.`,
            bookingId: null,
          });
        }
        if (vendorUser?.email) {
          await sendEmail({
            to:      vendorUser.email,
            subject: "Service Image Removed ⚠️",
            text:    `Hello ${vendorUser.name},\n\nAdmin has removed an image from your service "${service.title}".\n\nYour service now has ${service.images.length} image(s).\n\n- Evencers Team`,
          }).catch(() => {});
        }
      } catch (e) {
        console.error("deleteServiceImage notification error:", e.message);
      }
    });

    res.json({ msg: "Image removed", images: service.images });
  } catch (err) {
    console.error("DELETE SERVICE IMAGE ERROR:", err);
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
  if (!allowed.includes(status)) return res.status(400).json({ msg: "Invalid status" });
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" }
    )
      .populate("userId", "name email")
      .populate("vendorId", "title");

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

// ═══════════════════════════════════════════════════════════════
// VENDOR PROFILE VERIFICATION
// ═══════════════════════════════════════════════════════════════

exports.getPendingVendors = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const query = { role: "vendor" };
    if (status !== "all") query.isProfileVerified = status;

    const vendors = await User.find(query)
      .select("-password -otp -otpExpires -resetOtp -resetOtpExpires")
      .sort({ createdAt: -1 });

    res.json(vendors);
  } catch (err) {
    console.error("GET PENDING VENDORS ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.verifyVendorProfile = async (req, res) => {
  const { action, reason } = req.body;

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ msg: "Action must be 'approve' or 'reject'" });
  }

  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });
    if (vendor.role !== "vendor") return res.status(400).json({ msg: "User is not a vendor" });

    const approved                = action === "approve";
    vendor.isProfileVerified      = approved ? "approved" : "rejected";
    vendor.profileRejectionReason = approved ? "" : (reason || "");
    await vendor.save();

    setImmediate(async () => {
      try {
        await sendVendorVerificationResult({
          vendorEmail: vendor.email,
          vendorName:  vendor.name,
          approved,
          reason:      reason || "",
        }).catch((e) => console.error("Verification email error (non-fatal):", e.message));

        if (approved) {
          await Notification.create({
            userId:    vendor._id,
            type:      "service_live_soon",
            title:     "🎉 Profile Approved! Your Services Go Live Soon",
            message:   "Your vendor profile has been approved by admin. Any services you add will be visible to customers very soon. Start adding your services now!",
            bookingId: null,
          });

          await sendEmail({
            to:      vendor.email,
            subject: "✅ Profile Approved — Your Services Go Live on Evencers!",
            text:    `Hello ${vendor.name},\n\nCongratulations! 🎉\n\nYour vendor profile on Evencers has been approved by our admin team.\n\nYour services will be live and visible to customers very soon.\n\nNext steps:\n1. Log in to your dashboard\n2. Add your services (photos, packages, pricing)\n3. Wait for bookings to roll in!\n\nWelcome to the Evencers family.\n\n- Evencers Team`,
          }).catch(() => {});

        } else {
          await Notification.create({
            userId:    vendor._id,
            type:      "profile_rejected",
            title:     "Profile Verification Update",
            message:   `Your vendor profile was not approved. ${reason ? `Reason: ${reason}` : "Please contact support for more details."}`,
            bookingId: null,
          });
        }
      } catch (e) {
        console.error("verifyVendorProfile background error:", e.message);
      }
    });

    res.json({
      msg: `Vendor profile ${approved ? "approved" : "rejected"} successfully`,
      vendor: {
        _id:               vendor._id,
        name:              vendor.name,
        email:             vendor.email,
        isProfileVerified: vendor.isProfileVerified,
      },
    });
  } catch (err) {
    console.error("VERIFY VENDOR ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ═══════════════════════════════════════════════════════════════
// VENDOR BADGE VERIFICATION
// Separate from profile verification — this is the trust badge
// that appears on service cards and vendor detail pages.
//
// PUT /api/admin/vendor-verifications/:id/badge
// ═══════════════════════════════════════════════════════════════
exports.toggleVendorVerified = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });
    if (vendor.role !== "vendor") return res.status(400).json({ msg: "User is not a vendor" });

    // Only approved vendors can receive the badge
    if (!vendor.isVendorVerified && vendor.isProfileVerified !== "approved") {
      return res.status(400).json({ msg: "Vendor profile must be approved before awarding the verified badge." });
    }

    vendor.isVendorVerified = !vendor.isVendorVerified;
    await vendor.save();

    // Background: notify vendor
    setImmediate(async () => {
      try {
        if (vendor.isVendorVerified) {
          await Notification.create({
            userId:    vendor._id,
            type:      "vendor_verified",
            title:     "🏅 You've been Verified!",
            message:   "Congratulations! Your vendor profile has received a Verified badge from Evencers admin. This badge will now appear on all your service listings and boost customer trust.",
            bookingId: null,
          });
          await sendEmail({
            to:      vendor.email,
            subject: "🏅 You're now a Verified Vendor on Evencers!",
            text:    `Hello ${vendor.name},\n\nGreat news! Our admin team has awarded your profile the Evencers Verified badge.\n\nThis badge will appear on all your service cards and boost customer trust.\n\nKeep delivering excellent service!\n\n- Evencers Team`,
          }).catch(() => {});
        } else {
          await Notification.create({
            userId:    vendor._id,
            type:      "vendor_unverified",
            title:     "Verified Badge Removed",
            message:   "Your Evencers Verified badge has been removed by admin. Please contact support if you have questions.",
            bookingId: null,
          });
          await sendEmail({
            to:      vendor.email,
            subject: "Verified Badge Removed — Evencers",
            text:    `Hello ${vendor.name},\n\nYour Evencers Verified badge has been removed by our admin team.\n\nIf you believe this is a mistake, please contact support.\n\n- Evencers Team`,
          }).catch(() => {});
        }
      } catch (e) {
        console.error("toggleVendorVerified notification error:", e.message);
      }
    });

    res.json({
      msg: `Vendor ${vendor.isVendorVerified ? "verified badge awarded" : "verified badge removed"} successfully`,
      vendor: {
        _id:               vendor._id,
        name:              vendor.name,
        email:             vendor.email,
        isVendorVerified:  vendor.isVendorVerified,
        isProfileVerified: vendor.isProfileVerified,
      },
    });
  } catch (err) {
    console.error("TOGGLE VENDOR VERIFIED ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};