import API from "./api";

// Downloads the PDF invoice / receipt for a booking.
// Uses the logged-in token (a plain <a href> couldn't send it), then hands the
// file to the browser as a normal download.
export const downloadInvoice = async (bookingId) => {
  try {
    const res = await API.get(`/bookings/${bookingId}/invoice`, { responseType: "blob" });

    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Evencers-Invoice-${String(bookingId).slice(-6).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (error) {
    // With responseType "blob", error bodies arrive as a Blob too — read the message out of it
    let message = "Couldn't download the invoice. Please try again.";
    try {
      const body = error.response?.data;
      if (body instanceof Blob) {
        const parsed = JSON.parse(await body.text());
        message = parsed.error || parsed.msg || message;
      }
    } catch { /* keep the default message */ }
    console.error("Download invoice error:", error);
    throw message;
  }
};