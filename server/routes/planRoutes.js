const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const c       = require("../controllers/planController");

// Event planner is for customers only (vendors/admins have their own tools)
const customerOnly = (req, res, next) =>
  req.user?.role === "user" ? next() : res.status(403).json({ error: "The event planner is for customer accounts." });

router.use(auth, customerOnly);

router.get("/",    c.listPlans);
router.post("/",   c.createPlan);
router.get("/:id", c.getPlan);
router.put("/:id", c.updatePlan);
router.delete("/:id", c.deletePlan);

router.post("/:id/items",            c.addItem);
router.put("/:id/items/:itemId",     c.updateItem);
router.delete("/:id/items/:itemId",  c.deleteItem);

router.post("/:id/tasks",            c.addTask);
router.put("/:id/tasks/:taskId",     c.updateTask);
router.delete("/:id/tasks/:taskId",  c.deleteTask);

module.exports = router;