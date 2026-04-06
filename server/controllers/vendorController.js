const Vendor = require("../models/Vendor");
const { sendEmail } = require("../utils/sendEmail");
const User = require("../models/User");

// ─────────────────────────────────────────────
// GET all vendors
// ─────────────────────────────────────────────
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({});
    res.json(vendors);
  } catch (err) {
    console.error("getVendors ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET vendors by type  e.g. /api/vendors/decor
// ─────────────────────────────────────────────
exports.getByType = async (req, res) => {
  try {
    const type = req.params.type?.toLowerCase().trim();
    const vendors = await Vendor.find({
      serviceType: { $regex: new RegExp(`^${type}$`, "i") },
    });
    console.log(`getByType [${type}] → ${vendors.length} results`);
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
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const imageUrls = req.files ? req.files.map((f) => f.path) : [];

    let packages = [];
    if (req.body.packages) {
      try {
        packages = JSON.parse(req.body.packages);
      } catch {
        return res.status(400).json({ error: "Invalid packages format" });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

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
      text: `Hello ${user.name},\n\nYour service "${vendor.title}" has been added successfully.\n\n- Eventify Team`,
    });

    res.status(201).json(vendor);
  } catch (err) {
    console.error("addService ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/vendors/:id  — Edit existing service
// ─────────────────────────────────────────────
exports.editService = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const service = await Vendor.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });

    // Security: only the owner can edit
    if (service.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Parse packages
    let packages = service.packages;
    if (req.body.packages) {
      try {
        packages = JSON.parse(req.body.packages);
      } catch {
        return res.status(400).json({ error: "Invalid packages format" });
      }
    }

    // Existing images the client wants to keep
    let existingImages = service.images;
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages);
      } catch {
        existingImages = service.images;
      }
    }

    // New images uploaded in this request
    const newImageUrls = req.files ? req.files.map((f) => f.path) : [];

    // Merge: kept existing + newly uploaded (max 15)
    const mergedImages = [...existingImages, ...newImageUrls].slice(0, 15);

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
      { new: true }
    );

    // Notify vendor by email
    const user = await User.findById(req.user.id);
    if (user) {
      await sendEmail({
        to:      user.email,
        subject: "Service Updated ✏️",
        text: `Hello ${user.name},\n\nYour service "${updated.title}" has been updated successfully.\n\n- Eventify Team`,
      }).catch((e) => console.error("Email send error (non-fatal):", e.message));
    }

    res.json(updated);
  } catch (err) {
    console.error("editService ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// Legacy
// ─────────────────────────────────────────────
exports.createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create({ ...req.body, vendorId: req.user.id });
    res.json(vendor);
  } catch (err) {
    console.error("createVendor ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vendors/my-services
exports.getMyServices = async (req, res) => {
  try {
    const services = await Vendor.find({ vendorId: req.user.id });
    res.json(services);
  } catch (err) {
    console.error("getMyServices ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/vendors/:id
exports.deleteService = async (req, res) => {
  try {
    const service = await Vendor.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    if (service.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Vendor.findByIdAndDelete(req.params.id);

    const user = await User.findById(req.user.id);
    if (user) {
      await sendEmail({
        to:      user.email,
        subject: "Service Deleted ⚠️",
        text: `Hello ${user.name},\n\nYour service "${service.title}" has been removed from Eventify.\n\nIf this was not intended, please contact support.\n\n- Eventify Team`,
      }).catch((e) => console.error("Email send error (non-fatal):", e.message));
    }

    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("deleteService ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};