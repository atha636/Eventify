import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Logo from "../components/Logo";

const BENEFITS = [
  {
    icon: "✦",
    title: "Verified Exposure",
    body: "Get discovered by thousands of clients actively searching for trusted event vendors in your category.",
  },
  {
    icon: "◈",
    title: "Seamless Bookings",
    body: "Receive, approve, and manage all bookings from one clean dashboard — no back-and-forth needed.",
  },
  {
    icon: "⬡",
    title: "Secure Payments",
    body: "Every transaction is processed securely. Get paid reliably with full payment tracking built in.",
  },
  {
    icon: "◎",
    title: "Availability Control",
    body: "Own your calendar — block out dates so clients only book you when you're truly available.",
  },
  {
    icon: "❋",
    title: "Showcase Your Work",
    body: "Upload photos, define packages, and craft descriptions that make your offering stand out.",
  },
  {
    icon: "⟡",
    title: "Instant Notifications",
    body: "Real-time email alerts for new bookings, payment updates, and date-change requests.",
  },
];

const STEPS = [
  { num: "01", label: "Your account is live", done: true },
  { num: "02", label: "Add your first service" },
  { num: "03", label: "Set your availability" },
  { num: "04", label: "Start accepting bookings" },
];

export default function VendorWelcome() {
  const navigate = useNavigate();
  const btnRef   = useRef(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Staggered card reveal handled by CSS animation-delay
    btnRef.current?.focus();
  }, []);

  const handleContinue = async () => {
    setLeaving(true);
    try {
      await API.post("/auth/vendor/seen-welcome");
    } catch {
      // non-blocking
    }
    setTimeout(() => navigate("/vendor/dashboard"), 400);
  };

  return (
    <>
      <style>{styles}</style>
      <div className={`vw-root${leaving ? " vw-leaving" : ""}`}>

        {/* ── BACKGROUND ORNAMENTS ── */}
        <div className="vw-bg" aria-hidden="true">
          <div className="vw-orb vw-orb-1" />
          <div className="vw-orb vw-orb-2" />
          <div className="vw-orb vw-orb-3" />
          <div className="vw-grid-lines" />
        </div>

        {/* ── NAV ── */}
        <header className="vw-nav">
          <div className="vw-nav-logo">
            <Logo />
            <span>Evencers</span>
          </div>
          <span className="vw-nav-pill">Vendor Portal</span>
        </header>

        <main className="vw-main">

          {/* ── HERO ── */}
          <section className="vw-hero">
            <div className="vw-hero-badge">
              <span className="vw-hero-badge-dot" aria-hidden="true" />
              Account activated
            </div>
            <h1 className="vw-hero-title">
              Welcome to<br />
              <span className="vw-hero-accent">Evencers</span>
            </h1>
            <p className="vw-hero-sub">
              Your vendor account is ready. Here's what you get as an Evencers partner.
            </p>
          </section>

          {/* ── BENEFITS GRID ── */}
          <section className="vw-benefits" aria-labelledby="benefits-title">
            <h2 id="benefits-title" className="vw-section-label">Why vendors choose us</h2>
            <div className="vw-grid" role="list">
              {BENEFITS.map((b, i) => (
                <article
                  key={b.title}
                  className="vw-card"
                  role="listitem"
                  style={{ animationDelay: `${0.1 + i * 0.07}s` }}
                >
                  <span className="vw-card-icon" aria-hidden="true">{b.icon}</span>
                  <h3 className="vw-card-title">{b.title}</h3>
                  <p className="vw-card-body">{b.body}</p>
                </article>
              ))}
            </div>
          </section>

          {/* ── GET STARTED STEPS ── */}
          <section className="vw-steps-section" aria-labelledby="steps-title">
            <h2 id="steps-title" className="vw-section-label">Your path to first booking</h2>
            <ol className="vw-steps" aria-label="Getting started steps">
              {STEPS.map((s, i) => (
                <li
                  key={s.num}
                  className={`vw-step${s.done ? " vw-step-done" : ""}`}
                  style={{ animationDelay: `${0.5 + i * 0.08}s` }}
                >
                  <div className="vw-step-num" aria-hidden="true">
                    {s.done ? "✓" : s.num}
                  </div>
                  <span className="vw-step-label">{s.label}</span>
                  {i < STEPS.length - 1 && (
                    <div className="vw-step-connector" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* ── CTA ── */}
          <div className="vw-cta-wrap">
            <button
              ref={btnRef}
              className="vw-cta-btn"
              onClick={handleContinue}
              aria-label="Continue to your vendor dashboard"
            >
              <span>Go to my Dashboard</span>
              <span className="vw-cta-arrow" aria-hidden="true">→</span>
            </button>
            <p className="vw-cta-note">You can revisit this guide anytime from Help in the dashboard.</p>
          </div>

        </main>

        {/* ── FOOTER ── */}
        <footer className="vw-footer">
          <p>© {new Date().getFullYear()} Evencers. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES — matches VendorDashboard's Cormorant + DM Sans palette
// ═══════════════════════════════════════════════════════════════
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:        #0e0c0a;
    --cream:      #f5f0e8;
    --gold:       #c9a84c;
    --gold-dim:   rgba(201,168,76,0.15);
    --gold-border:rgba(201,168,76,0.25);
    --muted:      #7a7265;
    --surface:    #faf7f2;
    --white:      #ffffff;
    --green:      #2d6a4f;
    --radius-md:  10px;
    --radius-lg:  18px;
  }

  /* ── ROOT ── */
  .vw-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
    position: relative;
    overflow-x: hidden;
    animation: vwFadeIn 0.5s ease both;
  }
  .vw-leaving { animation: vwFadeOut 0.4s ease forwards; }

  /* ── BACKGROUND ── */
  .vw-bg {
    position: fixed; inset: 0;
    pointer-events: none; z-index: 0; overflow: hidden;
  }
  .vw-orb {
    position: absolute; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
  }
  .vw-orb-1 { width: 800px; height: 800px; top: -300px; right: -200px; }
  .vw-orb-2 { width: 600px; height: 600px; bottom: -100px; left: -200px; }
  .vw-orb-3 { width: 300px; height: 300px; top: 40%; left: 40%; }

  .vw-grid-lines {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 64px 64px;
  }

  /* ── NAV ── */
  .vw-nav {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 48px;
    border-bottom: 1px solid var(--gold-border);
    background: rgba(245,240,232,0.85);
    backdrop-filter: blur(10px);
  }
  .vw-nav-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600;
    color: var(--ink); letter-spacing: 0.15em; text-transform: uppercase;
    display: flex; align-items: center; gap: 8px;
  }
  .vw-nav-pill {
    font-size: 11px; font-weight: 500; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--gold);
    background: var(--gold-dim); border: 1px solid var(--gold-border);
    padding: 5px 14px; border-radius: 20px;
  }
  @media (max-width: 600px) {
    .vw-nav { padding: 16px 20px; }
  }

  /* ── MAIN ── */
  .vw-main {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
    padding: 72px 48px 80px;
  }
  @media (max-width: 768px) { .vw-main { padding: 48px 20px 64px; } }

  /* ── HERO ── */
  .vw-hero {
    text-align: center;
    margin-bottom: 72px;
    animation: vwSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
  }
  .vw-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 500; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--green);
    background: rgba(45,106,79,0.08); border: 1px solid rgba(45,106,79,0.22);
    padding: 6px 16px; border-radius: 20px; margin-bottom: 28px;
  }
  .vw-hero-badge-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 0 3px rgba(45,106,79,0.2);
    animation: vwPulse 2s ease infinite;
  }
  .vw-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(3rem, 7vw, 5.5rem);
    font-weight: 300; line-height: 1.08;
    color: var(--ink);
    margin-bottom: 22px;
    letter-spacing: -0.01em;
  }
  .vw-hero-accent {
    font-style: italic; color: var(--gold);
    font-weight: 400;
  }
  .vw-hero-sub {
    font-size: 16px; color: var(--muted); line-height: 1.7;
    max-width: 520px; margin: 0 auto;
  }

  /* ── SECTION LABEL ── */
  .vw-section-label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold);
    margin-bottom: 28px;
    display: flex; align-items: center; gap: 12px;
  }
  .vw-section-label::after {
    content: ''; flex: 1; height: 1px;
    background: var(--gold-border);
  }

  /* ── BENEFITS ── */
  .vw-benefits { margin-bottom: 72px; }
  .vw-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  @media (max-width: 900px) { .vw-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 560px) { .vw-grid { grid-template-columns: 1fr; } }

  .vw-card {
    background: var(--white);
    border: 1px solid var(--gold-border);
    border-radius: var(--radius-lg);
    padding: 28px 24px;
    transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
    animation: vwSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both;
    opacity: 0;
    animation-fill-mode: forwards;
  }
  .vw-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(14,12,10,0.09);
    border-color: rgba(201,168,76,0.45);
  }
  .vw-card-icon {
    display: block; font-size: 1.4rem;
    color: var(--gold); margin-bottom: 16px;
    line-height: 1;
  }
  .vw-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600;
    color: var(--ink); margin-bottom: 10px;
  }
  .vw-card-body {
    font-size: 13.5px; color: var(--muted); line-height: 1.7;
  }

  /* ── STEPS ── */
  .vw-steps-section { margin-bottom: 72px; }
  .vw-steps {
    list-style: none;
    display: flex; align-items: flex-start;
    gap: 0; position: relative;
  }
  @media (max-width: 600px) {
    .vw-steps { flex-direction: column; gap: 16px; }
  }

  .vw-step {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    text-align: center; position: relative;
    animation: vwSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
    opacity: 0; animation-fill-mode: forwards;
  }
  .vw-step-num {
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--surface);
    border: 1.5px solid var(--gold-border);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 600; color: var(--muted);
    margin-bottom: 14px; position: relative; z-index: 1;
    transition: all 0.2s;
  }
  .vw-step-done .vw-step-num {
    background: rgba(45,106,79,0.1);
    border-color: rgba(45,106,79,0.4);
    color: var(--green);
  }
  .vw-step-label {
    font-size: 13px; font-weight: 500; color: var(--ink);
    line-height: 1.4; max-width: 120px;
  }
  .vw-step-done .vw-step-label { color: var(--green); }

  .vw-step-connector {
    position: absolute; top: 26px; left: calc(50% + 26px);
    right: calc(-50% + 26px);
    height: 1px;
    background: linear-gradient(90deg, var(--gold-border), var(--gold-border));
    z-index: 0;
  }
  @media (max-width: 600px) {
    .vw-step { flex-direction: row; align-items: flex-start; text-align: left; gap: 16px; }
    .vw-step-num { flex-shrink: 0; margin-bottom: 0; }
    .vw-step-connector { display: none; }
    .vw-step-label { max-width: 100%; padding-top: 14px; }
  }

  /* ── CTA ── */
  .vw-cta-wrap {
    text-align: center;
    animation: vwSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.75s both;
  }
  .vw-cta-btn {
    display: inline-flex; align-items: center; gap: 12px;
    padding: 18px 48px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: var(--radius-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 500;
    cursor: pointer; letter-spacing: 0.03em;
    transition: all 0.25s ease;
    margin-bottom: 16px;
  }
  .vw-cta-btn:hover {
    background: var(--gold); color: var(--ink);
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(201,168,76,0.35);
  }
  .vw-cta-btn:focus-visible {
    outline: 2px solid var(--gold); outline-offset: 3px;
  }
  .vw-cta-arrow {
    font-size: 18px; transition: transform 0.2s;
  }
  .vw-cta-btn:hover .vw-cta-arrow { transform: translateX(4px); }
  .vw-cta-note {
    font-size: 12px; color: var(--muted);
  }

  /* ── FOOTER ── */
  .vw-footer {
    position: relative; z-index: 1;
    text-align: center;
    padding: 20px 48px;
    border-top: 1px solid var(--gold-border);
    font-size: 11.5px; color: var(--muted);
  }

  /* ── KEYFRAMES ── */
  @keyframes vwFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes vwFadeOut { from { opacity: 1; } to { opacity: 0; transform: scale(0.98); } }
  @keyframes vwSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes vwPulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(45,106,79,0.2); }
    50%       { box-shadow: 0 0 0 6px rgba(45,106,79,0.08); }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
`;