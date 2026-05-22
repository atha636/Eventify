import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// ── Scroll-reveal hook ──
function useReveal(threshold = 0.1) {
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
  const [ref, visible] = useReveal(0.4);
  useEffect(() => {
    if (!visible) return;
    const num = parseFloat(target);
    const dur = 1600;
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

// ── Magnetic cursor effect ──
function useMagnetic(strength = 0.35) {
  const ref = useRef(null);
  const handleMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
  }, [strength]);
  const handleLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = `translate(0px, 0px)`;
  }, []);
  return { ref, onMouseMove: handleMove, onMouseLeave: handleLeave };
}

// ── Enhanced Particle Canvas ──
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const particles = [];
    const lines = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.2,
        dx: (Math.random() - 0.5) * 0.18,
        dy: (Math.random() - 0.5) * 0.18,
        o: Math.random() * 0.5 + 0.06,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(201,168,76,${0.04 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      particles.forEach((p) => {
        p.pulse += 0.012;
        const pulseO = p.o + Math.sin(p.pulse) * 0.08;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${pulseO})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} />;
}

// ── Marquee ticker ──
const MARQUEE_ITEMS = [
  "✦ Verified Vendors",
  "⚡ Instant Booking",
  "🔒 Secure Payments",
  "⭐ 4.9 Rating",
  "🎉 12K+ Events",
  "🇮🇳 Made in India",
  "🏆 Best Platform 2026",
  "💎 Curated Quality",
];

function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="we-marquee-wrap" aria-hidden="true">
      <div className="we-marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="we-marquee-item">{item}</span>
        ))}
      </div>
    </div>
  );
}

// ── Award badge ──
function AwardBadge({ icon, title, sub }) {
  return (
    <div className="we-award">
      <div className="we-award-ring">
        <span className="we-award-icon">{icon}</span>
      </div>
      <span className="we-award-title">{title}</span>
      <span className="we-award-sub">{sub}</span>
    </div>
  );
}

