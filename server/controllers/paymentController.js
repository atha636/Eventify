const Razorpay = require("razorpay");
const crypto   = require("crypto");
const Payment  = require("../models/Payment");
const Booking  = require("../models/Booking");
const Vendor   = require("../models/Vendor");
const User     = require("../models/User");
const { sendEmail } = require("../utils/sendEmail");

// ── Initialize Razorpay ──────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find the next pending installment on a booking.
 * Returns { installment, index } or null if nothing pending.
 */
function nextPendingInstallment(booking) {
  const idx = booking.installments.findIndex((i) => i.status === "pending");
  if (idx === -1) return null;
  return { installment: booking.installments[idx], index: idx };
}

/**
 * Human-readable plan label for emails.
 */
function planLabel(plan) {
  return {
    "25":  "25% now · 50% before event · 25% after event",
    "75":  "75% now · 25% after event",
    "100": "Full payment (5% discount applied)",
  }[plan] || plan;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE ORDER
// POST /api/payments/create-order
// Body: { bookingId, amount, installmentNumber }
//
// installmentNumber is OPTIONAL — if omitted we auto-detect the next pending
// installment so the frontend doesn't need to know the internals.
// ─────────────────────────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { bookingId, installmentNumber } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: "bookingId is required" });
    }

    const booking = await Booking.findById(bookingId).populate("vendorId userId");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // ── Auth ──────────────────────────────────────────────────────
    if (booking.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // ── Booking must be approved before payment ───────────────────
    if (booking.status !== "approved") {
      return res.status(400).json({
        error: "Booking must be approved by the vendor before payment.",
      });
    }

    // ── Determine which installment to pay ────────────────────────
    let targetIdx;
    if (installmentNumber !== undefined) {
      targetIdx = booking.installments.findIndex(
        (i) => i.installmentNumber === Number(installmentNumber)
      );
      if (targetIdx === -1) {
        return res.status(400).json({ error: "Installment not found" });
      }
    } else {
      // Auto: first pending (or link_sent) installment
      targetIdx = booking.installments.findIndex(
        (i) => i.status === "pending" || i.status === "link_sent"
      );
      if (targetIdx === -1) {
        return res.status(400).json({ error: "No pending installment found" });
      }
    }

    const inst = booking.installments[targetIdx];

    if (inst.status === "paid") {
      return res.status(400).json({ error: "This installment has already been paid" });
    }

    // ── Guard: for installment 2 of 25% plan, only allow if event not yet done
    //    Guard: for final installment (25%/75%), require event confirmed
    const isFinalInstallment =
      targetIdx === booking.installments.length - 1 &&
      booking.installments.length > 1;

    if (isFinalInstallment && !booking.eventConfirmedByVendor && !booking.eventConfirmedByUser) {
      return res.status(400).json({
        error: "Final payment can only be made after the event is confirmed by both parties.",
      });
    }

    const amount = inst.amount;

    // ── Create Razorpay order ─────────────────────────────────────
    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency: "INR",
      receipt: `bk_${bookingId.toString().slice(-8)}_${inst.installmentNumber}`,
      notes: {
        bookingId,
        userId:            req.user.id,
        vendorId:          booking.vendorId._id.toString(),
        installmentNumber: inst.installmentNumber,
        paymentPlan:       booking.paymentPlan,
      },
    });

    // ── Save payment record ───────────────────────────────────────
    const payment = await Payment.create({
      orderId:               razorpayOrder.id,
      bookingId,
      userId:                req.user.id,
      vendorId:              booking.vendorId._id,
      amount,
      currency:              "INR",
      status:                "created",
      paymentPlan:           booking.paymentPlan,
      installmentNumber:     inst.installmentNumber,
      installmentPercentage: inst.percentage,
      orderDetails: {
        packageName:    booking.packageName,
        packagePrice:   booking.packagePrice,
        eventDate:      booking.date,
        vendorName:     booking.vendorId.title,
        vendorLocation: booking.vendorId.location,
        userName:       booking.userId.name,
        userEmail:      booking.userId.email,
      },
    });

    res.json({
      orderId:               razorpayOrder.id,
      amount:                razorpayOrder.amount,
      currency:              razorpayOrder.currency,
      keyId:                 process.env.RAZORPAY_KEY_ID,
      paymentId:             payment._id,
      installmentNumber:     inst.installmentNumber,
      installmentPercentage: inst.percentage,
      paymentPlan:           booking.paymentPlan,
    });

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ error: "Failed to create order", details: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY PAYMENT
// POST /api/payments/verify
// Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId }
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentId,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    // ── Signature verification ────────────────────────────────────
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSig = hmac.digest("hex");

    if (generatedSig !== razorpaySignature) {
      console.warn("SIGNATURE MISMATCH — possible fraud");
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // ── Update Payment record ────────────────────────────────────
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ error: "Payment record not found" });

    payment.paymentId         = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status            = "paid";
    await payment.save();

    // ── Update the matching installment on the Booking ────────────
    const booking = await Booking.findById(payment.bookingId);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const instIdx = booking.installments.findIndex(
      (i) => i.installmentNumber === payment.installmentNumber
    );

    if (instIdx !== -1) {
      booking.installments[instIdx].status    = "paid";
      booking.installments[instIdx].paymentId = payment._id;
      booking.installments[instIdx].paidAt    = new Date();
    }

    // ── Update totals ─────────────────────────────────────────────
    booking.totalPaid = (booking.totalPaid || 0) + payment.amount;

    // ── Legacy fields for backward compat ─────────────────────────
    booking.paymentId = payment._id;
    booking.paidAt    = new Date();

    // ── Check if all installments are paid ────────────────────────
    const allPaid = booking.installments.every((i) => i.status === "paid");
    if (allPaid) {
      booking.paymentComplete = true;
      booking.paymentStatus   = "paid";
    } else {
      booking.paymentStatus = "partial";
    }

    // ── On first payment (installment 1) → mark booking approved ──
    if (payment.installmentNumber === 1) {
      booking.status = "approved";
    }

    await booking.save();

    // ── Respond to client ─────────────────────────────────────────
    res.json({
      success: true,
      message: "Payment verified successfully",
      booking,
      installmentNumber:     payment.installmentNumber,
      installmentPercentage: payment.installmentPercentage,
      paymentPlan:           booking.paymentPlan,
      totalPaid:             booking.totalPaid,
      paymentComplete:       booking.paymentComplete,
    });

    // ── Background: emails ────────────────────────────────────────
    setImmediate(async () => {
      try {
        const [user, vendor] = await Promise.all([
          User.findById(payment.userId),
          Vendor.findById(payment.vendorId),
        ]);
        const vendorUser = vendor ? await User.findById(vendor.vendorId) : null;

        const instLabel = `Installment ${payment.installmentNumber} (${payment.installmentPercentage}%)`;

        // Next installment info for non-100% plans
        const nextInst = booking.installments.find((i) => i.status === "pending");

        // ── Email to user ─────────────────────────────────────────
        if (user?.email) {
          const nextLines =
            nextInst && booking.paymentPlan !== "100"
              ? [
                  ``,
                  `Next Payment : ₹${nextInst.amount.toLocaleString("en-IN")} (installment ${nextInst.installmentNumber} — ${nextInst.percentage}%)`,
                  nextInst.installmentNumber === 2 && booking.paymentPlan === "25"
                    ? `You'll receive a reminder email 3 days before your event date.`
                    : `This will be due after the event is confirmed by both parties.`,
                ]
              : [];

          await sendEmail({
            to:      user.email,
            subject: `Payment Received ✓ — ${instLabel}`,
            text: [
              `Hello ${user.name},`,
              ``,
              `Your payment has been received!`,
              ``,
              `Service  : ${payment.orderDetails.vendorName}`,
              `Package  : ${payment.orderDetails.packageName}`,
              `Date     : ${new Date(payment.orderDetails.eventDate).toLocaleDateString("en-IN")}`,
              ``,
              `${instLabel} : ₹${payment.amount.toLocaleString("en-IN")} — PAID ✓`,
              `Total Paid So Far : ₹${booking.totalPaid.toLocaleString("en-IN")}`,
              ...nextLines,
              ``,
              `Order ID   : ${payment.orderId}`,
              `Payment ID : ${payment.paymentId}`,
              ``,
              `— Evencers Team`,
            ].join("\n"),
          });
        }

        // ── Email to vendor ───────────────────────────────────────
        if (vendorUser?.email) {
          await sendEmail({
            to:      vendorUser.email,
            subject: `Payment Received — ${payment.orderDetails.packageName}`,
            text: [
              `Hello ${vendorUser.name},`,
              ``,
              `Payment received from ${user?.name}.`,
              ``,
              `${instLabel} : ₹${payment.amount.toLocaleString("en-IN")}`,
              `Plan    : ${planLabel(booking.paymentPlan)}`,
              `Total Received : ₹${booking.totalPaid.toLocaleString("en-IN")}`,
              ``,
              `— Evencers Team`,
            ].join("\n"),
          });
        }
      } catch (emailErr) {
        console.error("VERIFY EMAIL ERROR (non-critical):", emailErr);
      }
    });

  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ error: "Payment verification failed", details: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PAYMENT DETAILS
