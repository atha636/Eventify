const Vendor = require("../models/Vendor");
const User   = require("../models/User");
const {
  sendEmail,
  sendVendorVerificationRequest,
} = require("../utils/sendEmail");

// ─────────────────────────────────────────────
// GET all vendors (only approved profiles)
// ─────────────────────────────────────────────
exports.getVendors = async (req, res) => {
  try {
    const approvedVendorIds = await User.find({ role: "vendor", isProfileVerified: "approved" }).select("_id");
    const ids = approvedVendorIds.map((v) => v._id);
    const vendors = await Vendor
      .find({ isApproved: true, vendorId: { $in: ids } })
      .populate("vendorId", "isVendorVerified"); // ← FIX: sends isVendorVerified to frontend
    res.json(vendors);
  } catch (err) {
    console.error("getVendors ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET vendors by type
// ─────────────────────────────────────────────
exports.getByType = async (req, res) => {
  try {
    const type = req.params.type?.toLowerCase().trim();
    const approvedVendorIds = await User.find({ role: "vendor", isProfileVerified: "approved" }).select("_id");
    const ids = approvedVendorIds.map((v) => v._id);
    const vendors = await Vendor
      .find({
        serviceType: { $regex: new RegExp(`^${type}$`, "i") },
        isApproved:  true,
        vendorId:    { $in: ids },
      })
      .populate("vendorId", "isVendorVerified"); // ← FIX: sends isVendorVerified to frontend
    res.json(vendors);
  } catch (err) {
    console.error("getByType ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/vendors/add
// ─────────────────────────────────────────────
exports.addService = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.role === "vendor" && user.isProfileVerified !== "approved") {
      const statusMsg = {
        pending:  "Your vendor profile is still under review. You can add services once approved by the admin.",
        rejected: "Your vendor profile has been rejected. Please contact support.",
      };
      return res.status(403).json({
        error: statusMsg[user.isProfileVerified] || "Profile not verified",
        verificationStatus: user.isProfileVerified,
      });
    }

    const imageUrls = req.files.map((f) => f.path);

    let packages = [];
    if (req.body.packages) {
      try { packages = JSON.parse(req.body.packages); }
      catch { return res.status(400).json({ error: "Invalid packages format" }); }
    }

    const vendor = await Vendor.create({
      vendorId:    req.user.id,
      vendorName:  user.name,
      serviceType: req.body.serviceType,
      title:       req.body.title?.trim(),
      description: req.body.description?.trim(),
      location:    req.body.location?.trim(),
      packages,
      images:      imageUrls,
      isApproved:  true,
    });

    await sendEmail({
      to:      user.email,
      subject: "Service Added Successfully ✅",
      text:    `Hello ${user.name},\n\nYour service "${vendor.title}" has been added successfully.\n\n- Evencers Team`,
    });

    res.status(201).json(vendor);
  } catch (err) {
    console.error("addService ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/vendors/:id — Edit existing service
// ─────────────────────────────────────────────
exports.editService = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const service = await Vendor.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    if (service.vendorId.toString() !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    let packages = service.packages;
    if (req.body.packages) {
      try { packages = JSON.parse(req.body.packages); }
      catch { return res.status(400).json({ error: "Invalid packages format" }); }
    }

    let existingImages = service.images;
    if (req.body.existingImages) {
      try { existingImages = JSON.parse(req.body.existingImages); }
      catch { existingImages = service.images; }
    }

    const imageUrls    = req.files ? req.files.map((f) => f.path) : [];
    const mergedImages = [...existingImages, ...imageUrls].slice(0, 15);

    const updated = await Vendor.findByIdAndUpdate(
      req.params.id,
      {
        serviceType: req.body.serviceType || service.serviceType,
        title:       req.body.title?.trim()       || service.title,
        description: req.body.description?.trim() || service.description,
        location:    req.body.location?.trim()    || service.location,
        packages,
        images:      mergedImages,
      },
      { returnDocument: 'after' }
    );

    const user = await User.findById(req.user.id);
    if (user) {
      await sendEmail({
        to:      user.email,
        subject: "Service Updated ✏️",
        text:    `Hello ${user.name},\n\nYour service "${updated.title}" has been updated successfully.\n\n- Evencers Team`,
      }).catch((e) => console.error("Email send error (non-fatal):", e.message));
    }

    res.json(updated);
  } catch (err) {
    console.error("editService ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// Legacy
exports.createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create({ ...req.body, vendorId: req.user.id });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vendors/my-services
exports.getMyServices = async (req, res) => {
  try {
    const services = await Vendor.find({ vendorId: req.user.id });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/vendors/:id
exports.deleteService = async (req, res) => {
  try {
    const service = await Vendor.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    if (service.vendorId.toString() !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    await Vendor.findByIdAndDelete(req.params.id);

    const user = await User.findById(req.user.id);
    if (user) {
      await sendEmail({
        to:      user.email,
        subject: "Service Deleted ⚠️",
        text:    `Hello ${user.name},\n\nYour service "${service.title}" has been removed from Evencers.\n\n- Evencers Team`,
      }).catch((e) => console.error("Email send error (non-fatal):", e.message));
    }

    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/vendors/:id/availability
// ─────────────────────────────────────────────
exports.getAvailability = async (req, res) => {
  try {
    const service = await Vendor.findById(req.params.id).select("availability");
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service.availability || []);
  } catch (err) {
    console.error("getAvailability ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/vendors/:id/availability
// ─────────────────────────────────────────────
exports.updateAvailability = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const service = await Vendor.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    if (service.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { dates } = req.body;
    if (!Array.isArray(dates)) {
      return res.status(400).json({ error: "dates must be an array" });
    }

    const normalised = dates
      .filter((d) => d.date && typeof d.available === "boolean")
      .map((d) => ({
        date:      new Date(d.date),
        available: d.available,
      }))
      .filter((d) => !isNaN(d.date.getTime()));

    service.availability = normalised;
    await service.save();

    res.json({ message: "Availability updated", availability: service.availability });
  } catch (err) {
    console.error("updateAvailability ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/vendors/available?date=YYYY-MM-DD
// ─────────────────────────────────────────────
exports.getAvailableOnDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date query param required" });

    const target = new Date(date);
    if (isNaN(target.getTime())) return res.status(400).json({ error: "Invalid date" });

    target.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(target);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const approvedVendorIds = await User.find({ role: "vendor", isProfileVerified: "approved" }).select("_id");
    const ids = approvedVendorIds.map((v) => v._id);

    const unavailableServiceIds = await Vendor.find({
      isApproved: true,
      vendorId: { $in: ids },
      availability: {
        $elemMatch: {
          date:      { $gte: target, $lt: nextDay },
          available: false,
        },
      },
    }).select("_id");

    const unavailableIds = unavailableServiceIds.map((v) => v._id.toString());

    const vendors = await Vendor
      .find({
        isApproved: true,
        vendorId:   { $in: ids },
        _id:        { $nin: unavailableIds },
      })
      .populate("vendorId", "isVendorVerified"); // ← FIX: sends isVendorVerified to frontend
    res.json(vendors);
  } catch (err) {
    console.error("getAvailableOnDate ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};