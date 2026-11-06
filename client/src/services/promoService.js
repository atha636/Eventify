import API from "./api";

// Does this vendor code work for this service? Never throws for an invalid code — returns { valid:false, error }.
export const validateCode = async (serviceId, code, packageName) => {
  try {
    return (await API.post("/promo/validate", { serviceId, code, packageName })).data;
  } catch (e) {
    throw e.response?.data?.error || "Couldn't check that code. Please try again.";
  }
};

export const getMyCodeStats = async () => {
  try { return (await API.get("/promo/mine")).data; }
  catch { return null; }
};