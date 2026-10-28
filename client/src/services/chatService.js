import API from "./api";

// ── Start (or resume) a thread with the vendor who owns a service ──
export const startConversation = async (vendorServiceId) => {
  try {
    const res = await API.post("/chat/start", { vendorServiceId });
    return res.data;
  } catch (error) {
    console.error("Start conversation error:", error);
    throw error.response?.data?.error || "Failed to start conversation";
  }
};

// ── My conversation list ──
export const getConversations = async () => {
  try {
    const res = await API.get("/chat/conversations");
    return res.data;
  } catch (error) {
    console.error("Get conversations error:", error);
    throw error.response?.data?.error || "Failed to load conversations";
  }
};

// ── Messages in a thread (also marks the other side's messages read) ──
export const getMessages = async (conversationId) => {
  try {
    const res = await API.get(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  } catch (error) {
    console.error("Get messages error:", error);
    throw error.response?.data?.error || "Failed to load messages";
  }
};

// ── Send a message ──
export const sendMessage = async (conversationId, text) => {
  try {
    const res = await API.post(`/chat/conversations/${conversationId}/messages`, { text });
    return res.data;
  } catch (error) {
    console.error("Send message error:", error);
    throw error.response?.data?.error || "Failed to send message";
  }
};

// ── Unread total, for the navbar badge ──
export const getUnreadChatCount = async () => {
  try {
    const res = await API.get("/chat/unread-count");
    return res.data;
  } catch (error) {
    console.error("Get unread chat count error:", error);
    throw error.response?.data?.error || "Failed to load unread count";
  }
};