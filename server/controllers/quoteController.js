const mongoose     = require("mongoose");
const Quote        = require("../models/Quote");
const Vendor       = require("../models/Vendor");
const Booking      = require("../models/Booking");
const User         = require("../models/User");
const Conversation = require("../models/Conversation");
const Message      = require("../models/Message");
const Notification = require("../models/Notification");

const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const str  = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const numOr0 = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0; };
const inr  = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const fmt  = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fail = (res, e, label) => { console.error(`${label}:`, e); res.status(500).json({ error: "Something went wrong. Please try again." }); };

// same split as bookingController.buildInstallments
function buildInstallments(plan, price) {
  const p = Number(price);
  if (plan === "25") return [
    { installmentNumber: 1, percentage: 25, amount: Math.round(p * 0.25), status: "pending" },
    { installmentNumber: 2, percentage: 50, amount: Math.round(p * 0.50), status: "pending" },
    { installmentNumber: 3, percentage: 25, amount: Math.round(p * 0.25), status: "pending" },
  ];
  if (plan === "75") return [
    { installmentNumber: 1, percentage: 75, amount: Math.round(p * 0.75), status: "pending" },
    { installmentNumber: 2, percentage: 25, amount: Math.round(p * 0.25), status: "pending" },
  ];
  return [{ installmentNumber: 1, percentage: 95, amount: Math.round(p * 0.95), status: "pending" }];
}

const midnight = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

// Posts a chat message tied to the quote, bumps the other side's unread counter. Never throws.
async function say({ quote, fromUserId, text }) {
  try {
    const convo = await Conversation.findById(quote.conversationId);
    if (!convo) return;
    const msg = await Message.create({ conversationId: convo._id, senderId: fromUserId, text: str(text, 1900), quoteId: quote._id });
    convo.lastMessage = { text: msg.text, senderId: fromUserId, createdAt: msg.createdAt };
    if (String(fromUserId) === String(convo.userId)) convo.unreadForVendor += 1; else convo.unreadForUser += 1;
    await convo.save();
  } catch (e) { console.error("quote chat message (non-fatal):", e.message); }
}
async function notify({ userId, type, title, message, link, bookingId = null }) {
  try { await Notification.create({ userId, type, title, message, link, bookingId }); }
  catch (e) { console.error("quote notification (non-fatal):", e.message); }
}

// An offer nobody answered in time becomes "expired" the next time anyone looks at it
async function refreshExpiry(q) {
  if (q.status === "offered" && q.offer?.validUntil && q.offer.validUntil < new Date()) {
    const r = await Quote.findOneAndUpdate({ _id: q._id, status: "offered" }, { $set: { status: "expired" } }, { new: true });
    if (r) q.status = "expired";
  }
  return q;
}

// Which side is this user? null = stranger
const sideOf = (q, uid) => (String(q.userId?._id || q.userId) === String(uid) ? "user"
  : String(q.vendorUserId?._id || q.vendorUserId) === String(uid) ? "vendor" : null);

async function present(q, side) {
  const full = await Quote.findById(q._id)
    .populate("userId", "name").populate("vendorUserId", "name").populate("serviceId", "title packages price serviceType").lean();
  return {
    _id: full._id, status: full.status, side,
    request: full.request, offer: full.offer, declineNote: full.declineNote,
    bookingId: full.bookingId, conversationId: full.conversationId, createdAt: full.createdAt,
    service: { _id: full.serviceId?._id, title: full.serviceId?.title || "Service" },
    customer: { name: full.userId?.name || "Customer" },
    vendor:   { name: full.vendorUserId?.name || "Vendor" },
  };
}

