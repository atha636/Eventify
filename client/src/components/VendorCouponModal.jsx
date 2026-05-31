
import { useState, useEffect } from "react";

export default function VendorCouponModal() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const code = user?.vendorCode;
  const name = user?.name || user?.firstName || "Vendor";

  useEffect(() => {
    // Show only if:
    // 1. Vendor has a code
    // 2. They have NEVER seen this popup before (permanent localStorage flag)
    const neverSeen = user?.hasSeenWelcome !== true;
if (code && neverSeen) {
      // Slight delay so dashboard renders first
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
  localStorage.setItem("vendorCodeSeen", "1");
  // Also update the user object in localStorage so modal doesn't re-trigger
  const stored = JSON.parse(localStorage.getItem("user") || "null");
  if (stored) {
    stored.hasSeenWelcome = true;
    localStorage.setItem("user", JSON.stringify(stored));
  }
  setLeaving(true);
  setTimeout(() => setVisible(false), 320);
};

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  if (!visible || !code) return null;

  const chars = code.split("");

  return (
    <>
      <style>{styles}</style>
      <div
        className={`vcm-overlay ${leaving ? "vcm-leave" : "vcm-enter"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Your vendor coupon code"
        onClick={(e) => e.target === e.currentTarget && dismiss()}
      >
        <div className="vcm-modal">
          {/* top gold bar */}
          <div className="vcm-topbar" aria-hidden="true" />

          {/* close */}
          <button className="vcm-close" onClick={dismiss} aria-label="Close">✕</button>

          {/* icon */}
          <div className="vcm-icon" aria-hidden="true">🎟</div>

          {/* header */}
          <p className="vcm-tag">Your Coupon Code</p>
          <h2 className="vcm-title">Share &amp; Save Brokerage</h2>
          <p className="vcm-desc">
            Welcome, <strong>{name}</strong>! Share this code with clients —
            when they apply it, You get <strong>zero brokerage</strong> on their
            first transaction, and you build trust faster.
          </p>

          {/* coupon ticket */}
          <div className="vcm-ticket" aria-label={`Coupon code: ${code}`}>
            <p className="vcm-ticket-label">Coupon Code</p>
            <div className="vcm-digits">
              {chars.map((ch, i) => (
                <div
                  key={i}
                  className={`vcm-digit ${isNaN(ch) ? "vcm-alpha" : "vcm-num"}`}
                >
                  {ch}
                </div>
              ))}
            </div>
            <div className="vcm-benefit">
              <span className="vcm-check" aria-hidden="true">✓</span>
              Free brokerage for You by client on first use
            </div>
          </div>

          {/* actions */}
          <button
            className={`vcm-copy-btn ${copied ? "vcm-copied" : ""}`}
            onClick={handleCopy}
            aria-live="polite"
          >
            {copied ? "✓  Copied!" : "⎘  Copy Code"}
          </button>
          <button className="vcm-done-btn" onClick={dismiss}>
            Continue to Dashboard →
          </button>

          <p className="vcm-once-note">
            ℹ This popup shows only once. Find your code anytime under{" "}
            <em>My Coupon Code</em> in your dashboard.
          </p>
        </div>
      </div>
    </>
  );
}

const styles = `
  /* overlay */
  .vcm-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(14,12,10,0.55);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    font-family: 'DM Sans', sans-serif;
    backdrop-filter: blur(3px);
  }
  .vcm-enter { animation: vcmFadeIn 0.32s ease both; }
  .vcm-leave { animation: vcmFadeOut 0.3s ease both; }
  @keyframes vcmFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes vcmFadeOut { from { opacity: 1; } to { opacity: 0; } }

  /* modal card */
  .vcm-modal {
    background: #faf8f3;
    border-radius: 20px;
    padding: 40px 36px 32px;
    max-width: 460px; width: 100%;
    position: relative;
    border: 1px solid rgba(201,168,76,0.18);
    animation: vcmSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes vcmSlideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* gold top bar */
  .vcm-topbar {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #c9a84c, #e8d5a3, #c9a84c);
    border-radius: 20px 20px 0 0;
  }

  /* close button */
  .vcm-close {
    position: absolute; top: 14px; right: 16px;
    background: none; border: none;
    font-size: 14px; color: #a09890;
    cursor: pointer; padding: 4px 6px; border-radius: 6px;
    transition: color 0.2s, background 0.2s;
  }
  .vcm-close:hover { color: #0e0c0a; background: rgba(14,12,10,0.06); }

  /* icon */
  .vcm-icon {
    font-size: 2rem;
    width: 64px; height: 64px;
    border-radius: 50%;
    background: rgba(201,168,76,0.1);
    border: 1.5px solid rgba(201,168,76,0.3);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }

  /* header text */
  .vcm-tag {
    text-align: center;
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    color: #c9a84c; font-weight: 500; margin-bottom: 8px;
  }
  .vcm-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 700;
    color: #0e0c0a; text-align: center; margin-bottom: 8px;
  }
  .vcm-desc {
    font-size: 13.5px; color: #7a7265; text-align: center;
    line-height: 1.65; margin-bottom: 26px;
  }
  .vcm-desc strong { color: #0e0c0a; font-weight: 500; }

  /* ticket */
  .vcm-ticket {
    background: #fff;
    border: 1.5px dashed rgba(201,168,76,0.5);
    border-radius: 14px;
    padding: 20px 20px 16px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .vcm-ticket::before, .vcm-ticket::after {
    content: '';
    position: absolute;
    width: 18px; height: 18px;
    background: #faf8f3;
    border-radius: 50%;
    top: 50%; transform: translateY(-50%);
    border: 1.5px dashed rgba(201,168,76,0.5);
  }
  .vcm-ticket::before { left: -10px; border-right-color: transparent; }
  .vcm-ticket::after  { right: -10px; border-left-color: transparent; }

  .vcm-ticket-label {
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #a09890; text-align: center; margin-bottom: 14px; font-weight: 500;
  }

  /* digits */
  .vcm-digits {
    display: flex; justify-content: center; gap: 6px; margin-bottom: 14px;
  }
  .vcm-digit {
    width: 44px; height: 50px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.55rem; font-weight: 700;
  }
  .vcm-alpha {
    background: #0e0c0a; color: #c9a84c;
    border: 1px solid rgba(201,168,76,0.3);
    box-shadow: 0 2px 8px rgba(14,12,10,0.18);
  }
  .vcm-num {
    background: #faf7f2; color: #0e0c0a;
    border: 1.5px solid rgba(201,168,76,0.22);
  }

  /* benefit badge */
  .vcm-benefit {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    background: rgba(45,106,79,0.08);
    border: 1px solid rgba(45,106,79,0.2);
    border-radius: 100px;
    padding: 5px 14px;
    font-size: 12px; color: #2d6a4f; font-weight: 500;
    width: fit-content; margin: 0 auto;
  }
  .vcm-check { font-size: 13px; }

  /* buttons */
  .vcm-copy-btn {
    width: 100%;
    padding: 13px;
    background: #0e0c0a; color: #fff;
    border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500;
    cursor: pointer; transition: background 0.22s, color 0.22s;
    margin-bottom: 10px;
    letter-spacing: 0.02em;
  }
  .vcm-copy-btn:hover   { background: #c9a84c; color: #0e0c0a; }
  .vcm-copy-btn.vcm-copied { background: #2d6a4f; }

  .vcm-done-btn {
    width: 100%;
    padding: 11px;
    background: none; color: #a09890;
    border: 1px solid rgba(201,168,76,0.22);
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; cursor: pointer; transition: all 0.2s;
  }
  .vcm-done-btn:hover { border-color: #c9a84c; color: #7a7265; }

  .vcm-once-note {
    font-size: 11.5px; color: #b0a898;
    text-align: center; margin-top: 14px; line-height: 1.5;
  }

  @media (max-width: 480px) {
    .vcm-modal { padding: 32px 20px 24px; }
    .vcm-digit { width: 38px; height: 44px; font-size: 1.3rem; }
  }
`;