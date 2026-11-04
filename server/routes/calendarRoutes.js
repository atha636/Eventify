const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const { getCalendar, setBlocked, updateServiceSettings } = require("../controllers/calendarController");

router.get("/", auth, getCalendar);
router.put("/block", auth, setBlocked);
router.put("/service/:id", auth, updateServiceSettings);

module.exports = router;