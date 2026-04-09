const User = require("../models/User");
const Vendor = require("../models/Vendor");

// GET /api/favorites — get all favorited vendors for logged-in user
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "favorites",
      "title serviceType location images packages rating vendorName"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.favorites || []);
  } catch (err) {
    console.error("GET FAVORITES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/favorites/:vendorId — toggle favorite (add if not there, remove if already there)
exports.toggleFavorite = async (req, res) => {
  try {
    const { vendorId } = req.params;

    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const alreadyFavorited = user.favorites.some(
      (id) => id.toString() === vendorId
    );

    if (alreadyFavorited) {
      // Remove from favorites
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== vendorId
      );
    } else {
      // Add to favorites
      user.favorites.push(vendorId);
    }

    await user.save();

    res.json({
      favorited: !alreadyFavorited,
      favorites: user.favorites,
    });
  } catch (err) {
    console.error("TOGGLE FAVORITE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/favorites/ids — just return array of favorited vendor IDs (for fast UI check)
exports.getFavoriteIds = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("favorites");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.favorites || []);
  } catch (err) {
    console.error("GET FAVORITE IDS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};