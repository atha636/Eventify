const crypto    = require("crypto");
const mongoose  = require("mongoose");
const Board     = require("../models/Board");
const Vendor    = require("../models/Vendor");
const EventPlan = require("../models/EventPlan");

const MAX_BOARDS = 20, MAX_ITEMS = 30, MAX_VOTES = 600;
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v));
const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, n);

const fromPrice = (s) => {
  if (s.serviceType === "decor") return s.price || 0;
  const p = (s.packages || []).map((x) => x.price).filter((x) => x > 0);
  return p.length ? Math.min(...p) : s.price || 0;
};
const summarize = (s) => ({
  _id: s._id, title: s.title, serviceType: s.serviceType,
  locations: s.locations?.length ? s.locations : (s.location ? [s.location] : []),
  image: s.images?.[0] || "", rating: s.rating || 0, reviewCount: s.reviewCount || 0,
  fromPrice: fromPrice(s), verified: !!s.vendorId?.isVendorVerified,
});
const SERVICE_FIELDS = "title serviceType location locations images packages price rating reviewCount isApproved vendorId";

// per-service vote summary; `key` (optional) marks the caller's own vote
function tally(board, serviceId, key, maxNames = 50) {
  const v = (board.votes || []).filter((x) => String(x.serviceId) === String(serviceId));
  return {
    up: v.filter((x) => x.value === 1).length,
    down: v.filter((x) => x.value === -1).length,
    voters: v.slice(0, maxNames).map((x) => ({ name: x.name, value: x.value })),
    mine: key ? (v.find((x) => x.voterKey === key)?.value || 0) : 0,
  };
}

const mine = async (req, res) => {
  if (!isId(req.params.id)) { res.status(404).json({ error: "Board not found." }); return null; }
  const b = await Board.findOne({ _id: req.params.id, userId: req.user.id });
  if (!b) { res.status(404).json({ error: "Board not found." }); return null; }
  return b;
};

// ───────── owner API ─────────

// GET /api/boards  → light list (+ the service ids on each board, for the "save to board" popover)
exports.list = async (req, res) => {
  try {
    const boards = await Board.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    const firstIds = [...new Set(boards.flatMap((b) => b.items.slice(0, 3).map((i) => String(i.serviceId))))];
    const svcs = firstIds.length ? await Vendor.find({ _id: { $in: firstIds } }).select("images") : [];
    const img = Object.fromEntries(svcs.map((s) => [String(s._id), s.images?.[0] || ""]));
    res.json(boards.map((b) => ({
      _id: b._id, name: b.name, emoji: b.emoji, count: b.items.length,
      serviceIds: b.items.map((i) => String(i.serviceId)),
      thumbs: b.items.slice(0, 3).map((i) => img[String(i.serviceId)]).filter(Boolean),
      shared: !!b.share?.enabled, votes: b.votes.length,
    })));
  } catch (e) { console.error("boards list", e); res.status(500).json({ error: "Couldn't load your boards." }); }
};

exports.create = async (req, res) => {
  try {
    const name = clean(req.body?.name, 40);
    if (!name) return res.status(400).json({ error: "Give your board a name." });
    if ((await Board.countDocuments({ userId: req.user.id })) >= MAX_BOARDS) return res.status(400).json({ error: `You can have up to ${MAX_BOARDS} boards.` });
    const b = await Board.create({ userId: req.user.id, name, emoji: clean(req.body?.emoji, 8) || "✨" });
    // optionally start with a vendor already in it
    if (req.body?.serviceId && isId(req.body.serviceId) && (await Vendor.exists({ _id: req.body.serviceId }))) {
      b.items.push({ serviceId: req.body.serviceId }); await b.save();
    }
    res.status(201).json({ _id: b._id, name: b.name, emoji: b.emoji, count: b.items.length });
  } catch (e) { console.error("board create", e); res.status(500).json({ error: "Couldn't create the board." }); }
};

