import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import CustomerCarePopup from "../components/CustomerCarePopup";
import Logo from "../components/Logo";

// ── Particle Canvas — skipped on mobile for performance ──
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (window.innerWidth < 768) return;
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
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
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
    const dur = 1200;
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

  useEffect(() => {
    document.title = "Evencers – India's Premier Event Planning Platform";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Evencers connects you with verified vendors for weddings, birthdays, corporate events & more. Browse decoration, photography, catering, music, florals, and venues across India."
    );
    return () => { document.title = "Evencers"; };
  }, []);

  const services = [
    { name: "Decor",       type: "decor",       emoji: "🎨", desc: "Transform any space into something magical",        count: "100+ vendors",  color: "#a78bfa" },
    { name: "Photography", type: "photography", emoji: "📸", desc: "Capture every moment, forever preserved",           count: "150+ vendors",  color: "#f59e0b" },
    { name: "Catering",    type: "catering",    emoji: "🍽", desc: "Exquisite menus crafted for your occasion",         count: "loading..",    color: "#34d399" },
    { name: "Music & DJ",  type: "music",       emoji: "🎵", desc: "Set the perfect mood for your celebration",         count: "loading..",    color: "#f87171" },
    { name: "Florals",     type: "florals",     emoji: "💐", desc: "Blooms that breathe life into every event",         count: "loading..",    color: "#fb7185" },
    { name: "Venues",      type: "venues",      emoji: "🏛", desc: "Iconic spaces for unforgettable gatherings",        count: "loading..",    color: "#38bdf8" },
  ];

  const testimonials = [
    { name: "Priya S.",   event: "Wedding · Delhi",       text: "Found our photographer and decorator within an hour. Absolutely seamless experience.", avatar: "P" },
    { name: "Rohan M.",   event: "Corporate · Delhi",     text: "The vendor quality is exceptional. Our product launch was a massive success.",         avatar: "R" },
    { name: "Ananya K.",  event: "Birthday · Chandigarh", text: "I was overwhelmed planning alone. Evencers made it feel effortless and fun.",           avatar: "A" },
  ];

  const [servicesRef, servicesVisible] = useReveal();
  const [howRef,      howVisible]      = useReveal();
  const [testRef,     testVisible]     = useReveal();
  const [ctaRef,      ctaVisible]      = useReveal();
  const [footerRef,   footerVisible]   = useReveal(0.05);
  const [searchVal,   setSearchVal]    = useState("");

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
              {/* Hidden static text for SEO */}
              <span className="hm-sr-only">
                India's Premier Event Planning Platform – Every great event deserves greatness
              </span>
              {/* Visible animated text */}
              <span aria-hidden="true">
                Every great event<br />
                <em>deserves </em>
                <Typewriter words={["greatness.", "perfection.", "magic.", "a great team."]} />
              </span>
            </h1>
            <p className="hm-hero-sub">
              Discover verified vendors for decoration, photography, catering, and more —
              curated for your perfect occasion.
            </p>

            <div className="hm-hero-search">
              <span className="hm-search-icon">⌕</span>
              <input
                className="hm-search-input"
                placeholder="Search vendors, services…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = searchVal.trim();
                    navigate(q ? `/vendors?q=${encodeURIComponent(q)}` : "/vendors");
                  }
                }}
              />
              <button
                className="hm-search-btn"
                onClick={() => {
                  const q = searchVal.trim();
                  navigate(q ? `/vendors?q=${encodeURIComponent(q)}` : "/vendors");
                }}
              >
                Explore →
              </button>
            </div>

            <div className="hm-hero-pills">
              {[
                { label: "Weddings",     cat: "decor"       },
                { label: "Birthdays",    cat: "catering"    },
                { label: "Corporate",    cat: "venues"      },
                { label: "Anniversaries",cat: "photography" },
              ].map((t) => (
                <span
                  key={t.label}
                  className="hm-pill"
                  // ✅ Pills also go to category page
                  onClick={() => navigate(`/category/${t.cat}`)}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Floating cards — desktop only */}
          <div className="hm-floating-cards" aria-hidden="true">
            <div className="hm-float-card hm-fc1">
              <span className="hm-fc-emoji">📸</span>
              <span className="hm-fc-label">Photography</span>
              <span className="hm-fc-sub">100+ vendors</span>
            </div>
            <div className="hm-float-card hm-fc2">
              <span className="hm-fc-emoji">🎨</span>
              <span className="hm-fc-label">Decor</span>
              <span className="hm-fc-sub">150+ vendors</span>
            </div>
            <div className="hm-float-card hm-fc3">
              <span className="hm-fc-check">✓</span>
              <span className="hm-fc-label">Booking confirmed!</span>
              <span className="hm-fc-sub">Venue · March 14</span>
            </div>
          </div>

          <div className="hm-hero-stats">
            {[
              { num: "11", suffix: "K+",   label: "Happy Clients" },
              { num: "200",  suffix: "+",   label: "Vendors"       },
              { num: "4",   suffix: "+",   label: "Cities"        },
              { num: "4",   suffix: ".9★", label: "Rating"        },
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
            <p className="hm-eyebrow">What we offer</p>
            <h2 className="hm-section-title">Browse by Service</h2>
            <p className="hm-section-sub">Hand-picked professionals for every kind of celebration</p>
          </div>

          <div className="hm-services-grid">
            {services.map((s, i) => (
              <div
                key={s.type}
                className={`hm-service-card hm-reveal ${servicesVisible ? "hm-revealed" : ""}`}
                // ✅ THIS IS THE FIX — was /vendors?cat= now /category/:type
                onClick={() => navigate(`/category/${s.type}`)}
                style={{ transitionDelay: `${i * 0.07}s`, "--card-accent": s.color }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/category/${s.type}`)}
                aria-label={`Browse ${s.name} vendors`}
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
              <p className="hm-eyebrow" style={{ color: "var(--gold-light)" }}>Simple process</p>
              <h2 className="hm-section-title" style={{ color: "var(--cream)" }}>How Evencers works</h2>
            </div>
            <div className="hm-steps">
              {[
                { n: "01", title: "Browse & Filter",  desc: "Explore hundreds of verified vendors across categories and locations.", icon: "🔍" },
                { n: "02", title: "Choose a Package", desc: "Compare packages, pricing, and reviews to find your perfect match.",    icon: "💎" },
                { n: "03", title: "Book Instantly",   desc: "Confirm your date with a single click. No back-and-forth emails.",      icon: "⚡" },
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="hm-section" ref={testRef}>
          <div className={`hm-section-header hm-reveal ${testVisible ? "hm-revealed" : ""}`}>
            <p className="hm-eyebrow">Client stories</p>
            <h2 className="hm-section-title">Loved by thousands</h2>
          </div>
          <div className="hm-testimonials">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`hm-testimonial hm-reveal ${testVisible ? "hm-revealed" : ""}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
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
            <p className="hm-eyebrow" style={{ color: "var(--gold)" }}>Ready to begin?</p>
            <h2 className="hm-cta-title">Your dream event starts here.</h2>
            <p className="hm-cta-sub">Join over 12K+ clients who planned their perfect day with Evencers.</p>
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
        <footer className="hm-footer" ref={footerRef}>
          <div className="hm-footer-orb hm-footer-orb1" />
          <div className="hm-footer-orb hm-footer-orb2" />

          <div className={`hm-footer-topband hm-reveal ${footerVisible ? "hm-revealed" : ""}`}>
            <div className="hm-footer-topband-inner">
              <span className="hm-footer-topband-label">Crafting Extraordinary Moments Since 2026</span>
              <div className="hm-footer-topband-line" />
            </div>
          </div>

          <div className={`hm-footer-grid hm-reveal ${footerVisible ? "hm-revealed" : ""}`} style={{ transitionDelay: "0.1s" }}>

            {/* COL 1 — Brand */}
            <div className="hm-footer-col hm-footer-col-brand">
              <div className="hm-footer-logo-wrap">
                <Logo />
                <span className="hm-footer-logo-text">EVENCERS</span>
              </div>
              <p className="hm-footer-brand-desc">
                India's premier event planning platform, connecting you with the finest vendors for every celebration — weddings, corporate events, birthdays & more.
              </p>
              <div className="hm-footer-socials">
                <a href="https://wa.me/917023017517?text=Hello%20Evencers%20Support" target="_blank" rel="noreferrer" className="hm-social-btn" aria-label="WhatsApp">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
                <a href="mailto:admineventify2005@gmail.com" className="hm-social-btn" aria-label="Email">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </a>
                <a href="tel:+917023017517" className="hm-social-btn" aria-label="Call">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.86 19.79 19.79 0 01.01 1.22 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* COL 2 — Quick Links */}
            <div className="hm-footer-col">
              <h4 className="hm-footer-col-title">
                <span className="hm-footer-col-title-line" />
                Quick Links
              </h4>
              <ul className="hm-footer-list">
                {[
                  { label: "Home",           path: "/"         },
                  { label: "Browse Vendors", path: "/vendors"  },
                  { label: "About Us",       path: "/about"    },
                  { label: "How It Works",   path: "/vendors#how-it-works" },
                  { label: "Get Started",    path: "/register" },
                ].map((l) => (
                  <li key={l.label}>
                    <span
                      className="hm-footer-list-link"
                      onClick={() => navigate(l.path)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="hm-footer-list-arrow">›</span>
                      {l.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* COL 3 — Services */}
            <div className="hm-footer-col">
              <h4 className="hm-footer-col-title">
                <span className="hm-footer-col-title-line" />
                Our Services
              </h4>
              <ul className="hm-footer-list">
                {[
                  { label: "🎨  Decoration", cat: "decor"       },
                  { label: "📸  Photography",cat: "photography" },
                  { label: "🍽  Catering",   cat: "catering"    },
                  { label: "🎵  Music & DJ", cat: "music"       },
                  { label: "💐  Florals",    cat: "florals"     },
                  { label: "🏛  Venues",     cat: "venues"      },
                ].map((s) => (
                  <li key={s.cat}>
                    <span
                      className="hm-footer-list-link"
                      // ✅ Footer service links also go to category page
                      onClick={() => navigate(`/category/${s.cat}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="hm-footer-list-arrow">›</span>
                      {s.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* COL 4 — Contact */}
            <div className="hm-footer-col">
              <h4 className="hm-footer-col-title">
                <span className="hm-footer-col-title-line" />
                Get In Touch
              </h4>
              <div className="hm-footer-address-card">
                <div className="hm-footer-address-pin">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <span className="hm-footer-address-label">Our Office</span>
                  <address className="hm-footer-address-text">
                    441, Sector 15‑A<br />
                    Chandigarh, 160015<br />
                    Punjab, India
                  </address>
                </div>
              </div>
              <ul className="hm-footer-contact-list">
                <li>
                  <a href="mailto:admineventify2005@gmail.com" className="hm-footer-contact-item">
                    <span className="hm-footer-contact-icon">✉</span>
                    <span>admineventify2005@gmail.com</span>
                  </a>
                </li>
                <li>
                  <a href="tel:+917023017517" className="hm-footer-contact-item">
                    <span className="hm-footer-contact-icon">📞</span>
                    <span>+91 70230 17517</span>
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/917023017517?text=Hello%20Evencers%20Support" target="_blank" rel="noreferrer" className="hm-footer-contact-item">
                    <span className="hm-footer-contact-icon">💬</span>
                    <span>WhatsApp Support</span>
                  </a>
                </li>
                <li className="hm-footer-hours-item">
                  <span className="hm-footer-contact-icon">🕐</span>
                  <span>Mon – Sat &nbsp;·&nbsp; 10 AM – 7 PM IST</span>
                </li>
              </ul>
            </div>
          </div>

          <div className={`hm-footer-divider hm-reveal ${footerVisible ? "hm-revealed" : ""}`} style={{ transitionDelay: "0.22s" }}>
            <div className="hm-footer-divider-line" />
            <div className="hm-footer-divider-diamond">◆</div>
            <div className="hm-footer-divider-line" />
          </div>

          <div className={`hm-footer-bottom hm-reveal ${footerVisible ? "hm-revealed" : ""}`} style={{ transitionDelay: "0.3s" }}>
            <p className="hm-footer-copy">
              © 2025 <span style={{ color: "var(--gold)" }}>Evencers</span>. Crafted with <span className="hm-footer-heart">♥</span> in India.
            </p>
            <div className="hm-footer-bottom-links">
              {["Privacy Policy", "Terms of Service", "Refund Policy"].map((l) => (
                <a key={l} href="#" className="hm-footer-bottom-link">{l}</a>
              ))}
            </div>
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
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── REVEAL ── */
  .hm-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s cubic-bezier(.22,1,.36,1), transform 0.6s cubic-bezier(.22,1,.36,1);
    will-change: opacity, transform;
  }
  .hm-revealed { opacity: 1; transform: translateY(0); }

  /* ── HERO ── */
  .hm-hero {
    position: relative;
    background: var(--ink);
    overflow: hidden;
    padding: 100px 20px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100svh;
  }

  .hm-hero-bg { position: absolute; inset: 0; pointer-events: none; }

  .hm-grid-lines {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%);
  }

  .hm-orb {
    position: absolute; border-radius: 50%;
    filter: blur(90px); opacity: 0.18;
    animation: orbPulse 8s ease-in-out infinite alternate;
    will-change: transform;
  }
  .hm-orb1 { width: 500px; height: 500px; background: var(--gold); top: -140px; left: -80px; animation-delay: 0s; }
  .hm-orb2 { width: 400px; height: 400px; background: #7b5ea7; top: -60px; right: -60px; animation-delay: -2s; }
  .hm-orb3 { width: 280px; height: 280px; background: var(--gold); bottom: 100px; left: 40%; opacity: 0.09; animation-delay: -4s; }

  @keyframes orbPulse {
    from { transform: scale(1) translate(0,0); }
    to   { transform: scale(1.12) translate(16px,-16px); }
  }

  .hm-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.5;
  }

  .hm-hero-inner {
    position: relative; z-index: 2;
    text-align: center; max-width: 760px; width: 100%;
    animation: heroEnter 0.8s cubic-bezier(.22,1,.36,1) both;
  }

  @keyframes heroEnter {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .hm-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 20px;
    border: 1px solid rgba(201,168,76,0.3); padding: 6px 14px;
    border-radius: 24px; background: rgba(201,168,76,0.07);
    animation: heroEnter 0.8s 0.1s cubic-bezier(.22,1,.36,1) both;
  }

  .hm-eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold);
    animation: dotBlink 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes dotBlink {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.6); }
  }

  .hm-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.4rem, 7vw, 4.8rem);
    font-weight: 300; color: var(--white);
    line-height: 1.1; margin-bottom: 20px;
    animation: heroEnter 0.8s 0.15s cubic-bezier(.22,1,.36,1) both;
  }
  .hm-hero-title em { font-style: italic; color: var(--gold-light); }

  .hm-typewriter { color: var(--gold); font-style: italic; }
  .hm-cursor {
    display: inline-block;
    animation: blink 0.75s step-end infinite;
    color: var(--gold); margin-left: 2px;
  }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

  .hm-hero-sub {
    font-size: 14px; color: rgba(245,240,232,0.58); line-height: 1.75;
    margin-bottom: 32px; max-width: 480px; margin-left: auto; margin-right: auto;
    animation: heroEnter 0.8s 0.22s cubic-bezier(.22,1,.36,1) both;
  }

  /* ── SEARCH ── */
  .hm-hero-search {
    display: flex; align-items: center; background: var(--white);
    border-radius: 12px; padding: 6px 6px 6px 16px; gap: 8px;
    max-width: 540px; width: 100%; margin: 0 auto 24px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.1);
    animation: heroEnter 0.8s 0.28s cubic-bezier(.22,1,.36,1) both;
    transition: box-shadow 0.3s;
  }
  .hm-hero-search:focus-within {
    box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 0 2px var(--gold);
  }
  .hm-search-icon { font-size: 18px; color: var(--muted); flex-shrink: 0; }
  .hm-search-input {
    flex: 1; border: none; outline: none; min-width: 0;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink);
    background: transparent;
  }
  .hm-search-input::placeholder { color: #bbb4a8; }
  .hm-search-btn {
    background: var(--ink); color: var(--white); border: none; border-radius: 8px;
    padding: 11px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px;
    font-weight: 500; cursor: pointer; transition: background 0.25s, transform 0.2s;
    white-space: nowrap; flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .hm-search-btn:active { transform: scale(0.97); }
  @media (hover: hover) {
    .hm-search-btn:hover { background: var(--gold); color: var(--ink); }
  }

  /* ── PILLS ── */
  .hm-hero-pills {
    display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
    margin-bottom: 56px;
    animation: heroEnter 0.8s 0.34s cubic-bezier(.22,1,.36,1) both;
  }
  .hm-pill {
    font-size: 12px; color: var(--gold-light);
    border: 1px solid rgba(201,168,76,0.25); border-radius: 24px;
    padding: 6px 14px; cursor: pointer; transition: all 0.2s;
    background: rgba(201,168,76,0.06);
    -webkit-tap-highlight-color: transparent;
  }
  .hm-pill:active { background: rgba(201,168,76,0.2); transform: scale(0.96); }
  @media (hover: hover) {
    .hm-pill:hover {
      background: rgba(201,168,76,0.18); border-color: var(--gold);
      transform: translateY(-2px); box-shadow: 0 4px 12px rgba(201,168,76,0.2);
    }
  }

  /* ── FLOATING CARDS ── */
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
    font-size: 12px; color: var(--ink); font-weight: 700; margin-bottom: 4px;
  }
  .hm-fc-label { font-size: 12px; font-weight: 500; color: rgba(245,240,232,0.9); }
  .hm-fc-sub { font-size: 11px; color: rgba(245,240,232,0.45); }
  .hm-fc1 { left: 4%; top: 30%; animation: floatCard1 6s ease-in-out infinite; }
  .hm-fc2 { right: 4%; top: 38%; animation: floatCard2 7s ease-in-out infinite; }
  .hm-fc3 { right: 6%; bottom: 22%; animation: floatCard3 5.5s ease-in-out infinite; }
  @keyframes floatCard1 { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
  @keyframes floatCard2 { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-12px) rotate(-1deg)} }
  @keyframes floatCard3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @media (max-width: 900px) { .hm-floating-cards { display: none; } }

  /* ── STATS BAR ── */
  .hm-hero-stats {
    position: relative; z-index: 2;
    display: grid; grid-template-columns: repeat(4, 1fr);
    width: 100%; max-width: 760px;
    border: 1px solid rgba(201,168,76,0.15); border-bottom: none;
    border-radius: 14px 14px 0 0; overflow: hidden;
    background: rgba(255,255,255,0.04); backdrop-filter: blur(12px);
    animation: heroEnter 0.8s 0.5s cubic-bezier(.22,1,.36,1) both;
  }
  .hm-hero-stat {
    display: flex; flex-direction: column; gap: 3px;
    padding: 20px 12px; text-align: center;
    border-right: 1px solid rgba(201,168,76,0.12);
  }
  .hm-hero-stat:last-child { border-right: none; }
  .hm-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.3rem, 4vw, 1.9rem); font-weight: 600; color: var(--gold);
    letter-spacing: -0.02em;
  }
  .hm-stat-label { font-size: 10px; color: rgba(245,240,232,0.4); letter-spacing: 0.05em; }

  /* ── SECTION BASE ── */
  .hm-section { max-width: 1120px; margin: 0 auto; padding: 72px 20px; }
  .hm-section-header { text-align: center; margin-bottom: 44px; }
  .hm-eyebrow {
    display: block; font-size: 10px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 10px;
  }
  .hm-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.7rem, 4vw, 2.8rem); font-weight: 300; color: var(--ink);
    margin-bottom: 8px;
  }
  .hm-section-sub { font-size: 13.5px; color: var(--muted); }

  /* ── SERVICES GRID ── */
  .hm-services-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  @media (max-width: 860px) { .hm-services-grid { grid-template-columns: repeat(2,1fr); gap: 12px; } }
  @media (max-width: 480px) { .hm-services-grid { grid-template-columns: repeat(2,1fr); gap: 10px; } }

  .hm-service-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 22px 18px 18px; cursor: pointer;
    transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s, border-color 0.3s;
    display: flex; flex-direction: column; gap: 10px;
    position: relative; overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .hm-service-glow {
    position: absolute; top: -40px; right: -40px;
    width: 100px; height: 100px; border-radius: 50%;
    opacity: 0; filter: blur(36px);
    transition: opacity 0.4s;
  }
  @media (hover: hover) {
    .hm-service-card:hover .hm-service-glow { opacity: 0.32; }
    .hm-service-card:hover {
      border-color: var(--card-accent, var(--gold));
      transform: translateY(-5px) scale(1.01);
      box-shadow: 0 16px 40px rgba(0,0,0,0.09);
    }
    .hm-service-card:hover .hm-service-emoji { transform: scale(1.15) rotate(-5deg); }
    .hm-service-card:hover .hm-service-arrow { transform: translateX(4px); color: var(--card-accent, var(--gold)); }
  }
  .hm-service-card:active { transform: scale(0.97); }

  .hm-service-emoji {
    font-size: 1.9rem;
    transition: transform 0.3s cubic-bezier(.22,1,.36,1);
  }
  .hm-service-body h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1rem, 3vw, 1.25rem); font-weight: 600; color: var(--ink); margin-bottom: 4px;
  }
  .hm-service-body p { font-size: 11.5px; color: var(--muted); line-height: 1.6; }
  .hm-service-footer {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border);
  }
  .hm-service-count { font-size: 11px; color: var(--gold); font-weight: 500; }
  .hm-service-arrow { font-size: 15px; color: var(--muted); transition: transform 0.25s, color 0.25s; }

  /* ── HOW IT WORKS ── */
  .hm-how {
    background: var(--ink); padding: 72px 20px; position: relative; overflow: hidden;
  }
  .hm-how::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 60%);
  }
  .hm-how-inner { max-width: 1060px; margin: 0 auto; position: relative; z-index: 1; }

  .hm-steps {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 0; margin-top: 44px; position: relative;
  }
  @media (max-width: 680px) {
    .hm-steps { grid-template-columns: 1fr; gap: 0; }
  }

  .hm-step {
    border-top: 1px solid rgba(201,168,76,0.15);
    padding: 28px 24px 28px 0; position: relative;
  }
  @media (max-width: 680px) {
    .hm-step {
      padding: 24px 0; border-top: none;
      border-left: 1px solid rgba(201,168,76,0.15);
      padding-left: 24px; margin-left: 8px;
    }
    .hm-step:first-child { border-left: none; padding-left: 0; margin-left: 0; border-top: 1px solid rgba(201,168,76,0.15); }
  }

  .hm-step-icon-wrap {
    font-size: 1.4rem; margin-bottom: 14px;
    width: 46px; height: 46px; border-radius: 12px;
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.18);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.3s;
  }
  @media (hover: hover) {
    .hm-step:hover .hm-step-icon-wrap { background: rgba(201,168,76,0.15); transform: scale(1.06); }
    .hm-step:hover .hm-step-num { color: rgba(201,168,76,0.5); }
  }
  .hm-step-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.6rem; font-weight: 300;
    color: rgba(201,168,76,0.2); display: block;
    margin-bottom: 8px; line-height: 1; transition: color 0.3s;
  }
  .hm-step h4 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600; color: var(--cream); margin-bottom: 8px;
  }
  .hm-step p { font-size: 13px; color: var(--muted); line-height: 1.7; }

  /* ── TESTIMONIALS ── */
  .hm-testimonials {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 18px;
  }
  @media (max-width: 800px) { .hm-testimonials { grid-template-columns: 1fr; gap: 14px; } }

  .hm-testimonial {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 26px; display: flex; flex-direction: column;
    gap: 16px; transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
    position: relative; overflow: hidden;
  }
  .hm-testimonial::before {
    content: '"'; position: absolute; top: -8px; left: 14px;
    font-family: 'Cormorant Garamond', serif; font-size: 5rem; font-weight: 300;
    color: rgba(201,168,76,0.08); line-height: 1; pointer-events: none;
  }
  @media (hover: hover) {
    .hm-testimonial:hover {
      border-color: var(--gold); transform: translateY(-4px);
      box-shadow: 0 14px 40px rgba(201,168,76,0.1);
    }
  }
  .hm-t-stars { color: var(--gold); font-size: 12px; letter-spacing: 2px; }
  .hm-t-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; font-style: italic; color: var(--ink); line-height: 1.7; flex: 1;
  }
  .hm-t-author { display: flex; align-items: center; gap: 10px; }
  .hm-t-avatar {
    width: 38px; height: 38px; background: var(--ink); color: var(--gold);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600;
    flex-shrink: 0; border: 2px solid rgba(201,168,76,0.3);
  }
  .hm-t-name { display: block; font-size: 13px; font-weight: 500; color: var(--ink); }
  .hm-t-event { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* ── CTA ── */
  .hm-cta {
    position: relative; overflow: hidden; text-align: center;
    padding: 90px 20px; background: var(--ink);
  }
  .hm-cta-orb { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; }
  .hm-cta-orb1 {
    width: 420px; height: 420px; background: var(--gold); opacity: 0.09;
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    animation: orbPulse 7s ease-in-out infinite alternate;
  }
  .hm-cta-orb2 {
    width: 260px; height: 260px; background: #7b5ea7; opacity: 0.1;
    top: 10%; right: 10%;
    animation: orbPulse 9s ease-in-out infinite alternate-reverse;
  }
  .hm-cta-inner { position: relative; z-index: 1; }
  .hm-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 300; color: var(--white);
    margin: 10px 0 14px;
  }
  .hm-cta-sub {
    font-size: 13.5px; color: rgba(245,240,232,0.48); margin-bottom: 36px;
    max-width: 400px; margin-left: auto; margin-right: auto;
  }
  .hm-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  .hm-cta-primary {
    padding: 15px 30px; background: var(--gold); color: var(--ink);
    border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer; transition: transform 0.25s, box-shadow 0.25s;
    display: flex; align-items: center; gap: 8px;
    -webkit-tap-highlight-color: transparent;
  }
  .hm-cta-primary:active { transform: scale(0.97); }
  @media (hover: hover) {
    .hm-cta-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(201,168,76,0.4); }
    .hm-cta-primary:hover .hm-btn-arrow { transform: translateX(4px); }
  }
  .hm-btn-arrow { display: inline-block; transition: transform 0.25s; }

  .hm-cta-secondary {
    padding: 15px 30px; background: transparent; color: var(--white);
    border: 1px solid rgba(245,240,232,0.2); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    cursor: pointer; transition: border-color 0.2s, color 0.2s, transform 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .hm-cta-secondary:active { transform: scale(0.97); }
  @media (hover: hover) {
    .hm-cta-secondary:hover { border-color: var(--gold); color: var(--gold); transform: translateY(-2px); }
  }

  /* ── FOOTER ── */
  .hm-footer {
    background: #080604;
    border-top: 1px solid rgba(201,168,76,0.12);
    position: relative; overflow: hidden; padding: 0;
  }
  .hm-footer-orb {
    position: absolute; border-radius: 50%;
    filter: blur(110px); pointer-events: none; z-index: 0;
  }
  .hm-footer-orb1 { width: 500px; height: 300px; background: var(--gold); opacity: 0.04; top: 0; left: -100px; }
  .hm-footer-orb2 { width: 360px; height: 360px; background: #7b5ea7; opacity: 0.04; bottom: 0; right: -80px; }

  .hm-footer-topband {
    border-bottom: 1px solid rgba(201,168,76,0.08);
    padding: 18px 48px; position: relative; z-index: 1;
  }
  .hm-footer-topband-inner {
    max-width: 1180px; margin: 0 auto;
    display: flex; align-items: center; gap: 24px;
  }
  .hm-footer-topband-label {
    font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase;
    color: rgba(201,168,76,0.45); white-space: nowrap; flex-shrink: 0;
  }
  .hm-footer-topband-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(201,168,76,0.2), transparent);
  }

  .hm-footer-grid {
    max-width: 1180px; margin: 0 auto;
    display: grid; grid-template-columns: 2fr 1fr 1fr 1.6fr;
    gap: 48px 40px; padding: 56px 48px 48px;
    position: relative; z-index: 1;
  }
  @media (max-width: 1024px) {
    .hm-footer-grid { grid-template-columns: 1fr 1fr; gap: 40px 32px; padding: 48px 32px 40px; }
    .hm-footer-col-brand { grid-column: 1 / -1; }
  }
  @media (max-width: 560px) {
    .hm-footer-grid { grid-template-columns: 1fr; padding: 40px 20px 32px; gap: 36px; }
    .hm-footer-col-brand { grid-column: auto; }
    .hm-footer-topband { padding: 16px 20px; }
  }

  .hm-footer-logo-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .hm-footer-logo-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem; font-weight: 600; color: var(--gold); letter-spacing: 0.22em;
  }
  .hm-footer-brand-desc {
    font-size: 12.5px; color: rgba(122,114,101,0.7); line-height: 1.85;
    max-width: 320px; margin-bottom: 22px;
  }
  .hm-footer-socials { display: flex; gap: 10px; }
  .hm-social-btn {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.15);
    color: rgba(201,168,76,0.55);
    display: flex; align-items: center; justify-content: center;
    text-decoration: none;
    transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  @media (hover: hover) {
    .hm-social-btn:hover { background: rgba(201,168,76,0.14); border-color: var(--gold); color: var(--gold); transform: translateY(-3px); }
  }
  .hm-social-btn:active { transform: scale(0.95); }

  .hm-footer-col-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.95rem; font-weight: 600; color: var(--gold-light);
    letter-spacing: 0.06em; margin-bottom: 20px;
    display: flex; align-items: center; gap: 10px;
  }
  .hm-footer-col-title-line {
    display: inline-block; width: 18px; height: 1px;
    background: var(--gold); opacity: 0.5; flex-shrink: 0;
  }
  .hm-footer-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .hm-footer-list-link {
    font-size: 12.5px; color: rgba(122,114,101,0.7); text-decoration: none;
    display: flex; align-items: center; gap: 7px;
    transition: color 0.2s, gap 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .hm-footer-list-arrow { color: rgba(201,168,76,0.3); font-size: 14px; transition: color 0.2s; flex-shrink: 0; }
  @media (hover: hover) {
    .hm-footer-list-link:hover { color: var(--gold-light); gap: 10px; }
    .hm-footer-list-link:hover .hm-footer-list-arrow { color: var(--gold); }
  }

  .hm-footer-address-card {
    display: flex; gap: 12px; align-items: flex-start;
    background: rgba(201,168,76,0.04); border: 1px solid rgba(201,168,76,0.1);
    border-radius: 10px; padding: 14px 16px; margin-bottom: 18px;
    transition: border-color 0.3s;
  }
  @media (hover: hover) { .hm-footer-address-card:hover { border-color: rgba(201,168,76,0.25); } }
  .hm-footer-address-pin {
    width: 28px; height: 28px; border-radius: 8px;
    background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2);
    display: flex; align-items: center; justify-content: center;
    color: var(--gold); flex-shrink: 0; margin-top: 2px;
  }
  .hm-footer-address-label {
    display: block; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--gold); opacity: 0.7; margin-bottom: 5px;
  }
  .hm-footer-address-text { font-size: 12.5px; color: rgba(245,240,232,0.55); line-height: 1.75; font-style: normal; }

  .hm-footer-contact-list { list-style: none; display: flex; flex-direction: column; gap: 11px; }
  .hm-footer-contact-item {
    display: flex; align-items: center; gap: 9px;
    font-size: 12.5px; color: rgba(122,114,101,0.7); text-decoration: none;
    transition: color 0.2s; -webkit-tap-highlight-color: transparent;
  }
  @media (hover: hover) { .hm-footer-contact-item:hover { color: var(--gold-light); } }
  .hm-footer-contact-icon { font-size: 13px; flex-shrink: 0; }
  .hm-footer-hours-item {
    display: flex; align-items: center; gap: 9px;
    font-size: 11.5px; color: rgba(122,114,101,0.45);
    padding-top: 6px; border-top: 1px solid rgba(201,168,76,0.07); margin-top: 2px;
  }

  .hm-footer-divider {
    display: flex; align-items: center; gap: 14px;
    max-width: 1180px; margin: 0 auto; padding: 0 48px;
    position: relative; z-index: 1;
  }
  @media (max-width: 560px) { .hm-footer-divider { padding: 0 20px; } }
  .hm-footer-divider-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.18), transparent);
  }
  .hm-footer-divider-diamond {
    font-size: 8px; color: rgba(201,168,76,0.35); flex-shrink: 0;
    animation: diamondSpin 12s linear infinite;
  }
  @keyframes diamondSpin {
    0%   { transform: rotate(0deg) scale(1); }
    50%  { transform: rotate(180deg) scale(1.3); }
    100% { transform: rotate(360deg) scale(1); }
  }

  .hm-footer-bottom {
    max-width: 1180px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; padding: 20px 48px 32px;
    position: relative; z-index: 1;
  }
  @media (max-width: 560px) {
    .hm-footer-bottom { flex-direction: column; align-items: center; text-align: center; padding: 16px 20px 28px; }
  }
  .hm-footer-copy { font-size: 11.5px; color: rgba(122,114,101,0.45); }
  .hm-footer-heart { color: #e05252; }
  .hm-footer-bottom-links { display: flex; gap: 20px; flex-wrap: wrap; justify-content: flex-end; }
  @media (max-width: 560px) { .hm-footer-bottom-links { justify-content: center; } }
  .hm-footer-bottom-link {
    font-size: 11px; color: rgba(122,114,101,0.38); text-decoration: none;
    letter-spacing: 0.04em; transition: color 0.2s; -webkit-tap-highlight-color: transparent;
  }
  @media (hover: hover) { .hm-footer-bottom-link:hover { color: rgba(201,168,76,0.6); } }

  /* ── MOBILE ── */
  @media (max-width: 480px) {
    .hm-hero { padding: 76px 16px 0; }
    .hm-hero-sub { font-size: 13.5px; }
    .hm-hero-pills { gap: 7px; margin-bottom: 44px; }
    .hm-pill { font-size: 11.5px; padding: 5px 12px; }
    .hm-hero-stats { border-radius: 10px 10px 0 0; }
    .hm-hero-stat { padding: 16px 8px; }
    .hm-section { padding: 56px 16px; }
    .hm-how { padding: 56px 16px; }
    .hm-cta { padding: 72px 16px; }
    .hm-services-grid { gap: 9px; }
    .hm-service-card { padding: 18px 14px 14px; }
    .hm-service-emoji { font-size: 1.6rem; }
    .hm-service-body p { display: none; }
    .hm-cta-btns { flex-direction: column; align-items: center; }
    .hm-cta-primary, .hm-cta-secondary { width: 100%; max-width: 300px; justify-content: center; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hm-reveal { transition: none; }
    .hm-orb, .hm-float-card, .hm-eyebrow-dot, .hm-cursor,
    .hm-footer-divider-diamond { animation: none; }
  }

  .hm-sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }
`;