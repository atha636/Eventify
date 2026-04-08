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
  getBookings,
  updateBookingStatus,
  deleteBooking,
} = require("../controllers/adminController");

// ── Auth (public) ─────────────────────────────────────────────────
router.post("/register", adminRegister);   // protected by ADMIN_SECRET in body
router.post("/login",    adminLogin);

// ── Dashboard stats ───────────────────────────────────────────────
router.get("/stats", adminAuth, getStats);

// ── Users ─────────────────────────────────────────────────────────
router.get   ("/users",             adminAuth, getUsers);
router.delete("/users/:id",         adminAuth, deleteUser);
router.put   ("/users/:id/role",    adminAuth, updateUserRole);

// ── Services ──────────────────────────────────────────────────────
router.get   ("/services",               adminAuth, getServices);
router.delete("/services/:id",           adminAuth, deleteService);
router.put   ("/services/:id/toggle",    adminAuth, toggleServiceApproval);

// ── Bookings ──────────────────────────────────────────────────────
router.get   ("/bookings",          adminAuth, getBookings);
router.put   ("/bookings/:id",      adminAuth, updateBookingStatus);
router.delete("/bookings/:id",      adminAuth, deleteBooking);

module.exports = router;