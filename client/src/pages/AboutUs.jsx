import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";

// ── SEO ──
function useSEO() {
  useEffect(() => {
    document.title = "About Evencers – India's Premier Event Vendor Platform";
    const setMeta = (sel, attr, val) => {
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement("meta"); const [k,v]=attr.split("="); el.setAttribute(k,v); document.head.appendChild(el); }
      el.setAttribute("content", val);
    };
    setMeta('meta[name="description"]','name=description',
      "Learn about Evencers — how we're making event planning effortless across India. Our story, values, team and mission to connect clients with 20+ verified vendors.");
  }, []);
}

// ── Scroll-reveal hook ──
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
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
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1400, 1);
      setCount(Math.round((1 - Math.pow(1-p, 3)) * num));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ── Marquee Strip ──
function MarqueeStrip() {
  const items = [
    "200+ Verified Vendors", "★ 4.9 Rated", "6+ Cities",
    "Weddings", "Birthdays", "Corporate Events", "Anniversaries",
    "Delhi · Chandigarh", "Instant Booking", "12k+ Happy Clients",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="au-marquee-wrap" aria-hidden="true">
      <div className="au-marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="au-marquee-item">
            {item} <span className="au-marquee-dot">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Tilt Card ──
function TiltCard({ children, className, style }) {
  const cardRef = useRef(null);
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -5;
    const rotateY = ((x - cx) / cx) * 5;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "";
  };
  return (
    <div ref={cardRef} className={className} style={{ ...style, transition: "transform 0.15s ease" }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  );
}

// ── POPUP MODAL ──
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="au-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="au-modal-box" onClick={e => e.stopPropagation()}>
        <div className="au-modal-header">
          <h2 className="au-modal-title">{title}</h2>
          <button className="au-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="au-modal-body">{children}</div>
        <div className="au-modal-footer">
          <button className="au-btn-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}

export default function AboutUs() {
  useSEO();
  const navigate = useNavigate();

  // Popup state
  const [popup, setPopup] = useState(null); // 'privacy' | 'terms' | 'contact'
  const openPopup = (type) => setPopup(type);
  const closePopup = () => setPopup(null);

  const [missionRef, missionVisible] = useReveal();
  const [valuesRef, valuesVisible] = useReveal();
  const [teamRef, teamVisible] = useReveal();
  const [statsRef, statsVisible] = useReveal();
  const [ctaRef, ctaVisible] = useReveal();
  const [vendorRef, vendorVisible] = useReveal();
  const [timelineRef, timelineVisible] = useReveal();

  const values = [
    { emoji: "🤝", title: "Trust First",        desc: "Every vendor is manually verified. We only list professionals we'd trust with our own events.", accent: "#a78bfa" },
    { emoji: "✨", title: "Curated Excellence", desc: "We don't just list vendors — we curate talent. Quality over quantity, always.",                  accent: "#f59e0b" },
    { emoji: "⚡", title: "Effortless Booking", desc: "No calls, no back-and-forth. Book confirmed vendors in minutes, not days.",                        accent: "#34d399" },
    { emoji: "💛", title: "People Over Profit", desc: "We care deeply about both clients and vendors. Fair pricing, fair exposure, fair treatment.",      accent: "#c9a84c" },
    { emoji: "🌏", title: "India-First",         desc: "Built in India, for Indian celebrations. We understand our culture, our chaos, our joy.",          accent: "#f87171" },
    { emoji: "🔒", title: "Safe & Secure",       desc: "Payments, data, and communication are all protected. Your peace of mind is our promise.",          accent: "#38bdf8" },
  ];

  const team = [
    {
      name: "Akarsh Gupta",
      role: "Founder & CEO",
      desc: "Passionate about making luxury events accessible to everyone in India.",
      photo: "/images/akarsh.jpg",
      gradient: "135deg, #c9a84c 0%, #e8d5a3 100%",
      initial: "AK",
      accentColor: "#c9a84c",
    },
    {
      name: "Atharv Patidar",
      role: "Co-founder & CTO",
      desc: "Building the infrastructure that makes seamless bookings possible at scale.",
      photo: "/images/atharv.jpg",
      gradient: "135deg, #34d399 0%, #6ee7b7 100%",
      initial: "AT",
      accentColor: "#34d399",
    },
  ];

  const timeline = [
    { year: "2025",       title: "The Frustration",  desc: "Our founders tried planning a Delhi corporate event. Three weeks. Dozens of calls. Mediocre results. The idea was born.", icon: "💡" },
    { year: "Early 2026", title: "First 10 Vendors", desc: "We manually onboarded 10 Delhi vendors we personally trusted. First client booked within 48 hours.",                       icon: "🌱" },
    { year: "Mid 2027",   title: "Expanding Cities", desc: "Mumbai. Bangalore. Hyderabad. We hit 1,500+ verified vendors and 30k+ happy clients.",                                     icon: "🚀" },
    { year: "2028",       title: "All of India",     desc: "50+ cities. 12k+ vendors. 120k+ clients. And we're just getting started.",                                                  icon: "🏆" },
  ];

  // ── Footer nav handler ──
  const handleFooterNav = (label) => {
    if (label === "Home") { navigate("/"); return; }
    if (label === "Vendors") { navigate("/vendors"); return; }
    if (label === "About") { navigate("/about"); return; }
    if (label === "Privacy") { openPopup("privacy"); return; }
    if (label === "Terms") { openPopup("terms"); return; }
    if (label === "Contact") { openPopup("contact"); return; }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="au-root">
        <Navbar />

        {/* ── PRIVACY POPUP ── */}
        <Modal open={popup === "privacy"} onClose={closePopup} title="Privacy Policy">
          <p className="au-modal-updated">Last updated: January 2026</p>
          <h3 className="au-modal-section-title">Information We Collect</h3>
          <p>We collect information you provide when registering, booking vendors, or contacting us — including your name, email, phone number, and event details. We also collect usage data to improve our platform.</p>
          <h3 className="au-modal-section-title">How We Use Your Data</h3>
          <p>Your data is used solely to connect you with verified vendors, process bookings, send you updates about your events, and improve our services. We never sell your personal information to third parties.</p>
          <h3 className="au-modal-section-title">Data Security</h3>
          <p>All payments are processed through PCI-compliant gateways. Your personal information is encrypted and stored securely. We use industry-standard SSL encryption across our entire platform.</p>
          <h3 className="au-modal-section-title">Cookies</h3>
          <p>We use cookies to keep you logged in, remember your preferences, and analyse platform usage. You can disable cookies in your browser settings at any time.</p>
          <h3 className="au-modal-section-title">Your Rights</h3>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:admineventify2005@gmail.com" className="au-modal-link">admineventify2005@gmail.com</a>.</p>
          <h3 className="au-modal-section-title">Contact</h3>
          <p>For privacy-related concerns, reach us at <a href="mailto:admineventify2005@gmail.com" className="au-modal-link">admineventify2005@gmail.com</a> or call <a href="tel:+917023017517" className="au-modal-link">+91 70230 17517</a>.</p>
        </Modal>

        {/* ── TERMS POPUP ── */}
        <Modal open={popup === "terms"} onClose={closePopup} title="Terms of Service">
          <p className="au-modal-updated">Effective: January 2026</p>
          <h3 className="au-modal-section-title">1. Acceptance of Terms</h3>
          <p>By accessing or using Evencers, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
          <h3 className="au-modal-section-title">2. Use of the Platform</h3>
          <p>Evencers is a marketplace connecting event clients with verified vendors. You may use the platform only for lawful purposes and in accordance with these terms. You are responsible for maintaining the confidentiality of your account credentials.</p>
          <h3 className="au-modal-section-title">3. Bookings & Payments</h3>
          <p>All bookings made through Evencers are subject to vendor availability and confirmation. Payments are processed securely. Cancellation and refund policies vary by vendor and are displayed clearly before booking confirmation.</p>
          <h3 className="au-modal-section-title">4. Vendor Listings</h3>
          <p>All vendors listed on Evencers are manually verified by our team. However, Evencers is not liable for the quality or delivery of services provided by individual vendors. Disputes should be raised within 48 hours of the event.</p>
          <h3 className="au-modal-section-title">5. Intellectual Property</h3>
          <p>All content, branding, and technology on Evencers is the property of Evencers and may not be reproduced without written permission.</p>
          <h3 className="au-modal-section-title">6. Limitation of Liability</h3>
          <p>Evencers shall not be liable for any indirect, incidental, or consequential damages arising from use of the platform. Our total liability shall not exceed the booking amount in question.</p>
          <h3 className="au-modal-section-title">7. Governing Law</h3>
          <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Chandigarh, India.</p>
        </Modal>

        {/* ── CONTACT POPUP ── */}
        <Modal open={popup === "contact"} onClose={closePopup} title="Contact Us">
          <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "14px", lineHeight: "1.7", marginBottom: "24px" }}>
            We're a small, passionate team and we read every message. Reach out — we'd love to hear from you.
          </p>
          <div className="au-contact-cards">
            <a href="mailto:admineventify2005@gmail.com" className="au-contact-card">
              <span className="au-contact-icon">✉</span>
              <div>
                <div className="au-contact-label">Email Us</div>
                <div className="au-contact-value">admineventify2005@gmail.com</div>
              </div>
            </a>
            <a href="tel:+917023017517" className="au-contact-card">
              <span className="au-contact-icon">📞</span>
              <div>
                <div className="au-contact-label">Call Us</div>
                <div className="au-contact-value">+91 70230 17517</div>
              </div>
            </a>
            <a href="https://wa.me/917023017517?text=Hello%20Evencers%20Support" target="_blank" rel="noreferrer noopener" className="au-contact-card">
              <span className="au-contact-icon">💬</span>
              <div>
                <div className="au-contact-label">WhatsApp</div>
                <div className="au-contact-value">Chat with our support team</div>
              </div>
            </a>
          </div>
          <div className="au-contact-hours">
            <span className="au-contact-hours-icon">🕐</span>
            <div>
              <div className="au-contact-label">Working Hours</div>
              <div className="au-contact-value">Monday – Saturday · 10:00 AM – 7:00 PM IST</div>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(245,240,232,0.3)", marginTop: "20px", textAlign: "center" }}>
            We typically respond within 2–4 business hours.
          </p>
        </Modal>

        {/* ── HERO ── */}
        <header className="au-hero">
          <div className="au-hero-bg" aria-hidden="true">
            <div className="au-orb au-orb1" />
            <div className="au-orb au-orb2" />
            <div className="au-orb au-orb3" />
            <div className="au-grain" />
            <div className="au-grid-lines" />
          </div>

          <div className="au-hero-bg-text" aria-hidden="true">ABOUT</div>

          <div className="au-hero-inner">
            <p className="au-hero-eyebrow">
              <span className="au-eyebrow-dot" aria-hidden="true" />
              Our Story
            </p>
            <h1 className="au-hero-title">
              We believe every<br />
              <em>celebration deserves</em><br />
              a great team.
            </h1>
            <p className="au-hero-sub">
              Evencers was born from a simple frustration — finding reliable, talented
              event vendors in India was needlessly hard. We're here to change that,
              one perfect event at a time.
            </p>
            <div className="au-hero-cta">
              <button className="au-btn-primary" onClick={() => navigate("/vendors")}>
                Explore Vendors <span className="au-btn-arrow">→</span>
              </button>
              <button className="au-btn-ghost" onClick={() => navigate("/register")}>
                Join as Vendor
              </button>
            </div>
          </div>

          <div className="au-hero-floats" aria-hidden="true">
            <div className="au-float-card au-fc-a">
              <span className="au-fc-num">100+</span>
              <span className="au-fc-label">Happy Clients</span>
            </div>
            <div className="au-float-card au-fc-b">
              <span className="au-fc-emoji">🏆</span>
              <span className="au-fc-label">Best Platform 2026</span>
            </div>
            <div className="au-float-card au-fc-c">
              <span className="au-fc-num">4.9★</span>
              <span className="au-fc-label">Average Rating</span>
            </div>
          </div>

          <div className="au-scroll-hint" aria-hidden="true">
            <span className="au-scroll-line" />
            <span className="au-scroll-label">scroll</span>
          </div>
        </header>

        {/* ── MARQUEE ── */}
        <MarqueeStrip />

        {/* ── STATS ── */}
        <section className="au-stats-section" ref={statsRef} aria-label="Platform statistics">
          <div className="au-stats-grid">
            {[
              { num: "10", suffix: "K+",   label: "Happy Clients",    sub: "across India",       icon: "👥" },
              { num: "200",  suffix: "+",  label: "Verified Vendors",  sub: "manually screened",  icon: "✓"  },
              { num: "6",   suffix: "+",   label: "Cities",            sub: "and growing fast",   icon: "📍" },
              { num: "4",   suffix: ".9★", label: "Average Rating",    sub: "from real clients",  icon: "★"  },
            ].map((s, i) => (
              <div
                key={i}
                className={`au-stat-card au-reveal ${statsVisible ? "au-revealed" : ""}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <span className="au-stat-icon" aria-hidden="true">{s.icon}</span>
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
        <section className="au-mission" ref={missionRef} aria-labelledby="mission-heading">
          <div className="au-mission-inner">
            <div className={`au-mission-text au-reveal ${missionVisible ? "au-revealed" : ""}`}>
              <p className="au-eyebrow">Our Mission</p>
              <h2 id="mission-heading" className="au-section-title">
                Making magic <em>accessible</em>
              </h2>
              <p className="au-body-text">
                In 2025, our founders tried planning a corporate event in Chandigarh. What should
                have taken a weekend ended up taking three weeks — calling vendors, chasing
                confirmations, getting ghosted, and settling for mediocre options.
              </p>
              <p className="au-body-text">
                We built Evencers so no one ever has to experience that again. Our platform
                connects clients with India's finest verified event professionals — decorators,
                photographers, caterers, musicians — all in one seamless experience.
              </p>
              <p className="au-body-text">
                Today, Evencers powers thousands of weddings, birthdays, corporate events
                and private celebrations every month. And we're just getting started.
              </p>
              <div className="au-mission-badges">
                <span className="au-badge">🎊 30+ events powered weekly</span>
                <span className="au-badge">⚡ 3 min avg. booking time</span>
                <span className="au-badge">🛡 100% payment protected</span>
              </div>
            </div>

            <div className={`au-mission-visual au-reveal ${missionVisible ? "au-revealed" : ""}`} style={{ transitionDelay: "0.18s" }}>
              <div className="au-mv-bg-ring au-ring1" aria-hidden="true" />
              <div className="au-mv-bg-ring au-ring2" aria-hidden="true" />
              <div className="au-mv-bg-ring au-ring3" aria-hidden="true" />
              <div className="au-mv-center" aria-hidden="true">
                <span className="au-mv-big">200+</span>
                <span className="au-mv-sub">verified vendors</span>
              </div>
              <div className="au-mv-orbit au-orb-card1" aria-hidden="true">
                <span>📸</span><span>Photography</span>
              </div>
              <div className="au-mv-orbit au-orb-card2" aria-hidden="true">
                <span>🎨</span><span>Decor</span>
              </div>
              <div className="au-mv-orbit au-orb-card3" aria-hidden="true">
                <span>🍽</span><span>Catering</span>
              </div>
              <div className="au-mv-orbit au-orb-card4" aria-hidden="true">
                <span>🎵</span><span>Music</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── TIMELINE ── */}
        <section className="au-timeline-section" ref={timelineRef} aria-labelledby="timeline-heading">
          <div className="au-timeline-wrap">
            <div className={`au-section-header au-reveal ${timelineVisible ? "au-revealed" : ""}`}>
              <p className="au-eyebrow" style={{ color: "var(--gold-light)" }}>How we got here</p>
              <h2 id="timeline-heading" className="au-section-title" style={{ color: "var(--cream)" }}>
                Our journey
              </h2>
            </div>
            <div className="au-timeline">
              <div className="au-timeline-line" aria-hidden="true" />
              {timeline.map((item, i) => (
                <div
                  key={i}
                  className={`au-timeline-item au-reveal ${timelineVisible ? "au-revealed" : ""}`}
                  style={{ transitionDelay: `${i * 0.14}s` }}
                >
                  <div className="au-tl-dot" aria-hidden="true">
                    <span className="au-tl-dot-icon">{item.icon}</span>
                  </div>
                  <div className="au-tl-year">{item.year}</div>
                  <div className="au-tl-content">
                    <h3 className="au-tl-title">{item.title}</h3>
                    <p className="au-tl-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VALUES ── */}
        <section className="au-values-section" ref={valuesRef} aria-labelledby="values-heading">
          <div className="au-section-wrap">
            <div className={`au-section-header au-reveal ${valuesVisible ? "au-revealed" : ""}`}>
              <p className="au-eyebrow">What we stand for</p>
              <h2 id="values-heading" className="au-section-title">Our Values</h2>
              <p className="au-section-sub">The principles that guide every decision we make</p>
            </div>
            <div className="au-values-grid">
              {values.map((v, i) => (
                <TiltCard
                  key={i}
                  className={`au-value-card au-reveal ${valuesVisible ? "au-revealed" : ""}`}
                  style={{ transitionDelay: `${i * 0.08}s`, "--v-accent": v.accent }}
                >
                  <div className="au-value-glow" style={{ background: v.accent }} aria-hidden="true" />
                  <div className="au-value-accent-line" style={{ background: v.accent }} aria-hidden="true" />
                  <span className="au-value-emoji" aria-hidden="true">{v.emoji}</span>
                  <h3 className="au-value-title">{v.title}</h3>
                  <p className="au-value-desc">{v.desc}</p>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOR VENDORS ── */}
        <section className="au-vendor-section" ref={vendorRef} aria-labelledby="vendor-heading">
          <div className="au-vendor-orb1" aria-hidden="true" />
          <div className="au-vendor-orb2" aria-hidden="true" />
          <div className="au-vendor-inner">
            <div className={`au-vendor-content au-reveal ${vendorVisible ? "au-revealed" : ""}`}>
              <p className="au-eyebrow" style={{ color: "var(--gold)" }}>For Vendors</p>
              <h2 id="vendor-heading" className="au-section-title" style={{ color: "var(--cream)" }}>
                Grow your business <em>with us</em>
              </h2>
              <p className="au-body-text" style={{ color: "rgba(245,240,232,0.58)" }}>
                We're not just a platform for clients — we're a launchpad for talented vendors.
                Whether you're an established studio or just starting out, Evencers gives you
                the visibility, tools, and bookings to grow.
              </p>
              <ul className="au-vendor-perks">
                {[
                  ["Free listing with verified badge", "✓"],
                  ["Instant booking notifications", "✓"],
                  ["Dashboard to manage all inquiries", "✓"],
                  ["Minimum commission on your first 10 bookings", "✓"],
                  ["Dedicated vendor support team", "✓"],
                ].map(([perk, check], i) => (
                  <li key={i} className="au-vendor-perk">
                    <span className="au-perk-check" aria-hidden="true">{check}</span>
                    {perk}
                  </li>
                ))}
              </ul>
              <div className="au-vendor-cta-row">
                <button className="au-btn-primary" onClick={() => navigate("/register")}>
                  Join as a Vendor <span className="au-btn-arrow">→</span>
                </button>
                <button className="au-btn-ghost-dark" onClick={() => navigate("/vendors")}>
                  See All Vendors
                </button>
              </div>
            </div>
            <div className={`au-vendor-stats au-reveal ${vendorVisible ? "au-revealed" : ""}`} style={{ transitionDelay: "0.2s" }}>
              {[
                { num: "200",  suffix: "+",   label: "Active Vendors",     icon: "🏪", color: "#c9a84c" },
                { num: "94",  suffix: "%",   label: "Vendor Satisfaction", icon: "💛", color: "#34d399" },
                { num: "48",  suffix: "hr",  label: "Avg. First Booking",  icon: "⚡", color: "#a78bfa" },
              ].map((s, i) => (
                <div key={i} className="au-vendor-stat" style={{ "--vs-color": s.color }}>
                  <div className="au-vs-icon-wrap">
                    <span className="au-vs-icon" aria-hidden="true">{s.icon}</span>
                  </div>
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
        <section className="au-team-section" ref={teamRef} aria-labelledby="team-heading">
          <div className="au-section-wrap">
            <div className={`au-section-header au-reveal ${teamVisible ? "au-revealed" : ""}`}>
              <p className="au-eyebrow">The people behind Evencers</p>
              <h2 id="team-heading" className="au-section-title">Meet the Team</h2>
              <p className="au-section-sub">A small, passionate team building India's best event platform</p>
            </div>
            <div className="au-team-grid">
              {team.map((member, i) => (
                <article
                  key={i}
                  className={`au-team-card au-reveal ${teamVisible ? "au-revealed" : ""}`}
                  style={{ transitionDelay: `${i * 0.14}s` }}
                >
                  <div className="au-team-card-shine" aria-hidden="true" />
                  <div
                    className="au-team-top-bar"
                    style={{ background: `linear-gradient(90deg, ${member.accentColor}, transparent)` }}
                    aria-hidden="true"
                  />
                  <div className="au-team-avatar-wrap">
                    <div
                      className="au-team-photo-ring"
                      style={{ "--ring-color": member.accentColor }}
                    >
                      <img
                        src={member.photo}
                        alt={`Photo of ${member.name}`}
                        className="au-team-photo"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.classList.add("au-photo-fallback");
                          e.target.parentElement.setAttribute("data-initial", member.initial);
                        }}
                      />
                    </div>
                    <div
                      className="au-team-pulse-ring"
                      style={{ "--ring-color": member.accentColor }}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="au-team-name">{member.name}</h3>
                  <span className="au-team-role" style={{ color: member.accentColor }}>
                    {member.role}
                  </span>
                  <p className="au-team-desc">{member.desc}</p>
                  <div
                    className="au-team-bottom-glow"
                    style={{ background: member.accentColor }}
                    aria-hidden="true"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="au-cta" ref={ctaRef} aria-labelledby="cta-heading">
          <div className="au-cta-orb1" aria-hidden="true" />
          <div className="au-cta-orb2" aria-hidden="true" />
          <div className="au-cta-lines" aria-hidden="true" />
          <div className={`au-cta-inner au-reveal ${ctaVisible ? "au-revealed" : ""}`}>
            <p className="au-eyebrow" style={{ color: "var(--gold)" }}>Ready to begin?</p>
            <h2 id="cta-heading" className="au-cta-title">Your next great event<br />starts here.</h2>
            <p className="au-cta-sub">
              Join over 12k clients across India who planned their perfect day with Evencers —
              weddings, birthdays, corporate events and more.
            </p>
            <div className="au-cta-btns">
              <button className="au-btn-primary au-btn-lg" onClick={() => navigate("/register")}>
                <span>Get Started Free</span>
                <span className="au-btn-arrow">→</span>
              </button>
              <button className="au-btn-ghost au-btn-lg" onClick={() => navigate("/vendors")}>
                Browse Vendors
              </button>
            </div>
            <div className="au-cta-trust">
              <span className="au-cta-trust-item">🔒 No credit card required</span>
              <span className="au-cta-trust-sep">·</span>
              <span className="au-cta-trust-item">⚡ Setup in 2 minutes</span>
              <span className="au-cta-trust-sep">·</span>
              <span className="au-cta-trust-item">🇮🇳 Made in India</span>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="au-footer" role="contentinfo">
          <div className="au-footer-logo"><Logo /> Evencers</div>
          <p className="au-footer-tagline">India's trusted event vendor platform</p>
          <p className="au-footer-copy">© 2025 Evencers. Crafted with care in India.</p>
          <nav className="au-footer-links" aria-label="Footer navigation">
            {["Home", "Vendors", "About", "Privacy", "Terms", "Contact"].map((l) => (
              <button
                key={l}
                onClick={() => handleFooterNav(l)}
                className="au-footer-link"
              >
                {l}
              </button>
            ))}
          </nav>
          <address className="au-footer-contact">
            <a href="mailto:admineventify2005@gmail.com" className="au-footer-contact-link">✉ admineventify2005@gmail.com</a>
            <span className="au-footer-sep" aria-hidden="true">·</span>
            <a href="tel:+917023017517" className="au-footer-contact-link">📞 +91 70230 17517</a>
            <span className="au-footer-sep" aria-hidden="true">·</span>
            <a href="https://wa.me/917023017517?text=Hello%20Evencers%20Support" target="_blank" rel="noreferrer noopener" className="au-footer-contact-link">💬 WhatsApp</a>
          </address>
          <p className="au-footer-hours">Mon – Sat · 10:00 AM – 7:00 PM IST</p>
        </footer>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

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
    --tl-year-w: 150px;
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
    opacity: 0; transform: translateY(28px);
    transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
    will-change: opacity, transform;
  }
  .au-revealed { opacity: 1; transform: translateY(0); }

  /* ══════════════════════════════════════
     ── MODAL POPUP ──
  ══════════════════════════════════════ */
  .au-modal-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(10,8,6,0.82);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: auModalFadeIn 0.22s cubic-bezier(.22,1,.36,1);
  }
  @keyframes auModalFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .au-modal-box {
    background: #16130f;
    border: 1px solid rgba(201,168,76,0.22);
    border-radius: 20px;
    width: 100%; max-width: 560px;
    max-height: 82vh;
    display: flex; flex-direction: column;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08);
    animation: auModalSlideUp 0.28s cubic-bezier(.22,1,.36,1);
    overflow: hidden;
  }
  @keyframes auModalSlideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .au-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 28px 18px;
    border-bottom: 1px solid rgba(201,168,76,0.12);
    flex-shrink: 0;
    background: linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 60%);
  }

  .au-modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 600; color: var(--gold-light);
    letter-spacing: -0.01em;
  }

  .au-modal-close {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(245,240,232,0.06); border: 1px solid rgba(245,240,232,0.1);
    color: rgba(245,240,232,0.5); font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
    flex-shrink: 0;
  }
  .au-modal-close:hover {
    background: rgba(201,168,76,0.12); color: var(--gold); border-color: rgba(201,168,76,0.3);
  }

  .au-modal-body {
    padding: 24px 28px;
    overflow-y: auto;
    flex: 1;
    display: flex; flex-direction: column; gap: 0;
    scrollbar-width: thin; scrollbar-color: rgba(201,168,76,0.2) transparent;
  }
  .au-modal-body::-webkit-scrollbar { width: 4px; }
  .au-modal-body::-webkit-scrollbar-track { background: transparent; }
  .au-modal-body::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }

  .au-modal-body p {
    font-size: 13.5px; color: rgba(245,240,232,0.55); line-height: 1.82;
    margin-bottom: 18px;
  }

  .au-modal-updated {
    font-size: 11px !important; color: rgba(201,168,76,0.5) !important;
    letter-spacing: 0.08em; text-transform: uppercase;
    margin-bottom: 20px !important;
  }

  .au-modal-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; font-weight: 600; color: var(--cream);
    margin-bottom: 8px; margin-top: 4px;
    padding-left: 10px;
    border-left: 2px solid rgba(201,168,76,0.5);
  }

  .au-modal-link {
    color: var(--gold); text-decoration: none; border-bottom: 1px solid rgba(201,168,76,0.3);
    transition: border-color 0.2s, color 0.2s;
  }
  .au-modal-link:hover { color: var(--gold-light); border-color: var(--gold-light); }

  .au-modal-footer {
    padding: 16px 28px 22px;
    border-top: 1px solid rgba(201,168,76,0.1);
    display: flex; justify-content: flex-end;
    flex-shrink: 0;
  }

  /* Contact popup cards */
  .au-contact-cards {
    display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px;
  }
  .au-contact-card {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 18px; border-radius: 12px;
    background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.14);
    text-decoration: none;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
  }
  .au-contact-card:hover {
    background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.3);
    transform: translateX(4px);
  }
  .au-contact-icon { font-size: 1.3rem; flex-shrink: 0; }
  .au-contact-label {
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--gold); font-weight: 500; margin-bottom: 3px;
  }
  .au-contact-value { font-size: 13px; color: rgba(245,240,232,0.7); }
  .au-contact-hours {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 18px; border-radius: 12px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(245,240,232,0.06);
    margin-top: 10px;
  }
  .au-contact-hours-icon { font-size: 1.3rem; flex-shrink: 0; }

  /* ── HERO ── */
  .au-hero {
    position: relative; background: var(--ink); overflow: hidden;
    padding: 140px 20px 120px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 96svh;
  }

  .au-hero-bg { position: absolute; inset: 0; pointer-events: none; }

  .au-grid-lines {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.035) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, transparent 72%);
  }

  .au-orb {
    position: absolute; border-radius: 50%;
    filter: blur(90px); opacity: 0.18;
    animation: auOrbPulse 9s ease-in-out infinite alternate;
    will-change: transform;
  }
  .au-orb1 { width: 560px; height: 560px; background: var(--gold); top: -160px; left: -100px; }
  .au-orb2 { width: 420px; height: 420px; background: #7b5ea7; top: -70px; right: -70px; animation-delay: -2.5s; }
  .au-orb3 { width: 300px; height: 300px; background: var(--gold); bottom: 80px; left: 36%; opacity: 0.08; animation-delay: -5s; }

  @keyframes auOrbPulse {
    from { transform: scale(1) translate(0,0); }
    to   { transform: scale(1.14) translate(18px,-18px); }
  }

  .au-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E");
    opacity: 0.5;
  }

  .au-hero-bg-text {
    position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%);
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(6rem, 22vw, 18rem);
    font-weight: 600; letter-spacing: 0.12em;
    color: rgba(201,168,76,0.04);
    pointer-events: none; user-select: none;
    white-space: nowrap; z-index: 0; line-height: 1;
  }

  .au-hero-inner {
    position: relative; z-index: 2;
    text-align: center; max-width: 760px; width: 100%;
    animation: auHeroIn 0.85s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes auHeroIn {
    from { opacity: 0; transform: translateY(36px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .au-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 24px;
    border: 1px solid rgba(201,168,76,0.28); padding: 6px 16px;
    border-radius: 24px; background: rgba(201,168,76,0.07);
  }
  .au-eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--gold);
    animation: auDotBlink 2s ease-in-out infinite; flex-shrink: 0;
  }
  @keyframes auDotBlink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.6)} }

  .au-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.6rem, 7vw, 5rem);
    font-weight: 300; color: var(--white);
    line-height: 1.08; margin-bottom: 24px;
    animation: auHeroIn 0.85s 0.1s cubic-bezier(.22,1,.36,1) both;
    letter-spacing: -0.015em;
  }
  .au-hero-title em { font-style: italic; color: var(--gold-light); }

  .au-hero-sub {
    font-size: 14.5px; color: rgba(245,240,232,0.54); line-height: 1.82;
    margin-bottom: 40px; max-width: 500px; margin-left: auto; margin-right: auto;
    animation: auHeroIn 0.85s 0.18s cubic-bezier(.22,1,.36,1) both;
  }

  .au-hero-cta {
    display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
    animation: auHeroIn 0.85s 0.26s cubic-bezier(.22,1,.36,1) both;
  }

  .au-hero-floats {
    position: absolute; inset: 0; pointer-events: none; z-index: 2;
  }
  .au-float-card {
    position: absolute;
    background: rgba(255,255,255,0.055); backdrop-filter: blur(16px);
    border: 1px solid rgba(201,168,76,0.18); border-radius: 14px;
    padding: 14px 20px; display: flex; flex-direction: column; gap: 3px;
  }
  .au-fc-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 600; color: var(--gold); line-height: 1;
  }
  .au-fc-emoji { font-size: 1.4rem; }
  .au-fc-label { font-size: 11px; color: rgba(245,240,232,0.5); }
  .au-fc-a { left: 5%; top: 35%; animation: auFloat1 6s ease-in-out infinite; }
  .au-fc-b { right: 5%; top: 32%; animation: auFloat2 7.5s ease-in-out infinite; }
  .au-fc-c { right: 7%; bottom: 20%; animation: auFloat3 5.5s ease-in-out infinite; }
  @keyframes auFloat1 { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-18px) rotate(1deg)} }
  @keyframes auFloat2 { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-12px) rotate(-1.5deg)} }
  @keyframes auFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @media (max-width: 900px) { .au-hero-floats { display: none; } }

  .au-scroll-hint {
    position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    z-index: 3; animation: auHeroIn 0.85s 0.5s cubic-bezier(.22,1,.36,1) both;
  }
  .au-scroll-line {
    width: 1px; height: 48px; background: linear-gradient(to bottom, rgba(201,168,76,0.4), transparent);
    animation: auScrollLine 2s ease-in-out infinite;
  }
  @keyframes auScrollLine { 0%,100%{opacity:0.6;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(0.6)} }
  .au-scroll-label {
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(201,168,76,0.35);
  }
  @media (max-width: 600px) { .au-scroll-hint { display: none; } }

  /* ── BUTTONS ── */
  .au-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px; background: var(--gold); color: var(--ink);
    border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; font-weight: 500; cursor: pointer;
    transition: transform 0.25s, box-shadow 0.25s;
    -webkit-tap-highlight-color: transparent;
    position: relative; overflow: hidden;
  }
  .au-btn-primary::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%);
    transform: translateX(-100%); transition: transform 0.4s;
  }
  .au-btn-primary:active { transform: scale(0.97); }
  @media (hover:hover) {
    .au-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(201,168,76,0.38); }
    .au-btn-primary:hover::after { transform: translateX(100%); }
    .au-btn-primary:hover .au-btn-arrow { transform: translateX(5px); }
  }
  .au-btn-arrow { display: inline-block; transition: transform 0.25s; }

  .au-btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px; background: transparent; color: var(--white);
    border: 1px solid rgba(245,240,232,0.2); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.2s, background 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .au-btn-ghost:active { transform: scale(0.97); }
  @media (hover:hover) {
    .au-btn-ghost:hover { border-color: var(--gold); color: var(--gold); transform: translateY(-2px); background: rgba(201,168,76,0.06); }
  }

  .au-btn-ghost-dark {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px; background: transparent; color: rgba(245,240,232,0.7);
    border: 1px solid rgba(201,168,76,0.22); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 400; cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  @media (hover:hover) {
    .au-btn-ghost-dark:hover { border-color: var(--gold); color: var(--gold); transform: translateY(-2px); }
  }

  .au-btn-lg { padding: 15px 34px; font-size: 14px; }

  /* ── MARQUEE ── */
  .au-marquee-wrap {
    overflow: hidden; background: var(--gold);
    padding: 11px 0;
  }
  .au-marquee-track {
    display: flex; gap: 0;
    animation: auMarquee 28s linear infinite;
    width: max-content;
  }
  @keyframes auMarquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  .au-marquee-item {
    display: inline-flex; align-items: center; gap: 18px;
    font-size: 11px; font-weight: 500; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--ink);
    padding: 0 24px; white-space: nowrap;
  }
  .au-marquee-dot { font-size: 7px; opacity: 0.5; }
  @media (prefers-reduced-motion: reduce) {
    .au-marquee-track { animation: none; }
  }

  /* ── STATS ── */
  .au-stats-section {
    background: var(--white);
    border-bottom: 1px solid var(--border);
  }
  .au-stats-grid {
    max-width: 1100px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(4,1fr);
  }
  @media (max-width: 680px) { .au-stats-grid { grid-template-columns: repeat(2,1fr); } }

  .au-stat-card {
    padding: 38px 24px; text-align: center;
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    position: relative; overflow: hidden;
    transition: background 0.3s;
    cursor: default;
  }
  .au-stat-card::after {
    content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 0; height: 2px; background: var(--gold);
    transition: width 0.4s cubic-bezier(.22,1,.36,1);
  }
  @media (hover:hover) {
    .au-stat-card:hover { background: var(--surface); }
    .au-stat-card:hover::after { width: 60%; }
  }
  .au-stat-card:last-child { border-right: none; }
  @media (max-width: 680px) {
    .au-stat-card:nth-child(2) { border-right: none; }
    .au-stat-card:nth-child(3) { border-right: 1px solid var(--border); }
    .au-stat-card { border-top: 1px solid var(--border); }
    .au-stat-card:nth-child(1),.au-stat-card:nth-child(2) { border-top: none; }
  }
  .au-stat-icon { font-size: 1.2rem; margin-bottom: 4px; opacity: 0.6; }
  .au-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.2rem, 4.5vw, 3rem); font-weight: 600;
    color: var(--gold); line-height: 1;
  }
  .au-stat-label { font-size: 13px; font-weight: 500; color: var(--ink); margin-top: 4px; }
  .au-stat-sub { font-size: 11px; color: var(--muted); }

  /* ── COMMON SECTION ── */
  .au-section-wrap { max-width: 1100px; margin: 0 auto; padding: 84px 20px; }
  .au-section-header { text-align: center; margin-bottom: 52px; }
  .au-eyebrow {
    display: block; font-size: 10px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 10px;
  }
  .au-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.9rem, 4.5vw, 3rem); font-weight: 300; color: var(--ink);
    margin-bottom: 8px; letter-spacing: -0.01em;
  }
  .au-section-title em { font-style: italic; color: var(--gold); }
  .au-section-sub { font-size: 13.5px; color: var(--muted); line-height: 1.7; }
  .au-body-text { font-size: 14px; color: var(--muted); line-height: 1.85; margin-bottom: 18px; }

  /* ── MISSION ── */
  .au-mission {
    background: var(--surface);
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    padding: 84px 20px;
  }
  .au-mission-inner {
    max-width: 1100px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 70px; align-items: center;
  }
  @media (max-width: 860px) { .au-mission-inner { grid-template-columns: 1fr; gap: 48px; } }
  .au-mission-text .au-section-title,
  .au-mission-text .au-eyebrow { text-align: left; }

  .au-mission-badges {
    display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px;
  }
  .au-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--ink);
    background: var(--white); border: 1px solid var(--border);
    border-radius: 24px; padding: 7px 16px;
    font-weight: 500;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  @media (hover:hover) {
    .au-badge:hover { border-color: var(--gold); box-shadow: 0 4px 14px rgba(201,168,76,0.12); transform: translateY(-1px); }
  }

  .au-mission-visual {
    position: relative; height: 380px; display: flex;
    align-items: center; justify-content: center;
  }
  .au-mv-bg-ring {
    position: absolute; border-radius: 50%;
    border: 1px dashed rgba(201,168,76,0.18);
    top: 50%; left: 50%; transform: translate(-50%,-50%);
  }
  .au-ring1 { width: 280px; height: 280px; animation: auSpin 30s linear infinite; }
  .au-ring2 { width: 380px; height: 380px; animation: auSpin 50s linear infinite reverse; opacity: 0.6; }
  .au-ring3 { width: 470px; height: 470px; animation: auSpin 70s linear infinite; opacity: 0.3; }
  @keyframes auSpin { from{transform:translate(-50%,-50%) rotate(0)} to{transform:translate(-50%,-50%) rotate(360deg)} }

  .au-mv-center {
    position: relative; z-index: 2; text-align: center;
    width: 140px; height: 140px; border-radius: 50%;
    background: var(--ink); border: 2px solid rgba(201,168,76,0.3);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    box-shadow: 0 0 60px rgba(201,168,76,0.12), 0 0 0 8px rgba(201,168,76,0.04);
  }
  .au-mv-big {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 600; color: var(--gold); line-height: 1;
  }
  .au-mv-sub { font-size: 9px; color: rgba(245,240,232,0.4); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 3px; }

  .au-mv-orbit {
    position: absolute;
    background: var(--white); border: 1px solid var(--border);
    border-radius: 10px; padding: 9px 14px;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    font-size: 10px; color: var(--muted); font-weight: 500;
    box-shadow: 0 4px 16px rgba(14,12,10,0.07);
    transition: box-shadow 0.3s, border-color 0.3s, transform 0.3s;
  }
  @media (hover:hover) {
    .au-mv-orbit:hover { box-shadow: 0 8px 24px rgba(201,168,76,0.15); border-color: var(--gold); }
  }
  .au-mv-orbit span:first-child { font-size: 1.2rem; }
  .au-orb-card1 { top: 6%; left: 18%; animation: auFloat1 6s ease-in-out infinite; }
  .au-orb-card2 { top: 6%; right: 18%; animation: auFloat2 7s ease-in-out infinite; }
  .au-orb-card3 { bottom: 6%; left: 18%; animation: auFloat3 5.5s ease-in-out infinite; }
  .au-orb-card4 { bottom: 6%; right: 18%; animation: auFloat1 6.5s ease-in-out infinite reverse; }
  @media (max-width: 860px) {
    .au-mission-visual { height: 280px; }
    .au-ring1 { width: 200px; height: 200px; }
    .au-ring2 { width: 270px; height: 270px; }
    .au-ring3 { width: 340px; height: 340px; }
    .au-mv-center { width: 110px; height: 110px; }
  }

  /* ── TIMELINE ── */
  .au-timeline-section {
    background: var(--ink); padding: 84px 20px;
    position: relative; overflow: hidden;
  }
  .au-timeline-section::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%);
  }
  .au-timeline-wrap { max-width: 860px; margin: 0 auto; position: relative; z-index: 1; }

  .au-timeline {
    position: relative; margin-top: 52px;
    display: flex; flex-direction: column; gap: 0;
  }

  .au-timeline-line {
    position: absolute;
    left: var(--tl-year-w);
    top: 0; bottom: 0; width: 1px;
    background: linear-gradient(to bottom, transparent, rgba(201,168,76,0.3) 10%, rgba(201,168,76,0.3) 90%, transparent);
  }

  .au-timeline-item {
    display: grid;
    grid-template-columns: var(--tl-year-w) 1fr;
    gap: 0 28px; padding: 0 0 48px; position: relative; align-items: start;
  }
  .au-timeline-item:last-child { padding-bottom: 0; }

  .au-tl-dot {
    position: absolute;
    left: calc(var(--tl-year-w) - 18px);
    top: 2px;
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--ink); border: 2px solid rgba(201,168,76,0.4);
    box-shadow: 0 0 0 4px rgba(201,168,76,0.08), 0 0 20px rgba(201,168,76,0.2);
    z-index: 2; display: flex; align-items: center; justify-content: center;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .au-timeline-item:hover .au-tl-dot {
    border-color: var(--gold);
    box-shadow: 0 0 0 6px rgba(201,168,76,0.12), 0 0 28px rgba(201,168,76,0.35);
  }
  .au-tl-dot-icon { font-size: 14px; line-height: 1; }

  .au-tl-year {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; font-weight: 500; color: var(--gold);
    text-align: right;
    padding-right: 28px;
    line-height: 1.4; padding-top: 8px;
    white-space: nowrap;
  }

  .au-tl-content { padding-left: 14px; padding-top: 6px; }
  .au-tl-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem; font-weight: 600; color: var(--cream); margin-bottom: 8px;
    transition: color 0.3s;
  }
  .au-timeline-item:hover .au-tl-title { color: var(--gold-light); }
  .au-tl-desc { font-size: 13.5px; color: rgba(245,240,232,0.48); line-height: 1.75; }

  @media (max-width: 560px) {
    .au-timeline-line { left: 14px; }
    .au-tl-dot { left: -4px; width: 28px; height: 28px; }
    .au-tl-dot-icon { font-size: 11px; }
    .au-timeline-item { grid-template-columns: 1fr; padding-left: 42px; }
    .au-tl-year { text-align: left; font-size: 0.85rem; padding-right: 0; white-space: normal; }
    .au-tl-content { padding-left: 0; }
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
    border-radius: 16px; padding: 28px 24px;
    transition: box-shadow 0.3s, border-color 0.3s;
    position: relative; overflow: hidden; cursor: default;
  }
  .au-value-accent-line {
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    opacity: 0; transition: opacity 0.3s;
  }
  .au-value-glow {
    position: absolute; top: -32px; right: -32px;
    width: 80px; height: 80px; border-radius: 50%;
    filter: blur(28px); opacity: 0;
    transition: opacity 0.4s;
  }
  @media (hover:hover) {
    .au-value-card:hover { border-color: var(--v-accent, var(--gold)); box-shadow: 0 18px 42px rgba(0,0,0,0.08); }
    .au-value-card:hover .au-value-glow { opacity: 0.28; }
    .au-value-card:hover .au-value-accent-line { opacity: 1; }
    .au-value-card:hover .au-value-emoji { transform: scale(1.18) rotate(-6deg); }
  }
  .au-value-emoji { font-size: 2rem; display: block; margin-bottom: 14px; transition: transform 0.3s cubic-bezier(.22,1,.36,1); }
  .au-value-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.25rem; font-weight: 600; color: var(--ink); margin-bottom: 10px;
  }
  .au-value-desc { font-size: 13px; color: var(--muted); line-height: 1.72; }

  /* ── VENDOR SECTION ── */
  .au-vendor-section {
    background: var(--ink); padding: 84px 20px;
    position: relative; overflow: hidden;
  }
  .au-vendor-orb1 {
    position: absolute; width: 440px; height: 440px;
    background: var(--gold); border-radius: 50%; filter: blur(120px); opacity: 0.06;
    top: 50%; left: 28%; transform: translate(-50%,-50%); pointer-events: none;
  }
  .au-vendor-orb2 {
    position: absolute; width: 300px; height: 300px;
    background: #7b5ea7; border-radius: 50%; filter: blur(80px); opacity: 0.08;
    top: 5%; right: 4%; pointer-events: none;
  }
  .au-vendor-inner {
    max-width: 1100px; margin: 0 auto; position: relative; z-index: 1;
    display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 64px; align-items: center;
  }
  @media (max-width: 860px) { .au-vendor-inner { grid-template-columns: 1fr; gap: 44px; } }
  .au-vendor-content .au-section-title,
  .au-vendor-content .au-eyebrow { text-align: left; }

  .au-vendor-perks { list-style: none; display: flex; flex-direction: column; gap: 12px; margin: 24px 0 32px; }
  .au-vendor-perk {
    display: flex; align-items: center; gap: 12px;
    font-size: 13.5px; color: rgba(245,240,232,0.68); line-height: 1.5;
    padding: 10px 14px; border-radius: 8px;
    transition: background 0.2s;
  }
  @media (hover:hover) {
    .au-vendor-perk:hover { background: rgba(201,168,76,0.06); }
  }
  .au-perk-check {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    background: rgba(201,168,76,0.14); border: 1px solid rgba(201,168,76,0.32);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; color: var(--gold);
  }

  .au-vendor-cta-row {
    display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
  }

  .au-vendor-stats {
    display: flex; flex-direction: column; gap: 0;
    border: 1px solid rgba(201,168,76,0.14); border-radius: 18px; overflow: hidden;
    background: rgba(255,255,255,0.03);
  }
  .au-vendor-stat {
    padding: 28px 32px; display: flex; flex-direction: column; gap: 4px;
    border-bottom: 1px solid rgba(201,168,76,0.1);
    position: relative; overflow: hidden;
    transition: background 0.3s;
  }
  .au-vendor-stat::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--vs-color, var(--gold)); opacity: 0;
    transition: opacity 0.3s;
  }
  .au-vendor-stat:last-child { border-bottom: none; }
  @media (hover:hover) {
    .au-vendor-stat:hover { background: rgba(201,168,76,0.04); }
    .au-vendor-stat:hover::before { opacity: 1; }
  }
  .au-vs-icon-wrap {
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.15);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
  }
  .au-vs-icon { font-size: 1rem; }
  .au-vs-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.6rem; font-weight: 600; color: var(--gold); line-height: 1;
  }
  .au-vs-label { font-size: 12.5px; color: rgba(245,240,232,0.42); letter-spacing: 0.05em; }

  /* ── TEAM SECTION ── */
  .au-team-section {
    background: var(--surface);
    border-top: 1px solid var(--border);
  }
  .au-team-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 28px;
    max-width: 760px;
    margin: 0 auto;
  }
  @media (max-width: 560px) {
    .au-team-grid { grid-template-columns: 1fr; max-width: 360px; }
  }

  .au-team-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 36px 28px 30px;
    text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s, border-color 0.35s;
    position: relative; overflow: hidden;
    cursor: default;
  }
  .au-team-top-bar {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    opacity: 0.6; transition: opacity 0.35s;
  }
  .au-team-bottom-glow {
    position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    opacity: 0; transition: opacity 0.35s;
  }
  .au-team-card-shine {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 55%);
    opacity: 0; transition: opacity 0.35s; pointer-events: none;
  }
  @media (hover:hover) {
    .au-team-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 24px 56px rgba(201,168,76,0.12), 0 4px 16px rgba(0,0,0,0.06);
      border-color: rgba(201,168,76,0.35);
    }
    .au-team-card:hover .au-team-card-shine { opacity: 1; }
    .au-team-card:hover .au-team-top-bar { opacity: 1; }
    .au-team-card:hover .au-team-bottom-glow { opacity: 0.5; }
    .au-team-card:hover .au-team-photo-ring { transform: scale(1.04); }
    .au-team-card:hover .au-team-photo { filter: grayscale(0%) contrast(1.05) brightness(1.02); }
    .au-team-card:hover .au-team-pulse-ring { opacity: 0.6; transform: scale(1.12); }
  }
  .au-team-avatar-wrap {
    position: relative; width: 110px; height: 110px;
    margin-bottom: 12px;
    display: flex; align-items: center; justify-content: center;
  }
  .au-team-photo-ring {
    width: 104px; height: 104px; border-radius: 50%; padding: 3px;
    background: linear-gradient(135deg, var(--ring-color, var(--gold)) 0%, rgba(201,168,76,0.15) 60%, var(--ring-color, var(--gold)) 100%);
    position: relative; z-index: 1;
    box-shadow: 0 0 0 4px rgba(201,168,76,0.06), 0 8px 32px rgba(201,168,76,0.2);
    transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s;
  }
  .au-team-photo {
    width: 100%; height: 100%; border-radius: 50%;
    object-fit: cover; object-position: center top; display: block;
    filter: grayscale(10%) contrast(1.03);
    transition: filter 0.4s ease, transform 0.35s cubic-bezier(.22,1,.36,1);
  }
  .au-team-photo-ring.au-photo-fallback {
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--ring-color, var(--gold)) 0%, rgba(201,168,76,0.5) 100%);
  }
  .au-team-photo-ring.au-photo-fallback::after {
    content: attr(data-initial);
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem; font-weight: 600; color: var(--ink);
  }
  .au-team-photo-ring.au-photo-fallback img { display: none; }
  .au-team-pulse-ring {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 1.5px solid var(--ring-color, var(--gold));
    opacity: 0.25; animation: auTeamPulse 3s ease-in-out infinite;
    transition: opacity 0.35s, transform 0.35s; z-index: 0;
  }
  @keyframes auTeamPulse {
    0%,100% { transform: scale(1); opacity: 0.25; }
    50%      { transform: scale(1.06); opacity: 0.1; }
  }
  .au-team-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.35rem; font-weight: 600; color: var(--ink);
    margin-top: 4px; letter-spacing: -0.01em;
  }
  .au-team-role {
    font-size: 10px; letter-spacing: 0.14em;
    text-transform: uppercase; font-weight: 500; margin-bottom: 2px;
  }
  .au-team-desc {
    font-size: 13px; color: var(--muted); line-height: 1.68;
    margin-top: 6px; max-width: 240px;
  }

  /* ── CTA ── */
  .au-cta {
    position: relative; overflow: hidden; text-align: center;
    padding: 110px 20px; background: var(--ink);
  }
  .au-cta-orb1 {
    position: absolute; width: 480px; height: 480px;
    background: var(--gold); border-radius: 50%; filter: blur(110px); opacity: 0.08;
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    animation: auOrbPulse 7s ease-in-out infinite alternate;
  }
  .au-cta-orb2 {
    position: absolute; width: 280px; height: 280px;
    background: #7b5ea7; border-radius: 50%; filter: blur(90px); opacity: 0.1;
    top: 8%; right: 8%;
    animation: auOrbPulse 9s ease-in-out infinite alternate-reverse;
  }
  .au-cta-lines {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px);
    background-size: 100% 40px; pointer-events: none;
  }
  .au-cta-inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
  .au-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.2rem, 5.5vw, 3.8rem); font-weight: 300; color: var(--white);
    margin: 12px 0 16px; line-height: 1.1; letter-spacing: -0.01em;
  }
  .au-cta-sub {
    font-size: 13.5px; color: rgba(245,240,232,0.44); margin-bottom: 40px; line-height: 1.8;
  }
  .au-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 28px; }
  .au-cta-trust { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
  .au-cta-trust-item { font-size: 11.5px; color: rgba(245,240,232,0.32); }
  .au-cta-trust-sep { font-size: 11px; color: rgba(201,168,76,0.2); }

  /* ══════════════════════════════════════
     ── FOOTER — Brightened ──
  ══════════════════════════════════════ */
  .au-footer {
    background: #110e0b;
    padding: 44px 20px 36px; text-align: center;
    display: flex; flex-direction: column; gap: 14px; align-items: center;
    border-top: 1px solid rgba(201,168,76,0.18);
  }

  .au-footer-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 600; color: var(--gold);
    letter-spacing: 0.2em; text-transform: uppercase;
    display: flex; align-items: center; gap: 8px;
  }

  /* ↑ Brightened from 0.55 → 0.78 */
  .au-footer-tagline { font-size: 12px; color: rgba(245,240,232,0.78); font-weight: 400; }

  /* ↑ Brightened from 0.4 → 0.6 */
  .au-footer-copy { font-size: 11.5px; color: rgba(245,240,232,0.6); }

  .au-footer-links { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }

  /* Footer links are now <button> elements styled as links */
  .au-footer-link {
    font-size: 12.5px;
    /* ↑ Brightened from muted (#7a7265) → lighter */
    color: rgba(245,240,232,0.62);
    background: none; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-weight: 400;
    padding: 2px 0;
    transition: color 0.2s;
    text-decoration: none;
  }
  .au-footer-link:hover { color: var(--gold); }

  .au-footer-contact {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center;
    border-top: 1px solid rgba(201,168,76,0.12); padding-top: 16px; width: 100%;
    font-style: normal;
  }

  .au-footer-contact-link {
    font-size: 12.5px;
    /* ↑ Brightened */
    color: rgba(245,240,232,0.62);
    text-decoration: none; transition: color 0.2s;
  }
  .au-footer-contact-link:hover { color: var(--gold); }

  .au-footer-sep { color: rgba(201,168,76,0.35); font-size: 12px; }

  /* ↑ Brightened from 0.38 → 0.55 */
  .au-footer-hours { font-size: 11.5px; color: rgba(245,240,232,0.55); letter-spacing: 0.05em; }

  /* ── MOBILE ── */
  @media (max-width: 480px) {
    .au-hero { padding: 110px 16px 90px; min-height: 82svh; }
    .au-section-wrap { padding: 60px 16px; }
    .au-mission { padding: 60px 16px; }
    .au-vendor-section, .au-timeline-section, .au-cta { padding: 60px 16px; }
    .au-cta-btns { flex-direction: column; align-items: center; }
    .au-btn-lg { width: 100%; max-width: 300px; justify-content: center; }
    .au-footer-sep { display: none; }
    .au-values-grid { gap: 12px; }
    .au-team-grid { gap: 16px; }
    .au-vendor-cta-row { flex-direction: column; }
    .au-btn-ghost-dark { width: 100%; justify-content: center; }
    .au-cta-trust { flex-direction: column; gap: 8px; }
    .au-cta-trust-sep { display: none; }
    .au-modal-box { border-radius: 16px; }
    .au-modal-header { padding: 18px 20px 14px; }
    .au-modal-body { padding: 20px; }
    .au-modal-footer { padding: 14px 20px 18px; }
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .au-reveal { transition: none; }
    .au-orb, .au-eyebrow-dot, .au-fc-a, .au-fc-b, .au-fc-c { animation: none; }
    .au-ring1, .au-ring2, .au-ring3, .au-team-pulse-ring { animation: none; }
    .au-scroll-line { animation: none; }
    .au-marquee-track { animation: none; }
    .au-modal-box, .au-modal-overlay { animation: none; }
  }
`;