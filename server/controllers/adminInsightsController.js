const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review  = require("../models/Review");

// GET /api/admin/insights  (admin only)
// One call powering the admin "Insights" tab.
exports.getInsights = async (req, res) => {
  try {
    // Last 6 calendar months (UTC), oldest → newest, zero-filled
    const now   = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const [paidAgg, statusAgg, topAgg, refunds, reviews, refundStats] = await Promise.all([
      Payment.aggregate([
        { $match: { status: "paid", createdAt: { $gte: start } } },
        { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Booking.aggregate([
        { $match: { totalPaid: { $gt: 0 } } },
        { $group: { _id: "$vendorId", revenue: { $sum: "$totalPaid" }, bookings: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "svc" } },
        { $project: { revenue: 1, bookings: 1, title: { $arrayElemAt: ["$svc.title", 0] } } },
      ]),
      Payment.find({ "refund.refundStatus": "pending" })
        .sort({ "refund.refundRequestedAt": 1 }).limit(20)
        .populate("userId", "name email").populate("vendorId", "title"),
      Review.find().sort({ createdAt: -1 }).limit(15).populate("vendorId", "title"),
      Payment.aggregate([
        { $match: { "refund.refundStatus": "completed" } },
        { $group: { _id: null, total: { $sum: "$refund.refundAmount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      const hit = paidAgg.find((p) => p._id.y === d.getUTCFullYear() && p._id.m === d.getUTCMonth() + 1);
      months.push({
        label: d.toLocaleString("en-IN", { month: "short", timeZone: "UTC" }),
        total: hit?.total || 0,
        count: hit?.count || 0,
      });
    }

    const status = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    statusAgg.forEach((s) => { status[s._id] = s.count; });

    res.json({
      months,
      status,
      topServices: topAgg,
      pendingRefunds: refunds.map((p) => ({
        _id: p._id, amount: p.amount, installmentNumber: p.installmentNumber,
        reason: p.refund?.refundReason, requestedAt: p.refund?.refundRequestedAt,
        customer: p.userId?.name, email: p.userId?.email, service: p.vendorId?.title,
      })),
      refundedTotal: refundStats[0]?.total || 0,
      refundedCount: refundStats[0]?.count || 0,
      reviews: reviews.map((r) => ({
        _id: r._id, rating: r.rating, comment: r.comment, userName: r.userName,
        service: r.vendorId?.title, createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("ADMIN INSIGHTS ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};