const Vendor = require("../models/Vendor");
const cloudinary = require("../config/cloudinary");

exports.createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create({
      ...req.body,
      userId: req.user.id  // ✅ just the id
    });

    res.json(vendor);
  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ "isApproved": true });
    res.json(vendors);
  } catch (err) {
  console.error("ERROR:", err); // 👈 THIS LINE IMPORTANT
  res.status(500).json({ error: err.message });
}
};

exports.getByType = async (req, res) => {
  try {
    const vendors = await Vendor.find({
      serviceType: req.params.type,
      "isApproved": true
    });
    res.json(vendors);
  } catch (err) {
  console.error("ERROR:", err); // 👈 THIS LINE IMPORTANT
  res.status(500).json({ error: err.message });
}
};

exports.addService = async (req, res) => {
  try {
    console.log("USER:", JSON.stringify(req.user));
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ✅ Files are already uploaded by CloudinaryStorage
    // Just extract the URLs from req.files
    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    const vendor = await Vendor.create({
      userId: req.user.id,
      serviceType: req.body.serviceType,
      title: req.body.title,
      description: req.body.description,
      images: imageUrls,
      packages: [
        {
          name: "Basic",
          price: req.body.startingPrice || req.body.price,  // ✅ handle both names
          details: req.body.description
        }
      ],
      location: req.body.location,
      isApproved: true
    });

    res.json(vendor);

  } catch (err) {
    console.error("FULL ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};