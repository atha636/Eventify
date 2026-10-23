const Review  = require("../models/Review");
const Vendor  = require("../models/Vendor");
const Booking = require("../models/Booking");
const User    = require("../models/User");

// ── Helper: recompute a vendor's aggregate rating + count ─────────────────
// Called after any create / update / delete so Vendor.rating always matches
// the Review collection. Keeps ServiceCard / VendorDetail reading a single
// cheap field instead of aggregating on every page view.
async function syncVendorRating(vendorId) {
  const stats = await Review.aggregate([
    { $match: { vendorId } },
    { $group: { _id: "$vendorId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const avg   = stats.length ? Math.round(stats[0].avg * 10) / 10 : undefined;
  const count = stats.length ? stats[0].count : 0;

  await Vendor.findByIdAndUpdate(vendorId, {
    rating: avg,
    reviewCount: count,
  });
}

// ── GET /api/reviews/vendor/:vendorId ──────────────────────────────────────
// Public. Paginated list of reviews for a vendor, newest first.
exports.getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    const [reviews, total, vendor] = await Promise.all([
      Review.find({ vendorId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-__v"),
      Review.countDocuments({ vendorId }),
      Vendor.findById(vendorId).select("rating reviewCount"),
    ]);

    // Star breakdown (5★ → 1★ counts) for the ratings bar chart on the UI
    const breakdownAgg = await Review.aggregate([
      { $match: { vendorId: vendor?._id } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdownAgg.forEach((b) => { breakdown[b._id] = b.count; });

    res.json({
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      rating: vendor?.rating || 0,
      reviewCount: vendor?.reviewCount || 0,
      breakdown,
    });
  } catch (err) {
    console.error("GET VENDOR REVIEWS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/reviews/vendor/:vendorId/mine ─────────────────────────────────
// Auth. Tells the logged-in user: do they already have a review here, and
// are they even eligible to write one (must have an approved booking)?
exports.getMyReviewStatus = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const userId = req.user.id;

    const [existingReview, qualifyingBooking] = await Promise.all([
      Review.findOne({ vendorId, userId }),
      Booking.findOne({
        vendorId,
        userId,
        status: { $in: ["approved"] },
      }).sort({ createdAt: -1 }),
    ]);

    res.json({
      review: existingReview || null,
      canReview: !!qualifyingBooking,
      bookingId: qualifyingBooking?._id || null,
    });
  } catch (err) {
    console.error("GET MY REVIEW STATUS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/reviews/vendor/:vendorId ──────────────────────────────────────
// Auth. Creates the user's review, or updates it if one already exists
// (one review per user per vendor — re-posting edits it in place).
// Body: { rating: 1-5, comment }
exports.createOrUpdateReview = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }
    if (comment && comment.length > 1000) {
      return res.status(400).json({ error: "Review is too long (max 1000 characters)." });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ error: "Vendor not found." });

    // Must have at least one approved booking with this vendor to review
    const qualifyingBooking = await Booking.findOne({
      vendorId,
      userId,
      status: { $in: ["approved"] },
    }).sort({ createdAt: -1 });

    if (!qualifyingBooking) {
      return res.status(403).json({
        error: "You can only review a vendor after booking with them.",
      });
    }

    // JWT payload only carries { id, role } — pull the display name fresh
    const reviewer = await User.findById(userId).select("name");

    const review = await Review.findOneAndUpdate(
      { vendorId, userId },
      {
        vendorId,
        userId,
        userName: reviewer?.name || "Evencers User",
        bookingId: qualifyingBooking._id,
        rating: ratingNum,
        comment: comment?.trim() || "",
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await syncVendorRating(vendor._id);

    res.json({ msg: "Review saved.", review });
  } catch (err) {
    console.error("CREATE/UPDATE REVIEW ERROR:", err);
    // Race on the unique (vendorId, userId) index — extremely rare, but handle cleanly
    if (err.code === 11000) {
      return res.status(409).json({ error: "You've already reviewed this vendor." });
    }
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/reviews/:id ──────────────────────────────────────────────
// Auth. The review's author (or an admin) can delete it.
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found." });

    const isOwner = review.userId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this review." });
    }

    const vendorId = review.vendorId;
    await review.deleteOne();
    await syncVendorRating(vendorId);

    res.json({ msg: "Review deleted." });
  } catch (err) {
    console.error("DELETE REVIEW ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/reviews/:id/reply ───────────────────────────────────────────
// Auth (vendor only, must own the service being reviewed). Lets the vendor
// post one public reply under a review.
// Body: { message }
exports.replyToReview = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "Reply message is required." });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: "Reply is too long (max 500 characters)." });
    }

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found." });

    const vendor = await Vendor.findById(review.vendorId);
    if (!vendor || vendor.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to reply to this review." });
    }

    review.vendorReply = { message: message.trim(), repliedAt: new Date() };
    await review.save();

    res.json({ msg: "Reply posted.", review });
  } catch (err) {
    console.error("REPLY TO REVIEW ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};