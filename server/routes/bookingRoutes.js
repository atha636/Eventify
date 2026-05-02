const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");

const {
  createBooking,
  getUserBookings,
  getVendorBookings,
  updateBookingStatus,
  confirmEvent,
  cancelBooking,
  requestChange,
  respondToChange,
} = require("../controllers/bookingController");

// ── CREATE BOOKING ───────────────────────────────────────────────
// POST /api/bookings
// Body: { vendorId, date, packageName, packagePrice, userDetails, paymentPlan }
router.post("/", auth, createBooking);

// ── GET USER BOOKINGS ────────────────────────────────────────────
// GET /api/bookings
router.get("/", auth, getUserBookings);

// ── GET VENDOR BOOKINGS ──────────────────────────────────────────
// GET /api/bookings/vendor
router.get("/vendor", auth, getVendorBookings);

// ── VENDOR APPROVES / REJECTS ────────────────────────────────────
// PUT /api/bookings/:id/status
// Body: { status: "approved" | "rejected" }
router.put("/:id/status", auth, updateBookingStatus);

// ── CONFIRM EVENT (both user and vendor) ─────────────────────────
// POST /api/bookings/:id/confirm-event
// Body: { role: "vendor" | "user" }
// This endpoint is called AFTER the event takes place.
// When BOTH parties confirm → final installment payment link is unlocked.
router.post("/:id/confirm-event", auth, confirmEvent);

// ── CANCEL BOOKING ───────────────────────────────────────────────
// DELETE /api/bookings/:id
router.delete("/:id", auth, cancelBooking);

// ── REQUEST DATE / ADDRESS CHANGE ────────────────────────────────
// POST /api/bookings/:id/change-request
// Body: { requestedDate?, requestedAddress?, reason }
router.post("/:id/change-request", auth, requestChange);

// ── RESPOND TO CHANGE REQUEST (vendor) ──────────────────────────
// PUT /api/bookings/:id/change-request
// Body: { action: "approved" | "rejected" }
router.put("/:id/change-request", auth, respondToChange);

module.exports = router;