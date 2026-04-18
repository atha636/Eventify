import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

export default function CustomerCarePopup() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);
  const popupRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return null;
  const isVendor = user?.role === "vendor";
  

  // Stop pulsing after 6 seconds
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleGoToHelp = () => {
    setOpen(false);
    if (isVendor) {
      navigate("/customer-care/vendor");
    } else {
      navigate("/customer-care");
    }
  };

  const quickLinks = isVendor
    ? [
        { icon: "💰", label: "Payment & Earnings", q: "earnings" },
        { icon: "📅", label: "Managing Bookings", q: "bookings" },
        { icon: "⭐", label: "Profile & Visibility", q: "visibility" },
        { icon: "🛡", label: "Disputes & Support", q: "disputes" },
      ]
    : [
        { icon: "📅", label: "How to book a vendor", q: "booking" },
        { icon: "💸", label: "Cancellations & Refunds", q: "cancellation" },
        { icon: "💳", label: "Payments & Security", q: "payments" },
        { icon: "🔑", label: "Reset my password", q: "password" },
      ];

  return (
    <>
      <style>{styles}</style>
      <div className="ccp-root" ref={popupRef}>

        {/* POPUP PANEL */}
        {open && (
          <div className="ccp-panel">
            {/* Header */}
            <div className="ccp-header">
              <div className="ccp-header-left">
                <div className="ccp-avatar"><Logo /></div>
                <div>
                  <p className="ccp-name">Evencers Support</p>
                  <span className="ccp-status">
                    <span className="ccp-dot" />
                    Online · Typically replies in minutes
                  </span>
                </div>
              </div>
              <button className="ccp-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            {/* Greeting bubble */}
            <div className="ccp-body">
              <div className="ccp-bubble-wrap">
                <div className="ccp-avatar-sm"><Logo /></div>
                <div className="ccp-bubble">
                  <p>
                    Hi there{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
                    {isVendor
                      ? " Welcome to Vendor Support. How can we help your business today?"
                      : " Welcome to Evencers! How can we help you plan your perfect event?"}
                  </p>
                </div>
              </div>

              {/* Quick links */}
              <p className="ccp-ql-label">Quick topics</p>
              <div className="ccp-quick-links">
                {quickLinks.map((link, i) => (
                  <button
                    key={i}
                    className="ccp-ql-btn"
                    onClick={handleGoToHelp}
                  >
                    <span className="ccp-ql-icon">{link.icon}</span>
                    <span>{link.label}</span>
                    <span className="ccp-ql-arrow">›</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="ccp-footer">
              <button className="ccp-full-btn" onClick={handleGoToHelp}>
                {isVendor ? "Go to Vendor Help Centre →" : "Browse all help articles →"}
              </button>
              <p className="ccp-footer-note">
                Or email us at{" "}
                <a href={`mailto:${isVendor ? "vendors" : "support"}@evencers.in`} className="ccp-email-link">
                  {isVendor ? "admineventify2005" : "admineventify2005"}@gmail.com
                </a>
              </p>
            </div>
          </div>
        )}

        {/* FAB BUTTON */}
        <button
          className={`ccp-fab ${open ? "active" : ""} ${pulse ? "pulse" : ""}`}
          onClick={() => { setOpen(!open); setPulse(false); }}
          aria-label="Customer Support"
        >
          {open ? (
            <span className="ccp-fab-icon">✕</span>
          ) : (
            <>
              <span className="ccp-fab-icon">💬</span>
              <span className="ccp-fab-label">Help</span>
            </>
          )}
        </button>

        {/* Tooltip shown before first open */}
        {!open && pulse && (
          <div className="ccp-tooltip">
            Need help? Click here!
          </div>
        )}
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Cormorant+Garamond:wght@600&display=swap');

  :root {
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --muted: #7a7265;
    --border: rgba(201,168,76,0.22);
    --surface: #faf7f2;
    --white: #ffffff;
  }

  .ccp-root {
    position: fixed;
    right: max(16px, env(safe-area-inset-right));
  bottom: max(20px, env(safe-area-inset-bottom));
    z-index: 9999;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  /* ── PANEL ── */
  .ccp-panel {
     width: min(340px, calc(100vw - 32px));
  max-height: calc(100vh - 100px);   /* 🔥 IMPORTANT */
  display: flex;
  flex-direction: column;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(14,12,10,0.18), 0 4px 20px rgba(201,168,76,0.12);
  overflow: hidden;
    animation: panelUp 0.3s cubic-bezier(0.34,1.4,0.64,1) both;
  }
  @media (max-width: 400px) {
    .ccp-panel { width: calc(100vw - 40px); }
  }

  /* HEADER */
  .ccp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    background: var(--ink);
    border-bottom: 1px solid rgba(201,168,76,0.12);
  }
  .ccp-header-left { display: flex; align-items: center; gap: 12px; }
  .ccp-avatar {
    width: 38px; height: 38px;
    background: rgba(201,168,76,0.15);
    border: 1.5px solid var(--gold);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: var(--gold);
    flex-shrink: 0;
  }
  .ccp-name { font-size: 13px; font-weight: 500; color: var(--cream); margin-bottom: 3px; }
  .ccp-status {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: rgba(245,240,232,0.5);
  }
  .ccp-dot {
    width: 7px; height: 7px;
    background: #4ade80;
    border-radius: 50%;
    flex-shrink: 0;
    animation: blink 2s ease-in-out infinite;
  }
  .ccp-close {
    background: none; border: none;
    font-size: 13px; color: rgba(245,240,232,0.5);
    cursor: pointer; padding: 4px; border-radius: 4px;
    transition: color 0.2s;
  }
  .ccp-close:hover { color: var(--cream); }

  /* BODY */
  .ccp-body {
  padding: 18px;
  background: var(--surface);
  overflow-y: auto;     /* 🔥 scroll inside */
  flex: 1;
}

  .ccp-bubble-wrap {
    display: flex; align-items: flex-start; gap: 10px;
    margin-bottom: 18px;
  }
  .ccp-avatar-sm {
    width: 30px; height: 30px;
    background: var(--ink);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--gold);
    flex-shrink: 0; margin-top: 2px;
  }
  .ccp-bubble {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px 12px 12px 3px;
    padding: 12px 14px;
    flex: 1;
    animation: bubblePop 0.3s ease both;
    animation-delay: 0.1s;
    opacity: 0;
    animation-fill-mode: forwards;
  }
  .ccp-bubble p { font-size: 13px; color: var(--ink); line-height: 1.6; }

  .ccp-ql-label {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .ccp-quick-links { display: flex; flex-direction: column; gap: 7px; }
  .ccp-ql-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 14px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: var(--ink);
    cursor: pointer; text-align: left;
    transition: all 0.2s ease;
    animation: fadeSlide 0.25s ease both;
  }
  .ccp-ql-btn:nth-child(1) { animation-delay: 0.05s; }
  .ccp-ql-btn:nth-child(2) { animation-delay: 0.1s; }
  .ccp-ql-btn:nth-child(3) { animation-delay: 0.15s; }
  .ccp-ql-btn:nth-child(4) { animation-delay: 0.2s; }
  .ccp-ql-btn:hover { border-color: var(--gold); background: var(--surface); transform: translateX(3px); }
  .ccp-ql-icon { font-size: 15px; flex-shrink: 0; }
  .ccp-ql-arrow { margin-left: auto; color: var(--muted); font-size: 18px; transition: transform 0.2s; }
  .ccp-ql-btn:hover .ccp-ql-arrow { transform: translateX(3px); color: var(--gold); }

  /* FOOTER */
  .ccp-footer {
    padding: 14px 18px;
    background: var(--white);
    border-top: 1px solid var(--border);
  }
  .ccp-full-btn {
    width: 100%; padding: 12px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
    margin-bottom: 10px;
  }
  .ccp-full-btn:hover { background: var(--gold); color: var(--ink); }

  .ccp-footer-note { font-size: 11.5px; color: var(--muted); text-align: center; }
  .ccp-email-link { color: var(--gold); text-decoration: none; font-weight: 500; }
  .ccp-email-link:hover { text-decoration: underline; }

  /* ── FAB BUTTON ── */
  .ccp-fab {
    width: 56px; height: 56px;
    background: var(--ink);
    border: 2px solid rgba(201,168,76,0.3);
    border-radius: 50%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 2px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 28px rgba(14,12,10,0.25);
    position: relative;
  }
  .ccp-fab:hover {
    background: var(--gold);
    border-color: var(--gold);
    transform: scale(1.08);
    box-shadow: 0 12px 36px rgba(201,168,76,0.35);
  }
  .ccp-fab.active {
    background: var(--ink);
    border-color: var(--gold);
    transform: scale(0.95);
  }
  .ccp-fab-icon { font-size: 18px; line-height: 1; }
  .ccp-fab-label { font-size: 9px; font-weight: 500; color: var(--gold); letter-spacing: 0.05em; text-transform: uppercase; }
  .ccp-fab:hover .ccp-fab-label { color: var(--ink); }

  /* Pulse ring */
  .ccp-fab.pulse::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid var(--gold);
    animation: pulseRing 1.8s ease-out infinite;
  }

  /* TOOLTIP */
  .ccp-tooltip {
    position: absolute;
    bottom: 68px; right: 4px;
max-width: calc(100vw - 40px);
    background: var(--ink);
    color: var(--cream);
    font-size: 12px;
    padding: 8px 14px;
    border-radius: 8px;
    white-space: nowrap;
    border: 1px solid var(--border);
    animation: tooltipFade 0.3s ease both, tooltipOut 0.4s ease 4.8s forwards;
    pointer-events: none;
  }
  .ccp-tooltip::after {
    content: '';
    position: absolute;
    bottom: -6px; right: 18px;
    width: 10px; height: 10px;
    background: var(--ink);
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    transform: rotate(45deg);
  }

  /* ── ANIMATIONS ── */
  @keyframes panelUp {
    from { opacity: 0; transform: translateY(20px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes bubblePop {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseRing {
    0%   { transform: scale(1);   opacity: 0.7; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes tooltipFade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tooltipOut {
    to { opacity: 0; transform: translateY(-4px); }
  }

/* ===== GOLD SCROLLBAR ===== */
.ccp-body::-webkit-scrollbar {
  width: 6px;
}

.ccp-body::-webkit-scrollbar-track {
  background: transparent;
}

.ccp-body::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    #e8d5a3,
    #c9a84c
  );
  border-radius: 10px;
  border: 1px solid rgba(201,168,76,0.3);
}

.ccp-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    #f5e6b5,
    #d4af37
  );
}
  .ccp-body::-webkit-scrollbar-thumb {
  box-shadow: 0 0 6px rgba(201,168,76,0.4);
}

`;