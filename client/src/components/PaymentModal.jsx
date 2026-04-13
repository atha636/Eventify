import { useState } from "react";
import { createOrder, verifyPayment } from "../services/paymentService";

export default function PaymentModal({ booking, vendor, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amount = booking.packagePrice || vendor?.packages?.[0]?.price || 0;

  const handlePayment = async () => {
    if (!booking._id || !amount) {
      setError("Invalid booking or amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Create order on backend
      const orderData = await createOrder(booking._id, amount);

      if (!orderData.orderId) {
        throw new Error("Failed to create payment order");
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Eventify",
        description: `${booking.packageName || "Service"} - ${vendor?.title}`,
        order_id: orderData.orderId,
        
        // ── HANDLER: Payment successful ──────────────────────────
        handler: async (response) => {
          try {
            // Step 3: Verify payment on backend
            const verifyData = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              orderData.paymentId
            );

            if (verifyData.success) {
              onSuccess(verifyData);
            } else {
              setError("Payment verification failed");
            }
          } catch (err) {
            setError(err.message || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },

        // ── HANDLER: Payment failed ──────────────────────────────
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment was cancelled");
          }
        },

        // ── Additional payment options ──────────────────────────
        theme: {
          color: "#c9a84c"
        },
        prefill: {
          email: "",
          contact: ""
        }
      };

      // Create Razorpay instance and open
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setLoading(false);
        setError(`Payment failed: ${response.error.description}`);
      });

      rzp.open();

    } catch (err) {
      setLoading(false);
      setError(err.message || "Failed to initiate payment");
      console.error("Payment error:", err);
    }
  };

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="pm-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="pm-header">
          <div className="pm-icon">💳</div>
          <h2 className="pm-title">Complete Payment</h2>
          <p className="pm-subtitle">Secure payment via Razorpay</p>
        </div>

        {/* Order Summary */}
        <div className="pm-summary">
          <div className="pm-sum-row">
            <span className="pm-sum-label">Service</span>
            <span className="pm-sum-value">{vendor?.title}</span>
          </div>

          {booking.packageName && (
            <div className="pm-sum-row">
              <span className="pm-sum-label">Package</span>
              <span className="pm-sum-value">{booking.packageName}</span>
            </div>
          )}

          <div className="pm-sum-row">
            <span className="pm-sum-label">Event Date</span>
            <span className="pm-sum-value">
              {new Date(booking.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </span>
          </div>

          <div className="pm-sum-divider" />

          <div className="pm-sum-row pm-sum-total">
            <span className="pm-sum-label">Amount to Pay</span>
            <span className="pm-sum-value">₹{amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="pm-error">
            <span className="pm-error-icon">⚠</span>
            <p>{error}</p>
          </div>
        )}

        {/* Payment info */}
        <div className="pm-info">
          <p className="pm-info-text">
            ✓ Secure payment powered by Razorpay
            <br />
            ✓ PCI-DSS compliant
            <br />
            ✓ 100% safe and encrypted
          </p>
        </div>

        {/* Action buttons */}
        <div className="pm-actions">
          <button
            className="pm-btn pm-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`pm-btn pm-btn-pay ${loading ? "loading" : ""}`}
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="pm-spinner" />
                Processing...
              </>
            ) : (
              `Pay ₹${amount.toLocaleString()}`
            )}
          </button>
        </div>

        {/* Footer note */}
        <p className="pm-footer">
          By proceeding, you agree to our Terms & Conditions
        </p>
      </div>

      <style>{paymentModalStyles}</style>
    </div>
  );
}

const paymentModalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --muted: #7a7265;
    --border: rgba(201,168,76,0.2);
    --surface: #faf7f2;
    --white: #ffffff;
    --danger: #a93226;
    --danger-bg: #fdf0ef;
  }

  .pm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(14,12,10,0.65);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: pmFadeIn 0.25s ease both;
    padding: 20px;
  }

  .pm-modal {
    background: var(--white);
    border-radius: 20px;
    border: 1px solid var(--border);
    padding: 40px 36px 32px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 40px 100px rgba(14,12,10,0.22), 0 0 0 1px rgba(255,255,255,0.4) inset;
    animation: pmModalUp 0.35s cubic-bezier(0.34,1.2,0.64,1) both;
    position: relative;
  }

  .pm-close {
    position: absolute;
    top: 18px;
    right: 18px;
    background: transparent;
    border: 1px solid var(--border);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: var(--muted);
    transition: all 0.2s ease;
  }

  .pm-close:hover {
    border-color: var(--muted);
    color: var(--ink);
  }

  .pm-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .pm-icon {
    font-size: 2.8rem;
    margin-bottom: 14px;
  }

  .pm-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem;
    font-weight: 400;
    color: var(--ink);
    margin: 0 0 6px;
  }

  .pm-subtitle {
    font-size: 12px;
    color: var(--muted);
    margin: 0;
    letter-spacing: 0.08em;
  }

  /* Order Summary */
  .pm-summary {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .pm-sum-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    font-size: 13.5px;
  }

  .pm-sum-label {
    color: var(--muted);
    font-weight: 400;
  }

  .pm-sum-value {
    color: var(--ink);
    font-weight: 500;
    text-align: right;
    max-width: 50%;
    word-break: break-word;
  }

  .pm-sum-divider {
    height: 1px;
    background: var(--border);
    margin: 10px 0;
  }

  .pm-sum-total {
    padding-top: 6px;
  }

  .pm-sum-total .pm-sum-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
    color: var(--ink);
    font-weight: 600;
  }

  .pm-sum-total .pm-sum-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--gold);
  }

  /* Error message */
  .pm-error {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    background: var(--danger-bg);
    border: 1px solid rgba(169,50,38,0.25);
    border-radius: 10px;
    margin-bottom: 16px;
    animation: pmErrorSlide 0.3s ease both;
  }

  .pm-error-icon {
    color: var(--danger);
    font-size: 13px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .pm-error p {
    margin: 0;
    font-size: 12.5px;
    color: var(--danger);
    line-height: 1.5;
  }

  /* Info section */
  .pm-info {
    margin-bottom: 22px;
  }

  .pm-info-text {
    margin: 0;
    font-size: 12px;
    color: var(--muted);
    line-height: 1.8;
    text-align: center;
  }

  /* Actions */
  .pm-actions {
    display: flex;
    gap: 10px;
  }

  .pm-btn {
    flex: 1;
    padding: 14px 20px;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .pm-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .pm-btn-cancel {
    background: transparent;
    border: 1.5px solid var(--border);
    color: var(--muted);
  }

  .pm-btn-cancel:hover:not(:disabled) {
    border-color: var(--muted);
    background: var(--surface);
    color: var(--ink);
  }

  .pm-btn-pay {
    background: var(--gold);
    color: var(--ink);
    border: none;
  }

  .pm-btn-pay:hover:not(:disabled) {
    background: #b8942f;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(201,168,76,0.35);
  }

  .pm-btn-pay.loading {
    pointer-events: none;
    opacity: 0.75;
  }

  .pm-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(14,12,10,0.2);
    border-top-color: var(--ink);
    border-radius: 50%;
    animation: pmSpin 0.7s linear infinite;
    display: inline-block;
  }

  /* Footer */
  .pm-footer {
    font-size: 11px;
    color: var(--muted);
    text-align: center;
    margin-top: 16px;
    letter-spacing: 0.04em;
  }

  /* Animations */
  @keyframes pmFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pmModalUp {
    from { opacity: 0; transform: translateY(30px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes pmErrorSlide {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pmSpin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .pm-modal {
      padding: 32px 24px 28px;
    }
    .pm-header {
      margin-bottom: 20px;
    }
    .pm-title {
      font-size: 1.6rem;
    }
    .pm-btn {
      padding: 12px 16px;
      font-size: 13px;
    }
  }
`;