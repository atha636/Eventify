const express = require("express");
const router = express.Router();

const {
  createBooking,
  getBookings,
  getVendorBookings,
  updateBookingStatus,
  cancelBooking,
  requestDateChange,
  handleDateChangeRequest,
} = require("../controllers/bookingController");

const auth = require("../middleware/authMiddleware");

router.post("/", auth, createBooking);
router.get("/", auth, getBookings);
router.get("/vendor", auth, getVendorBookings);
router.put("/:id", auth, updateBookingStatus);
router.put("/cancel/:id", auth, cancelBooking);

// ── Date Change ──────────────────────────────────────────────────
// User requests a date change
router.post("/:id/date-change", auth, requestDateChange);
// Vendor approves or rejects a date change request
router.put("/:id/date-change", auth, handleDateChangeRequest);
// ────────────────────────────────────────────────────────────────

module.exports = router;