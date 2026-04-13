const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Vendor = require("../models/Vendor");
const User = require("../models/User");
const { sendEmail } = require("../utils/sendEmail");

// ── Initialize Razorpay ──────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ── CREATE ORDER (Frontend calls this) ───────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    // ✅ Validate input
    if (!bookingId || !amount) {
      return res.status(400).json({ error: "Booking ID and amount are required" });
    }

    // ✅ Verify booking exists
    const booking = await Booking.findById(bookingId)
      .populate("vendorId userId");
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // ✅ Check user owns this booking
    if (booking.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // ✅ Create Razorpay Order
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: "INR",
      receipt: `bk_${Date.now()}`,
      notes: {
        bookingId: bookingId,
        userId: req.user.id,
        vendorId: booking.vendorId._id
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // ✅ Save payment record
    const payment = await Payment.create({
      orderId: razorpayOrder.id,
      bookingId,
      userId: req.user.id,
      vendorId: booking.vendorId._id,
      amount,
      currency: "INR",
      status: "created",
      orderDetails: {
        packageName: booking.packageName,
        packagePrice: booking.packagePrice,
        eventDate: booking.date,
        vendorName: booking.vendorId.title,
        vendorLocation: booking.vendorId.location,
        userName: booking.userId.name,
        userEmail: booking.userId.email
      }
    });

    // ✅ Return order details to frontend
    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id
    });

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ error: "Failed to create order", details: err.message });
  }
};

// ── VERIFY PAYMENT (Frontend calls this after payment) ───────────
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

    // ✅ Validate input
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    // ✅ Verify Razorpay signature (CRITICAL for security)
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpaySignature) {
      console.warn("SIGNATURE MISMATCH - Potential fraud attempt");
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // ✅ Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    payment.paymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "paid";
    await payment.save();

    // ✅ Update booking status
    const booking = await Booking.findByIdAndUpdate(
      payment.bookingId,
      { 
        status: "approved",
        paymentId: payment._id,
        paymentStatus: "paid",
        paidAt: new Date()
      },
      { new: true }
    );

    // ✅ Respond immediately
    res.json({ 
      success: true, 
      message: "Payment verified successfully",
      booking
    });

    // ✅ Send confirmation emails in background
    setImmediate(async () => {
      try {
        const [user, vendor] = await Promise.all([
          User.findById(payment.userId),
          Vendor.findById(payment.vendorId)
        ]);

        const vendorUser = vendor ? await User.findById(vendor.vendorId) : null;

        // Email to customer
        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: "Payment Successful ✓ - Booking Confirmed",
            text: `Hello ${user.name},\n\nYour payment has been received successfully!\n\nService: ${payment.orderDetails.vendorName}\nAmount Paid: ₹${payment.amount}\nEvent Date: ${new Date(payment.orderDetails.eventDate).toLocaleDateString()}\n\nYour booking is now confirmed. The vendor will be in touch shortly.\n\nOrder ID: ${payment.orderId}\nPayment ID: ${payment.paymentId}\n\n- Eventify Team`
          });
        }

        // Email to vendor
        if (vendorUser?.email) {
          await sendEmail({
            to: vendorUser.email,
            subject: "New Booking Received - Payment Confirmed 🎉",
            text: `Hello ${vendorUser.name},\n\nYou have received a new confirmed booking!\n\nCustomer: ${user?.name}\nEmail: ${user?.email}\nEvent Date: ${new Date(payment.orderDetails.eventDate).toLocaleDateString()}\nAmount Received: ₹${payment.amount}\n\nPlease reach out to the customer to confirm the final details.\n\nOrder ID: ${payment.orderId}\n\n- Eventify Team`
          });
        }
      } catch (emailErr) {
        console.error("EMAIL ERROR (non-critical):", emailErr);
      }
    });

  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ error: "Payment verification failed", details: err.message });
  }
};

