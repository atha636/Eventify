const Booking = require("../models/Booking");
const Vendor = require("../models/Vendor");
const Notification = require("../models/Notification");
const { sendEmail } = require("../utils/sendEmail");
const User = require("../models/User");

// ── Helper: create a notification ────────────────────────────────
async function createNotification({ userId, type, title, message, bookingId }) {
  try {
    await Notification.create({ userId, type, title, message, bookingId });
  } catch (err) {
    console.error("NOTIFICATION CREATE ERROR (non-critical):", err);
  }
}

// ── CREATE BOOKING ────────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    // 🔐 BLOCK VENDORS
    if (req.user.role === "vendor") {
      return res.status(403).json({ error: "Vendors cannot book services" });
    }

    const { vendorId, date, packageName, packagePrice, userDetails } = req.body;

    // Validate userDetails
    if (!userDetails?.name || !userDetails?.phone || !userDetails?.address) {
      return res.status(400).json({ error: "Name, phone, and address are required" });
    }

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) {
      return res.status(400).json({ error: "Please select a future date" });
    }
    if (selectedDate.getFullYear() > 2100) {
      return res.status(400).json({ error: "Invalid date selected" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Double booking check
    const existingBooking = await Booking.findOne({ vendorId, date: selectedDate });
    if (existingBooking) {
      return res.status(400).json({ error: "This date is already booked. Please choose another date." });
    }

    // Create booking
    const booking = await Booking.create({
      userId: req.user.id,
      vendorId,
      date: selectedDate,
      packageName,
      packagePrice,
      userDetails: {
        name:    userDetails.name.trim(),
        phone:   userDetails.phone.trim(),
        address: userDetails.address.trim(),
      },
    });

    // ✅ Respond immediately
    res.json(booking);

    // ✅ Notifications + emails in background
    setImmediate(async () => {
      try {
        const [vendorUser, user] = await Promise.all([
          User.findById(vendor.vendorId),
          User.findById(req.user.id),
        ]);

        // Notify vendor: new booking received
        if (vendor.vendorId) {
          await createNotification({
            userId: vendor.vendorId,
            type: "booking_received",
            title: "New Booking Request",
            message: `${userDetails.name} wants to book "${vendor.title}" for ${new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
            bookingId: booking._id,
          });
        }

        // Send emails
        const emailPromises = [];
        if (vendorUser?.email) {
          emailPromises.push(sendEmail({
            to: vendorUser.email,
            subject: "New Booking Received 🎉",
            text: `Hello ${vendorUser.name},\n\nYou have received a new booking!\n\nService: ${vendor.title}\nDate: ${booking.date}\nCustomer: ${userDetails.name}\nPhone: ${userDetails.phone}\nAddress: ${userDetails.address}\n\n- Eventify Team`,
          }));
        }
        if (user?.email) {
          emailPromises.push(sendEmail({
            to: user.email,
            subject: "Booking Request Sent 🎉",
            text: `Hello ${user.name},\n\nYour booking request has been sent!\n\nService: ${vendor.title}\nDate: ${booking.date}\n\nThe vendor will confirm soon. You'll be notified.\n\n- Eventify Team`,
          }));
        }
        await Promise.all(emailPromises);
      } catch (err) {
        console.error("BACKGROUND ERROR:", err);
      }
    });

  } catch (err) {
    console.error("BOOKING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET USER BOOKINGS ─────────────────────────────────────────────
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate("vendorId", "title serviceType location images packages rating");
    res.json(bookings);
  } catch (err) {
    res.status(500).json(err);
  }
};

// ── GET VENDOR BOOKINGS ───────────────────────────────────────────
exports.getVendorBookings = async (req, res) => {
  try {
    const vendors = await Vendor.find({ vendorId: req.user.id });
    const vendorIds = vendors.map(v => v._id);

    const bookings = await Booking.find({
      vendorId: { $in: vendorIds }
    }).populate("userId", "name email");

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── UPDATE BOOKING STATUS (vendor approves / rejects) ────────────
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    booking.status = req.body.status;
    await booking.save();

    // ✅ Respond immediately
    res.json(booking);

    // ✅ Notifications + emails in background
    setImmediate(async () => {
      try {
        const [user, vendor] = await Promise.all([
          User.findById(booking.userId),
          Vendor.findById(booking.vendorId),
        ]);

        if (booking.status === "approved") {
          // Notify user: vendor approved → prompt to pay
          await createNotification({
            userId: booking.userId,
            type: "payment_pending",
            title: "🎉 Vendor Confirmed Your Booking!",
            message: `${vendor?.title || "Your vendor"} has confirmed your booking for ${new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Pay now to lock it in!`,
            bookingId: booking._id,
          });

          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: "Booking Approved — Pay Now to Confirm 🎉",
              text: `Hello ${user.name},\n\nGreat news! Your booking has been APPROVED!\n\nService: ${vendor?.title}\nDate: ${booking.date}\n\nPlease log in to Eventify and complete your payment to confirm the booking.\n\n- Eventify Team`,
            });
          }
        }

        if (booking.status === "rejected") {
          // Notify user: vendor rejected
          await createNotification({
            userId: booking.userId,
            type: "booking_rejected",
            title: "Booking Declined",
            message: `Unfortunately, ${vendor?.title || "the vendor"} could not accept your booking for ${new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Try another vendor!`,
            bookingId: booking._id,
          });

          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: "Booking Rejected ❌",
              text: `Hello ${user.name},\n\nSorry, your booking has been rejected.\n\nService: ${vendor?.title}\nDate: ${booking.date}\n\nYou can explore other vendors on Eventify.\n\n- Eventify Team`,
            });
          }
        }
      } catch (err) {
        console.error("BACKGROUND ERROR:", err);
      }
    });

  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json(err);
  }
};

