const express   = require("express");
const rateLimit = require("express-rate-limit");
const router    = express.Router();
const auth      = require("../middleware/authMiddleware");
const { suggestPlan } = require("../controllers/assistantController");

// Keeps a single account from hammering the (free) AI service
const assistantLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  message: { error: "You're going fast! Please wait a few minutes and try again." },
});

router.post("/plan", auth, assistantLimiter, suggestPlan);

module.exports = router;