// ── GET PAYMENT DETAILS ──────────────────────────────────────────
exports.getPaymentDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payment = await Payment.findOne({ bookingId })
      .populate("userId", "name email")
      .populate("vendorId", "title location");

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // ✅ Check authorization
    if (payment.userId._id.toString() !== req.user.id && 
        payment.vendorId.vendorId?.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET USER PAYMENT HISTORY ─────────────────────────────────────
exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate("vendorId", "title location")
      .populate("bookingId", "date status")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET VENDOR PAYMENT HISTORY ───────────────────────────────────
exports.getVendorPayments = async (req, res) => {
  try {
    // Get all vendors for this user
    const vendors = await Vendor.find({ vendorId: req.user.id });
    const vendorIds = vendors.map(v => v._id);

    const payments = await Payment.find({ vendorId: { $in: vendorIds } })
      .populate("userId", "name email")
      .populate("bookingId", "date status")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ── REQUEST REFUND ───────────────────────────────────────────────
exports.requestRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // ✅ Check authorization
    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // ✅ Can only refund paid payments
    if (payment.status !== "paid") {
      return res.status(400).json({ error: "Only paid payments can be refunded" });
    }

    // ✅ Cannot refund if already refunded
    if (payment.refund.refundStatus !== "none") {
      return res.status(400).json({ error: "This payment has already been refunded" });
    }

    // ✅ Update refund status
    payment.refund = {
      refundReason: reason || "User requested refund",
      refundStatus: "pending",
      refundRequestedAt: new Date()
    };
    await payment.save();

    res.json({ message: "Refund requested successfully", payment });

    // ✅ Notify vendor in background
    setImmediate(async () => {
      try {
        const [user, vendor] = await Promise.all([
          User.findById(payment.userId),
          Vendor.findById(payment.vendorId)
        ]);

        const vendorUser = vendor ? await User.findById(vendor.vendorId) : null;

        if (vendorUser?.email) {
          await sendEmail({
            to: vendorUser.email,
            subject: "Refund Request Received",
            text: `Hello ${vendorUser.name},\n\nA customer has requested a refund for their booking.\n\nCustomer: ${user?.name}\nAmount: ₹${payment.amount}\nReason: ${reason || "Not specified"}\n\nPlease review and approve/deny this request in your dashboard.\n\nOrder ID: ${payment.orderId}\n\n- Eventify Team`
          });
        }
      } catch (emailErr) {
        console.error("EMAIL ERROR (non-critical):", emailErr);
      }
    });

  } catch (err) {
    console.error("REFUND REQUEST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── PROCESS REFUND (Vendor approves) ────────────────────────────
exports.processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { action } = req.body; // "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be approve or reject" });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // ✅ Check authorization (vendor only)
    const vendor = await Vendor.findById(payment.vendorId);
    if (!vendor || vendor.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (action === "approve") {
      // ✅ Process refund with Razorpay
      try {
        const refund = await razorpay.payments.refund(payment.paymentId, {
          amount: Math.round(payment.amount * 100), // Full refund
          notes: {
            bookingId: payment.bookingId,
            reason: payment.refund.refundReason
          }
        });

        payment.refund = {
          refundId: refund.id,
          refundAmount: payment.amount,
          refundReason: payment.refund.refundReason,
          refundStatus: "completed",
          refundRequestedAt: payment.refund.refundRequestedAt,
          refundCompletedAt: new Date()
        };
        payment.status = "refunded";

      } catch (razorpayErr) {
        console.error("RAZORPAY REFUND ERROR:", razorpayErr);
        payment.refund.refundStatus = "failed";
      }
    } else {
      // Reject refund
      payment.refund.refundStatus = "rejected";
    }

    await payment.save();
    res.json({ message: `Refund ${action}ed`, payment });

    // ✅ Notify customer
    setImmediate(async () => {
      try {
        const user = await User.findById(payment.userId);
        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: action === "approve" 
              ? "Refund Approved ✓" 
              : "Refund Request Declined",
            text: action === "approve"
              ? `Hello ${user.name},\n\nYour refund has been approved and processed!\n\nAmount: ₹${payment.amount}\nRefund ID: ${payment.refund.refundId}\n\nThe funds should reflect in your account within 3-5 business days.\n\n- Eventify Team`
              : `Hello ${user.name},\n\nYour refund request has been declined by the vendor.\n\nPlease contact support for further assistance.\n\n- Eventify Team`
          });
        }
      } catch (emailErr) {
        console.error("EMAIL ERROR (non-critical):", emailErr);
      }
    });

  } catch (err) {
    console.error("PROCESS REFUND ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET PAYMENT RECEIPT ──────────────────────────────────────────
exports.getReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("userId", "name email phone")
      .populate("vendorId", "title location");

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // ✅ Check authorization
    if (payment.userId._id.toString() !== req.user.id && 
        payment.vendorId.vendorId?.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({
      receiptNo: `RCP-${payment._id.toString().slice(-8).toUpperCase()}`,
      date: payment.createdAt,
      payment: {
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status
      },
      orderDetails: payment.orderDetails,
      customer: {
        name: payment.userId.name,
        email: payment.userId.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};