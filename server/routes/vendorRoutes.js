const express = require("express");
const router = express.Router();

const {
  createVendor,
  getVendors,
  getByType,
  addService
} = require("../controllers/vendorController");

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/", auth, createVendor);

// ✅ Multer error wrapper
router.post("/add", auth, (req, res, next) => {
  upload.array("images", 10)(req, res, (err) => {
    if (err) {
      console.error("MULTER ERROR:", err.message);
      return res.status(500).json({ error: err.message });
    }
    next();
  });
}, addService);

router.get("/", getVendors);
router.get("/:type", getByType);

module.exports = router;