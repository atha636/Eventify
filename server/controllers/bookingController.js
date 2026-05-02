const Booking      = require("../models/Booking");
const Vendor       = require("../models/Vendor");
const User         = require("../models/User");
const Notification = require("../models/Notification");
const { sendEmail } = require("../utils/sendEmail");

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the installments array for a booking based on paymentPlan.
 *
 * Plan "25"  → installment 1: 25% now
 *              installment 2: 50% (2-3 days before event, sent via cron)
 *              installment 3: 25% (after event confirmation)
 *
 * Plan "75"  → installment 1: 75% now
 *              installment 2: 25% (after event confirmation)
 *
 * Plan "100" → installment 1: 95% now  (5 % discount applied — user pays 95%)
 */
function buildInstallments(plan, packagePrice) {
  const price = Number(packagePrice);

  if (plan === "25") {
    return [
      { installmentNumber: 1, percentage: 25, amount: Math.round(price * 0.25), status: "pending" },
      { installmentNumber: 2, percentage: 50, amount: Math.round(price * 0.50), status: "pending" },
      { installmentNumber: 3, percentage: 25, amount: Math.round(price * 0.25), status: "pending" },
    ];
  }

  if (plan === "75") {
    return [
      { installmentNumber: 1, percentage: 75, amount: Math.round(price * 0.75), status: "pending" },
      { installmentNumber: 2, percentage: 25, amount: Math.round(price * 0.25), status: "pending" },
    ];
  }

  // plan === "100"  → 5 % discount: user pays 95 %
  return [
    { installmentNumber: 1, percentage: 95, amount: Math.round(price * 0.95), status: "pending" },
  ];
}

/**
 * Safe notification helper — never throws, so it never breaks the main flow.
 */
