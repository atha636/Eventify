import API from "./api";

// ── GET VENDOR REVIEWS (public) ──────────────────────────────────
// Returns { reviews, total, page, pages, rating, reviewCount, breakdown }
export const getVendorReviews = async (vendorId, page = 1, limit = 10) => {
  try {
    const response = await API.get(`/reviews/vendor/${vendorId}`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error("Get vendor reviews error:", error);
    throw error.response?.data?.error || "Failed to fetch reviews";
  }
};

// ── GET MY REVIEW STATUS (auth) ──────────────────────────────────
// Returns { review, canReview, bookingId }
export const getMyReviewStatus = async (vendorId) => {
  try {
    const response = await API.get(`/reviews/vendor/${vendorId}/mine`);
    return response.data;
  } catch (error) {
    console.error("Get my review status error:", error);
    throw error.response?.data?.error || "Failed to fetch review status";
  }
};

// ── CREATE OR UPDATE REVIEW (auth) ───────────────────────────────
export const submitReview = async (vendorId, rating, comment) => {
  try {
    const response = await API.post(`/reviews/vendor/${vendorId}`, {
      rating,
      comment,
    });
    return response.data;
  } catch (error) {
    console.error("Submit review error:", error);
    throw error.response?.data?.error || "Failed to submit review";
  }
};

// ── DELETE REVIEW (auth — owner or admin) ────────────────────────
export const deleteReview = async (reviewId) => {
  try {
    const response = await API.delete(`/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error("Delete review error:", error);
    throw error.response?.data?.error || "Failed to delete review";
  }
};

// ── VENDOR REPLY TO REVIEW (auth — vendor only) ──────────────────
export const replyToReview = async (reviewId, message) => {
  try {
    const response = await API.put(`/reviews/${reviewId}/reply`, { message });
    return response.data;
  } catch (error) {
    console.error("Reply to review error:", error);
    throw error.response?.data?.error || "Failed to post reply";
  }
};