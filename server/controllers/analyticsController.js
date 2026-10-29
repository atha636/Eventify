const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review  = require("../models/Review");
const Vendor  = require("../models/Vendor");

// ── Time helpers (India Standard Time, so buckets match what vendors see) ──
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS        = 24 * 60 * 60 * 1000;
const RANGE_DAYS    = { "30": 30, "90": 90, "180": 180, "365": 365 };

const shifted = (d) => new Date(new Date(d).getTime() + IST_OFFSET_MS);
const bucketKey = (d, granularity) => {
  const iso = shifted(d).toISOString();
  return granularity === "day" ? iso.slice(0, 10) : iso.slice(0, 7);
};

// Builds the ordered list of bucket keys between `start` and now
function buildBuckets(start, granularity) {
  const keys   = [];
  const cursor = shifted(start);
  const end    = shifted(new Date());

  if (granularity === "month") cursor.setUTCDate(1);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor <= end) {
    const iso = cursor.toISOString();
    keys.push(granularity === "day" ? iso.slice(0, 10) : iso.slice(0, 7));
    if (granularity === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else                       cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

const sum = (arr, fn) => arr.reduce((t, x) => t + (fn(x) || 0), 0);

// % change vs previous period. null = nothing to compare against.
function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR ANALYTICS
// GET /api/analytics/vendor?range=30|90|180|365|all
//
// Everything is scoped to services owned by the logged-in vendor.
// Note: Booking.vendorId / Payment.vendorId point at the *service* (Vendor doc),
// while Vendor.vendorId points at the owning User — hence the first lookup.
// ─────────────────────────────────────────────────────────────────────────────
exports.getVendorAnalytics = async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ error: "Vendor access only." });
    }

    const range       = RANGE_DAYS[req.query.range] ? req.query.range : req.query.range === "all" ? "all" : "180";
    const now         = new Date();
    const granularity = range === "30" ? "day" : "month";

    // ── The vendor's services ───────────────────────────────────────────────
    const services   = await Vendor.find({ vendorId: req.user.id })
      .select("title serviceType rating reviewCount")
      .lean();
    const serviceIds = services.map((s) => s._id);

    if (serviceIds.length === 0) {
      return res.json({ range, granularity, hasServices: false });
    }

    // ── Period boundaries ───────────────────────────────────────────────────
    const since     = range === "all" ? null : new Date(now.getTime() - RANGE_DAYS[range] * DAY_MS);
    const prevSince = since ? new Date(since.getTime() - (now.getTime() - since.getTime())) : null;

    const bookingFilter = { vendorId: { $in: serviceIds } };
    const paymentFilter = { vendorId: { $in: serviceIds }, status: "paid" };
    if (since) {
      bookingFilter.createdAt = { $gte: since };
      paymentFilter.updatedAt = { $gte: since };
    }

    const todayIST = shifted(now);
    todayIST.setUTCHours(0, 0, 0, 0);
    const startOfTodayUTC = new Date(todayIST.getTime() - IST_OFFSET_MS);

    // ── Parallel queries ────────────────────────────────────────────────────
    const [
      bookings, payments, reviews, openBookings, upcoming,
      prevBookingCount, prevRevenueAgg,
    ] = await Promise.all([
      Booking.find(bookingFilter)
        .select("vendorId packageName packagePrice date status totalPaid createdAt")
        .lean(),
      Payment.find(paymentFilter).select("amount updatedAt vendorId").lean(),
      Review.find({ vendorId: { $in: serviceIds } }).select("rating vendorReply").lean(),
      // Approved bookings that still have money to collect (all-time, not range-limited)
      Booking.find({ vendorId: { $in: serviceIds }, status: "approved", paymentComplete: { $ne: true } })
        .select("packagePrice totalPaid installments")
        .lean(),
      Booking.find({ vendorId: { $in: serviceIds }, status: "approved", date: { $gte: startOfTodayUTC } })
        .sort({ date: 1 })
        .limit(5)
        .populate("userId", "name")
        .lean(),
      prevSince
        ? Booking.countDocuments({
            vendorId: { $in: serviceIds },
            createdAt: { $gte: prevSince, $lt: since },
          })
        : Promise.resolve(null),
      prevSince
        ? Payment.aggregate([
            { $match: {
                vendorId: { $in: serviceIds },
                status: "paid",
                updatedAt: { $gte: prevSince, $lt: since },
            } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ])
        : Promise.resolve(null),
    ]);

    // ── Status breakdown + headline numbers ─────────────────────────────────
    const statusBreakdown = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    bookings.forEach((b) => { if (statusBreakdown[b.status] !== undefined) statusBreakdown[b.status] += 1; });

    const totalBookings = bookings.length;
    const decided       = statusBreakdown.approved + statusBreakdown.rejected;
    const approvalRate  = decided ? Math.round((statusBreakdown.approved / decided) * 1000) / 10 : null;

    const revenue = sum(payments, (p) => p.amount);

    const approvedBookings = bookings.filter((b) => b.status === "approved");
    const avgBookingValue  = approvedBookings.length
      ? Math.round(sum(approvedBookings, (b) => b.packagePrice) / approvedBookings.length)
      : 0;

    // Outstanding = what approved customers still owe (uses the installment
    // schedule so the 5% discount on the 100% plan is respected)
    const outstanding = Math.round(sum(openBookings, (b) => {
      const expected = b.installments?.length
        ? sum(b.installments, (i) => i.amount)
        : b.packagePrice;
      return Math.max(0, (expected || 0) - (b.totalPaid || 0));
    }));

    // ── Reviews (all-time) ──────────────────────────────────────────────────
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { if (ratingDistribution[r.rating] !== undefined) ratingDistribution[r.rating] += 1; });
    const avgRating = reviews.length
      ? Math.round((sum(reviews, (r) => r.rating) / reviews.length) * 10) / 10
      : null;
    const replied   = reviews.filter((r) => r.vendorReply?.message).length;
    const replyRate = reviews.length ? Math.round((replied / reviews.length) * 100) : null;

    // ── Time series ─────────────────────────────────────────────────────────
    let seriesStart = since;
    if (!seriesStart) {
      const earliest = [...bookings.map((b) => b.createdAt), ...payments.map((p) => p.updatedAt)]
        .filter(Boolean)
        .reduce((min, d) => (d < min ? d : min), now);
      const cap = new Date(now.getTime() - 730 * DAY_MS); // never plot more than ~24 months
      seriesStart = earliest < cap ? cap : earliest;
    }

    const keys   = buildBuckets(seriesStart, granularity);
    const bucket = Object.fromEntries(
      keys.map((k) => [k, { key: k, bookings: 0, approved: 0, revenue: 0 }])
    );

    bookings.forEach((b) => {
      const slot = bucket[bucketKey(b.createdAt, granularity)];
      if (!slot) return;
      slot.bookings += 1;
      if (b.status === "approved") slot.approved += 1;
    });
    payments.forEach((p) => {
      const slot = bucket[bucketKey(p.updatedAt, granularity)];
      if (slot) slot.revenue += p.amount || 0;
    });
    const series = keys.map((k) => bucket[k]);

    // ── Top packages ────────────────────────────────────────────────────────
    const pkgMap = {};
    bookings.forEach((b) => {
      const name = b.packageName || "Custom package";
      if (!pkgMap[name]) pkgMap[name] = { name, bookings: 0, approved: 0, collected: 0 };
      pkgMap[name].bookings += 1;
      if (b.status === "approved") {
        pkgMap[name].approved  += 1;
        pkgMap[name].collected += b.totalPaid || 0;
      }
    });
    const topPackages = Object.values(pkgMap)
      .sort((a, b) => b.bookings - a.bookings || b.collected - a.collected)
      .slice(0, 5);

    // ── Per-service performance ─────────────────────────────────────────────
    const servicePerformance = services.map((s) => {
      const mine = bookings.filter((b) => String(b.vendorId) === String(s._id));
      const mineApproved = mine.filter((b) => b.status === "approved");
      return {
        _id:         s._id,
        title:       s.title || "Untitled service",
        serviceType: s.serviceType || "",
        bookings:    mine.length,
        approved:    mineApproved.length,
        collected:   sum(mineApproved, (b) => b.totalPaid),
        rating:      s.rating ?? null,
        reviewCount: s.reviewCount || 0,
      };
    }).sort((a, b) => b.collected - a.collected || b.bookings - a.bookings);

    // ── Busiest event weekdays (approved bookings, by event date) ───────────
    const weekdays = [0, 0, 0, 0, 0, 0, 0]; // Sun..Sat
    approvedBookings.forEach((b) => {
      if (b.date) weekdays[shifted(b.date).getUTCDay()] += 1;
    });

    // ── Upcoming events ─────────────────────────────────────────────────────
    const upcomingEvents = upcoming.map((b) => ({
      _id:          b._id,
      date:         b.date,
      packageName:  b.packageName || "",
      packagePrice: b.packagePrice || 0,
      totalPaid:    b.totalPaid || 0,
      customer:     b.userDetails?.name || b.userId?.name || "Customer",
    }));

    // ── Period-over-period change ───────────────────────────────────────────
    const prevRevenue = prevRevenueAgg?.[0]?.total || 0;
    const deltas = since
      ? {
          bookings: pctChange(totalBookings, prevBookingCount),
          revenue:  pctChange(revenue, prevRevenue),
        }
      : { bookings: null, revenue: null };

    res.json({
      range,
      granularity,
      hasServices: true,
      summary: {
        totalBookings,
        approved:  statusBreakdown.approved,
        approvalRate,
        revenue,
        outstanding,
        avgBookingValue,
        avgRating,
        reviewCount: reviews.length,
        replyRate,
        deltas,
      },
      statusBreakdown,
      series,
      topPackages,
      services: servicePerformance,
      weekdays,
      ratingDistribution,
      upcoming: upcomingEvents,
    });
  } catch (err) {
    console.error("VENDOR ANALYTICS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};