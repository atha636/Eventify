const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  // ── Razorpay IDs ──────────────────────────────────────────────────────────
  orderId:           { type: String, required: true, unique: true, index: true },
  paymentId:         { type: String, sparse: true,   index: true               },
  razorpaySignature: String,

  // ── References ────────────────────────────────────────────────────────────
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true, index: true },
  vendorId:  { type: mongoose.Schema.Types.ObjectId, ref: "Vendor",  required: true, index: true },

  // ── Payment Details ───────────────────────────────────────────────────────
  amount:   { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: {
    type:    String,
    enum:    ["created", "paid", "failed", "refunded"],
    default: "created",
    index:   true,
  },

  // ── Payment Plan / Installment Info (NEW) ─────────────────────────────────
  paymentPlan:           { type: String, enum: ["25", "75", "100"] },
  installmentNumber:     { type: Number },   // 1 | 2 | 3
  installmentPercentage: { type: Number },   // 25 | 50 | 75 | 95

  // ── Order Details snapshot ────────────────────────────────────────────────
  orderDetails: {
    packageName:     String,
    packagePrice:    Number,
    eventDate:       Date,
    vendorName:      String,
    vendorLocation:  String,
    userName:        String,
    userEmail:       String,
  },

  // ── Refund ────────────────────────────────────────────────────────────────
  refund: {
    refundId:          String,
    refundAmount:      Number,
    refundReason:      String,
    refundStatus: {
      type:    String,
      enum:    ["none", "pending", "completed", "failed"],
      default: "none",
    },
    refundRequestedAt: Date,
    refundCompletedAt: Date,
  },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now               },

}, { timestamps: true });

paymentSchema.index({ userId:   1, createdAt: -1 });
paymentSchema.index({ vendorId: 1, createdAt: -1 });
paymentSchema.index({ status:   1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
