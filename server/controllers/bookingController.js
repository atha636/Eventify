const Booking = require("../models/Booking");
const Vendor = require("../models/Vendor");
const { sendEmail } = require("../utils/sendEmail");
const User = require("../models/User");

exports.createBooking = async (req, res) => {
  try {

    // 🔐 BLOCK VENDORS
    if (req.user.role === "vendor") {
      return res.status(403).json({ error: "Vendors cannot book services" });
    }

    const { vendorId, date } = req.body;

    // ❌ Check if date exists
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

    // ✅ CHECK VENDOR FIRST (before creating booking)
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: "Service not found" });
    }

    // ❌ Double booking check
    const existingBooking = await Booking.findOne({ vendorId, date: selectedDate });
    if (existingBooking) {
      return res.status(400).json({ error: "This date is already booked. Please choose another date." });
    }

    // ✅ NOW create booking
    const booking = await Booking.create({
      userId: req.user.id,
      vendorId,
      date: selectedDate
    });

    // ✅ Respond immediately — don't make user wait for emails!
    res.json(booking);

    // ✅ Send emails in background (non-blocking, fire and forget)
    setImmediate(async () => {
      try {
        const [vendorUser, user] = await Promise.all([
          User.findById(vendor.vendorId),
          User.findById(req.user.id)
        ]);

        const emailPromises = [];

        if (vendorUser?.email) {
          emailPromises.push(sendEmail({
            to: vendorUser.email,
            subject: "New Booking Received 🎉",
            text: `Hello ${vendorUser.name},\n\nYou have received a new booking!\n\nService: ${vendor.title}\nDate: ${booking.date}\n\n- Eventify Team`
          }));
        }

        if (user?.email) {
          emailPromises.push(sendEmail({
            to: user.email,
            subject: "Booking Confirmed 🎉",
            text: `Hello ${user.name},\n\nYour booking has been placed successfully!\n\nService: ${vendor.title}\nDate: ${booking.date}\n\nThe vendor will respond soon.\n\n- Eventify Team`
          }));
        }

        await Promise.all(emailPromises);
      } catch (emailErr) {
        console.error("EMAIL ERROR (non-critical):", emailErr);
      }
    });

  } catch (err) {
    console.error("BOOKING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate("vendorId", "title serviceType location images packages rating");
    res.json(bookings);
  } catch (err) {
    res.status(500).json(err);
  }
};

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

    // ✅ Send email in background
    setImmediate(async () => {
      try {
        const [user, vendor] = await Promise.all([
          User.findById(booking.userId),
          Vendor.findById(booking.vendorId)
        ]);

        if (user?.email) {
          if (booking.status === "approved") {
            await sendEmail({
              to: user.email,
              subject: "Booking Approved 🎉",
              text: `Hello ${user.name},\n\nYour booking has been ACCEPTED!\n\nService: ${vendor?.title}\nDate: ${booking.date}\n\nGet ready for your event 🚀\n\n- Eventify Team`
            });
          }

          if (booking.status === "rejected") {
            await sendEmail({
              to: user.email,
              subject: "Booking Rejected ❌",
              text: `Hello ${user.name},\n\nSorry, your booking has been rejected.\n\nService: ${vendor?.title}\nDate: ${booking.date}\n\nYou can explore other vendors on Eventify.\n\n- Eventify Team`
            });
          }
        }
      } catch (emailErr) {
        console.error("EMAIL ERROR (non-critical):", emailErr);
      }
    });

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

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    booking.status = "cancelled";
    await booking.save();

    // ✅ Respond immediately
    res.json({ message: "Booking cancelled successfully", booking });

    // ✅ Send email in background
    setImmediate(async () => {
      try {
        const [vendor, user] = await Promise.all([
          Vendor.findById(booking.vendorId),
          User.findById(booking.userId)
        ]);

        const vendorUser = vendor ? await User.findById(vendor.vendorId) : null;

        if (vendorUser?.email) {
          await sendEmail({
            to: vendorUser.email,
            subject: "Booking Cancelled ❌",
            text: `Hello ${vendorUser.name},\n\nA booking has been cancelled by the user.\n\nService: ${vendor?.title}\nDate: ${booking.date}\n\nCancelled by: ${user?.name}\n\n- Eventify Team`
          });
        }
      } catch (emailErr) {
        console.error("EMAIL ERROR (non-critical):", emailErr);
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

    // Only the owner can request
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Only pending or approved bookings can request a date change
    if (!["pending", "approved"].includes(booking.status)) {
      return res.status(400).json({ error: "Cannot request date change for this booking" });
    }

    // Block if a date change request is already pending
    if (booking.dateChangeRequest?.status === "pending") {
      return res.status(400).json({ error: "A date change request is already pending" });
    }

    const { requestedDate, reason } = req.body;

    if (!requestedDate) {
      return res.status(400).json({ error: "New date is required" });
    }

    const newDate = new Date(requestedDate);
    if (isNaN(newDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate <= today) {
      return res.status(400).json({ error: "Requested date must be in the future" });
    }

    booking.dateChangeRequest = {
      requestedDate: newDate,
      reason: reason || "",
      status: "pending",
      requestedAt: new Date(),
      respondedAt: null,
    };

    await booking.save();
    res.json({ message: "Date change request submitted", booking });

    // Send email to vendor in background
    setImmediate(async () => {
      try {
        const vendor = await Vendor.findById(booking.vendorId);
        const vendorUser = vendor ? await User.findById(vendor.vendorId) : null;
        const user = await User.findById(booking.userId);

        if (vendorUser?.email) {
          await sendEmail({
            to: vendorUser.email,
            subject: "Date Change Request 📅",
            text: `Hello ${vendorUser.name},\n\nA customer has requested a date change for their booking.\n\nService: ${vendor?.title}\nOriginal Date: ${booking.date}\nRequested Date: ${newDate}\nReason: ${reason || "No reason provided"}\nCustomer: ${user?.name}\n\nPlease log in to approve or reject this request.\n\n- Eventify Team`
          });
        }
      } catch (emailErr) {
        console.error("EMAIL ERROR (non-critical):", emailErr);
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

    // Verify the vendor owns this booking
    const vendor = await Vendor.findById(booking.vendorId);
    if (!vendor || vendor.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (booking.dateChangeRequest?.status !== "pending") {
      return res.status(400).json({ error: "No pending date change request" });
    }

    const { action } = req.body; // "approve" | "reject"
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be approve or reject" });
    }

    booking.dateChangeRequest.status = action === "approve" ? "approved" : "rejected";
    booking.dateChangeRequest.respondedAt = new Date();

    // If approved, update the actual booking date
    if (action === "approve") {
      booking.date = booking.dateChangeRequest.requestedDate;
    }

    await booking.save();
    res.json({ message: `Date change ${booking.dateChangeRequest.status}`, booking });

    // Notify user via email in background
    setImmediate(async () => {
      try {
        const user = await User.findById(booking.userId);
        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: action === "approve"
              ? "Date Change Approved ✅"
              : "Date Change Rejected ❌",
            text: action === "approve"
              ? `Hello ${user.name},\n\nGreat news! Your date change request has been approved.\n\nService: ${vendor?.title}\nNew Date: ${booking.date}\n\n- Eventify Team`
              : `Hello ${user.name},\n\nUnfortunately, your date change request has been rejected.\n\nService: ${vendor?.title}\nOriginal Date: ${booking.date}\n\nPlease contact the vendor for alternatives.\n\n- Eventify Team`
          });
        }
      } catch (emailErr) {
        console.error("EMAIL ERROR (non-critical):", emailErr);
      }
    });

  } catch (err) {
    console.error("HANDLE DATE CHANGE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};