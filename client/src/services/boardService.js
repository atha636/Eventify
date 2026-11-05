import API from "./api";

const run = async (fn, fallback) => {
  try { return (await fn()).data; }
  catch (e) { throw e.response?.data?.error || fallback; }
};

// ── owner (customer login) ──
export const listBoards   = ()           => run(() => API.get("/boards"), "Couldn't load your boards.");
export const getBoard     = (id)         => run(() => API.get(`/boards/${id}`), "Couldn't load this board.");
export const createBoard  = (data)       => run(() => API.post("/boards", data), "Couldn't create the board.");
export const updateBoard  = (id, data)   => run(() => API.put(`/boards/${id}`, data), "Couldn't save changes.");
export const deleteBoard  = (id)         => run(() => API.delete(`/boards/${id}`), "Couldn't delete the board.");
export const addToBoard   = (id, serviceId, note) => run(() => API.post(`/boards/${id}/items`, { serviceId, note }), "Couldn't add to the board.");
export const setNote      = (id, serviceId, note) => run(() => API.put(`/boards/${id}/items/${serviceId}`, { note }), "Couldn't save the note.");
export const removeFromBoard = (id, serviceId)    => run(() => API.delete(`/boards/${id}/items/${serviceId}`), "Couldn't remove it.");
export const setSharing   = (id, enabled, regenerate = false) => run(() => API.post(`/boards/${id}/share`, { enabled, regenerate }), "Couldn't update sharing.");

// ── public (no login) ──
export const getShared = (token, key) => run(() => API.get(`/shared/${token}`, { params: key ? { k: key } : {} }), "This link isn't active any more.");
export const vote = (token, body)     => run(() => API.post(`/shared/${token}/vote`, body), "Couldn't save your vote.");

export const shareUrl = (token) => `${window.location.origin}/s/${token}`;