// ── 1. customer asks for a quote ─────────────────────────────────────────────
// POST /api/quotes   { serviceId, eventType, date, guests, budget, address, details }
exports.createQuote = async (req, res) => {
  try {
    if (req.user.role !== "user") return res.status(403).json({ error: "Only customers can request quotes." });
    const b = req.body;
    if (!isId(b.serviceId)) return res.status(400).json({ error: "Choose a service first." });

    const date = new Date(b.date);
    if (!b.date || Number.isNaN(date.getTime())) return res.status(400).json({ error: "Please choose your event date." });
    if (date < midnight(new Date())) return res.status(400).json({ error: "The event date can't be in the past." });

    const service = await Vendor.findById(b.serviceId).select("vendorId title isApproved");
    if (!service || !service.isApproved) return res.status(404).json({ error: "This service isn't available right now." });
    if (String(service.vendorId) === String(req.user.id)) return res.status(400).json({ error: "You can't request a quote from yourself." });

    const open = await Quote.findOne({ userId: req.user.id, serviceId: service._id, status: { $in: ["requested", "offered"] } });
    if (open) return res.status(409).json({ error: "You already have an open quote request for this service.", conversationId: open.conversationId });

    let convo = await Conversation.findOne({ userId: req.user.id, vendorId: service.vendorId });
    if (!convo) convo = await Conversation.create({ userId: req.user.id, vendorId: service.vendorId, serviceId: service._id });

    const quote = await Quote.create({
      userId: req.user.id, vendorUserId: service.vendorId, serviceId: service._id, conversationId: convo._id,
      request: {
        eventType: str(b.eventType, 40), date, guests: numOr0(b.guests), budget: numOr0(b.budget),
        address: str(b.address, 200), details: str(b.details, 800),
      },
    });

    const me = await User.findById(req.user.id).select("name");
    const summary = `Quote request for "${service.title}" — ${fmt(date)}${quote.request.guests ? `, ${quote.request.guests} guests` : ""}${quote.request.budget ? `, budget ${inr(quote.request.budget)}` : ""}`;
    await say({ quote, fromUserId: req.user.id, text: summary });
    notify({ userId: service.vendorId, type: "quote_requested", title: "New quote request",
      message: `${me?.name || "A customer"} wants a quote for ${fmt(date)}. Open the chat to reply with your price.`,
      link: `/messages?c=${convo._id}` });

    res.status(201).json({ quote: await present(quote, "user"), conversationId: convo._id });
  } catch (e) { fail(res, e, "createQuote"); }
};

// ── read ─────────────────────────────────────────────────────────────────────
// GET /api/quotes/:id
exports.getQuote = async (req, res) => {
  try {
    const q = isId(req.params.id) ? await Quote.findById(req.params.id) : null;
    const side = q && sideOf(q, req.user.id);
    if (!q || !side) return res.status(404).json({ error: "Quote not found." });
    await refreshExpiry(q);
    res.json(await present(q, side));
  } catch (e) { fail(res, e, "getQuote"); }
};

// ── 2. vendor sends (or revises) an offer ────────────────────────────────────
// POST /api/quotes/:id/offer   { price, packageName, inclusions[], note, validDays }
exports.sendOffer = async (req, res) => {
  try {
    const q = isId(req.params.id) ? await Quote.findById(req.params.id) : null;
    if (!q || sideOf(q, req.user.id) !== "vendor") return res.status(404).json({ error: "Quote not found." });
    await refreshExpiry(q);
    if (!["requested", "offered", "expired"].includes(q.status)) return res.status(400).json({ error: `This request is already ${q.status}.` });

    const price = Math.round(Number(req.body.price));
    if (!Number.isFinite(price) || price < 1 || price > 100000000) return res.status(400).json({ error: "Enter a valid price in ₹." });
    const validDays = Math.min(30, Math.max(1, parseInt(req.body.validDays, 10) || 7));

    // never promise a date the vendor has blocked
    const service = await Vendor.findById(q.serviceId).select("availability title");
    const day = midnight(q.request.date), next = new Date(day.getTime() + 86400000);
    if ((service?.availability || []).some((a) => !a.available && a.date >= day && a.date < next))
      return res.status(409).json({ error: "You've marked that date as unavailable. Unblock it first, or decline this request." });

    q.offer = {
      price,
      packageName: str(req.body.packageName, 80) || "Custom offer",
      inclusions: (Array.isArray(req.body.inclusions) ? req.body.inclusions : []).slice(0, 10).map((s) => str(s, 120)).filter(Boolean),
      note: str(req.body.note, 600),
      validUntil: new Date(Date.now() + validDays * 86400000),
      offeredAt: new Date(),
    };
    q.status = "offered";
    await q.save();

    await say({ quote: q, fromUserId: req.user.id, text: `Custom offer: ${inr(price)} — ${q.offer.packageName} (valid ${validDays} day${validDays > 1 ? "s" : ""})` });
    const vendorUser = await User.findById(req.user.id).select("name");
    notify({ userId: q.userId, type: "quote_offered", title: "You received an offer",
      message: `${vendorUser?.name || "The vendor"} offered ${inr(price)} for your event on ${fmt(q.request.date)}.`,
      link: `/messages?c=${q.conversationId}` });

    res.json(await present(q, "vendor"));
  } catch (e) { fail(res, e, "sendOffer"); }
};

