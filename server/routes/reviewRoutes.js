const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");

const {
  getVendorReviews,
  getMyReviewStatus,
  createOrUpdateReview,
  deleteReview,
  replyToReview,
} = require("../controllers/reviewController");

// ── PUBLIC: list reviews for a vendor ───────────────────────────────────
// GET /api/reviews/vendor/:vendorId?page=1&limit=10
router.get("/vendor/:vendorId", getVendorReviews);

// ── AUTH: has the current user reviewed this vendor / can they? ────────
// GET /api/reviews/vendor/:vendorId/mine
router.get("/vendor/:vendorId/mine", auth, getMyReviewStatus);

// ── AUTH: create or update (one review per user per vendor) ────────────
// POST /api/reviews/vendor/:vendorId
// Body: { rating: 1-5, comment }
router.post("/vendor/:vendorId", auth, createOrUpdateReview);

// ── AUTH: delete own review (or admin) ──────────────────────────────────
// DELETE /api/reviews/:id
router.delete("/:id", auth, deleteReview);

// ── AUTH (vendor): reply to a review on your own service ───────────────
// PUT /api/reviews/:id/reply
// Body: { message }
router.put("/:id/reply", auth, replyToReview);

module.exports = router;