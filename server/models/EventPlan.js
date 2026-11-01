const mongoose = require("mongoose");

// One line in the budget. Either typed in by hand, or linked to a real booking
// (then `actual` and `paid` are read live from the booking, see planController).
const itemSchema = new mongoose.Schema({
  category:  { type: String, default: "Other", trim: true, maxlength: 40 },
  name:      { type: String, required: true,   trim: true, maxlength: 120 },
  estimated: { type: Number, default: 0, min: 0 },
  actual:    { type: Number, default: 0, min: 0 },   // 0 = not finalised yet
  paid:      { type: Number, default: 0, min: 0 },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
  note:      { type: String, default: "", trim: true, maxlength: 300 },
});

const taskSchema = new mongoose.Schema({
  text:    { type: String, required: true, trim: true, maxlength: 160 },
  done:    { type: Boolean, default: false },
  dueDate: { type: Date, default: null },
});

const eventPlanSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title:       { type: String, required: true, trim: true, maxlength: 100 },
  eventType:   { type: String, default: "Other", trim: true, maxlength: 40 },
  date:        { type: Date, default: null },
  guests:      { type: Number, default: 0, min: 0 },
  totalBudget: { type: Number, default: 0, min: 0 },
  notes:       { type: String, default: "", trim: true, maxlength: 1000 },
  items:       [itemSchema],
  tasks:       [taskSchema],
}, { timestamps: true });

module.exports = mongoose.model("EventPlan", eventPlanSchema);