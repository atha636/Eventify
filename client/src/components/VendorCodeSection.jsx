
import { useState } from "react";

export default function VendorCodeSection() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const code = user?.vendorCode;
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  if (!code) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    const shareText = `Use my vendor code ${code} on Evencers to get FREE brokerage on your first booking! 🎉`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Evencers Vendor Code", text: shareText });
      } catch {}
    } else {
      // Fallback: copy share text to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  const chars = code.split("");

  return (
    <>
      <style>{sectionStyles}</style>
      <section className="vcs-root" aria-label="Your coupon code">
        {/* left */}
        <div className="vcs-left">
          <div className="vcs-icon" aria-hidden="true">🎟</div>
          <div>
            <p className="vcs-label">My Coupon Code</p>
            <p className="vcs-hint">Share with clients → You get free brokerage on first booking</p>
          </div>
        </div>

        {/* center: digit display */}
        <div className="vcs-code-wrap">
          {chars.map((ch, i) => (
            <div
              key={i}
              className={`vcs-digit ${
                revealed
                  ? isNaN(ch) ? "vcs-alpha" : "vcs-num"
                  : "vcs-hidden"
              }`}
            >
              {revealed ? ch : "•"}
            </div>
          ))}
        </div>

        {/* right: actions */}
        <div className="vcs-actions">
          <button
            className="vcs-reveal-btn"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide coupon code" : "Reveal coupon code"}
          >
            {revealed ? "🙈 Hide" : "👁 Reveal"}
          </button>
          <button
            className="vcs-share-btn"
            onClick={handleShare}
            aria-label="Share coupon code with clients"
            title="Share code — You get free brokerage on first booking"
          >
            📤 Share
          </button>
          <button
            className={`vcs-copy-btn ${copied ? "vcs-copied" : ""}`}
            onClick={handleCopy}
            disabled={!revealed}
            aria-live="polite"
          >
            {copied ? "✓ Copied" : "⎘ Copy"}
          </button>
        </div>
      </section>
    </>
  );
}

const sectionStyles = `
  .vcs-root {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    background: #ffffff;
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 16px;
    padding: 18px 24px;
    margin-bottom: 28px;
    box-shadow: 0 2px 12px rgba(14,12,10,0.05), inset 0 1px 0 rgba(255,255,255,0.8);
    animation: vcsSlideIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
    position: relative;
    overflow: hidden;
  }
  .vcs-root::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(to bottom, #c9a84c, #e8d5a3);
    border-radius: 3px 0 0 3px;
  }
  @keyframes vcsSlideIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .vcs-left {
    display: flex; align-items: center; gap: 12px;
    flex-shrink: 0;
  }
  .vcs-icon {
    font-size: 1.2rem;
    width: 40px; height: 40px;
    border-radius: 10px;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.22);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .vcs-label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.13em;
    text-transform: uppercase; color: #7a7265;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 2px;
  }
  .vcs-hint {
    font-size: 11.5px; color: #a09890;
    font-family: 'DM Sans', sans-serif;
  }

  .vcs-code-wrap {
    display: flex; gap: 5px;
    flex: 1;
    justify-content: center;
  }
  .vcs-digit {
    width: 40px; height: 46px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.45rem; font-weight: 600;
    transition: all 0.22s ease;
  }
  .vcs-alpha {
    background: #0e0c0a; color: #c9a84c;
    border: 1px solid rgba(201,168,76,0.3);
    box-shadow: 0 2px 8px rgba(14,12,10,0.15);
  }
  .vcs-num {
    background: #faf7f2; color: #0e0c0a;
    border: 1.5px solid rgba(201,168,76,0.25);
  }
  .vcs-hidden {
    background: #f0ece4; color: #c8bfb2;
    border: 1px dashed rgba(201,168,76,0.2);
    font-size: 1rem;
  }

  .vcs-actions {
    display: flex; gap: 8px; flex-shrink: 0;
  }
  .vcs-reveal-btn {
    padding: 8px 14px;
    background: none;
    border: 1px solid rgba(201,168,76,0.28);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; color: #7a7265;
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap;
  }
  .vcs-reveal-btn:hover {
    border-color: #c9a84c; color: #c9a84c;
    background: rgba(201,168,76,0.05);
  }

  .vcs-share-btn {
    padding: 8px 14px;
    background: rgba(201,168,76,0.08);
    border: 1px solid rgba(201,168,76,0.28);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; color: #c9a84c; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap;
  }
  .vcs-share-btn:hover {
    background: rgba(201,168,76,0.15);
    border-color: #c9a84c;
  }

  .vcs-copy-btn {
    padding: 8px 14px;
    background: #0e0c0a; color: #ffffff;
    border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500;
    cursor: pointer; transition: all 0.22s;
    white-space: nowrap;
  }
  .vcs-copy-btn:hover:not(:disabled) {
    background: #c9a84c; color: #0e0c0a;
  }
  .vcs-copy-btn:disabled {
    opacity: 0.35; cursor: not-allowed;
  }
  .vcs-copy-btn.vcs-copied {
    background: #2d6a4f;
  }

  @media (max-width: 640px) {
    .vcs-root { flex-direction: column; align-items: flex-start; gap: 14px; }
    .vcs-code-wrap { justify-content: flex-start; }
    .vcs-actions { width: 100%; }
    .vcs-reveal-btn,
    .vcs-share-btn,
    .vcs-copy-btn { flex: 1; text-align: center; }
  }
`;