exports.get = async (req, res) => {
  try {
    const b = await mine(req, res); if (!b) return;
    const svcs = await Vendor.find({ _id: { $in: b.items.map((i) => i.serviceId) } }).select(SERVICE_FIELDS).populate("vendorId", "isVendorVerified");
    const byId = Object.fromEntries(svcs.map((s) => [String(s._id), s]));
    const items = b.items.filter((i) => byId[String(i.serviceId)]).map((i) => ({
      service: summarize(byId[String(i.serviceId)]), note: i.note, ...tally(b, i.serviceId),
    }));
    res.json({
      _id: b._id, name: b.name, emoji: b.emoji, planId: b.planId, items,
      share: { enabled: !!b.share?.enabled, token: b.share?.token || null },
      totalVotes: b.votes.length,
    });
  } catch (e) { console.error("board get", e); res.status(500).json({ error: "Couldn't load this board." }); }
};

exports.update = async (req, res) => {
  try {
    const b = await mine(req, res); if (!b) return;
    if (req.body?.name !== undefined) { const n = clean(req.body.name, 40); if (!n) return res.status(400).json({ error: "Give your board a name." }); b.name = n; }
    if (req.body?.emoji !== undefined) b.emoji = clean(req.body.emoji, 8) || "✨";
    if (req.body?.planId !== undefined) {
      if (req.body.planId === null || req.body.planId === "") b.planId = null;
      else {
        if (!isId(req.body.planId) || !(await EventPlan.exists({ _id: req.body.planId, userId: req.user.id }))) return res.status(400).json({ error: "That event plan wasn't found." });
        b.planId = req.body.planId;
      }
    }
    await b.save();
    res.json({ ok: true, name: b.name, emoji: b.emoji, planId: b.planId });
  } catch (e) { console.error("board update", e); res.status(500).json({ error: "Couldn't save changes." }); }
};

exports.remove = async (req, res) => {
  try { const b = await mine(req, res); if (!b) return; await b.deleteOne(); res.json({ ok: true }); }
  catch (e) { console.error("board delete", e); res.status(500).json({ error: "Couldn't delete the board." }); }
};

exports.addItem = async (req, res) => {
  try {
    const b = await mine(req, res); if (!b) return;
    const { serviceId } = req.body || {};
    if (!isId(serviceId) || !(await Vendor.exists({ _id: serviceId }))) return res.status(404).json({ error: "That vendor wasn't found." });
    if (!b.items.some((i) => String(i.serviceId) === String(serviceId))) {
      if (b.items.length >= MAX_ITEMS) return res.status(400).json({ error: `A board can hold up to ${MAX_ITEMS} vendors.` });
      b.items.push({ serviceId, note: clean(req.body.note, 200) });
      await b.save();
    }
    res.json({ ok: true, count: b.items.length });
  } catch (e) { console.error("board addItem", e); res.status(500).json({ error: "Couldn't add to the board." }); }
};

exports.updateItem = async (req, res) => {
  try {
    const b = await mine(req, res); if (!b) return;
    const it = b.items.find((i) => String(i.serviceId) === String(req.params.serviceId));
    if (!it) return res.status(404).json({ error: "That vendor isn't on this board." });
    it.note = clean(req.body?.note, 200); await b.save();
    res.json({ ok: true, note: it.note });
  } catch (e) { console.error("board updateItem", e); res.status(500).json({ error: "Couldn't save the note." }); }
};

exports.removeItem = async (req, res) => {
  try {
    const b = await mine(req, res); if (!b) return;
    const sid = String(req.params.serviceId);
    b.items = b.items.filter((i) => String(i.serviceId) !== sid);
    b.votes = b.votes.filter((v) => String(v.serviceId) !== sid);     // votes for a removed vendor are meaningless
    await b.save();
    res.json({ ok: true, count: b.items.length });
  } catch (e) { console.error("board removeItem", e); res.status(500).json({ error: "Couldn't remove it." }); }
};

