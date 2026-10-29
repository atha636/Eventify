import API from "./api";

// ── Vendor analytics ──
// range: "30" | "90" | "180" | "365" | "all"
export const getVendorAnalytics = async (range = "180") => {
  try {
    const res = await API.get("/analytics/vendor", { params: { range } });
    return res.data;
  } catch (error) {
    console.error("Get vendor analytics error:", error);
    throw error.response?.data?.error || "Failed to load analytics";
  }
};