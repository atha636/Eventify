const express = require("express");
const router  = express.Router();

const {
  createVendor,
  getVendors,
  getByType,
  addService,
  editService,
  getMyServices,
  deleteService,
} = require("../controllers/vendorController");

const auth   = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const Vendor = require("../models/Vendor");

// ── Multer wrapper ──
const uploadMiddleware = (req, res, next) => {
  upload.array("images", 15)(req, res, (err) => {
    if (err) {
      console.error("MULTER ERROR:", err.message);
      return res.status(500).json({ error: err.message });
    }
    next();
  });
};

// CREATE (legacy)
router.post("/", auth, createVendor);

// ADD SERVICE
router.post("/add", auth, uploadMiddleware, addService);

// EDIT SERVICE
router.put("/:id", auth, uploadMiddleware, editService);

// GET ALL
router.get("/", getVendors);

// MY SERVICES
router.get("/my-services", auth, getMyServices);

// ✅ GET SINGLE VENDOR BY ID — must be before /:type
router.get("/single/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE SERVICE
router.delete("/:id", auth, deleteService);

// BY TYPE — keep LAST
router.get("/:type", getByType);

module.exports = router;