// POST /api/boards/:id/share  { enabled: bool, regenerate?: bool }
exports.setShare = async (req, res) => {
  try {
    const b = await mine(req, res); if (!b) return;
    const { enabled, regenerate } = req.body || {};
    if (typeof enabled !== "boolean") return res.status(400).json({ error: "enabled must be true or false." });
    if (enabled && (!b.share.token || regenerate === true)) b.share.token = crypto.randomBytes(12).toString("base64url");
    if (regenerate === true && enabled) b.votes = [];                    // a new link starts with a clean slate
    b.share.enabled = enabled;
    await b.save();
    res.json({ enabled: b.share.enabled, token: b.share.token });
  } catch (e) { console.error("board share", e); res.status(500).json({ error: "Couldn't update sharing." }); }
};

// ───────── public API (no login) ─────────

const findShared = async (token) => {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(String(token))) return null;
  return Board.findOne({ "share.enabled": true, "share.token": token });
};

// GET /api/shared/:token?k=<voterKey>
exports.publicGet = async (req, res) => {
  try {
    const b = await findShared(req.params.token);
    if (!b) return res.status(404).json({ error: "This link isn't active any more." });
    const key = /^[A-Za-z0-9_-]{8,40}$/.test(String(req.query.k || "")) ? String(req.query.k) : "";
    const [svcs, owner, plan] = await Promise.all([
      Vendor.find({ _id: { $in: b.items.map((i) => i.serviceId) }, isApproved: true }).select(SERVICE_FIELDS).populate("vendorId", "isVendorVerified"),
      require("../models/User").findById(b.userId).select("name"),
      b.planId ? EventPlan.findOne({ _id: b.planId, userId: b.userId }).select("title eventType date guests tasks") : null,
    ]);
    const byId = Object.fromEntries(svcs.map((s) => [String(s._id), s]));
    res.json({
      name: b.name, emoji: b.emoji,
      owner: clean(String(owner?.name || "").split(" ")[0], 30) || "Someone",
      event: plan ? {
        title: plan.title, eventType: plan.eventType, date: plan.date, guests: plan.guests,
        tasksDone: plan.tasks.filter((t) => t.done).length, tasksTotal: plan.tasks.length,
      } : null,
      items: b.items.filter((i) => byId[String(i.serviceId)]).map((i) => ({
        service: summarize(byId[String(i.serviceId)]), note: i.note, ...tally(b, i.serviceId, key, 12),
      })),
    });
  } catch (e) { console.error("shared get", e); res.status(500).json({ error: "Couldn't load this page." }); }
};

// POST /api/shared/:token/vote  { serviceId, voterKey, name, value: 1 | -1 | 0 }
exports.publicVote = async (req, res) => {
  try {
    const b = await findShared(req.params.token);
    if (!b) return res.status(404).json({ error: "This link isn't active any more." });
    const { serviceId, voterKey, value } = req.body || {};
    const name = clean(req.body?.name, 30);
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(String(voterKey || ""))) return res.status(400).json({ error: "Something went wrong. Please refresh the page." });
    if (!name) return res.status(400).json({ error: "Please tell us your name first." });
    if (![1, -1, 0].includes(value)) return res.status(400).json({ error: "Invalid vote." });
    if (!isId(serviceId) || !b.items.some((i) => String(i.serviceId) === String(serviceId))) return res.status(404).json({ error: "That vendor isn't on this board." });

    b.votes = b.votes.filter((v) => !(v.voterKey === voterKey && String(v.serviceId) === String(serviceId)));
    if (value !== 0) {
      if (b.votes.length >= MAX_VOTES) return res.status(429).json({ error: "This board has reached its vote limit." });
      b.votes.push({ serviceId, voterKey, name, value });
    }
    b.votes.forEach((v) => { if (v.voterKey === voterKey) v.name = name; });   // keep one consistent name per friend
    await b.save();
    res.json({ ok: true, ...tally(b, serviceId, voterKey, 12) });
  } catch (e) { console.error("shared vote", e); res.status(500).json({ error: "Couldn't save your vote." }); }
};