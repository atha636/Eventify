import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CATEGORIES, FEATURED_POST, POSTS, SIDEBAR_POSTS } from "../data/blog";
import Logo from "../components/Logo";

// ── SEO ──
function useSEO() {
  useEffect(() => {
    document.title = "Blog – Event Planning Tips, Trends & Inspiration | Evencers";
    const setMeta = (sel, attr, val) => {
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        const [k, v] = attr.split("=");
        el.setAttribute(k, v);
        document.head.appendChild(el);
      }
      el.setAttribute("content", val);
    };
    setMeta(
      'meta[name="description"]',
      "name=description",
      "Explore expert event planning tips, wedding trends, vendor spotlights and real stories from the Evencers team. Your go-to guide for flawless celebrations."
    );
  }, []);
}

// ── Scroll-reveal hook ──
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Marquee Strip ──
function MarqueeStrip() {
  const items = [
    "Wedding Planning", "Vendor Spotlights", "Decor Trends",
    "Real Events", "Corporate Tips", "Photography Guides",
    "Catering Ideas", "Birthday Inspo", "Budget Hacks",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="bl-marquee-wrap" aria-hidden="true">
      <div className="bl-marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="bl-marquee-item">
            {item} <span className="bl-marquee-dot">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Card Component ──
function PostCard({ post, index, visible, onNavigate }) {
  return (
    <article
      className={`bl-card bl-reveal ${visible ? "bl-revealed" : ""}`}
      style={{ transitionDelay: `${index * 0.09}s`, "--card-accent": post.accent }}
      onClick={() => onNavigate(post.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onNavigate(post.slug)}
      aria-label={`Read article: ${post.title}`}
    >
      <div
        className="bl-card-thumb"
        style={{ background: `linear-gradient(135deg, ${post.accent}22 0%, ${post.accent}08 100%)` }}
      >
        <span className="bl-card-emoji" aria-hidden="true">{post.emoji}</span>
        <span className="bl-card-cat">{post.category}</span>
      </div>
      <div className="bl-card-body">
        <h3 className="bl-card-title">{post.title}</h3>
        <p className="bl-card-excerpt">{post.excerpt}</p>
        <div className="bl-card-meta">
          <span className="bl-card-author">{post.author}</span>
          <span className="bl-card-sep" aria-hidden="true">·</span>
          <span className="bl-card-date">{post.date}</span>
          <span className="bl-card-sep" aria-hidden="true">·</span>
          <span className="bl-card-read">{post.readTime}</span>
        </div>
        <button
          className="bl-card-link"
          onClick={(e) => { e.stopPropagation(); onNavigate(post.slug); }}
          aria-label={`Read: ${post.title}`}
        >
          Read Article <span className="bl-card-arrow">→</span>
        </button>
      </div>
    </article>
  );
}

export default function Blogs() {
  useSEO();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [heroRef, heroVisible] = useReveal(0.1);
  const [featuredRef, featuredVisible] = useReveal(0.1);
  const [gridRef, gridVisible] = useReveal(0.1);
  const [sidebarRef, sidebarVisible] = useReveal(0.1);
  const [newsletterRef, newsletterVisible] = useReveal(0.1);

  const handleNavigate = (slug) => {
    navigate(`/blog/${slug}`);
  };

  const filteredPosts = POSTS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <style>{styles}</style>
      <div className="bl-root">
        <Navbar />

        {/* ── HERO ── */}
        <header className="bl-hero">
          <div className="bl-hero-bg" aria-hidden="true">
            <div className="bl-orb bl-orb1" />
            <div className="bl-orb bl-orb2" />
            <div className="bl-orb bl-orb3" />
            <div className="bl-grain" />
            <div className="bl-grid-lines" />
          </div>
          <div className="bl-hero-bg-text" aria-hidden="true">BLOG</div>

          <div className="bl-hero-inner" ref={heroRef}>
            <p className="bl-hero-eyebrow">
              <span className="bl-eyebrow-dot" aria-hidden="true" />
              Stories, Tips & Inspiration
            </p>
            <h1 className="bl-hero-title">
              The art of<br />
              <em>unforgettable</em><br />
              celebrations.
            </h1>
            <p className="bl-hero-sub">
              Expert planning advice, real event stories, vendor spotlights and
              trend reports — everything you need to plan with confidence.
            </p>

            {/* Search */}
            <div className="bl-search-wrap">
              <span className="bl-search-icon" aria-hidden="true">⌕</span>
              <input
                className="bl-search"
                type="text"
                placeholder="Search articles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search blog posts"
              />
              {searchQuery && (
                <button
                  className="bl-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="bl-hero-stats" aria-label="Blog statistics">
              {[
                { num: "50+", label: "Articles" },
                { num: `${CATEGORIES.length - 1}`, label: "Categories" },
                { num: "10k+", label: "Monthly Readers" },
              ].map((s, i) => (
                <div key={i} className="bl-hero-stat">
                  <span className="bl-hs-num">{s.num}</span>
                  <span className="bl-hs-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating tag cards */}
          <div className="bl-hero-floats" aria-hidden="true">
            <div className="bl-float-card bl-fc-a">
              <span className="bl-fc-emoji">💍</span>
              <span className="bl-fc-label">Wedding Tips</span>
            </div>
            <div className="bl-float-card bl-fc-b">
              <span className="bl-fc-emoji">📸</span>
              <span className="bl-fc-label">Photography</span>
            </div>
            <div className="bl-float-card bl-fc-c">
              <span className="bl-fc-emoji">🎪</span>
              <span className="bl-fc-label">Event Ideas</span>
            </div>
          </div>
        </header>

        {/* ── MARQUEE ── */}
        <MarqueeStrip />

        {/* ── FEATURED POST ── */}
        <section className="bl-featured-section" aria-labelledby="featured-heading">
          <div className="bl-featured-wrap">
            <div
              className={`bl-featured-inner bl-reveal ${featuredVisible ? "bl-revealed" : ""}`}
              ref={featuredRef}
            >
              <div
                className="bl-featured-visual"
                style={{ background: `linear-gradient(${FEATURED_POST.gradient})` }}
                aria-hidden="true"
              >
                <div className="bl-featured-pattern" />
                <span className="bl-featured-big-emoji">{FEATURED_POST.emoji}</span>
              </div>
              <div className="bl-featured-content">
                <div className="bl-featured-tags">
                  <span className="bl-tag bl-tag-gold">{FEATURED_POST.tag}</span>
                  <span className="bl-tag bl-tag-outline">{FEATURED_POST.category}</span>
                </div>
                <h2 id="featured-heading" className="bl-featured-title">
                  {FEATURED_POST.title}
                </h2>
                <p className="bl-featured-excerpt">{FEATURED_POST.excerpt}</p>
                <div className="bl-featured-author">
                  <div
                    className="bl-author-avatar"
                    style={{ background: `linear-gradient(${FEATURED_POST.authorGradient})` }}
                  >
                    {FEATURED_POST.authorInitial}
                  </div>
                  <div className="bl-author-info">
                    <span className="bl-author-name">{FEATURED_POST.author}</span>
                    <span className="bl-author-role">{FEATURED_POST.authorRole}</span>
                  </div>
                  <div className="bl-featured-meta-right">
                    <span className="bl-meta-date">{FEATURED_POST.date}</span>
                    <span className="bl-meta-read">{FEATURED_POST.readTime}</span>
                  </div>
                </div>
                <button
                  className="bl-btn-primary"
                  onClick={() => handleNavigate(FEATURED_POST.slug)}
                >
                  Read Full Article <span className="bl-btn-arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── CATEGORY FILTER ── */}
        <div className="bl-filter-bar" role="navigation" aria-label="Category filter">
          <div className="bl-filter-inner">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`bl-filter-btn ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT: GRID + SIDEBAR ── */}
        <div className="bl-content-wrap">
          {/* Post Grid */}
          <main className="bl-grid-section" aria-label="Blog posts">
            <div className="bl-grid" ref={gridRef}>
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={i}
                    visible={gridVisible}
                    onNavigate={handleNavigate}
                  />
                ))
              ) : (
                <div className="bl-empty">
                  <span className="bl-empty-emoji">🔍</span>
                  <p className="bl-empty-text">No articles found for "{searchQuery}"</p>
                  <button
                    className="bl-btn-ghost"
                    onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Load More */}
            {filteredPosts.length > 0 && (
              <div className="bl-load-more-wrap">
                <button className="bl-load-more">Load More Articles</button>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="bl-sidebar" ref={sidebarRef} aria-label="Sidebar">
            {/* Popular Posts */}
            <div className={`bl-sidebar-card bl-reveal ${sidebarVisible ? "bl-revealed" : ""}`}>
              <h3 className="bl-sidebar-title">Popular This Month</h3>
              <ol className="bl-popular-list">
                {SIDEBAR_POSTS.map((post, i) => (
                  <li key={post.id} className="bl-popular-item">
                    <span className="bl-popular-num">{String(i + 1).padStart(2, "0")}</span>
                    <div className="bl-popular-content">
                      <button className="bl-popular-title">{post.title}</button>
                      <div className="bl-popular-meta">
                        <span className="bl-popular-cat">{post.category}</span>
                        <span>·</span>
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Categories */}
            <div
              className={`bl-sidebar-card bl-reveal ${sidebarVisible ? "bl-revealed" : ""}`}
              style={{ transitionDelay: "0.1s" }}
            >
              <h3 className="bl-sidebar-title">Categories</h3>
              <div className="bl-cat-list">
                {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                  <button
                    key={cat}
                    className={`bl-cat-chip ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                    <span className="bl-cat-count">
                      {POSTS.filter((p) => p.category === cat).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vendor CTA */}
            <div
              className={`bl-sidebar-cta bl-reveal ${sidebarVisible ? "bl-revealed" : ""}`}
              style={{ transitionDelay: "0.2s" }}
            >
              <div className="bl-sidebar-cta-orb" aria-hidden="true" />
              <span className="bl-sidebar-cta-emoji" aria-hidden="true">🏪</span>
              <h4 className="bl-sidebar-cta-title">Are you an event vendor?</h4>
              <p className="bl-sidebar-cta-desc">
                List your services on Evencers and get discovered by thousands of clients.
              </p>
              <button
                className="bl-btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => navigate("/register")}
              >
                Join as Vendor →
              </button>
            </div>
          </aside>
        </div>

        {/* ── NEWSLETTER ── */}
        <section
          className="bl-newsletter"
          ref={newsletterRef}
          aria-labelledby="newsletter-heading"
        >
          <div className="bl-nl-orb1" aria-hidden="true" />
          <div className="bl-nl-orb2" aria-hidden="true" />
          <div className={`bl-newsletter-inner bl-reveal ${newsletterVisible ? "bl-revealed" : ""}`}>
            <p className="bl-eyebrow-light">Stay inspired</p>
            <h2 id="newsletter-heading" className="bl-nl-title">
              Get the best event planning<br />
              <em>tips in your inbox.</em>
            </h2>
            <p className="bl-nl-sub">
              Join 3,000+ planners, couples and vendors who get our weekly digest —
              trends, checklists, real stories and exclusive Evencers offers.
            </p>
            <form className="bl-nl-form" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                className="bl-nl-input"
                placeholder="Your email address"
                aria-label="Email address for newsletter"
              />
              <button type="submit" className="bl-btn-primary bl-nl-btn">
                Subscribe <span className="bl-btn-arrow">→</span>
              </button>
            </form>
            <p className="bl-nl-note">No spam. Unsubscribe anytime. We hate clutter too.</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bl-footer" role="contentinfo">
          <div className="bl-footer-logo">
  <Logo />
  EVENCERS
</div>
          <p className="bl-footer-tagline">India's trusted event vendor platform</p>
          <p className="bl-footer-copy">© 2025 Evencers. Crafted with care in India.</p>
          <nav className="bl-footer-links" aria-label="Footer navigation">
            {["Home", "Vendors", "Blog", "About", "Privacy", "Contact"].map((l) => (
              <a key={l} href="#" className="bl-footer-link">{l}</a>
            ))}
          </nav>
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
    --gold-glow: rgba(201,168,76,0.18);
    --muted: #7a7265;
    --border: rgba(201,168,76,0.18);
    --white: #ffffff;
    --surface: #faf7f2;
  }

  .bl-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── REVEAL ── */
  .bl-reveal {
    opacity: 0; transform: translateY(28px);
    transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
    will-change: opacity, transform;
  }
  .bl-revealed { opacity: 1; transform: translateY(0); }

  /* ── HERO ── */
  .bl-hero {
    position: relative; background: var(--ink);
    overflow: hidden; padding: 140px 20px 110px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 92svh;
  }

  .bl-hero-bg { position: absolute; inset: 0; pointer-events: none; }

  .bl-grid-lines {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.035) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, transparent 72%);
  }

  .bl-orb {
    position: absolute; border-radius: 50%;
    filter: blur(90px); opacity: 0.18;
    animation: blOrbPulse 9s ease-in-out infinite alternate;
    will-change: transform;
  }
  .bl-orb1 { width: 500px; height: 500px; background: var(--gold); top: -140px; left: -80px; }
  .bl-orb2 { width: 380px; height: 380px; background: #7b5ea7; top: -60px; right: -60px; animation-delay: -3s; }
  .bl-orb3 { width: 280px; height: 280px; background: var(--gold); bottom: 60px; left: 40%; opacity: 0.07; animation-delay: -5.5s; }
  @keyframes blOrbPulse {
    from { transform: scale(1) translate(0,0); }
    to   { transform: scale(1.14) translate(18px,-18px); }
  }

  .bl-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E");
    opacity: 0.5;
  }

  .bl-hero-bg-text {
    position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%);
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(5rem, 20vw, 16rem);
    font-weight: 600; letter-spacing: 0.15em;
    color: rgba(201,168,76,0.04);
    pointer-events: none; user-select: none;
    white-space: nowrap; z-index: 0; line-height: 1;
  }

  .bl-hero-inner {
    position: relative; z-index: 2;
    text-align: center; max-width: 700px; width: 100%;
    animation: blHeroIn 0.85s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes blHeroIn {
    from { opacity: 0; transform: translateY(36px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .bl-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 22px;
    border: 1px solid rgba(201,168,76,0.28); padding: 6px 16px;
    border-radius: 24px; background: rgba(201,168,76,0.07);
  }
  .bl-eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--gold);
    animation: blDotBlink 2s ease-in-out infinite; flex-shrink: 0;
  }
  @keyframes blDotBlink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.6)} }

  .bl-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.5rem, 6.5vw, 4.8rem);
    font-weight: 300; color: var(--white);
    line-height: 1.08; margin-bottom: 20px;
    letter-spacing: -0.015em;
  }
  .bl-hero-title em { font-style: italic; color: var(--gold-light); }

  .bl-hero-sub {
    font-size: 14px; color: rgba(245,240,232,0.52); line-height: 1.82;
    margin-bottom: 36px; max-width: 480px; margin-left: auto; margin-right: auto;
  }

  /* Search */
  .bl-search-wrap {
    position: relative; max-width: 420px; margin: 0 auto 32px;
  }
  .bl-search-icon {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    font-size: 18px; color: rgba(245,240,232,0.3); pointer-events: none;
  }
  .bl-search {
    width: 100%; padding: 14px 44px 14px 44px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(201,168,76,0.2);
    border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 13.5px;
    color: var(--white); outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .bl-search::placeholder { color: rgba(245,240,232,0.3); }
  .bl-search:focus { border-color: rgba(201,168,76,0.5); background: rgba(255,255,255,0.1); }
  .bl-search-clear {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: rgba(245,240,232,0.4); font-size: 18px;
    cursor: pointer; line-height: 1; padding: 4px;
    transition: color 0.2s;
  }
  .bl-search-clear:hover { color: var(--white); }

  /* Hero stats */
  .bl-hero-stats {
    display: flex; gap: 32px; justify-content: center; flex-wrap: wrap;
  }
  .bl-hero-stat { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .bl-hs-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem; font-weight: 600; color: var(--gold); line-height: 1;
  }
  .bl-hs-label { font-size: 11px; color: rgba(245,240,232,0.38); letter-spacing: 0.08em; text-transform: uppercase; }

  /* Floating tag cards */
  .bl-hero-floats { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
  .bl-float-card {
    position: absolute;
    background: rgba(255,255,255,0.055); backdrop-filter: blur(16px);
    border: 1px solid rgba(201,168,76,0.18); border-radius: 14px;
    padding: 13px 18px; display: flex; flex-direction: column; gap: 4px; align-items: center;
  }
  .bl-fc-emoji { font-size: 1.3rem; }
  .bl-fc-label { font-size: 10px; color: rgba(245,240,232,0.45); letter-spacing: 0.06em; }
  .bl-fc-a { left: 5%; top: 36%; animation: blFloat1 6s ease-in-out infinite; }
  .bl-fc-b { right: 5%; top: 34%; animation: blFloat2 7.5s ease-in-out infinite; }
  .bl-fc-c { right: 7%; bottom: 22%; animation: blFloat3 5.5s ease-in-out infinite; }
  @keyframes blFloat1 { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-18px) rotate(1deg)} }
  @keyframes blFloat2 { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-12px) rotate(-1.5deg)} }
  @keyframes blFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @media (max-width: 900px) { .bl-hero-floats { display: none; } }

  /* ── MARQUEE ── */
  .bl-marquee-wrap { overflow: hidden; background: var(--gold); padding: 11px 0; }
  .bl-marquee-track {
    display: flex; width: max-content;
    animation: blMarquee 28s linear infinite;
  }
  @keyframes blMarquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  .bl-marquee-item {
    display: inline-flex; align-items: center; gap: 18px;
    font-size: 11px; font-weight: 500; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--ink);
    padding: 0 24px; white-space: nowrap;
  }
  .bl-marquee-dot { font-size: 7px; opacity: 0.5; }
  @media (prefers-reduced-motion: reduce) { .bl-marquee-track { animation: none; } }

  /* ── BUTTONS ── */
  .bl-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px; background: var(--gold); color: var(--ink);
    border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; font-weight: 500; cursor: pointer;
    transition: transform 0.25s, box-shadow 0.25s;
  }
  @media (hover:hover) {
    .bl-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(201,168,76,0.38); }
    .bl-btn-primary:hover .bl-btn-arrow { transform: translateX(5px); }
  }
  .bl-btn-primary:active { transform: scale(0.97); }
  .bl-btn-arrow { display: inline-block; transition: transform 0.25s; }

  .bl-btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; background: transparent; color: var(--ink);
    border: 1px solid var(--border); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
  }
  @media (hover:hover) {
    .bl-btn-ghost:hover { border-color: var(--gold); background: var(--gold-glow); transform: translateY(-1px); }
  }

  /* ── FEATURED ── */
  .bl-featured-section {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 68px 20px;
  }
  .bl-featured-wrap { max-width: 1100px; margin: 0 auto; }

  .bl-featured-inner {
    display: grid; grid-template-columns: 1fr 1.1fr; gap: 0;
    border: 1px solid var(--border); border-radius: 20px; overflow: hidden;
    box-shadow: 0 8px 48px rgba(14,12,10,0.07);
  }
  @media (max-width: 820px) { .bl-featured-inner { grid-template-columns: 1fr; } }

  .bl-featured-visual {
    position: relative; min-height: 360px;
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .bl-featured-pattern {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 30px 30px;
  }
  .bl-featured-big-emoji { font-size: 7rem; filter: drop-shadow(0 12px 40px rgba(0,0,0,0.3)); z-index: 1; }

  .bl-featured-content { padding: 44px 40px; display: flex; flex-direction: column; gap: 0; }
  @media (max-width: 600px) { .bl-featured-content { padding: 28px 22px; } }

  .bl-featured-tags { display: flex; gap: 8px; margin-bottom: 18px; }
  .bl-tag {
    display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; padding: 5px 12px; border-radius: 24px;
  }
  .bl-tag-gold { background: var(--gold); color: var(--ink); }
  .bl-tag-outline { background: transparent; border: 1px solid var(--border); color: var(--muted); }

  .bl-featured-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.5rem, 2.8vw, 2rem); font-weight: 600; color: var(--ink);
    line-height: 1.2; margin-bottom: 16px; letter-spacing: -0.01em;
  }
  .bl-featured-excerpt { font-size: 13.5px; color: var(--muted); line-height: 1.8; margin-bottom: 28px; }

  .bl-featured-author {
    display: flex; align-items: center; gap: 12px; margin-bottom: 28px;
  }
  .bl-author-avatar {
    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600;
    color: var(--ink);
  }
  .bl-author-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .bl-author-name { font-size: 13px; font-weight: 500; color: var(--ink); }
  .bl-author-role { font-size: 11px; color: var(--gold); letter-spacing: 0.05em; }
  .bl-featured-meta-right { display: flex; flex-direction: column; gap: 2px; text-align: right; }
  .bl-meta-date { font-size: 11.5px; color: var(--muted); }
  .bl-meta-read { font-size: 11px; color: var(--gold); font-weight: 500; }

  /* ── FILTER BAR ── */
  .bl-filter-bar {
    background: var(--white); border-bottom: 1px solid var(--border);
    position: sticky; top: 66px; z-index: 50;
  }
  .bl-filter-inner {
    max-width: 1100px; margin: 0 auto; padding: 0 20px;
    display: flex; gap: 0; overflow-x: auto;
    scrollbar-width: none; -ms-overflow-style: none;
  }
  .bl-filter-inner::-webkit-scrollbar { display: none; }
  .bl-filter-btn {
    flex-shrink: 0; padding: 15px 18px;
    background: none; border: none; border-bottom: 2px solid transparent;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 400;
    color: var(--muted); cursor: pointer; letter-spacing: 0.03em;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
  }
  .bl-filter-btn:hover { color: var(--ink); }
  .bl-filter-btn.active { color: var(--ink); border-bottom-color: var(--gold); font-weight: 500; }

  /* ── CONTENT LAYOUT ── */
  .bl-content-wrap {
    max-width: 1100px; margin: 0 auto; padding: 48px 20px 64px;
    display: grid; grid-template-columns: 1fr 300px; gap: 40px; align-items: start;
  }
  @media (max-width: 960px) { .bl-content-wrap { grid-template-columns: 1fr; } }

  /* ── CARD GRID ── */
  .bl-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;
  }
  @media (max-width: 680px) { .bl-grid { grid-template-columns: 1fr; } }

  .bl-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 16px; overflow: hidden;
    transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s, border-color 0.3s;
    position: relative; cursor: pointer;
    display: flex; flex-direction: column;
  }
  .bl-card::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    background: var(--card-accent, var(--gold));
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.35s cubic-bezier(.22,1,.36,1);
  }
  @media (hover:hover) {
    .bl-card:hover { transform: translateY(-5px); box-shadow: 0 18px 44px rgba(14,12,10,0.09); border-color: rgba(201,168,76,0.3); }
    .bl-card:hover::after { transform: scaleX(1); }
    .bl-card:hover .bl-card-arrow { transform: translateX(5px); }
    .bl-card:hover .bl-card-emoji { transform: scale(1.15) rotate(-5deg); }
  }

  .bl-card-thumb {
    height: 160px; display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .bl-card-emoji { font-size: 3.5rem; transition: transform 0.3s cubic-bezier(.22,1,.36,1); display: block; }
  .bl-card-cat {
    position: absolute; top: 12px; left: 12px;
    font-size: 9.5px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(255,255,255,0.85); color: var(--muted); border: 1px solid var(--border);
    backdrop-filter: blur(8px);
  }

  .bl-card-body { padding: 22px 22px 20px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .bl-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem; font-weight: 600; color: var(--ink);
    line-height: 1.3; letter-spacing: -0.01em;
  }
  .bl-card-excerpt { font-size: 12.5px; color: var(--muted); line-height: 1.72; flex: 1; }
  .bl-card-meta {
    display: flex; align-items: center; flex-wrap: wrap; gap: 5px;
    font-size: 11px; color: rgba(122,114,101,0.6);
  }
  .bl-card-author { font-weight: 500; color: var(--muted); }
  .bl-card-sep { color: rgba(201,168,76,0.4); }
  .bl-card-read { color: var(--gold); font-weight: 500; }
  .bl-card-link {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--ink); padding: 0; margin-top: 4px;
    transition: color 0.2s;
  }
  .bl-card-link:hover { color: var(--gold); }
  .bl-card-arrow { display: inline-block; transition: transform 0.25s; font-size: 13px; }

  /* Empty state */
  .bl-empty {
    grid-column: 1 / -1; text-align: center; padding: 60px 20px;
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }
  .bl-empty-emoji { font-size: 3rem; }
  .bl-empty-text { font-size: 14px; color: var(--muted); }

  /* Load more */
  .bl-load-more-wrap { margin-top: 32px; display: flex; justify-content: center; }
  .bl-load-more {
    padding: 13px 36px; background: transparent;
    border: 1px solid var(--border); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: var(--muted); cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s, transform 0.2s;
  }
  @media (hover:hover) {
    .bl-load-more:hover { border-color: var(--gold); color: var(--ink); background: var(--gold-glow); transform: translateY(-1px); }
  }

  /* ── SIDEBAR ── */
  .bl-sidebar { display: flex; flex-direction: column; gap: 20px; }

  .bl-sidebar-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 16px; padding: 24px 22px;
  }
  .bl-sidebar-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 600; color: var(--ink);
    margin-bottom: 18px; padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }

  /* Popular list */
  .bl-popular-list { list-style: none; display: flex; flex-direction: column; gap: 16px; }
  .bl-popular-item { display: flex; gap: 14px; align-items: flex-start; }
  .bl-popular-num {
    font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600;
    color: rgba(201,168,76,0.4); line-height: 1; flex-shrink: 0; margin-top: 2px;
  }
  .bl-popular-content { display: flex; flex-direction: column; gap: 4px; }
  .bl-popular-title {
    background: none; border: none; cursor: pointer; text-align: left; padding: 0;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    color: var(--ink); line-height: 1.45; transition: color 0.2s;
  }
  .bl-popular-title:hover { color: var(--gold); }
  .bl-popular-meta {
    display: flex; gap: 5px; align-items: center;
    font-size: 10.5px; color: rgba(122,114,101,0.55);
  }
  .bl-popular-cat { color: var(--gold); font-weight: 500; }

  /* Category chips */
  .bl-cat-list { display: flex; flex-direction: column; gap: 6px; }
  .bl-cat-chip {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 9px 12px;
    background: var(--surface); border: 1px solid transparent;
    border-radius: 8px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: var(--muted);
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    text-align: left;
  }
  .bl-cat-chip:hover { border-color: var(--border); color: var(--ink); background: var(--white); }
  .bl-cat-chip.active { border-color: rgba(201,168,76,0.4); color: var(--ink); background: var(--white); font-weight: 500; }
  .bl-cat-count {
    font-size: 11px; background: var(--gold-glow); color: var(--gold);
    border-radius: 10px; padding: 1px 7px; font-weight: 600;
  }

  /* Sidebar CTA */
  .bl-sidebar-cta {
    background: var(--ink); border-radius: 16px;
    padding: 28px 22px; text-align: center;
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .bl-sidebar-cta-orb {
    position: absolute; width: 200px; height: 200px;
    background: var(--gold); border-radius: 50%; filter: blur(60px); opacity: 0.08;
    top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none;
  }
  .bl-sidebar-cta-emoji { font-size: 1.8rem; z-index: 1; }
  .bl-sidebar-cta-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; font-weight: 600;
    color: var(--cream); z-index: 1; line-height: 1.25;
  }
  .bl-sidebar-cta-desc { font-size: 12px; color: rgba(245,240,232,0.45); line-height: 1.65; z-index: 1; }
  .bl-sidebar-cta .bl-btn-primary { z-index: 1; margin-top: 6px; }

  /* ── NEWSLETTER ── */
  .bl-newsletter {
    position: relative; overflow: hidden;
    background: var(--ink); padding: 100px 20px;
    text-align: center;
  }
  .bl-nl-orb1 {
    position: absolute; width: 500px; height: 500px;
    background: var(--gold); border-radius: 50%; filter: blur(110px); opacity: 0.07;
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    animation: blOrbPulse 7s ease-in-out infinite alternate;
  }
  .bl-nl-orb2 {
    position: absolute; width: 280px; height: 280px;
    background: #7b5ea7; border-radius: 50%; filter: blur(80px); opacity: 0.09;
    top: 10%; right: 8%;
  }
  .bl-newsletter-inner { position: relative; z-index: 1; max-width: 560px; margin: 0 auto; }
  .bl-eyebrow-light {
    display: block; font-size: 10px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 12px;
  }
  .bl-nl-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 4.8vw, 3.4rem); font-weight: 300; color: var(--white);
    line-height: 1.12; margin-bottom: 16px; letter-spacing: -0.01em;
  }
  .bl-nl-title em { font-style: italic; color: var(--gold-light); }
  .bl-nl-sub { font-size: 13.5px; color: rgba(245,240,232,0.42); line-height: 1.8; margin-bottom: 36px; }

  .bl-nl-form {
    display: flex; gap: 10px; max-width: 420px; margin: 0 auto 14px;
  }
  @media (max-width: 480px) { .bl-nl-form { flex-direction: column; } }
  .bl-nl-input {
    flex: 1; padding: 13px 18px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(201,168,76,0.22);
    border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px;
    color: var(--white); outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .bl-nl-input::placeholder { color: rgba(245,240,232,0.3); }
  .bl-nl-input:focus { border-color: rgba(201,168,76,0.5); background: rgba(255,255,255,0.1); }
  .bl-nl-btn { flex-shrink: 0; }
  .bl-nl-note { font-size: 11px; color: rgba(245,240,232,0.25); }

  /* ── FOOTER ── */
  .bl-footer {
    background: #0a0806; padding: 36px 20px; text-align: center;
    display: flex; flex-direction: column; gap: 12px; align-items: center;
    border-top: 1px solid rgba(201,168,76,0.1);
  }
  .bl-footer-logo {
    font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600;
    color: var(--gold); letter-spacing: 0.2em; text-transform: uppercase;
  }
  .bl-footer-tagline { font-size: 11.5px; color: rgba(122,114,101,0.55); }
  .bl-footer-copy { font-size: 11px; color: rgba(122,114,101,0.4); }
  .bl-footer-links { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
  .bl-footer-link {
    font-size: 12px; color: var(--muted); text-decoration: none; transition: color 0.2s;
  }
  .bl-footer-link:hover { color: var(--gold); }

  /* ── MOBILE ── */
  @media (max-width: 480px) {
    .bl-hero { padding: 110px 16px 80px; min-height: 80svh; }
    .bl-featured-section, .bl-newsletter { padding: 48px 16px; }
    .bl-content-wrap { padding: 32px 16px 48px; }
    .bl-nl-form { flex-direction: column; }
    .bl-nl-btn { width: 100%; justify-content: center; }
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .bl-reveal { transition: none; }
    .bl-orb, .bl-eyebrow-dot { animation: none; }
    .bl-fc-a, .bl-fc-b, .bl-fc-c { animation: none; }
    .bl-marquee-track { animation: none; }
    .bl-nl-orb1 { animation: none; }
  }
`;