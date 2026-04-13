import API from "./api";

// ── CREATE ORDER ────────────────────────────────────────────────
// Creates a Razorpay order and returns order details
export const createOrder = async (bookingId, amount) => {
  try {
    const response = await API.post("/payments/create-order", {
      bookingId,
      amount
    });
    return response.data;
  } catch (error) {
    console.error("Create order error:", error);
    throw error.response?.data?.error || "Failed to create order";
  }
};

// ── VERIFY PAYMENT ──────────────────────────────────────────────
// Verifies payment signature and confirms payment
export const verifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId) => {
  try {
    const response = await API.post("/payments/verify", {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentId
    });
    return response.data;
  } catch (error) {
    console.error("Verify payment error:", error);
    throw error.response?.data?.error || "Payment verification failed";
  }
};

// ── GET PAYMENT DETAILS ────────────────────────────────────────
// Get payment info for a specific booking
export const getPaymentDetails = async (bookingId) => {
  try {
    const response = await API.get(`/payments/booking/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error("Get payment details error:", error);
    throw error.response?.data?.error || "Failed to fetch payment details";
  }
};

// ── GET USER PAYMENTS ──────────────────────────────────────────
// Get all payments made by the current user
export const getUserPayments = async () => {
  try {
    const response = await API.get("/payments/user");
    return response.data;
  } catch (error) {
    console.error("Get user payments error:", error);
    throw error.response?.data?.error || "Failed to fetch payments";
  }
};

// ── GET VENDOR PAYMENTS ────────────────────────────────────────
// Get all payments received by vendor's services
export const getVendorPayments = async () => {
  try {
    const response = await API.get("/payments/vendor");
    return response.data;
  } catch (error) {
    console.error("Get vendor payments error:", error);
    throw error.response?.data?.error || "Failed to fetch payments";
  }
};

// ── REQUEST REFUND ────────────────────────────────────────────
// User requests a refund
export const requestRefund = async (paymentId, reason) => {
  try {
    const response = await API.post(`/payments/${paymentId}/refund-request`, {
      reason
    });
    return response.data;
  } catch (error) {
    console.error("Request refund error:", error);
    throw error.response?.data?.error || "Failed to request refund";
  }
};

// ── PROCESS REFUND ────────────────────────────────────────────
// Vendor approves or rejects refund
export const processRefund = async (paymentId, action) => {
  try {
    const response = await API.put(`/payments/${paymentId}/process-refund`, {
      action
    });
    return response.data;
  } catch (error) {
    console.error("Process refund error:", error);
    throw error.response?.data?.error || "Failed to process refund";
  }
};

// ── GET RECEIPT ────────────────────────────────────────────────
// Get payment receipt
export const getReceipt = async (paymentId) => {
  try {
    const response = await API.get(`/payments/${paymentId}/receipt`);
    return response.data;
  } catch (error) {
    console.error("Get receipt error:", error);
    throw error.response?.data?.error || "Failed to fetch receipt";
  }
};