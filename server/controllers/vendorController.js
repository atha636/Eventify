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

exports.addService = async (req, res) => {
  try {
    const vendor = await Vendor.create({
      userId: req.user,
      serviceType: req.body.serviceType,
      title: req.body.title,
      description: req.body.description,
      images: [req.body.image],
      packages: [
        {
          name: "Basic",
          price: req.body.price,
          details: req.body.description
        }
      ],
      location: req.body.location,
      isApproved: true // for now auto approve
    });

    res.json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};