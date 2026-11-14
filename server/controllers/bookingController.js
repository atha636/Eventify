const { hasApprovedBooking, isBlocked } = require("../utils/availability");
const { dupKeyFor, slotKeyFor, isDuplicateKeyError } = require("../utils/bookingLock");
const { checkPromo } = require("../utils/promo");
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
function buildInstallments(plan, packagePrice, promoPercent = 0) {
  const price = Number(packagePrice);
  const pct   = Number(promoPercent) || 0;
  // A vendor code takes an extra `pct`% of the PRICE off in total (so full-pay + code = a true 10%).
  // That saving is spread across the instalments in proportion to their size.
  const make = (shares) => {
    const total = shares.reduce((t, x) => t + x.share, 0);          // 1 for 25/75 plans, 0.95 for full pay
    return shares.map((x, i) => ({
      installmentNumber: i + 1,
      percentage: x.pct,
      amount: Math.round(price * (x.share - (x.share / total) * pct / 100)),
      status: "pending",
    }));
  };

  if (plan === "25") return make([{ share: 0.25, pct: 25 }, { share: 0.50, pct: 50 }, { share: 0.25, pct: 25 }]);
  if (plan === "75") return make([{ share: 0.75, pct: 75 }, { share: 0.25, pct: 25 }]);
  // plan === "100"  → 5 % discount: user pays 95 %
  return make([{ share: 0.95, pct: 95 }]);
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
// Body: { vendorId, date, packageName, userDetails, paymentPlan }
// NOTE: packagePrice is intentionally NOT read from the client — the real
// price is looked up server-side from the vendor's own packages/price.
// ─────────────────────────────────────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    const {
      vendorId,
      date,
      packageName,
      userDetails,
      paymentPlan = "100",   // default to full payment
      promoCode,
    } = req.body;

    // ── Validate plan value ──────────────────────────────────────
    if (!["25", "75", "100"].includes(paymentPlan)) {
      return res.status(400).json({ error: "Invalid payment plan. Choose 25, 75, or 100." });
    }

    // ── Date sanity ────────────────────────────────────────────────
    const parsedDate = new Date(date);
    if (!date || isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "A valid date is required." });
    }
    const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
    if (parsedDate < todayMidnight) {
      return res.status(400).json({ error: "Event date can't be in the past." });
    }

    // ── Vendor must exist and be approved/live ────────────────────
    const vendor = await Vendor.findById(vendorId).populate("vendorId");
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    if (!vendor.isApproved) {
      return res.status(400).json({ error: "This service isn't currently available for booking." });
    }

    // ── SECURITY: never trust packagePrice from the client ─────────
    // The old code took req.body.packagePrice as-is and used it to size
    // every installment and Razorpay order — a client could book any
    // package for ₹1 by editing the request. Recompute the real price
    // from the vendor's own stored packages / flat price instead.
    const isDecorVendor = vendor.serviceType === "decor";
    let resolvedPrice;
    let resolvedPackageName = packageName;

    if (isDecorVendor) {
      resolvedPrice = vendor.price;
      resolvedPackageName = packageName || vendor.title || "Decor Service";
    } else {
      const matchedPkg = vendor.packages?.find((p) => p.name === packageName);
      if (!matchedPkg) {
        return res.status(400).json({ error: "Selected package no longer exists for this vendor." });
      }
      resolvedPrice = matchedPkg.price;
      resolvedPackageName = matchedPkg.name;
    }

    if (!resolvedPrice || resolvedPrice <= 0) {
      return res.status(400).json({ error: "This service doesn't have a valid price set." });
    }

    // ── Vendor-blocked dates ─────────────────────────────────────
    const dayStart = new Date(parsedDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(dayStart);   dayEnd.setDate(dayEnd.getDate() + 1);
    const blocked = (vendor.availability || []).some(
      (a) => !a.available && a.date >= dayStart && a.date < dayEnd
    );
    if (blocked) {
      return res.status(409).json({ error: "This vendor isn't available on the selected date." });
    }
    if (vendor.autoBlockBooked && await hasApprovedBooking(vendor._id, parsedDate)) {
      return res.status(409).json({ error: "This vendor is already booked on the selected date." });
    }

    // ── Prevent duplicate pending bookings ───────────────────────
    const existing = await Booking.findOne({
      userId:   req.user.id,
      vendorId,
      date:     parsedDate,
      status:   { $in: ["pending", "approved"] },
    });
    if (existing) {
      return res.status(409).json({ error: "You already have an active booking for this vendor on that date." });
    }

    // ── Build installments (server-resolved price only) ──────────
    // ── Optional vendor code → extra 5% off ──────────────────────
    let promo = null;
    if (promoCode !== undefined && String(promoCode).trim() !== "") {
      const chk = await checkPromo({ code: promoCode, service: vendor, userId: req.user.id });
      if (!chk.ok) return res.status(400).json({ error: chk.error, promoError: true });
      const sum = (arr) => arr.reduce((t, i) => t + i.amount, 0);
      const discountAmount = sum(buildInstallments(paymentPlan, resolvedPrice)) - sum(buildInstallments(paymentPlan, resolvedPrice, chk.percent));
      const firstUseForVendor = !(await Booking.exists({
        "promo.ownerId": chk.ownerId, status: { $in: ["pending", "approved"] },
      }));
      promo = { code: chk.code, percent: chk.percent, discountAmount, ownerId: chk.ownerId, firstUseForVendor, appliedAt: new Date() };
    }

    const installments = buildInstallments(paymentPlan, resolvedPrice, promo?.percent || 0);

    // ── Create booking ───────────────────────────────────────────
    // The findOne() above is only a friendly early exit — two simultaneous requests
    // can both pass it. dupKey (unique index) is what actually guarantees one active
    // booking per user / service / day, so a double-click can't create two.
    let booking;
    try {
    booking = await Booking.create({
      userId:       req.user.id,
      vendorId,
      dupKey:       dupKeyFor(req.user.id, vendorId, parsedDate),
      packageName:  resolvedPackageName,
      packagePrice: resolvedPrice,
      date:         parsedDate,
      status:       "pending",
      userDetails:  {
        name:    userDetails?.name    || "",
        phone:   userDetails?.phone   || "",
        address: userDetails?.address || "",
      },
      paymentPlan,
      installments,
      ...(promo ? { promo } : {}),
      totalPaid:       0,
      paymentComplete: false,
      paymentStatus:   "pending",
    });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return res.status(409).json({ error: "You already have an active booking for this vendor on that date." });
      }
      throw err;
    }

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
            message:   `${user?.name || "A client"} wants to book "${booking.packageName}" for ${booking.date.toLocaleDateString("en-IN")}`,
            bookingId: booking._id,
          });

          if (vendorUser.email) {
            await sendEmail({
              to:      vendorUser.email,
              subject: `New Booking Request — ${booking.packageName}`,
              text: [
                `Hello ${vendorUser.name},`,
                ``,
                `You have received a new booking request!`,
                ``,
                `Customer : ${user?.name}`,
                `Phone    : ${userDetails?.phone || "—"}`,
                `Package  : ${booking.packageName}`,
                `Date     : ${booking.date.toLocaleDateString("en-IN")}`,
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
            message:   `Your booking for "${booking.packageName}" with ${vendor.title} has been sent. Awaiting vendor confirmation.`,
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
                `Package  : ${booking.packageName}`,
                `Date     : ${booking.date.toLocaleDateString("en-IN")}`,
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

    // Only a pending request can be approved/rejected (no reviving cancelled
    // bookings or rejecting ones the customer already paid for)
    if (booking.status !== "pending") {
      return res.status(400).json({ error: `Booking is already ${booking.status}.` });
    }

    // ── Atomic pending → approved/rejected ───────────────────────
    // The status filter makes this a compare-and-set: a double-click or two
    // browser tabs can only win once. Approving also takes the day's slotKey
    // for services that block a date once booked, so the unique index rejects
    // a second approval for the same day even if both land at the same moment.
    const $set = { status };
    const $unset = {};
    if (status === "approved" && vendor.autoBlockBooked) {
      $set.slotKey = slotKeyFor(vendor._id, booking.date);
    }
    if (status === "rejected") $unset.dupKey = 1;   // frees the customer's slot

    let updated;
    try {
      updated = await Booking.findOneAndUpdate(
        { _id: booking._id, status: "pending" },
        { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
        { new: true }
      );
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return res.status(409).json({
          error: "You already have an approved booking on this date. Reject this request or ask the customer to pick another date.",
        });
      }
      throw err;
    }
    if (!updated) {
      return res.status(409).json({ error: "This booking was just updated by someone else. Please refresh." });
    }
    booking.status = status;   // in-memory only, so the response + notifications below see the new status

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

    if (["cancelled", "rejected"].includes(booking.status)) {
      return res.status(400).json({ error: `Booking is already ${booking.status}.` });
    }

    if (booking.totalPaid > 0) {
      return res.status(400).json({
        error: "Cannot cancel a paid booking. Please request a refund instead.",
      });
    }

    // Atomic: only cancel while nothing has been paid. A payment being verified at
    // the same instant either lands first (then totalPaid > 0 and this matches
    // nothing) or loses (payment verification sees status "cancelled").
    const cancelled = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        userId: req.user.id,
        status: { $in: ["pending", "approved"] },
        totalPaid: { $not: { $gt: 0 } },
      },
      { $set: { status: "cancelled" }, $unset: { dupKey: 1, slotKey: 1 } },
      { new: true }
    );
    if (!cancelled) {
      return res.status(409).json({
        error: "This booking just changed (it may have been paid). Please refresh and check before cancelling.",
      });
    }
    booking.status = "cancelled";

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

    if (!["pending", "approved"].includes(booking.status)) {
      return res.status(400).json({ error: `A ${booking.status} booking can't be changed.` });
    }
    if (requestedDate) {
      const d = new Date(requestedDate);
      const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
      if (isNaN(d.getTime()) || d < todayMidnight) {
        return res.status(400).json({ error: "Please choose a valid future date." });
      }
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

    let booking = await Booking.findById(req.params.id)
      .populate("vendorId")
      .populate("userId", "name email");

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const vendor = await Vendor.findOne({
      _id:      booking.vendorId._id,
      vendorId: req.user.id,
    });
    if (!vendor) return res.status(403).json({ error: "Unauthorized" });

    const dcr = booking.dateChangeRequest || {};
    if (dcr.status !== "pending") {
      return res.status(400).json({ error: "There is no pending change request to respond to." });
    }

    const $set = {
      "dateChangeRequest.status":      action,
      "dateChangeRequest.respondedAt": new Date(),
    };

    if (action === "approved") {
      if (dcr.requestedAddress) $set["userDetails.address"] = dcr.requestedAddress;

      if (dcr.requestedDate) {
        // The new date has to be as bookable as a brand-new request would be.
        if (isBlocked(vendor, dcr.requestedDate)) {
          return res.status(409).json({ error: "You've marked the requested date as unavailable." });
        }
        $set.date = dcr.requestedDate;
        // Move the lock keys with the booking. Unique indexes reject the move if the
        // new day is already taken (another approved booking, or the customer's own).
        if (["pending", "approved"].includes(booking.status)) {
          $set.dupKey = dupKeyFor(booking.userId._id, vendor._id, dcr.requestedDate);
          if (booking.status === "approved" && vendor.autoBlockBooked) {
            $set.slotKey = slotKeyFor(vendor._id, dcr.requestedDate);
          }
        }
      }
    }

    // Compare-and-set on the request status (and booking status) so the same request
    // can't be applied twice and a booking cancelled meanwhile isn't resurrected.
    let updated;
    try {
      updated = await Booking.findOneAndUpdate(
        { _id: booking._id, "dateChangeRequest.status": "pending", status: booking.status },
        { $set },
        { new: true }
      );
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return res.status(409).json({ error: "That date is already taken by another booking, so the change can't be accepted." });
      }
      throw err;
    }
    if (!updated) {
      return res.status(409).json({ error: "This request was just updated. Please refresh." });
    }

    // Re-read with the same populates the rest of this handler (and the client) expects.
    booking = await Booking.findById(updated._id)
      .populate("vendorId")
      .populate("userId", "name email");

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