// ── 3. customer accepts → booking ────────────────────────────────────────────
// POST /api/quotes/:id/accept   { paymentPlan, name, phone, address }
exports.acceptQuote = async (req, res) => {
  try {
    const q = isId(req.params.id) ? await Quote.findById(req.params.id) : null;
    if (!q || sideOf(q, req.user.id) !== "user") return res.status(404).json({ error: "Quote not found." });
    await refreshExpiry(q);
    if (q.status === "expired") return res.status(400).json({ error: "This offer has expired. Ask the vendor for a new one." });
    if (q.status !== "offered") return res.status(400).json({ error: `This quote is ${q.status}.` });

    const plan = String(req.body.paymentPlan || "100");
    if (!["25", "75", "100"].includes(plan)) return res.status(400).json({ error: "Choose a payment plan." });
    if (q.request.date < midnight(new Date())) return res.status(400).json({ error: "The event date has already passed." });

    const service = await Vendor.findById(q.serviceId).select("availability title isApproved");
    if (!service || !service.isApproved) return res.status(400).json({ error: "This service is no longer available." });
    const day = midnight(q.request.date), next = new Date(day.getTime() + 86400000);
    if ((service.availability || []).some((a) => !a.available && a.date >= day && a.date < next))
      return res.status(409).json({ error: "The vendor is no longer available on that date." });
    const clash = await Booking.findOne({ userId: q.userId, vendorId: q.serviceId, date: q.request.date, status: { $in: ["pending", "approved"] } });
    if (clash) return res.status(409).json({ error: "You already have a booking with this vendor on that date." });

    // claim the offer atomically so a double-click can't create two bookings
    const claimed = await Quote.findOneAndUpdate({ _id: q._id, status: "offered" }, { $set: { status: "accepted" } }, { new: true });
    if (!claimed) return res.status(409).json({ error: "This offer was just updated. Please refresh." });

    let booking;
    try {
      const me = await User.findById(req.user.id).select("name phone");
      booking = await Booking.create({
        userId: q.userId, vendorId: q.serviceId,
        packageName: q.offer.packageName, packagePrice: q.offer.price, date: q.request.date,
        status: "approved",                      // the vendor already agreed to this price
        userDetails: {
          name: str(req.body.name, 80) || me?.name || "",
          phone: str(req.body.phone, 20) || me?.phone || "",
          address: str(req.body.address, 200) || q.request.address || "",
        },
        paymentPlan: plan, installments: buildInstallments(plan, q.offer.price),
        totalPaid: 0, paymentComplete: false, paymentStatus: "pending",
      });
    } catch (err) {
      await Quote.updateOne({ _id: q._id }, { $set: { status: "offered" } });   // put it back so they can retry
      throw err;
    }
    await Quote.updateOne({ _id: q._id }, { $set: { bookingId: booking._id } });
    claimed.bookingId = booking._id;

    await say({ quote: claimed, fromUserId: req.user.id, text: `Offer accepted: ${inr(q.offer.price)} — booking created for ${fmt(q.request.date)}.` });
    const first = booking.installments[0]?.amount || 0;
    notify({ userId: q.vendorUserId, type: "quote_accepted", title: "Offer accepted 🎉",
      message: `Your ${inr(q.offer.price)} offer for ${fmt(q.request.date)} was accepted. It's now in your bookings.`,
      link: "/vendor-dashboard", bookingId: booking._id });
    notify({ userId: q.userId, type: "quote_accepted", title: "Booking confirmed — pay to lock your date",
      message: `Pay ${inr(first)} now to secure ${service.title} on ${fmt(q.request.date)}.`,
      link: "/my-bookings", bookingId: booking._id });

    res.json({ quote: await present(claimed, "user"), bookingId: booking._id });
  } catch (e) { fail(res, e, "acceptQuote"); }
};

// ── 4. decline / cancel ──────────────────────────────────────────────────────
// POST /api/quotes/:id/decline   { note }
//   vendor: requested|offered → declined      customer: offered → declined, requested → cancelled
exports.declineQuote = async (req, res) => {
  try {
    const q = isId(req.params.id) ? await Quote.findById(req.params.id) : null;
    const side = q && sideOf(q, req.user.id);
    if (!q || !side) return res.status(404).json({ error: "Quote not found." });
    await refreshExpiry(q);
    if (!["requested", "offered"].includes(q.status)) return res.status(400).json({ error: `This quote is already ${q.status}.` });

    const next = side === "user" && q.status === "requested" ? "cancelled" : "declined";
    const note = str(req.body.note, 300);
    const done = await Quote.findOneAndUpdate({ _id: q._id, status: q.status }, { $set: { status: next, declineNote: note } }, { new: true });
    if (!done) return res.status(409).json({ error: "This quote was just updated. Please refresh." });

    const who = await User.findById(req.user.id).select("name");
    const label = next === "cancelled" ? "Quote request cancelled" : side === "vendor" ? "Request declined by the vendor" : "Offer declined";
    await say({ quote: done, fromUserId: req.user.id, text: `${label}${note ? `: ${note}` : "."}` });
    notify({ userId: side === "user" ? q.vendorUserId : q.userId, type: "quote_declined", title: label,
      message: `${who?.name || "The other party"} ${next === "cancelled" ? "cancelled the request" : "declined"} for ${fmt(q.request.date)}.`,
      link: `/messages?c=${q.conversationId}` });

    res.json(await present(done, side));
  } catch (e) { fail(res, e, "declineQuote"); }
};