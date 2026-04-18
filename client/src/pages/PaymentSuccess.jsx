import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function PaymentSuccess() {
  const { bookingId } = useParams();
  const navigate       = useNavigate();
  const [booking,  setBooking]  = useState(null);
  const [payment,  setPayment]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!bookingId) { setNotFound(true); setLoading(false); return; }
    fetchDetails();
  }, [bookingId]);

  const fetchDetails = async () => {
    try {
      // ── FIX 1: Your backend has GET /bookings (all user bookings),
      //    not GET /bookings/:id — so fetch all and find the one we need ──
      const bookingRes = await API.get("/bookings");
      const found = bookingRes.data.find((b) => b._id === bookingId);

      if (!found) { setNotFound(true); setLoading(false); return; }
      setBooking(found);

      // ── FIX 2: Payment fetch is non-fatal — it may not be ready yet ──
      try {
        const paymentRes = await API.get(`/payments/booking/${bookingId}`);
        setPayment(paymentRes.data);
      } catch { /* silently ignore — booking confirmation still shows */ }

    } catch (err) {
      console.error("PaymentSuccess fetch error:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (!booking) return;
    const text = `I just booked ${booking.vendorId?.title} on Eventify for ${new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}!`;
    if (navigator.share) {
      try { await navigator.share({ title: "Booking Confirmation", text, url: window.location.href }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text + "\n" + window.location.href); alert("Copied to clipboard!"); } catch {}
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <Navbar />
        <div className="ps-loader">
          <div className="ps-spinner" />
          <p>Loading your confirmation…</p>
        </div>
      </>
    );
  }

  // ── Not found ─────────────────────────────────────────────────
  if (notFound) {
    return (
      <>
        <style>{styles}</style>
        <Navbar />
        <div className="ps-loader">
          <div className="ps-not-found-icon">🔍</div>
          <p className="ps-not-found-title">Booking not found</p>
          <p className="ps-not-found-sub">We couldn't find this booking. It may have been removed.</p>
          <button className="ps-btn ps-btn-primary" style={{ marginTop: 24, minWidth: 200 }} onClick={() => navigate("/my-bookings")}>
            View My Bookings →
          </button>
        </div>
      </>
    );
  }

  const vendorName     = booking.vendorId?.title       || "Your Service";
  const vendorType     = booking.vendorId?.serviceType || "";
  const vendorLocation = booking.vendorId?.location    || "";
  const eventDate      = booking.date
    ? new Date(booking.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="ps-root">

        {/* ── HERO ── */}
        <div className="ps-hero">
          <div className="ps-orb ps-orb1" />
          <div className="ps-orb ps-orb2" />
          <div className="ps-hero-content">
            <div className="ps-success-badge">
              <span className="ps-checkmark">✓</span>
            </div>
            <h1 className="ps-title">Payment Successful!</h1>
            <p className="ps-subtitle">Your booking is confirmed and payment received</p>
          </div>
        </div>

        <div className="ps-body">

          {/* ── BOOKING CONFIRMATION ── */}
          <div className="ps-card ps-confirmation-card">
            <div className="ps-card-header">
              <h2 className="ps-card-title">Booking Confirmed</h2>
              <span className="ps-status-badge">✓ Confirmed</span>
            </div>

            <div className="ps-detail-row">
              <div className="ps-detail-label">Service</div>
              <div className="ps-detail-value">
                <h3 className="ps-vendor-name">{vendorName}</h3>
                {vendorType && <p className="ps-vendor-type">{vendorType}</p>}
              </div>
            </div>

            <div className="ps-detail-row">
              <div className="ps-detail-label">Event Date</div>
              <div className="ps-detail-value"><p className="ps-date">{eventDate}</p></div>
            </div>

            {booking.packageName && (
              <div className="ps-detail-row">
                <div className="ps-detail-label">Package</div>
                <div className="ps-detail-value"><p className="ps-package">{booking.packageName}</p></div>
              </div>
            )}

            {booking.packagePrice && (
              <div className="ps-detail-row">
                <div className="ps-detail-label">Amount</div>
                <div className="ps-detail-value">
                  <p className="ps-price-value">₹{booking.packagePrice.toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}

            {vendorLocation && (
              <div className="ps-detail-row">
                <div className="ps-detail-label">Location</div>
                <div className="ps-detail-value"><p className="ps-location">📍 {vendorLocation}</p></div>
              </div>
            )}

            {booking.userDetails?.address && (
              <div className="ps-detail-row">
                <div className="ps-detail-label">Your Address</div>
                <div className="ps-detail-value"><p className="ps-location">📍 {booking.userDetails.address}</p></div>
              </div>
            )}
          </div>

          {/* ── PAYMENT RECEIPT ── */}
          {payment ? (
            <div className="ps-card ps-receipt-card">
              <h2 className="ps-card-title" style={{ marginBottom: 20 }}>Payment Receipt</h2>

              {payment.razorpayOrderId && (
                <div className="ps-receipt-row">
                  <span>Order ID</span>
                  <span className="ps-mono">{payment.razorpayOrderId}</span>
                </div>
              )}

              {payment.razorpayPaymentId && (
                <div className="ps-receipt-row">
                  <span>Payment ID</span>
                  <span className="ps-mono">{payment.razorpayPaymentId}</span>
                </div>
              )}

              <div className="ps-receipt-row">
                <span>Amount Paid</span>
                <span className="ps-amount">₹{(payment.amount || booking.packagePrice || 0).toLocaleString("en-IN")}</span>
              </div>

              <div className="ps-receipt-row">
                <span>Payment Status</span>
                <span className="ps-paid-badge">✓ Paid</span>
              </div>

              {payment.createdAt && (
                <div className="ps-receipt-row">
                  <span>Payment Date</span>
                  <span>{new Date(payment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}

              <div className="ps-receipt-divider" />
              <div className="ps-receipt-info">
                <p className="ps-info-text">
                  ✓ Payment securely processed by Razorpay<br />
                  ✓ Confirmation email sent to your registered address<br />
                  ✓ The vendor will contact you shortly with event details
                </p>
              </div>
            </div>
          ) : (
            <div className="ps-card ps-receipt-card">
              <h2 className="ps-card-title" style={{ marginBottom: 16 }}>Payment Receipt</h2>
              <div className="ps-receipt-info">
                <p className="ps-info-text">
                  ✓ Payment received — your booking is confirmed<br />
                  ✓ Receipt details will appear in your My Bookings page<br />
                  ✓ Confirmation email sent to your registered address
                </p>
              </div>
            </div>
          )}

          {/* ── NEXT STEPS ── */}
          <div className="ps-card ps-steps-card">
            <h2 className="ps-card-title" style={{ marginBottom: 20 }}>What's Next?</h2>
            <div className="ps-steps-list">
              {[
                "The vendor will review your confirmed booking",
                "You'll receive a message from the vendor with event details",
                "Finalise any last-minute details before your event date",
                "Enjoy your event experience!",
              ].map((step, i) => (
                <div key={i} className="ps-step">
                  <div className="ps-step-num">{i + 1}</div>
                  <p className="ps-step-text">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div className="ps-actions">
            <button className="ps-btn ps-btn-secondary" onClick={handlePrint}>🖨 Print Receipt</button>
            <button className="ps-btn ps-btn-secondary" onClick={handleShare}>📤 Share</button>
            <button className="ps-btn ps-btn-primary"   onClick={() => navigate("/my-bookings")}>View My Bookings →</button>
          </div>

          <div className="ps-footer">
            <p>Questions? Contact our support team at <strong>support@eventify.com</strong></p>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --muted: #7a7265; --border: rgba(201,168,76,0.18); --surface: #faf7f2; --white: #ffffff;
    --success: #2d6a4f; --success-bg: rgba(45,106,79,0.08); --success-border: rgba(45,106,79,0.2);
  }
  .ps-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }

  /* HERO */
  .ps-hero { position: relative; overflow: hidden; background: var(--ink); padding: 120px 32px 88px; text-align: center; }
  .ps-orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.1; pointer-events: none; }
  .ps-orb1 { width: 500px; height: 500px; background: var(--gold); top: -180px; left: -100px; }
  .ps-orb2 { width: 320px; height: 320px; background: #3a5ea7; bottom: -80px; right: -60px; }
  .ps-hero-content { position: relative; z-index: 2; animation: fadeUp 0.55s ease both; }
  .ps-success-badge {
    width: 96px; height: 96px; background: var(--success); border-radius: 50%;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;
    box-shadow: 0 20px 60px rgba(45,106,79,0.3), 0 0 0 12px rgba(45,106,79,0.1);
    animation: scalePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both;
  }
  .ps-checkmark { color: var(--white); font-size: 3rem; font-weight: 600; line-height: 1; }
  .ps-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 300; color: var(--white); margin-bottom: 10px; line-height: 1.1; }
  .ps-subtitle { font-size: 13.5px; color: rgba(245,240,232,0.45); font-weight: 300; letter-spacing: 0.04em; }

  /* BODY */
  .ps-body { max-width: 760px; margin: 0 auto; padding: 52px 28px 88px; }

  /* CARDS */
  .ps-card { background: var(--white); border: 1px solid var(--border); border-radius: 16px; padding: 28px 32px; margin-bottom: 16px; animation: fadeUp 0.5s ease both; }
  .ps-confirmation-card { animation-delay: 0.1s; }
  .ps-receipt-card      { animation-delay: 0.2s; }
  .ps-steps-card        { animation-delay: 0.3s; }
  .ps-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 10px; }
  .ps-card-title { font-family: 'Cormorant Garamond', serif; font-size: 1.45rem; font-weight: 600; color: var(--ink); }
  .ps-status-badge { font-size: 11px; font-weight: 500; letter-spacing: 0.08em; padding: 5px 14px; border-radius: 20px; background: var(--success-bg); color: var(--success); border: 1px solid var(--success-border); white-space: nowrap; }

  /* Detail rows */
  .ps-detail-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid rgba(201,168,76,0.08); }
  .ps-detail-row:last-child { border-bottom: none; }
  .ps-detail-label { font-size: 11px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; min-width: 110px; padding-top: 2px; }
  .ps-detail-value { flex: 1; text-align: right; }
  .ps-vendor-name { font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; font-weight: 600; color: var(--ink); margin-bottom: 3px; }
  .ps-vendor-type { font-size: 12px; color: var(--muted); text-transform: capitalize; }
  .ps-date, .ps-package, .ps-location { font-size: 13.5px; color: var(--ink); }
  .ps-price-value { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--gold); }

  /* Receipt */
  .ps-receipt-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.06); font-size: 13px; }
  .ps-receipt-row:last-of-type { border-bottom: none; }
  .ps-receipt-row span:first-child { color: var(--muted); }
  .ps-receipt-row span:last-child  { color: var(--ink); font-weight: 500; }
  .ps-mono { font-family: 'Courier New', monospace; font-size: 11.5px; letter-spacing: 0.02em; color: var(--muted) !important; font-weight: 400 !important; word-break: break-all; max-width: 200px; text-align: right; }
  .ps-amount { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--gold) !important; }
  .ps-paid-badge { font-size: 11px; font-weight: 500; padding: 4px 10px; border-radius: 20px; background: var(--success-bg); color: var(--success) !important; border: 1px solid var(--success-border); }
  .ps-receipt-divider { height: 1px; background: var(--border); margin: 14px 0; }
  .ps-receipt-info { background: var(--success-bg); border: 1px solid var(--success-border); border-radius: 10px; padding: 14px 16px; margin-top: 4px; }
  .ps-info-text { font-size: 12.5px; color: var(--success); line-height: 1.9; }

  /* Steps */
  .ps-steps-list { display: flex; flex-direction: column; gap: 4px; }
  .ps-step { display: flex; align-items: flex-start; gap: 14px; padding: 12px 0; border-bottom: 1px solid rgba(201,168,76,0.06); }
  .ps-step:last-child { border-bottom: none; }
  .ps-step-num { width: 26px; height: 26px; border-radius: 50%; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); color: var(--gold); font-size: 11.5px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ps-step-text { font-size: 13.5px; color: var(--muted); line-height: 1.6; padding-top: 3px; }

  /* Actions */
  .ps-actions { display: flex; gap: 10px; margin-top: 28px; flex-wrap: wrap; }
  .ps-btn { flex: 1; min-width: 130px; padding: 13px 20px; border: none; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.25s ease; text-align: center; }
  .ps-btn-primary { background: var(--gold); color: var(--ink); }
  .ps-btn-primary:hover { background: #b8942f; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.3); }
  .ps-btn-secondary { background: transparent; border: 1.5px solid var(--border); color: var(--muted); }
  .ps-btn-secondary:hover { border-color: var(--muted); color: var(--ink); background: var(--surface); }

  /* Footer */
  .ps-footer { text-align: center; padding-top: 24px; border-top: 1px solid var(--border); margin-top: 36px; }
  .ps-footer p { font-size: 12px; color: var(--muted); }

  /* Loader / Not found */
  .ps-loader { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: var(--muted); font-size: 13.5px; padding: 40px; text-align: center; font-family: 'DM Sans', sans-serif; }
  .ps-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; }
  .ps-not-found-icon  { font-size: 3rem; margin-bottom: 8px; }
  .ps-not-found-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; color: var(--ink); font-weight: 600; }
  .ps-not-found-sub   { font-size: 13px; color: var(--muted); max-width: 300px; line-height: 1.6; }

  @media print {
    .ps-hero { background: var(--white) !important; border-bottom: 1px solid var(--border); padding: 40px 32px; }
    .ps-orb { display: none; }
    .ps-title, .ps-subtitle { color: var(--ink) !important; }
    .ps-success-badge { background: var(--success-bg) !important; box-shadow: none !important; }
    .ps-checkmark { color: var(--success) !important; }
    .ps-actions, .ps-footer { display: none; }
  }
  @media (max-width: 600px) {
    .ps-hero { padding: 88px 20px 60px; }
    .ps-body { padding: 28px 16px 64px; }
    .ps-card { padding: 20px 16px; }
    .ps-card-header { flex-direction: column; align-items: flex-start; }
    .ps-detail-row { flex-direction: column; align-items: flex-start; gap: 4px; }
    .ps-detail-value { text-align: left; }
    .ps-actions { flex-direction: column; }
    .ps-btn { min-width: auto; }
    .ps-mono { max-width: 160px; }
  }
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scalePop{ from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes spin    { to { transform: rotate(360deg); } }
`;