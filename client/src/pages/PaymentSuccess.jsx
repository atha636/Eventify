import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function PaymentSuccess() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingAndPayment();
  }, [bookingId]);

  const fetchBookingAndPayment = async () => {
    try {
      const [bookingRes, paymentRes] = await Promise.all([
        API.get(`/bookings/${bookingId}`),
        API.get(`/payments/booking/${bookingId}`)
      ]);
      setBooking(bookingRes.data);
      setPayment(paymentRes.data);
    } catch (err) {
      console.error("Failed to fetch details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Booking Confirmation",
        text: `I just booked ${booking?.vendorId?.title} on ${new Date(booking?.date).toLocaleDateString()}!`,
        url: window.location.href
      });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="ps-loader">
          <div className="ps-spinner" />
          <p>Loading your confirmation...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{paymentSuccessStyles}</style>
      <Navbar />

      <div className="ps-root">
        {/* Hero section */}
        <div className="ps-hero">
          <div className="ps-orb" />
          <div className="ps-hero-content">
            <div className="ps-success-badge">
              <span className="ps-checkmark">✓</span>
            </div>
            <h1 className="ps-title">Payment Successful!</h1>
            <p className="ps-subtitle">Your booking is confirmed and payment received</p>
          </div>
        </div>

        {/* Main content */}
        <div className="ps-body">
          {/* Confirmation card */}
          <div className="ps-card ps-confirmation-card">
            <div className="ps-card-header">
              <h2 className="ps-card-title">Booking Confirmed</h2>
              <span className="ps-status-badge ps-status-confirmed">Confirmed</span>
            </div>

            {booking && (
              <>
                {/* Service details */}
                <div className="ps-detail-row">
                  <div className="ps-detail-label">Service</div>
                  <div className="ps-detail-value">
                    <h3 className="ps-vendor-name">{booking.vendorId?.title}</h3>
                    <p className="ps-vendor-type">{booking.vendorId?.serviceType}</p>
                  </div>
                </div>

                {/* Event date */}
                <div className="ps-detail-row">
                  <div className="ps-detail-label">Event Date</div>
                  <div className="ps-detail-value">
                    <p className="ps-date">
                      {new Date(booking.date).toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                </div>

                {/* Package */}
                {booking.packageName && (
                  <div className="ps-detail-row">
                    <div className="ps-detail-label">Package</div>
                    <div className="ps-detail-value">
                      <p className="ps-package">{booking.packageName}</p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {booking.vendorId?.location && (
                  <div className="ps-detail-row">
                    <div className="ps-detail-label">Location</div>
                    <div className="ps-detail-value">
                      <p className="ps-location">📍 {booking.vendorId.location}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment receipt */}
          {payment && (
            <div className="ps-card ps-receipt-card">
              <h2 className="ps-card-title">Payment Receipt</h2>

              <div className="ps-receipt-row">
                <span>Order ID</span>
                <span className="ps-mono">{payment.orderId}</span>
              </div>

              <div className="ps-receipt-row">
                <span>Payment ID</span>
                <span className="ps-mono">{payment.paymentId}</span>
              </div>

              <div className="ps-receipt-row">
                <span>Amount Paid</span>
                <span className="ps-amount">₹{payment.amount.toLocaleString()}</span>
              </div>

              <div className="ps-receipt-row">
                <span>Payment Status</span>
                <span className="ps-status-value ps-paid">Paid</span>
              </div>

              <div className="ps-receipt-row">
                <span>Payment Date</span>
                <span>
                  {new Date(payment.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>

              <div className="ps-receipt-divider" />

              <div className="ps-receipt-info">
                <p className="ps-info-text">
                  ✓ Your payment has been securely processed by Razorpay
                  <br />
                  ✓ A confirmation email has been sent to your registered email
                  <br />
                  ✓ The vendor will contact you shortly with event details
                </p>
              </div>
            </div>
          )}

          {/* Next steps */}
          <div className="ps-card ps-steps-card">
            <h2 className="ps-card-title">What's Next?</h2>
            <ol className="ps-steps-list">
              <li>The vendor will review your booking</li>
              <li>You'll receive a confirmation message from the vendor</li>
              <li>Finalize event details before your scheduled date</li>
              <li>Enjoy your event experience!</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="ps-actions">
            <button className="ps-btn ps-btn-secondary" onClick={handlePrint}>
              🖨 Print Receipt
            </button>
            <button className="ps-btn ps-btn-secondary" onClick={handleShare}>
              📤 Share
            </button>
            <button
              className="ps-btn ps-btn-primary"
              onClick={() => navigate("/my-bookings")}
            >
              View My Bookings →
            </button>
          </div>

          {/* Footer */}
          <div className="ps-footer">
            <p>Questions? Contact our support team at support@eventify.com</p>
          </div>
        </div>
      </div>
    </>
  );
}

const paymentSuccessStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --muted: #7a7265;
    --border: rgba(201,168,76,0.18);
    --surface: #faf7f2;
    --white: #ffffff;
    --success: #2d6a4f;
    --success-light: rgba(45,106,79,0.08);
  }

  .ps-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  /* ── HERO ── */
  .ps-hero {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, var(--ink) 0%, #1a1815 100%);
    padding: 120px 32px 80px;
    text-align: center;
  }

  .ps-orb {
    position: absolute;
    width: 400px;
    height: 400px;
    background: var(--gold);
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.08;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .ps-hero-content {
    position: relative;
    z-index: 2;
    animation: psHeroIn 0.6s ease both;
  }

  .ps-success-badge {
    width: 100px;
    height: 100px;
    background: var(--success);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 20px 60px rgba(45,106,79,0.3);
    animation: psScalePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .ps-checkmark {
    color: var(--white);
    font-size: 3rem;
    font-weight: 600;
    line-height: 1;
  }

  .ps-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.2rem, 5vw, 3.2rem);
    font-weight: 300;
    color: var(--white);
    margin: 0 0 12px;
    line-height: 1.1;
  }

  .ps-subtitle {
    font-size: 14px;
    color: rgba(245,240,232,0.5);
    margin: 0;
    letter-spacing: 0.05em;
  }

  /* ── BODY ── */
  .ps-body {
    max-width: 780px;
    margin: 0 auto;
    padding: 56px 28px 88px;
  }

  /* ── CARDS ── */
  .ps-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 20px;
    animation: psFadeUp 0.5s ease both;
  }

  .ps-confirmation-card { animation-delay: 0.1s; }
  .ps-receipt-card { animation-delay: 0.2s; }
  .ps-steps-card { animation-delay: 0.3s; }

  .ps-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .ps-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 400;
    margin: 0;
    color: var(--ink);
  }

  .ps-status-badge {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    padding: 6px 14px;
    border-radius: 20px;
    text-transform: uppercase;
  }

  .ps-status-confirmed {
    background: var(--success-light);
    color: var(--success);
    border: 1px solid rgba(45,106,79,0.2);
  }

  /* Detail rows */
  .ps-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 0;
    border-bottom: 1px solid var(--border);
  }

  .ps-detail-row:last-child {
    border-bottom: none;
  }

  .ps-detail-label {
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 500;
    min-width: 100px;
  }

  .ps-detail-value {
    flex: 1;
    text-align: right;
  }

  .ps-vendor-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0;
    color: var(--ink);
  }

  .ps-vendor-type {
    font-size: 12px;
    color: var(--muted);
    margin: 4px 0 0;
    text-transform: capitalize;
  }

  .ps-date,
  .ps-package,
  .ps-location {
    margin: 0;
    font-size: 14px;
    color: var(--ink);
  }

  /* Receipt */
  .ps-receipt-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    font-size: 13.5px;
  }

  .ps-receipt-row span:first-child {
    color: var(--muted);
  }

  .ps-receipt-row span:last-child {
    color: var(--ink);
    font-weight: 500;
  }

  .ps-mono {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    letter-spacing: 0.03em;
  }

  .ps-amount {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--gold);
  }

  .ps-status-value {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 12px;
    text-transform: uppercase;
    font-weight: 500;
  }

  .ps-paid {
    background: var(--success-light);
    color: var(--success);
  }

  .ps-receipt-divider {
    height: 1px;
    background: var(--border);
    margin: 12px 0;
  }

  .ps-receipt-info {
    background: var(--success-light);
    border: 1px solid rgba(45,106,79,0.2);
    border-radius: 10px;
    padding: 12px 14px;
    margin-top: 12px;
  }

  .ps-info-text {
    font-size: 12px;
    color: var(--success);
    line-height: 1.8;
    margin: 0;
  }

  /* Steps */
  .ps-steps-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .ps-steps-list li {
    padding: 12px 0;
    padding-left: 32px;
    position: relative;
    font-size: 13.5px;
    color: var(--muted);
    line-height: 1.6;
  }

  .ps-steps-list li:before {
    content: "✓";
    position: absolute;
    left: 0;
    color: var(--success);
    font-weight: 600;
    font-size: 1.1rem;
  }

  /* Actions */
  .ps-actions {
    display: flex;
    gap: 10px;
    margin-top: 32px;
    flex-wrap: wrap;
  }

  .ps-btn {
    flex: 1;
    min-width: 140px;
    padding: 14px 20px;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .ps-btn-primary {
    background: var(--gold);
    color: var(--ink);
  }

  .ps-btn-primary:hover {
    background: #b8942f;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(201,168,76,0.3);
  }

  .ps-btn-secondary {
    background: transparent;
    border: 1.5px solid var(--border);
    color: var(--muted);
  }

  .ps-btn-secondary:hover {
    border-color: var(--muted);
    color: var(--ink);
    background: var(--surface);
  }

  /* Footer */
  .ps-footer {
    text-align: center;
    padding-top: 24px;
    border-top: 1px solid var(--border);
    margin-top: 40px;
  }

  .ps-footer p {
    font-size: 12px;
    color: var(--muted);
    margin: 0;
    letter-spacing: 0.04em;
  }

  /* Loader */
  .ps-loader {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--muted);
    font-size: 13px;
  }

  .ps-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: psSpin 0.8s linear infinite;
  }

  /* Animations */
  @keyframes psHeroIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes psScalePop {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes psFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes psSpin {
    to { transform: rotate(360deg); }
  }

  @media print {
    .ps-hero { background: var(--white); border-bottom: 1px solid var(--border); }
    .ps-hero-content { animation: none; }
    .ps-title { color: var(--ink); }
    .ps-subtitle { display: none; }
    .ps-actions { display: none; }
  }

  @media (max-width: 600px) {
    .ps-hero { padding: 80px 20px 60px; }
    .ps-body { padding: 28px 16px 64px; }
    .ps-card { padding: 20px 16px; }
    .ps-card-header { flex-direction: column; gap: 12px; align-items: flex-start; }
    .ps-detail-row { flex-direction: column; align-items: flex-start; gap: 6px; }
    .ps-detail-value { text-align: left; }
    .ps-actions { flex-direction: column; }
    .ps-btn { min-width: auto; }
  }
`;