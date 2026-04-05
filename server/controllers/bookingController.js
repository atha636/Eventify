const Booking = require("../models/Booking");
const Vendor = require("../models/Vendor");
const { sendEmail } = require("../utils/sendEmail");
const User = require("../models/User");

exports.createBooking = async (req, res) => {
  try {

 // 🔐 BLOCK VENDORS
    if (req.user.role === "vendor") {
      return res.status(403).json({
        error: "Vendors cannot book services"
      });
    }

const { vendorId, date } = req.body;

// ❌ Check if date exists
if (!date) {
  return res.status(400).json({ error: "Date is required" });
}

// Convert date
const selectedDate = new Date(date);

// ❌ Invalid date
if (isNaN(selectedDate.getTime())) {
  return res.status(400).json({ error: "Invalid date format" });
}

// ❌ Past date
const today = new Date();
today.setHours(0, 0, 0, 0);

if (selectedDate <= today) {
  return res.status(400).json({ error: "Please select a future date" });
}

// ❌ Unrealistic year (fix 22222 issue)
if (selectedDate.getFullYear() > 2100) {
  return res.status(400).json({ error: "Invalid date selected" });
}

// ❌ Double booking check
const existingBooking = await Booking.findOne({
  vendorId,
  date: selectedDate,
});

if (existingBooking) {
  return res.status(400).json({
    error: "This date is already booked. Please choose another date.",
  });
}


    const booking = await Booking.create({
      userId: req.user.id,
      vendorId: req.body.vendorId,
      date: selectedDate
    });

    // ✅ STEP 1: Get service
    const vendor = await Vendor.findById(req.body.vendorId);
    if (!vendor) {
      return res.status(404).json({ error: "Service not found" });
    }

    // ✅ STEP 2: Vendor email
    const vendorUser = await User.findById(vendor.vendorId);

    if (vendorUser?.email) {
      await sendEmail({
        to: vendorUser.email,
        subject: "New Booking Received 🎉",
        text: `
Hello ${vendorUser.name},

You have received a new booking!

Service: ${vendor.title}
Date: ${booking.date}

- Eventify Team
        `
      });
    }

    // ✅ STEP 3: USER EMAIL (ADD THIS 🔥)
    const user = await User.findById(req.user.id);

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Booking Confirmed 🎉",
        text: `
Hello ${user.name},

Your booking has been placed successfully!

Service: ${vendor.title}
Date: ${booking.date}

The vendor will respond soon.

- Eventify Team
        `
      });
    }

    res.json(booking);

  } catch (err) {
    console.error("BOOKING ERROR:", err);
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
    const vendors = await Vendor.find({ vendorId: req.user.id });

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

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // ✅ Update status
    booking.status = req.body.status;
    await booking.save();

    // ✅ Get user
    const user = await User.findById(booking.userId);

    // ✅ Get service
    const vendor = await Vendor.findById(booking.vendorId);

    if (user?.email) {
      // 🎉 ACCEPTED
      if (booking.status === "approved") {
        await sendEmail({
          to: user.email,
          subject: "Booking Approved 🎉",
          text: `
Hello ${user.name},

Your booking has been ACCEPTED!

Service: ${vendor.title}
Date: ${booking.date}

Get ready for your event 🚀

- Eventify Team
          `
        });
      }

      // ❌ REJECTED
      if (booking.status === "rejected") {
        await sendEmail({
          to: user.email,
          subject: "Booking Rejected ❌",
          text: `
Hello ${user.name},

Sorry, your booking has been rejected.

Service: ${vendor.title}
Date: ${booking.date}

You can explore other vendors on Eventify.

- Eventify Team
          `
        });
      }
    }

    res.json(booking);

  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json(err);
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // ✅ Only user who booked can cancel
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // ✅ Update status
    booking.status = "cancelled";
    await booking.save();

    // ✅ Get vendor service
    const vendor = await Vendor.findById(booking.vendorId);

    // ✅ Get vendor user
    const vendorUser = await User.findById(vendor.vendorId);

    // ✅ Get user
    const user = await User.findById(booking.userId);

    // ✅ Send email to vendor
    if (vendorUser?.email) {
      await sendEmail({
        to: vendorUser.email,
        subject: "Booking Cancelled ❌",
        text: `
Hello ${vendorUser.name},

A booking has been cancelled by the user.

Service: ${vendor.title}
Date: ${booking.date}

Cancelled by: ${user?.name}

- Eventify Team
        `
      });
    }

    res.json({ message: "Booking cancelled successfully", booking });

  } catch (err) {
    console.error("CANCEL BOOKING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};