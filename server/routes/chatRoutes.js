const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");

const {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
} = require("../controllers/chatController");

// ── Start (or resume) a thread with a vendor, from one of their listings ──
// POST /api/chat/start   Body: { vendorServiceId }
router.post("/start", auth, startConversation);

// ── My conversation list ──
router.get("/conversations", auth, getConversations);

// ── Unread total, for the navbar badge ──
router.get("/unread-count", auth, getUnreadCount);

// ── Messages within a thread (GET also marks the other side's messages read) ──
router.get ("/conversations/:id/messages", auth, getMessages);
router.post("/conversations/:id/messages", auth, sendMessage);

module.exports = router;