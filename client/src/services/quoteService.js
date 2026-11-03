import API from "./api";

// Quote requests / custom offers. Errors are thrown as plain message strings.
const run = async (fn, fallback) => {
  try {
    return (await fn()).data;
  } catch (error) {
    console.error("Quote error:", error);
    const e = new String(error.response?.data?.error || fallback);   // String object so we can carry conversationId
    e.conversationId = error.response?.data?.conversationId;
    throw e;
  }
};

export const createQuote  = (data)     => run(() => API.post("/quotes", data), "Couldn't send your request. Please try again.");
export const getQuote     = (id)       => run(() => API.get(`/quotes/${id}`), "Couldn't load this quote.");
export const sendOffer    = (id, data) => run(() => API.post(`/quotes/${id}/offer`, data), "Couldn't send the offer. Please try again.");
export const acceptQuote  = (id, data) => run(() => API.post(`/quotes/${id}/accept`, data), "Couldn't accept the offer. Please try again.");
export const declineQuote = (id, note) => run(() => API.post(`/quotes/${id}/decline`, { note }), "Couldn't update the quote. Please try again.");