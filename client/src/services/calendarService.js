import API from "./api";

const fail = (e, fallback) => { throw e.response?.data?.error || fallback; };

// month: "YYYY-MM"
export const getCalendar = async (month) => {
  try { return (await API.get("/calendar", { params: { month } })).data; }
  catch (e) { return fail(e, "Couldn't load your calendar."); }
};

// Block or re-open dates on one or more services
export const setBlocked = async ({ serviceIds, dates, blocked }) => {
  try { return (await API.put("/calendar/block", { serviceIds, dates, blocked })).data; }
  catch (e) { return fail(e, "Couldn't update the calendar."); }
};

export const setAutoBlock = async (serviceId, autoBlockBooked) => {
  try { return (await API.put(`/calendar/service/${serviceId}`, { autoBlockBooked })).data; }
  catch (e) { return fail(e, "Couldn't save that setting."); }
};