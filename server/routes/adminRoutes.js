const express = require("express");
const router  = express.Router();
const { adminAuth } = require("../middleware/authMiddleware");

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
  editServiceTitle,       // ← CHANGE 1
  deleteServiceImage,     // ← CHANGE 1
  getBookings,
  updateBookingStatus,
  deleteBooking,
  getPendingVendors,
  verifyVendorProfile,
} = require("../controllers/adminController");

// ── Auth (public) ────────────────────────────────────────────────
router.post("/register", adminRegister);
router.post("/login",    adminLogin);

// ── Dashboard stats ──────────────────────────────────────────────
router.get("/stats", adminAuth, getStats);

// ── Users ────────────────────────────────────────────────────────
router.get   ("/users",          adminAuth, getUsers);
router.delete("/users/:id",      adminAuth, deleteUser);
router.put   ("/users/:id/role", adminAuth, updateUserRole);

// ── Services ─────────────────────────────────────────────────────
router.get   ("/services",                   adminAuth, getServices);
router.delete("/services/:id",               adminAuth, deleteService);
router.put   ("/services/:id/toggle",        adminAuth, toggleServiceApproval);

// ── CHANGE 1: Title edit & image delete by admin ─────────────────
// PUT  /api/admin/services/:id/title    { title }
// DELETE /api/admin/services/:id/images { imageUrl }
router.put   ("/services/:id/title",         adminAuth, editServiceTitle);
router.delete("/services/:id/images",        adminAuth, deleteServiceImage);

// ── Bookings ─────────────────────────────────────────────────────
router.get   ("/bookings",     adminAuth, getBookings);
router.put   ("/bookings/:id", adminAuth, updateBookingStatus);
router.delete("/bookings/:id", adminAuth, deleteBooking);

// ── Vendor Profile Verification ──────────────────────────────────
// GET  /api/admin/vendor-verifications?status=pending|approved|rejected|all
// PUT  /api/admin/vendor-verifications/:id  { action: "approve"|"reject", reason? }
router.get("/vendor-verifications",     adminAuth, getPendingVendors);
router.put("/vendor-verifications/:id", adminAuth, verifyVendorProfile);

module.exports = router;