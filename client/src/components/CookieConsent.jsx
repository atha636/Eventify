import { useState, useEffect } from "react";

const COOKIE_KEY = "evencers_cookie_consent";

const categories = [
  {
    key: "necessary",
    label: "Strictly Necessary",
    desc: "Required for the website to function. Cannot be disabled.",
    locked: true,
  },
  {
    key: "analytics",
    label: "Analytics",
    desc: "Help us understand how visitors interact with our platform.",
    locked: false,
  },
  {
    key: "marketing",
    label: "Marketing",
    desc: "Used to show you relevant promotions and offers.",
    locked: false,
  },
  {
    key: "personalization",
    label: "Personalization",
    desc: "Remember your preferences for a tailored experience.",
    locked: false,
  },
];

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [prefs, setPrefs] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (consentData) => {
    setLeaving(true);
    setTimeout(() => {
      localStorage.setItem(
        COOKIE_KEY,
        JSON.stringify({ ...consentData, timestamp: Date.now() })
      );
      setVisible(false);
      setLeaving(false);
    }, 420);
  };

  const acceptAll = () =>
    dismiss({ necessary: true, analytics: true, marketing: true, personalization: true });

  const rejectAll = () =>
    dismiss({ necessary: true, analytics: false, marketing: false, personalization: false });

  const saveCustom = () => dismiss(prefs);

  const toggle = (key) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes cc-slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(28px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes cc-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cc-expand {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 400px; }
        }
        .cc-toggle-track {
          width: 36px; height: 20px; border-radius: 10px;
          border: 1px solid rgba(201,168,76,0.3);
          background: rgba(255,255,255,0.06);
          position: relative; cursor: pointer;
          transition: background 0.25s, border-color 0.25s;
          flex-shrink: 0;
        }
        .cc-toggle-track.on {
          background: #c9a84c;
          border-color: #c9a84c;
        }
        .cc-toggle-track.locked {
          opacity: 0.55; cursor: not-allowed;
          background: rgba(201,168,76,0.38);
          border-color: rgba(201,168,76,0.4);
        }
        .cc-toggle-thumb {
          position: absolute; top: 2px; left: 2px;
          width: 14px; height: 14px; border-radius: 50%;
          background: rgba(245,240,232,0.45);
          transition: transform 0.25s cubic-bezier(.22,1,.36,1), background 0.25s;
        }
        .cc-toggle-track.on .cc-toggle-thumb,
        .cc-toggle-track.locked .cc-toggle-thumb {
          transform: translateX(16px);
          background: #0e0c0a;
        }
        .cc-btn {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 12.5px; font-weight: 400;
          border-radius: 9px; cursor: pointer;
          padding: 11px 16px;
          transition: all 0.22s; white-space: nowrap;
          -webkit-tap-highlight-color: transparent;
          line-height: 1;
        }
        .cc-btn-outline {
          background: transparent;
          border: 1px solid rgba(201,168,76,0.22);
          color: rgba(201,168,76,0.7);
        }
        .cc-btn-outline:hover {
          border-color: rgba(201,168,76,0.5);
          color: #c9a84c;
          background: rgba(201,168,76,0.06);
        }
        .cc-btn-ghost {
          background: transparent;
          border: 1px solid rgba(245,240,232,0.1);
          color: rgba(245,240,232,0.38);
        }
        .cc-btn-ghost:hover {
          border-color: rgba(245,240,232,0.22);
          color: rgba(245,240,232,0.6);
        }
        .cc-btn-gold {
          background: linear-gradient(135deg, #c9a84c 0%, #a8882e 100%);
          border: none;
          color: #0e0c0a; font-weight: 500;
          box-shadow: 0 4px 18px rgba(201,168,76,0.28);
        }
        .cc-btn-gold:hover {
          background: linear-gradient(135deg, #d9b85c 0%, #b8983e 100%);
          box-shadow: 0 6px 24px rgba(201,168,76,0.38);
          transform: translateY(-1px);
        }
        .cc-btn:active { transform: scale(0.97) !important; }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        onClick={rejectAll}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.52)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: leaving ? 0 : 1,
          transition: "opacity 0.42s ease",
          animation: "cc-fadeIn 0.4s ease both",
        }}
      />

      {/* ── Banner ── */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          zIndex: 9999,
          width: "min(560px, calc(100vw - 28px))",
          background: "linear-gradient(160deg, #1c1508 0%, #0d0a04 55%, #1a1208 100%)",
          border: "1px solid rgba(201,168,76,0.28)",
          borderRadius: 18,
          padding: "26px 26px 22px",
          boxShadow:
            "0 0 0 1px rgba(201,168,76,0.05), 0 40px 100px rgba(0,0,0,0.78), 0 0 80px rgba(201,168,76,0.06)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          opacity: leaving ? 0 : 1,
          transform: leaving
            ? "translateX(-50%) translateY(18px)"
            : "translateX(-50%) translateY(0)",
          transition: "opacity 0.42s ease, transform 0.42s ease",
          animation: "cc-slideUp 0.5s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        {/* Top shimmer line */}
        <div style={{
          position: "absolute", top: 0, left: "12%", right: "12%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.65), transparent)",
          borderRadius: "0 0 4px 4px",
          pointerEvents: "none",
        }} />

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 13, marginBottom: 13 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(201,168,76,0.16), rgba(201,168,76,0.04))",
            border: "1px solid rgba(201,168,76,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 19, marginTop: 2,
          }}>
            🍪
          </div>
          <div>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 20, fontWeight: 600, color: "#f5e6b8",
              letterSpacing: 0.3, lineHeight: 1.2,
            }}>
              We value your privacy
            </div>
            <div style={{
              fontSize: 10, fontWeight: 300,
              color: "rgba(201,168,76,0.48)",
              letterSpacing: "1.8px",
              textTransform: "uppercase", marginTop: 3,
            }}>
              Evencers · Cookie Preferences
            </div>
          </div>
        </div>

        {/* ── Body text ── */}
        <p style={{
          fontSize: 12.5,
          color: "rgba(245,240,232,0.45)",
          lineHeight: 1.72,
          fontWeight: 300,
          borderTop: "1px solid rgba(201,168,76,0.08)",
          paddingTop: 13,
        }}>
          We use cookies to enhance your browsing experience, personalise content, and
          analyse platform traffic. By clicking "Accept All" you consent to our use of
          cookies.{" "}
          <a
            href="/privacy-policy"
            style={{
              color: "rgba(201,168,76,0.78)",
              textDecoration: "underline",
              textDecorationColor: "rgba(201,168,76,0.3)",
              textUnderlineOffset: 2,
            }}
          >
            Privacy Policy
          </a>
        </p>

        {/* ── Expanded preferences ── */}
        {expanded && (
          <div style={{
            marginTop: 16,
            borderTop: "1px solid rgba(201,168,76,0.1)",
            paddingTop: 14,
            overflow: "hidden",
            animation: "cc-expand 0.35s cubic-bezier(.22,1,.36,1) both",
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 13.5, fontWeight: 600,
              color: "rgba(245,230,184,0.72)",
              letterSpacing: 0.4, marginBottom: 12,
            }}>
              Manage Preferences
            </div>

            {categories.map((cat, i) => (
              <div
                key={cat.key}
                style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 14,
                  padding: "10px 0",
                  borderBottom:
                    i < categories.length - 1
                      ? "1px solid rgba(201,168,76,0.07)"
                      : "none",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 12.5, fontWeight: 500,
                    color: cat.locked
                      ? "rgba(201,168,76,0.55)"
                      : "rgba(245,240,232,0.72)",
                    marginBottom: 2, display: "flex", alignItems: "center", gap: 7,
                  }}>
                    {cat.label}
                    {cat.locked && (
                      <span style={{
                        fontSize: 9, letterSpacing: "1.3px",
                        textTransform: "uppercase",
                        color: "rgba(201,168,76,0.38)",
                      }}>
                        Always on
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: "rgba(245,240,232,0.26)",
                    lineHeight: 1.5,
                  }}>
                    {cat.desc}
                  </div>
                </div>

                {/* Toggle */}
                <div
                  className={`cc-toggle-track ${
                    prefs[cat.key] || cat.locked ? "on" : ""
                  } ${cat.locked ? "locked" : ""}`}
                  onClick={() => !cat.locked && toggle(cat.key)}
                  role="switch"
                  aria-checked={prefs[cat.key] || cat.locked}
                  aria-label={cat.label}
                  tabIndex={cat.locked ? -1 : 0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !cat.locked && toggle(cat.key)
                  }
                >
                  <div className="cc-toggle-thumb" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div style={{ display: "flex", gap: 9, marginTop: 18, flexWrap: "wrap" }}>
          <button
            className="cc-btn cc-btn-outline"
            onClick={() => setExpanded((v) => !v)}
            style={{ flex: "1 1 100px" }}
          >
            {expanded ? "Hide Options" : "Customise"}
          </button>

          <button
            className="cc-btn cc-btn-ghost"
            onClick={rejectAll}
            style={{ flex: "1 1 110px" }}
          >
            Reject Non‑Essential
          </button>

          <button
            className="cc-btn cc-btn-gold"
            onClick={expanded ? saveCustom : acceptAll}
            style={{ flex: "1.3 1 120px" }}
          >
            {expanded ? "Save Preferences" : "Accept All"}
          </button>
        </div>
      </div>
    </>
  );
}