const express = require("express");
const router = express.Router();
const {
  createVendor,
  getVendors,
  getByType,
  addService
} = require("../controllers/vendorController");

const auth = require("../middleware/authMiddleware");

router.post("/", auth, createVendor);
router.post("/add", auth, addService);

router.get("/", getVendors);
router.get("/:type", getByType);


module.exports = router;