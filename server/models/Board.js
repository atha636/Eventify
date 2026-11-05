const mongoose = require("mongoose");

// A named shortlist ("Wedding decor", "Birthday ideas"). The owner can share it through a
// public link; friends open that link without an account and vote on the shortlisted vendors.
const itemSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  note:      { type: String, default: "", trim: true, maxlength: 200 },
  addedAt:   { type: Date, default: Date.now },
}, { _id: false });

const voteSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  voterKey:  { type: String, required: true },      // random id kept in the friend's browser
  name:      { type: String, required: true, maxlength: 30 },
  value:     { type: Number, enum: [1, -1], required: true },
}, { _id: false });

const boardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name:   { type: String, required: true, trim: true, maxlength: 40 },
  emoji:  { type: String, default: "✨", maxlength: 8 },
  items:  [itemSchema],
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "EventPlan", default: null },   // optional: show event details on the shared page
  share:  {
    enabled: { type: Boolean, default: false },
    token:   { type: String, default: null },
  },
  votes:  [voteSchema],
}, { timestamps: true });

boardSchema.index({ "share.token": 1 }, { unique: true, partialFilterExpression: { "share.token": { $type: "string" } } });

module.exports = mongoose.model("Board", boardSchema);