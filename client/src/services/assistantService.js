import API from "./api";

// Asks the planning assistant for a plan. `messages` is the customer's side of the chat: [{ text }]
export const askAssistant = async (messages) => {
  try {
    const res = await API.post("/assistant/plan", { messages });
    return res.data;
  } catch (error) {
    console.error("Assistant error:", error);
    throw error.response?.data?.error || "The assistant is unavailable right now. Please try again.";
  }
};