async function createNotification({ userId, type, title, message, bookingId }) {
  try {
    await Notification.create({ userId, type, title, message, bookingId });
  } catch (err) {
    console.error("NOTIFICATION CREATE ERROR (non-critical):", err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE BOOKING
// POST /api/bookings
// Body: { vendorId, date, packageName, packagePrice, userDetails, paymentPlan }
// ─────────────────────────────────────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    const {
      vendorId,
      date,
      packageName,
      packagePrice,
      userDetails,
      paymentPlan = "100",   // default to full payment
    } = req.body;

    // ── Validate plan value ──────────────────────────────────────
    if (!["25", "75", "100"].includes(paymentPlan)) {
      return res.status(400).json({ error: "Invalid payment plan. Choose 25, 75, or 100." });
    }

    // ── Vendor must exist ────────────────────────────────────────
    const vendor = await Vendor.findById(vendorId).populate("vendorId");
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    // ── Prevent duplicate pending bookings ───────────────────────
    const existing = await Booking.findOne({
      userId:   req.user.id,
      vendorId,
      date:     new Date(date),
      status:   { $in: ["pending", "approved"] },
    });
    if (existing) {
      return res.status(409).json({ error: "You already have an active booking for this vendor on that date." });
    }

    // ── Build installments ───────────────────────────────────────
    const installments = buildInstallments(paymentPlan, packagePrice);

    // ── Create booking ───────────────────────────────────────────
    const booking = await Booking.create({
      userId:       req.user.id,
      vendorId,
      packageName,
      packagePrice: Number(packagePrice),
      date:         new Date(date),
      status:       "pending",
      userDetails:  {
        name:    userDetails?.name    || "",
        phone:   userDetails?.phone   || "",
        address: userDetails?.address || "",
      },
      paymentPlan,
      installments,
      totalPaid:       0,
      paymentComplete: false,
      paymentStatus:   "pending",
    });

    // ── Respond immediately ──────────────────────────────────────
    res.status(201).json(booking);

    // ── Fire-and-forget: notify vendor + user ────────────────────
    setImmediate(async () => {
      try {
        const user       = await User.findById(req.user.id);
        const vendorUser = vendor.vendorId
          ? await User.findById(vendor.vendorId._id ?? vendor.vendorId)
          : null;

        const planLabel = {
          "25":  "25% now, 50% before event, 25% after event",
          "75":  "75% now, 25% after event",
          "100": "Full payment (5% discount applied)",
        }[paymentPlan];

        const firstAmount = installments[0].amount;

        // ── Notification: vendor gets "booking_received" ──────────
        if (vendorUser) {
          await createNotification({
            userId:    vendorUser._id,
            type:      "booking_received",
            title:     "New Booking Request",
            message:   `${user?.name || "A client"} wants to book "${packageName}" for ${new Date(date).toLocaleDateString("en-IN")}`,
            bookingId: booking._id,
          });

          if (vendorUser.email) {
            await sendEmail({
              to:      vendorUser.email,
              subject: `New Booking Request — ${packageName}`,
              text: [
                `Hello ${vendorUser.name},`,
                ``,
                `You have received a new booking request!`,
                ``,
                `Customer : ${user?.name}`,
                `Phone    : ${userDetails?.phone || "—"}`,
                `Package  : ${packageName}`,
                `Date     : ${new Date(date).toLocaleDateString("en-IN")}`,
                `Address  : ${userDetails?.address || "—"}`,
                ``,
                `Payment Plan : ${planLabel}`,
                `First amount : ₹${firstAmount.toLocaleString("en-IN")}`,
                ``,
                `Please approve or reject this request in your Vendor Dashboard.`,
                ``,
                `— Evencers Team`,
              ].join("\n"),
            });
          }
        }

        // ── Notification: user gets booking submitted confirmation ─
        if (user) {
          await createNotification({
            userId:    user._id,
            type:      "payment_pending",
            title:     "Booking Request Sent",
            message:   `Your booking for "${packageName}" with ${vendor.title} has been sent. Awaiting vendor confirmation.`,
            bookingId: booking._id,
          });

          if (user.email) {
            await sendEmail({
              to:      user.email,
              subject: "Booking Request Sent — Awaiting Vendor Confirmation",
              text: [
                `Hello ${user.name},`,
                ``,
                `Your booking request has been sent to ${vendor.title}.`,
                ``,
                `Package  : ${packageName}`,
                `Date     : ${new Date(date).toLocaleDateString("en-IN")}`,
                ``,
                `Payment Plan : ${planLabel}`,
                `Amount due now (after vendor approves) : ₹${firstAmount.toLocaleString("en-IN")}`,
                ``,
                `We'll notify you once the vendor reviews your request. No payment is needed until then.`,
                ``,
                `— Evencers Team`,
              ].join("\n"),
            });
          }
        }
      } catch (emailErr) {
        console.error("BOOKING EMAIL ERROR (non-critical):", emailErr);
      }
    });

  } catch (err) {
    console.error("CREATE BOOKING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET USER BOOKINGS
// GET /api/bookings
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate("vendorId", "title location images serviceType")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET VENDOR BOOKINGS  (vendor dashboard)
// GET /api/bookings/vendor
// ─────────────────────────────────────────────────────────────────────────────
exports.getVendorBookings = async (req, res) => {
  try {
    const vendors   = await Vendor.find({ vendorId: req.user.id });
    const vendorIds = vendors.map((v) => v._id);

    const bookings = await Booking.find({ vendorId: { $in: vendorIds } })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR APPROVES OR REJECTS BOOKING
// PUT /api/bookings/:id/status
// Body: { status: "approved" | "rejected" }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }

    // ── Find booking and populate both refs in one query ─────────
    const booking = await Booking.findById(id)
      .populate("vendorId")
      .populate("userId", "name email");

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // ── Verify this vendor owns the booking ──────────────────────
    const vendor = await Vendor.findOne({
      _id:      booking.vendorId._id,
      vendorId: req.user.id,
    });
    if (!vendor) return res.status(403).json({ error: "Unauthorized" });

    booking.status = status;
    await booking.save();

    // ── Respond immediately ──────────────────────────────────────
    res.json(booking);

    // ── Notify customer (notification + email) ───────────────────
    setImmediate(async () => {
      try {
        const user = booking.userId;   // already populated
        if (!user) return;

        const planLabel = {
          "25":  "25% now · 50% before event · 25% after event",
          "75":  "75% now · 25% after event",
          "100": "Full payment (5% discount)",
        }[booking.paymentPlan] || "";

        const firstInstallment = booking.installments?.[0];

        if (status === "approved") {
          // ── In-app notification ──────────────────────────────
          await createNotification({
            userId:    user._id,
            type:      "booking_approved",
            title:     "🎉 Booking Approved!",
            message:   `${booking.vendorId.title} approved your booking for "${booking.packageName}". Complete your payment to confirm the slot.`,
            bookingId: booking._id,
          });

          // ── Email ────────────────────────────────────────────
          if (user.email) {
            await sendEmail({
              to:      user.email,
              subject: "🎉 Booking Approved — Complete Your Payment",
              text: [
                `Hello ${user.name},`,
                ``,
                `Great news! ${booking.vendorId.title} has approved your booking.`,
                ``,
                `Package  : ${booking.packageName}`,
                `Date     : ${new Date(booking.date).toLocaleDateString("en-IN")}`,
                ``,
                `Payment Plan : ${planLabel}`,
                firstInstallment
                  ? `Amount to pay now : ₹${firstInstallment.amount.toLocaleString("en-IN")}`
                  : "",
                ``,
                `Please log in and complete your first payment to confirm your slot.`,
                ``,
                `— Evencers Team`,
              ].join("\n"),
            });
          }
        } else {
          // ── In-app notification ──────────────────────────────
          await createNotification({
            userId:    user._id,
            type:      "booking_rejected",
            title:     "Booking Not Accepted",
            message:   `${booking.vendorId.title} was unable to accept your booking for "${booking.packageName}". You can explore other vendors.`,
            bookingId: booking._id,
          });

          // ── Email ────────────────────────────────────────────
          if (user.email) {
            await sendEmail({
              to:      user.email,
              subject: "Booking Update — Request Not Accepted",
              text: [
                `Hello ${user.name},`,
                ``,
                `Unfortunately, ${booking.vendorId.title} was unable to accept your booking request.`,
                ``,
                `Package : ${booking.packageName}`,
                `Date    : ${new Date(booking.date).toLocaleDateString("en-IN")}`,
                ``,
                `You can explore other vendors on Evencers and try booking again.`,
                ``,
                `— Evencers Team`,
              ].join("\n"),
            });
          }
        }
      } catch (emailErr) {
        console.error("STATUS EMAIL ERROR (non-critical):", emailErr);
      }
    });

  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM EVENT  (both vendor AND user must confirm to unlock final installment)
// POST /api/bookings/:id/confirm-event
// Body: { role: "vendor" | "user" }
// ─────────────────────────────────────────────────────────────────────────────
exports.confirmEvent = async (req, res) => {
  try {
    const { id }   = req.params;
    const { role } = req.body;

    if (!["vendor", "user"].includes(role)) {
      return res.status(400).json({ error: "role must be 'vendor' or 'user'" });
    }

    const booking = await Booking.findById(id)
      .populate("vendorId")
      .populate("userId", "name email");

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // ── Auth checks ──────────────────────────────────────────────
    if (role === "vendor") {
      const vendor = await Vendor.findOne({
        _id:      booking.vendorId._id,
        vendorId: req.user.id,
      });
      if (!vendor) return res.status(403).json({ error: "Unauthorized" });
      booking.eventConfirmedByVendor = true;
    } else {
      if (booking.userId._id.toString() !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      booking.eventConfirmedByUser = true;
    }

    // ── Both confirmed → unlock final installment ────────────────
    if (booking.eventConfirmedByVendor && booking.eventConfirmedByUser) {
      booking.eventConfirmedAt = new Date();

      const finalIdx = booking.installments.findLastIndex(
        (i) => i.status === "pending"
      );

      if (finalIdx !== -1 && !booking.finalPaymentLinkSent) {
        booking.installments[finalIdx].status = "link_sent";
        booking.finalPaymentLinkSent = true;

        setImmediate(async () => {
          try {
            const finalAmt = booking.installments[finalIdx].amount;

            // ── In-app notification to user ──────────────────
            await createNotification({
              userId:    booking.userId._id,
              type:      "payment_pending",
              title:     "🎉 Event Confirmed — Final Payment Due",
              message:   `Both you and the vendor confirmed the event was successful! Please pay the final ₹${finalAmt.toLocaleString("en-IN")} to close the booking.`,
              bookingId: booking._id,
            });

            await sendEmail({
              to:      booking.userId.email,
              subject: "Event Confirmed 🎉 — Final Payment Due",
              text: [
                `Hello ${booking.userId.name},`,
                ``,
                `Both you and the vendor have confirmed the event was successful. 🎊`,
                ``,
                `Please complete your final payment to close the booking.`,
                ``,
                `Final amount due : ₹${finalAmt.toLocaleString("en-IN")}`,
                ``,
                `Log in to Evencers → My Bookings → Pay Final Installment`,
                ``,
                `— Evencers Team`,
              ].join("\n"),
            });
          } catch (e) {
            console.error("FINAL PAYMENT EMAIL ERROR:", e);
          }
        });
      }
    }

    await booking.save();
    res.json({ success: true, booking });

  } catch (err) {
    console.error("CONFIRM EVENT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL BOOKING
// DELETE /api/bookings/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("vendorId");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (["approved"].includes(booking.status) && booking.totalPaid > 0) {
      return res.status(400).json({
        error: "Cannot cancel a paid booking. Please request a refund instead.",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    // ── Notify vendor that booking was cancelled ─────────────────
    setImmediate(async () => {
      try {
        const vendorUser = await User.findById(booking.vendorId?.vendorId);
        if (vendorUser) {
          await createNotification({
            userId:    vendorUser._id,
            type:      "booking_rejected",
            title:     "Booking Cancelled",
            message:   `A client cancelled their booking for "${booking.packageName}".`,
            bookingId: booking._id,
          });
        }
      } catch (e) {
        console.error("CANCEL NOTIFY ERROR:", e);
      }
    });

    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE / ADDRESS CHANGE REQUEST
// POST /api/bookings/:id/change-request
// Body: { requestedDate?, requestedAddress?, reason }
// ─────────────────────────────────────────────────────────────────────────────
exports.requestChange = async (req, res) => {
  try {
    const { requestedDate, requestedAddress, reason } = req.body;
    const booking = await Booking.findById(req.params.id).populate("vendorId");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    booking.dateChangeRequest = {
      requestedDate:    requestedDate ? new Date(requestedDate) : null,
      requestedAddress: requestedAddress || null,
      reason:           reason || "",
      status:           "pending",
      requestedAt:      new Date(),
      respondedAt:      null,
    };

    await booking.save();

    // ── Notify vendor about the change request ───────────────────
    setImmediate(async () => {
      try {
        const vendorUser = await User.findById(booking.vendorId?.vendorId);
        if (vendorUser) {
          await createNotification({
            userId:    vendorUser._id,
            type:      "date_change_requested",
            title:     "📅 Client Requested Changes",
            message:   `A client wants to change their booking for "${booking.packageName}". Review it in your dashboard.`,
            bookingId: booking._id,
          });
        }
      } catch (e) {
        console.error("DCR NOTIFY ERROR:", e);
      }
    });

    res.json({ message: "Change request submitted", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPOND TO CHANGE REQUEST  (vendor)
// PUT /api/bookings/:id/change-request
// Body: { action: "approved" | "rejected" }
// ─────────────────────────────────────────────────────────────────────────────
exports.respondToChange = async (req, res) => {
  try {
    const { action } = req.body;
    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "action must be 'approved' or 'rejected'" });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("vendorId")
      .populate("userId", "name email");

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const vendor = await Vendor.findOne({
      _id:      booking.vendorId._id,
      vendorId: req.user.id,
    });
    if (!vendor) return res.status(403).json({ error: "Unauthorized" });

    booking.dateChangeRequest.status      = action;
    booking.dateChangeRequest.respondedAt = new Date();

    if (action === "approved") {
      if (booking.dateChangeRequest.requestedDate)
        booking.date = booking.dateChangeRequest.requestedDate;
      if (booking.dateChangeRequest.requestedAddress)
        booking.userDetails.address = booking.dateChangeRequest.requestedAddress;
    }

    await booking.save();

    // ── Notify client about vendor's response ────────────────────
    setImmediate(async () => {
      try {
        const notifType = action === "approved" ? "date_change_approved" : "date_change_rejected";
        const title     = action === "approved" ? "✓ Change Request Accepted" : "✕ Change Request Declined";
        const message   = action === "approved"
          ? `The vendor accepted your change request for "${booking.packageName}". Your booking has been updated.`
          : `The vendor declined your change request for "${booking.packageName}". Your original booking details remain.`;

        await createNotification({
          userId:    booking.userId._id,
          type:      notifType,
          title,
          message,
          bookingId: booking._id,
        });
      } catch (e) {
        console.error("DCR RESPOND NOTIFY ERROR:", e);
      }
    });

    res.json({ message: `Change request ${action}`, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};