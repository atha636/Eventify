const rateLimit = require("express-rate-limit");
const Vendor  = require("../models/Vendor");
const Booking = require("../models/Booking");
const User    = require("../models/User");
const mongoose = require("mongoose");
const { checkPromo, PROMO_PERCENT } = require("../utils/promo");

// Vendor codes are short, so keep guessing expensive.
exports.validateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
  skip: () => process.env.NODE_ENV !== "production",
});

// POST /api/promo/validate   { serviceId, code, packageName? }   (customers)
// Tells the booking screen whether the code works and how much it saves.
exports.validate = async (req, res) => {
  try {
    if (req.user?.role !== "user") return res.status(403).json({ error: "Vendor codes are for customer accounts." });
    const { serviceId, code, packageName } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(String(serviceId))) return res.status(404).json({ error: "Service not found." });
    const service = await Vendor.findById(serviceId).populate("vendorId", "name vendorCode");
    if (!service) return res.status(404).json({ error: "Service not found." });

    const chk = await checkPromo({ code, service, userId: req.user.id });
    if (!chk.ok) return res.status(200).json({ valid: false, error: chk.error });

    const price = service.serviceType === "decor"
      ? service.price
      : service.packages?.find((p) => p.name === packageName)?.price;
    res.json({
      valid: true, code: chk.code, percent: chk.percent, vendorName: chk.vendorName,
      savings: price ? Math.round(price * chk.percent / 100) : null,
    });
  } catch (e) {
    console.error("promo validate", e);
    res.status(500).json({ error: "Couldn't check that code." });
  }
};

// GET /api/promo/mine   (vendors) — how their code is doing
exports.mine = async (req, res) => {
  try {
    if (req.user?.role !== "vendor") return res.status(403).json({ error: "Vendors only." });
    const me = await User.findById(req.user.id).select("vendorCode");
    const services = await Vendor.find({ vendorId: req.user.id }).select("_id");
    const base = { ownerId: new mongoose.Types.ObjectId(req.user.id), status: { $in: ["pending", "approved"] } };
    const [uses, first] = await Promise.all([
      Booking.countDocuments({ "promo.ownerId": base.ownerId, status: base.status, vendorId: { $in: services.map((s) => s._id) } }),
      Booking.exists({ "promo.ownerId": base.ownerId, status: base.status, "promo.firstUseForVendor": true }),
    ]);
    res.json({ code: me?.vendorCode || null, percent: PROMO_PERCENT, uses, firstUseDone: !!first });
  } catch (e) {
    console.error("promo mine", e);
    res.status(500).json({ error: "Couldn't load your code stats." });
  }
};