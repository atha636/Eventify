const mongoose  = require("mongoose");
const EventPlan = require("../models/EventPlan");
const Booking   = require("../models/Booking");

const MAX_PLANS = 20;
const MAX_ITEMS = 150;
const MAX_TASKS = 150;

// Starter budget split + checklist, used when a plan is created "from template"
const TEMPLATE_SPLIT = [
  ["Venue", 30], ["Catering", 30], ["Decor", 12], ["Photography", 10],
  ["Entertainment", 6], ["Attire & beauty", 6], ["Miscellaneous", 6],
];
const TEMPLATE_TASKS = [
  "Fix the date and guest count", "Shortlist and book the venue", "Book photographer",
  "Finalise catering menu", "Book decorator", "Send invitations",
  "Confirm all vendors a week before", "Arrange final payments",
];

// ── helpers ──────────────────────────────────────────────────────────────────
const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const num  = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
};
const str  = (v, max) => String(v ?? "").trim().slice(0, max);
const dateOrNull = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Keep category names tidy: reuse an existing spelling ("photography" -> "Photography"), else capitalise
const normCat = (plan, raw) => {
  const c = str(raw, 40) || "Other";
  const hit = plan.items.find((i) => i.category.toLowerCase() === c.toLowerCase());
  return hit ? hit.category : c.charAt(0).toUpperCase() + c.slice(1);
};

// A plan that belongs to the logged-in user, or null
async function ownPlan(req) {
  if (!isId(req.params.id)) return null;
  return EventPlan.findOne({ _id: req.params.id, userId: req.user.id });
}

// Live numbers for each item: linked bookings override actual/paid
async function resolve(plan) {
  const linked = plan.items.filter((i) => i.bookingId).map((i) => i.bookingId);
  const bookings = linked.length
    ? await Booking.find({ _id: { $in: linked } }).populate("vendorId", "title serviceType").lean()
    : [];
  const byId = new Map(bookings.map((b) => [String(b._id), b]));

  const items = plan.items.map((i) => {
    const o = i.toObject();
    const b = i.bookingId ? byId.get(String(i.bookingId)) : null;
    if (b) {
      o.booking = {
        _id: b._id, status: b.status, date: b.date, vendorTitle: b.vendorId?.title || "",
        serviceType: b.vendorId?.serviceType || "",
      };
      o.actual = b.packagePrice || 0;
      o.paid   = b.totalPaid || 0;
      if (b.status === "rejected" || b.status === "cancelled") { o.actual = 0; o.paid = 0; o.inactive = true; }
    }
    o.committed = o.actual > 0 ? o.actual : o.estimated;   // what you will really spend
    return o;
  });

  const sum = (k) => items.filter((i) => !i.inactive).reduce((t, i) => t + (i[k] || 0), 0);
  const summary = {
    budget: plan.totalBudget,
    estimated: sum("estimated"),
    committed: sum("committed"),
    paid: sum("paid"),
  };
  summary.remaining = plan.totalBudget - summary.committed;
  summary.toPay     = Math.max(0, summary.committed - summary.paid);

  const byCat = {};
  items.filter((i) => !i.inactive).forEach((i) => {
    const c = i.category || "Other";
    byCat[c] = byCat[c] || { category: c, estimated: 0, committed: 0, paid: 0 };
    byCat[c].estimated += i.estimated; byCat[c].committed += i.committed; byCat[c].paid += i.paid;
  });

  const tasks = plan.tasks.map((t) => t.toObject());
  return {
    _id: plan._id, title: plan.title, eventType: plan.eventType, date: plan.date,
    guests: plan.guests, totalBudget: plan.totalBudget, notes: plan.notes,
    items, tasks, summary, categories: Object.values(byCat),
    tasksDone: tasks.filter((t) => t.done).length,
    createdAt: plan.createdAt, updatedAt: plan.updatedAt,
  };
}

const fail = (res, e, label) => {
  console.error(`${label}:`, e);
  res.status(500).json({ error: "Something went wrong. Please try again." });
};

// ── plans ────────────────────────────────────────────────────────────────────
// GET /api/plans  — list with small summaries
exports.listPlans = async (req, res) => {
  try {
    const plans = await EventPlan.find({ userId: req.user.id }).sort({ date: 1, createdAt: -1 });
    const out = [];
    for (const p of plans) {
      const r = await resolve(p);
      out.push({
        _id: r._id, title: r.title, eventType: r.eventType, date: r.date,
        totalBudget: r.totalBudget, committed: r.summary.committed, paid: r.summary.paid,
        tasks: r.tasks.length, tasksDone: r.tasksDone,
      });
    }
    res.json(out);
  } catch (e) { fail(res, e, "listPlans"); }
};

