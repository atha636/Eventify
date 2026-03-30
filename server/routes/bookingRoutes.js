const express = require("express");
const router = express.Router();


const {
  createBooking,
  getBookings,
  getVendorBookings,
  updateBookingStatus
} = require("../controllers/bookingController");

const auth = require("../middleware/authMiddleware");

router.post("/", auth, createBooking);
router.get("/", auth, getBookings);


// 👉 ADD THIS
router.get("/vendor", auth, getVendorBookings);

router.put("/:id", auth, updateBookingStatus);

module.exports = router;