const GALLERY_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=700&q=85", alt: "Elegant wedding ceremony with floral arch", label: "Wedding Ceremony", cat: "Wedding" },
  { url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=700&q=85", alt: "Wedding photographer capturing couple", label: "Wedding Photography", cat: "Photography" },
  { url: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=700&q=85", alt: "Luxurious wedding table floral centerpiece", label: "Floral Decor", cat: "Florals" },
  { url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=700&q=85", alt: "Romantic wedding reception decoration", label: "Reception Decor", cat: "Decor" },
  { url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=700&q=85", alt: "Corporate event setup with elegant lighting", label: "Corporate Events", cat: "Corporate" },
  { url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=700&q=85", alt: "Beautiful wedding bouquet and bride", label: "Bride & Bouquet", cat: "Wedding" },
];

const CLIENT_REASONS = [
  { icon: "✦", title: "Verified Vendors Only", desc: "Every vendor on Evencers goes through a rigorous vetting process — background checks, portfolio reviews, and client references. You'll never deal with unreliable surprises on your special day.", accent: "#c9a84c" },
  { icon: "⚡", title: "Instant Booking", desc: "No endless phone calls or back-and-forth emails. Browse packages, compare pricing, and confirm your booking in minutes — with real-time availability and instant confirmation.", accent: "#f0c040" },
  { icon: "💎", title: "Curated Quality", desc: "Our team personally evaluates every vendor for service quality, professionalism, and value. Only the best 15% of applicants make it onto our platform.", accent: "#d4af60" },
  { icon: "🛡", title: "Booking Protection", desc: "Your payment is secure until the service is delivered. Our escrow system ensures vendors are paid only after you're satisfied, giving you complete peace of mind.", accent: "#c9a84c" },
  { icon: "🎯", title: "All in One Place", desc: "Photography, decoration, catering, music, florals, and venues — everything you need for your event, curated under one roof. No juggling 10 different contacts.", accent: "#e8c870" },
  { icon: "⭐", title: "Dedicated Support", desc: "Our concierge team is available 6 days a week to help you plan, troubleshoot, or answer any question — from first inquiry to post-event follow-up.", accent: "#c9a84c" },
];

const VENDOR_REASONS = [
  { icon: "📈", title: "Grow Your Business", desc: "Get discovered by thousands of event planners actively searching for services like yours. Our SEO-optimized platform puts your portfolio in front of the right clients.", accent: "#c9a84c" },
  { icon: "💰", title: "Guaranteed Payments", desc: "No more chasing invoices. Payments are processed securely through our platform and deposited directly to your account within 48 hours of service completion.", accent: "#f0c040" },
  { icon: "🗓", title: "Smart Booking Calendar", desc: "Manage your availability, block out dates, and handle multiple bookings from a single dashboard. Automated reminders mean fewer no-shows and wasted time.", accent: "#d4af60" },
  { icon: "📊", title: "Detailed Analytics", desc: "Understand how clients find you, which services are most popular, and how your ratings compare — with actionable insights to help you grow month after month.", accent: "#c9a84c" },
  { icon: "🤝", title: "Community & Network", desc: "Join India's fastest-growing event professional network. Collaborate, refer clients, and build relationships with top photographers, decorators, and caterers.", accent: "#e8c870" },
  { icon: "🏆", title: "Verified Badge", desc: "Earn the Evencers Verified badge that signals trust and professionalism to clients. Top performers get featured placement and priority in search results.", accent: "#c9a84c" },
];

const TESTIMONIALS = [
  { name: "Meera & Arjun", event: "Wedding · Delhi", text: "We booked our photographer, decorator, and caterer through Evencers in a single afternoon. The quality of every vendor was exceptional.", avatar: "M", stars: 5 },
  { name: "Sunita Kapoor", event: "Birthday · Chandigarh", text: "I was skeptical at first, but the Evencers team personally helped me find the perfect florist within my budget. Absolutely magical event.", avatar: "S", stars: 5 },
  { name: "Raj Events Co.", event: "Corporate · Delhi", text: "As a corporate client, reliability is everything. Every vendor delivered on time, on budget, and beyond expectations.", avatar: "R", stars: 5 },
  { name: "Pooja Photography", event: "Vendor since 2026", text: "My bookings doubled within 3 months of joining Evencers. The dashboard is clean, payments are always on time, and the clients are serious.", avatar: "P", stars: 5, isVendor: true },
  { name: "Bloom & Petal", event: "Vendor since 2026", text: "Evencers helped us reach clients we never could have found on our own. The verified badge alone increased our conversion rate significantly.", avatar: "B", stars: 5, isVendor: true },
];

const STATS = [
  { num: "12", suffix: "K+", label: "Happy Clients", icon: "🎉", detail: "Across 6 cities" },
  { num: "200", suffix: "+", label: "Verified Vendors", icon: "✓", detail: "Top 15% only" },
  { num: "4", suffix: ".9★", label: "Average Rating", icon: "⭐", detail: "From 3,200+ reviews" },
  { num: "6", suffix: "+", label: "Cities Served", icon: "📍", detail: "Expanding monthly" },
];

const PROCESS_STEPS = [
  { n: "01", icon: "🔍", title: "Discover", desc: "Browse hundreds of verified vendors by category, location, and budget. Read genuine reviews from real clients." },
  { n: "02", icon: "💬", title: "Connect", desc: "View full portfolios, compare packages, and reach out to vendors directly through our secure messaging system." },
  { n: "03", icon: "⚡", title: "Book", desc: "Confirm your booking instantly with secure payment. Receive a digital booking confirmation within minutes." },
  { n: "04", icon: "🎉", title: "Celebrate", desc: "Sit back and enjoy your flawlessly executed event. Our support team is on standby if you need anything." },
];

const COMPARE_FEATURES = [
  "Verified vendors",
  "Instant booking",
  "Secure payments",
  "Transparent pricing",
  "6-day support",
  "Portfolio + reviews",
  "All categories in one place",
  "Post-event protection",
  "Real-time availability",
  "Dedicated concierge",
];

const BRANDS_SERVED = ["Taj Hotels", "Leela Palace", "ITC Hotels", "Oberoi", "Hyatt", "Marriott"];

export default function WhyEvencers() {
  const navigate = useNavigate();
  const [heroRef, heroVisible] = useReveal(0.05);
  const [statsRef, statsVisible] = useReveal(0.1);
  const [clientRef, clientVisible] = useReveal(0.1);
  const [vendorRef, vendorVisible] = useReveal(0.1);
  const [galleryRef, galleryVisible] = useReveal(0.1);
  const [testRef, testVisible] = useReveal(0.1);
  const [ctaRef, ctaVisible] = useReveal(0.1);
  const [processRef, processVisible] = useReveal(0.1);
  const [compareRef, compareVisible] = useReveal(0.1);
  const [activeTab, setActiveTab] = useState("clients");
  const [hoveredStat, setHoveredStat] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const mag1 = useMagnetic(0.3);
  const mag2 = useMagnetic(0.3);

  useEffect(() => {
    document.title = "Why Evencers — India's Most Trusted Event Planning Platform";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.setAttribute("content", "Discover why 10k+ clients and 200+ vendors trust Evencers for weddings, corporate events, birthdays, and more.");
    return () => { document.title = "Evencers"; };
  }, []);

  // Auto-cycle process steps
  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % 4), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="we-root">
        <Navbar />

        {/* ── HERO ── */}
        <section className="we-hero">
          <div className="we-hero-bg">
            <div className="we-orb we-orb1" />
            <div className="we-orb we-orb2" />
            <div className="we-orb we-orb3" />
            <div className="we-orb we-orb4" />
            <div className="we-grain" />
            <div className="we-grid" />
            <div className="we-vignette" />
          </div>
          <ParticleCanvas />

          <div className={`we-hero-inner we-reveal ${heroVisible ? "we-revealed" : ""}`} ref={heroRef}>
            <span className="we-eyebrow-pill">
              <span className="we-dot" />
              Why Choose Us
              <span className="we-dot" />
            </span>
            <h1 className="we-hero-title">
              India's Most <em>Trusted</em><br />
              <span className="we-hero-title-line2">Event Platform</span>
            </h1>
            <p className="we-hero-sub">
              From intimate birthday parties to grand weddings — Evencers connects you with
              India's finest verified vendors, so every celebration becomes a <em>masterpiece.</em>
            </p>
            <div className="we-hero-cta-row">
              <button className="we-btn-primary" {...mag1} onClick={() => navigate("/vendors")}>
                <span className="we-btn-shine" />
                Explore Vendors
                <span className="we-btn-arrow">→</span>
              </button>
              <button className="we-btn-ghost" {...mag2} onClick={() => navigate("/register")}>
                Join as Vendor
              </button>
            </div>
            <div className="we-hero-trust-row">
              {["🔒 Secure Payments", "✓ Verified Vendors", "⚡ Instant Booking", "🇮🇳 Made in India"].map((t, i) => (
                <span key={i} className="we-trust-pill">{t}</span>
              ))}
            </div>
          </div>

          {/* Floating cards */}
          <div className="we-float-cards" aria-hidden="true">
            <div className="we-fcard we-fc1">
              <div className="we-fc-inner">
                <span className="we-fc-icon">🏆</span>
                <span className="we-fc-title">Best Platform 2026</span>
                <span className="we-fc-sub">India Event Awards</span>
                <div className="we-fc-bar"><div className="we-fc-fill" style={{width:'88%'}}/></div>
              </div>
            </div>
            <div className="we-fcard we-fc2">
              <div className="we-fc-inner">
                <span className="we-fc-icon">🔒</span>
                <span className="we-fc-title">100% Secure Payments</span>
                <span className="we-fc-sub">Escrow Protected</span>
                <span className="we-fc-tag">Active</span>
              </div>
            </div>
            <div className="we-fcard we-fc3">
              <div className="we-fc-inner">
                <div className="we-fc-stars">★★★★★</div>
                <span className="we-fc-title">4.9 / 5 Rating</span>
                <span className="we-fc-sub">3,200+ Reviews</span>
              </div>
            </div>
            <div className="we-fcard we-fc4">
              <div className="we-fc-inner">
                <span className="we-fc-icon">⚡</span>
                <span className="we-fc-title">Booking confirmed</span>
                <span className="we-fc-sub">Just now · Wedding · Delhi</span>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="we-scroll-hint" aria-hidden="true">
            <div className="we-scroll-line" />
            <span>Scroll</span>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <Marquee />

        {/* ── STATS ── */}
        <section className="we-stats-bar" ref={statsRef}>
          {STATS.map((s, i) => (
            <div
              key={i}
              className={`we-stat we-reveal ${statsVisible ? "we-revealed" : ""}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
              onMouseEnter={() => setHoveredStat(i)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <span className="we-stat-icon">{s.icon}</span>
              <span className="we-stat-num"><Counter target={s.num} suffix={s.suffix} /></span>
              <span className="we-stat-label">{s.label}</span>
              <span className={`we-stat-detail ${hoveredStat === i ? "we-stat-detail-show" : ""}`}>{s.detail}</span>
              <div className="we-stat-line" />
            </div>
          ))}
        </section>

        {/* ── AWARDS STRIP ── */}
        <div className="we-awards-strip">
          <div className="we-awards-inner">
            <span className="we-awards-label">Trusted by India's finest venues</span>
            <div className="we-awards-brands">
              {BRANDS_SERVED.map((b, i) => (
                <span key={i} className="we-brand-name">{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── TAB SECTION ── */}
        <section className="we-section we-reasons-section">
          <div className="we-tab-header">
            <p className="we-section-eyebrow">Built for everyone</p>
            <h2 className="we-section-title">Why Evencers Wins <em>Every Time</em></h2>
            <p className="we-section-sub">Whether you're planning your dream event or growing your vendor business, we've built something extraordinary for you.</p>
            <div className="we-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === "clients"}
                className={`we-tab ${activeTab === "clients" ? "we-tab-active" : ""}`}
                onClick={() => setActiveTab("clients")}
              >
                <span className="we-tab-icon">👑</span>
                <span>For Clients</span>
                {activeTab === "clients" && <span className="we-tab-dot" />}
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "vendors"}
                className={`we-tab ${activeTab === "vendors" ? "we-tab-active" : ""}`}
                onClick={() => setActiveTab("vendors")}
              >
                <span className="we-tab-icon">🎯</span>
                <span>For Vendors</span>
                {activeTab === "vendors" && <span className="we-tab-dot" />}
              </button>
            </div>
          </div>

          <div
            className={`we-reasons-grid ${activeTab === "clients" ? "we-tab-panel-active" : "we-tab-panel-hidden"}`}
            ref={clientRef}
            role="tabpanel"
          >
            {CLIENT_REASONS.map((r, i) => (
              <div key={i} className={`we-reason-card we-reveal ${clientVisible ? "we-revealed" : ""}`} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="we-reason-icon-wrap">
                  <span className="we-reason-icon">{r.icon}</span>
                </div>
                <h3 className="we-reason-title">{r.title}</h3>
                <p className="we-reason-desc">{r.desc}</p>
                <div className="we-reason-footer">
                  <span className="we-reason-cta">Learn more →</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`we-reasons-grid ${activeTab === "vendors" ? "we-tab-panel-active" : "we-tab-panel-hidden"}`}
            ref={vendorRef}
            role="tabpanel"
          >
            {VENDOR_REASONS.map((r, i) => (
              <div key={i} className={`we-reason-card we-reason-card-vendor we-reveal ${vendorVisible ? "we-revealed" : ""}`} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="we-reason-icon-wrap we-reason-icon-wrap-vendor">
                  <span className="we-reason-icon">{r.icon}</span>
                </div>
                <h3 className="we-reason-title">{r.title}</h3>
                <p className="we-reason-desc">{r.desc}</p>
                <div className="we-reason-footer">
                  <span className="we-reason-cta we-reason-cta-vendor">Learn more →</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROCESS ── */}
        <section className="we-process-section" ref={processRef}>
          <div className="we-process-bg">
            <div className="we-process-orb1" />
            <div className="we-process-orb2" />
            <div className="we-process-orb3" />
            <div className="we-process-grid" />
          </div>
          <div className="we-section">
            <div className="we-tab-header">
              <p className="we-section-eyebrow" style={{ color: "var(--gold)" }}>Simple steps</p>
              <h2 className="we-section-title" style={{ color: "var(--cream)" }}>From Idea to <em style={{ color: "var(--gold-light)" }}>Unforgettable</em></h2>
              <p className="we-section-sub" style={{ color: "rgba(122,114,101,0.65)" }}>Your event, your way — in four simple steps</p>
            </div>
            <div className="we-process-container">
              <div className="we-process-nav">
                {PROCESS_STEPS.map((s, i) => (
                  <button
                    key={s.n}
                    className={`we-process-nav-item ${activeStep === i ? "we-ps-nav-active" : ""}`}
                    onClick={() => setActiveStep(i)}
                  >
                    <span className="we-ps-nav-num">{s.n}</span>
                    <span className="we-ps-nav-title">{s.title}</span>
                    <div className="we-ps-nav-progress">
                      <div className={`we-ps-nav-bar ${activeStep === i ? "we-ps-nav-bar-active" : ""}`} />
                    </div>
                  </button>
                ))}
              </div>
              <div className="we-process-display">
                {PROCESS_STEPS.map((s, i) => (
                  <div
                    key={s.n}
                    className={`we-process-panel ${activeStep === i ? "we-pp-active" : "we-pp-hidden"}`}
                  >
                    <div className="we-pp-icon">{s.icon}</div>
                    <div className="we-pp-num">{s.n}</div>
                    <h3 className="we-pp-title">{s.title}</h3>
                    <p className="we-pp-desc">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Mobile steps fallback */}
            <div className="we-process-steps-mobile">
              {PROCESS_STEPS.map((s, i) => (
                <div
                  key={s.n}
                  className={`we-process-step we-reveal ${processVisible ? "we-revealed" : ""}`}
                  style={{ transitionDelay: `${i * 0.12}s` }}
                >
                  <div className="we-ps-num">{s.n}</div>
                  <div className="we-ps-icon-wrap">{s.icon}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                  {i < 3 && <div className="we-ps-connector" aria-hidden="true">↓</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GALLERY ── */}
        <section className="we-section" ref={galleryRef}>
          <div className={`we-tab-header we-reveal ${galleryVisible ? "we-revealed" : ""}`}>
            <p className="we-section-eyebrow">Real events, real magic</p>
            <h2 className="we-section-title">Events We've Helped <em>Create</em></h2>
            <p className="we-section-sub">Every photo represents a real celebration brought to life by Evencers vendors</p>
          </div>
          <div className="we-gallery-grid">
            {GALLERY_PHOTOS.map((p, i) => (
              <div
                key={i}
                className={`we-gallery-item we-gi-${i} we-reveal ${galleryVisible ? "we-revealed" : ""}`}
                style={{ transitionDelay: `${i * 0.09}s` }}
              >
                <img src={p.url} alt={p.alt} loading="lazy" />
                <div className="we-gallery-overlay">
                  <span className="we-gallery-cat">{p.cat}</span>
                  <span className="we-gallery-label">{p.label}</span>
                  <span className="we-gallery-arrow">↗</span>
                </div>
              </div>
            ))}
          </div>
          <p className="we-gallery-note">
            Photos sourced from Unsplash — representative of the vendor quality on our platform
          </p>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className="we-section we-compare-section" ref={compareRef}>
          <div className={`we-tab-header we-reveal ${compareVisible ? "we-revealed" : ""}`}>
            <p className="we-section-eyebrow">See the difference</p>
            <h2 className="we-section-title">Evencers vs. <em>Traditional</em> Planning</h2>
            <p className="we-section-sub">Everything you'd want — and nothing you wouldn't.</p>
          </div>
          <div className={`we-compare-table we-reveal ${compareVisible ? "we-revealed" : ""}`} style={{ transitionDelay: "0.2s" }}>
            <div className="we-compare-header">
              <div className="we-compare-col we-compare-blank" />
              <div className="we-compare-col we-compare-us">
                <span className="we-compare-logo">✦ Evencers</span>
                <span className="we-compare-badge">Recommended</span>
              </div>
              <div className="we-compare-col we-compare-them">
                Traditional
              </div>
            </div>
            {COMPARE_FEATURES.map((feat, i) => (
              <div key={i} className={`we-compare-row ${i % 2 === 0 ? "we-compare-row-alt" : ""}`}>
                <div className="we-compare-col we-compare-feat">{feat}</div>
                <div className="we-compare-col we-compare-us-val">
                  <span className="we-check">✓</span>
                </div>
                <div className="we-compare-col we-compare-them-val">
                  <span className="we-cross">✗</span>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--muted)", marginTop: "16px" }}>
            No commitments. No hidden fees. Cancel anytime.
          </p>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="we-section" ref={testRef}>
          <div className={`we-tab-header we-reveal ${testVisible ? "we-revealed" : ""}`}>
            <p className="we-section-eyebrow">Real stories</p>
            <h2 className="we-section-title">Loved by Clients <em>&</em> Vendors</h2>
            <p className="we-section-sub">Don't just take our word for it — hear from the people who matter most.</p>
          </div>
          <div className="we-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`we-testimonial ${t.isVendor ? "we-testimonial-vendor" : ""} we-reveal ${testVisible ? "we-revealed" : ""}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {t.isVendor && <span className="we-vendor-badge">✦ Vendor</span>}
                <div className="we-t-stars">{"★".repeat(t.stars)}</div>
                <p className="we-t-text">"{t.text}"</p>
                <div className="we-t-author">
                  <div className="we-t-avatar" style={{ background: t.isVendor ? "rgba(201,168,76,0.15)" : "var(--gold)" }}>
                    {t.avatar}
                  </div>
                  <div>
                    <span className="we-t-name">{t.name}</span>
                    <span className="we-t-event">{t.event}</span>
                  </div>
                </div>
                <div className="we-t-glow" />
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="we-cta" ref={ctaRef}>
          <div className="we-cta-orb1" />
          <div className="we-cta-orb2" />
          <div className="we-cta-orb3" />
          <div className="we-cta-grid" aria-hidden="true" />
          <div className="we-cta-rings" aria-hidden="true">
            <div className="we-cta-ring we-cta-ring1" />
            <div className="we-cta-ring we-cta-ring2" />
            <div className="we-cta-ring we-cta-ring3" />
          </div>
          <div className={`we-cta-inner we-reveal ${ctaVisible ? "we-revealed" : ""}`}>
            <span className="we-eyebrow-pill" style={{ marginBottom: "20px" }}>
              <span className="we-dot" />
              Ready to begin?
              <span className="we-dot" />
            </span>
            <h2 className="we-cta-title">Your perfect event<br />starts <em>here.</em></h2>
            <p className="we-cta-sub">
              Join over 12K clients and 200+ vendors who trust Evencers to deliver extraordinary celebrations across India.
            </p>
            <div className="we-cta-btns">
              <button className="we-btn-primary we-btn-large" onClick={() => navigate("/vendors")}>
                <span className="we-btn-shine" />
                Find Vendors
                <span className="we-btn-arrow">→</span>
              </button>
              <button className="we-btn-ghost we-btn-large" onClick={() => navigate("/register?role=vendor")}>
                List Your Services
              </button>
            </div>
            <div className="we-cta-footnote">
              <span>🛡 Booking Protection</span>
              <span className="we-cta-fn-sep">·</span>
              <span>⚡ Instant Confirmation</span>
              <span className="we-cta-fn-sep">·</span>
              <span>🇮🇳 Made in India</span>
            </div>
          </div>
        </section>

        {/* ── FOOTER SEO TEXT ── */}
        <div className="we-seo-block">
          <div className="we-seo-inner">
            <h2>India's Premier Event Planning Platform</h2>
            <p>
              Evencers is India's most trusted event planning marketplace, connecting clients with verified professionals for <strong>weddings</strong>, <strong>birthday parties</strong>, <strong>corporate events</strong>, <strong>anniversaries</strong>, and more.
              Our platform features verified <strong>wedding photographers</strong>, <strong>event decorators</strong>, <strong>catering services</strong>, <strong>DJs and musicians</strong>, <strong>floral designers</strong>, and <strong>event venues</strong> across <strong>Delhi</strong>, <strong>Chandigarh</strong>, and expanding cities across India.
              Whether you're a client searching for reliable vendors or a professional looking to grow your event business, Evencers provides the tools, trust, and technology to make every celebration extraordinary.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0a0907;
    --ink2: #141210;
    --cream: #f5f0e8;
    --cream2: #ede8de;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --gold-dim: rgba(201,168,76,0.5);
    --muted: #7a7265;
    --muted2: #5a5549;
    --border: rgba(201,168,76,0.18);
    --border2: rgba(201,168,76,0.08);
    --surface: #faf7f2;
    --surface2: #f4f0e9;
    --white: #ffffff;
    --green: rgba(52,211,153,1);
    --red: rgba(248,113,113,1);
    --shadow-gold: 0 0 60px rgba(201,168,76,0.12);
  }

  .we-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── REVEAL ── */
  .we-reveal {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.72s cubic-bezier(.22,1,.36,1), transform 0.72s cubic-bezier(.22,1,.36,1);
    will-change: opacity, transform;
  }
  .we-revealed { opacity: 1; transform: translateY(0); }

  /* ── HERO ── */
  .we-hero {
    position: relative;
    background: var(--ink);
    overflow: hidden;
    padding: 138px 20px 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 95vh;
    justify-content: center;
  }

  .we-hero-bg { position: absolute; inset: 0; pointer-events: none; }

  .we-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    animation: orbPulse 10s ease-in-out infinite alternate;
  }
  .we-orb1 { width: 600px; height: 600px; background: var(--gold); opacity: 0.13; top: -200px; left: -150px; animation-delay: 0s; }
  .we-orb2 { width: 420px; height: 420px; background: #7b5ea7; opacity: 0.10; top: -100px; right: -80px; animation-delay: -3s; }
  .we-orb3 { width: 300px; height: 300px; background: var(--gold); opacity: 0.06; bottom: 40px; left: 40%; animation-delay: -5s; }
  .we-orb4 { width: 200px; height: 200px; background: #4a90d9; opacity: 0.05; bottom: 20%; right: 10%; animation-delay: -7s; }

  @keyframes orbPulse {
    from { transform: scale(1) translate(0, 0); }
    to   { transform: scale(1.15) translate(18px, -18px); }
  }

  .we-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
    opacity: 0.55;
  }
  .we-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.035) 1px, transparent 1px);
    background-size: 70px 70px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0.6) 0%, transparent 70%);
  }
  .we-vignette {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%);
  }

  .we-hero-inner {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 820px;
    width: 100%;
  }

  .we-eyebrow-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 24px;
    border: 1px solid rgba(201,168,76,0.28);
    padding: 7px 18px;
    border-radius: 30px;
    background: rgba(201,168,76,0.06);
    backdrop-filter: blur(8px);
  }

  .we-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--gold);
    animation: dotBlink 2.4s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes dotBlink {
    0%,100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
    50%      { opacity: 0.45; transform: scale(0.6); box-shadow: 0 0 0 4px rgba(201,168,76,0); }
  }

  .we-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.8rem, 7.5vw, 5.4rem);
    font-weight: 300;
    color: var(--white);
    line-height: 1.06;
    margin-bottom: 24px;
    letter-spacing: -0.01em;
  }
  .we-hero-title em {
    font-style: italic;
    color: var(--gold-light);
    position: relative;
  }
  .we-hero-title em::after {
    content: '';
    position: absolute;
    bottom: -4px; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  }
  .we-hero-title-line2 {
    display: block;
    background: linear-gradient(135deg, #fff 0%, var(--gold-light) 50%, #fff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .we-hero-sub {
    font-size: 15px;
    color: rgba(245,240,232,0.58);
    line-height: 1.85;
    margin-bottom: 40px;
    max-width: 520px;
    margin-left: auto;
    margin-right: auto;
  }
  .we-hero-sub em { font-style: italic; color: rgba(232,213,163,0.75); }

  .we-hero-cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
  .we-hero-trust-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }

  .we-trust-pill {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; color: rgba(245,240,232,0.38); letter-spacing: 0.04em;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(201,168,76,0.1);
    padding: 5px 13px; border-radius: 20px;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
  }
  .we-trust-pill:hover { color: rgba(245,240,232,0.65); border-color: rgba(201,168,76,0.25); background: rgba(201,168,76,0.05); }

  /* Buttons */
  .we-btn-primary {
    background: linear-gradient(135deg, #d4a93c, #c9a84c, #b8943c);
    color: var(--ink);
    border: none;
    border-radius: 12px;
    padding: 14px 30px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.01em;
  }
  .we-btn-shine {
    position: absolute; inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.5s;
    pointer-events: none;
  }
  .we-btn-primary:hover .we-btn-shine { transform: translateX(100%); }
  .we-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(201,168,76,0.42), 0 0 0 1px rgba(201,168,76,0.3); }
  .we-btn-primary:active { transform: scale(0.97) translateY(-1px); }
  .we-btn-arrow { display: inline-block; transition: transform 0.25s; }
  .we-btn-primary:hover .we-btn-arrow { transform: translateX(3px); }

  .we-btn-ghost {
    background: rgba(255,255,255,0.05);
    color: var(--cream);
    border: 1px solid rgba(245,240,232,0.18);
    border-radius: 12px;
    padding: 14px 30px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 400;
    cursor: pointer;
    transition: border-color 0.25s, color 0.25s, transform 0.25s, background 0.25s, box-shadow 0.25s;
    -webkit-tap-highlight-color: transparent;
    backdrop-filter: blur(6px);
  }
  .we-btn-ghost:hover { border-color: var(--gold); color: var(--gold); transform: translateY(-3px); background: rgba(201,168,76,0.08); box-shadow: 0 8px 24px rgba(201,168,76,0.12); }
  .we-btn-ghost:active { transform: scale(0.97); }
  .we-btn-large { padding: 17px 38px; font-size: 15px; border-radius: 14px; }

  /* Floating cards */
  .we-float-cards { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
  .we-fcard {
    position: absolute;
    background: rgba(20,18,16,0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(201,168,76,0.22);
    border-radius: 16px;
    overflow: hidden;
  }
  .we-fcard::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
  }
  .we-fc-inner { padding: 14px 18px; display: flex; flex-direction: column; gap: 3px; }
  .we-fc-icon { font-size: 20px; margin-bottom: 4px; }
  .we-fc-title { font-size: 12px; font-weight: 500; color: rgba(245,240,232,0.9); }
  .we-fc-sub { font-size: 10.5px; color: rgba(245,240,232,0.38); }
  .we-fc-stars { color: var(--gold); font-size: 11px; margin-bottom: 2px; letter-spacing: 1px; }
  .we-fc-bar { height: 3px; background: rgba(201,168,76,0.12); border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .we-fc-fill { height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-light)); border-radius: 2px; }
  .we-fc-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; color: #34d399; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25); padding: 2px 8px; border-radius: 10px; margin-top: 4px; letter-spacing: 0.08em; text-transform: uppercase; }
  .we-fc-tag::before { content: '●'; font-size: 7px; animation: dotBlink 2s infinite; }

  .we-fc1 { left: 2.5%; top: 26%; animation: floatCard1 7s ease-in-out infinite; min-width: 170px; }
  .we-fc2 { right: 2.5%; top: 24%; animation: floatCard2 8s ease-in-out infinite; min-width: 180px; }
  .we-fc3 { right: 5%; bottom: 20%; animation: floatCard3 6.5s ease-in-out infinite; min-width: 160px; }
  .we-fc4 { left: 3%; bottom: 22%; animation: floatCard4 9s ease-in-out infinite; min-width: 200px; }

  @keyframes floatCard1 { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-16px) rotate(0.5deg)} }
  @keyframes floatCard2 { 0%,100%{transform:translateY(0) rotate(1.5deg)} 50%{transform:translateY(-14px) rotate(-0.5deg)} }
  @keyframes floatCard3 { 0%,100%{transform:translateY(0) rotate(-0.5deg)} 50%{transform:translateY(-12px) rotate(1deg)} }
  @keyframes floatCard4 { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-10px) rotate(-1deg)} }

  @media (max-width: 960px) { .we-float-cards { display: none; } }

  /* Scroll hint */
  .we-scroll-hint {
    position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    z-index: 3; animation: fadeInUp 1s 1.2s both;
  }
  @keyframes fadeInUp { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  .we-scroll-line {
    width: 1px; height: 44px;
    background: linear-gradient(to bottom, transparent, rgba(201,168,76,0.5));
    animation: scrollPulse 2s ease-in-out infinite;
  }
  @keyframes scrollPulse { 0%,100%{opacity:0.4; transform:scaleY(1)} 50%{opacity:1; transform:scaleY(1.15)} }
  .we-scroll-hint span { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(201,168,76,0.4); }

  /* ── MARQUEE ── */
  .we-marquee-wrap {
    background: var(--ink2);
    border-top: 1px solid var(--border2);
    border-bottom: 1px solid var(--border2);
    overflow: hidden;
    padding: 13px 0;
  }
  .we-marquee-track {
    display: flex;
    gap: 0;
    animation: marqueeRoll 28s linear infinite;
    width: max-content;
  }
  @keyframes marqueeRoll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  .we-marquee-item {
    padding: 0 36px;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(201,168,76,0.5);
    white-space: nowrap;
    border-right: 1px solid rgba(201,168,76,0.1);
    flex-shrink: 0;
  }

  /* ── STATS BAR ── */
  .we-stats-bar {
    display: grid;
    grid-template-columns: repeat(4,1fr);
    background: var(--white);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 4px 32px rgba(0,0,0,0.04);
  }
  @media (max-width: 600px) { .we-stats-bar { grid-template-columns: repeat(2,1fr); } }

  .we-stat {
    display: flex; flex-direction: column; align-items: center;
    gap: 4px; padding: 32px 16px 28px; text-align: center;
    border-right: 1px solid var(--border);
    transition: background 0.35s; position: relative; overflow: hidden;
    cursor: default;
  }
  .we-stat::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(201,168,76,0.03) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.35s;
  }
  .we-stat:hover { background: var(--surface); }
  .we-stat:hover::before { opacity: 1; }
  .we-stat:last-child { border-right: none; }
  .we-stat-line {
    position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    transition: width 0.5s cubic-bezier(.22,1,.36,1);
  }
  .we-stat:hover .we-stat-line { width: 60%; }
  @media (max-width: 600px) {
    .we-stat:nth-child(2) { border-right: none; }
    .we-stat:nth-child(3) { border-right: 1px solid var(--border); border-top: 1px solid var(--border); }
    .we-stat:nth-child(4) { border-top: 1px solid var(--border); }
  }
  .we-stat-icon { font-size: 1.5rem; margin-bottom: 2px; }
  .we-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    font-weight: 600; color: var(--gold); letter-spacing: -0.03em;
  }
  .we-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; }
  .we-stat-detail {
    font-size: 10px; color: var(--gold); opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.3s, transform 0.3s;
    letter-spacing: 0.04em;
  }
  .we-stat-detail-show { opacity: 0.7; transform: translateY(0); }

  /* ── AWARDS STRIP ── */
  .we-awards-strip {
    background: var(--surface2);
    border-bottom: 1px solid var(--border2);
    padding: 20px 20px;
  }
  .we-awards-inner {
    max-width: 1120px; margin: 0 auto;
    display: flex; align-items: center; gap: 28px; flex-wrap: wrap; justify-content: center;
  }
  .we-awards-label {
    font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--muted); flex-shrink: 0;
  }
  .we-awards-brands { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }
  .we-brand-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px; font-weight: 600;
    color: rgba(122,114,101,0.45); letter-spacing: 0.04em;
    transition: color 0.3s;
    cursor: default;
  }
  .we-brand-name:hover { color: var(--muted); }

  /* ── SHARED SECTION ── */
  .we-section { max-width: 1120px; margin: 0 auto; padding: 80px 20px; }
  .we-tab-header { text-align: center; margin-bottom: 52px; }
  .we-section-eyebrow {
    display: block; font-size: 10px; letter-spacing: 0.24em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 12px;
  }
  .we-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.9rem, 4.5vw, 3.2rem);
    font-weight: 300; color: var(--ink); margin-bottom: 12px; letter-spacing: -0.01em;
  }
  .we-section-title em { font-style: italic; color: var(--gold); }
  .we-section-sub {
    font-size: 13.5px; color: var(--muted); max-width: 480px;
    margin: 0 auto; line-height: 1.8;
  }

  /* ── TABS ── */
  .we-tabs {
    display: inline-flex; gap: 5px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 14px; padding: 5px; margin-top: 28px;
  }
  .we-tab {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 24px; border-radius: 10px; border: none;
    background: none; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 400; color: var(--muted);
    cursor: pointer; transition: background 0.25s, color 0.25s, box-shadow 0.25s;
    -webkit-tap-highlight-color: transparent; position: relative;
  }
  .we-tab-active { background: var(--ink); color: var(--gold-light); box-shadow: 0 4px 18px rgba(14,12,10,0.22); }
  .we-tab:not(.we-tab-active):hover { background: rgba(201,168,76,0.09); color: var(--ink); }
  .we-tab-icon { font-size: 14px; }
  .we-tab-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: var(--gold); animation: dotBlink 2s infinite;
  }
  .we-tab-panel-hidden { display: none; }
  .we-tab-panel-active { display: grid; }

  /* ── REASONS GRID ── */
  .we-reasons-grid { grid-template-columns: repeat(3,1fr); gap: 16px; }
  @media (max-width: 860px) { .we-reasons-grid { grid-template-columns: repeat(2,1fr); gap: 12px; } }
  @media (max-width: 480px) { .we-reasons-grid { grid-template-columns: 1fr; gap: 10px; } }

  .we-reason-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 30px 26px 24px;
    transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s, border-color 0.35s;
    position: relative; overflow: hidden; cursor: default;
    display: flex; flex-direction: column;
  }
  .we-reason-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold));
    opacity: 0; transition: opacity 0.35s;
  }
  .we-reason-card::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at top left, rgba(201,168,76,0.04) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.35s;
  }
  .we-reason-card:hover { transform: translateY(-6px); box-shadow: 0 20px 56px rgba(0,0,0,0.09), var(--shadow-gold); border-color: rgba(201,168,76,0.38); }
  .we-reason-card:hover::before { opacity: 1; }
  .we-reason-card:hover::after { opacity: 1; }

  .we-reason-card-vendor { background: var(--ink2); border-color: rgba(201,168,76,0.14); }
  .we-reason-card-vendor .we-reason-title { color: var(--cream); }
  .we-reason-card-vendor .we-reason-desc { color: rgba(122,114,101,0.8); }
  .we-reason-card-vendor:hover { border-color: rgba(201,168,76,0.45); box-shadow: 0 20px 56px rgba(0,0,0,0.35), var(--shadow-gold); }

  .we-reason-icon-wrap {
    width: 46px; height: 46px; border-radius: 13px;
    background: rgba(201,168,76,0.07); border: 1px solid rgba(201,168,76,0.18);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px; font-size: 1.3rem;
    transition: background 0.3s, transform 0.35s cubic-bezier(.22,1,.36,1), border-color 0.3s;
  }
  .we-reason-card:hover .we-reason-icon-wrap { background: rgba(201,168,76,0.13); transform: scale(1.1) rotate(-6deg); border-color: rgba(201,168,76,0.35); }
  .we-reason-icon-wrap-vendor { background: rgba(201,168,76,0.07); border-color: rgba(201,168,76,0.18); }
  .we-reason-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.22rem; font-weight: 600; color: var(--ink); margin-bottom: 9px;
  }
  .we-reason-desc { font-size: 13px; color: var(--muted); line-height: 1.8; flex: 1; }
  .we-reason-footer { margin-top: 16px; }
  .we-reason-cta { font-size: 11.5px; color: var(--gold); letter-spacing: 0.05em; opacity: 0; transition: opacity 0.3s; }
  .we-reason-card:hover .we-reason-cta { opacity: 1; }
  .we-reason-cta-vendor { color: var(--gold-light); }

  /* ── PROCESS (Desktop interactive) ── */
  .we-process-section { background: var(--ink); position: relative; overflow: hidden; padding: 90px 0; }
  .we-process-bg { position: absolute; inset: 0; pointer-events: none; }
  .we-process-orb1 { position: absolute; width: 600px; height: 360px; border-radius: 50%; background: var(--gold); opacity: 0.055; filter: blur(110px); top: -150px; left: -120px; }
  .we-process-orb2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: #7b5ea7; opacity: 0.055; filter: blur(100px); bottom: -120px; right: -60px; }
  .we-process-orb3 { position: absolute; width: 250px; height: 250px; border-radius: 50%; background: #4a90d9; opacity: 0.04; filter: blur(80px); top: 40%; left: 40%; }
  .we-process-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 75%);
  }

  .we-process-container {
    display: grid; grid-template-columns: 260px 1fr; gap: 48px;
    align-items: center;
  }
  @media (max-width: 760px) { .we-process-container { display: none; } }

  .we-process-nav { display: flex; flex-direction: column; gap: 4px; }
  .we-process-nav-item {
    background: none; border: none; cursor: pointer;
    padding: 16px 20px; border-radius: 12px;
    text-align: left; transition: background 0.25s;
    display: flex; flex-direction: column; gap: 4px;
    border: 1px solid transparent;
    -webkit-tap-highlight-color: transparent;
  }
  .we-process-nav-item:hover { background: rgba(201,168,76,0.06); border-color: rgba(201,168,76,0.12); }
  .we-ps-nav-active { background: rgba(201,168,76,0.08) !important; border-color: rgba(201,168,76,0.2) !important; }
  .we-ps-nav-num { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 300; color: rgba(201,168,76,0.25); line-height: 1; }
  .we-ps-nav-active .we-ps-nav-num { color: rgba(201,168,76,0.7); }
  .we-ps-nav-title { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: rgba(245,240,232,0.45); }
  .we-ps-nav-active .we-ps-nav-title { color: var(--cream); }
  .we-ps-nav-progress { height: 2px; background: rgba(201,168,76,0.1); border-radius: 1px; margin-top: 8px; overflow: hidden; }
  .we-ps-nav-bar { height: 100%; width: 0; background: var(--gold); border-radius: 1px; transition: width 0.25s; }
  .we-ps-nav-bar-active { animation: progressFill 2.8s linear; }
  @keyframes progressFill { from{width:0} to{width:100%} }

  .we-process-display { position: relative; min-height: 260px; }
  .we-process-panel {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; justify-content: center;
    padding: 48px;
    background: rgba(201,168,76,0.04);
    border: 1px solid rgba(201,168,76,0.14);
    border-radius: 20px;
    transition: opacity 0.45s, transform 0.45s;
  }
  .we-pp-hidden { opacity: 0; transform: translateY(16px); pointer-events: none; }
  .we-pp-active { opacity: 1; transform: translateY(0); }
  .we-pp-icon { font-size: 2.4rem; margin-bottom: 12px; }
  .we-pp-num { font-family: 'Cormorant Garamond', serif; font-size: 5rem; font-weight: 300; color: rgba(201,168,76,0.1); line-height: 1; margin-bottom: 8px; }
  .we-pp-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 300; color: var(--cream); margin-bottom: 12px; }
  .we-pp-desc { font-size: 13.5px; color: var(--muted); line-height: 1.8; max-width: 380px; }

  /* Mobile process fallback */
  .we-process-steps-mobile { display: none; }
  @media (max-width: 760px) { .we-process-steps-mobile { display: flex; flex-direction: column; gap: 24px; } }

  .we-process-step {
    padding: 28px 24px;
    border: 1px solid rgba(201,168,76,0.12);
    border-radius: 16px;
    background: rgba(201,168,76,0.03);
    position: relative;
    transition: border-color 0.3s;
  }
  .we-process-step:hover { border-color: rgba(201,168,76,0.3); }
  .we-ps-num { font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; font-weight: 300; color: rgba(201,168,76,0.15); line-height: 1; margin-bottom: 12px; display: block; }
  .we-ps-icon-wrap { width: 46px; height: 46px; border-radius: 12px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.18); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 14px; }
  .we-process-step h4 { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--cream); margin-bottom: 8px; }
  .we-process-step p { font-size: 13px; color: var(--muted); line-height: 1.75; }
  .we-ps-connector { font-size: 20px; color: rgba(201,168,76,0.3); text-align: center; margin-top: 8px; display: block; }

  /* ── GALLERY ── */
  .we-gallery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto auto;
    gap: 12px;
  }
  @media (max-width: 760px) { .we-gallery-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 440px) { .we-gallery-grid { grid-template-columns: 1fr; } }

  .we-gallery-item {
    position: relative; border-radius: 16px; overflow: hidden;
    aspect-ratio: 4/3; cursor: pointer;
    transition: box-shadow 0.35s;
  }
  .we-gallery-item:hover { box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(201,168,76,0.25); }
  .we-gi-0 { grid-column: 1 / 2; grid-row: 1 / 2; aspect-ratio: unset; }
  .we-gi-1 { grid-column: 2 / 3; }
  .we-gi-3 { grid-column: 3 / 4; grid-row: 1 / 3; aspect-ratio: unset; }
  @media (max-width: 760px) { .we-gi-0,.we-gi-3 { grid-column: unset; grid-row: unset; aspect-ratio: 4/3; } }

  .we-gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(.22,1,.36,1); display: block; }
  .we-gallery-item:hover img { transform: scale(1.08); }
  .we-gallery-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(10,9,7,0.82) 0%, rgba(10,9,7,0.1) 50%, transparent 100%);
    display: flex; flex-direction: column; justify-content: flex-end; padding: 18px;
    opacity: 0; transition: opacity 0.35s;
  }
  .we-gallery-item:hover .we-gallery-overlay { opacity: 1; }
  .we-gallery-cat { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 4px; }
  .we-gallery-label { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 400; color: var(--cream); }
  .we-gallery-arrow { position: absolute; top: 16px; right: 16px; font-size: 18px; color: var(--gold); opacity: 0.8; }
  .we-gallery-note { text-align: center; font-size: 11px; color: var(--muted); margin-top: 18px; font-style: italic; }

  /* ── COMPARISON TABLE ── */
  .we-compare-section { background: var(--surface); }
  .we-compare-table {
    max-width: 700px; margin: 0 auto;
    border: 1px solid var(--border); border-radius: 20px; overflow: hidden;
    box-shadow: 0 12px 48px rgba(0,0,0,0.06);
  }
  .we-compare-header { display: grid; grid-template-columns: 2fr 1fr 1fr; background: var(--ink); }
  .we-compare-col { padding: 16px 20px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 4px; }
  .we-compare-blank { justify-content: flex-start; }
  .we-compare-us { background: rgba(201,168,76,0.09); border-left: 1px solid rgba(201,168,76,0.2); border-right: 1px solid rgba(201,168,76,0.2); }
  .we-compare-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; font-weight: 600; color: var(--gold); letter-spacing: 0.06em; }
  .we-compare-badge { font-size: 8.5px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(52,211,153,0.8); background: rgba(52,211,153,0.08); padding: 2px 8px; border-radius: 8px; }
  .we-compare-them { font-size: 12.5px; color: rgba(245,240,232,0.38); }
  .we-compare-row { display: grid; grid-template-columns: 2fr 1fr 1fr; border-top: 1px solid var(--border); transition: background 0.2s; }
  .we-compare-row-alt { background: var(--surface2); }
  .we-compare-row:hover { background: rgba(201,168,76,0.04); }
  .we-compare-feat { padding: 13px 20px; font-size: 13px; color: var(--ink); display: flex; align-items: center; justify-content: flex-start; }
  .we-compare-us-val, .we-compare-them-val { padding: 13px 20px; display: flex; align-items: center; justify-content: center; }
  .we-compare-us-val { background: rgba(201,168,76,0.035); border-left: 1px solid rgba(201,168,76,0.1); border-right: 1px solid rgba(201,168,76,0.1); }
  .we-check { width: 28px; height: 28px; border-radius: 50%; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.28); color: #34d399; font-size: 13px; display: flex; align-items: center; justify-content: center; font-weight: 700; transition: background 0.2s; }
  .we-compare-row:hover .we-check { background: rgba(52,211,153,0.16); }
  .we-cross { width: 28px; height: 28px; border-radius: 50%; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.22); color: #f87171; font-size: 13px; display: flex; align-items: center; justify-content: center; font-weight: 700; }

  /* ── TESTIMONIALS ── */
  .we-testimonials { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  @media (max-width: 860px) { .we-testimonials { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 560px) { .we-testimonials { grid-template-columns: 1fr; } }

  .we-testimonial {
    background: var(--white); border: 1px solid var(--border); border-radius: 18px;
    padding: 28px; display: flex; flex-direction: column; gap: 14px;
    position: relative; overflow: hidden;
    transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s, border-color 0.35s;
    cursor: default;
  }
  .we-testimonial::before {
    content: '201C'; position: absolute; top: -10px; left: 14px;
    font-family: 'Cormorant Garamond', serif; font-size: 6rem; font-weight: 300;
    color: rgba(201,168,76,0.07); line-height: 1; pointer-events: none;
  }
  .we-testimonial:hover { transform: translateY(-5px); border-color: rgba(201,168,76,0.38); box-shadow: 0 18px 50px rgba(201,168,76,0.1), 0 4px 16px rgba(0,0,0,0.06); }
  .we-t-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at bottom right, rgba(201,168,76,0.05) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.35s; pointer-events: none;
  }
  .we-testimonial:hover .we-t-glow { opacity: 1; }

  .we-testimonial-vendor { background: var(--ink2); border-color: rgba(201,168,76,0.16); }
  .we-testimonial-vendor .we-t-text { color: rgba(245,240,232,0.78); }
  .we-testimonial-vendor .we-t-name { color: var(--cream); }
  .we-testimonial-vendor .we-t-event { color: var(--muted); }
  .we-vendor-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); background: rgba(201,168,76,0.09); border: 1px solid rgba(201,168,76,0.24); padding: 3px 11px; border-radius: 24px; align-self: flex-start; }
  .we-t-stars { color: var(--gold); font-size: 11.5px; letter-spacing: 2px; }
  .we-t-text { font-family: 'Cormorant Garamond', serif; font-size: 1.02rem; font-style: italic; color: var(--ink); line-height: 1.75; flex: 1; }
  .we-t-author { display: flex; align-items: center; gap: 10px; }
  .we-t-avatar { width: 40px; height: 40px; color: var(--ink); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 700; flex-shrink: 0; }
  .we-t-name { display: block; font-size: 13px; font-weight: 500; color: var(--ink); }
  .we-t-event { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* ── CTA ── */
  .we-cta {
    position: relative; overflow: hidden;
    text-align: center; padding: 110px 20px;
    background: var(--ink);
  }
  .we-cta-orb1 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: var(--gold); opacity: 0.07; top: 50%; left: 50%; transform: translate(-50%,-50%); filter: blur(120px); animation: orbPulse 8s ease-in-out infinite alternate; }
  .we-cta-orb2 { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: #7b5ea7; opacity: 0.08; top: 10%; right: 8%; filter: blur(100px); }
  .we-cta-orb3 { position: absolute; width: 200px; height: 200px; border-radius: 50%; background: #4a90d9; opacity: 0.04; bottom: 12%; left: 8%; filter: blur(80px); }
  .we-cta-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(201,168,76,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.028) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%); pointer-events: none; }

  /* Decorative rings */
  .we-cta-rings { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .we-cta-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(201,168,76,0.07); }
  .we-cta-ring1 { width: 600px; height: 600px; animation: ringPulse 6s ease-in-out infinite; }
  .we-cta-ring2 { width: 450px; height: 450px; animation: ringPulse 6s 1.5s ease-in-out infinite; }
  .we-cta-ring3 { width: 300px; height: 300px; animation: ringPulse 6s 3s ease-in-out infinite; }
  @keyframes ringPulse { 0%,100%{opacity:0.5; transform:scale(1)} 50%{opacity:1; transform:scale(1.04)} }

  .we-cta-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
  .we-cta-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.4rem, 5.5vw, 4rem); font-weight: 300; color: var(--white); margin: 14px 0 18px; line-height: 1.12; }
  .we-cta-title em { font-style: italic; color: var(--gold-light); }
  .we-cta-sub { font-size: 14px; color: rgba(245,240,232,0.48); max-width: 420px; line-height: 1.8; margin-bottom: 40px; }
  .we-cta-btns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 26px; }
  .we-cta-footnote { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; align-items: center; font-size: 11.5px; color: rgba(245,240,232,0.26); }
  .we-cta-fn-sep { color: rgba(201,168,76,0.18); }

  /* ── SEO BLOCK ── */
  .we-seo-block { background: var(--surface2); border-top: 1px solid var(--border2); padding: 40px 20px; }
  .we-seo-inner { max-width: 900px; margin: 0 auto; }
  .we-seo-inner h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--muted); margin-bottom: 10px; }
  .we-seo-inner p { font-size: 12px; color: rgba(122,114,101,0.6); line-height: 2; }
  .we-seo-inner strong { color: var(--muted); }

  /* ── MOBILE ── */
  @media (max-width: 480px) {
    .we-hero { padding: 110px 16px 80px; min-height: auto; }
    .we-section { padding: 60px 16px; }
    .we-compare-feat { font-size: 12px; padding: 12px 14px; }
    .we-compare-col { padding: 12px 14px; }
    .we-cta-btns { flex-direction: column; align-items: center; }
    .we-btn-large { width: 100%; max-width: 300px; justify-content: center; }
    .we-cta-footnote { flex-direction: column; gap: 8px; }
    .we-cta-fn-sep { display: none; }
    .we-process-panel { padding: 28px; }
    .we-hero-trust-row { gap: 6px; }
    .we-trust-pill { font-size: 10px; padding: 4px 10px; }
    .we-eyebrow-pill { font-size: 9px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .we-reveal { transition: none; }
    .we-orb, .we-fcard, .we-dot, .we-marquee-track, .we-cta-ring, .we-scroll-line { animation: none; }
    .we-ps-nav-bar { transition: none; }
  }
`;