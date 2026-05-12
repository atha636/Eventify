import { useEffect, useRef, useState } from "react";
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

// ── Particle Canvas ──
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const particles = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.3,
        dx: (Math.random() - 0.5) * 0.22,
        dy: (Math.random() - 0.5) * 0.22,
        o: Math.random() * 0.4 + 0.08,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.o})`; ctx.fill();
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

// ── Real Unsplash wedding/event photos ──
const GALLERY_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80", alt: "Elegant wedding ceremony with floral arch", label: "Wedding Ceremony" },
  { url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=600&q=80", alt: "Wedding photographer capturing couple", label: "Wedding Photography" },
  { url: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&q=80", alt: "Luxurious wedding table floral centerpiece", label: "Floral Decor" },
  { url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&q=80", alt: "Romantic wedding reception decoration", label: "Reception Decor" },
  { url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80", alt: "Corporate event setup with elegant lighting", label: "Corporate Events" },
  { url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80", alt: "Beautiful wedding bouquet and bride", label: "Bride & Bouquet" },
];

const CLIENT_REASONS = [
  { icon: "✦", title: "Verified Vendors Only",       desc: "Every vendor on Evencers goes through a rigorous vetting process — background checks, portfolio reviews, and client references. You'll never deal with unreliable surprises on your special day." },
  { icon: "⚡", title: "Instant Booking",             desc: "No endless phone calls or back-and-forth emails. Browse packages, compare pricing, and confirm your booking in minutes — with real-time availability and instant confirmation." },
  { icon: "💎", title: "Curated Quality",             desc: "Our team personally evaluates every vendor for service quality, professionalism, and value. Only the best 15% of applicants make it onto our platform." },
  { icon: "🛡", title: "Booking Protection",          desc: "Your payment is secure until the service is delivered. Our escrow system ensures vendors are paid only after you're satisfied, giving you complete peace of mind." },
  { icon: "🎯", title: "All in One Place",            desc: "Photography, decoration, catering, music, florals, and venues — everything you need for your event, curated under one roof. No juggling 10 different contacts." },
  { icon: "⭐", title: "Dedicated Support",           desc: "Our concierge team is available 6 days a week to help you plan, troubleshoot, or answer any question — from first inquiry to post-event follow-up." },
];

const VENDOR_REASONS = [
  { icon: "📈", title: "Grow Your Business",         desc: "Get discovered by thousands of event planners actively searching for services like yours. Our SEO-optimized platform puts your portfolio in front of the right clients at the right time." },
  { icon: "💰", title: "Guaranteed Payments",        desc: "No more chasing invoices. Payments are processed securely through our platform and deposited directly to your account within 48 hours of service completion." },
  { icon: "🗓", title: "Smart Booking Calendar",     desc: "Manage your availability, block out dates, and handle multiple bookings from a single dashboard. Automated reminders mean fewer no-shows and wasted time." },
  { icon: "📊", title: "Detailed Analytics",         desc: "Understand how clients find you, which services are most popular, and how your ratings compare — with actionable insights to help you grow month after month." },
  { icon: "🤝", title: "Community & Network",        desc: "Join India's fastest-growing event professional network. Collaborate, refer clients, and build relationships with top photographers, decorators, and caterers." },
  { icon: "🏆", title: "Verified Badge",             desc: "Earn the Evencers Verified badge that signals trust and professionalism to clients. Top performers get featured placement and priority in search results." },
];

const TESTIMONIALS = [
  { name: "Meera & Arjun",    event: "Wedding · Delhi",           text: "We booked our photographer, decorator, and caterer through Evencers in a single afternoon. The quality of every vendor was exceptional.",                          avatar: "M", stars: 5 },
  { name: "Sunita Kapoor",    event: "Birthday · Chandigarh",     text: "I was skeptical at first, but the Evencers team personally helped me find the perfect florist within my budget. Absolutely magical event.",                          avatar: "S", stars: 5 },
  { name: "Raj Events Co.",   event: "Corporate · Delhi",         text: "As a corporate client, reliability is everything. Every vendor delivered on time, on budget, and beyond expectations.",                                             avatar: "R", stars: 5 },
  { name: "Pooja Photography",event: "Vendor since 2026",         text: "My bookings doubled within 3 months of joining Evencers. The dashboard is clean, payments are always on time, and the clients are serious.",                        avatar: "P", stars: 5, isVendor: true },
  { name: "Bloom & Petal",    event: "Vendor since 2026",         text: "Evencers helped us reach clients we never could have found on our own. The verified badge alone increased our conversion rate significantly.",                        avatar: "B", stars: 5, isVendor: true },
];

const STATS = [
  { num: "10",  suffix: "K+",  label: "Happy Clients",    icon: "🎉" },
  { num: "200", suffix: "+",   label: "Verified Vendors", icon: "✓"  },
  { num: "4",   suffix: ".9★", label: "Average Rating",   icon: "⭐" },
  { num: "4",   suffix: "+",   label: "Cities Served",    icon: "📍" },
];

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
  const [activeTab, setActiveTab] = useState("clients");

  useEffect(() => {
    document.title = "Why Evencers — India's Most Trusted Event Planning Platform";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.setAttribute("content", "Discover why 10k+ clients and 200+ vendors trust Evencers for weddings, corporate events, birthdays, and more. Verified vendors, instant booking, and dedicated support across India.");
    return () => { document.title = "Evencers"; };
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
            <div className="we-grain" />
            <div className="we-grid" />
          </div>
          <ParticleCanvas />

          <div className={`we-hero-inner we-reveal ${heroVisible ? "we-revealed" : ""}`} ref={heroRef}>
            <span className="we-eyebrow-pill">
              <span className="we-dot" />
              Why Choose Us
            </span>
            <h1 className="we-hero-title">
              India's Most <em>Trusted</em><br />
              Event Platform
            </h1>
            <p className="we-hero-sub">
              From intimate birthday parties to grand weddings — Evencers connects you with
              India's finest verified vendors, so every celebration becomes a masterpiece.
            </p>
            <div className="we-hero-cta-row">
              <button className="we-btn-primary" onClick={() => navigate("/vendors")}>
                Explore Vendors <span>→</span>
              </button>
              <button className="we-btn-ghost" onClick={() => navigate("/register")}>
                Join as Vendor
              </button>
            </div>
            <div className="we-hero-trust-row" aria-hidden="true">
              <span className="we-trust-pill">🔒 Secure Payments</span>
              <span className="we-trust-pill">✓ Verified Vendors</span>
              <span className="we-trust-pill">⚡ Instant Booking</span>
            </div>
          </div>

          {/* Floating badge cards */}
          <div className="we-float-cards" aria-hidden="true">
            <div className="we-fcard we-fc1">
              <span className="we-fc-icon">🏆</span>
              <span className="we-fc-title">Best Platform 2026</span>
              <span className="we-fc-sub">India Event Awards</span>
            </div>
            <div className="we-fcard we-fc2">
              <span className="we-fc-icon">🔒</span>
              <span className="we-fc-title">100% Secure Payments</span>
              <span className="we-fc-sub">Escrow Protected</span>
            </div>
            <div className="we-fcard we-fc3">
              <div className="we-fc-stars">★★★★★</div>
              <span className="we-fc-title">4.9 / 5 Rating</span>
              <span className="we-fc-sub">100+ Reviews</span>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="we-stats-bar" ref={statsRef}>
          {STATS.map((s, i) => (
            <div key={i} className={`we-stat we-reveal ${statsVisible ? "we-revealed" : ""}`} style={{ transitionDelay: `${i * 0.1}s` }}>
              <span className="we-stat-icon">{s.icon}</span>
              <span className="we-stat-num"><Counter target={s.num} suffix={s.suffix} /></span>
              <span className="we-stat-label">{s.label}</span>
            </div>
          ))}
        </section>

        {/* ── TAB SECTION: CLIENTS & VENDORS ── */}
        <section className="we-section we-reasons-section">
          <div className="we-tab-header">
            <p className="we-section-eyebrow">Built for everyone</p>
            <h2 className="we-section-title">Why Evencers Wins Every Time</h2>
            <p className="we-section-sub">Whether you're planning your dream event or growing your vendor business, we've built something extraordinary for you.</p>
            <div className="we-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === "clients"}
                className={`we-tab ${activeTab === "clients" ? "we-tab-active" : ""}`}
                onClick={() => setActiveTab("clients")}
              >
                <span>👑</span> For Clients
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "vendors"}
                className={`we-tab ${activeTab === "vendors" ? "we-tab-active" : ""}`}
                onClick={() => setActiveTab("vendors")}
              >
                <span>🎯</span> For Vendors
              </button>
            </div>
          </div>

          {/* Client Reasons */}
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
              </div>
            ))}
          </div>

          {/* Vendor Reasons */}
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
              </div>
            ))}
          </div>
        </section>

        {/* ── PROCESS ── */}
        <section className="we-process-section" ref={processRef}>
          <div className="we-process-bg">
            <div className="we-process-orb1" />
            <div className="we-process-orb2" />
          </div>
          <div className="we-section">
            <div className="we-tab-header">
              <p className="we-section-eyebrow" style={{ color: "var(--gold)" }}>Simple steps</p>
              <h2 className="we-section-title" style={{ color: "var(--cream)" }}>From Idea to Unforgettable</h2>
              <p className="we-section-sub" style={{ color: "rgba(122,114,101,0.7)" }}>Your event, your way — in four simple steps</p>
            </div>
            <div className="we-process-steps">
              {[
                { n: "01", icon: "🔍", title: "Discover", desc: "Browse hundreds of verified vendors by category, location, and budget. Read genuine reviews from real clients." },
                { n: "02", icon: "💬", title: "Connect",  desc: "View full portfolios, compare packages, and reach out to vendors directly through our secure messaging system." },
                { n: "03", icon: "⚡", title: "Book",     desc: "Confirm your booking instantly with secure payment. Receive a digital booking confirmation within minutes." },
                { n: "04", icon: "🎉", title: "Celebrate",desc: "Sit back and enjoy your flawlessly executed event. Our support team is on standby if you need anything." },
              ].map((s, i) => (
                <div
                  key={s.n}
                  className={`we-process-step we-reveal ${processVisible ? "we-revealed" : ""}`}
                  style={{ transitionDelay: `${i * 0.12}s` }}
                >
                  <div className="we-ps-num">{s.n}</div>
                  <div className="we-ps-icon-wrap">{s.icon}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                  {i < 3 && <div className="we-ps-connector" aria-hidden="true">→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GALLERY ── */}
        <section className="we-section" ref={galleryRef}>
          <div className={`we-tab-header we-reveal ${galleryVisible ? "we-revealed" : ""}`}>
            <p className="we-section-eyebrow">Real events, real magic</p>
            <h2 className="we-section-title">Events We've Helped Create</h2>
            <p className="we-section-sub">Every photo represents a real celebration brought to life by Evencers vendors</p>
          </div>
          <div className="we-gallery-grid">
            {GALLERY_PHOTOS.map((p, i) => (
              <div
                key={i}
                className={`we-gallery-item we-reveal ${galleryVisible ? "we-revealed" : ""}`}
                style={{ transitionDelay: `${i * 0.09}s` }}
              >
                <img src={p.url} alt={p.alt} loading="lazy" />
                <div className="we-gallery-overlay">
                  <span className="we-gallery-label">{p.label}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="we-gallery-note">
            Photos sourced from Unsplash — representative of the vendor quality on our platform
          </p>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className="we-section we-compare-section">
          <div className="we-tab-header">
            <p className="we-section-eyebrow">See the difference</p>
            <h2 className="we-section-title">Evencers vs. Traditional Planning</h2>
            <p className="we-section-sub">Everything you'd want — and nothing you wouldn't.</p>
          </div>
          <div className="we-compare-table">
            <div className="we-compare-header">
              <div className="we-compare-col we-compare-blank" />
              <div className="we-compare-col we-compare-us">
                <span className="we-compare-logo">✦ Evencers</span>
              </div>
              <div className="we-compare-col we-compare-them">
                Traditional
              </div>
            </div>
            {[
              "Verified vendors",
              "Instant booking",
              "Secure payments",
              "Transparent pricing",
              "6-day support",
              "Portfolio + reviews",
              "All categories in one place",
              "Post-event protection",
            ].map((feat, i) => (
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
            <h2 className="we-section-title">Loved by Clients & Vendors</h2>
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
                  <div className="we-t-avatar" style={{ background: t.isVendor ? "rgba(201,168,76,0.2)" : "var(--gold)" }}>
                    {t.avatar}
                  </div>
                  <div>
                    <span className="we-t-name">{t.name}</span>
                    <span className="we-t-event">{t.event}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="we-cta" ref={ctaRef}>
          <div className="we-cta-orb1" />
          <div className="we-cta-orb2" />
          <div className="we-cta-grid" aria-hidden="true" />
          <div className={`we-cta-inner we-reveal ${ctaVisible ? "we-revealed" : ""}`}>
            <span className="we-eyebrow-pill" style={{ marginBottom: "20px" }}>
              <span className="we-dot" />
              Ready to begin?
            </span>
            <h2 className="we-cta-title">Your perfect event starts <em>here.</em></h2>
            <p className="we-cta-sub">
              Join over 12K clients and 200+ vendors who trust Evencers to deliver extraordinary celebrations across India.
            </p>
            <div className="we-cta-btns">
              <button className="we-btn-primary we-btn-large" onClick={() => navigate("/vendors")}>
                Find Vendors <span>→</span>
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

  .we-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── REVEAL ── */
  .we-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s cubic-bezier(.22,1,.36,1), transform 0.65s cubic-bezier(.22,1,.36,1); will-change: opacity, transform; }
  .we-revealed { opacity: 1; transform: translateY(0); }

  /* ── HERO ── */
  .we-hero {
    position: relative; background: var(--ink); overflow: hidden;
    padding: 130px 20px 90px; display: flex; flex-direction: column; align-items: center;
    min-height: 92vh;
  }
  .we-hero-bg { position: absolute; inset: 0; pointer-events: none; }
  .we-orb { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.18; animation: orbPulse 8s ease-in-out infinite alternate; }
  .we-orb1 { width: 520px; height: 520px; background: var(--gold); top: -150px; left: -100px; animation-delay: 0s; }
  .we-orb2 { width: 380px; height: 380px; background: #7b5ea7; top: -80px; right: -60px; animation-delay: -2.5s; }
  .we-orb3 { width: 260px; height: 260px; background: var(--gold); bottom: 60px; left: 45%; opacity: 0.08; animation-delay: -4s; }
  @keyframes orbPulse { from{transform:scale(1) translate(0,0)} to{transform:scale(1.1) translate(14px,-14px)} }
  .we-grain { position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); opacity: 0.5; }
  .we-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%); }

  .we-hero-inner { position: relative; z-index: 2; text-align: center; max-width: 780px; width: 100%; animation: heroEnter 0.8s cubic-bezier(.22,1,.36,1) both; }
  @keyframes heroEnter { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }

  .we-eyebrow-pill { display: inline-flex; align-items: center; gap: 8px; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 22px; border: 1px solid rgba(201,168,76,0.3); padding: 6px 14px; border-radius: 24px; background: rgba(201,168,76,0.07); }
  .we-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); animation: dotBlink 2s ease-in-out infinite; }
  @keyframes dotBlink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.6)} }

  .we-hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.6rem, 7vw, 5rem); font-weight: 300; color: var(--white); line-height: 1.08; margin-bottom: 22px; }
  .we-hero-title em { font-style: italic; color: var(--gold-light); }
  .we-hero-sub { font-size: 14.5px; color: rgba(245,240,232,0.6); line-height: 1.8; margin-bottom: 38px; max-width: 500px; margin-left: auto; margin-right: auto; }

  .we-hero-cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 28px; }

  .we-hero-trust-row {
    display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
    animation: heroEnter 0.8s 0.35s cubic-bezier(.22,1,.36,1) both;
  }
  .we-trust-pill {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; color: rgba(245,240,232,0.4); letter-spacing: 0.05em;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(201,168,76,0.1);
    padding: 5px 12px; border-radius: 20px;
  }

  .we-btn-primary { background: var(--gold); color: var(--ink); border: none; border-radius: 10px; padding: 13px 28px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: transform 0.25s, box-shadow 0.25s; -webkit-tap-highlight-color: transparent; position: relative; overflow: hidden; }
  .we-btn-primary::after { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%); transform: translateX(-100%); transition: transform 0.4s; }
  .we-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(201,168,76,0.4); }
  .we-btn-primary:hover::after { transform: translateX(100%); }
  .we-btn-primary:active { transform: scale(0.97); }
  .we-btn-ghost { background: rgba(255,255,255,0.06); color: var(--cream); border: 1px solid rgba(245,240,232,0.2); border-radius: 10px; padding: 13px 28px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 400; cursor: pointer; transition: border-color 0.2s, color 0.2s, transform 0.2s, background 0.2s; -webkit-tap-highlight-color: transparent; }
  .we-btn-ghost:hover { border-color: var(--gold); color: var(--gold); transform: translateY(-2px); background: rgba(201,168,76,0.06); }
  .we-btn-ghost:active { transform: scale(0.97); }
  .we-btn-large { padding: 16px 36px; font-size: 15px; }

  /* Floating cards */
  .we-float-cards { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
  .we-fcard { position: absolute; background: rgba(255,255,255,0.06); backdrop-filter: blur(14px); border: 1px solid rgba(201,168,76,0.2); border-radius: 14px; padding: 14px 18px; display: flex; flex-direction: column; gap: 3px; }
  .we-fc-icon { font-size: 20px; margin-bottom: 2px; }
  .we-fc-title { font-size: 12px; font-weight: 500; color: rgba(245,240,232,0.9); }
  .we-fc-sub { font-size: 10.5px; color: rgba(245,240,232,0.4); }
  .we-fc-stars { color: var(--gold); font-size: 11px; margin-bottom: 2px; }
  .we-fc1 { left: 4%; top: 28%; animation: floatCard1 6s ease-in-out infinite; }
  .we-fc2 { right: 4%; top: 32%; animation: floatCard2 7s ease-in-out infinite; }
  .we-fc3 { right: 6%; bottom: 18%; animation: floatCard3 5.5s ease-in-out infinite; }
  @keyframes floatCard1{0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-14px) rotate(1deg)}}
  @keyframes floatCard2{0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-12px) rotate(-1deg)}}
  @keyframes floatCard3{0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)}}
  @media (max-width: 900px) { .we-float-cards { display: none; } }

  /* ── STATS BAR ── */
  .we-stats-bar { display: grid; grid-template-columns: repeat(4,1fr); background: var(--white); border-bottom: 1px solid var(--border); }
  @media (max-width: 600px) { .we-stats-bar { grid-template-columns: repeat(2,1fr); } }
  .we-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 28px 16px; text-align: center; border-right: 1px solid var(--border); transition: background 0.3s; position: relative; overflow: hidden; cursor: default; }
  .we-stat::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 0; height: 2px; background: var(--gold); transition: width 0.4s cubic-bezier(.22,1,.36,1); }
  .we-stat:hover { background: var(--surface); }
  .we-stat:hover::after { width: 50%; }
  .we-stat:last-child { border-right: none; }
  @media (max-width: 600px) {
    .we-stat:nth-child(2) { border-right: none; }
    .we-stat:nth-child(3) { border-right: 1px solid var(--border); border-top: 1px solid var(--border); }
    .we-stat:nth-child(4) { border-top: 1px solid var(--border); }
  }
  .we-stat-icon { font-size: 1.4rem; }
  .we-stat-num { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.5rem, 4vw, 2.2rem); font-weight: 600; color: var(--gold); letter-spacing: -0.02em; }
  .we-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.05em; }

  /* ── SHARED SECTION ── */
  .we-section { max-width: 1120px; margin: 0 auto; padding: 72px 20px; }
  .we-tab-header { text-align: center; margin-bottom: 48px; }
  .we-section-eyebrow { display: block; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
  .we-section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 300; color: var(--ink); margin-bottom: 10px; }
  .we-section-sub { font-size: 13.5px; color: var(--muted); max-width: 500px; margin: 0 auto; line-height: 1.7; }

  /* ── TABS ── */
  .we-tabs { display: inline-flex; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 5px; margin-top: 24px; }
  .we-tab { display: flex; align-items: center; gap: 7px; padding: 10px 22px; border-radius: 8px; border: none; background: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 400; color: var(--muted); cursor: pointer; transition: background 0.25s, color 0.25s, box-shadow 0.25s; -webkit-tap-highlight-color: transparent; }
  .we-tab-active { background: var(--ink); color: var(--gold-light); box-shadow: 0 4px 16px rgba(14,12,10,0.18); }
  .we-tab:not(.we-tab-active):hover { background: rgba(201,168,76,0.08); color: var(--ink); }

  .we-tab-panel-hidden { display: none; }
  .we-tab-panel-active { display: grid; }

  /* ── REASONS GRID ── */
  .we-reasons-grid { grid-template-columns: repeat(3,1fr); gap: 16px; }
  @media (max-width: 860px) { .we-reasons-grid { grid-template-columns: repeat(2,1fr); gap: 12px; } }
  @media (max-width: 480px) { .we-reasons-grid { grid-template-columns: 1fr; gap: 10px; } }

  .we-reason-card { background: var(--white); border: 1px solid var(--border); border-radius: 16px; padding: 28px 24px; transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; position: relative; overflow: hidden; }
  .we-reason-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--gold), transparent); opacity: 0; transition: opacity 0.3s; }
  .we-reason-card:hover { transform: translateY(-5px); box-shadow: 0 16px 48px rgba(0,0,0,0.08); border-color: rgba(201,168,76,0.4); }
  .we-reason-card:hover::before { opacity: 1; }
  .we-reason-card-vendor { background: var(--ink); border-color: rgba(201,168,76,0.15); }
  .we-reason-card-vendor .we-reason-title { color: var(--cream); }
  .we-reason-card-vendor .we-reason-desc { color: rgba(122,114,101,0.8); }
  .we-reason-card-vendor:hover { border-color: rgba(201,168,76,0.5); box-shadow: 0 16px 48px rgba(0,0,0,0.3); }

  .we-reason-icon-wrap {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.15);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px; font-size: 1.3rem;
    transition: background 0.3s, transform 0.3s;
  }
  .we-reason-card:hover .we-reason-icon-wrap { background: rgba(201,168,76,0.14); transform: scale(1.08) rotate(-4deg); }
  .we-reason-icon-wrap-vendor { background: rgba(201,168,76,0.08); border-color: rgba(201,168,76,0.18); }
  .we-reason-icon { display: block; }
  .we-reason-title { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
  .we-reason-desc { font-size: 13px; color: var(--muted); line-height: 1.75; }

  /* ── PROCESS ── */
  .we-process-section { background: var(--ink); position: relative; overflow: hidden; padding: 80px 0; }
  .we-process-bg { position: absolute; inset: 0; pointer-events: none; }
  .we-process-orb1 { position: absolute; width: 500px; height: 300px; border-radius: 50%; background: var(--gold); opacity: 0.06; filter: blur(100px); top: -100px; left: -100px; }
  .we-process-orb2 { position: absolute; width: 350px; height: 350px; border-radius: 50%; background: #7b5ea7; opacity: 0.06; filter: blur(100px); bottom: -100px; right: -50px; }

  .we-process-steps { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; position: relative; }
  @media (max-width: 760px) { .we-process-steps { grid-template-columns: 1fr 1fr; gap: 32px 0; } }
  @media (max-width: 440px) { .we-process-steps { grid-template-columns: 1fr; } }

  .we-process-step { padding: 28px 20px 28px 0; border-top: 1px solid rgba(201,168,76,0.15); position: relative; transition: border-color 0.3s; }
  .we-process-step:hover { border-color: rgba(201,168,76,0.5); }
  .we-ps-num { font-family: 'Cormorant Garamond', serif; font-size: 3rem; font-weight: 300; color: rgba(201,168,76,0.18); line-height: 1; margin-bottom: 14px; display: block; transition: color 0.3s; }
  .we-process-step:hover .we-ps-num { color: rgba(201,168,76,0.35); }
  .we-ps-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.18); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 14px; transition: all 0.3s; }
  .we-process-step:hover .we-ps-icon-wrap { background: rgba(201,168,76,0.15); transform: scale(1.06) rotate(-4deg); }
  .we-process-step h4 { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--cream); margin-bottom: 8px; }
  .we-process-step p { font-size: 13px; color: var(--muted); line-height: 1.7; }
  .we-ps-connector { position: absolute; right: -10px; top: 54px; font-size: 18px; color: rgba(201,168,76,0.3); z-index: 2; }
  @media (max-width: 760px) { .we-ps-connector { display: none; } }

  /* ── GALLERY ── */
  .we-gallery-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
  @media (max-width: 760px) { .we-gallery-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 440px) { .we-gallery-grid { grid-template-columns: 1fr; } }

  .we-gallery-item { position: relative; border-radius: 14px; overflow: hidden; aspect-ratio: 4/3; cursor: pointer; }
  .we-gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s cubic-bezier(.22,1,.36,1); display: block; }
  .we-gallery-item:hover img { transform: scale(1.07); }
  .we-gallery-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(14,12,10,0.75) 0%, transparent 55%); display: flex; align-items: flex-end; padding: 16px; opacity: 0; transition: opacity 0.3s; }
  .we-gallery-item:hover .we-gallery-overlay { opacity: 1; }
  .we-gallery-label { font-size: 12px; font-weight: 500; color: var(--gold-light); letter-spacing: 0.08em; }
  .we-gallery-note { text-align: center; font-size: 11px; color: var(--muted); margin-top: 16px; font-style: italic; }

  /* ── COMPARISON TABLE ── */
  .we-compare-section { background: var(--surface); border-radius: 0; }
  .we-compare-table { max-width: 680px; margin: 0 auto; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.04); }
  .we-compare-header { display: grid; grid-template-columns: 2fr 1fr 1fr; background: var(--ink); }
  .we-compare-col { padding: 14px 20px; display: flex; align-items: center; justify-content: center; }
  .we-compare-blank { justify-content: flex-start; }
  .we-compare-us { background: rgba(201,168,76,0.1); border-left: 1px solid rgba(201,168,76,0.2); border-right: 1px solid rgba(201,168,76,0.2); }
  .we-compare-logo { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; color: var(--gold); letter-spacing: 0.06em; }
  .we-compare-them { font-size: 12.5px; color: rgba(245,240,232,0.45); }
  .we-compare-row { display: grid; grid-template-columns: 2fr 1fr 1fr; border-top: 1px solid var(--border); transition: background 0.2s; }
  .we-compare-row-alt { background: var(--surface); }
  .we-compare-row:hover { background: rgba(201,168,76,0.04); }
  .we-compare-feat { padding: 14px 20px; font-size: 13px; color: var(--ink); display: flex; align-items: center; justify-content: flex-start; }
  .we-compare-us-val, .we-compare-them-val { padding: 14px 20px; display: flex; align-items: center; justify-content: center; }
  .we-compare-us-val { background: rgba(201,168,76,0.04); border-left: 1px solid rgba(201,168,76,0.12); border-right: 1px solid rgba(201,168,76,0.12); }
  .we-check { width: 26px; height: 26px; border-radius: 50%; background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.3); color: #34d399; font-size: 13px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .we-cross { width: 26px; height: 26px; border-radius: 50%; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); color: #f87171; font-size: 13px; display: flex; align-items: center; justify-content: center; font-weight: 700; }

  /* ── TESTIMONIALS ── */
  .we-testimonials { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  @media (max-width: 860px) { .we-testimonials { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 560px) { .we-testimonials { grid-template-columns: 1fr; } }

  .we-testimonial { background: var(--white); border: 1px solid var(--border); border-radius: 14px; padding: 26px; display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; }
  .we-testimonial::before { content: '"'; position: absolute; top: -8px; left: 14px; font-family: 'Cormorant Garamond', serif; font-size: 5rem; font-weight: 300; color: rgba(201,168,76,0.08); line-height: 1; pointer-events: none; }
  .we-testimonial:hover { transform: translateY(-4px); border-color: rgba(201,168,76,0.4); box-shadow: 0 14px 40px rgba(201,168,76,0.1); }
  .we-testimonial-vendor { background: var(--ink); border-color: rgba(201,168,76,0.18); }
  .we-testimonial-vendor .we-t-text { color: rgba(245,240,232,0.8); }
  .we-testimonial-vendor .we-t-name { color: var(--cream); }
  .we-testimonial-vendor .we-t-event { color: var(--muted); }
  .we-vendor-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 9.5px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); padding: 3px 10px; border-radius: 24px; align-self: flex-start; }
  .we-t-stars { color: var(--gold); font-size: 11px; letter-spacing: 2px; }
  .we-t-text { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-style: italic; color: var(--ink); line-height: 1.7; flex: 1; }
  .we-t-author { display: flex; align-items: center; gap: 10px; }
  .we-t-avatar { width: 38px; height: 38px; color: var(--ink); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 700; flex-shrink: 0; }
  .we-t-name { display: block; font-size: 13px; font-weight: 500; color: var(--ink); }
  .we-t-event { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }
  .we-testimonial-vendor .we-t-name { color: var(--cream); }

  /* ── CTA ── */
  .we-cta { position: relative; overflow: hidden; text-align: center; padding: 100px 20px; background: var(--ink); }
  .we-cta-orb1 { position: absolute; width: 450px; height: 450px; border-radius: 50%; background: var(--gold); opacity: 0.08; top: 50%; left: 50%; transform: translate(-50%,-50%); filter: blur(110px); animation: orbPulse 7s ease-in-out infinite alternate; }
  .we-cta-orb2 { position: absolute; width: 280px; height: 280px; border-radius: 50%; background: #7b5ea7; opacity: 0.09; top: 10%; right: 8%; filter: blur(90px); }
  .we-cta-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%); pointer-events: none; }
  .we-cta-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
  .we-cta-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.2rem, 5vw, 3.6rem); font-weight: 300; color: var(--white); margin: 14px 0 16px; }
  .we-cta-title em { font-style: italic; color: var(--gold-light); }
  .we-cta-sub { font-size: 14px; color: rgba(245,240,232,0.5); max-width: 420px; line-height: 1.75; margin-bottom: 36px; }
  .we-cta-btns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 24px; }
  .we-cta-footnote {
    display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; align-items: center;
    font-size: 11.5px; color: rgba(245,240,232,0.28);
  }
  .we-cta-fn-sep { color: rgba(201,168,76,0.2); }

  /* ── SEO BLOCK ── */
  .we-seo-block { background: var(--surface); border-top: 1px solid var(--border); padding: 36px 20px; }
  .we-seo-inner { max-width: 900px; margin: 0 auto; }
  .we-seo-inner h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--muted); margin-bottom: 10px; }
  .we-seo-inner p { font-size: 12px; color: rgba(122,114,101,0.65); line-height: 1.9; }
  .we-seo-inner strong { color: var(--muted); }

  /* ── MOBILE ── */
  @media (max-width: 480px) {
    .we-hero { padding: 100px 16px 70px; }
    .we-section { padding: 56px 16px; }
    .we-compare-table { font-size: 12px; }
    .we-compare-feat { font-size: 12px; padding: 12px 14px; }
    .we-compare-col { padding: 12px 14px; }
    .we-cta-btns { flex-direction: column; align-items: center; }
    .we-btn-large { width: 100%; max-width: 300px; justify-content: center; }
    .we-cta-footnote { flex-direction: column; gap: 8px; }
    .we-cta-fn-sep { display: none; }
    .we-hero-trust-row { gap: 6px; }
    .we-trust-pill { font-size: 10px; padding: 4px 10px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .we-reveal { transition: none; }
    .we-orb, .we-fcard, .we-dot { animation: none; }
  }
`;