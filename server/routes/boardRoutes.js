const express   = require("express");
const rateLimit = require("express-rate-limit");
const auth      = require("../middleware/authMiddleware");
const c         = require("../controllers/boardController");

const customerOnly = (req, res, next) =>
  req.user?.role === "user" ? next() : res.status(403).json({ error: "Boards are for customer accounts." });

// owner routes  → mounted at /api/boards
const owner = express.Router();
owner.use(auth, customerOnly);
owner.get("/", c.list);
owner.post("/", c.create);
owner.get("/:id", c.get);
owner.put("/:id", c.update);
owner.delete("/:id", c.remove);
owner.post("/:id/items", c.addItem);
owner.put("/:id/items/:serviceId", c.updateItem);
owner.delete("/:id/items/:serviceId", c.removeItem);
owner.post("/:id/share", c.setShare);

// public routes → mounted at /api/shared (no login; voting is rate-limited per IP)
const voteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false,
  message: { error: "Too many votes. Please try again in a few minutes." },
  skip: () => process.env.NODE_ENV !== "production",
});
const pub = express.Router();
pub.get("/:token", c.publicGet);
pub.post("/:token/vote", voteLimiter, c.publicVote);

module.exports = { owner, pub };