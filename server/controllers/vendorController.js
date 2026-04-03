const Vendor = require("../models/Vendor");
const { sendEmail } = require("../utils/sendEmail");
const User = require("../models/User"); // IMPORTANT

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

    // ✅ case-insensitive regex, no isApproved filter
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

    // ✅ STEP 1: Get user FIRST
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ STEP 2: Create service
    const vendor = await Vendor.create({
      vendorId: req.user.id,
      vendorName: user.name, // ✅ now safe
      serviceType: req.body.serviceType,
      title: req.body.title?.trim(),
      description: req.body.description?.trim(),
      location: req.body.location?.trim(),
      packages,
      images: imageUrls,
      isApproved: true,
    });

    // ✅ STEP 3: Send email
    await sendEmail({
      to: user.email,
      subject: "Service Added Successfully ✅",
      text: `
Hello ${user.name},

Your service "${vendor.title}" has been added successfully.

- Eventify Team
      `
    });

    res.status(201).json(vendor);

  } catch (err) {
    console.error("addService ERROR:", err);
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
// GET /api/vendors/my-services — vendor sees only their own services
exports.getMyServices = async (req, res) => {
  try {
    const services = await Vendor.find({ vendorId: req.user.id });
    res.json(services);
  } catch (err) {
    console.error("getMyServices ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Vendor.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // ✅ Security check (VERY IMPORTANT)
    if (service.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Vendor.findByIdAndDelete(req.params.id);

    // ✅ Get user email
    const user = await User.findById(req.user.id);

    // ✅ Send email
    await sendEmail({
      to: user.email,
      subject: "Service Deleted ⚠️",
      text: `
Hello ${user.name},

Your service "${service.title}" has been removed from Eventify.

If this was not intended, please contact support.

- Eventify Team
      `
    });

    res.json({ message: "Service deleted successfully" });

  } catch (err) {
    console.error("deleteService ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};