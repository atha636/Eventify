const Booking      = require("../models/Booking");
const Vendor       = require("../models/Vendor");
const Notification = require("../models/Notification");
const { sendEmail } = require("../utils/sendEmail");
const User          = require("../models/User");

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
    if (req.user.role === "vendor") {
      return res.status(403).json({ error: "Vendors cannot book services" });
    }

    const { vendorId, date, packageName, packagePrice, userDetails } = req.body;

    if (!userDetails?.name || !userDetails?.phone || !userDetails?.address) {
      return res.status(400).json({ error: "Name, phone, and address are required" });
    }
    if (!date) return res.status(400).json({ error: "Date is required" });

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) return res.status(400).json({ error: "Invalid date format" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) return res.status(400).json({ error: "Please select a future date" });
    if (selectedDate.getFullYear() > 2100) return res.status(400).json({ error: "Invalid date selected" });

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ error: "Service not found" });

    const existingBooking = await Booking.findOne({ vendorId, date: selectedDate });
    if (existingBooking) return res.status(400).json({ error: "This date is already booked. Please choose another date." });

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

    res.json(booking);

    setImmediate(async () => {
      try {
        const [vendorUser, user] = await Promise.all([
          User.findById(vendor.vendorId),
          User.findById(req.user.id),
        ]);

        if (vendor.vendorId) {
          await createNotification({
            userId:    vendor.vendorId,
            type:      "booking_received",
            title:     "New Booking Request",
            message:   `${userDetails.name} wants to book "${vendor.title}" for ${new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
            bookingId: booking._id,
          });
        }

        const emailPromises = [];
        if (vendorUser?.email) {
          emailPromises.push(sendEmail({
            to:      vendorUser.email,
            subject: "New Booking Received 🎉",
            text:    `Hello ${vendorUser.name},\n\nYou have received a new booking!\n\nService: ${vendor.title}\nDate: ${booking.date}\nCustomer: ${userDetails.name}\nPhone: ${userDetails.phone}\nAddress: ${userDetails.address}\n\n- Evencers Team`,
          }));
        }
        if (user?.email) {
          emailPromises.push(sendEmail({
            to:      user.email,
            subject: "Booking Request Sent 🎉",
            text:    `Hello ${user.name},\n\nYour booking request has been sent!\n\nService: ${vendor.title}\nDate: ${booking.date}\n\nThe vendor will confirm soon. You'll be notified.\n\n- Evencers Team`,
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
    const vendors    = await Vendor.find({ vendorId: req.user.id });
    const vendorIds  = vendors.map((v) => v._id);
    const bookings   = await Booking.find({ vendorId: { $in: vendorIds } })
      .populate("userId", "name email");
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
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    booking.status = req.body.status;
    await booking.save();

    res.json(booking);

    setImmediate(async () => {
      try {
        const [user, vendor] = await Promise.all([
          User.findById(booking.userId),
          Vendor.findById(booking.vendorId),
        ]);

        if (booking.status === "approved") {
          await createNotification({
            userId:    booking.userId,
            type:      "payment_pending",
            title:     "🎉 Vendor Confirmed Your Booking!",
            message:   `${vendor?.title || "Your vendor"} has confirmed your booking for ${new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Pay now to lock it in!`,
            bookingId: booking._id,
          });
          if (user?.email) {
            await sendEmail({
              to:      user.email,
              subject: "Booking Approved — Pay Now to Confirm 🎉",
              text:    `Hello ${user.name},\n\nGreat news! Your booking has been APPROVED!\n\nService: ${vendor?.title}\nDate: ${booking.date}\n\nPlease log in to Evencers and complete your payment to confirm the booking.\n\n- Evencers Team`,
            });
          }
        }

        if (booking.status === "rejected") {
          await createNotification({
            userId:    booking.userId,
            type:      "booking_rejected",
            title:     "Booking Declined",
            message:   `Unfortunately, ${vendor?.title || "the vendor"} could not accept your booking for ${new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Try another vendor!`,
            bookingId: booking._id,
          });
          if (user?.email) {
            await sendEmail({
              to:      user.email,
              subject: "Booking Rejected ❌",
              text:    `Hello ${user.name},\n\nSorry, your booking has been rejected.\n\nService: ${vendor?.title}\nDate: ${booking.date}\n\nYou can explore other vendors on Evencers.\n\n- Evencers Team`,
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
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.userId.toString() !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });

    setImmediate(async () => {
      try {
        const [vendor, user]  = await Promise.all([
          Vendor.findById(booking.vendorId),
          User.findById(booking.userId),
        ]);
        const vendorUser = vendor ? await User.findById(vendor.vendorId) : null;

        if (vendorUser?.email) {
          await sendEmail({
            to:      vendorUser.email,
            subject: "Booking Cancelled ❌",
            text:    `Hello ${vendorUser.name},\n\nA booking has been cancelled.\n\nService: ${vendor?.title}\nDate: ${booking.date}\nCancelled by: ${user?.name}\n\n- Evencers Team`,
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

// ═══════════════════════════════════════════════════════════════
// CHANGE 2 — DATE + ADDRESS CHANGE FLOW
// ═══════════════════════════════════════════════════════════════

// ── DATE + ADDRESS CHANGE REQUEST (user sends) ───────────────────
// POST /api/bookings/:id/date-change
// body: { requestedDate?, requestedAddress?, reason? }
// At least one of requestedDate or requestedAddress is required.
exports.requestDateChange = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!["pending", "approved"].includes(booking.status)) {
      return res.status(400).json({ error: "Cannot request changes for this booking" });
    }

    if (booking.dateChangeRequest?.status === "pending") {
      return res.status(400).json({ error: "A change request is already pending. Wait for the vendor to respond." });
    }

    const { requestedDate, requestedAddress, reason } = req.body;

    if (!requestedDate && !requestedAddress) {
      return res.status(400).json({ error: "Please provide a new date or a new address (or both)" });
    }

    // Validate date if provided
    let newDate = null;
    if (requestedDate) {
      newDate = new Date(requestedDate);
      if (isNaN(newDate.getTime())) return res.status(400).json({ error: "Invalid date format" });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate <= today) return res.status(400).json({ error: "Requested date must be in the future" });
    }

    // Build change request — store both date + address in the request
    booking.dateChangeRequest = {
      requestedDate:    newDate || booking.dateChangeRequest?.requestedDate || null,
      requestedAddress: requestedAddress?.trim() || null,
      reason:           reason?.trim() || "",
      status:           "pending",
      requestedAt:      new Date(),
      respondedAt:      null,
    };

    await booking.save();

    // Build a human-readable summary of what changed
    const changeItems = [];
    if (newDate)             changeItems.push(`Date → ${newDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`);
    if (requestedAddress)    changeItems.push(`Address → ${requestedAddress.trim()}`);
    const changeSummary = changeItems.join(" · ");

    res.json({ message: "Change request submitted. Please wait for the vendor to respond.", booking });

    setImmediate(async () => {
      try {
        const vendor     = await Vendor.findById(booking.vendorId);
        const vendorUser = vendor ? await User.findById(vendor.vendorId) : null;
        const user       = await User.findById(booking.userId);

        // ── CHANGE 2: Notify vendor with "date_change_requested" type ──
        // The vendor dashboard reads this type to show the popup
        if (vendorUser?._id) {
          await createNotification({
            userId:    vendorUser._id,
            type:      "date_change_requested",
            title:     "📅 Client Wants to Change Booking Details",
            message:   `${user?.name || "A client"} wants to change: ${changeSummary}${reason ? ` · Reason: ${reason}` : ""}`,
            bookingId: booking._id,
          });
        }

        if (vendorUser?.email) {
          await sendEmail({
            to:      vendorUser.email,
            subject: "Booking Change Request 📅",
            text:    `Hello ${vendorUser.name},\n\nA client has requested changes to their booking.\n\nService: ${vendor?.title}\nClient: ${user?.name}\nChanges Requested:\n${changeItems.map((c) => `  • ${c}`).join("\n")}${reason ? `\nReason: ${reason}` : ""}\n\nPlease log in to your dashboard to accept or reject this request.\n\n- Evencers Team`,
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

// ── HANDLE DATE + ADDRESS CHANGE REQUEST (vendor approves/rejects) ──
// PUT /api/bookings/:id/date-change
// body: { action: "approve" | "reject" }
exports.handleDateChangeRequest = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("vendorId");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const vendor = await Vendor.findById(booking.vendorId);
    if (!vendor || vendor.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (booking.dateChangeRequest?.status !== "pending") {
      return res.status(400).json({ error: "No pending change request" });
    }

    const { action } = req.body;
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be approve or reject" });
    }

    const approved = action === "approve";
    booking.dateChangeRequest.status      = approved ? "approved" : "rejected";
    booking.dateChangeRequest.respondedAt = new Date();

    // Apply the changes to the booking if approved
    if (approved) {
      if (booking.dateChangeRequest.requestedDate) {
        booking.date = booking.dateChangeRequest.requestedDate;
      }
      if (booking.dateChangeRequest.requestedAddress) {
        booking.userDetails.address = booking.dateChangeRequest.requestedAddress;
      }
    }

    await booking.save();
    res.json({ message: `Change request ${approved ? "approved" : "rejected"}`, booking });

    setImmediate(async () => {
      try {
        const user = await User.findById(booking.userId);

        if (approved) {
          const appliedItems = [];
          if (booking.dateChangeRequest.requestedDate) {
            appliedItems.push(`New Date: ${new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`);
          }
          if (booking.dateChangeRequest.requestedAddress) {
            appliedItems.push(`New Address: ${booking.userDetails.address}`);
          }

          // ── CHANGE 2: Notify user of approval ──
          await createNotification({
            userId:    booking.userId,
            type:      "date_change_approved",
            title:     "✅ Vendor Approved Your Changes",
            message:   `The vendor has accepted your booking changes. ${appliedItems.join(" · ")}`,
            bookingId: booking._id,
          });

          if (user?.email) {
            await sendEmail({
              to:      user.email,
              subject: "Booking Changes Approved ✅",
              text:    `Hello ${user.name},\n\nGreat news! The vendor has approved your requested changes.\n\n${appliedItems.join("\n")}\n\nYour booking has been updated accordingly.\n\n- Evencers Team`,
            });
          }
        } else {
          // ── CHANGE 2: Notify user of rejection ──
          await createNotification({
            userId:    booking.userId,
            type:      "date_change_rejected",
            title:     "Vendor Couldn't Accept Your Changes",
            message:   `The vendor was unable to accommodate your requested changes. Your original booking details remain unchanged.`,
            bookingId: booking._id,
          });

          if (user?.email) {
            await sendEmail({
              to:      user.email,
              subject: "Booking Change Request Declined ❌",
              text:    `Hello ${user.name},\n\nUnfortunately, the vendor was unable to accept your requested changes.\n\nYour original booking details remain unchanged:\nDate: ${new Date(booking.date).toLocaleDateString("en-IN")}\nAddress: ${booking.userDetails.address}\n\nIf you have further questions, please contact the vendor or Evencers support.\n\n- Evencers Team`,
            });
          }
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