// ── CANCEL BOOKING ────────────────────────────────────────────────
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });

    setImmediate(async () => {
      try {
        const [vendor, user] = await Promise.all([
          Vendor.findById(booking.vendorId),
          User.findById(booking.userId),
        ]);
        const vendorUser = vendor ? await User.findById(vendor.vendorId) : null;

        if (vendorUser?.email) {
          await sendEmail({
            to: vendorUser.email,
            subject: "Booking Cancelled ❌",
            text: `Hello ${vendorUser.name},\n\nA booking has been cancelled.\n\nService: ${vendor?.title}\nDate: ${booking.date}\nCancelled by: ${user?.name}\n\n- Eventify Team`,
          });
        }
      } catch (err) {
        console.error("BACKGROUND ERROR:", err);
      }
    });

  } catch (err) {
    console.error("CANCEL BOOKING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── DATE CHANGE REQUEST (user sends) ─────────────────────────────
exports.requestDateChange = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!["pending", "approved"].includes(booking.status)) {
      return res.status(400).json({ error: "Cannot request date change for this booking" });
    }

    if (booking.dateChangeRequest?.status === "pending") {
      return res.status(400).json({ error: "A date change request is already pending" });
    }

    const { requestedDate, reason } = req.body;
    if (!requestedDate) return res.status(400).json({ error: "New date is required" });

    const newDate = new Date(requestedDate);
    if (isNaN(newDate.getTime())) return res.status(400).json({ error: "Invalid date format" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate <= today) return res.status(400).json({ error: "Requested date must be in the future" });

    booking.dateChangeRequest = {
      requestedDate: newDate,
      reason: reason || "",
      status: "pending",
      requestedAt: new Date(),
      respondedAt: null,
    };

    await booking.save();
    res.json({ message: "Date change request submitted", booking });

    setImmediate(async () => {
      try {
        const vendor = await Vendor.findById(booking.vendorId);
        const vendorUser = vendor ? await User.findById(vendor.vendorId) : null;
        const user = await User.findById(booking.userId);

        if (vendorUser?.email) {
          await sendEmail({
            to: vendorUser.email,
            subject: "Date Change Request 📅",
            text: `Hello ${vendorUser.name},\n\nA customer has requested a date change.\n\nService: ${vendor?.title}\nOriginal Date: ${booking.date}\nRequested Date: ${newDate}\nReason: ${reason || "No reason provided"}\nCustomer: ${user?.name}\n\n- Eventify Team`,
          });
        }
      } catch (err) {
        console.error("BACKGROUND ERROR:", err);
      }
    });

  } catch (err) {
    console.error("DATE CHANGE REQUEST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── HANDLE DATE CHANGE REQUEST (vendor approves/rejects) ─────────
exports.handleDateChangeRequest = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("vendorId");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const vendor = await Vendor.findById(booking.vendorId);
    if (!vendor || vendor.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (booking.dateChangeRequest?.status !== "pending") {
      return res.status(400).json({ error: "No pending date change request" });
    }

    const { action } = req.body;
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be approve or reject" });
    }

    booking.dateChangeRequest.status = action === "approve" ? "approved" : "rejected";
    booking.dateChangeRequest.respondedAt = new Date();

    if (action === "approve") {
      booking.date = booking.dateChangeRequest.requestedDate;
    }

    await booking.save();
    res.json({ message: `Date change ${booking.dateChangeRequest.status}`, booking });

    setImmediate(async () => {
      try {
        const user = await User.findById(booking.userId);
        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: action === "approve" ? "Date Change Approved ✅" : "Date Change Rejected ❌",
            text: action === "approve"
              ? `Hello ${user.name},\n\nYour date change has been approved.\n\nNew Date: ${booking.date}\n\n- Eventify Team`
              : `Hello ${user.name},\n\nYour date change request was rejected.\n\nOriginal Date: ${booking.date}\n\n- Eventify Team`,
          });
        }
      } catch (err) {
        console.error("BACKGROUND ERROR:", err);
      }
    });

  } catch (err) {
    console.error("HANDLE DATE CHANGE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};