// POST /api/plans
exports.createPlan = async (req, res) => {
  try {
    const title = str(req.body.title, 100);
    if (!title) return res.status(400).json({ error: "Give your event a name." });
    if (await EventPlan.countDocuments({ userId: req.user.id }) >= MAX_PLANS)
      return res.status(400).json({ error: `You can keep up to ${MAX_PLANS} event plans.` });

    const totalBudget = num(req.body.totalBudget);
    const plan = new EventPlan({
      userId: req.user.id, title,
      eventType: str(req.body.eventType, 40) || "Other",
      date: dateOrNull(req.body.date),
      guests: Math.round(num(req.body.guests)),
      totalBudget, notes: str(req.body.notes, 1000),
    });

    if (req.body.template) {
      TEMPLATE_SPLIT.forEach(([category, pct]) =>
        plan.items.push({ category, name: category, estimated: Math.round(totalBudget * pct / 100) }));
      TEMPLATE_TASKS.forEach((text) => plan.tasks.push({ text }));
    }
    await plan.save();
    res.status(201).json(await resolve(plan));
  } catch (e) { fail(res, e, "createPlan"); }
};

// GET /api/plans/:id  — full plan, plus the user's bookings that can still be linked
exports.getPlan = async (req, res) => {
  try {
    const plan = await ownPlan(req);
    if (!plan) return res.status(404).json({ error: "Plan not found." });
    const data = await resolve(plan);

    const linkedIds = new Set(plan.items.filter((i) => i.bookingId).map((i) => String(i.bookingId)));
    const mine = await Booking.find({ userId: req.user.id, status: { $in: ["pending", "approved"] } })
      .populate("vendorId", "title serviceType").sort({ date: 1 }).lean();
    data.linkableBookings = mine.filter((b) => !linkedIds.has(String(b._id))).map((b) => ({
      _id: b._id, title: b.vendorId?.title || "Booking", serviceType: b.vendorId?.serviceType || "",
      packageName: b.packageName, price: b.packagePrice || 0, date: b.date, status: b.status,
    }));
    res.json(data);
  } catch (e) { fail(res, e, "getPlan"); }
};

// PUT /api/plans/:id
exports.updatePlan = async (req, res) => {
  try {
    const plan = await ownPlan(req);
    if (!plan) return res.status(404).json({ error: "Plan not found." });
    const b = req.body;
    if (b.title !== undefined) {
      const t = str(b.title, 100);
      if (!t) return res.status(400).json({ error: "Give your event a name." });
      plan.title = t;
    }
    if (b.eventType   !== undefined) plan.eventType   = str(b.eventType, 40) || "Other";
    if (b.date        !== undefined) plan.date        = dateOrNull(b.date);
    if (b.guests      !== undefined) plan.guests      = Math.round(num(b.guests));
    if (b.totalBudget !== undefined) plan.totalBudget = num(b.totalBudget);
    if (b.notes       !== undefined) plan.notes       = str(b.notes, 1000);
    await plan.save();
    res.json(await resolve(plan));
  } catch (e) { fail(res, e, "updatePlan"); }
};

// DELETE /api/plans/:id
exports.deletePlan = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ error: "Plan not found." });
    const r = await EventPlan.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (!r.deletedCount) return res.status(404).json({ error: "Plan not found." });
    res.json({ ok: true });
  } catch (e) { fail(res, e, "deletePlan"); }
};

// ── budget items ─────────────────────────────────────────────────────────────
// POST /api/plans/:id/items
exports.addItem = async (req, res) => {
  try {
    const plan = await ownPlan(req);
    if (!plan) return res.status(404).json({ error: "Plan not found." });
    if (plan.items.length >= MAX_ITEMS) return res.status(400).json({ error: "This plan has too many items." });

    const b = req.body;
    const item = {
      category: normCat(plan, b.category), name: str(b.name, 120),
      estimated: num(b.estimated), actual: num(b.actual), paid: num(b.paid), note: str(b.note, 300),
    };

    if (b.bookingId) {
      if (!isId(b.bookingId)) return res.status(400).json({ error: "Invalid booking." });
      const booking = await Booking.findOne({ _id: b.bookingId, userId: req.user.id }).populate("vendorId", "title serviceType");
      if (!booking) return res.status(404).json({ error: "Booking not found." });
      if (plan.items.some((i) => String(i.bookingId) === String(booking._id)))
        return res.status(400).json({ error: "That booking is already in this plan." });
      item.name      = item.name || booking.vendorId?.title || "Booking";
      item.category  = normCat(plan, b.category || booking.vendorId?.serviceType);
      item.estimated = item.estimated || booking.packagePrice || 0;

      // If the plan already has an untouched line for this category (e.g. the template's
      // "Photography"), attach the booking to it instead of counting the spend twice.
      const spare = plan.items.find((i) => !i.bookingId && i.category === item.category && !i.actual && !i.paid);
      if (spare) {
        spare.bookingId = booking._id;
        await plan.save();
        return res.status(201).json(await resolve(plan));
      }
      item.bookingId = booking._id;
    }
    if (!item.name) return res.status(400).json({ error: "Give the item a name." });

    plan.items.push(item);
    await plan.save();
    res.status(201).json(await resolve(plan));
  } catch (e) { fail(res, e, "addItem"); }
};

