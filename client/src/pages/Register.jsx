import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { GoogleLogin } from "@react-oauth/google";
import Logo from "../components/Logo";

const OTP_WINDOW_MS = 60 * 1000;
const MAX_OTP_SENDS = 3;

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
// Shows ONCE ever (first registration only) — uses localStorage flag.
// ─────────────────────────────────────────────────────────────
function VendorCodePopup({ code, name, onContinue }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
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
            Continue to Dashboard
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
    box-shadow: 0 32px 80px rgba(14,12,10,0.22), 0 2px 0 rgba(255,255,255,0.6) inset;
    animation: vcPopUp 0.38s cubic-bezier(0.34,1.2,0.64,1) both;
  }
  @keyframes vcPopUp {
    from { opacity: 0; transform: translateY(24px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .vc-orb { position: absolute; border-radius: 50%; pointer-events: none; }
  .vc-orb-1 { width: 280px; height: 280px; top: -120px; right: -80px; background: radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%); }
  .vc-orb-2 { width: 200px; height: 200px; bottom: -80px; left: -60px; background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%); }
  .vc-icon-wrap { position: relative; width: 68px; height: 68px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; }
  .vc-icon-ring { position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid rgba(201,168,76,0.35); animation: vcRingPulse 3s ease-in-out infinite; }
  @keyframes vcRingPulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.08);opacity:1} }
  .vc-icon-inner { font-size: 1.8rem; color: #c9a84c; position: relative; z-index: 1; width: 52px; height: 52px; background: rgba(201,168,76,0.1); border-radius: 50%; border: 1px solid rgba(201,168,76,0.25); display: flex; align-items: center; justify-content: center; }
  .vc-eyebrow { font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase; color: #c9a84c; margin-bottom: 8px; font-family: 'DM Sans', sans-serif; }
  .vc-title { font-family: 'Cormorant Garamond', serif; font-size: 1.9rem; font-weight: 600; color: #0e0c0a; margin-bottom: 12px; line-height: 1.1; }
  .vc-sub { font-size: 13px; color: #7a7265; line-height: 1.7; margin-bottom: 32px; font-family: 'DM Sans', sans-serif; }
  .vc-sub strong { color: #0e0c0a; font-weight: 500; }
  .vc-code-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 20px; }
  .vc-digit { width: 52px; height: 60px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 1.9rem; font-weight: 600; animation: vcDigitPop 0.45s cubic-bezier(0.34,1.3,0.64,1) both; opacity: 0; animation-fill-mode: forwards; }
  @keyframes vcDigitPop { from{opacity:0;transform:translateY(10px) scale(0.85)} to{opacity:1;transform:translateY(0) scale(1)} }
  .vc-digit-alpha { background: #0e0c0a; color: #c9a84c; border: 1px solid rgba(201,168,76,0.3); box-shadow: 0 4px 16px rgba(14,12,10,0.18), inset 0 1px 0 rgba(255,255,255,0.05); }
  .vc-digit-num { background: #ffffff; color: #0e0c0a; border: 1.5px solid rgba(201,168,76,0.3); box-shadow: 0 2px 10px rgba(14,12,10,0.08); }
  .vc-copy-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 22px; background: transparent; border: 1px solid rgba(201,168,76,0.35); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #7a7265; cursor: pointer; transition: all 0.22s ease; margin-bottom: 28px; }
  .vc-copy-btn:hover { border-color: #c9a84c; color: #c9a84c; background: rgba(201,168,76,0.06); }
  .vc-copy-btn.vc-copied { border-color: #2d6a4f; color: #2d6a4f; background: rgba(45,106,79,0.06); }
  .vc-copy-icon { font-size: 14px; line-height: 1; }
  .vc-note { display: flex; align-items: flex-start; gap: 10px; background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.18); border-radius: 10px; padding: 12px 16px; text-align: left; margin-bottom: 28px; }
  .vc-note-icon { font-size: 14px; color: #c9a84c; flex-shrink: 0; margin-top: 1px; }
  .vc-note p { font-size: 12px; color: #7a7265; line-height: 1.65; font-family: 'DM Sans', sans-serif; }
  .vc-note em { font-style: italic; color: #0e0c0a; }
  .vc-continue-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 15px 24px; background: #0e0c0a; color: #ffffff; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.03em; cursor: pointer; transition: all 0.24s ease; }
  .vc-continue-btn:hover { background: #c9a84c; color: #0e0c0a; box-shadow: 0 8px 28px rgba(201,168,76,0.32); transform: translateY(-1px); }
  .vc-arrow { font-size: 16px; transition: transform 0.2s; }
  .vc-continue-btn:hover .vc-arrow { transform: translateX(4px); }
  @media (max-width: 480px) {
    .vc-modal { padding: 36px 24px 32px; }
    .vc-digit { width: 44px; height: 54px; font-size: 1.6rem; }
    .vc-code-row { gap: 6px; }
  }
`;

// ── Full-screen Google sign-in loading overlay ──
function GoogleLoadingOverlay({ name }) {
  return (
    <div className="gl-overlay">
      <div className="gl-card">
        <div className="gl-icon-ring">
          <div className="gl-spinner-ring" />
          <span className="gl-g-letter">G</span>
        </div>
        <h3 className="gl-title">Signing you in…</h3>
        {name && <p className="gl-name">Welcome, {name}</p>}
        <p className="gl-sub">Setting up your account, just a moment.</p>
        <div className="gl-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const [data, setData] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("register");
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [otpSendCount, setOtpSendCount] = useState(0);
  const [windowExpiry, setWindowExpiry] = useState(null);
  const [windowTimer, setWindowTimer] = useState(0);
  const [maxReached, setMaxReached] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleUserName, setGoogleUserName] = useState("");

  // Vendor code popup state
  const [vendorCodePopup, setVendorCodePopup] = useState(null);

  // Legal popup state
  const [legalPopup, setLegalPopup] = useState(null); // "privacy" | "terms" | null

  const otpRefs = useRef([]);

  // ── Shared redirect helper ──
  const redirectAfterAuth = (user) => {
    if (user.role === "vendor" && user.hasSeenWelcome === false) {
      window.location.href = "/vendor/welcome";
    } else if (user.role === "vendor") {
      window.location.href = "/vendor-dashboard";
    } else {
      window.location.href = "/";
    }
  };

  // ── After auth: show vendor code popup for NEW vendors only ──
  const handleAuthSuccess = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    if (user.role === "vendor" && user.vendorCode && !user.hasSeenWelcome) {
      setGoogleLoading(false);
      setVendorCodePopup({ code: user.vendorCode, name: user.name, user });
    } else {
      redirectAfterAuth(user);
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
    } catch (e) {
      // non-fatal
    }

    setVendorCodePopup(null);
    redirectAfterAuth(vendorCodePopup.user);
  };

  // ── Restore state from localStorage ──
  useEffect(() => {
    const savedStep         = localStorage.getItem("otp_step");
    const savedEmail        = localStorage.getItem("otp_email");
    const savedExpiry       = localStorage.getItem("otp_resend_expiry");
    const savedCount        = parseInt(localStorage.getItem("otp_send_count") || "0", 10);
    const savedWindowExpiry = localStorage.getItem("otp_window_expiry");

    if (savedStep === "otp" && savedEmail) {
      setStep("otp");
      setData((prev) => ({ ...prev, email: savedEmail }));
      setOtpSendCount(savedCount);

      const now = Date.now();
      if (savedWindowExpiry) {
        const winExp = parseInt(savedWindowExpiry, 10);
        if (now < winExp) {
          setWindowExpiry(winExp);
          if (savedCount >= MAX_OTP_SENDS) setMaxReached(true);
        } else {
          localStorage.setItem("otp_send_count", "0");
          localStorage.removeItem("otp_window_expiry");
          setOtpSendCount(0); setMaxReached(false);
        }
      }
      if (savedExpiry) {
        const remaining = Math.ceil((parseInt(savedExpiry, 10) - now) / 1000);
        if (remaining > 0) { setTimer(remaining); setCanResend(false); }
        else { setCanResend(true); setTimer(0); }
      }
    }
  }, []);

  // ── 30s resend countdown ──
  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, step]);

  // ── 1-min window countdown ──
  useEffect(() => {
    if (!windowExpiry) return;
    const tick = () => {
      const remaining = Math.ceil((windowExpiry - Date.now()) / 1000);
      if (remaining <= 0) {
        setWindowTimer(0); setWindowExpiry(null); setMaxReached(false);
        setOtpSendCount(0); setCanResend(true);
        localStorage.setItem("otp_send_count", "0");
        localStorage.removeItem("otp_window_expiry");
      } else { setWindowTimer(remaining); }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [windowExpiry]);

  // ── Focus first OTP input ──
  useEffect(() => {
    if (step === "otp") setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, [step]);

  // ── Send OTP / Register ──
  const sendOtp = async (isResend = false) => {
    if (!data.name || !data.email || !data.password) {
      setError("Please fill in all fields."); return;
    }
    setError(""); setLoading(true);
    try {
      await API.post("/auth/register", data);
      const now = Date.now();
      const newCount = isResend ? otpSendCount + 1 : 1;
      setOtpSendCount(newCount);
      localStorage.setItem("otp_send_count", String(newCount));

      if (!isResend || !windowExpiry) {
        const winEnd = now + OTP_WINDOW_MS;
        setWindowExpiry(winEnd);
        localStorage.setItem("otp_window_expiry", String(winEnd));
      }

      if (newCount >= MAX_OTP_SENDS) {
        setMaxReached(true); setCanResend(false);
      } else {
        setCanResend(false);
        const resendExpiry = now + 30000;
        setTimer(30);
        localStorage.setItem("otp_resend_expiry", String(resendExpiry));
      }

      setStep("otp");
      localStorage.setItem("otp_email", data.email);
      localStorage.setItem("otp_step", "otp");
    } catch (err) {
      setError(err?.response?.data?.msg || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };

  // ── OTP input handling ──
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft"  && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); otpRefs.current[5]?.focus(); }
  };

  // ── Verify OTP ──
  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) { setError("Please enter the complete 6-digit code."); return; }
    setLoading(true); setError("");
    try {
      const res = await API.post("/auth/verify-otp", { email: data.email, otp: otpString });

      localStorage.removeItem("otp_step");
      localStorage.removeItem("otp_email");
      localStorage.removeItem("otp_resend_expiry");
      localStorage.removeItem("otp_send_count");
      localStorage.removeItem("otp_window_expiry");

      setVerifySuccess(true);
      setTimeout(() => handleAuthSuccess(res.data.user, res.data.token), 800);
    } catch (err) {
      setError(err?.response?.data?.msg || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  // ── Google login ──
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/google", {
        token: credentialResponse.credential,
        role: data.role,
      });
      const userName = res.data.user?.name || "";
      setGoogleUserName(userName);
      handleAuthSuccess(res.data.user, res.data.token);
    } catch {
      setGoogleLoading(false);
      setError("Google signup failed. Please try again.");
    }
  };

  const filledCount = otp.filter(Boolean).length;
  const progressPct = (filledCount / 6) * 100;

  return (
    <>
      <style>{styles}</style>

      {/* ── Legal Popup ── */}
      {legalPopup && (
        <LegalPopup type={legalPopup} onClose={() => setLegalPopup(null)} />
      )}

      {/* ── Vendor Code Popup (first registration only) ── */}
      {vendorCodePopup && (
        <VendorCodePopup
          code={vendorCodePopup.code}
          name={vendorCodePopup.name}
          onContinue={handlePopupContinue}
        />
      )}

      {/* ── Google loading overlay ── */}
      {googleLoading && !vendorCodePopup && <GoogleLoadingOverlay name={googleUserName} />}

      <div className="rg-root">
        {/* LEFT PANEL */}
        <div className="rg-left">
          <div className="rg-left-inner">
            <div className="rg-logo"><Logo /> Evencers</div>
            <h2 className="rg-tagline">
              Every great event<br />begins with a single step.
            </h2>
            <p className="rg-sub">Join thousands of couples, planners, and vendors building unforgettable moments.</p>
            <div className="rg-features">
              {["Verified premium vendors", "Instant booking & confirmation", "Secure payments, zero fees"].map((f, i) => (
                <div key={i} className="rg-feature-item">
                  <span className="rg-check">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rg-orb rg-orb1" />
          <div className="rg-orb rg-orb2" />
        </div>

        {/* RIGHT PANEL */}
        <div className="rg-right">
          <div className="rg-card">

            {/* ── OTP STEP ── */}
            {step === "otp" ? (
              <div className="otp-wrapper">
                <div className="otp-header">
                  <div className="otp-icon-ring">
                    {verifySuccess ? (
                      <span className="otp-icon-success">✓</span>
                    ) : (
                      <span className="otp-icon-envelope">✉</span>
                    )}
                    {!verifySuccess && <div className="otp-icon-pulse" />}
                  </div>
                  <h2 className="otp-title">
                    {verifySuccess ? "Verified!" : "Check your inbox"}
                  </h2>
                  <p className="otp-subtitle">
                    {verifySuccess
                      ? "Setting up your account…"
                      : <><span>We sent a 6-digit code to</span><br /><strong>{data.email}</strong></>
                    }
                  </p>
                </div>

                {!verifySuccess && (
                  <>
                    <div className="otp-attempt-bar">
                      {[...Array(MAX_OTP_SENDS)].map((_, i) => (
                        <div key={i} className={`otp-attempt-dot ${i < otpSendCount ? "used" : ""}`} />
                      ))}
                      <span className="otp-attempt-label">{otpSendCount}/{MAX_OTP_SENDS} sends used</span>
                    </div>

                    {maxReached && (
                      <div className="otp-lockout">
                        <span className="otp-lockout-icon">⏳</span>
                        <div>
                          <p className="otp-lockout-title">Maximum OTPs reached</p>
                          <p className="otp-lockout-sub">Resend in <strong>{windowTimer}s</strong></p>
                        </div>
                      </div>
                    )}

                    <div className="otp-boxes" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          className={`otp-box ${digit ? "filled" : ""} ${error ? "shake" : ""}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          disabled={verifySuccess}
                        />
                      ))}
                    </div>

                    <div className="otp-progress-track">
                      <div className="otp-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>

                    {error && <div className="otp-error"><span>⚠</span> {error}</div>}

                    <button
                      className={`rg-submit ${loading ? "loading" : ""} ${filledCount === 6 ? "ready" : ""}`}
                      disabled={loading || filledCount < 6}
                      onClick={handleVerify}
                    >
                      {loading ? <span className="rg-spinner" /> : (
                        <span className="otp-btn-inner">Verify & Continue <span className="otp-btn-arrow">→</span></span>
                      )}
                    </button>

                    <div className="otp-resend-row">
                      <span className="otp-resend-label">Didn't receive it?</span>
                      {maxReached ? (
                        <span className="otp-resend-locked">Wait {windowTimer}s to resend</span>
                      ) : canResend ? (
                        <button className="otp-resend-btn" onClick={() => sendOtp(true)} disabled={loading}>Resend code</button>
                      ) : (
                        <span className="otp-timer-badge">
                          <span className="otp-timer-ring">
                            <svg viewBox="0 0 36 36" className="otp-ring-svg">
                              <circle cx="18" cy="18" r="15" className="otp-ring-track" />
                              <circle cx="18" cy="18" r="15" className="otp-ring-progress" strokeDasharray={`${((30 - timer) / 30) * 94} 94`} />
                            </svg>
                          </span>
                          Resend in {timer}s
                        </span>
                      )}
                    </div>

                    <div className="otp-change-email">
                      <button className="otp-change-btn" onClick={() => {
                        setStep("register");
                        setOtp(["", "", "", "", "", ""]);
                        setError("");
                        localStorage.removeItem("otp_step");
                      }}>
                        ← Change email address
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ── REGISTER STEP ── */
              <>
                <div className="rg-card-header">
                  <h1>Create account</h1>
                  <p>Already have one? <a href="/login" className="rg-link">Sign in</a></p>
                </div>

                <div className="rg-role-toggle">
                  {["user", "vendor"].map((r) => (
                    <button key={r} className={`rg-role-btn ${data.role === r ? "active" : ""}`} onClick={() => setData({ ...data, role: r })}>
                      {r === "user" ? "👤 I'm a Client" : "🏢 I'm a Vendor"}
                    </button>
                  ))}
                </div>

                <div className="rg-fields">
                  <div className="rg-field">
                    <label>Full Name</label>
                    <div className="rg-input-wrap">
                      <span className="rg-icon">◈</span>
                      <input placeholder="Jane Doe" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
                    </div>
                  </div>
                  <div className="rg-field">
                    <label>Email Address</label>
                    <div className="rg-input-wrap">
                      <span className="rg-icon">✉</span>
                      <input placeholder="jane@example.com" type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="rg-field">
                    <label>Password</label>
                    <div className="rg-input-wrap">
                      <span className="rg-icon">◆</span>
                      <input placeholder="Min. 8 characters" type={showPass ? "text" : "password"} value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
                      <button className="rg-eye" onClick={() => setShowPass(!showPass)}>{showPass ? "🙈" : "👁"}</button>
                    </div>
                  </div>
                </div>

                {error && <p className="rg-error">⚠ {error}</p>}

                <button className={`rg-submit ${loading ? "loading" : ""}`} onClick={() => sendOtp(false)} disabled={loading}>
                  {loading ? <span className="rg-spinner" /> : "Create My Account →"}
                </button>

                <div style={{ marginTop: "16px" }}>
                  <div className="rg-divider-label">or continue with</div>
                  <div className={`rg-google-wrap ${googleLoading ? "rg-google-faded" : ""}`}>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError("Google signup failed")}
                    />
                  </div>
                </div>

                <p className="rg-terms">
                  By registering, you agree to our{" "}
                  <button
                    type="button"
                    className="rg-link rg-legal-btn"
                    onClick={() => setLegalPopup("terms")}
                  >
                    Terms
                  </button>{" "}and{" "}
                  <button
                    type="button"
                    className="rg-link rg-legal-btn"
                    onClick={() => setLegalPopup("privacy")}
                  >
                    Privacy Policy
                  </button>.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --muted: #7a7265; --border: rgba(201,168,76,0.22); --surface: #faf7f2;
    --error: #b85c5c; --success: #2d6a4f; --white: #ffffff;
  }
  .rg-root { display:grid; grid-template-columns:1fr 1fr; min-height:100vh; font-family:'DM Sans',sans-serif; }
  @media(max-width:780px){ .rg-root{grid-template-columns:1fr} .rg-left{display:none} }
  .rg-left { background:var(--ink); position:relative; overflow:hidden; display:flex; align-items:center; padding:60px 56px; }
  .rg-left-inner { position:relative; z-index:2; }
  .rg-logo { font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:600; color:var(--gold); letter-spacing:0.18em; text-transform:uppercase; margin-bottom:64px; }
  .rg-tagline { font-family:'Cormorant Garamond',serif; font-size:clamp(2rem,3.5vw,2.8rem); font-weight:300; font-style:italic; color:var(--cream); line-height:1.2; margin-bottom:20px; }
  .rg-sub { font-size:13.5px; color:var(--muted); line-height:1.7; margin-bottom:48px; max-width:320px; }
  .rg-features { display:flex; flex-direction:column; gap:14px; }
  .rg-feature-item { display:flex; align-items:center; gap:12px; font-size:13px; color:var(--gold-light); }
  .rg-check { width:22px; height:22px; border:1px solid var(--gold); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--gold); flex-shrink:0; }
  .rg-orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.18; pointer-events:none; }
  .rg-orb1 { width:400px; height:400px; background:var(--gold); top:-100px; right:-120px; }
  .rg-orb2 { width:300px; height:300px; background:#8b5c8b; bottom:-80px; left:-60px; }
  .rg-right { background:var(--cream); display:flex; align-items:center; justify-content:center; padding:48px 32px; }
  .rg-card { width:100%; max-width:420px; background:var(--white); border:1px solid var(--border); border-radius:16px; padding:44px 40px; box-shadow:0 12px 48px rgba(14,12,10,0.07); animation:fadeUp 0.5s ease both; }
  .rg-card-header { margin-bottom:28px; }
  .rg-card-header h1 { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:var(--ink); margin-bottom:6px; }
  .rg-card-header p { font-size:13px; color:var(--muted); }
  .rg-role-toggle { display:grid; grid-template-columns:1fr 1fr; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:5px; margin-bottom:28px; }
  .rg-role-btn { padding:10px; border:none; border-radius:6px; background:transparent; font-family:'DM Sans',sans-serif; font-size:13px; color:var(--muted); cursor:pointer; transition:all 0.22s ease; font-weight:400; }
  .rg-role-btn.active { background:var(--white); color:var(--ink); font-weight:500; box-shadow:0 2px 10px rgba(14,12,10,0.08); border:1px solid var(--border); }
  .rg-fields { display:flex; flex-direction:column; gap:18px; margin-bottom:22px; }
  .rg-field { display:flex; flex-direction:column; gap:7px; }
  .rg-field label { font-size:11px; font-weight:500; letter-spacing:0.13em; text-transform:uppercase; color:var(--muted); }
  .rg-input-wrap { display:flex; align-items:center; gap:10px; border:1px solid var(--border); border-radius:7px; padding:12px 14px; background:var(--surface); transition:border-color 0.2s,box-shadow 0.2s; }
  .rg-input-wrap:focus-within { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }
  .rg-icon { font-size:13px; color:var(--gold); opacity:0.8; flex-shrink:0; }
  .rg-input-wrap input { border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--ink); outline:none; width:100%; }
  .rg-input-wrap input::placeholder { color:#bbb4a8; }
  .rg-eye { background:none; border:none; cursor:pointer; font-size:14px; padding:0; line-height:1; flex-shrink:0; }
  .rg-error { font-size:12.5px; color:var(--error); background:rgba(184,92,92,0.07); border:1px solid rgba(184,92,92,0.2); border-radius:6px; padding:10px 14px; margin-bottom:16px; }
  .rg-submit { width:100%; padding:15px; background:var(--ink); color:var(--white); border:none; border-radius:7px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; letter-spacing:0.04em; cursor:pointer; transition:all 0.25s ease; display:flex; align-items:center; justify-content:center; margin-bottom:16px; min-height:50px; opacity:0.5; }
  .rg-submit.ready,.rg-submit:not([disabled]) { opacity:1; }
  .rg-submit:hover:not(:disabled) { background:var(--gold); color:var(--ink); box-shadow:0 6px 24px rgba(201,168,76,0.3); transform:translateY(-1px); }
  .rg-submit.loading { opacity:0.65; pointer-events:none; }
  .rg-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
  .rg-terms { font-size:11.5px; color:var(--muted); text-align:center; line-height:1.6; margin-top:14px; }
  .rg-link { color:var(--gold); text-decoration:none; font-weight:500; }
  .rg-link:hover { text-decoration:underline; }
  .rg-legal-btn { background:none; border:none; padding:0; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:11.5px; }
  .rg-divider-label { text-align:center; margin-bottom:10px; font-size:12px; color:var(--muted); }
  .rg-google-wrap { transition:opacity 0.3s ease; display:flex; justify-content:center; }
  .rg-google-faded { opacity:0.4; pointer-events:none; }
  .gl-overlay { position:fixed; inset:0; z-index:9999; background:rgba(245,240,232,0.92); backdrop-filter:blur(12px); display:flex; align-items:center; justify-content:center; animation:glFadeIn 0.3s ease both; }
  @keyframes glFadeIn { from{opacity:0} to{opacity:1} }
  .gl-card { background:var(--white); border:1px solid var(--border); border-radius:20px; padding:48px 44px; text-align:center; max-width:340px; width:90%; box-shadow:0 24px 64px rgba(14,12,10,0.12); animation:glPopIn 0.38s cubic-bezier(0.34,1.3,0.64,1) both; }
  @keyframes glPopIn { from{opacity:0;transform:scale(0.9) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
  .gl-icon-ring { position:relative; width:72px; height:72px; margin:0 auto 24px; display:flex; align-items:center; justify-content:center; }
  .gl-spinner-ring { position:absolute; inset:0; border-radius:50%; border:2.5px solid rgba(201,168,76,0.2); border-top-color:var(--gold); animation:glSpin 0.9s linear infinite; }
  @keyframes glSpin { to{transform:rotate(360deg)} }
  .gl-g-letter { width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,#4285F4,#34A853,#FBBC05,#EA4335); display:flex; align-items:center; justify-content:center; font-family:'Cormorant Garamond',serif; font-size:1.5rem; font-weight:600; color:white; box-shadow:0 4px 16px rgba(66,133,244,0.25); }
  .gl-title { font-family:'Cormorant Garamond',serif; font-size:1.6rem; font-weight:600; color:var(--ink); margin-bottom:6px; }
  .gl-name { font-size:13px; color:var(--gold); font-weight:500; margin-bottom:6px; }
  .gl-sub { font-size:12.5px; color:var(--muted); line-height:1.6; margin-bottom:24px; }
  .gl-dots { display:flex; justify-content:center; gap:8px; }
  .gl-dots span { width:7px; height:7px; border-radius:50%; background:var(--gold); opacity:0.3; animation:glDotBounce 1.2s ease-in-out infinite; }
  .gl-dots span:nth-child(1){animation-delay:0s} .gl-dots span:nth-child(2){animation-delay:0.2s} .gl-dots span:nth-child(3){animation-delay:0.4s}
  @keyframes glDotBounce { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1.2)} }
  .otp-wrapper { animation:fadeUp 0.45s ease both; }
  .otp-header { text-align:center; margin-bottom:28px; }
  .otp-icon-ring { position:relative; width:68px; height:68px; margin:0 auto 18px; background:linear-gradient(135deg,rgba(201,168,76,0.12),rgba(201,168,76,0.04)); border:1.5px solid var(--border); border-radius:50%; display:flex; align-items:center; justify-content:center; }
  .otp-icon-envelope { font-size:26px; }
  .otp-icon-success { font-size:28px; color:var(--success); animation:successPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  .otp-icon-pulse { position:absolute; inset:-6px; border-radius:50%; border:1.5px solid rgba(201,168,76,0.35); animation:pulse 2s ease-in-out infinite; }
  .otp-title { font-family:'Cormorant Garamond',serif; font-size:1.75rem; font-weight:600; color:var(--ink); margin-bottom:8px; }
  .otp-subtitle { font-size:13px; color:var(--muted); line-height:1.6; }
  .otp-subtitle strong { color:var(--ink); font-weight:500; }
  .otp-attempt-bar { display:flex; align-items:center; gap:8px; justify-content:center; margin-bottom:22px; }
  .otp-attempt-dot { width:10px; height:10px; border-radius:50%; border:1.5px solid var(--border); background:var(--surface); transition:all 0.3s ease; }
  .otp-attempt-dot.used { background:var(--gold); border-color:var(--gold); box-shadow:0 0 6px rgba(201,168,76,0.4); }
  .otp-attempt-label { font-size:11px; color:var(--muted); letter-spacing:0.06em; margin-left:4px; }
  .otp-lockout { display:flex; align-items:flex-start; gap:12px; background:rgba(184,92,92,0.06); border:1px solid rgba(184,92,92,0.18); border-radius:10px; padding:14px 16px; margin-bottom:20px; }
  .otp-lockout-icon { font-size:20px; flex-shrink:0; margin-top:1px; }
  .otp-lockout-title { font-size:13px; font-weight:500; color:var(--error); margin-bottom:3px; }
  .otp-lockout-sub { font-size:12px; color:var(--muted); }
  .otp-lockout-sub strong { color:var(--ink); }
  .otp-boxes { display:flex; justify-content:center; gap:10px; margin-bottom:14px; }
  .otp-box { width:52px; height:60px; text-align:center; font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:600; color:var(--ink); background:var(--surface); border:1.5px solid var(--border); border-radius:10px; outline:none; transition:all 0.2s ease; caret-color:var(--gold); }
  .otp-box:focus { border-color:var(--gold); background:#fff; box-shadow:0 0 0 3px rgba(201,168,76,0.12),0 4px 16px rgba(201,168,76,0.1); transform:translateY(-2px); }
  .otp-box.filled { border-color:rgba(201,168,76,0.5); background:linear-gradient(135deg,#fff 60%,rgba(201,168,76,0.05)); }
  .otp-box.shake { animation:shake 0.4s ease; }
  .otp-progress-track { height:2px; background:rgba(201,168,76,0.12); border-radius:999px; margin-bottom:18px; overflow:hidden; }
  .otp-progress-fill { height:100%; background:linear-gradient(90deg,var(--gold-light),var(--gold)); border-radius:999px; transition:width 0.3s ease; }
  .otp-error { font-size:12.5px; color:var(--error); background:rgba(184,92,92,0.07); border:1px solid rgba(184,92,92,0.2); border-radius:6px; padding:10px 14px; margin-bottom:16px; text-align:center; }
  .otp-btn-inner { display:flex; align-items:center; justify-content:center; gap:8px; }
  .otp-btn-arrow { transition:transform 0.2s ease; }
  .rg-submit:hover .otp-btn-arrow { transform:translateX(4px); }
  .otp-resend-row { display:flex; align-items:center; justify-content:center; gap:8px; font-size:12.5px; color:var(--muted); margin-bottom:16px; }
  .otp-resend-btn { background:none; border:none; color:var(--gold); font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:500; cursor:pointer; padding:0; text-decoration:underline; }
  .otp-resend-btn:hover { opacity:0.75; }
  .otp-resend-locked { font-size:12px; color:var(--error); font-weight:500; }
  .otp-timer-badge { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--muted); }
  .otp-timer-ring { width:20px; height:20px; display:inline-block; }
  .otp-ring-svg { width:100%; height:100%; transform:rotate(-90deg); }
  .otp-ring-track { fill:none; stroke:rgba(201,168,76,0.15); stroke-width:4; }
  .otp-ring-progress { fill:none; stroke:var(--gold); stroke-width:4; stroke-linecap:round; transition:stroke-dasharray 1s linear; }
  .otp-change-email { text-align:center; }
  .otp-change-btn { background:none; border:none; font-family:'DM Sans',sans-serif; font-size:12px; color:var(--muted); cursor:pointer; padding:0; transition:color 0.2s; }
  .otp-change-btn:hover { color:var(--ink); }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes pulse     { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.12);opacity:0.2} }
  @keyframes shake     { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
  @keyframes successPop{ from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
`;