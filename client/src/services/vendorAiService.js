import API from "./api";

const run = async (fn, fallback) => {
  try {
    return (await fn()).data;
  } catch (error) {
    console.error("Vendor AI error:", error);
    throw error.response?.data?.error || fallback;
  }
};

// Writes (or tidies) a service description. Returns { description, source }
export const aiDescription = (data) =>
  run(() => API.post("/vendor-ai/description", data), "Couldn't write a description right now. Please try again.");

// Suggests replies to the customer's latest message. messages: [{ from: "me"|"customer", text }]
export const aiReplies = (messages, customerName) =>
  run(() => API.post("/vendor-ai/replies", { messages, customerName }), "Couldn't suggest replies right now. Please try again.");