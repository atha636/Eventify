const mongoose       = require("mongoose");
const Conversation   = require("../models/Conversation");
const Message        = require("../models/Message");
const Vendor         = require("../models/Vendor");
const User           = require("../models/User");
const Notification   = require("../models/Notification");

// ── Helper: get a plain string id from either a raw ObjectId or a populated doc ──
function idOf(ref) {
  if (!ref) return "";
  return (ref._id || ref).toString();
}

// ── Helper: is this user the "userId" or "vendorId" side of a thread? ──
// Works whether userId/vendorId are raw ObjectIds OR populated documents.
function sideOf(conversation, myId) {
  const me = String(myId);
  if (idOf(conversation.userId)   === me) return "user";
  if (idOf(conversation.vendorId) === me) return "vendor";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// START (or resume) A CONVERSATION
// POST /api/chat/start
// Body: { vendorServiceId }
//
// Resolves the service to its owning vendor User, then finds or creates the
// single thread between the caller and that vendor. Idempotent — calling it
// again for the same vendor just returns the existing thread.
// ─────────────────────────────────────────────────────────────────────────────
exports.startConversation = async (req, res) => {
  try {
    const { vendorServiceId } = req.body;
    if (!vendorServiceId) return res.status(400).json({ error: "vendorServiceId is required." });

    const service = await Vendor.findById(vendorServiceId).select("vendorId title");
    if (!service) return res.status(404).json({ error: "Service not found." });

    const vendorUserId = service.vendorId.toString();
    if (vendorUserId === req.user.id) {
      return res.status(400).json({ error: "You can't message yourself." });
    }

    let conversation = await Conversation.findOne({
      userId:   req.user.id,
      vendorId: vendorUserId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        userId:    req.user.id,
        vendorId:  vendorUserId,
        serviceId: service._id,
      });
    }

    res.status(200).json({ conversation });
  } catch (err) {
    console.error("START CONVERSATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LIST MY CONVERSATIONS
// GET /api/chat/conversations
// ─────────────────────────────────────────────────────────────────────────────
exports.getConversations = async (req, res) => {
  try {
    const myId = req.user.id;

    const conversations = await Conversation.find({
      $or: [{ userId: myId }, { vendorId: myId }],
    })
      .populate("userId",   "name avatar")
      .populate("vendorId", "name avatar")
      .populate("serviceId", "title images")
      .sort({ updatedAt: -1 });

    const shaped = conversations.map((c) => {
      const iAmUser = c.userId._id.toString() === myId;
      const other   = iAmUser ? c.vendorId : c.userId;
      const unread  = iAmUser ? c.unreadForUser : c.unreadForVendor;

      return {
        _id:          c._id,
        other:        { _id: other._id, name: other.name, avatar: other.avatar || "" },
        service:      c.serviceId ? { _id: c.serviceId._id, title: c.serviceId.title, image: c.serviceId.images?.[0] || "" } : null,
        lastMessage:  c.lastMessage,
        unreadCount:  unread || 0,
        updatedAt:    c.updatedAt,
      };
    });

    res.json(shaped);
  } catch (err) {
    console.error("GET CONVERSATIONS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MESSAGES IN A CONVERSATION (and mark the other side's messages read)
// GET /api/chat/conversations/:id/messages
// ─────────────────────────────────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("userId",   "name avatar")
      .populate("vendorId", "name avatar")
      .populate("serviceId", "title images");
    if (!conversation) return res.status(404).json({ error: "Conversation not found." });

    // sideOf now handles populated documents correctly
    const side = sideOf(conversation, req.user.id);
    if (!side) return res.status(403).json({ error: "Unauthorized" });

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(200);

    // ── Mark the other party's messages read, reset my unread counter ──
    await Message.updateMany(
      { conversationId: conversation._id, senderId: { $ne: req.user.id }, isRead: false },
      { isRead: true }
    );

    // Use a direct update instead of .save() on a populated document
    const unreadField = side === "user" ? "unreadForUser" : "unreadForVendor";
    if (conversation[unreadField] > 0) {
      await Conversation.updateOne({ _id: conversation._id }, { $set: { [unreadField]: 0 } });
    }

    const iAmUser = side === "user";
    const other   = iAmUser ? conversation.vendorId : conversation.userId;

    res.json({
      conversation: {
        _id:     conversation._id,
        other:   { _id: other._id, name: other.name, avatar: other.avatar || "" },
        service: conversation.serviceId ? { _id: conversation.serviceId._id, title: conversation.serviceId.title } : null,
      },
      messages,
    });
  } catch (err) {
    console.error("GET MESSAGES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SEND A MESSAGE
// POST /api/chat/conversations/:id/messages
// Body: { text }
// ─────────────────────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Message can't be empty." });
    if (text.length > 2000) return res.status(400).json({ error: "Message is too long." });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found." });

    const side = sideOf(conversation, req.user.id);
    if (!side) return res.status(403).json({ error: "Unauthorized" });

    const message = await Message.create({
      conversationId: conversation._id,
      senderId:        req.user.id,
      text:            text.trim(),
    });

    conversation.lastMessage = { text: message.text, senderId: req.user.id, createdAt: message.createdAt };
    if (side === "user") conversation.unreadForVendor += 1;
    else                 conversation.unreadForUser   += 1;
    await conversation.save();

    res.status(201).json({ message });

    // ── Notify the other side (in-app only — no email, to avoid spamming
    //    a back-and-forth conversation with an inbox email per message) ──
    setImmediate(async () => {
      try {
        const recipientId = side === "user" ? conversation.vendorId : conversation.userId;
        const sender       = await User.findById(req.user.id).select("name");
        await Notification.create({
          userId:    recipientId,
          type:      "message_received",
          title:     `New message from ${sender?.name || "someone"}`,
          message:   message.text.length > 120 ? message.text.slice(0, 117) + "…" : message.text,
          bookingId: null,
        });
      } catch (e) {
        console.error("message notification error (non-fatal):", e.message);
      }
    });
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UNREAD TOTAL (for the navbar badge)
// GET /api/chat/unread-count
// ─────────────────────────────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const myId = req.user.id;
    const [asUser, asVendor] = await Promise.all([
      Conversation.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(myId) } },
        { $group: { _id: null, total: { $sum: "$unreadForUser" } } },
      ]),
      Conversation.aggregate([
        { $match: { vendorId: new mongoose.Types.ObjectId(myId) } },
        { $group: { _id: null, total: { $sum: "$unreadForVendor" } } },
      ]),
    ]);
    const total = (asUser[0]?.total || 0) + (asVendor[0]?.total || 0);
    res.json({ unreadCount: total });
  } catch (err) {
    console.error("GET UNREAD COUNT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};