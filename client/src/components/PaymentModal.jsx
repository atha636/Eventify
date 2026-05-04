import { useState } from "react";
import { createOrder, verifyPayment } from "../services/paymentService";
import { useNavigate } from "react-router-dom";

// ── Plan helpers ──────────────────────────────────────────────
const PLAN_META = {
  "25": {
    color:  "#2d6a4f",
    light:  "rgba(45,106,79,0.12)",
    border: "rgba(45,106,79,0.28)",
    label:  "25% Now · 50% Before Event · 25% After",
    tag:    "3-Part Plan",
  },
  "75": {
    color:  "#b87333",
    light:  "rgba(184,115,51,0.12)",
    border: "rgba(184,115,51,0.28)",
    label:  "75% Now · 25% After Event",
    tag:    "2-Part Plan",
  },
  "100": {
    color:  "#c9a84c",
    light:  "rgba(201,168,76,0.12)",
    border: "rgba(201,168,76,0.28)",
    label:  "Full Payment · 5% Discount Applied",
    tag:    "Full Pay",
  },
};

const INSTALLMENT_LABELS = ["1st Installment", "2nd Installment", "Final Installment"];

function installmentLabel(num) {
  return INSTALLMENT_LABELS[(num || 1) - 1] || `Installment ${num}`;
}

