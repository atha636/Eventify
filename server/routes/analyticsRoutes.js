const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");

const { getVendorAnalytics } = require("../controllers/analyticsController");

// ── VENDOR ANALYTICS ─────────────────────────────────────────────
// GET /api/analytics/vendor?range=30|90|180|365|all
router.get("/vendor", auth, getVendorAnalytics);

module.exports = router;