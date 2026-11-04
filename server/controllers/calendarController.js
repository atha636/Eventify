const Vendor  = require("../models/Vendor");
const Booking = require("../models/Booking");
const { DAY_MS, dayKey, dayStart, validKey } = require("../utils/availability");

const requireVendor = (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Unauthorized" }); return false; }
  if (req.user.role !== "vendor") { res.status(403).json({ error: "Only vendors can manage a calendar." }); return false; }
  return true;
};

// GET /api/calendar?month=YYYY-MM
// Everything the vendor's calendar page needs for one month, across all their services.
exports.getCalendar = async (req, res) => {
  try {
    if (!requireVendor(req, res)) return;
    const m = /^(\d{4})-(\d{2})$/.exec(String(req.query.month || ""));
    if (!m || +m[2] < 1 || +m[2] > 12) return res.status(400).json({ error: "month must be YYYY-MM" });
    const start = new Date(Date.UTC(+m[1], +m[2] - 1, 1));
    const end   = new Date(Date.UTC(+m[1], +m[2], 1));

    const services = await Vendor.find({ vendorId: req.user.id }).select("title serviceType availability autoBlockBooked");
    const ids = services.map((s) => s._id);

    const bookings = ids.length
      ? await Booking.find({ vendorId: { $in: ids }, status: { $in: ["pending", "approved"] }, date: { $gte: start, $lt: end } })
          .populate("userId", "name").sort({ date: 1 })
      : [];

    res.json({
      month: req.query.month,
      services: services.map((s) => ({
        _id: s._id, title: s.title, serviceType: s.serviceType, autoBlockBooked: !!s.autoBlockBooked,
        blocked: (s.availability || []).filter((a) => !a.available).map((a) => dayKey(a.date)).sort(),
      })),
      bookings: bookings.map((b) => ({
        _id: b._id, serviceId: b.vendorId, date: dayKey(b.date), status: b.status,
        packageName: b.packageName || "", price: b.packagePrice || 0,
        customer: b.userId?.name || b.userDetails?.name || "Customer",
      })),
    });
  } catch (err) {
    console.error("getCalendar ERROR:", err);
    res.status(500).json({ error: "Could not load calendar." });
  }
};

// PUT /api/calendar/block   { serviceIds: [..], dates: ["YYYY-MM-DD"], blocked: true|false }
// Blocks or re-opens several dates on several services in one go. Never touches other dates.
exports.setBlocked = async (req, res) => {
  try {
    if (!requireVendor(req, res)) return;
    const { serviceIds, dates, blocked } = req.body || {};
    if (!Array.isArray(serviceIds) || !serviceIds.length) return res.status(400).json({ error: "Pick at least one service." });
    if (!Array.isArray(dates) || !dates.length) return res.status(400).json({ error: "Pick at least one date." });
    if (dates.length > 400) return res.status(400).json({ error: "Too many dates at once (max 400)." });
    if (typeof blocked !== "boolean") return res.status(400).json({ error: "blocked must be true or false." });
    const keys = [...new Set(dates)];
    if (!keys.every(validKey)) return res.status(400).json({ error: "Dates must look like YYYY-MM-DD." });

    const today = dayKey(new Date());
    const future = keys.filter((k) => k >= today);          // past days can't be changed
    if (!future.length) return res.status(400).json({ error: "Those dates are in the past." });

    const services = await Vendor.find({ _id: { $in: serviceIds }, vendorId: req.user.id });
    if (services.length !== new Set(serviceIds.map(String)).size) return res.status(403).json({ error: "You can only edit your own services." });

    // dates that already have an approved booking — the page warns first; we report them back
    const start = dayStart(future[0]);
    const last  = dayStart(future[future.length - 1]);
    const booked = await Booking.find({
      vendorId: { $in: services.map((s) => s._id) }, status: "approved",
      date: { $gte: start, $lt: new Date(last.getTime() + DAY_MS) },
    }).select("date vendorId");
    const bookedKeys = new Set(booked.map((b) => `${b.vendorId}|${dayKey(b.date)}`));

    let changed = 0; const conflicts = [];
    for (const s of services) {
      const set = new Set(future);
      const kept = (s.availability || []).filter((a) => !set.has(dayKey(a.date)));
      const had  = new Set((s.availability || []).filter((a) => !a.available).map((a) => dayKey(a.date)));
      if (blocked) {
        future.forEach((k) => { kept.push({ date: dayStart(k), available: false }); if (!had.has(k)) changed++; });
        future.forEach((k) => bookedKeys.has(`${s._id}|${k}`) && conflicts.push({ serviceId: s._id, date: k }));
      } else {
        future.forEach((k) => had.has(k) && changed++);
      }
      s.availability = kept;
      await s.save();
    }
    res.json({ ok: true, changed, skippedPast: keys.length - future.length, conflicts });
  } catch (err) {
    console.error("setBlocked ERROR:", err);
    res.status(500).json({ error: "Could not update the calendar." });
  }
};

// PUT /api/calendar/service/:id   { autoBlockBooked: bool }
exports.updateServiceSettings = async (req, res) => {
  try {
    if (!requireVendor(req, res)) return;
    if (typeof req.body?.autoBlockBooked !== "boolean") return res.status(400).json({ error: "autoBlockBooked must be true or false." });
    const s = await Vendor.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!s) return res.status(404).json({ error: "Service not found." });
    s.autoBlockBooked = req.body.autoBlockBooked;
    await s.save();
    res.json({ ok: true, autoBlockBooked: s.autoBlockBooked });
  } catch (err) {
    console.error("updateServiceSettings ERROR:", err);
    res.status(500).json({ error: "Could not save." });
  }
};