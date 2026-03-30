const Vendor = require("../models/Vendor");

exports.createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create({
      ...req.body,
      userId: req.user
    });

    res.json(vendor);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ "isApproved": true });
    res.json(vendors);
  } catch (err) {
    res.status(500).json(err);
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
    res.status(500).json(err);
  }
};