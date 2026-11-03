const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const { getRecommendations } = require("../controllers/recommendController");

// GET /api/recommendations?city=&category=&limit=
router.get("/", auth, getRecommendations);

module.exports = router;