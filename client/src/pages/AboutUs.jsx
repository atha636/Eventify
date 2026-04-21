import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";

// ── Scroll-reveal hook ──
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Animated counter ──
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal(0.4);
  useEffect(() => {
    if (!visible) return;
    const num = parseFloat(target);
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(ease * num));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

export default function AboutUs() {
  const navigate = useNavigate();

  const [missionRef, missionVisible] = useReveal();
  const [valuesRef, valuesVisible] = useReveal();
  const [teamRef, teamVisible] = useReveal();
  const [statsRef, statsVisible] = useReveal();
  const [ctaRef, ctaVisible] = useReveal();
  const [vendorRef, vendorVisible] = useReveal();

  const values = [
    { emoji: "🤝", title: "Trust First", desc: "Every vendor on Evencers is manually verified. We only list professionals we'd trust with our own events." },
    { emoji: "✨", title: "Curated Excellence", desc: "We don't just list vendors — we curate talent. Quality over quantity, always." },
    { emoji: "⚡", title: "Effortless Booking", desc: "No calls, no back-and-forth. Book confirmed vendors in minutes, not days." },
    { emoji: "💛", title: "People Over Profit", desc: "We care deeply about both our clients and vendors. Fair pricing, fair exposure, fair treatment." },
    { emoji: "🌏", title: "India-First", desc: "Built in India, for Indian celebrations. We understand our culture, our chaos, our joy." },
    { emoji: "🔒", title: "Safe & Secure", desc: "Payments, data, and communication are all protected. Your peace of mind is our promise." },
  ];

  const team = [
    { initial: "A", name: "Akarsh", role: "Co-founder & CEO", desc: "Passionate about making luxury events accessible to everyone." },
    { initial: "S", name: "Akarsh", role: "Head of Vendor Relations", desc: "Bridging the gap between talented vendors and clients who deserve them." },
    { initial: "R", name: "Atharv Patidar", role: "CTO", desc: "Building the infrastructure that makes seamless bookings possible." },
    { initial: "P", name: "Atharv Patidar", role: "Head of Design", desc: "Ensuring every touchpoint feels as beautiful as the events we support." },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="au-root">
        <Navbar />

        {/* ── HERO ── */}
        <section className="au-hero">
          <div className="au-hero-bg">
            <div className="au-orb au-orb1" />
            <div className="au-orb au-orb2" />
            <div className="au-orb au-orb3" />
            <div className="au-grain" />
            <div className="au-grid-lines" />
          </div>

          <div className="au-hero-inner">
            <span className="au-hero-eyebrow">
              <span className="au-eyebrow-dot" />
              Our Story
            </span>
            <h1 className="au-hero-title">
              We believe every <br />
              <em>celebration deserves</em><br />
              a great team.
            </h1>
            <p className="au-hero-sub">
              Evencers was born from a simple frustration — finding reliable, talented event vendors in India was needlessly hard. We're here to change that.
            </p>
            <div className="au-hero-cta">
              <button className="au-btn-primary" onClick={() => navigate("/vendors")}>
                Explore Vendors <span className="au-btn-arrow">→</span>
              </button>
              <button className="au-btn-secondary" onClick={() => navigate("/register")}>
                Join as Vendor
              </button>
            </div>
          </div>

          {/* Decorative quote */}
          <div className="au-hero-quote" aria-hidden="true">
            <span className="au-quote-mark">"</span>
            <p>Every great event deserves a great team behind it.</p>
            <span className="au-quote-attr">— Evencers Founding Vision</span>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="au-stats-section" ref={statsRef}>
          <div className="au-stats-grid">
            {[
              { num: "1", suffix: "K+", label: "Happy Clients", sub: "across India" },
              { num: "150", suffix: "+", label: "Verified Vendors", sub: "manually screened" },
              { num: "10", suffix: "+", label: "Cities", sub: "and growing" },
              { num: "4", suffix: ".9★", label: "Average Rating", sub: "from real clients" },
            ].map((s, i) => (
              <div
                key={i}
                className={`au-stat-card au-reveal ${statsVisible ? "au-revealed" : ""}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <span className="au-stat-num">
                  <Counter target={s.num} suffix={s.suffix} />
                </span>
                <span className="au-stat-label">{s.label}</span>
                <span className="au-stat-sub">{s.sub}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── MISSION ── */}
        <section className="au-mission" ref={missionRef}>
          <div className="au-mission-inner">
            <div className={`au-mission-text au-reveal ${missionVisible ? "au-revealed" : ""}`}>
              <p className="au-eyebrow">Our Mission</p>
              <h2 className="au-section-title">Making magic <em>accessible</em></h2>
              <p className="au-body-text">
                In 2026, our founders tried planning a corporate event in Delhi. What should have taken a weekend ended up taking three weeks — calling vendors, chasing confirmations, getting ghosted, and settling for mediocre options.
              </p>
              <p className="au-body-text">
                We built Evencers so that no one ever has to experience that again. Our platform connects clients with India's finest verified event professionals — from decorators and photographers to caterers and musicians — all in one seamless experience.
              </p>
              <p className="au-body-text">
                Today, Evencers powers thousands of weddings, birthdays, corporate events, and private celebrations every month. And we're just getting started.
              </p>
            </div>
            <div className={`au-mission-visual au-reveal ${missionVisible ? "au-revealed" : ""}`} style={{ transitionDelay: "0.2s" }}>
              <div className="au-visual-card au-vc1">
                <span className="au-vc-emoji">🎊</span>
                <span className="au-vc-text">100+ events powered</span>
              </div>
              <div className="au-visual-card au-vc2">
                <span className="au-vc-emoji">🏆</span>
                <span className="au-vc-text">Best Event Platform 2026</span>
              </div>
              <div className="au-visual-card au-vc3">
                <span className="au-vc-num">3 min</span>
                <span className="au-vc-text">avg. booking time</span>
              </div>
              <div className="au-mission-orb" />
            </div>
          </div>
        </section>

        {/* ── VALUES ── */}
        <section className="au-values-section" ref={valuesRef}>
          <div className="au-section-wrap">
            <div className={`au-section-header au-reveal ${valuesVisible ? "au-revealed" : ""}`}>
              <p className="au-eyebrow">What we stand for</p>
              <h2 className="au-section-title">Our Values</h2>
              <p className="au-section-sub">The principles that guide every decision we make</p>
            </div>
            <div className="au-values-grid">
              {values.map((v, i) => (
                <div
                  key={i}
                  className={`au-value-card au-reveal ${valuesVisible ? "au-revealed" : ""}`}
                  style={{ transitionDelay: `${i * 0.08}s` }}
                >
                  <span className="au-value-emoji">{v.emoji}</span>
                  <h3 className="au-value-title">{v.title}</h3>
                  <p className="au-value-desc">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOR VENDORS ── */}
        <section className="au-vendor-section" ref={vendorRef}>
          <div className="au-vendor-orb1" />
          <div className="au-vendor-orb2" />
          <div className="au-vendor-inner">
            <div className={`au-vendor-content au-reveal ${vendorVisible ? "au-revealed" : ""}`}>
              <p className="au-eyebrow" style={{ color: "var(--gold)" }}>For Vendors</p>
              <h2 className="au-section-title" style={{ color: "var(--cream)" }}>
                Grow your business <em>with us</em>
              </h2>
              <p className="au-body-text" style={{ color: "rgba(245,240,232,0.6)" }}>
                We're not just a platform for clients — we're a launchpad for talented vendors. Whether you're an established studio or just starting out, Evencers gives you the visibility, tools, and bookings to grow.
              </p>
              <ul className="au-vendor-perks">
                {[
                  "Free listing with verified badge",
                  "Instant booking notifications",
                  "Dashboard to manage all inquiries",
                  "minimum commission on your first 10 bookings",
                  "Dedicated vendor support team",
                ].map((perk, i) => (
                  <li key={i} className="au-vendor-perk">
                    <span className="au-perk-check">✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
              <button className="au-btn-primary" onClick={() => navigate("/register")}>
                Join as a Vendor <span className="au-btn-arrow">→</span>
              </button>
            </div>
            <div className={`au-vendor-stats au-reveal ${vendorVisible ? "au-revealed" : ""}`} style={{ transitionDelay: "0.2s" }}>
              {[
                { num: "850", suffix: "+", label: "Active Vendors" },
                { num: "94", suffix: "%", label: "Vendor Satisfaction" },
                { num: "48", suffix: "hr", label: "Avg. First Booking" },
              ].map((s, i) => (
                <div key={i} className="au-vendor-stat">
                  <span className="au-vs-num">
                    <Counter target={s.num} suffix={s.suffix} />
                  </span>
                  <span className="au-vs-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TEAM ── */}
        <section className="au-team-section" ref={teamRef}>
          <div className="au-section-wrap">
            <div className={`au-section-header au-reveal ${teamVisible ? "au-revealed" : ""}`}>
              <p className="au-eyebrow">The people behind Evencers</p>
              <h2 className="au-section-title">Meet the Team</h2>
              <p className="au-section-sub">A small, passionate team building India's best event platform</p>
            </div>
            <div className="au-team-grid">
              {team.map((member, i) => (
                <div
                  key={i}
                  className={`au-team-card au-reveal ${teamVisible ? "au-revealed" : ""}`}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="au-team-avatar">{member.initial}</div>
                  <h3 className="au-team-name">{member.name}</h3>
                  <span className="au-team-role">{member.role}</span>
                  <p className="au-team-desc">{member.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="au-cta" ref={ctaRef}>
          <div className="au-cta-orb1" />
          <div className="au-cta-orb2" />
          <div className={`au-cta-inner au-reveal ${ctaVisible ? "au-revealed" : ""}`}>
            <p className="au-eyebrow" style={{ color: "var(--gold)" }}>Ready to begin?</p>
            <h2 className="au-cta-title">Your next great event starts here.</h2>
            <p className="au-cta-sub">
              Join over 1000 clients who planned their perfect day with Evencers.
            </p>
            <div className="au-cta-btns">
              <button className="au-btn-primary au-btn-lg" onClick={() => navigate("/register")}>
                <span>Get Started Free</span>
                <span className="au-btn-arrow">→</span>
              </button>
              <button className="au-btn-secondary au-btn-lg" onClick={() => navigate("/vendors")}>
                Browse Vendors
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="au-footer">
          <div className="au-footer-logo"><Logo/>Evencers</div>
          <p className="au-footer-copy">© 2025 Evencers. Crafted with care in India.</p>
          <div className="au-footer-links">
            {["Home", "Vendors", "About", "Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="au-footer-link">{l}</a>
            ))}
          </div>
          <div className="au-footer-contact">
            <a href="mailto:admineventify2005@gmail.com" className="au-footer-contact-link">
              ✉ admineventify2005@gmail.com
            </a>
            <span className="au-footer-sep">·</span>
            <a href="tel:+917023017517" className="au-footer-contact-link">
              📞 +91 70230 17517
            </a>
            <span className="au-footer-sep">·</span>
            <a
              href="https://wa.me/917023017517?text=Hello%20Evencers%20Support"
              target="_blank"
              rel="noreferrer"
              className="au-footer-contact-link"
            >
              💬 WhatsApp
            </a>
          </div>
          <p className="au-footer-hours">Mon – Sat · 10:00 AM – 7:00 PM IST</p>
        </footer>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --gold-glow: rgba(201,168,76,0.18);
    --muted: #7a7265;
    --border: rgba(201,168,76,0.2);
    --surface: #faf7f2;
    --white: #ffffff;
  }

  .au-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── REVEAL ── */
  .au-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.65s cubic-bezier(.22,1,.36,1), transform 0.65s cubic-bezier(.22,1,.36,1);
    will-change: opacity, transform;
  }
  .au-revealed { opacity: 1; transform: translateY(0); }

  /* ── HERO ── */
  .au-hero {
    position: relative;
    background: var(--ink);
    overflow: hidden;
    padding: 140px 20px 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 92svh;
  }

  .au-hero-bg { position: absolute; inset: 0; pointer-events: none; }

  .au-grid-lines {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%);
  }

  .au-orb {
    position: absolute; border-radius: 50%;
    filter: blur(90px); opacity: 0.18;
    animation: auOrbPulse 8s ease-in-out infinite alternate;
    will-change: transform;
  }
  .au-orb1 { width: 500px; height: 500px; background: var(--gold); top: -140px; left: -80px; }
  .au-orb2 { width: 400px; height: 400px; background: #7b5ea7; top: -60px; right: -60px; animation-delay: -2s; }
  .au-orb3 { width: 280px; height: 280px; background: var(--gold); bottom: 60px; left: 38%; opacity: 0.09; animation-delay: -4s; }

  @keyframes auOrbPulse {
    from { transform: scale(1) translate(0,0); }
    to   { transform: scale(1.12) translate(16px,-16px); }
  }

  .au-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.5;
  }

  .au-hero-inner {
    position: relative; z-index: 2;
    text-align: center; max-width: 740px; width: 100%;
    animation: auHeroEnter 0.8s cubic-bezier(.22,1,.36,1) both;
  }

  @keyframes auHeroEnter {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .au-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 22px;
    border: 1px solid rgba(201,168,76,0.3); padding: 6px 14px;
    border-radius: 24px; background: rgba(201,168,76,0.07);
  }

  .au-eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold);
    animation: auDotBlink 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes auDotBlink {
    0%,100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.4; transform: scale(0.6); }
  }

  .au-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.4rem, 6.5vw, 4.6rem);
    font-weight: 300; color: var(--white);
    line-height: 1.1; margin-bottom: 22px;
    animation: auHeroEnter 0.8s 0.12s cubic-bezier(.22,1,.36,1) both;
  }
  .au-hero-title em { font-style: italic; color: var(--gold-light); }

  .au-hero-sub {
    font-size: 14.5px; color: rgba(245,240,232,0.56); line-height: 1.78;
    margin-bottom: 36px; max-width: 500px; margin-left: auto; margin-right: auto;
    animation: auHeroEnter 0.8s 0.22s cubic-bezier(.22,1,.36,1) both;
  }

  .au-hero-cta {
    display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
    animation: auHeroEnter 0.8s 0.3s cubic-bezier(.22,1,.36,1) both;
  }

  /* Decorative quote — bottom right */
  .au-hero-quote {
    position: absolute; bottom: 40px; right: 48px;
    text-align: right; z-index: 2; max-width: 260px;
    display: flex; flex-direction: column; gap: 4px;
    animation: auHeroEnter 0.8s 0.5s cubic-bezier(.22,1,.36,1) both;
  }
  .au-quote-mark {
    font-family: 'Cormorant Garamond', serif;
    font-size: 4rem; color: rgba(201,168,76,0.25); line-height: 0.6;
  }
  .au-hero-quote p {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.95rem; font-style: italic; color: rgba(245,240,232,0.35);
    line-height: 1.5;
  }
  .au-quote-attr {
    font-size: 10px; letter-spacing: 0.1em; color: rgba(201,168,76,0.35);
    text-transform: uppercase;
  }
  @media (max-width: 768px) { .au-hero-quote { display: none; } }

  /* ── BUTTONS ── */
  .au-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 26px; background: var(--gold); color: var(--ink);
    border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; font-weight: 500; cursor: pointer;
    transition: transform 0.25s, box-shadow 0.25s, background 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .au-btn-primary:active { transform: scale(0.97); }
  @media (hover: hover) {
    .au-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(201,168,76,0.35); }
    .au-btn-primary:hover .au-btn-arrow { transform: translateX(4px); }
  }
  .au-btn-arrow { display: inline-block; transition: transform 0.25s; }

  .au-btn-secondary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 26px; background: transparent; color: var(--white);
    border: 1px solid rgba(245,240,232,0.22); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .au-btn-secondary:active { transform: scale(0.97); }
  @media (hover: hover) {
    .au-btn-secondary:hover { border-color: var(--gold); color: var(--gold); transform: translateY(-2px); }
  }
  .au-btn-lg { padding: 15px 32px; font-size: 14px; }

  /* ── STATS ── */
  .au-stats-section {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 0;
  }
  .au-stats-grid {
    max-width: 1100px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(4,1fr);
  }
  @media (max-width: 680px) { .au-stats-grid { grid-template-columns: repeat(2,1fr); } }

  .au-stat-card {
    padding: 36px 24px; text-align: center;
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 4px;
  }
  .au-stat-card:last-child { border-right: none; }
  @media (max-width: 680px) {
    .au-stat-card:nth-child(2) { border-right: none; }
    .au-stat-card:nth-child(3) { border-right: 1px solid var(--border); }
    .au-stat-card { border-top: 1px solid var(--border); }
    .au-stat-card:nth-child(1),.au-stat-card:nth-child(2) { border-top: none; }
  }
  .au-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 600;
    color: var(--gold); line-height: 1;
  }
  .au-stat-label {
    font-size: 13px; font-weight: 500; color: var(--ink); margin-top: 4px;
  }
  .au-stat-sub { font-size: 11px; color: var(--muted); }

  /* ── SECTION COMMONS ── */
  .au-section-wrap { max-width: 1100px; margin: 0 auto; padding: 80px 20px; }
  .au-section-header { text-align: center; margin-bottom: 48px; }
  .au-eyebrow {
    display: block; font-size: 10px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 10px;
  }
  .au-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.8rem, 4vw, 2.9rem); font-weight: 300; color: var(--ink);
    margin-bottom: 8px;
  }
  .au-section-title em { font-style: italic; color: var(--gold); }
  .au-section-sub { font-size: 13.5px; color: var(--muted); }
  .au-body-text {
    font-size: 14px; color: var(--muted); line-height: 1.8; margin-bottom: 18px;
  }

  /* ── MISSION ── */
  .au-mission {
    background: var(--surface);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 80px 20px;
  }
  .au-mission-inner {
    max-width: 1100px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
  }
  @media (max-width: 840px) {
    .au-mission-inner { grid-template-columns: 1fr; gap: 40px; }
  }
  .au-mission-text .au-section-title { color: var(--ink); text-align: left; }
  .au-mission-text .au-eyebrow { text-align: left; }

  .au-mission-visual {
    position: relative; height: 340px;
  }
  .au-visual-card {
    position: absolute;
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 16px 20px;
    display: flex; flex-direction: column; gap: 4px;
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 28px rgba(14,12,10,0.08);
  }
  .au-vc-emoji { font-size: 1.6rem; margin-bottom: 4px; }
  .au-vc-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 600; color: var(--gold); line-height: 1;
  }
  .au-vc-text { font-size: 12px; color: var(--muted); }
  .au-vc1 { top: 0; left: 0; animation: auFloat1 6s ease-in-out infinite; }
  .au-vc2 { top: 30px; right: 0; animation: auFloat2 7s ease-in-out infinite; }
  .au-vc3 { bottom: 20px; left: 30px; animation: auFloat3 5.5s ease-in-out infinite; }

  .au-mission-orb {
    position: absolute; width: 220px; height: 220px;
    background: var(--gold); border-radius: 50%;
    filter: blur(80px); opacity: 0.08;
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    pointer-events: none;
  }

  @keyframes auFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
  @keyframes auFloat2 { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-10px) rotate(-1deg)} }
  @keyframes auFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

  @media (max-width: 840px) {
    .au-mission-visual { height: 220px; }
    .au-vc1 { top: 0; left: 0; }
    .au-vc2 { top: 20px; right: 0; }
    .au-vc3 { bottom: 0; left: 20px; }
  }

  /* ── VALUES ── */
  .au-values-section { background: var(--cream); }
  .au-values-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 16px;
  }
  @media (max-width: 860px) { .au-values-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 480px) { .au-values-grid { grid-template-columns: 1fr; } }

  .au-value-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 26px 22px;
    transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s, border-color 0.3s;
    cursor: default;
  }
  @media (hover: hover) {
    .au-value-card:hover {
      border-color: var(--gold); transform: translateY(-4px);
      box-shadow: 0 14px 36px rgba(201,168,76,0.1);
    }
  }
  .au-value-emoji { font-size: 1.8rem; display: block; margin-bottom: 14px; }
  .au-value-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600; color: var(--ink); margin-bottom: 8px;
  }
  .au-value-desc { font-size: 13px; color: var(--muted); line-height: 1.7; }

  /* ── VENDOR SECTION ── */
  .au-vendor-section {
    background: var(--ink); padding: 80px 20px;
    position: relative; overflow: hidden;
  }
  .au-vendor-orb1 {
    position: absolute; width: 420px; height: 420px;
    background: var(--gold); border-radius: 50%; filter: blur(110px); opacity: 0.07;
    top: 50%; left: 30%; transform: translate(-50%,-50%);
    pointer-events: none;
  }
  .au-vendor-orb2 {
    position: absolute; width: 280px; height: 280px;
    background: #7b5ea7; border-radius: 50%; filter: blur(80px); opacity: 0.08;
    top: 10%; right: 5%;
    pointer-events: none;
  }
  .au-vendor-inner {
    max-width: 1100px; margin: 0 auto; position: relative; z-index: 1;
    display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
  }
  @media (max-width: 840px) {
    .au-vendor-inner { grid-template-columns: 1fr; gap: 40px; }
  }
  .au-vendor-content .au-section-title { text-align: left; }
  .au-vendor-content .au-eyebrow { text-align: left; }

  .au-vendor-perks { list-style: none; display: flex; flex-direction: column; gap: 10px; margin: 22px 0 30px; }
  .au-vendor-perk {
    display: flex; align-items: center; gap: 10px;
    font-size: 13.5px; color: rgba(245,240,232,0.7);
  }
  .au-perk-check {
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.3);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; color: var(--gold); flex-shrink: 0;
  }

  .au-vendor-stats {
    display: flex; flex-direction: column; gap: 0;
    border: 1px solid rgba(201,168,76,0.15); border-radius: 16px; overflow: hidden;
    background: rgba(255,255,255,0.03);
  }
  .au-vendor-stat {
    padding: 28px 32px; display: flex; flex-direction: column; gap: 4px;
    border-bottom: 1px solid rgba(201,168,76,0.1);
  }
  .au-vendor-stat:last-child { border-bottom: none; }
  .au-vs-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.4rem; font-weight: 600; color: var(--gold); line-height: 1;
  }
  .au-vs-label { font-size: 12.5px; color: rgba(245,240,232,0.45); letter-spacing: 0.04em; }

  /* ── TEAM ── */
  .au-team-section { background: var(--surface); border-top: 1px solid var(--border); }
  .au-team-grid {
    display: grid; grid-template-columns: repeat(4,1fr); gap: 16px;
  }
  @media (max-width: 900px) { .au-team-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 480px) { .au-team-grid { grid-template-columns: 1fr; } }

  .au-team-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 28px 22px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
  }
  @media (hover: hover) {
    .au-team-card:hover {
      border-color: var(--gold); transform: translateY(-4px);
      box-shadow: 0 14px 36px rgba(201,168,76,0.1);
    }
  }
  .au-team-avatar {
    width: 60px; height: 60px; background: var(--ink); color: var(--gold);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600;
    border: 2px solid rgba(201,168,76,0.3); margin-bottom: 6px;
    flex-shrink: 0;
  }
  .au-team-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 600; color: var(--ink);
  }
  .au-team-role {
    font-size: 11px; color: var(--gold); letter-spacing: 0.08em;
    text-transform: uppercase; font-weight: 500;
  }
  .au-team-desc { font-size: 12.5px; color: var(--muted); line-height: 1.6; margin-top: 4px; }

  /* ── CTA ── */
  .au-cta {
    position: relative; overflow: hidden; text-align: center;
    padding: 100px 20px; background: var(--ink);
  }
  .au-cta-orb1 {
    position: absolute; width: 420px; height: 420px;
    background: var(--gold); border-radius: 50%; filter: blur(100px); opacity: 0.09;
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    pointer-events: none;
    animation: auOrbPulse 7s ease-in-out infinite alternate;
  }
  .au-cta-orb2 {
    position: absolute; width: 260px; height: 260px;
    background: #7b5ea7; border-radius: 50%; filter: blur(90px); opacity: 0.1;
    top: 10%; right: 10%;
    pointer-events: none;
    animation: auOrbPulse 9s ease-in-out infinite alternate-reverse;
  }
  .au-cta-inner { position: relative; z-index: 1; }
  .au-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 300; color: var(--white);
    margin: 10px 0 14px;
  }
  .au-cta-sub {
    font-size: 13.5px; color: rgba(245,240,232,0.45);
    margin-bottom: 38px; max-width: 400px; margin-left: auto; margin-right: auto;
  }
  .au-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  /* ── FOOTER ── */
  .au-footer {
    background: #0a0806; padding: 36px 20px; text-align: center;
    display: flex; flex-direction: column; gap: 12px; align-items: center;
    border-top: 1px solid rgba(201,168,76,0.1);
  }
  .au-footer-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 600; color: var(--gold);
    letter-spacing: 0.2em; text-transform: uppercase;
  }
  .au-footer-copy { font-size: 11.5px; color: rgba(122,114,101,0.55); }
  .au-footer-links { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
  .au-footer-link {
    font-size: 12px; color: var(--muted); text-decoration: none; transition: color 0.2s;
  }
  .au-footer-link:hover { color: var(--gold); }
  .au-footer-contact {
    display: flex; align-items: center; gap: 10px;
    flex-wrap: wrap; justify-content: center;
    border-top: 1px solid rgba(201,168,76,0.08);
    padding-top: 12px; width: 100%;
  }
  .au-footer-contact-link {
    font-size: 12px; color: var(--muted); text-decoration: none; transition: color 0.2s;
  }
  .au-footer-contact-link:hover { color: var(--gold); }
  .au-footer-sep { color: rgba(201,168,76,0.25); font-size: 12px; }
  .au-footer-hours { font-size: 11px; color: rgba(122,114,101,0.4); letter-spacing: 0.04em; }

  /* ── MOBILE ── */
  @media (max-width: 480px) {
    .au-hero { padding: 110px 16px 80px; min-height: 80svh; }
    .au-section-wrap { padding: 56px 16px; }
    .au-mission { padding: 56px 16px; }
    .au-vendor-section { padding: 56px 16px; }
    .au-cta { padding: 72px 16px; }
    .au-cta-btns { flex-direction: column; align-items: center; }
    .au-btn-lg { width: 100%; max-width: 300px; justify-content: center; }
    .au-footer-sep { display: none; }
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .au-reveal { transition: none; }
    .au-orb, .au-eyebrow-dot, .au-vc1, .au-vc2, .au-vc3 { animation: none; }
  }
`;