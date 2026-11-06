const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const { validate, mine, validateLimiter } = require("../controllers/promoController");

router.post("/validate", auth, validateLimiter, validate);
router.get("/mine", auth, mine);

module.exports = router;