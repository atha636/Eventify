const express = require("express");
const router = express.Router();

const {
  createVendor,
  getVendors,
  getByType,
  addService,
  getMyServices
} = require("../controllers/vendorController");

const Vendor = require("../models/Vendor");

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// CREATE
router.post("/", auth, createVendor);

// ADD SERVICE
router.post(
  "/add",
  auth,
  (req, res, next) => {
    upload.array("images", 10)(req, res, (err) => {
      if (err) {
        console.error("MULTER ERROR:", err.message);
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  },
  addService
);

// GET ALL
router.get("/", getVendors);

// MY SERVICES
router.get("/my-services", auth, getMyServices);

// 🔥 DELETE SERVICE (ADD THIS HERE)
router.delete("/:id", auth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

   if (!vendor.vendorId) {
  return res.status(400).json({ message: "Invalid vendor data (no vendorId)" });
}

if (vendor.vendorId.toString() !== req.user.id) {
  return res.status(403).json({ message: "Not authorized" });
}

    await Vendor.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ⚠️ KEEP THIS LAST
router.get("/:type", getByType);

module.exports = router;