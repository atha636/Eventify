import API from "./api";

// Event planner / budget tracker API. Every mutation returns the full, recalculated plan.
const run = async (fn, fallback) => {
  try {
    return (await fn()).data;
  } catch (error) {
    console.error("Planner error:", error);
    throw error.response?.data?.error || error.response?.data?.msg || fallback;
  }
};

export const listPlans  = ()         => run(() => API.get("/plans"), "Couldn't load your plans");
export const getPlan    = (id)       => run(() => API.get(`/plans/${id}`), "Couldn't load this plan");
export const createPlan = (data)     => run(() => API.post("/plans", data), "Couldn't create the plan");
export const updatePlan = (id, data) => run(() => API.put(`/plans/${id}`, data), "Couldn't save changes");
export const deletePlan = (id)       => run(() => API.delete(`/plans/${id}`), "Couldn't delete the plan");

export const addItem    = (id, data)       => run(() => API.post(`/plans/${id}/items`, data), "Couldn't add the item");
export const updateItem = (id, itemId, d)  => run(() => API.put(`/plans/${id}/items/${itemId}`, d), "Couldn't update the item");
export const deleteItem = (id, itemId)     => run(() => API.delete(`/plans/${id}/items/${itemId}`), "Couldn't remove the item");

export const addTask    = (id, data)       => run(() => API.post(`/plans/${id}/tasks`, data), "Couldn't add the task");
export const updateTask = (id, taskId, d)  => run(() => API.put(`/plans/${id}/tasks/${taskId}`, d), "Couldn't update the task");
export const deleteTask = (id, taskId)     => run(() => API.delete(`/plans/${id}/tasks/${taskId}`), "Couldn't remove the task");