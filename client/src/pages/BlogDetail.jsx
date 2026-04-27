import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ALL_POSTS } from "../data/blog";

// ── SEO ──
function useSEO(post) {
  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | Evencers Blog`;
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
    setMeta('meta[name="description"]', "name=description", post.excerpt);
  }, [post]);
}

// ── Scroll-reveal hook ──
function useReveal(threshold = 0.08) {
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

// ── Reading progress bar ──
function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <div className="bd-progress-bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
      <div className="bd-progress-fill" style={{ width: `${progress}%` }} />
    </div>
  );
}

// ── Content block renderer ──
function ContentBlock({ block }) {
  switch (block.type) {
    case "intro":
      return <p className="bd-intro">{block.text}</p>;
    case "heading":
      return <h2 className="bd-heading">{block.text}</h2>;
    case "paragraph":
      return <p className="bd-paragraph">{block.text}</p>;
    case "callout":
      return (
        <div className="bd-callout">
          <span className="bd-callout-emoji" aria-hidden="true">{block.emoji}</span>
          <p className="bd-callout-text">{block.text}</p>
        </div>
      );
    case "list":
      return (
        <div className="bd-list-block">
          {block.heading && <p className="bd-list-heading">{block.heading}</p>}
          <ul className="bd-list">
            {block.items.map((item, i) => (
              <li key={i} className="bd-list-item">
                <span className="bd-list-dot" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    default:
      return null;
  }
}

// ── Related Post Card ──
function RelatedCard({ post, onNavigate }) {
  return (
    <article
      className="bd-related-card"
      onClick={() => onNavigate(post.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onNavigate(post.slug)}
      aria-label={`Read: ${post.title}`}
      style={{ "--rc-accent": post.accent }}
    >
      <div
        className="bd-related-thumb"
        style={{ background: `linear-gradient(135deg, ${post.accent}22 0%, ${post.accent}08 100%)` }}
      >
        <span className="bd-related-emoji" aria-hidden="true">{post.emoji}</span>
        <span className="bd-related-cat">{post.category}</span>
      </div>
      <div className="bd-related-body">
        <h3 className="bd-related-title">{post.title}</h3>
        <div className="bd-related-meta">
          <span>{post.author}</span>
          <span className="bd-dot">·</span>
          <span>{post.readTime}</span>
        </div>
        <span className="bd-related-link">
          Read Article <span className="bd-arrow">→</span>
        </span>
      </div>
    </article>
  );
}

// ── 404 Not Found ──
function NotFound({ onBack }) {
  return (
    <div className="bd-notfound">
      <span className="bd-nf-emoji">📭</span>
      <h2 className="bd-nf-title">Article not found</h2>
      <p className="bd-nf-sub">This post doesn't exist or may have been moved.</p>
      <button className="bd-btn-primary" onClick={onBack}>← Back to Blog</button>
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = ALL_POSTS.find((p) => p.slug === slug);

  useSEO(post);

  const [heroRef, heroVisible] = useReveal(0.05);
  const [contentRef, contentVisible] = useReveal(0.05);
  const [relatedRef, relatedVisible] = useReveal(0.08);

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  const handleNavigate = (targetSlug) => {
    navigate(`/blog/${targetSlug}`);
  };

  const relatedPosts = post
    ? (post.relatedIds || [])
        .map((id) => ALL_POSTS.find((p) => p.id === id))
        .filter(Boolean)
    : [];

  return (
    <>
      <style>{styles}</style>
      <div className="bd-root">
        <Navbar />
        <ReadingProgress />

        {!post ? (
          <NotFound onBack={() => navigate("/blog")} />
        ) : (
          <>
            {/* ── HERO ── */}
            <header
              className="bd-hero"
              style={{ "--hero-gradient": `linear-gradient(${post.gradient || `135deg, ${post.accent}cc 0%, #0e0c0a 100%`})` }}
            >
              <div className="bd-hero-bg" aria-hidden="true">
                <div className="bd-hero-gradient" />
                <div className="bd-hero-grid" />
                <div className="bd-hero-grain" />
                <div
                  className="bd-hero-orb"
                  style={{ background: post.accent }}
                />
              </div>

              <div className="bd-hero-inner" ref={heroRef}>
                {/* Back button */}
                <button
                  className="bd-back-btn"
                  onClick={() => navigate("/blog")}
                  aria-label="Back to blog"
                >
                  <span className="bd-back-arrow">←</span> All Articles
                </button>

                {/* Tags */}
                <div className="bd-hero-tags">
                  <span className="bd-tag-cat">{post.category}</span>
                  {post.tag && <span className="bd-tag-pick">{post.tag}</span>}
                </div>

                {/* Emoji */}
                <div className="bd-hero-emoji" aria-hidden="true">{post.emoji}</div>

                {/* Title */}
                <h1 className="bd-hero-title">{post.title}</h1>

                {/* Excerpt */}
                <p className="bd-hero-excerpt">{post.excerpt}</p>

                {/* Author + Meta */}
                <div className="bd-hero-meta">
                  <div
                    className="bd-avatar"
                    style={{ background: `linear-gradient(${post.authorGradient || "135deg, #c9a84c, #e8d5a3"})` }}
                    aria-hidden="true"
                  >
                    {post.authorInitial || post.author.charAt(0)}
                  </div>
                  <div className="bd-meta-info">
                    <span className="bd-meta-name">{post.author}</span>
                    <span className="bd-meta-role">{post.authorRole}</span>
                  </div>
                  <div className="bd-meta-right">
                    <span className="bd-meta-date">{post.date}</span>
                    <span className="bd-meta-read">{post.readTime}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* ── ARTICLE BODY ── */}
            <div className="bd-layout">
              {/* Main Article */}
              <main
                className={`bd-article bd-reveal ${contentVisible ? "bd-revealed" : ""}`}
                ref={contentRef}
                aria-label="Article content"
              >
                {(post.content || []).map((block, i) => (
                  <ContentBlock key={i} block={block} />
                ))}

                {/* Article Footer */}
                <div className="bd-article-footer">
                  <div
                    className="bd-author-card"
                    style={{ "--ac-gradient": `linear-gradient(${post.authorGradient || "135deg, #c9a84c, #e8d5a3"})` }}
                  >
                    <div className="bd-ac-avatar">
                      {post.authorInitial || post.author.charAt(0)}
                    </div>
                    <div className="bd-ac-info">
                      <span className="bd-ac-name">{post.author}</span>
                      <span className="bd-ac-role">{post.authorRole}</span>
                      <p className="bd-ac-bio">
                        Part of the Evencers team — helping couples and companies
                        plan exceptional events across India.
                      </p>
                    </div>
                  </div>
                  <button
                    className="bd-back-article-btn"
                    onClick={() => navigate("/blog")}
                  >
                    ← Back to All Articles
                  </button>
                </div>
              </main>

              {/* Sidebar */}
              <aside className="bd-sidebar" aria-label="Article sidebar">
                {/* Article Info */}
                <div className="bd-sidebar-card">
                  <h3 className="bd-sidebar-title">About This Article</h3>
                  <div className="bd-info-list">
                    <div className="bd-info-row">
                      <span className="bd-info-label">Category</span>
                      <span className="bd-info-val bd-info-cat">{post.category}</span>
                    </div>
                    <div className="bd-info-row">
                      <span className="bd-info-label">Read time</span>
                      <span className="bd-info-val">{post.readTime}</span>
                    </div>
                    <div className="bd-info-row">
                      <span className="bd-info-label">Published</span>
                      <span className="bd-info-val">{post.date}</span>
                    </div>
                    <div className="bd-info-row">
                      <span className="bd-info-label">Author</span>
                      <span className="bd-info-val">{post.author}</span>
                    </div>
                  </div>
                </div>

                {/* Vendor CTA */}
                <div className="bd-sidebar-cta">
                  <div className="bd-cta-orb" aria-hidden="true" />
                  <span className="bd-cta-emoji" aria-hidden="true">🏪</span>
                  <h4 className="bd-cta-title">Are you an event vendor?</h4>
                  <p className="bd-cta-desc">
                    List your services on Evencers and get discovered by thousands of clients.
                  </p>
                  <button
                    className="bd-btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => navigate("/register")}
                  >
                    Join as Vendor →
                  </button>
                </div>

                {/* Browse More */}
                <div className="bd-sidebar-card">
                  <h3 className="bd-sidebar-title">Browse More</h3>
                  <div className="bd-browse-list">
                    {ALL_POSTS.filter((p) => p.id !== post.id).slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        className="bd-browse-item"
                        onClick={() => handleNavigate(p.slug)}
                      >
                        <span className="bd-browse-emoji">{p.emoji}</span>
                        <span className="bd-browse-title">{p.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            {/* ── RELATED POSTS ── */}
            {relatedPosts.length > 0 && (
              <section
                className="bd-related-section"
                aria-labelledby="related-heading"
                ref={relatedRef}
              >
                <div className="bd-related-wrap">
                  <div className="bd-related-header">
                    <p className="bd-related-eyebrow">Continue Reading</p>
                    <h2 id="related-heading" className="bd-related-title">
                      You might also like
                    </h2>
                  </div>
                  <div
                    className={`bd-related-grid bd-reveal ${relatedVisible ? "bd-revealed" : ""}`}
                  >
                    {relatedPosts.map((rp, i) => (
                      <RelatedCard
                        key={rp.id}
                        post={rp}
                        onNavigate={handleNavigate}
                        style={{ transitionDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <div className="bd-related-cta">
                    <button className="bd-btn-outline" onClick={() => navigate("/blog")}>
                      View All Articles →
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ── FOOTER ── */}
            <footer className="bd-footer" role="contentinfo">
              <div className="bd-footer-logo">EVENCERS</div>
              <p className="bd-footer-tagline">India's trusted event vendor platform</p>
              <p className="bd-footer-copy">© 2025 Evencers. Crafted with care in India.</p>
              <nav className="bd-footer-links" aria-label="Footer navigation">
                {["Home", "Vendors", "Blog", "About", "Privacy", "Contact"].map((l) => (
                  <a key={l} href="#" className="bd-footer-link">{l}</a>
                ))}
              </nav>
            </footer>
          </>
        )}
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

  .bd-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── READING PROGRESS ── */
  .bd-progress-bar {
    position: fixed; top: 0; left: 0; right: 0; height: 3px;
    z-index: 200; background: rgba(201,168,76,0.12);
  }
  .bd-progress-fill {
    height: 100%; background: var(--gold);
    transition: width 0.1s linear;
    border-radius: 0 2px 2px 0;
  }

  /* ── REVEAL ── */
  .bd-reveal {
    opacity: 0; transform: translateY(24px);
    transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
  }
  .bd-revealed { opacity: 1; transform: translateY(0); }

  /* ── HERO ── */
  .bd-hero {
    position: relative; background: var(--ink);
    overflow: hidden; padding: 130px 20px 80px;
    min-height: 72svh;
    display: flex; align-items: flex-end;
  }
  .bd-hero-bg { position: absolute; inset: 0; pointer-events: none; }
  .bd-hero-gradient {
    position: absolute; inset: 0;
    background: var(--hero-gradient);
    opacity: 0.55;
  }
  .bd-hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.6) 0%, transparent 70%);
  }
  .bd-hero-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.5;
  }
  .bd-hero-orb {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    filter: blur(120px); opacity: 0.12;
    top: -100px; right: -100px;
    animation: bdOrbPulse 9s ease-in-out infinite alternate;
  }
  @keyframes bdOrbPulse {
    from { transform: scale(1); }
    to   { transform: scale(1.2) translate(-20px, 20px); }
  }

  .bd-hero-inner {
    position: relative; z-index: 2;
    max-width: 760px; width: 100%;
    margin: 0 auto;
    animation: bdHeroIn 0.8s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes bdHeroIn {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Back button */
  .bd-back-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(201,168,76,0.2);
    border-radius: 24px; padding: 7px 16px;
    font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 500;
    color: rgba(245,240,232,0.55); cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
    margin-bottom: 24px;
    letter-spacing: 0.03em;
  }
  .bd-back-btn:hover { color: var(--gold); border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.08); }
  .bd-back-arrow { font-size: 13px; }

  /* Tags */
  .bd-hero-tags { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .bd-tag-cat {
    display: inline-block; font-size: 9.5px; font-weight: 600; letter-spacing: 0.15em;
    text-transform: uppercase; padding: 5px 12px; border-radius: 24px;
    background: rgba(201,168,76,0.15); color: var(--gold-light);
    border: 1px solid rgba(201,168,76,0.25);
  }
  .bd-tag-pick {
    display: inline-block; font-size: 9.5px; font-weight: 600; letter-spacing: 0.15em;
    text-transform: uppercase; padding: 5px 12px; border-radius: 24px;
    background: var(--gold); color: var(--ink);
  }

  /* Emoji */
  .bd-hero-emoji {
    font-size: 3.8rem; margin-bottom: 20px; display: block;
    filter: drop-shadow(0 8px 24px rgba(0,0,0,0.4));
  }

  /* Title */
  .bd-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 5vw, 3.6rem);
    font-weight: 500; color: var(--white);
    line-height: 1.1; margin-bottom: 18px;
    letter-spacing: -0.02em;
  }

  /* Excerpt */
  .bd-hero-excerpt {
    font-size: 14.5px; color: rgba(245,240,232,0.48);
    line-height: 1.78; margin-bottom: 32px;
    max-width: 600px;
  }

  /* Author meta */
  .bd-hero-meta {
    display: flex; align-items: center; gap: 12px;
    flex-wrap: wrap;
  }
  .bd-avatar {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; font-weight: 600;
    color: var(--ink);
  }
  .bd-meta-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .bd-meta-name { font-size: 13px; font-weight: 500; color: rgba(245,240,232,0.85); }
  .bd-meta-role { font-size: 11px; color: var(--gold); letter-spacing: 0.05em; }
  .bd-meta-right {
    display: flex; flex-direction: column; gap: 2px; align-items: flex-end;
    margin-left: auto;
  }
  .bd-meta-date { font-size: 11.5px; color: rgba(245,240,232,0.38); }
  .bd-meta-read { font-size: 11px; color: var(--gold); font-weight: 500; }

  /* ── LAYOUT ── */
  .bd-layout {
    max-width: 1100px; margin: 0 auto;
    padding: 56px 20px 64px;
    display: grid; grid-template-columns: 1fr 300px; gap: 48px;
    align-items: start;
  }
  @media (max-width: 960px) { .bd-layout { grid-template-columns: 1fr; } }

  /* ── ARTICLE ── */
  .bd-article { max-width: 700px; }

  .bd-intro {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.15rem, 2vw, 1.35rem);
    font-weight: 300; color: var(--ink); line-height: 1.78;
    margin-bottom: 36px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--border);
  }

  .bd-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.4rem, 2.8vw, 1.9rem);
    font-weight: 600; color: var(--ink);
    line-height: 1.2; margin-top: 44px; margin-bottom: 16px;
    letter-spacing: -0.01em;
  }
  .bd-heading::before {
    content: '';
    display: block; width: 28px; height: 2px;
    background: var(--gold); margin-bottom: 10px;
    border-radius: 2px;
  }

  .bd-paragraph {
    font-size: 15px; color: #3a3630; line-height: 1.88;
    margin-bottom: 20px;
  }

  .bd-callout {
    display: flex; gap: 16px; align-items: flex-start;
    background: linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%);
    border: 1px solid rgba(201,168,76,0.22);
    border-left: 3px solid var(--gold);
    border-radius: 12px; padding: 20px 22px;
    margin: 28px 0;
  }
  .bd-callout-emoji { font-size: 1.4rem; flex-shrink: 0; margin-top: 1px; }
  .bd-callout-text { font-size: 13.5px; color: #4a4438; line-height: 1.72; }

  .bd-list-block { margin: 28px 0; }
  .bd-list-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; font-weight: 600; color: var(--ink);
    margin-bottom: 14px; letter-spacing: 0.01em;
  }
  .bd-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .bd-list-item {
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 14px; color: #3a3630; line-height: 1.65;
  }
  .bd-list-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--gold); flex-shrink: 0;
    margin-top: 8px;
  }

  /* ── ARTICLE FOOTER ── */
  .bd-article-footer {
    margin-top: 52px; padding-top: 36px;
    border-top: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 20px;
  }

  .bd-author-card {
    display: flex; gap: 16px; align-items: flex-start;
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px 22px;
  }
  .bd-ac-avatar {
    width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
    background: var(--ac-gradient, linear-gradient(135deg, #c9a84c, #e8d5a3));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600;
    color: var(--ink);
  }
  .bd-ac-info { display: flex; flex-direction: column; gap: 3px; }
  .bd-ac-name { font-size: 13.5px; font-weight: 600; color: var(--ink); }
  .bd-ac-role { font-size: 11px; color: var(--gold); letter-spacing: 0.06em; margin-bottom: 4px; }
  .bd-ac-bio { font-size: 12.5px; color: var(--muted); line-height: 1.6; }

  .bd-back-article-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: none; border: 1px solid var(--border); border-radius: 10px;
    padding: 11px 22px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: var(--muted);
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    align-self: flex-start;
  }
  .bd-back-article-btn:hover { border-color: var(--gold); color: var(--ink); background: var(--gold-glow); }

  /* ── SIDEBAR ── */
  .bd-sidebar { display: flex; flex-direction: column; gap: 18px; }

  .bd-sidebar-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 16px; padding: 22px 20px;
  }
  .bd-sidebar-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; font-weight: 600; color: var(--ink);
    margin-bottom: 16px; padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }

  /* Info list */
  .bd-info-list { display: flex; flex-direction: column; gap: 12px; }
  .bd-info-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .bd-info-label { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; }
  .bd-info-val { font-size: 12.5px; color: var(--ink); font-weight: 500; }
  .bd-info-cat {
    background: var(--gold-glow); color: var(--gold);
    padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
    letter-spacing: 0.05em;
  }

  /* Sidebar CTA */
  .bd-sidebar-cta {
    background: var(--ink); border-radius: 16px;
    padding: 24px 20px; text-align: center;
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .bd-cta-orb {
    position: absolute; width: 180px; height: 180px;
    background: var(--gold); border-radius: 50%; filter: blur(60px); opacity: 0.08;
    top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none;
  }
  .bd-cta-emoji { font-size: 1.7rem; z-index: 1; }
  .bd-cta-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600;
    color: var(--cream); z-index: 1; line-height: 1.25;
  }
  .bd-cta-desc { font-size: 11.5px; color: rgba(245,240,232,0.4); line-height: 1.6; z-index: 1; }
  .bd-sidebar-cta .bd-btn-primary { z-index: 1; margin-top: 4px; }

  /* Browse list */
  .bd-browse-list { display: flex; flex-direction: column; gap: 4px; }
  .bd-browse-item {
    display: flex; align-items: center; gap: 10px;
    background: none; border: none; cursor: pointer; text-align: left;
    padding: 8px 6px; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--muted);
    transition: background 0.15s, color 0.15s;
  }
  .bd-browse-item:hover { background: var(--surface); color: var(--ink); }
  .bd-browse-emoji { font-size: 1rem; flex-shrink: 0; }
  .bd-browse-title { line-height: 1.4; }

  /* ── BUTTONS ── */
  .bd-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 26px; background: var(--gold); color: var(--ink);
    border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: transform 0.25s, box-shadow 0.25s;
  }
  .bd-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(201,168,76,0.35); }
  .bd-btn-primary:active { transform: scale(0.97); }

  .bd-btn-outline {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px; background: transparent; color: var(--ink);
    border: 1px solid rgba(201,168,76,0.3); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
  }
  .bd-btn-outline:hover { border-color: var(--gold); background: var(--gold-glow); transform: translateY(-1px); }

  /* ── RELATED POSTS ── */
  .bd-related-section {
    background: var(--white); border-top: 1px solid var(--border);
    padding: 72px 20px;
  }
  .bd-related-wrap { max-width: 1100px; margin: 0 auto; }
  .bd-related-header { text-align: center; margin-bottom: 40px; }
  .bd-related-eyebrow {
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 8px;
  }
  .bd-related-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    font-weight: 500; color: var(--ink);
    letter-spacing: -0.01em;
  }

  .bd-related-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    margin-bottom: 40px;
  }
  @media (max-width: 800px) { .bd-related-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 520px) { .bd-related-grid { grid-template-columns: 1fr; } }

  .bd-related-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden; cursor: pointer;
    transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s, border-color 0.3s;
    display: flex; flex-direction: column;
    position: relative;
  }
  .bd-related-card::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    background: var(--rc-accent, var(--gold));
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.3s cubic-bezier(.22,1,.36,1);
  }
  .bd-related-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(14,12,10,0.08); border-color: rgba(201,168,76,0.28); }
  .bd-related-card:hover::after { transform: scaleX(1); }
  .bd-related-card:hover .bd-arrow { transform: translateX(5px); }

  .bd-related-thumb {
    height: 130px; display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .bd-related-emoji { font-size: 2.8rem; }
  .bd-related-cat {
    position: absolute; top: 10px; left: 10px;
    font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 20px;
    background: rgba(255,255,255,0.85); color: var(--muted); border: 1px solid var(--border);
    backdrop-filter: blur(8px);
  }
  .bd-related-body { padding: 18px 18px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .bd-related-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; font-weight: 600; color: var(--ink);
    line-height: 1.3; letter-spacing: -0.01em;
  }
  .bd-related-meta { display: flex; gap: 5px; font-size: 11px; color: var(--muted); align-items: center; }
  .bd-dot { color: rgba(201,168,76,0.4); }
  .bd-related-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11.5px; font-weight: 500; color: var(--ink); margin-top: 4px;
  }
  .bd-arrow { display: inline-block; transition: transform 0.25s; }

  .bd-related-cta { text-align: center; }

  /* ── NOT FOUND ── */
  .bd-notfound {
    min-height: 60vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    padding: 80px 20px; text-align: center;
  }
  .bd-nf-emoji { font-size: 4rem; }
  .bd-nf-title {
    font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: var(--ink);
  }
  .bd-nf-sub { font-size: 14px; color: var(--muted); }

  /* ── FOOTER ── */
  .bd-footer {
    background: #0a0806; padding: 36px 20px; text-align: center;
    display: flex; flex-direction: column; gap: 12px; align-items: center;
    border-top: 1px solid rgba(201,168,76,0.1);
  }
  .bd-footer-logo {
    font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600;
    color: var(--gold); letter-spacing: 0.2em; text-transform: uppercase;
  }
  .bd-footer-tagline { font-size: 11.5px; color: rgba(122,114,101,0.55); }
  .bd-footer-copy { font-size: 11px; color: rgba(122,114,101,0.4); }
  .bd-footer-links { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
  .bd-footer-link {
    font-size: 12px; color: var(--muted); text-decoration: none; transition: color 0.2s;
  }
  .bd-footer-link:hover { color: var(--gold); }

  /* ── MOBILE ── */
  @media (max-width: 600px) {
    .bd-hero { padding: 100px 16px 56px; min-height: auto; }
    .bd-layout { padding: 36px 16px 48px; }
    .bd-related-section { padding: 48px 16px; }
    .bd-hero-title { font-size: 1.9rem; }
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .bd-reveal { transition: none; }
    .bd-hero-orb { animation: none; }
    .bd-progress-fill { transition: none; }
  }
`;