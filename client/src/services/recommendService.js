import API from "./api";

// Personalised vendor picks for the logged-in customer.
// Returns { items: [{ vendor, reasons[], score }], personalised }
export const getRecommendations = async ({ city = "", category = "", limit = 4 } = {}) => {
  try {
    const res = await API.get("/recommendations", { params: { city, category, limit } });
    return res.data;
  } catch (error) {
    console.error("Recommendations error:", error);
    throw error.response?.data?.error || "Couldn't load recommendations";
  }
};