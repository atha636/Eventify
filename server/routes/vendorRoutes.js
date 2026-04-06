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

// ── Multer wrapper (reused for add & edit) ──
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

// ADD SERVICE  (max 15 images)
router.post("/add", auth, uploadMiddleware, addService);

// EDIT SERVICE
router.put("/:id", auth, uploadMiddleware, editService);

// GET ALL
router.get("/", getVendors);

// MY SERVICES
router.get("/my-services", auth, getMyServices);

// DELETE SERVICE
router.delete("/:id", auth, deleteService);

// BY TYPE — keep LAST so it doesn't swallow other GET routes
router.get("/:type", getByType);

module.exports = router;