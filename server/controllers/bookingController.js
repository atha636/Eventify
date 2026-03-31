const Booking = require("../models/Booking");
const Vendor = require("../models/Vendor");
exports.createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({
      userId: req.user.id ,
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
    const bookings = await Booking.find({ userId: req.user.id });
    res.json(bookings);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getVendorBookings = async (req, res) => {
  try {
    // ✅ get all services created by this vendor
    const vendors = await Vendor.find({ userId: req.user.id });

    const vendorIds = vendors.map(v => v._id);

    // ✅ get bookings for ALL services
    const bookings = await Booking.find({
      vendorId: { $in: vendorIds }
    }).populate("userId", "name email");

    res.json(bookings);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    booking.status = req.body.status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    res.status(500).json(err);
  }
};