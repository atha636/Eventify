import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import CustomerCarePopup from "../components/CustomerCarePopup";

// ── Floating particle canvas ──
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const particles = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.35,
        o: Math.random() * 0.5 + 0.15,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.o})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

// ── Scroll-reveal hook ──
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
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
  const [ref, visible] = useReveal(0.5);
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

// ── Typewriter ──
function Typewriter({ words }) {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[idx % words.length];
    let timeout;
    if (!deleting && chars < word.length) {
      timeout = setTimeout(() => setChars((c) => c + 1), 80);
    } else if (!deleting && chars === word.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && chars > 0) {
      timeout = setTimeout(() => setChars((c) => c - 1), 45);
    } else if (deleting && chars === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % words.length);
    }
    return () => clearTimeout(timeout);
  }, [chars, deleting, idx, words]);
  return (
    <span className="hm-typewriter">
      {words[idx % words.length].slice(0, chars)}
      <span className="hm-cursor">|</span>
    </span>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const services = [
    { name: "Decor", type: "decor", emoji: "🎨", desc: "Transform any space into something magical", count: "240+ vendors", color: "#a78bfa" },
    { name: "Photography", type: "photography", emoji: "📸", desc: "Capture every moment, forever preserved", count: "180+ vendors", color: "#f59e0b" },
    { name: "Catering", type: "catering", emoji: "🍽", desc: "Exquisite menus crafted for your occasion", count: "130+ vendors", color: "#34d399" },
    { name: "Music & DJ", type: "music", emoji: "🎵", desc: "Set the perfect mood for your celebration", count: "95+ vendors", color: "#f87171" },
    { name: "Florals", type: "florals", emoji: "💐", desc: "Blooms that breathe life into every event", count: "110+ vendors", color: "#fb7185" },
    { name: "Venues", type: "venues", emoji: "🏛", desc: "Iconic spaces for unforgettable gatherings", count: "75+ vendors", color: "#38bdf8" },
  ];

  const testimonials = [
    { name: "Priya S.", event: "Wedding · Delhi", text: "Found our photographer and decorator within an hour. Absolutely seamless experience.", avatar: "P" },
    { name: "Rohan M.", event: "Corporate · Mumbai", text: "The vendor quality is exceptional. Our product launch was a massive success.", avatar: "R" },
    { name: "Ananya K.", event: "Birthday · Bangalore", text: "I was overwhelmed planning alone. Eventify made it feel effortless and fun.", avatar: "A" },
  ];

  const [servicesRef, servicesVisible] = useReveal();
  const [howRef, howVisible] = useReveal();
  const [testRef, testVisible] = useReveal();
  const [ctaRef, ctaVisible] = useReveal();
  const [searchVal, setSearchVal] = useState("");

  return (
    <>
      <style>{styles}</style>
      <div className="hm-root">
        <Navbar />

        {/* ── HERO ── */}
        <section className="hm-hero">
          <div className="hm-hero-bg">
            <div className="hm-orb hm-orb1" />
            <div className="hm-orb hm-orb2" />
            <div className="hm-orb hm-orb3" />
            <div className="hm-orb hm-orb4" />
            <div className="hm-grain" />
            <div className="hm-grid-lines" />
          </div>
          <ParticleCanvas />

          <div className="hm-hero-inner">
            <span className="hm-hero-eyebrow">
              <span className="hm-eyebrow-dot" />
              India's Premier Event Platform
            </span>
            <h1 className="hm-hero-title">
              Every great event<br />
              <em>deserves </em>
              <Typewriter words={["greatness.", "perfection.", "magic.", "a great team."]} />
            </h1>
            <p className="hm-hero-sub">
              Discover verified vendors for decoration, photography, catering, and more —
              all curated for your perfect occasion.
            </p>

            <div className="hm-hero-search">
              <span className="hm-search-icon">⌕</span>
              <input
                className="hm-search-input"
                placeholder="Search vendors, services, locations…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/search?q=${searchVal}`)}
              />
              <button className="hm-search-btn" onClick={() => navigate("/vendors")}>
                Explore →
              </button>
            </div>

            <div className="hm-hero-pills">
              {["Weddings", "Birthdays", "Corporate", "Anniversaries"].map((t) => (
                <span
                  key={t}
                  className="hm-pill"
                  onClick={() => navigate(`/category/${t.toLowerCase()}`)}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Floating cards */}
          <div className="hm-floating-cards" aria-hidden="true">
            <div className="hm-float-card hm-fc1">
              <span className="hm-fc-emoji">📸</span>
              <span className="hm-fc-label">Photography</span>
              <span className="hm-fc-sub">180+ vendors</span>
            </div>
            <div className="hm-float-card hm-fc2">
              <span className="hm-fc-emoji">🎨</span>
              <span className="hm-fc-label">Decor</span>
              <span className="hm-fc-sub">240+ vendors</span>
            </div>
            <div className="hm-float-card hm-fc3">
              <span className="hm-fc-check">✓</span>
              <span className="hm-fc-label">Booking confirmed!</span>
              <span className="hm-fc-sub">Venue · March 14</span>
            </div>
          </div>

          <div className="hm-hero-stats">
            {[
              { num: "12", suffix: "K+", label: "Happy Clients" },
              { num: "850", suffix: "+", label: "Verified Vendors" },
              { num: "50", suffix: "+", label: "Cities" },
              { num: "4", suffix: ".9★", label: "Avg. Rating" },
            ].map((s, i) => (
              <div key={i} className="hm-hero-stat">
                <span className="hm-stat-num">
                  <Counter target={s.num} suffix={s.suffix} />
                </span>
                <span className="hm-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section className="hm-section" ref={servicesRef}>
          <div className={`hm-section-header hm-reveal ${servicesVisible ? "hm-revealed" : ""}`}>
            <p className="hm-eyebrow">✦ What we offer</p>
            <h2 className="hm-section-title">Browse by Service</h2>
            <p className="hm-section-sub">Hand-picked professionals for every kind of celebration</p>
          </div>

          <div className="hm-services-grid">
            {services.map((s, i) => (
              <div
                key={s.type}
                className={`hm-service-card hm-reveal ${servicesVisible ? "hm-revealed" : ""}`}
                onClick={() => navigate(`/category/${s.type}`)}
                style={{ animationDelay: `${i * 0.08}s`, "--card-accent": s.color }}
              >
                <div className="hm-service-glow" style={{ background: s.color }} />
                <div className="hm-service-emoji">{s.emoji}</div>
                <div className="hm-service-body">
                  <h3>{s.name}</h3>
                  <p>{s.desc}</p>
                </div>
                <div className="hm-service-footer">
                  <span className="hm-service-count">{s.count}</span>
                  <span className="hm-service-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="hm-how" ref={howRef}>
          <div className="hm-how-inner">
            <div className={`hm-section-header hm-reveal ${howVisible ? "hm-revealed" : ""}`}>
              <p className="hm-eyebrow" style={{ color: "var(--gold-light)" }}>✦ Simple process</p>
              <h2 className="hm-section-title" style={{ color: "var(--cream)" }}>How Eventify works</h2>
            </div>
            <div className="hm-steps">
              {[
                { n: "01", title: "Browse & Filter", desc: "Explore hundreds of verified vendors across categories and locations.", icon: "🔍" },
                { n: "02", title: "Choose a Package", desc: "Compare packages, pricing, and reviews to find your perfect match.", icon: "💎" },
                { n: "03", title: "Book Instantly", desc: "Confirm your date with a single click. No back-and-forth emails.", icon: "⚡" },
              ].map((step, i) => (
                <div
                  key={step.n}
                  className={`hm-step hm-reveal ${howVisible ? "hm-revealed" : ""}`}
                  style={{ transitionDelay: `${i * 0.15}s` }}
                >
                  <div className="hm-step-icon-wrap">{step.icon}</div>
                  <span className="hm-step-num">{step.n}</span>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                  {i < 2 && <div className="hm-step-connector" aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="hm-section" ref={testRef}>
          <div className={`hm-section-header hm-reveal ${testVisible ? "hm-revealed" : ""}`}>
            <p className="hm-eyebrow">✦ Client stories</p>
            <h2 className="hm-section-title">Loved by thousands</h2>
          </div>
          <div className="hm-testimonials">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`hm-testimonial hm-reveal ${testVisible ? "hm-revealed" : ""}`}
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div className="hm-t-stars">{"★★★★★"}</div>
                <p className="hm-t-text">"{t.text}"</p>
                <div className="hm-t-author">
                  <div className="hm-t-avatar">{t.avatar}</div>
                  <div>
                    <span className="hm-t-name">{t.name}</span>
                    <span className="hm-t-event">{t.event}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="hm-cta" ref={ctaRef}>
          <div className="hm-cta-orb hm-cta-orb1" />
          <div className="hm-cta-orb hm-cta-orb2" />
          <div className={`hm-cta-inner hm-reveal ${ctaVisible ? "hm-revealed" : ""}`}>
            <p className="hm-eyebrow" style={{ color: "var(--gold)" }}>✦ Ready to begin?</p>
            <h2 className="hm-cta-title">Your dream event starts here.</h2>
            <p className="hm-cta-sub">Join over 12,000 clients who planned their perfect day with Eventify.</p>
            <div className="hm-cta-btns">
              <button className="hm-cta-primary" onClick={() => navigate("/register")}>
                <span>Get Started Free</span>
                <span className="hm-btn-arrow">→</span>
              </button>
              <button className="hm-cta-secondary" onClick={() => navigate("/vendors")}>
                Browse Vendors
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="hm-footer">
          <div className="hm-footer-logo">✦ Eventify</div>
          <p className="hm-footer-copy">© 2025 Eventify. Crafted with care in India.</p>
          <div className="hm-footer-links">
            {["About", "Vendors", "Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="hm-footer-link">{l}</a>
            ))}
          </div>
        </footer>

        {user && <CustomerCarePopup />}
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
    --muted: #7a7265;
    --border: rgba(201,168,76,0.2);
    --surface: #faf7f2;
    --white: #ffffff;
  }

  .hm-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── REVEAL SYSTEM ── */
  .hm-reveal {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
  }
  .hm-revealed {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── HERO ── */
  .hm-hero {
    position: relative;
    background: var(--ink);
    overflow: hidden;
    padding: 100px 32px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
  }

  .hm-hero-bg { position: absolute; inset: 0; pointer-events: none; }

  .hm-grid-lines {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%);
  }

  .hm-orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.2; animation: orbPulse 8s ease-in-out infinite alternate; }
  .hm-orb1 { width: 600px; height: 600px; background: var(--gold); top: -160px; left: -100px; animation-delay: 0s; }
  .hm-orb2 { width: 500px; height: 500px; background: #7b5ea7; top: -80px; right: -80px; animation-delay: -2s; }
  .hm-orb3 { width: 350px; height: 350px; background: var(--gold); bottom: 80px; left: 40%; opacity: 0.1; animation-delay: -4s; }
  .hm-orb4 { width: 250px; height: 250px; background: #e879f9; bottom: 20%; right: 15%; opacity: 0.12; animation-delay: -6s; }

  @keyframes orbPulse {
    from { transform: scale(1) translate(0, 0); }
    to   { transform: scale(1.15) translate(20px, -20px); }
  }

  .hm-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.5;
  }

  .hm-hero-inner {
    position: relative; z-index: 2;
    text-align: center; max-width: 760px;
    animation: heroEnter 0.9s cubic-bezier(.22,1,.36,1) both;
  }

  @keyframes heroEnter {
    from { opacity: 0; transform: translateY(40px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .hm-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 24px;
    border: 1px solid rgba(201,168,76,0.3); padding: 6px 16px;
    border-radius: 24px; background: rgba(201,168,76,0.07);
    animation: heroEnter 0.9s 0.1s cubic-bezier(.22,1,.36,1) both;
  }

  .hm-eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--gold);
    animation: dotBlink 2s ease-in-out infinite;
  }

  @keyframes dotBlink {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.6); }
  }

  .hm-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(3rem, 6.5vw, 4.8rem); font-weight: 300;
    color: var(--white); line-height: 1.1; margin-bottom: 24px;
    animation: heroEnter 0.9s 0.15s cubic-bezier(.22,1,.36,1) both;
  }
  .hm-hero-title em { font-style: italic; color: var(--gold-light); }

  /* Typewriter */
  .hm-typewriter { color: var(--gold); font-style: italic; }
  .hm-cursor {
    display: inline-block;
    animation: blink 0.75s step-end infinite;
    color: var(--gold);
    margin-left: 2px;
  }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

  .hm-hero-sub {
    font-size: 15px; color: rgba(245,240,232,0.62); line-height: 1.75;
    margin-bottom: 40px; max-width: 520px; margin-left: auto; margin-right: auto;
    animation: heroEnter 0.9s 0.22s cubic-bezier(.22,1,.36,1) both;
  }

  .hm-hero-search {
    display: flex; align-items: center; background: var(--white);
    border-radius: 12px; padding: 7px 7px 7px 18px; gap: 10px;
    max-width: 580px; margin: 0 auto 28px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.1);
    animation: heroEnter 0.9s 0.28s cubic-bezier(.22,1,.36,1) both;
    transition: box-shadow 0.3s;
  }
  .hm-hero-search:focus-within {
    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 2px var(--gold);
  }
  .hm-search-icon { font-size: 20px; color: var(--muted); flex-shrink: 0; }
  .hm-search-input {
    flex: 1; border: none; outline: none;
    font-family: 'DM Sans', sans-serif; font-size: 14.5px; color: var(--ink);
    background: transparent;
  }
  .hm-search-input::placeholder { color: #bbb4a8; }
  .hm-search-btn {
    background: var(--ink); color: var(--white); border: none; border-radius: 8px;
    padding: 12px 22px; font-family: 'DM Sans', sans-serif; font-size: 13px;
    font-weight: 500; cursor: pointer; transition: all 0.25s; white-space: nowrap;
    position: relative; overflow: hidden;
  }
  .hm-search-btn::after {
    content: ''; position: absolute; inset: 0;
    background: var(--gold); transform: scaleX(0); transform-origin: left;
    transition: transform 0.3s cubic-bezier(.22,1,.36,1);
    z-index: 0;
  }
  .hm-search-btn:hover::after { transform: scaleX(1); }
  .hm-search-btn:hover { color: var(--ink); }
  .hm-search-btn span { position: relative; z-index: 1; }

  .hm-hero-pills {
    display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
    margin-bottom: 80px;
    animation: heroEnter 0.9s 0.34s cubic-bezier(.22,1,.36,1) both;
  }
  .hm-pill {
    font-size: 12px; color: var(--gold-light);
    border: 1px solid rgba(201,168,76,0.25); border-radius: 24px;
    padding: 6px 16px; cursor: pointer; transition: all 0.25s;
    background: rgba(201,168,76,0.06);
  }
  .hm-pill:hover {
    background: rgba(201,168,76,0.18); border-color: var(--gold);
    transform: translateY(-2px); box-shadow: 0 4px 16px rgba(201,168,76,0.2);
  }

  /* Floating cards */
  .hm-floating-cards {
    position: absolute; inset: 0; pointer-events: none; z-index: 2;
  }
  .hm-float-card {
    position: absolute;
    background: rgba(255,255,255,0.06); backdrop-filter: blur(14px);
    border: 1px solid rgba(201,168,76,0.2); border-radius: 14px;
    padding: 14px 18px; display: flex; flex-direction: column; gap: 2px;
  }
  .hm-fc-emoji { font-size: 20px; margin-bottom: 4px; }
  .hm-fc-check {
    width: 22px; height: 22px; background: var(--gold); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; color: var(--ink); font-weight: 700;
    margin-bottom: 4px;
  }
  .hm-fc-label { font-size: 12px; font-weight: 500; color: rgba(245,240,232,0.9); }
  .hm-fc-sub { font-size: 11px; color: rgba(245,240,232,0.45); }

  .hm-fc1 { left: 4%; top: 30%; animation: floatCard1 6s ease-in-out infinite; }
  .hm-fc2 { right: 4%; top: 38%; animation: floatCard2 7s ease-in-out infinite; }
  .hm-fc3 { right: 6%; bottom: 22%; animation: floatCard3 5.5s ease-in-out infinite; }

  @keyframes floatCard1 {
    0%, 100% { transform: translateY(0) rotate(-1deg); }
    50%       { transform: translateY(-16px) rotate(1deg); }
  }
  @keyframes floatCard2 {
    0%, 100% { transform: translateY(0) rotate(1deg); }
    50%       { transform: translateY(-12px) rotate(-1deg); }
  }
  @keyframes floatCard3 {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-10px); }
  }

  @media (max-width: 900px) {
    .hm-float-card { display: none; }
  }

  .hm-hero-stats {
    position: relative; z-index: 2;
    display: grid; grid-template-columns: repeat(4, 1fr);
    width: 100%; max-width: 800px;
    border: 1px solid rgba(201,168,76,0.15); border-bottom: none;
    border-radius: 14px 14px 0 0; overflow: hidden;
    background: rgba(255,255,255,0.04); backdrop-filter: blur(12px);
    animation: heroEnter 0.9s 0.5s cubic-bezier(.22,1,.36,1) both;
  }
  .hm-hero-stat {
    display: flex; flex-direction: column; gap: 4px; padding: 24px 20px;
    border-right: 1px solid rgba(201,168,76,0.15); text-align: center;
    transition: background 0.3s;
  }
  .hm-hero-stat:hover { background: rgba(201,168,76,0.06); }
  .hm-hero-stat:last-child { border-right: none; }
  .hm-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem; font-weight: 600; color: var(--gold);
    letter-spacing: -0.02em;
  }
  .hm-stat-label { font-size: 11px; color: rgba(245,240,232,0.45); letter-spacing: 0.07em; }

  /* ── SERVICES SECTION ── */
  .hm-section { max-width: 1120px; margin: 0 auto; padding: 90px 32px; }
  .hm-section-header { text-align: center; margin-bottom: 52px; }
  .hm-eyebrow {
    display: block; font-size: 11px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 12px;
  }
  .hm-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.9rem, 3.5vw, 2.8rem); font-weight: 300; color: var(--ink);
    margin-bottom: 10px;
  }
  .hm-section-sub { font-size: 14px; color: var(--muted); }

  .hm-services-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px;
  }
  @media (max-width: 900px) { .hm-services-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 560px) { .hm-services-grid { grid-template-columns: 1fr; } }

  .hm-service-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 16px; padding: 30px 26px 22px; cursor: pointer;
    transition: all 0.35s cubic-bezier(.22,1,.36,1);
    display: flex; flex-direction: column; gap: 14px;
    position: relative; overflow: hidden;
  }
  .hm-service-glow {
    position: absolute; top: -40px; right: -40px;
    width: 120px; height: 120px; border-radius: 50%;
    opacity: 0; filter: blur(40px);
    transition: opacity 0.4s;
  }
  .hm-service-card:hover .hm-service-glow { opacity: 0.35; }
  .hm-service-card:hover {
    border-color: var(--card-accent, var(--gold));
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 20px 50px rgba(0,0,0,0.1), 0 0 0 1px var(--card-accent, var(--gold));
  }
  .hm-service-emoji {
    font-size: 2.2rem;
    transition: transform 0.35s cubic-bezier(.22,1,.36,1);
  }
  .hm-service-card:hover .hm-service-emoji { transform: scale(1.2) rotate(-5deg); }
  .hm-service-body h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem; font-weight: 600; color: var(--ink); margin-bottom: 6px;
  }
  .hm-service-body p { font-size: 12.5px; color: var(--muted); line-height: 1.65; }
  .hm-service-footer {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border);
  }
  .hm-service-count { font-size: 11.5px; color: var(--gold); font-weight: 500; }
  .hm-service-arrow {
    font-size: 17px; color: var(--muted);
    transition: transform 0.25s, color 0.25s;
  }
  .hm-service-card:hover .hm-service-arrow {
    transform: translateX(5px);
    color: var(--card-accent, var(--gold));
  }

  /* ── HOW IT WORKS ── */
  .hm-how { background: var(--ink); padding: 90px 32px; position: relative; overflow: hidden; }
  .hm-how::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%);
  }
  .hm-how-inner { max-width: 1060px; margin: 0 auto; position: relative; z-index: 1; }
  .hm-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 52px; position: relative; }
  @media (max-width: 700px) { .hm-steps { grid-template-columns: 1fr; gap: 32px; } }

  .hm-step {
    border-top: 1px solid rgba(201,168,76,0.15);
    padding: 32px 32px 0 0; position: relative;
  }
  .hm-step-icon-wrap {
    font-size: 1.6rem; margin-bottom: 16px; display: block;
    width: 52px; height: 52px; border-radius: 14px;
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.18);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.3s;
  }
  .hm-step:hover .hm-step-icon-wrap {
    background: rgba(201,168,76,0.15);
    transform: scale(1.08);
  }
  .hm-step-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 3rem; font-weight: 300;
    color: rgba(201,168,76,0.2); display: block;
    margin-bottom: 10px; line-height: 1;
    transition: color 0.3s;
  }
  .hm-step:hover .hm-step-num { color: rgba(201,168,76,0.5); }
  .hm-step h4 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.25rem; font-weight: 600; color: var(--cream); margin-bottom: 10px;
  }
  .hm-step p { font-size: 13px; color: var(--muted); line-height: 1.75; }

  /* Step connector line */
  .hm-step-connector {
    position: absolute; top: -1px; right: -1px;
    width: 32px; height: 1px;
    background: linear-gradient(90deg, rgba(201,168,76,0.15), var(--gold));
  }

  /* ── TESTIMONIALS ── */
  .hm-testimonials { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; }
  @media (max-width: 800px) { .hm-testimonials { grid-template-columns: 1fr; } }

  .hm-testimonial {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 16px; padding: 30px; display: flex; flex-direction: column;
    gap: 18px; transition: all 0.35s cubic-bezier(.22,1,.36,1);
    position: relative; overflow: hidden;
  }
  .hm-testimonial::before {
    content: '"'; position: absolute; top: -10px; left: 16px;
    font-family: 'Cormorant Garamond', serif; font-size: 6rem; font-weight: 300;
    color: rgba(201,168,76,0.08); line-height: 1; pointer-events: none;
  }
  .hm-testimonial:hover {
    border-color: var(--gold);
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(201,168,76,0.12);
  }
  .hm-t-stars { color: var(--gold); font-size: 13px; letter-spacing: 2px; }
  .hm-t-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.08rem; font-style: italic; color: var(--ink); line-height: 1.7; flex: 1;
  }
  .hm-t-author { display: flex; align-items: center; gap: 12px; }
  .hm-t-avatar {
    width: 40px; height: 40px; background: var(--ink); color: var(--gold);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 1.05rem;
    font-weight: 600; flex-shrink: 0;
    border: 2px solid rgba(201,168,76,0.3);
  }
  .hm-t-name { display: block; font-size: 13px; font-weight: 500; color: var(--ink); }
  .hm-t-event { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* ── CTA ── */
  .hm-cta {
    position: relative; overflow: hidden; text-align: center;
    padding: 110px 32px; background: var(--ink);
  }
  .hm-cta-orb {
    position: absolute; border-radius: 50%;
    filter: blur(120px); pointer-events: none;
  }
  .hm-cta-orb1 {
    width: 500px; height: 500px; background: var(--gold); opacity: 0.1;
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    animation: orbPulse 7s ease-in-out infinite alternate;
  }
  .hm-cta-orb2 {
    width: 300px; height: 300px; background: #7b5ea7; opacity: 0.12;
    top: 10%; right: 10%;
    animation: orbPulse 9s ease-in-out infinite alternate-reverse;
  }
  .hm-cta-inner { position: relative; z-index: 1; }
  .hm-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.2rem, 4.5vw, 3.4rem); font-weight: 300; color: var(--white);
    margin: 12px 0 16px;
  }
  .hm-cta-sub { font-size: 14px; color: rgba(245,240,232,0.5); margin-bottom: 40px; }
  .hm-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

  .hm-cta-primary {
    padding: 16px 34px; background: var(--gold); color: var(--ink);
    border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s;
    display: flex; align-items: center; gap: 10px; position: relative; overflow: hidden;
  }
  .hm-cta-primary::before {
    content: ''; position: absolute; inset: 0;
    background: rgba(255,255,255,0.15);
    transform: translateX(-100%) skewX(-10deg);
    transition: transform 0.4s;
  }
  .hm-cta-primary:hover::before { transform: translateX(120%) skewX(-10deg); }
  .hm-cta-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(201,168,76,0.45); }
  .hm-btn-arrow {
    display: inline-block;
    transition: transform 0.3s;
  }
  .hm-cta-primary:hover .hm-btn-arrow { transform: translateX(4px); }

  .hm-cta-secondary {
    padding: 16px 34px; background: transparent; color: var(--white);
    border: 1px solid rgba(245,240,232,0.2); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all 0.3s;
  }
  .hm-cta-secondary:hover {
    border-color: var(--gold); color: var(--gold);
    transform: translateY(-2px);
  }

  /* ── FOOTER ── */
  .hm-footer {
    background: #0a0806; padding: 40px 32px; text-align: center;
    display: flex; flex-direction: column; gap: 14px; align-items: center;
    border-top: 1px solid rgba(201,168,76,0.1);
  }
  .hm-footer-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem; font-weight: 600; color: var(--gold);
    letter-spacing: 0.2em; text-transform: uppercase;
  }
  .hm-footer-copy { font-size: 12px; color: rgba(122,114,101,0.6); }
  .hm-footer-links { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; }
  .hm-footer-link {
    font-size: 12px; color: var(--muted); text-decoration: none;
    transition: color 0.2s; position: relative;
  }
  .hm-footer-link::after {
    content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
    height: 1px; background: var(--gold); transform: scaleX(0);
    transition: transform 0.25s;
  }
  .hm-footer-link:hover { color: var(--gold); }
  .hm-footer-link:hover::after { transform: scaleX(1); }

  /* ── RESPONSIVE ── */
  @media (max-width: 560px) {
    .hm-hero-stats { grid-template-columns: repeat(2,1fr); }
    .hm-hero { padding-top: 72px; }
    .hm-step { padding-right: 0; }
  }
`;