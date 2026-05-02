import { useState } from "react";
import { createOrder, verifyPayment } from "../services/paymentService";
import { useNavigate } from "react-router-dom";

// ── Plan helpers ──────────────────────────────────────────────────────────────
const PLAN_META = {
  "25": {
    color:  "#2d6a4f",
    bg:     "rgba(45,106,79,0.08)",
    border: "rgba(45,106,79,0.3)",
    label:  "25% Now · 50% Before Event · 25% After",
  },
  "75": {
    color:  "#b87333",
    bg:     "rgba(184,115,51,0.08)",
    border: "rgba(184,115,51,0.3)",
    label:  "75% Now · 25% After Event",
  },
  "100": {
    color:  "#c9a84c",
    bg:     "rgba(201,168,76,0.08)",
    border: "rgba(201,168,76,0.3)",
    label:  "Full Payment (5% Discount Applied)",
  },
};

function installmentLabel(num) {
  return num === 1 ? "1st Installment" : num === 2 ? "2nd Installment" : "Final Installment";
}

// ── PaymentModal ──────────────────────────────────────────────────────────────
export default function PaymentModal({ booking, vendor, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const navigate = useNavigate();

  // ── Determine which installment we're paying ──────────────────────────────
  const paymentPlan = booking.paymentPlan || "100";
  const installments = booking.installments || [];

  // Find the next pending/link_sent installment
  const nextInstallment = installments.find(
    (i) => i.status === "pending" || i.status === "link_sent"
  );

  // The amount to pay right now
  const amount = nextInstallment
    ? nextInstallment.amount
    : booking.packagePrice || vendor?.packages?.[0]?.price || 0;

  const installmentNum = nextInstallment?.installmentNumber || 1;
  const planMeta = PLAN_META[paymentPlan] || PLAN_META["100"];

  // Total paid so far (for multi-installment plans)
  const totalPaid = booking.totalPaid || 0;
  const remaining = (booking.packagePrice || 0) - totalPaid - amount;

  const handlePayment = async () => {
    if (!booking._id || !amount) {
      setError("Invalid booking or amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Create Razorpay order (pass installmentNumber so backend knows which one)
      const orderData = await createOrder(booking._id, amount, installmentNum);

      if (!orderData.orderId) throw new Error("Failed to create payment order");

      // Step 2: Open Razorpay Checkout
      const options = {
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        "Evencers",
        description: `${booking.packageName || "Service"} — ${installmentLabel(installmentNum)}`,
        order_id:    orderData.orderId,

        handler: async (response) => {
          try {
            const verifyData = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              orderData.paymentId
            );

            if (verifyData.success) {
              if (onSuccess) onSuccess(verifyData);
              navigate(`/payment-success/${booking._id}`);
            } else {
              setError("Payment verification failed");
            }
          } catch (err) {
            setError(err.message || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment was cancelled");
          },
        },

        theme:   { color: planMeta.color },
        prefill: { email: "", contact: "" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
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
        <button className="pm-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="pm-header">
          <div className="pm-icon">💳</div>
          <h2 className="pm-title">
            {installments.length > 1
              ? `${installmentLabel(installmentNum)}`
              : "Complete Payment"}
          </h2>
          <p className="pm-subtitle">Secure payment via Razorpay</p>
        </div>

        {/* Plan badge */}
        <div className="pm-plan-badge"
          style={{ background: planMeta.bg, border: `1px solid ${planMeta.border}`, color: planMeta.color }}>
          <span className="pm-plan-dot" style={{ background: planMeta.color }} />
          {planMeta.label}
        </div>

        {/* Installment progress (for multi-step plans) */}
        {installments.length > 1 && (
          <div className="pm-inst-progress">
            {installments.map((inst, i) => (
              <div key={i} className={`pm-inst-step ${inst.status}`}>
                <div className="pm-inst-dot">
                  {inst.status === "paid" ? "✓" : inst.installmentNumber}
                </div>
                <div className="pm-inst-info">
                  <span className="pm-inst-label">{installmentLabel(inst.installmentNumber)}</span>
                  <span className="pm-inst-amt">₹{inst.amount.toLocaleString("en-IN")}</span>
                </div>
                {i < installments.length - 1 && <div className="pm-inst-line" />}
              </div>
            ))}
          </div>
        )}

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
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </div>

          {totalPaid > 0 && (
            <div className="pm-sum-row">
              <span className="pm-sum-label">Already Paid</span>
              <span className="pm-sum-value pm-sum-paid">₹{totalPaid.toLocaleString("en-IN")} ✓</span>
            </div>
          )}

          <div className="pm-sum-divider" />

          <div className="pm-sum-row pm-sum-total">
            <span className="pm-sum-label">
              {installments.length > 1 ? `${installmentLabel(installmentNum)} Due` : "Amount to Pay"}
            </span>
            <span className="pm-sum-value" style={{ color: planMeta.color }}>
              ₹{amount.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Show remaining after this payment */}
          {remaining > 0 && (
            <div className="pm-sum-row">
              <span className="pm-sum-label">Remaining After This</span>
              <span className="pm-sum-value pm-sum-remaining">₹{remaining.toLocaleString("en-IN")}</span>
            </div>
          )}

          {/* 100% plan discount note */}
          {paymentPlan === "100" && (
            <div className="pm-discount-note">
              🎉 5% discount applied — you save ₹{Math.round((booking.packagePrice || 0) * 0.05).toLocaleString("en-IN")}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="pm-error">
            <span className="pm-error-icon">⚠</span>
            <p>{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="pm-info">
          <p className="pm-info-text">
            ✓ Secure payment powered by Razorpay &nbsp;·&nbsp; PCI-DSS compliant &nbsp;·&nbsp; 100% safe
          </p>
        </div>

        {/* Actions */}
        <div className="pm-actions">
          <button className="pm-btn pm-btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`pm-btn pm-btn-pay ${loading ? "loading" : ""}`}
            style={{ background: planMeta.color }}
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <><span className="pm-spinner" /> Processing...</>
            ) : (
              `Pay ₹${amount.toLocaleString("en-IN")}`
            )}
          </button>
        </div>

        <p className="pm-footer">By proceeding, you agree to our Terms & Conditions</p>
      </div>

      <style>{paymentModalStyles}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const paymentModalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink:#0e0c0a; --cream:#f5f0e8; --gold:#c9a84c;
    --muted:#7a7265; --border:rgba(201,168,76,0.2);
    --surface:#faf7f2; --white:#ffffff;
    --danger:#a93226; --danger-bg:#fdf0ef;
    --success:#2d6a4f; --success-bg:rgba(45,106,79,0.08);
  }

  .pm-overlay {
    position:fixed;inset:0;background:rgba(14,12,10,0.65);
    backdrop-filter:blur(6px);display:flex;align-items:center;
    justify-content:center;z-index:2000;padding:20px;
  }
  .pm-modal {
    background:var(--white);border-radius:20px;border:1px solid var(--border);
    padding:40px 36px 32px;width:100%;max-width:480px;position:relative;
    box-shadow:0 40px 100px rgba(14,12,10,0.22);
    max-height:90vh;overflow-y:auto;
  }
  .pm-close {
    position:absolute;top:18px;right:18px;background:transparent;
    border:1px solid var(--border);width:32px;height:32px;border-radius:50%;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    font-size:14px;color:var(--muted);transition:all 0.2s;
  }
  .pm-close:hover { border-color:var(--muted);color:var(--ink); }

  .pm-header { text-align:center;margin-bottom:18px; }
  .pm-icon { font-size:2.4rem;margin-bottom:10px; }
  .pm-title { font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:400;color:var(--ink);margin:0 0 6px; }
  .pm-subtitle { font-size:12px;color:var(--muted);margin:0;letter-spacing:0.08em; }

  /* Plan badge */
  .pm-plan-badge {
    display:flex;align-items:center;gap:8px;
    padding:8px 14px;border-radius:8px;margin-bottom:16px;
    font-size:11.5px;font-weight:500;letter-spacing:0.04em;
  }
  .pm-plan-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0; }

  /* Installment progress */
  .pm-inst-progress {
    display:flex;align-items:center;gap:0;
    background:var(--surface);border:1px solid var(--border);
    border-radius:10px;padding:12px 16px;margin-bottom:16px;
    position:relative;
  }
  .pm-inst-step {
    display:flex;align-items:center;gap:8px;flex:1;position:relative;
  }
  .pm-inst-dot {
    width:28px;height:28px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:11px;font-weight:600;flex-shrink:0;
    border:1.5px solid var(--border);background:var(--white);color:var(--muted);
  }
  .pm-inst-step.paid    .pm-inst-dot { background:var(--success-bg);border-color:rgba(45,106,79,0.3);color:var(--success); }
  .pm-inst-step.link_sent .pm-inst-dot { background:rgba(201,168,76,0.1);border-color:rgba(201,168,76,0.4);color:var(--gold); }
  .pm-inst-step.pending  .pm-inst-dot { background:var(--surface);color:var(--muted); }
  .pm-inst-info { display:flex;flex-direction:column;gap:1px;min-width:0; }
  .pm-inst-label { font-size:9.5px;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);white-space:nowrap; }
  .pm-inst-amt   { font-size:12px;font-weight:600;color:var(--ink); }
  .pm-inst-line {
    flex:1;height:1.5px;background:var(--border);
    margin:0 6px;flex-shrink:0;min-width:12px;
  }

  /* Summary */
  .pm-summary {
    background:var(--surface);border:1px solid var(--border);
    border-radius:14px;padding:16px;margin-bottom:16px;
  }
  .pm-sum-row { display:flex;justify-content:space-between;align-items:center;padding:7px 0;font-size:13px; }
  .pm-sum-label { color:var(--muted); }
  .pm-sum-value { color:var(--ink);font-weight:500;text-align:right;max-width:55%;word-break:break-word; }
  .pm-sum-paid      { color:var(--success);font-size:12px; }
  .pm-sum-remaining { color:var(--muted);font-size:12px; }
  .pm-sum-divider   { height:1px;background:var(--border);margin:8px 0; }
  .pm-sum-total .pm-sum-label { font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--ink);font-weight:600; }
  .pm-sum-total .pm-sum-value { font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:600; }

  /* Discount note */
  .pm-discount-note {
    margin-top:8px;padding:8px 12px;border-radius:6px;
    background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);
    font-size:11.5px;color:var(--gold);font-weight:500;text-align:center;
  }

  /* Error */
  .pm-error { display:flex;gap:10px;padding:10px 14px;background:var(--danger-bg);border:1px solid rgba(169,50,38,0.25);border-radius:10px;margin-bottom:14px; }
  .pm-error-icon { color:var(--danger);font-size:13px;flex-shrink:0;margin-top:1px; }
  .pm-error p { margin:0;font-size:12.5px;color:var(--danger);line-height:1.5; }

  /* Info */
  .pm-info { margin-bottom:18px; }
  .pm-info-text { margin:0;font-size:11.5px;color:var(--muted);line-height:1.7;text-align:center; }

  /* Actions */
  .pm-actions { display:flex;gap:10px; }
  .pm-btn { flex:1;padding:14px 20px;border:none;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:500;cursor:pointer;transition:all 0.25s;display:flex;align-items:center;justify-content:center;gap:8px; }
  .pm-btn:disabled { opacity:0.6;cursor:not-allowed; }
  .pm-btn-cancel { background:transparent;border:1.5px solid var(--border);color:var(--muted); }
  .pm-btn-cancel:hover:not(:disabled) { border-color:var(--muted);background:var(--surface);color:var(--ink); }
  .pm-btn-pay { color:var(--white);border:none; }
  .pm-btn-pay:hover:not(:disabled) { opacity:0.88;transform:translateY(-2px);box-shadow:0 8px 28px rgba(14,12,10,0.22); }
  .pm-btn-pay.loading { pointer-events:none;opacity:0.75; }

  .pm-spinner { width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:pmSpin 0.7s linear infinite;display:inline-block; }
  .pm-footer { font-size:11px;color:var(--muted);text-align:center;margin-top:14px;letter-spacing:0.04em; }

  @keyframes pmSpin { to{transform:rotate(360deg)} }

  @media(max-width:480px) {
    .pm-modal { padding:28px 20px 24px; }
    .pm-inst-progress { flex-direction:column;align-items:flex-start;gap:8px; }
    .pm-inst-line { width:1.5px;height:12px;margin:0 0 0 13px; }
  }
`;