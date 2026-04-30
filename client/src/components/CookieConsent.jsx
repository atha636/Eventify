import { useState, useEffect } from "react";

// ─── Real browser cookie helpers (survive logout & localStorage.clear()) ──────
const COOKIE_NAME    = "evencers_consent";
const EXPIRE_DAYS    = 365;

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
// ─────────────────────────────────────────────────────────────────────────────

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
  const [visible,  setVisible]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [leaving,  setLeaving]  = useState(false);
  const [prefs, setPrefs] = useState({
    necessary:       true,
    analytics:       false,
    marketing:       false,
    personalization: false,
  });

  useEffect(() => {
    // Only show if no consent cookie exists yet — survives logout
    if (!getCookie(COOKIE_NAME)) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (consentData) => {
    setLeaving(true);
    setTimeout(() => {
      setCookie(
        COOKIE_NAME,
        JSON.stringify({ ...consentData, ts: Date.now() }),
        EXPIRE_DAYS
      );
      setVisible(false);
      setLeaving(false);
    }, 430);
  };

  const acceptAll  = () => dismiss({ necessary:true, analytics:true, marketing:true, personalization:true });
  const rejectAll  = () => dismiss({ necessary:true, analytics:false, marketing:false, personalization:false });
  const saveCustom = () => dismiss(prefs);
  const toggle     = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  if (!visible) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        /* ── Animations ── */
        @keyframes cc-up {
          from { opacity:0; transform:translateX(-50%) translateY(36px) scale(.97); }
          to   { opacity:1; transform:translateX(-50%) translateY(0)    scale(1);   }
        }
        @keyframes cc-up-mobile {
          from { opacity:0; transform:translateY(40px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes cc-fade { from{opacity:0} to{opacity:1} }
        @keyframes cc-expand {
          from { opacity:0; max-height:0;    transform:translateY(-6px); }
          to   { opacity:1; max-height:540px; transform:translateY(0);   }
        }

        /* ── Toggle ── */
        .cc-track {
          width:40px; height:22px; border-radius:11px;
          border:1px solid rgba(201,168,76,.22);
          background:rgba(255,255,255,.05);
          position:relative; cursor:pointer; flex-shrink:0;
          transition:background .28s, border-color .28s;
          -webkit-tap-highlight-color:transparent;
        }
        .cc-track.on     { background:linear-gradient(135deg,#c9a84c,#a8882e); border-color:#c9a84c; }
        .cc-track.locked { opacity:.6; cursor:not-allowed;
          background:linear-gradient(135deg,rgba(201,168,76,.5),rgba(168,136,46,.5));
          border-color:rgba(201,168,76,.44); }
        .cc-thumb {
          position:absolute; top:3px; left:3px;
          width:14px; height:14px; border-radius:50%;
          background:rgba(245,240,232,.38);
          box-shadow:0 1px 4px rgba(0,0,0,.38);
          transition:transform .28s cubic-bezier(.22,1,.36,1), background .28s;
        }
        .cc-track.on .cc-thumb,
        .cc-track.locked .cc-thumb { transform:translateX(18px); background:#0e0c0a; }

        /* ── Buttons ── */
        .cc-btn {
          font-family:'DM Sans',system-ui,sans-serif;
          border-radius:10px; cursor:pointer;
          transition:all .22s; white-space:nowrap;
          -webkit-tap-highlight-color:transparent;
          line-height:1; letter-spacing:.15px;
          font-size:clamp(11.5px,2.8vw,13px);
          font-weight:400;
          padding:clamp(10px,2vw,12px) clamp(13px,3.5vw,18px);
        }
        .cc-btn:active { transform:scale(.96) !important; }

        .cc-btn-outline {
          background:transparent;
          border:1px solid rgba(201,168,76,.22);
          color:rgba(201,168,76,.65);
        }
        .cc-btn-outline:hover {
          border-color:rgba(201,168,76,.5); color:#c9a84c;
          background:rgba(201,168,76,.06);
        }
        .cc-btn-ghost {
          background:transparent;
          border:1px solid rgba(245,240,232,.1);
          color:rgba(245,240,232,.35);
        }
        .cc-btn-ghost:hover {
          border-color:rgba(245,240,232,.22);
          color:rgba(245,240,232,.58);
          background:rgba(255,255,255,.03);
        }
        .cc-btn-gold {
          background:linear-gradient(135deg,#c9a84c 0%,#a8882e 100%);
          border:none; color:#0e0c0a; font-weight:500;
          box-shadow:0 4px 20px rgba(201,168,76,.3);
        }
        .cc-btn-gold:hover {
          background:linear-gradient(135deg,#d9b85c 0%,#b8983e 100%);
          box-shadow:0 6px 28px rgba(201,168,76,.42);
          transform:translateY(-1px);
        }

        /* ── Category row ── */
        .cc-row {
          display:flex; align-items:center;
          justify-content:space-between; gap:14px;
          padding:11px 0;
        }

        /* ── Scrollable on short screens ── */
        .cc-scroll {
          overflow-y:auto; max-height:min(300px,38vh);
          scrollbar-width:thin;
          scrollbar-color:rgba(201,168,76,.18) transparent;
        }
        .cc-scroll::-webkit-scrollbar { width:3px; }
        .cc-scroll::-webkit-scrollbar-thumb { background:rgba(201,168,76,.2); border-radius:2px; }

        /* ── Banner base ── */
        .cc-wrap {
          position:fixed; z-index:9999;
          bottom:24px; left:50%;
          width:min(580px, calc(100vw - 24px));
          background:linear-gradient(160deg,#1e1709 0%,#0d0a04 52%,#1a1208 100%);
          border:1px solid rgba(201,168,76,.3);
          border-radius:20px;
          padding:28px 28px 22px;
          box-shadow:
            0 0 0 1px rgba(201,168,76,.06),
            0 48px 120px rgba(0,0,0,.86),
            0 0 90px rgba(201,168,76,.07),
            inset 0 1px 0 rgba(201,168,76,.09);
          font-family:'DM Sans',system-ui,sans-serif;
          animation:cc-up .52s cubic-bezier(.22,1,.36,1) both;
        }

        /* ── Mobile: slide up from bottom edge ── */
        @media (max-width:600px) {
          .cc-wrap {
            bottom:0 !important; left:0 !important;
            width:100% !important;
            border-radius:20px 20px 0 0;
            padding:20px 16px 32px;
            /* override inline transform-based animation */
            animation:cc-up-mobile .48s cubic-bezier(.22,1,.36,1) both !important;
          }
          /* leaving animation for mobile */
          .cc-wrap.leaving {
            transform:translateY(24px) !important;
          }
        }

        /* ── Tablet ── */
        @media (min-width:601px) and (max-width:960px) {
          .cc-wrap { width:min(520px, calc(100vw - 32px)); }
        }
      `}</style>

      {/* ── Backdrop: subtle vignette only, no click-dismiss ── */}
      <div
        style={{
          position:"fixed", inset:0, zIndex:9998,
          background:"radial-gradient(ellipse at center, rgba(0,0,0,.34) 0%, rgba(0,0,0,.52) 100%)",
          backdropFilter:"blur(2px)",
          WebkitBackdropFilter:"blur(2px)",
          opacity: leaving ? 0 : 1,
          transition:"opacity .42s ease",
          animation:"cc-fade .44s ease both",
          pointerEvents:"all",          // blocks UI behind — but no onClick
        }}
      />

      {/* ── Banner ── */}
      <div
        className={`cc-wrap${leaving ? " leaving" : ""}`}
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving
            ? "translateX(-50%) translateY(22px) scale(.98)"
            : "translateX(-50%) translateY(0) scale(1)",
          transition:"opacity .42s ease, transform .42s ease",
        }}
      >
        {/* Shimmer top line */}
        <div style={{
          position:"absolute", top:0, left:"10%", right:"10%", height:1,
          background:"linear-gradient(90deg,transparent,rgba(201,168,76,.72),transparent)",
          borderRadius:"0 0 6px 6px", pointerEvents:"none",
        }} />

        {/* Inner top glow */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:110,
          background:"radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.065) 0%,transparent 72%)",
          borderRadius:"20px 20px 0 0", pointerEvents:"none",
        }} />

        {/* ── Header ── */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:14, position:"relative" }}>
          <div style={{
            width:44, height:44, borderRadius:12, flexShrink:0,
            background:"linear-gradient(135deg,rgba(201,168,76,.18),rgba(201,168,76,.04))",
            border:"1px solid rgba(201,168,76,.28)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:21, marginTop:1,
            boxShadow:"0 2px 14px rgba(201,168,76,.13)",
          }}>
            🍪
          </div>
          <div>
            <div style={{
              fontFamily:"'Cormorant Garamond',Georgia,serif",
              fontSize:"clamp(17px,4.5vw,22px)", fontWeight:600,
              color:"#f5e6b8", letterSpacing:.3, lineHeight:1.2,
            }}>
              We value your privacy
            </div>
            <div style={{
              fontSize:"clamp(9px,2vw,10px)", fontWeight:300,
              color:"rgba(201,168,76,.44)", letterSpacing:"1.8px",
              textTransform:"uppercase", marginTop:3,
            }}>
              Evencers · Cookie Preferences
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <p style={{
          fontSize:"clamp(11.5px,2.6vw,13px)",
          color:"rgba(245,240,232,.42)",
          lineHeight:1.76, fontWeight:300,
          borderTop:"1px solid rgba(201,168,76,.09)",
          paddingTop:14, margin:0, position:"relative",
        }}>
          We use cookies to enhance your browsing experience, personalise content, and
          analyse platform traffic. By clicking{" "}
          <em style={{ fontStyle:"normal", color:"rgba(201,168,76,.65)" }}>"Accept All"</em>
          {" "}you consent to our use of cookies.{" "}
          <a href="/privacy-policy" style={{
            color:"rgba(201,168,76,.75)",
            textDecoration:"underline",
            textDecorationColor:"rgba(201,168,76,.28)",
            textUnderlineOffset:3,
          }}>
            Privacy Policy
          </a>
        </p>

        {/* ── Expanded preferences ── */}
        {expanded && (
          <div style={{
            marginTop:18,
            borderTop:"1px solid rgba(201,168,76,.1)",
            paddingTop:14,
            overflow:"hidden",
            animation:"cc-expand .38s cubic-bezier(.22,1,.36,1) both",
          }}>
            <div style={{
              fontFamily:"'Cormorant Garamond',Georgia,serif",
              fontSize:14, fontWeight:600,
              color:"rgba(245,230,184,.68)",
              letterSpacing:.5, marginBottom:10,
            }}>
              Manage Preferences
            </div>

            <div className="cc-scroll">
              {categories.map((cat, i) => (
                <div
                  key={cat.key}
                  className="cc-row"
                  style={{
                    borderBottom: i < categories.length - 1
                      ? "1px solid rgba(201,168,76,.07)"
                      : "none",
                  }}
                >
                  <div style={{ flex:1 }}>
                    <div style={{
                      fontSize:12.5, fontWeight:500,
                      color: cat.locked ? "rgba(201,168,76,.52)" : "rgba(245,240,232,.7)",
                      marginBottom:3, display:"flex", alignItems:"center", gap:8,
                    }}>
                      {cat.label}
                      {cat.locked && (
                        <span style={{
                          fontSize:9, letterSpacing:"1.3px",
                          textTransform:"uppercase",
                          color:"rgba(201,168,76,.35)",
                          background:"rgba(201,168,76,.08)",
                          border:"1px solid rgba(201,168,76,.15)",
                          borderRadius:4, padding:"1px 5px",
                        }}>
                          Always on
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:"rgba(245,240,232,.24)", lineHeight:1.55 }}>
                      {cat.desc}
                    </div>
                  </div>

                  <div
                    className={`cc-track${prefs[cat.key] || cat.locked ? " on" : ""}${cat.locked ? " locked" : ""}`}
                    onClick={() => !cat.locked && toggle(cat.key)}
                    role="switch"
                    aria-checked={prefs[cat.key] || cat.locked}
                    aria-label={cat.label}
                    tabIndex={cat.locked ? -1 : 0}
                    onKeyDown={(e) => e.key === "Enter" && !cat.locked && toggle(cat.key)}
                  >
                    <div className="cc-thumb" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Buttons ── */}
        <div style={{ display:"flex", gap:8, marginTop:20, flexWrap:"wrap" }}>
          <button
            className="cc-btn cc-btn-outline"
            onClick={() => setExpanded((v) => !v)}
            style={{ flex:"1 1 90px" }}
          >
            {expanded ? "Hide Options" : "Customise"}
          </button>

          <button
            className="cc-btn cc-btn-ghost"
            onClick={rejectAll}
            style={{ flex:"1 1 108px" }}
          >
            Reject Non‑Essential
          </button>

          <button
            className="cc-btn cc-btn-gold"
            onClick={expanded ? saveCustom : acceptAll}
            style={{ flex:"1.4 1 118px" }}
          >
            {expanded ? "Save Preferences" : "Accept All"}
          </button>
        </div>

        {/* Footer hint */}
        <p style={{
          fontSize:10.5,
          color:"rgba(245,240,232,.16)",
          textAlign:"center",
          margin:"14px 0 0",
          letterSpacing:.2,
        }}>
          Your choice is saved for 1 year — it won't appear again after logout.
        </p>
      </div>
    </>
  );
}