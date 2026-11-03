const mongoose = require("mongoose");

// A customer's request for a custom price, and the vendor's offer in reply.
// requested → offered → accepted (becomes a Booking)
//                    ↘ declined / cancelled / expired
const quoteSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User",         required: true, index: true },
  vendorUserId:   { type: mongoose.Schema.Types.ObjectId, ref: "User",         required: true, index: true },
  serviceId:      { type: mongoose.Schema.Types.ObjectId, ref: "Vendor",       required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },

  request: {
    eventType: { type: String, default: "", trim: true, maxlength: 40 },
    date:      { type: Date,   required: true },
    guests:    { type: Number, default: 0, min: 0 },
    budget:    { type: Number, default: 0, min: 0 },
    address:   { type: String, default: "", trim: true, maxlength: 200 },
    details:   { type: String, default: "", trim: true, maxlength: 800 },
  },

  status: {
    type: String,
    enum: ["requested", "offered", "accepted", "declined", "cancelled", "expired"],
    default: "requested",
    index: true,
  },

  offer: {
    price:       { type: Number, default: 0 },
    packageName: { type: String, default: "", trim: true, maxlength: 80 },
    inclusions:  [{ type: String, trim: true, maxlength: 120 }],
    note:        { type: String, default: "", trim: true, maxlength: 600 },
    validUntil:  { type: Date, default: null },
    offeredAt:   { type: Date, default: null },
  },

  declineNote: { type: String, default: "", trim: true, maxlength: 300 },
  bookingId:   { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Quote", quoteSchema);