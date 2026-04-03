const express = require("express");
const router = express.Router();

const {
  createVendor,
  getVendors,
  getByType,
  addService,
  getMyServices,
  deleteService 
} = require("../controllers/vendorController");

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

// DELETE SERVICE ✅
router.delete("/:id", auth, deleteService);

// KEEP THIS LAST
router.get("/:type", getByType);

module.exports = router;