const mongoose = require("mongoose");

// ── Per-installment tracking ──────────────────────────────────────────────────
const installmentSchema = new mongoose.Schema({
  installmentNumber: { type: Number, required: true },   // 1, 2, 3
  percentage:        { type: Number, required: true },   // 25 | 50 | 75 | 95
  amount:            { type: Number, required: true },   // actual ₹ value
  status:            { type: String, enum: ["pending", "link_sent", "paid"], default: "pending" },
  paymentId:         { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
  paidAt:            { type: Date, default: null },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  // ── Core ───────────────────────────────────────────────────────────────────
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User"   },
  vendorId:     { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  packageName:  String,
  packagePrice: Number,
  date:         Date,

  status: {
    type:    String,
    enum:    ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },

  userDetails: {
    name:    { type: String, default: "" },
    phone:   { type: String, default: "" },
    address: { type: String, default: "" },
  },

  // ── Payment Plan ────────────────────────────────────────────────────────────
  // "25"  → 25% now · 50% 2–3 days before event · 25% after event
  // "75"  → 75% now · 25% after event confirmation
  // "100" → 95% now (5% discount applied)
  paymentPlan:     { type: String, enum: ["25", "75", "100"], default: "100" },
  installments:    [installmentSchema],
  totalPaid:       { type: Number,  default: 0     },
  paymentComplete: { type: Boolean, default: false  },

  // ── Event Confirmation (triggers final installment for 25% / 75% plans) ───
  eventConfirmedByVendor: { type: Boolean, default: false },
  eventConfirmedByUser:   { type: Boolean, default: false },
  eventConfirmedAt:       { type: Date,    default: null  },
  finalPaymentLinkSent:   { type: Boolean, default: false },

  // ── Reminder tracking (25% plan: remind for 50% installment before event) ─
  reminderSentCount:  { type: Number, default: 0    },
  lastReminderSentAt: { type: Date,   default: null },

  // ── Legacy / backward-compat fields ────────────────────────────────────────
  paymentId: {
    type:   mongoose.Schema.Types.ObjectId,
    ref:    "Payment",
    sparse: true,
  },
  paymentStatus: {
    type:    String,
    enum:    ["pending", "partial", "paid", "failed"],
    default: "pending",
  },
  paidAt: Date,

  // ── Date / Address Change Request ──────────────────────────────────────────
  dateChangeRequest: {
    requestedDate:    { type: Date,   default: null },
    requestedAddress: { type: String, default: null },
    reason:           { type: String, default: ""   },
    status: {
      type:    String,
      enum:    ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    requestedAt: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
  },

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