// ── Status icons for installment steps ───────────────────────
function StepDot({ inst, isCurrent }) {
  if (inst.status === "paid") {
    return (
      <div className="pm-step-dot pm-step-dot--paid">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }
  if (isCurrent) {
    return <div className="pm-step-dot pm-step-dot--active">{inst.installmentNumber}</div>;
  }
  return <div className="pm-step-dot pm-step-dot--pending">{inst.installmentNumber}</div>;
}

export default function PaymentModal({ booking, vendor, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const navigate = useNavigate();

  const paymentPlan  = booking.paymentPlan || "100";
  const installments = booking.installments || [];

  // Next pending installment
  const nextInstallment = installments.find(
    (i) => i.status === "pending" || i.status === "link_sent"
  );

  const amount        = nextInstallment?.amount ?? (booking.packagePrice || vendor?.packages?.[0]?.price || 0);
  const installmentNum = nextInstallment?.installmentNumber || 1;
  const planMeta      = PLAN_META[paymentPlan] || PLAN_META["100"];
  const totalPaid     = booking.totalPaid || 0;
  const remaining     = (booking.packagePrice || 0) - totalPaid - amount;
  const isMultiStep   = installments.length > 1;
  const eventDate     = new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const handlePayment = async () => {
    if (!booking._id || !amount) { setError("Invalid booking or amount"); return; }
    setLoading(true); setError("");
    try {
      const orderData = await createOrder(booking._id, amount, installmentNum);
      if (!orderData.orderId) throw new Error("Failed to create payment order");

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
              setError("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            setError(err.message || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => { setLoading(false); } },
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
    }
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div className="pm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label="Complete payment">

        <div className="pm-sheet">
          {/* ── Dark header ── */}
          <div className="pm-head">
            <div className="pm-head-glow" />

            <button className="pm-x" onClick={onClose} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="pm-head-icon">💳</div>

            <h2 className="pm-head-title">
              {isMultiStep ? installmentLabel(installmentNum) : "Complete Payment"}
            </h2>
            <p className="pm-head-sub">Secure payment via Razorpay · PCI-DSS Compliant</p>

            {/* Plan tag */}
            <div className="pm-plan-tag" style={{ color: planMeta.color, background: planMeta.light, border: `1px solid ${planMeta.border}` }}>
              <span className="pm-plan-pulse" style={{ background: planMeta.color }} />
              {planMeta.label}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="pm-body">

            {/* Installment progress bar */}
            {isMultiStep && (
              <div className="pm-progress-section">
                <div className="pm-progress-track">
                  {installments.map((inst, i) => {
                    const isCurrent = inst.installmentNumber === installmentNum;
                    return (
                      <div key={i} className="pm-progress-step">
                        <StepDot inst={inst} isCurrent={isCurrent} />

                        <div className="pm-progress-info">
                          <span className={`pm-progress-label ${isCurrent ? "pm-progress-label--active" : ""}`}>
                            {installmentLabel(inst.installmentNumber)}
                          </span>
                          <span className={`pm-progress-amt ${inst.status === "paid" ? "pm-progress-amt--paid" : isCurrent ? "pm-progress-amt--active" : ""}`}>
                            ₹{inst.amount.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {i < installments.length - 1 && (
                          <div className={`pm-progress-line ${inst.status === "paid" ? "pm-progress-line--done" : ""}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order summary card */}
            <div className="pm-summary">
              <div className="pm-summary-header">Order Summary</div>

              <div className="pm-sum-rows">
                <div className="pm-sum-row">
                  <span className="pm-sum-key">Service</span>
                  <span className="pm-sum-val">{vendor?.title || booking.vendorId?.title || "—"}</span>
                </div>
                {booking.packageName && (
                  <div className="pm-sum-row">
                    <span className="pm-sum-key">Package</span>
                    <span className="pm-sum-val">{booking.packageName}</span>
                  </div>
                )}
                <div className="pm-sum-row">
                  <span className="pm-sum-key">Event Date</span>
                  <span className="pm-sum-val">{eventDate}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="pm-sum-row">
                    <span className="pm-sum-key">Already Paid</span>
                    <span className="pm-sum-val pm-sum-val--paid">₹{totalPaid.toLocaleString("en-IN")} ✓</span>
                  </div>
                )}
              </div>

              <div className="pm-divider" />

              {/* Due amount — prominent */}
              <div className="pm-due">
                <div>
                  <span className="pm-due-label">
                    {isMultiStep ? `${installmentLabel(installmentNum)} Due` : "Amount Due"}
                  </span>
                  {remaining > 0 && (
                    <span className="pm-due-remaining">₹{remaining.toLocaleString("en-IN")} remaining after this</span>
                  )}
                </div>
                <span className="pm-due-amount" style={{ color: planMeta.color }}>
                  ₹{amount.toLocaleString("en-IN")}
                </span>
              </div>

              {/* 5% discount note */}
              {paymentPlan === "100" && (
                <div className="pm-discount">
                  🎉 5% discount applied — you save ₹{Math.round((booking.packagePrice || 0) * 0.05).toLocaleString("en-IN")}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="pm-error" role="alert">
                <span className="pm-error-icon">⚠</span>
                <p>{error}</p>
              </div>
            )}

            {/* Trust badges */}
            <div className="pm-trust">
              <div className="pm-trust-item"><span>🔒</span><span>256-bit SSL</span></div>
              <div className="pm-trust-sep" />
              <div className="pm-trust-item"><span>🛡️</span><span>Escrow Protected</span></div>
              <div className="pm-trust-sep" />
              <div className="pm-trust-item"><span>✓</span><span>Razorpay Verified</span></div>
            </div>

            {/* Actions */}
            <div className="pm-actions">
              <button className="pm-btn pm-btn-ghost" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                className="pm-btn pm-btn-pay"
                style={{ background: loading ? "#b8942e" : planMeta.color }}
                onClick={handlePayment}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <><span className="pm-spinner" aria-hidden="true" /> Processing…</>
                ) : (
                  <>Pay ₹{amount.toLocaleString("en-IN")} →</>
                )}
              </button>
            </div>

            <p className="pm-tos">By proceeding, you agree to Evencers' Terms & Conditions</p>
          </div>
        </div>
      </div>
    </>
  );
}

const modalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --pm-ink:  #0e0c0a;
    --pm-ink2: #1c1a17;
    --pm-cream:#f5f0e8;
    --pm-gold: #c9a84c;
    --pm-muted:#7a7265;
    --pm-border:rgba(201,168,76,0.18);
    --pm-surf: #faf7f2;
    --pm-white:#ffffff;
    --pm-red:  #a93226;
    --pm-red-bg:rgba(169,50,38,0.06);
    --pm-red-b:rgba(169,50,38,0.22);
    --pm-success:#2d6a4f;
    --pm-success-bg:rgba(45,106,79,0.1);
  }

  /* ── Overlay ── */
  .pm-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(10,8,6,0.72);
    backdrop-filter: blur(10px);
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0;
    animation: pmFadeIn 0.22s ease both;
  }
  @media (min-width: 540px) {
    .pm-overlay { align-items: center; padding: 20px; }
  }

  /* ── Sheet ── */
  .pm-sheet {
    width: 100%;
    max-width: 480px;
    background: var(--pm-white);
    border-radius: 24px 24px 0 0;
    overflow: hidden;
    box-shadow: 0 -8px 60px rgba(0,0,0,0.28), 0 40px 100px rgba(0,0,0,0.4);
    animation: pmSlideUp 0.36s cubic-bezier(0.32,0.72,0,1) both;
    max-height: 96vh;
    display: flex; flex-direction: column;
  }
  @media (min-width: 540px) {
    .pm-sheet {
      border-radius: 24px;
      animation: pmPopIn 0.34s cubic-bezier(0.34,1.15,0.64,1) both;
      max-height: 92vh;
    }
  }

  /* ── Dark Header ── */
  .pm-head {
    position: relative; overflow: hidden;
    background: linear-gradient(160deg, #0e0c0a 0%, #1a1610 65%, #14110d 100%);
    padding: 36px 28px 28px;
    text-align: center;
    flex-shrink: 0;
  }
  .pm-head-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,0.1) 0%, transparent 65%);
    pointer-events: none;
  }
  .pm-x {
    position: absolute; top: 16px; right: 16px;
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(245,240,232,0.55);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, color 0.2s, transform 0.18s;
    z-index: 2;
  }
  .pm-x:hover { background: rgba(255,255,255,0.14); color: white; transform: scale(1.1); }
  .pm-head-icon { font-size: 2.2rem; margin-bottom: 10px; position: relative; z-index: 1; display: block; }
  .pm-head-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 300; color: white;
    margin: 0 0 6px; position: relative; z-index: 1;
    line-height: 1.15;
  }
  .pm-head-sub {
    font-size: 11.5px; color: rgba(245,240,232,0.38);
    margin: 0 0 18px; letter-spacing: 0.06em;
    position: relative; z-index: 1;
  }

  /* Plan tag */
  .pm-plan-tag {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 20px;
    font-size: 11.5px; font-weight: 500; letter-spacing: 0.04em;
    position: relative; z-index: 1;
  }
  .pm-plan-pulse {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    animation: pmPulse 2s ease infinite;
  }

  /* ── Body ── */
  .pm-body {
    flex: 1; overflow-y: auto; padding: 24px 24px 20px;
    scrollbar-width: thin; scrollbar-color: var(--pm-border) transparent;
  }
  .pm-body::-webkit-scrollbar { width: 4px; }
  .pm-body::-webkit-scrollbar-thumb { background: var(--pm-border); border-radius: 2px; }

  /* ── Installment Progress ── */
  .pm-progress-section {
    background: var(--pm-surf);
    border: 1px solid var(--pm-border);
    border-radius: 14px;
    padding: 16px 18px;
    margin-bottom: 16px;
  }
  .pm-progress-track {
    display: flex; align-items: flex-start; gap: 0;
    position: relative;
  }
  .pm-progress-step {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
    position: relative; min-width: 0;
  }
  .pm-progress-step:not(:last-child) .pm-progress-line {
    position: absolute; top: 14px; left: 50%; right: -50%;
    height: 2px; background: var(--pm-border);
    z-index: 0;
  }
  .pm-progress-step:not(:last-child) .pm-progress-line--done {
    background: linear-gradient(90deg, var(--pm-success), rgba(45,106,79,0.3));
  }

  /* Step dots */
  .pm-step-dot {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600;
    position: relative; z-index: 1;
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .pm-step-dot--paid   { background: var(--pm-success); border: 2px solid var(--pm-success); color: white; }
  .pm-step-dot--active { background: var(--pm-gold); border: 2px solid var(--pm-gold); color: var(--pm-ink); box-shadow: 0 0 0 4px rgba(201,168,76,0.18); }
  .pm-step-dot--pending{ background: var(--pm-white); border: 2px solid var(--pm-border); color: var(--pm-muted); opacity: 0.7; }

  .pm-progress-info { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; width: 100%; }
  .pm-progress-label { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--pm-muted); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .pm-progress-label--active { color: var(--pm-ink); font-weight: 600; }
  .pm-progress-amt { font-size: 12px; font-weight: 600; color: var(--pm-muted); }
  .pm-progress-amt--paid   { color: var(--pm-success); }
  .pm-progress-amt--active { color: var(--pm-ink); }

  /* ── Summary Card ── */
  .pm-summary {
    background: var(--pm-surf);
    border: 1px solid var(--pm-border);
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 14px;
  }
  .pm-summary-header {
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--pm-muted); font-weight: 500; margin-bottom: 14px;
  }
  .pm-sum-rows { display: flex; flex-direction: column; gap: 1px; }
  .pm-sum-row {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 7px 0; font-size: 13px;
    border-bottom: 1px solid rgba(201,168,76,0.08);
  }
  .pm-sum-row:last-child { border-bottom: none; }
  .pm-sum-key { color: var(--pm-muted); flex-shrink: 0; }
  .pm-sum-val { color: var(--pm-ink); font-weight: 500; text-align: right; max-width: 58%; word-break: break-word; }
  .pm-sum-val--paid { color: var(--pm-success); font-size: 12px; }

  .pm-divider { height: 1px; background: var(--pm-border); margin: 14px 0; }

  /* Due row */
  .pm-due {
    display: flex; justify-content: space-between; align-items: center; gap: 12px;
  }
  .pm-due > div { display: flex; flex-direction: column; gap: 3px; }
  .pm-due-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; font-weight: 600; color: var(--pm-ink);
  }
  .pm-due-remaining { font-size: 11px; color: var(--pm-muted); }
  .pm-due-amount {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem; font-weight: 600; line-height: 1;
    flex-shrink: 0;
  }

  /* Discount */
  .pm-discount {
    margin-top: 12px; padding: 9px 13px;
    background: rgba(201,168,76,0.08);
    border: 1px solid rgba(201,168,76,0.22);
    border-radius: 8px;
    font-size: 12px; color: var(--pm-gold); font-weight: 500; text-align: center;
  }

  /* ── Error ── */
  .pm-error {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 11px 14px; background: var(--pm-red-bg);
    border: 1px solid var(--pm-red-b); border-radius: 10px;
    margin-bottom: 14px;
  }
  .pm-error-icon { color: var(--pm-red); font-size: 13px; flex-shrink: 0; margin-top: 1px; }
  .pm-error p { margin: 0; font-size: 12.5px; color: var(--pm-red); line-height: 1.5; }

  /* ── Trust badges ── */
  .pm-trust {
    display: flex; align-items: center; justify-content: center; gap: 0;
    padding: 10px 0; margin-bottom: 16px;
    border-top: 1px solid rgba(201,168,76,0.1);
    border-bottom: 1px solid rgba(201,168,76,0.1);
  }
  .pm-trust-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--pm-muted); padding: 0 14px; }
  .pm-trust-item span:first-child { font-size: 13px; }
  .pm-trust-sep { width: 1px; height: 16px; background: var(--pm-border); }

  /* ── Actions ── */
  .pm-actions { display: flex; gap: 10px; margin-bottom: 12px; }
  .pm-btn {
    flex: 1; padding: 15px 18px;
    border: none; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all 0.22s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pm-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
  .pm-btn-ghost {
    background: transparent;
    border: 1.5px solid var(--pm-border);
    color: var(--pm-muted); flex: 0 0 auto; padding: 15px 22px;
  }
  .pm-btn-ghost:hover:not(:disabled) { border-color: var(--pm-muted); color: var(--pm-ink); background: var(--pm-surf); }
  .pm-btn-pay { color: white; }
  .pm-btn-pay:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(14,12,10,0.22); }

  .pm-spinner {
    width: 15px; height: 15px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    animation: pmSpin 0.7s linear infinite; display: inline-block;
  }

  .pm-tos { font-size: 10.5px; color: var(--pm-muted); text-align: center; letter-spacing: 0.03em; line-height: 1.5; }

  /* ── Responsive ── */
  @media (max-width: 380px) {
    .pm-head { padding: 28px 20px 22px; }
    .pm-body { padding: 18px 16px 16px; }
    .pm-trust-item span:last-child { display: none; }
    .pm-trust-sep { display: none; }
    .pm-trust-item { padding: 0 10px; }
    .pm-progress-label { display: none; }
  }

  /* ── Animations ── */
  @keyframes pmFadeIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pmSlideUp  { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes pmPopIn    { from { opacity: 0; transform: scale(0.94) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes pmSpin     { to { transform: rotate(360deg); } }
  @keyframes pmPulse    { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.75); } }
`;