// GET /api/payments/booking/:bookingId
// ─────────────────────────────────────────────────────────────────────────────
exports.getPaymentDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Return ALL payments for this booking (multi-installment)
    const payments = await Payment.find({ bookingId, status: "paid" })
      .populate("userId",  "name email")
      .populate("vendorId", "title location")
      .sort({ createdAt: 1 });

    if (!payments.length) {
      return res.status(404).json({ error: "No payments found for this booking" });
    }

    // Auth — user or vendor
    const first = payments[0];
    if (
      first.userId._id.toString() !== req.user.id &&
      first.vendorId.vendorId?.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET USER PAYMENT HISTORY
// GET /api/payments/user
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate("vendorId", "title location")
      .populate("bookingId", "date status paymentPlan installments totalPaid")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET VENDOR PAYMENT HISTORY
// GET /api/payments/vendor
// ─────────────────────────────────────────────────────────────────────────────
exports.getVendorPayments = async (req, res) => {
  try {
    const vendors   = await Vendor.find({ vendorId: req.user.id });
    const vendorIds = vendors.map((v) => v._id);

    const payments = await Payment.find({ vendorId: { $in: vendorIds } })
      .populate("userId",   "name email")
      .populate("bookingId", "date status paymentPlan installments totalPaid")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST REFUND
// POST /api/payments/:paymentId/refund-request
// Body: { reason }
// ─────────────────────────────────────────────────────────────────────────────
exports.requestRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason }    = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({ error: "Only paid payments can be refunded" });
    }

    if (payment.refund.refundStatus !== "none") {
      return res.status(400).json({ error: "Refund already requested" });
    }

    payment.refund = {
      refundReason:      reason || "User requested refund",
      refundStatus:      "pending",
      refundRequestedAt: new Date(),
    };
    await payment.save();

    res.json({ message: "Refund requested successfully", payment });

    setImmediate(async () => {
      try {
        const [user, vendor] = await Promise.all([
          User.findById(payment.userId),
          Vendor.findById(payment.vendorId),
        ]);
        const vendorUser = vendor ? await User.findById(vendor.vendorId) : null;
        if (vendorUser?.email) {
          await sendEmail({
            to:      vendorUser.email,
            subject: "Refund Request Received",
            text: `Customer ${user?.name} has requested a refund of ₹${payment.amount}.\nInstallment: ${payment.installmentNumber} | Plan: ${planLabel(payment.paymentPlan)}\nReason: ${reason || "Not specified"}\n\nPlease review in your dashboard.\n\n— Evencers Team`,
          });
        }
      } catch (e) {
        console.error("REFUND EMAIL ERROR:", e);
      }
    });

  } catch (err) {
    console.error("REFUND REQUEST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS REFUND  (vendor approves / rejects)
// PUT /api/payments/:paymentId/process-refund
// Body: { action: "approve" | "reject" }
// ─────────────────────────────────────────────────────────────────────────────
exports.processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { action }    = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "action must be approve or reject" });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const vendor = await Vendor.findById(payment.vendorId);
    if (!vendor || vendor.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (action === "approve") {
      try {
        const refund = await razorpay.payments.refund(payment.paymentId, {
          amount: Math.round(payment.amount * 100),
          notes:  { bookingId: payment.bookingId, reason: payment.refund.refundReason },
        });

        payment.refund = {
          refundId:          refund.id,
          refundAmount:      payment.amount,
          refundReason:      payment.refund.refundReason,
          refundStatus:      "completed",
          refundRequestedAt: payment.refund.refundRequestedAt,
          refundCompletedAt: new Date(),
        };
        payment.status = "refunded";

        // Mark installment as pending again on the booking
        const booking = await Booking.findById(payment.bookingId);
        if (booking) {
          const instIdx = booking.installments.findIndex(
            (i) => i.installmentNumber === payment.installmentNumber
          );
          if (instIdx !== -1) {
            booking.installments[instIdx].status    = "pending";
            booking.installments[instIdx].paymentId = null;
            booking.installments[instIdx].paidAt    = null;
          }
          booking.totalPaid    = Math.max(0, (booking.totalPaid || 0) - payment.amount);
          booking.paymentStatus = booking.totalPaid === 0 ? "pending" : "partial";
          booking.paymentComplete = false;
          await booking.save();
        }
      } catch (razorpayErr) {
        console.error("RAZORPAY REFUND ERROR:", razorpayErr);
        payment.refund.refundStatus = "failed";
      }
    } else {
      payment.refund.refundStatus = "rejected";
    }

    await payment.save();
    res.json({ message: `Refund ${action}ed`, payment });

    setImmediate(async () => {
      try {
        const user = await User.findById(payment.userId);
        if (user?.email) {
          await sendEmail({
            to:      user.email,
            subject: action === "approve" ? "Refund Approved ✓" : "Refund Request Declined",
            text:    action === "approve"
              ? `Hello ${user.name},\n\nYour refund of ₹${payment.amount} has been processed.\nRefund ID: ${payment.refund.refundId}\n\nFunds reflect in 3-5 business days.\n\n— Evencers Team`
              : `Hello ${user.name},\n\nYour refund request was declined by the vendor. Contact support for help.\n\n— Evencers Team`,
          });
        }
      } catch (e) {
        console.error("REFUND NOTIFY EMAIL ERROR:", e);
      }
    });

  } catch (err) {
    console.error("PROCESS REFUND ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET RECEIPT
// GET /api/payments/:paymentId/receipt
// ─────────────────────────────────────────────────────────────────────────────
exports.getReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate("userId",  "name email phone")
      .populate("vendorId", "title location");

    if (!payment) return res.status(404).json({ error: "Payment not found" });

    if (
      payment.userId._id.toString() !== req.user.id &&
      payment.vendorId.vendorId?.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({
      receiptNo: `RCP-${payment._id.toString().slice(-8).toUpperCase()}`,
      date:      payment.createdAt,
      installment: {
        number:     payment.installmentNumber,
        percentage: payment.installmentPercentage,
        plan:       payment.paymentPlan,
        planLabel:  planLabel(payment.paymentPlan),
      },
      payment: {
        orderId:   payment.orderId,
        paymentId: payment.paymentId,
        amount:    payment.amount,
        currency:  payment.currency,
        status:    payment.status,
      },
      orderDetails: payment.orderDetails,
      customer: {
        name:  payment.userId.name,
        email: payment.userId.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};