const Vendor = require("../models/Vendor");

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
    console.log("USER :", JSON.stringify(req.user));
    console.log("BODY :", req.body);
    console.log("FILES:", req.files?.length, "file(s)");

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

    const vendor = await Vendor.create({
      vendorId:    req.user.id,
      serviceType: req.body.serviceType,
      title:       req.body.title?.trim(),
      description: req.body.description?.trim(),
      location:    req.body.location?.trim(),
      packages,
      images:      imageUrls,
      isApproved:  true,   // ✅ always set explicitly
    });

    console.log("CREATED:", vendor._id, "| type:", vendor.serviceType, "| approved:", vendor.isApproved);
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