const Vendor  = require("../models/Vendor");
const User    = require("../models/User");
const Booking = require("../models/Booking");

// "Recommended for you" — plain-code ranking, no AI service and no cost.
// Score (max 100) = city 30 + category taste 30 + price fit 15 + rating 20 + profile quality 5.

const MAX_PER_OWNER = 2;     // never let one vendor fill the whole list

// cheapest price a customer would actually pay for this service
const minPrice = (v) => {
  const prices = (v.packages || []).map((p) => p.price).filter((p) => p > 0);
  if (prices.length) return Math.min(...prices);
  return v.price > 0 ? v.price : 0;
};

const where = (v) => [v.location, ...(v.locations || [])].filter(Boolean).map((s) => s.toLowerCase());
const inCity = (v, city) => !!city && where(v).some((w) => w.includes(city.toLowerCase()));

const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Bayesian average: a 5.0 from one review shouldn't beat 4.7 from forty
const smoothedRating = (v) => {
  const n = v.reviewCount || 0, r = v.rating || 0;
  const prior = 3.8, weight = 3;
  return (r * n + prior * weight) / (n + weight);
};

const money = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// vendors: lean Vendor docs · favs: favourited Vendor docs · booked: booked Vendor docs (with weights)
function rank({ vendors, favs, booked, city, category, limit = 8 }) {
  // what does this customer like?
  const taste = {};                                   // category → weight
  booked.forEach((v) => { taste[v.serviceType] = (taste[v.serviceType] || 0) + 3; });
  favs.forEach((v)   => { taste[v.serviceType] = (taste[v.serviceType] || 0) + 2; });
  const tasteMax = Math.max(0, ...Object.values(taste));
  const hasHistory = tasteMax > 0;

  const pastPrices = [...booked, ...favs].map(minPrice).filter((p) => p > 0);
  const typical = median(pastPrices);

  const skip = new Set([...booked, ...favs].map((v) => String(v._id)));

  const scored = vendors
    .filter((v) => !skip.has(String(v._id)))
    .filter((v) => !category || v.serviceType === category)
    .map((v) => {
      let score = 0; const reasons = [];

      if (inCity(v, city)) { score += 30; reasons.push(`Available in ${cap(city)}`); }

      if (hasHistory && taste[v.serviceType]) {
        score += 30 * (taste[v.serviceType] / tasteMax);
        const hadBooked = booked.some((b) => b.serviceType === v.serviceType);
        reasons.push(hadBooked ? `You've booked ${v.serviceType} before` : `You saved ${v.serviceType} vendors`);
      }

      const price = minPrice(v);
      if (typical > 0 && price > 0) {
        const ratio = price / typical;
        let fit = 0;
        if (ratio >= 0.6 && ratio <= 1.5)       fit = 1;
        else if (ratio >= 0.4 && ratio <= 2.2)  fit = 0.5;
        score += 15 * fit;
        if (fit === 1) reasons.push("Close to your usual budget");
      }

      const sr = smoothedRating(v);
      score += 20 * Math.max(0, (sr - 3) / 2);                       // 3★ → 0, 5★ → 20
      if ((v.reviewCount || 0) >= 3 && (v.rating || 0) >= 4.5) reasons.push(`Rated ${v.rating.toFixed(1)} by ${v.reviewCount} clients`);

      if ((v.images || []).length >= 3) score += 3;
      if (price > 0) score += 2;

      if (!reasons.length) reasons.push("Popular on Evencers");
      return { v, score: Math.round(score * 10) / 10, reasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.score - a.score || (b.v.reviewCount || 0) - (a.v.reviewCount || 0));

  // diversity: cap per owner
  const perOwner = {}, out = [];
  for (const s of scored) {
    const owner = String(s.v.vendorId?._id || s.v.vendorId || s.v._id);
    if ((perOwner[owner] = (perOwner[owner] || 0) + 1) > MAX_PER_OWNER) continue;
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

// GET /api/recommendations?city=Delhi&category=photography&limit=8   (customers only)
exports.getRecommendations = async (req, res) => {
  try {
    if (req.user?.role !== "user") return res.status(403).json({ error: "Recommendations are for customer accounts." });

    const city     = String(req.query.city || "").trim().slice(0, 60);
    const category = String(req.query.category || "").trim().toLowerCase().slice(0, 30);
    const limit    = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 8));

    const approved = await User.find({ role: "vendor", isProfileVerified: "approved" }).select("_id");
    const [vendors, me, bookings] = await Promise.all([
      Vendor.find({ isApproved: true, vendorId: { $in: approved.map((u) => u._id) } })
        .populate("vendorId", "isVendorVerified").lean(),
      User.findById(req.user.id).select("favorites").lean(),
      Booking.find({ userId: req.user.id, status: { $in: ["pending", "approved"] } }).select("vendorId").lean(),
    ]);

    const byId = new Map(vendors.map((v) => [String(v._id), v]));
    // favourites/bookings may point at services that are no longer listed — ignore those
    const favs   = (me?.favorites || []).map((id) => byId.get(String(id))).filter(Boolean);
    const booked = bookings.map((b) => byId.get(String(b.vendorId))).filter(Boolean);

    const items = rank({ vendors, favs, booked, city, category, limit })
      .map(({ v, reasons, score }) => ({ vendor: v, reasons, score }));
    res.json({ items, personalised: favs.length + booked.length > 0 });
  } catch (e) {
    console.error("getRecommendations:", e);
    res.status(500).json({ error: "Couldn't load recommendations." });
  }
};

exports._rank = rank;