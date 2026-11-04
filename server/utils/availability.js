const Booking = require("../models/Booking");

const DAY_MS = 86400000;
// Dates are stored as UTC midnight ("YYYY-MM-DD" → Date), so days are compared in UTC.
const dayKey   = (d) => new Date(d).toISOString().slice(0, 10);
const dayStart = (key) => new Date(`${key}T00:00:00.000Z`);
const validKey = (k) => typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k) && !isNaN(dayStart(k).getTime());

const isBlocked = (service, date) => {
  const k = dayKey(date);
  return (service?.availability || []).some((a) => !a.available && dayKey(a.date) === k);
};

// Is there an approved booking for this service on that day? (only matters when autoBlockBooked is on)
async function hasApprovedBooking(serviceId, date) {
  const start = dayStart(dayKey(date));
  return !!(await Booking.exists({
    vendorId: serviceId, status: "approved",
    date: { $gte: start, $lt: new Date(start.getTime() + DAY_MS) },
  }));
}

module.exports = { DAY_MS, dayKey, dayStart, validKey, isBlocked, hasApprovedBooking };