// PUT /api/plans/:id/items/:itemId
exports.updateItem = async (req, res) => {
  try {
    const plan = await ownPlan(req);
    const item = plan && isId(req.params.itemId) ? plan.items.id(req.params.itemId) : null;
    if (!item) return res.status(404).json({ error: "Item not found." });
    const b = req.body;
    if (b.name !== undefined) {
      const n = str(b.name, 120);
      if (!n) return res.status(400).json({ error: "Give the item a name." });
      item.name = n;
    }
    if (b.category  !== undefined) item.category  = normCat(plan, b.category);
    if (b.estimated !== undefined) item.estimated = num(b.estimated);
    if (b.actual    !== undefined) item.actual    = num(b.actual);
    if (b.paid      !== undefined) item.paid      = num(b.paid);
    if (b.note      !== undefined) item.note      = str(b.note, 300);

    // link this line to one of the user's bookings, or unlink it (bookingId: null)
    if (b.bookingId !== undefined) {
      if (!b.bookingId) {
        // freeze the live numbers so unlinking doesn't wipe what the user saw
        const live = (await resolve(plan)).items.find((i) => String(i._id) === String(item._id));
        if (item.bookingId && live) { item.actual = live.actual; item.paid = live.paid; }
        item.bookingId = null;
      } else {
        if (!isId(b.bookingId)) return res.status(400).json({ error: "Invalid booking." });
        const booking = await Booking.findOne({ _id: b.bookingId, userId: req.user.id });
        if (!booking) return res.status(404).json({ error: "Booking not found." });
        if (plan.items.some((i) => String(i.bookingId) === String(booking._id) && String(i._id) !== String(item._id)))
          return res.status(400).json({ error: "That booking is already in this plan." });
        item.bookingId = booking._id;
      }
    }
    await plan.save();
    res.json(await resolve(plan));
  } catch (e) { fail(res, e, "updateItem"); }
};

// DELETE /api/plans/:id/items/:itemId
exports.deleteItem = async (req, res) => {
  try {
    const plan = await ownPlan(req);
    const item = plan && isId(req.params.itemId) ? plan.items.id(req.params.itemId) : null;
    if (!item) return res.status(404).json({ error: "Item not found." });
    item.deleteOne();
    await plan.save();
    res.json(await resolve(plan));
  } catch (e) { fail(res, e, "deleteItem"); }
};

// ── checklist ────────────────────────────────────────────────────────────────
// POST /api/plans/:id/tasks
exports.addTask = async (req, res) => {
  try {
    const plan = await ownPlan(req);
    if (!plan) return res.status(404).json({ error: "Plan not found." });
    if (plan.tasks.length >= MAX_TASKS) return res.status(400).json({ error: "This checklist is full." });
    const text = str(req.body.text, 160);
    if (!text) return res.status(400).json({ error: "Write the task first." });
    plan.tasks.push({ text, dueDate: dateOrNull(req.body.dueDate) });
    await plan.save();
    res.status(201).json(await resolve(plan));
  } catch (e) { fail(res, e, "addTask"); }
};

// PUT /api/plans/:id/tasks/:taskId
exports.updateTask = async (req, res) => {
  try {
    const plan = await ownPlan(req);
    const task = plan && isId(req.params.taskId) ? plan.tasks.id(req.params.taskId) : null;
    if (!task) return res.status(404).json({ error: "Task not found." });
    const b = req.body;
    if (b.text !== undefined) {
      const t = str(b.text, 160);
      if (!t) return res.status(400).json({ error: "Write the task first." });
      task.text = t;
    }
    if (b.done    !== undefined) task.done    = !!b.done;
    if (b.dueDate !== undefined) task.dueDate = dateOrNull(b.dueDate);
    await plan.save();
    res.json(await resolve(plan));
  } catch (e) { fail(res, e, "updateTask"); }
};

// DELETE /api/plans/:id/tasks/:taskId
exports.deleteTask = async (req, res) => {
  try {
    const plan = await ownPlan(req);
    const task = plan && isId(req.params.taskId) ? plan.tasks.id(req.params.taskId) : null;
    if (!task) return res.status(404).json({ error: "Task not found." });
    task.deleteOne();
    await plan.save();
    res.json(await resolve(plan));
  } catch (e) { fail(res, e, "deleteTask"); }
};