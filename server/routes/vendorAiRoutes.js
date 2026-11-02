const express   = require("express");
const rateLimit = require("express-rate-limit");
const router    = express.Router();
const auth      = require("../middleware/authMiddleware");
const { writeDescription, suggestReplies } = require("../controllers/vendorAiController");

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false,
  message: { error: "You're going fast! Please wait a few minutes and try again." },
});

router.post("/description", auth, aiLimiter, writeDescription);
router.post("/replies",     auth, aiLimiter, suggestReplies);

module.exports = router;