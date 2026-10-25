const express   = require("express");
const rateLimit = require("express-rate-limit");
const router    = express.Router();
const { adminAuth } = require("../middleware/authMiddleware");
const { uploadAvatar } = require("../middleware/upload");

// ── Multer wrapper (mirrors vendorRoutes.js's pattern) ─────────────
// Surfaces multer errors as clean JSON instead of an unhandled 500.
const uploadAvatarMiddleware = (req, res, next) => {
  uploadAvatar.single("photo")(req, res, (err) => {
    if (err) {
      console.error("ADMIN VENDOR PHOTO UPLOAD ERROR:", err.message);
      return res.status(400).json({ msg: err.message });
    }
    next();
  });
};

// ── Strict limiter for the two public admin auth endpoints ───────────
// BUG FIX: these previously only sat behind the generous global limiter
// (300 req/15min in prod) — the same brute-force protection /api/auth
// gets (10 req/15min) belongs here too, arguably more so since an admin
// account is a higher-value target. Scoped to just login/register so it
// doesn't throttle normal admin-dashboard polling.
const isDev = process.env.NODE_ENV !== "production";
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in 15 minutes." },
});

const {
  adminRegister,
  adminLogin,
  getStats,
  getUsers,
  deleteUser,
  updateUserRole,
  getServices,
  deleteService,
  toggleServiceApproval,
  editServiceTitle,
  deleteServiceImage,
  getBookings,
  updateBookingStatus,
  deleteBooking,
  getPendingVendors,
  verifyVendorProfile,
  toggleVendorVerified,       // ← NEW: trust badge toggle
  createVendorByAdmin,        // ← NEW: admin onboards a vendor directly
} = require("../controllers/adminController");

// ── Auth (public) ────────────────────────────────────────────────
router.post("/register", adminAuthLimiter, adminRegister);
router.post("/login",    adminAuthLimiter, adminLogin);

// ── Dashboard stats ──────────────────────────────────────────────
router.get("/stats", adminAuth, getStats);

// ── Users ────────────────────────────────────────────────────────
router.get   ("/users",          adminAuth, getUsers);
router.delete("/users/:id",      adminAuth, deleteUser);
router.put   ("/users/:id/role", adminAuth, updateUserRole);

// ── Admin-created vendor accounts ───────────────────────────────
// POST /api/admin/vendors  (multipart: name, email, phone?, photo?)
// Creates a pre-approved vendor account with a temp password, emailed
// to the vendor. They're nagged to change it on first login.
router.post("/vendors", adminAuth, uploadAvatarMiddleware, createVendorByAdmin);

// ── Services ─────────────────────────────────────────────────────
router.get   ("/services",            adminAuth, getServices);
router.delete("/services/:id",        adminAuth, deleteService);
router.put   ("/services/:id/toggle", adminAuth, toggleServiceApproval);
router.put   ("/services/:id/title",  adminAuth, editServiceTitle);
router.delete("/services/:id/images", adminAuth, deleteServiceImage);

// ── Bookings ─────────────────────────────────────────────────────
router.get   ("/bookings",     adminAuth, getBookings);
router.put   ("/bookings/:id", adminAuth, updateBookingStatus);
router.delete("/bookings/:id", adminAuth, deleteBooking);

// ── Vendor Profile Verification ──────────────────────────────────
// GET  /api/admin/vendor-verifications?status=pending|approved|rejected|all
// PUT  /api/admin/vendor-verifications/:id          { action: "approve"|"reject", reason? }
// PUT  /api/admin/vendor-verifications/:id/badge    (toggle trust badge)
router.get("/vendor-verifications",           adminAuth, getPendingVendors);
router.put("/vendor-verifications/:id",       adminAuth, verifyVendorProfile);
router.put("/vendor-verifications/:id/badge", adminAuth, toggleVendorVerified);

module.exports = router;