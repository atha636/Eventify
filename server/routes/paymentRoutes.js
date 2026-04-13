const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  getUserPayments,
  getVendorPayments,
  requestRefund,
  processRefund,
  getReceipt
} = require("../controllers/paymentController");

// ── CREATE ORDER (Frontend calls this first) ─────────────────────
// POST /api/payments/create-order
// Body: { bookingId, amount }
router.post("/create-order", auth, createOrder);

// ── VERIFY PAYMENT (Frontend calls this after payment) ────────────
// POST /api/payments/verify
// Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId }
router.post("/verify", auth, verifyPayment);

// ── GET PAYMENT DETAILS ──────────────────────────────────────────
// GET /api/payments/booking/:bookingId
router.get("/booking/:bookingId", auth, getPaymentDetails);

// ── GET USER PAYMENT HISTORY ─────────────────────────────────────
// GET /api/payments/user
router.get("/user", auth, getUserPayments);

// ── GET VENDOR PAYMENT HISTORY ───────────────────────────────────
// GET /api/payments/vendor
router.get("/vendor", auth, getVendorPayments);

// ── REQUEST REFUND ───────────────────────────────────────────────
// POST /api/payments/:paymentId/refund-request
// Body: { reason }
router.post("/:paymentId/refund-request", auth, requestRefund);

// ── PROCESS REFUND (Vendor approves/rejects) ────────────────────
// PUT /api/payments/:paymentId/process-refund
// Body: { action: "approve" | "reject" }
router.put("/:paymentId/process-refund", auth, processRefund);

// ── GET RECEIPT ──────────────────────────────────────────────────
// GET /api/payments/:paymentId/receipt
router.get("/:paymentId/receipt", auth, getReceipt);

module.exports = router;