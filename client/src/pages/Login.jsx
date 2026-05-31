import { useState } from "react";
import API from "../services/api";
import { GoogleLogin } from "@react-oauth/google";
import Logo from "../components/Logo";

// ─────────────────────────────────────────────────────────────
// PRIVACY & TERMS POPUP
// ─────────────────────────────────────────────────────────────
function LegalPopup({ type, onClose }) {
  const isPrivacy = type === "privacy";

  const privacyContent = {
    title: "Privacy Policy",
    lastUpdated: "January 1, 2025",
    sections: [
      {
        heading: "Information We Collect",
        body: `We collect information you provide directly to us, such as when you create an account, make a booking, or contact us for support. This includes your name, email address, phone number, payment information, and any other information you choose to provide.\n\nWe also automatically collect certain information about your device and how you interact with our services, including IP address, browser type, operating system, referring URLs, and pages visited.`,
      },
      {
        heading: "How We Use Your Information",
        body: `We use the information we collect to provide, maintain, and improve our services; process transactions and send related information; send promotional communications (with your consent); respond to comments and questions; and monitor and analyze usage patterns.\n\nWe do not sell, trade, or rent your personal information to third parties. We may share information with trusted service providers who assist us in operating our platform, subject to confidentiality agreements.`,
      },
      {
        heading: "Vendor Data",
        body: `If you register as a vendor, your business name, profile, and contact information may be visible to clients on our platform. Your vendor code is unique to you and may be shared with clients to provide them with brokerage-free transactions.`,
      },
      {
        heading: "Cookies & Tracking",
        body: `We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some portions of our service may not function properly.`,
      },
      {
        heading: "Data Security",
        body: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`,
      },
      {
        heading: "Your Rights",
        body: `You have the right to access, correct, or delete your personal data at any time. You may also request that we restrict processing of your data or object to its use. To exercise these rights, please contact us through your account settings or our support channels.`,
      },
      {
        heading: "Contact Us",
        body: `If you have any questions about this Privacy Policy, please contact us at privacy@evencers.com or through the support section of your account dashboard.`,
      },
    ],
  };

  const termsContent = {
    title: "Terms of Service",
    lastUpdated: "January 1, 2025",
    sections: [
      {
        heading: "Acceptance of Terms",
        body: `By accessing or using Evencers, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our platform. We reserve the right to update these terms at any time, and continued use of the platform constitutes acceptance of any changes.`,
      },
      {
        heading: "Use of the Platform",
        body: `Evencers is an event planning marketplace connecting clients with verified vendors. You agree to use the platform only for lawful purposes and in a manner that does not infringe the rights of others. You must be at least 18 years old to create an account and use our services.`,
      },
      {
        heading: "Vendor Responsibilities",
        body: `Vendors are responsible for the accuracy of their listings, pricing, and availability. Vendors must honor confirmed bookings and maintain professional standards of service. Evencers reserves the right to remove vendors who receive consistently poor ratings or violate platform policies.\n\nVendor codes offering zero-brokerage are valid for a client's first transaction with that vendor only and cannot be combined with other offers.`,
      },
      {
        heading: "Client Responsibilities",
        body: `Clients agree to provide accurate information when making bookings and to pay for confirmed services as agreed. Cancellations must be made within the timeframe specified in each vendor's cancellation policy. Evencers is not liable for disputes arising from client-vendor interactions beyond our dispute resolution process.`,
      },
      {
        heading: "Payments & Fees",
        body: `All payments are processed securely through our platform. Evencers charges a service fee on transactions, which is displayed clearly before booking confirmation. Vendor codes may waive this fee for eligible first-time transactions. Refunds are subject to the vendor's individual cancellation policy.`,
      },
      {
        heading: "Intellectual Property",
        body: `All content on Evencers, including logos, text, graphics, and software, is the property of Evencers or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.`,
      },
      {
        heading: "Limitation of Liability",
        body: `Evencers acts as a marketplace intermediary and is not a party to contracts between clients and vendors. We are not liable for the quality, safety, or legality of services offered by vendors. Our total liability for any claim shall not exceed the fees paid by you to Evencers in the 12 months preceding the claim.`,
      },
      {
        heading: "Governing Law",
        body: `These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or use of the platform shall be subject to the exclusive jurisdiction of the competent courts in our jurisdiction.`,
      },
    ],
  };

  const content = isPrivacy ? privacyContent : termsContent;

  return (
    <>
      <style>{legalStyles}</style>
      <div className="lp-overlay" role="dialog" aria-modal="true" aria-labelledby="lp-title" onClick={(e) => { if (e.target.classList.contains("lp-overlay")) onClose(); }}>
        <div className="lp-modal">
          <div className="lp-orb lp-orb-1" aria-hidden="true" />
          <div className="lp-orb lp-orb-2" aria-hidden="true" />

          <div className="lp-header">
            <div className="lp-header-left">
              <span className="lp-badge">{isPrivacy ? "🔒" : "📋"}</span>
              <div>
                <p className="lp-eyebrow">{isPrivacy ? "Legal" : "Agreement"}</p>
                <h2 id="lp-title" className="lp-title">{content.title}</h2>
                <p className="lp-updated">Last updated: {content.lastUpdated}</p>
              </div>
            </div>
            <button className="lp-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="lp-body">
            {content.sections.map((section, i) => (
              <div key={i} className="lp-section">
                <h3 className="lp-section-heading">
                  <span className="lp-section-num">{String(i + 1).padStart(2, "0")}</span>
                  {section.heading}
                </h3>
                {section.body.split("\n\n").map((para, j) => (
                  <p key={j} className="lp-para">{para}</p>
                ))}
              </div>
            ))}
          </div>

          <div className="lp-footer">
            <p className="lp-footer-note">
              Questions? Contact us at <a href="mailto:admineventify2005@gmail.com" className="lp-footer-link">admineventify2005@gmail.com</a>
            </p>
            <button className="lp-close-btn" onClick={onClose}>
              I Understand
              <span className="lp-close-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const legalStyles = `
  .lp-overlay {
    position: fixed; inset: 0; z-index: 9100;
    background: rgba(14,12,10,0.68);
    backdrop-filter: blur(14px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: lpFadeIn 0.25s ease both;
  }
  @keyframes lpFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .lp-modal {
    position: relative;
    background: #faf7f2;
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 20px;
    width: min(640px, 96vw);
    max-height: 82vh;
    display: flex; flex-direction: column;
    overflow: hidden;
    box-shadow: 0 40px 100px rgba(14,12,10,0.28), 0 2px 0 rgba(255,255,255,0.55) inset;
    animation: lpPopUp 0.35s cubic-bezier(0.34,1.18,0.64,1) both;
  }
  @keyframes lpPopUp {
    from { opacity: 0; transform: translateY(20px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .lp-orb { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
  .lp-orb-1 { width: 300px; height: 300px; top: -120px; right: -80px; background: radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 70%); }
  .lp-orb-2 { width: 200px; height: 200px; bottom: -60px; left: -60px; background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%); }

  .lp-header {
    position: relative; z-index: 1;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    padding: 28px 32px 20px;
    border-bottom: 1px solid rgba(201,168,76,0.15);
    background: rgba(255,255,255,0.6);
  }
  .lp-header-left { display: flex; align-items: flex-start; gap: 16px; }
  .lp-badge {
    width: 44px; height: 44px; flex-shrink: 0;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; margin-top: 2px;
  }
  .lp-eyebrow { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #c9a84c; margin-bottom: 4px; font-family: 'DM Sans', sans-serif; }
  .lp-title { font-family: 'Cormorant Garamond', serif; font-size: 1.55rem; font-weight: 600; color: #0e0c0a; line-height: 1.1; margin-bottom: 4px; }
  .lp-updated { font-size: 11px; color: #b0a89e; font-family: 'DM Sans', sans-serif; }
  .lp-close {
    flex-shrink: 0;
    width: 32px; height: 32px;
    background: rgba(14,12,10,0.06);
    border: 1px solid rgba(14,12,10,0.1);
    border-radius: 8px;
    font-size: 12px; color: #7a7265;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.18s ease; margin-top: 4px;
    font-family: sans-serif;
  }
  .lp-close:hover { background: rgba(14,12,10,0.1); color: #0e0c0a; }

  .lp-body {
    position: relative; z-index: 1;
    flex: 1; overflow-y: auto; padding: 24px 32px;
    scrollbar-width: thin; scrollbar-color: rgba(201,168,76,0.25) transparent;
  }
  .lp-body::-webkit-scrollbar { width: 4px; }
  .lp-body::-webkit-scrollbar-track { background: transparent; }
  .lp-body::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 4px; }

  .lp-section { margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid rgba(201,168,76,0.1); }
  .lp-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .lp-section-heading {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; font-weight: 600; color: #0e0c0a;
    margin-bottom: 12px; line-height: 1.2;
  }
  .lp-section-num {
    font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500;
    color: #c9a84c; letter-spacing: 0.1em;
    background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2);
    border-radius: 4px; padding: 2px 6px; flex-shrink: 0;
  }
  .lp-para { font-size: 13px; color: #5a5249; line-height: 1.75; margin-bottom: 10px; font-family: 'DM Sans', sans-serif; }
  .lp-para:last-child { margin-bottom: 0; }

  .lp-footer {
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 18px 32px;
    border-top: 1px solid rgba(201,168,76,0.15);
    background: rgba(255,255,255,0.7);
    flex-wrap: wrap;
  }
  .lp-footer-note { font-size: 11.5px; color: #7a7265; font-family: 'DM Sans', sans-serif; }
  .lp-footer-link { color: #c9a84c; text-decoration: none; font-weight: 500; }
  .lp-footer-link:hover { text-decoration: underline; }
  .lp-close-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 11px 24px;
    background: #0e0c0a; color: #ffffff;
    border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; letter-spacing: 0.04em;
    cursor: pointer; transition: all 0.22s ease; white-space: nowrap;
  }
  .lp-close-btn:hover { background: #c9a84c; color: #0e0c0a; box-shadow: 0 6px 20px rgba(201,168,76,0.3); transform: translateY(-1px); }
  .lp-close-arrow { font-size: 14px; transition: transform 0.2s; }
  .lp-close-btn:hover .lp-close-arrow { transform: translateX(3px); }

  @media (max-width: 520px) {
    .lp-header { padding: 20px 20px 16px; }
    .lp-body { padding: 18px 20px; }
    .lp-footer { padding: 14px 20px; flex-direction: column; align-items: stretch; }
    .lp-close-btn { justify-content: center; }
  }
`;

// ─────────────────────────────────────────────────────────────
// VENDOR CODE POPUP
// Shows ONCE ever (first login only) — uses localStorage flag.
// ─────────────────────────────────────────────────────────────
function VendorCodePopup({ code, name, onContinue }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — silently ignore
    }
  };

  const chars = code ? code.split("") : [];

  return (
    <>
      <style>{popupStyles}</style>
      <div className="vc-overlay" role="dialog" aria-modal="true" aria-labelledby="vc-title">
        <div className="vc-modal">

          <div className="vc-orb vc-orb-1" aria-hidden="true" />
          <div className="vc-orb vc-orb-2" aria-hidden="true" />

          <div className="vc-icon-wrap" aria-hidden="true">
            <div className="vc-icon-ring" />
            <span className="vc-icon-inner">◈</span>
          </div>

          <p className="vc-eyebrow">Vendor Identity</p>
          <h2 id="vc-title" className="vc-title">Your Vendor Code</h2>
          <p className="vc-sub">
            {name ? (
              <>Welcome, <strong>{name}</strong>! Your account is live.</>
            ) : (
              "Your vendor account is now active."
            )}
            <br />Share this code with clients — they get{" "}
            <strong>zero brokerage</strong> on their first transaction with you.
          </p>

          <div className="vc-code-row" aria-label={`Your vendor code is ${code}`}>
            {chars.map((ch, i) => (
              <div
                key={i}
                className={`vc-digit ${isNaN(ch) ? "vc-digit-alpha" : "vc-digit-num"}`}
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              >
                {ch}
              </div>
            ))}
          </div>

          <button
            className={`vc-copy-btn ${copied ? "vc-copied" : ""}`}
            onClick={handleCopy}
            aria-live="polite"
          >
            {copied ? (
              <><span className="vc-copy-icon">✓</span> Copied!</>
            ) : (
              <><span className="vc-copy-icon">⎘</span> Copy Code</>
            )}
          </button>

          <div className="vc-note">
            <span className="vc-note-icon" aria-hidden="true">ℹ</span>
            <p>
              Share this code freely — clients enter it at checkout for free brokerage.
              Find it anytime in your Vendor Dashboard under <em>My Coupon</em>.
            </p>
          </div>

          <button className="vc-continue-btn" onClick={onContinue}>
            Got it — Go to Dashboard
            <span className="vc-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </>
  );
}

const popupStyles = `
  .vc-overlay {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(14,12,10,0.72);
    backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: vcFadeIn 0.3s ease both;
  }
  @keyframes vcFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .vc-modal {
    position: relative;
    background: #faf7f2;
    border: 1px solid rgba(201,168,76,0.28);
    border-radius: 24px;
    padding: 48px 40px 40px;
    width: min(460px, 96vw);
    text-align: center;
    overflow: hidden;
    box-shadow:
      0 32px 80px rgba(14,12,10,0.22),
      0 2px 0 rgba(255,255,255,0.6) inset;
    animation: vcPopUp 0.38s cubic-bezier(0.34,1.2,0.64,1) both;
  }
  @keyframes vcPopUp {
    from { opacity: 0; transform: translateY(24px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .vc-orb { position: absolute; border-radius: 50%; pointer-events: none; }
  .vc-orb-1 {
    width: 280px; height: 280px;
    top: -120px; right: -80px;
    background: radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%);
  }
  .vc-orb-2 {
    width: 200px; height: 200px;
    bottom: -80px; left: -60px;
    background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
  }

  .vc-icon-wrap {
    position: relative;
    width: 68px; height: 68px;
    margin: 0 auto 24px;
    display: flex; align-items: center; justify-content: center;
  }
  .vc-icon-ring {
    position: absolute; inset: 0;
    border-radius: 50%;
    border: 1.5px solid rgba(201,168,76,0.35);
    animation: vcRingPulse 3s ease-in-out infinite;
  }
  @keyframes vcRingPulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50%       { transform: scale(1.08); opacity: 1; }
  }
  .vc-icon-inner {
    font-size: 1.8rem; color: #c9a84c;
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: center;
    width: 52px; height: 52px;
    background: rgba(201,168,76,0.1);
    border-radius: 50%;
    border: 1px solid rgba(201,168,76,0.25);
  }

  .vc-eyebrow {
    font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
    color: #c9a84c; margin-bottom: 8px;
    font-family: 'DM Sans', sans-serif;
  }
  .vc-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem; font-weight: 600; color: #0e0c0a;
    margin-bottom: 12px; line-height: 1.1;
  }
  .vc-sub {
    font-size: 13px; color: #7a7265; line-height: 1.7;
    margin-bottom: 32px; font-family: 'DM Sans', sans-serif;
  }
  .vc-sub strong { color: #0e0c0a; font-weight: 500; }

  .vc-code-row {
    display: flex; justify-content: center; gap: 8px;
    margin-bottom: 20px;
  }
  .vc-digit {
    width: 52px; height: 60px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem; font-weight: 600;
    animation: vcDigitPop 0.45s cubic-bezier(0.34,1.3,0.64,1) both;
    opacity: 0;
    animation-fill-mode: forwards;
  }
  @keyframes vcDigitPop {
    from { opacity: 0; transform: translateY(10px) scale(0.85); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .vc-digit-alpha {
    background: #0e0c0a; color: #c9a84c;
    border: 1px solid rgba(201,168,76,0.3);
    box-shadow: 0 4px 16px rgba(14,12,10,0.18), inset 0 1px 0 rgba(255,255,255,0.05);
  }
  .vc-digit-num {
    background: #ffffff; color: #0e0c0a;
    border: 1.5px solid rgba(201,168,76,0.3);
    box-shadow: 0 2px 10px rgba(14,12,10,0.08);
  }

  .vc-copy-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 22px;
    background: transparent;
    border: 1px solid rgba(201,168,76,0.35);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; color: #7a7265;
    cursor: pointer;
    transition: all 0.22s ease;
    margin-bottom: 28px;
  }
  .vc-copy-btn:hover {
    border-color: #c9a84c; color: #c9a84c;
    background: rgba(201,168,76,0.06);
  }
  .vc-copy-btn.vc-copied {
    border-color: #2d6a4f; color: #2d6a4f;
    background: rgba(45,106,79,0.06);
  }
  .vc-copy-icon { font-size: 14px; line-height: 1; }

  .vc-note {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(201,168,76,0.06);
    border: 1px solid rgba(201,168,76,0.18);
    border-radius: 10px;
    padding: 12px 16px;
    text-align: left;
    margin-bottom: 28px;
  }
  .vc-note-icon {
    font-size: 14px; color: #c9a84c; flex-shrink: 0; margin-top: 1px;
  }
  .vc-note p {
    font-size: 12px; color: #7a7265; line-height: 1.65;
    font-family: 'DM Sans', sans-serif;
  }
  .vc-note em { font-style: italic; color: #0e0c0a; }

  .vc-continue-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 15px 24px;
    background: #0e0c0a; color: #ffffff;
    border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; letter-spacing: 0.03em;
    cursor: pointer;
    transition: all 0.24s ease;
  }
  .vc-continue-btn:hover {
    background: #c9a84c; color: #0e0c0a;
    box-shadow: 0 8px 28px rgba(201,168,76,0.32);
    transform: translateY(-1px);
  }
  .vc-arrow { font-size: 16px; transition: transform 0.2s; }
  .vc-continue-btn:hover .vc-arrow { transform: translateX(4px); }

  @media (max-width: 480px) {
    .vc-modal { padding: 36px 24px 32px; }
    .vc-digit { width: 44px; height: 54px; font-size: 1.6rem; }
    .vc-code-row { gap: 6px; }
  }
`;

// ─────────────────────────────────────────────────────────────
// MAIN LOGIN PAGE
// ─────────────────────────────────────────────────────────────
export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Vendor code popup state
  const [vendorCodePopup, setVendorCodePopup] = useState(null);

  // Legal popup state
  const [legalPopup, setLegalPopup] = useState(null); // "privacy" | "terms" | null

  // ── Redirect logic ──────────────────────────────────────────
  const redirectAfterLogin = (user) => {
    if (user.role === "vendor" && user.hasSeenWelcome === false) {
      window.location.href = "/vendor/welcome";
    } else if (user.role === "vendor") {
      window.location.href = "/vendor-dashboard";
    } else {
      window.location.href = "/";
    }
  };

  // ── After storing token, decide whether to show vendor code popup ──
  const handleLoginSuccess = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    if (user.role === "vendor" && user.vendorCode && !user.hasSeenWelcome) {
      setVendorCodePopup({ code: user.vendorCode, name: user.name, user });
    } else {
      setSuccess(true);
      setTimeout(() => redirectAfterLogin(user), 1200);
    }
  };

  // ── Dismiss popup: mark as seen permanently, call backend ──
  const handlePopupContinue = async () => {
    localStorage.setItem("vendorCodeSeen", "1");
    const updatedUser = { ...vendorCodePopup.user, hasSeenWelcome: true };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    try {
      await API.post(
        "/auth/vendor/seen-welcome",
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
    } catch (e) {}
    setVendorCodePopup(null);
    redirectAfterLogin(vendorCodePopup.user);
  };

  const handleSubmit = async () => {
    if (!data.email || !data.password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", data);
      handleLoginSuccess(res.data.user, res.data.token);
    } catch (err) {
      setError(err?.response?.data?.msg || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <>
      <style>{styles}</style>

      {/* ── Legal Popup ── */}
      {legalPopup && (
        <LegalPopup type={legalPopup} onClose={() => setLegalPopup(null)} />
      )}

      {/* ── Vendor Code Popup (first login only) ── */}
      {vendorCodePopup && (
        <VendorCodePopup
          code={vendorCodePopup.code}
          name={vendorCodePopup.name}
          onContinue={handlePopupContinue}
        />
      )}

      <div className="lg-root">

        {/* LEFT PANEL */}
        <div className="lg-left">
          <div className="lg-left-inner">
            <div className="lg-logo"><Logo /> Evencers</div>
            <div className="lg-quote-block">
              <span className="lg-quote-mark">"</span>
              <p className="lg-quote">The details are not the details.<br />They make the design.</p>
              <span className="lg-quote-author">— Charles Eames</span>
            </div>
            <div className="lg-stats">
              {[
                { num: "12K+", label: "Happy Clients" },
                { num: "200+",  label: "Verified Vendors" },
                { num: "4.9★", label: "Avg. Rating" },
              ].map((s, i) => (
                <div key={i} className="lg-stat">
                  <span className="lg-stat-num">{s.num}</span>
                  <span className="lg-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg-orb lg-orb1" />
          <div className="lg-orb lg-orb2" />
          <div className="lg-orb lg-orb3" />
        </div>

        {/* RIGHT PANEL */}
        <div className="lg-right">
          <div className="lg-mobile-top">
            <div className="lg-mobile-logo"><Logo /> Evencers</div>
          </div>

          <div className="lg-card-wrap">
            <div className="lg-card">
              {success ? (
                <div className="lg-success">
                  <div className="lg-success-ring"><span>✓</span></div>
                  <h3>Welcome back!</h3>
                  <p>Login successful. Redirecting you now…</p>
                  <div className="lg-progress-bar"><div className="lg-progress-fill" /></div>
                </div>
              ) : (
                <>
                  <div className="lg-card-header">
                    <p className="lg-eyebrow">Welcome back</p>
                    <h1>Sign in to<br />your account</h1>
                    <p className="lg-sub-text">
                      Don't have an account?{" "}
                      <a href="/register" className="lg-link">Create one →</a>
                    </p>
                  </div>

                  <div className="lg-fields" onKeyDown={handleKeyDown}>
                    <div className="lg-field">
                      <label>Email Address</label>
                      <div className="lg-input-wrap">
                        <span className="lg-icon">✉</span>
                        <input
                          type="email"
                          placeholder="jane@example.com"
                          value={data.email}
                          onChange={(e) => setData({ ...data, email: e.target.value })}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="lg-field">
                      <div className="lg-label-row">
                        <label>Password</label>
                        <a href="/forgot-password" className="lg-link lg-forgot">Forgot password?</a>
                      </div>
                      <div className="lg-input-wrap">
                        <span className="lg-icon">◆</span>
                        <input
                          type={showPass ? "text" : "password"}
                          placeholder="Enter your password"
                          value={data.password}
                          onChange={(e) => setData({ ...data, password: e.target.value })}
                          autoComplete="current-password"
                        />
                        <button className="lg-eye" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                          {showPass ? "🙈" : "👁"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="lg-error"><span>⚠</span> {error}</div>
                  )}

                  <button
                    className={`lg-submit ${loading ? "loading" : ""}`}
                    onClick={handleSubmit}
                    disabled={loading || success}
                  >
                    {loading ? <span className="lg-spinner" /> : "Sign In →"}
                  </button>

                  <div className="lg-divider"><span>or continue with</span></div>

                  <div className="lg-socials">
                    <div className="lg-google-wrap">
                      <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                          try {
                            const res = await API.post("/auth/google", { token: credentialResponse.credential });
                            handleLoginSuccess(res.data.user, res.data.token);
                          } catch (err) {
                            console.error("Google login error:", err);
                            setError("Google login failed");
                          }
                        }}
                        onError={() => setError("Google login failed")}
                        width="100%"
                      />
                    </div>
                  </div>

                  <p className="lg-terms">
                    Protected by reCAPTCHA ·{" "}
                    <button
                      type="button"
                      className="lg-link lg-legal-btn"
                      onClick={() => setLegalPopup("privacy")}
                    >
                      Privacy
                    </button>{" "}·{" "}
                    <button
                      type="button"
                      className="lg-link lg-legal-btn"
                      onClick={() => setLegalPopup("terms")}
                    >
                      Terms
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --muted: #7a7265; --border: rgba(201,168,76,0.22); --surface: #faf7f2;
    --error: #b85c5c; --success: #2d6a4f; --white: #ffffff;
  }
  .lg-root { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
  @media (max-width: 780px) { .lg-root { grid-template-columns: 1fr; } .lg-left { display: none; } }
  .lg-left { background: var(--ink); position: relative; overflow: hidden; display: flex; align-items: center; padding: 60px 56px; }
  .lg-left-inner { position: relative; z-index: 2; width: 100%; }
  .lg-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--gold); letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 80px; display: flex; align-items: center; gap: 8px; }
  .lg-quote-block { margin-bottom: 72px; }
  .lg-quote-mark { font-family: 'Cormorant Garamond', serif; font-size: 5rem; color: var(--gold); opacity: 0.4; line-height: 0.6; display: block; margin-bottom: 16px; }
  .lg-quote { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.6rem, 2.8vw, 2.2rem); font-weight: 300; font-style: italic; color: var(--cream); line-height: 1.35; margin-bottom: 16px; }
  .lg-quote-author { font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); }
  .lg-stats { display: flex; gap: 0; border-top: 1px solid rgba(201,168,76,0.15); padding-top: 32px; }
  .lg-stat { flex: 1; display: flex; flex-direction: column; gap: 4px; padding-right: 24px; border-right: 1px solid rgba(201,168,76,0.15); }
  .lg-stat:last-child { border-right: none; padding-right: 0; padding-left: 24px; }
  .lg-stat:not(:first-child):not(:last-child) { padding-left: 24px; }
  .lg-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: var(--gold); }
  .lg-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; }
  .lg-orb { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.14; pointer-events: none; }
  .lg-orb1 { width: 380px; height: 380px; background: var(--gold); top: -80px; right: -100px; }
  .lg-orb2 { width: 280px; height: 280px; background: #7b5ea7; bottom: -60px; left: -40px; }
  .lg-orb3 { width: 180px; height: 180px; background: var(--gold); bottom: 120px; right: 40px; opacity: 0.07; }
  .lg-right { background: var(--cream); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 0; }
  .lg-mobile-top { display: none; width: 100%; padding: 20px 24px 0; margin-bottom: 4px; }
  .lg-mobile-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; font-weight: 600; color: var(--ink); letter-spacing: 0.14em; text-transform: uppercase; display: flex; align-items: center; gap: 7px; }
  @media (max-width: 780px) { .lg-mobile-top { display: flex; } .lg-right { justify-content: flex-start; padding-top: 0; } }
  .lg-card-wrap { width: 100%; display: flex; align-items: center; justify-content: center; padding: 32px 20px 40px; flex: 1; }
  @media (max-width: 780px) { .lg-card-wrap { padding: 16px 16px 40px; align-items: flex-start; } }
  .lg-card { width: 100%; max-width: 420px; background: var(--white); border: 1px solid var(--border); border-radius: 16px; padding: 40px 36px; box-shadow: 0 12px 48px rgba(14,12,10,0.07); animation: fadeUp 0.5s ease both; }
  @media (max-width: 480px) { .lg-card { padding: 28px 20px 24px; border-radius: 14px; } }
  .lg-card-header { margin-bottom: 28px; }
  .lg-eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
  .lg-card-header h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.7rem, 5vw, 2.1rem); font-weight: 600; color: var(--ink); line-height: 1.15; margin-bottom: 10px; }
  .lg-sub-text { font-size: 13px; color: var(--muted); }
  .lg-fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 18px; }
  .lg-field { display: flex; flex-direction: column; gap: 7px; }
  .lg-label-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px; }
  .lg-field label { font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted); }
  .lg-forgot { font-size: 11px !important; }
  .lg-input-wrap { display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 7px; padding: 12px 13px; background: var(--surface); transition: border-color 0.2s, box-shadow 0.2s; }
  .lg-input-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); background: var(--white); }
  .lg-icon { font-size: 13px; color: var(--gold); opacity: 0.8; flex-shrink: 0; }
  .lg-input-wrap input { border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); outline: none; width: 100%; min-width: 0; }
  .lg-input-wrap input::placeholder { color: #bbb4a8; }
  .lg-eye { background: none; border: none; cursor: pointer; font-size: 14px; padding: 0; line-height: 1; flex-shrink: 0; opacity: 0.7; transition: opacity 0.15s; }
  .lg-eye:hover { opacity: 1; }
  .lg-error { font-size: 12.5px; color: var(--error); background: rgba(184,92,92,0.07); border: 1px solid rgba(184,92,92,0.2); border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
  .lg-submit { width: 100%; padding: 14px; background: var(--ink); color: var(--white); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.05em; cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; min-height: 48px; }
  .lg-submit:hover:not(:disabled) { background: var(--gold); color: var(--ink); box-shadow: 0 6px 24px rgba(201,168,76,0.3); transform: translateY(-1px); }
  .lg-submit.loading { opacity: 0.65; pointer-events: none; }
  .lg-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  .lg-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .lg-divider::before, .lg-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .lg-divider span { font-size: 11px; color: var(--muted); white-space: nowrap; letter-spacing: 0.08em; }
  .lg-socials { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
  .lg-google-wrap { width: 100%; overflow: hidden; border-radius: 7px; }
  .lg-google-wrap > div, .lg-google-wrap iframe, .lg-google-wrap > div > div { width: 100% !important; }
  .lg-terms { font-size: 11px; color: var(--muted); text-align: center; line-height: 1.7; }
  .lg-link { color: var(--gold); text-decoration: none; font-weight: 500; }
  .lg-link:hover { text-decoration: underline; }
  .lg-legal-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 11px; }
  .lg-success { text-align: center; padding: 16px 0; animation: fadeUp 0.4s ease both; }
  .lg-success-ring { width: 64px; height: 64px; border: 2px solid rgba(45,106,79,0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; color: var(--success); margin: 0 auto 20px; background: rgba(45,106,79,0.07); animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both; }
  .lg-success h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
  .lg-success p { font-size: 13.5px; color: var(--muted); margin-bottom: 28px; }
  .lg-progress-bar { height: 2px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .lg-progress-fill { height: 100%; width: 0; background: var(--gold); animation: progress 1.2s ease forwards; border-radius: 2px; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes progress { from { width: 0; } to { width: 100%; } }
`;