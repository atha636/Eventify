const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings
} = require("../controllers/bookingController");

const auth = require("../middleware/authMiddleware");

router.post("/", auth, createBooking);
router.get("/", auth, getBookings);

module.exports = router;