const express   = require("express");
const rateLimit = require("express-rate-limit");
const router    = express.Router();
const auth      = require("../middleware/authMiddleware");
const c         = require("../controllers/quoteController");

// stops a single account from flooding vendors with requests
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false,
  message: { error: "You've sent a lot of quote requests. Please try again later." },
});

router.post("/",            auth, createLimiter, c.createQuote);
router.get("/:id",          auth, c.getQuote);
router.post("/:id/offer",   auth, c.sendOffer);
router.post("/:id/accept",  auth, c.acceptQuote);
router.post("/:id/decline", auth, c.declineQuote);

module.exports = router;