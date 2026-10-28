const mongoose = require("mongoose");

// ── Conversation ─────────────────────────────────────────────────────────
// One thread per (client, vendor) pair — not per listing, so a client only
// ever has one open thread with a given vendor even if they message about
// several of that vendor's services. `serviceId` just remembers which
// listing the conversation was first opened from, for context in the UI.
//
// `userId` / `vendorId` are both just User _ids under the hood (a vendor
// account IS a User with role "vendor") — named this way to match how the
// rest of the codebase already talks about "the client" vs "the vendor".
const conversationSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Which service/listing this thread was first opened from (context only
    // — the thread itself is shared across all of that vendor's listings).
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null },

    // Denormalized so the conversation list can render without a join.
    lastMessage: {
      text:      { type: String, default: "" },
      senderId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      createdAt: { type: Date, default: null },
    },

    // Per-side unread counters — simpler than scanning Message docs on
    // every list render.
    unreadForUser:   { type: Number, default: 0 },
    unreadForVendor: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One thread per client/vendor pair.
conversationSchema.index({ userId: 1, vendorId: 1 }, { unique: true });
conversationSchema.index({ userId: 1, updatedAt: -1 });
conversationSchema.index({ vendorId: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);