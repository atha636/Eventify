import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CustomerCarePopup from "../components/CustomerCarePopup";  // ← ADD THIS

export default function Home() {
  const navigate = useNavigate();
const user = JSON.parse(localStorage.getItem("user"));
  const services = [
    { name: "Decor", type: "decor", emoji: "🎨", desc: "Transform any space into something magical", count: "240+ vendors" },
    { name: "Photography", type: "photography", emoji: "📸", desc: "Capture every moment, forever preserved", count: "180+ vendors" },
    { name: "Catering", type: "catering", emoji: "🍽", desc: "Exquisite menus crafted for your occasion", count: "130+ vendors" },
    { name: "Music & DJ", type: "music", emoji: "🎵", desc: "Set the perfect mood for your celebration", count: "95+ vendors" },
    { name: "Florals", type: "florals", emoji: "💐", desc: "Blooms that breathe life into every event", count: "110+ vendors" },
    { name: "Venues", type: "venues", emoji: "🏛", desc: "Iconic spaces for unforgettable gatherings", count: "75+ vendors" },
  ];

  const testimonials = [
    { name: "Priya S.", event: "Wedding · Delhi", text: "Found our photographer and decorator within an hour. Absolutely seamless experience.", avatar: "P" },
    { name: "Rohan M.", event: "Corporate · Mumbai", text: "The vendor quality is exceptional. Our product launch was a massive success.", avatar: "R" },
    { name: "Ananya K.", event: "Birthday · Bangalore", text: "I was overwhelmed planning alone. Eventify made it feel effortless and fun.", avatar: "A" },
  ];

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
          </div>

          <div className="hm-hero-inner">
            <span className="hm-hero-eyebrow">✦ India's Premier Event Platform</span>
            <h1 className="hm-hero-title">
              Every great event<br />
              <em>deserves a great team.</em>
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
                onKeyDown={(e) => e.key === "Enter" && navigate(`/search?q=${e.target.value}`)}
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

          <div className="hm-hero-stats">
            {[
              { num: "12K+", label: "Happy Clients" },
              { num: "850+", label: "Verified Vendors" },
              { num: "50+", label: "Cities" },
              { num: "4.9★", label: "Avg. Rating" },
            ].map((s, i) => (
              <div key={i} className="hm-hero-stat">
                <span className="hm-stat-num">{s.num}</span>
                <span className="hm-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section className="hm-section">
          <div className="hm-section-header">
            <p className="hm-eyebrow">✦ What we offer</p>
            <h2 className="hm-section-title">Browse by Service</h2>
            <p className="hm-section-sub">Hand-picked professionals for every kind of celebration</p>
          </div>

          <div className="hm-services-grid">
            {services.map((s, i) => (
              <div
                key={s.type}
                className="hm-service-card"
                onClick={() => navigate(`/category/${s.type}`)}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
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
        <section className="hm-how">
          <div className="hm-how-inner">
            <div className="hm-section-header">
              <p className="hm-eyebrow" style={{ color: "var(--gold-light)" }}>✦ Simple process</p>
              <h2 className="hm-section-title" style={{ color: "var(--cream)" }}>How Eventify works</h2>
            </div>
            <div className="hm-steps">
              {[
                { n: "01", title: "Browse & Filter", desc: "Explore hundreds of verified vendors across categories and locations." },
                { n: "02", title: "Choose a Package", desc: "Compare packages, pricing, and reviews to find your perfect match." },
                { n: "03", title: "Book Instantly", desc: "Confirm your date with a single click. No back-and-forth emails." },
              ].map((step) => (
                <div key={step.n} className="hm-step">
                  <span className="hm-step-num">{step.n}</span>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="hm-section">
          <div className="hm-section-header">
            <p className="hm-eyebrow">✦ Client stories</p>
            <h2 className="hm-section-title">Loved by thousands</h2>
          </div>
          <div className="hm-testimonials">
            {testimonials.map((t, i) => (
              <div key={i} className="hm-testimonial">
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
        <section className="hm-cta">
          <div className="hm-cta-orb" />
          <p className="hm-eyebrow" style={{ color: "var(--gold)" }}>✦ Ready to begin?</p>
          <h2 className="hm-cta-title">Your dream event starts here.</h2>
          <p className="hm-cta-sub">Join over 12,000 clients who planned their perfect day with Eventify.</p>
          <div className="hm-cta-btns">
            <button className="hm-cta-primary" onClick={() => navigate("/register")}>
              Get Started Free →
            </button>
            <button className="hm-cta-secondary" onClick={() => navigate("/vendors")}>
              Browse Vendors
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="hm-footer">
          <div className="hm-footer-logo">✦ Eventify </div>
          <p className="hm-footer-copy">© 2025 Eventify. Crafted with care in India.</p>
          <div className="hm-footer-links">
            {["About", "Vendors", "Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="hm-footer-link">{l}</a>
            ))}
          </div>
        </footer>

        {/* ── CUSTOMER CARE POPUP ── */}
        {user && <CustomerCarePopup />} {/* ← ADD THIS — renders the floating button */}
      </div>
    </>
  );
}

// styles are unchanged from your original — paste your full styles const here
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
  }

  .hm-hero {
    position: relative;
    background: var(--ink);
    overflow: hidden;
    padding: 100px 32px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .hm-hero-bg { position: absolute; inset: 0; pointer-events: none; }
  .hm-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.18; }
  .hm-orb1 { width: 500px; height: 500px; background: var(--gold); top: -120px; left: -80px; }
  .hm-orb2 { width: 400px; height: 400px; background: #7b5ea7; top: -60px; right: -60px; }
  .hm-orb3 { width: 300px; height: 300px; background: var(--gold); bottom: 60px; left: 40%; opacity: 0.08; }
  .hm-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.4;
  }

  .hm-hero-inner {
    position: relative; z-index: 2;
    text-align: center; max-width: 720px;
    animation: fadeUp 0.7s ease both;
  }
  .hm-hero-eyebrow {
    display: inline-block; font-size: 11px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 20px;
    border: 1px solid rgba(201,168,76,0.3); padding: 5px 14px;
    border-radius: 20px; background: rgba(201,168,76,0.07);
  }
  .hm-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.8rem, 6vw, 4.2rem); font-weight: 300;
    color: var(--white); line-height: 1.12; margin-bottom: 20px;
  }
  .hm-hero-title em { font-style: italic; color: var(--gold-light); }
  .hm-hero-sub {
    font-size: 15px; color: rgba(245,240,232,0.65); line-height: 1.7;
    margin-bottom: 36px; max-width: 520px; margin-left: auto; margin-right: auto;
  }

  .hm-hero-search {
    display: flex; align-items: center; background: var(--white);
    border-radius: 10px; padding: 6px 6px 6px 16px; gap: 10px;
    max-width: 560px; margin: 0 auto 24px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.3);
  }
  .hm-search-icon { font-size: 18px; color: var(--muted); flex-shrink: 0; }
  .hm-search-input { flex: 1; border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); background: transparent; }
  .hm-search-input::placeholder { color: #bbb4a8; }
  .hm-search-btn { background: var(--ink); color: var(--white); border: none; border-radius: 7px; padding: 11px 20px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
  .hm-search-btn:hover { background: var(--gold); color: var(--ink); }

  .hm-hero-pills { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 72px; }
  .hm-pill { font-size: 12px; color: var(--gold-light); border: 1px solid rgba(201,168,76,0.25); border-radius: 20px; padding: 5px 14px; cursor: pointer; transition: all 0.2s; background: rgba(201,168,76,0.06); }
  .hm-pill:hover { background: rgba(201,168,76,0.15); border-color: var(--gold); }

  .hm-hero-stats {
    position: relative; z-index: 2;
    display: grid; grid-template-columns: repeat(4, 1fr);
    width: 100%; max-width: 760px;
    border: 1px solid rgba(201,168,76,0.15); border-bottom: none;
    border-radius: 12px 12px 0 0; overflow: hidden;
    background: rgba(255,255,255,0.04); backdrop-filter: blur(10px);
  }
  .hm-hero-stat { display: flex; flex-direction: column; gap: 3px; padding: 20px 24px; border-right: 1px solid rgba(201,168,76,0.15); text-align: center; }
  .hm-hero-stat:last-child { border-right: none; }
  .hm-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 1.7rem; font-weight: 600; color: var(--gold); }
  .hm-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.07em; }

  .hm-section { max-width: 1100px; margin: 0 auto; padding: 80px 32px; }
  .hm-section-header { text-align: center; margin-bottom: 48px; }
  .hm-eyebrow { display: block; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
  .hm-section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 300; color: var(--ink); margin-bottom: 10px; }
  .hm-section-sub { font-size: 14px; color: var(--muted); }

  .hm-services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  @media (max-width: 900px) { .hm-services-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 560px) { .hm-services-grid { grid-template-columns: 1fr; } }

  .hm-service-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 28px 24px 20px; cursor: pointer; transition: all 0.25s ease; display: flex; flex-direction: column; gap: 14px; animation: fadeUp 0.5s ease both; }
  .hm-service-card:hover { border-color: var(--gold); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(201,168,76,0.15); }
  .hm-service-emoji { font-size: 2rem; }
  .hm-service-body h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600; color: var(--ink); margin-bottom: 5px; }
  .hm-service-body p { font-size: 12.5px; color: var(--muted); line-height: 1.6; }
  .hm-service-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border); }
  .hm-service-count { font-size: 11.5px; color: var(--gold); font-weight: 500; }
  .hm-service-arrow { font-size: 16px; color: var(--muted); transition: transform 0.2s, color 0.2s; }
  .hm-service-card:hover .hm-service-arrow { transform: translateX(4px); color: var(--gold); }

  .hm-how { background: var(--ink); padding: 80px 32px; }
  .hm-how-inner { max-width: 1000px; margin: 0 auto; }
  .hm-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 48px; }
  @media (max-width: 700px) { .hm-steps { grid-template-columns: 1fr; } }
  .hm-step { border-left: 1px solid rgba(201,168,76,0.2); padding-left: 24px; }
  .hm-step-num { font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; font-weight: 300; color: rgba(201,168,76,0.35); display: block; margin-bottom: 12px; line-height: 1; }
  .hm-step h4 { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--cream); margin-bottom: 8px; }
  .hm-step p { font-size: 13px; color: var(--muted); line-height: 1.7; }

  .hm-testimonials { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  @media (max-width: 800px) { .hm-testimonials { grid-template-columns: 1fr; } }
  .hm-testimonial { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 28px; display: flex; flex-direction: column; gap: 20px; }
  .hm-t-text { font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; font-style: italic; color: var(--ink); line-height: 1.65; flex: 1; }
  .hm-t-author { display: flex; align-items: center; gap: 12px; }
  .hm-t-avatar { width: 38px; height: 38px; background: var(--ink); color: var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; flex-shrink: 0; }
  .hm-t-name { display: block; font-size: 13px; font-weight: 500; color: var(--ink); }
  .hm-t-event { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }

  .hm-cta { position: relative; overflow: hidden; text-align: center; padding: 100px 32px; background: var(--surface); border-top: 1px solid var(--border); }
  .hm-cta-orb { position: absolute; width: 500px; height: 500px; background: var(--gold); border-radius: 50%; filter: blur(120px); opacity: 0.08; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
  .hm-cta-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 300; color: var(--ink); margin: 10px 0 14px; }
  .hm-cta-sub { font-size: 14px; color: var(--muted); margin-bottom: 36px; }
  .hm-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .hm-cta-primary { padding: 15px 32px; background: var(--ink); color: var(--white); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.25s; }
  .hm-cta-primary:hover { background: var(--gold); color: var(--ink); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(201,168,76,0.3); }
  .hm-cta-secondary { padding: 15px 32px; background: transparent; color: var(--ink); border: 1px solid var(--border); border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.25s; }
  .hm-cta-secondary:hover { border-color: var(--gold); color: var(--gold); }

  .hm-footer { background: var(--ink); padding: 36px 32px; text-align: center; display: flex; flex-direction: column; gap: 12px; align-items: center; }
  .hm-footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--gold); letter-spacing: 0.18em; text-transform: uppercase; }
  .hm-footer-copy { font-size: 12px; color: var(--muted); }
  .hm-footer-links { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
  .hm-footer-link { font-size: 12px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .hm-footer-link:hover { color: var(--gold); }

  @media (max-width: 560px) {
    .hm-hero-stats { grid-template-columns: repeat(2,1fr); }
    .hm-hero { padding-top: 60px; }
  }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
`;