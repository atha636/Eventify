const express = require("express");
const router = express.Router();

const {
  getFavorites,
  toggleFavorite,
  getFavoriteIds,
} = require("../controllers/favoriteController");

const auth = require("../middleware/authMiddleware");

// GET  /api/favorites       — get all favorite vendor objects (for Favorites page)
router.get("/", auth, getFavorites);

// GET  /api/favorites/ids   — get just IDs (for ServiceCard heart state)
router.get("/ids", auth, getFavoriteIds);

// POST /api/favorites/:vendorId — toggle favorite on/off
router.post("/:vendorId", auth, toggleFavorite);

module.exports = router;