const Booking = require("../models/Booking");

exports.createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({
      userId: req.user,
      vendorId: req.body.vendorId,
      date: req.body.date
    });

    res.json(booking);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user });
    res.json(bookings);
  } catch (err) {
    res.status(500).json(err);
  }
};