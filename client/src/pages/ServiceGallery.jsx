import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function ServiceGallery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeImg, setActiveImg]     = useState(0);
  const [lightbox, setLightbox]       = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    API.get("/vendors")
      .then((res) => {
        const found = res.data.find((v) => v._id === id);
        setVendor(found || null);
      })
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e) => {
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i + 1) % vendor.images.length);
      if (e.key === "ArrowLeft")  setLightboxIdx((i) => (i - 1 + vendor.images.length) % vendor.images.length);
      if (e.key === "Escape")     setLightbox(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, vendor]);

  const openLightbox = (i) => { setLightboxIdx(i); setLightbox(true); };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="sg-root">
          <Navbar />
          <div className="sg-loader">
            <div className="sg-spinner" />
            <p>Loading gallery…</p>
          </div>
        </div>
      </>
    );
  }

  if (!vendor || !vendor.images?.length) {
    return (
      <>
        <style>{styles}</style>
        <div className="sg-root">
          <Navbar />
          <div className="sg-empty-state">
            <span className="sg-empty-icon">📷</span>
            <h2>No Images Found</h2>
            <p>This vendor hasn't uploaded any portfolio images yet.</p>
            <button className="sg-back-btn" onClick={() => navigate(-1)}>← Go Back</button>
          </div>
        </div>
      </>
    );
  }

  const images = vendor.images;

  // Smart grid layout based on image count
  const getGridClass = (count) => {
    if (count === 1) return "sg-grid sg-grid-solo";
    if (count === 2) return "sg-grid sg-grid-duo";
    if (count === 3) return "sg-grid sg-grid-trio";
    return "sg-grid sg-grid-many";
  };

  return (
    <>
      <style>{styles}</style>
      <div className="sg-root">
        <Navbar />

        {/* ── LIGHTBOX ── */}
        {lightbox && (
          <div className="sg-lightbox" onClick={() => setLightbox(false)}>
            <button className="sg-lb-close" onClick={() => setLightbox(false)}>✕</button>
            <button
              className="sg-lb-nav sg-lb-prev"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + images.length) % images.length); }}
            >‹</button>
            <div className="sg-lb-inner" onClick={(e) => e.stopPropagation()}>
              <img
                key={lightboxIdx}
                src={images[lightboxIdx]}
                alt={`${vendor.title} — photo ${lightboxIdx + 1}`}
                className="sg-lb-img"
              />
              <div className="sg-lb-meta">
                <span className="sg-lb-count">{lightboxIdx + 1} / {images.length}</span>
                <span className="sg-lb-title">{vendor.title}</span>
              </div>
            </div>
            <button
              className="sg-lb-nav sg-lb-next"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % images.length); }}
            >›</button>
            <div className="sg-lb-strip" onClick={(e) => e.stopPropagation()}>
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`sg-lb-strip-thumb ${i === lightboxIdx ? "active" : ""}`}
                  onClick={() => setLightboxIdx(i)}
                >
                  <img src={img} alt="" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        <div className="sg-hero">
          <img
            src={images[activeImg]}
            alt={vendor.title}
            className="sg-hero-img"
            onClick={() => openLightbox(activeImg)}
          />
          <div className="sg-hero-overlay" />

          {images.length > 1 && (
            <>
              <button
                className="sg-hero-nav sg-hero-prev"
                onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
              >‹</button>
              <button
                className="sg-hero-nav sg-hero-next"
                onClick={() => setActiveImg((i) => (i + 1) % images.length)}
              >›</button>
            </>
          )}

          <div className="sg-hero-content">
            <button className="sg-back" onClick={() => navigate(`/vendor/${id}`)}>
              ← Back to Service
            </button>
            <div className="sg-hero-info">
              <p className="sg-hero-eyebrow">✦ Portfolio Gallery</p>
              <h1 className="sg-hero-title">{vendor.title}</h1>
              <div className="sg-hero-meta">
                <span className="sg-hero-loc">📍 {vendor.location}</span>
                <span className="sg-hero-sep">·</span>
                <span className="sg-hero-count">{images.length} {images.length === 1 ? "photo" : "photos"}</span>
                <span className="sg-hero-sep">·</span>
                <button className="sg-expand-btn" onClick={() => openLightbox(activeImg)}>⤢ Expand</button>
              </div>
            </div>
          </div>

          {images.length > 1 && images.length <= 12 && (
            <div className="sg-hero-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`sg-dot ${i === activeImg ? "active" : ""}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── THUMBNAIL STRIP ── */}
        {images.length > 1 && (
          <div className="sg-strip-wrap">
            <div className="sg-strip">
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`sg-strip-item ${i === activeImg ? "active" : ""}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={img} alt={`thumb-${i}`} />
                  {i === activeImg && <div className="sg-strip-active-bar" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BODY ── */}
        <div className="sg-body">

          {/* Section header */}
          <div className="sg-section-header">
            <div>
              <h2 className="sg-section-title">All Photos</h2>
              <p className="sg-section-sub">{images.length} {images.length === 1 ? "image" : "images"} in this portfolio</p>
            </div>
            <button className="sg-view-service-btn" onClick={() => navigate(`/vendor/${id}`)}>
              View Service & Book →
            </button>
          </div>

          {/* ── SMART GRID ── */}
          <div className={getGridClass(images.length)}>
            {images.map((img, i) => (
              <div
                key={i}
                className={`sg-grid-item ${i === 0 ? "sg-grid-featured" : ""}`}
                onClick={() => openLightbox(i)}
              >
                <img src={img} alt={`${vendor.title} — ${i + 1}`} />
                <div className="sg-grid-overlay">
                  <div className="sg-grid-overlay-inner">
                    <span className="sg-grid-expand">⤢</span>
                    <span className="sg-grid-label">View Photo</span>
                  </div>
                </div>
                {i === 0 && <span className="sg-cover-badge">Cover Photo</span>}
              </div>
            ))}
          </div>

          {/* ── VENDOR CARD ── */}
          <div className="sg-vendor-card">
            <div className="sg-vendor-card-bg" />
            <div className="sg-vendor-left">
              <div className="sg-vendor-avatar">
                <span>{vendor.vendorName?.charAt(0)?.toUpperCase() || "V"}</span>
              </div>
              <div className="sg-vendor-details">
                <p className="sg-vendor-name">{vendor.vendorName || "Vendor"}</p>
                <p className="sg-vendor-type">
                  {vendor.serviceType?.charAt(0).toUpperCase() + vendor.serviceType?.slice(1)} Specialist
                </p>
                <p className="sg-vendor-loc">📍 {vendor.location}</p>
              </div>
            </div>
            <div className="sg-vendor-divider" />
            <div className="sg-vendor-right">
              {vendor.packages?.length > 0 && (
                <div className="sg-vendor-price">
                  <span className="sg-from">Starting at</span>
                  <span className="sg-price">₹{Number(vendor.packages[0].price).toLocaleString()}</span>
                </div>
              )}
              <button className="sg-book-btn" onClick={() => navigate(`/vendor/${id}`)}>
                View Packages & Book →
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0e0c0a;
    --ink-soft: #1a1714;
    --cream: #f5f0e8;
    --cream-dark: #ede8df;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --gold-dim: rgba(201,168,76,0.18);
    --muted: #7a7265;
    --muted-light: #a09890;
    --border: rgba(201,168,76,0.18);
    --border-soft: rgba(14,12,10,0.08);
    --surface: #faf7f2;
    --white: #ffffff;
    --shadow-sm: 0 2px 12px rgba(14,12,10,0.06);
    --shadow-md: 0 8px 32px rgba(14,12,10,0.10);
    --shadow-lg: 0 20px 60px rgba(14,12,10,0.14);
  }

  .sg-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  /* ── LOADER ── */
  .sg-loader {
    min-height: 80vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; color: var(--muted); font-size: 13px; letter-spacing: 0.1em;
  }
  .sg-spinner {
    width: 36px; height: 36px; border: 2px solid var(--border);
    border-top-color: var(--gold); border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  /* ── EMPTY STATE ── */
  .sg-empty-state {
    min-height: 70vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px; text-align: center; padding: 40px;
  }
  .sg-empty-icon { font-size: 3rem; margin-bottom: 8px; }
  .sg-empty-state h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 600; color: var(--ink);
  }
  .sg-empty-state p { font-size: 14px; color: var(--muted); margin-bottom: 16px; }
  .sg-back-btn {
    padding: 12px 24px; background: var(--ink); color: var(--white);
    border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
  }
  .sg-back-btn:hover { background: var(--gold); color: var(--ink); }

  /* ── LIGHTBOX ── */
  .sg-lightbox {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(8, 6, 4, 0.97);
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    animation: fadeIn 0.2s ease both;
  }
  .sg-lb-close {
    position: absolute; top: 20px; right: 24px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.7); font-size: 16px;
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; z-index: 10;
  }
  .sg-lb-close:hover { background: rgba(255,255,255,0.18); color: white; }
  .sg-lb-nav {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
    color: white; font-size: 2rem;
    width: 52px; height: 52px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; z-index: 10;
  }
  .sg-lb-nav:hover { background: rgba(201,168,76,0.25); border-color: var(--gold); }
  .sg-lb-prev { left: 24px; }
  .sg-lb-next { right: 24px; }
  .sg-lb-inner {
    display: flex; flex-direction: column; align-items: center;
    max-width: calc(100vw - 160px); max-height: calc(100vh - 160px);
    animation: lbZoom 0.25s ease both;
  }
  .sg-lb-img {
    max-width: 100%; max-height: calc(100vh - 200px);
    object-fit: contain; border-radius: 4px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.7);
  }
  .sg-lb-meta {
    display: flex; align-items: center; gap: 16px;
    margin-top: 18px;
  }
  .sg-lb-count { font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 0.15em; text-transform: uppercase; }
  .sg-lb-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; color: rgba(255,255,255,0.75); font-style: italic;
  }
  .sg-lb-strip {
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 6px; max-width: 80vw; overflow-x: auto;
    scrollbar-width: none; padding: 4px;
  }
  .sg-lb-strip::-webkit-scrollbar { display: none; }
  .sg-lb-strip-thumb {
    width: 48px; height: 48px; flex-shrink: 0;
    border-radius: 4px; overflow: hidden; cursor: pointer;
    border: 2px solid transparent; opacity: 0.5;
    transition: opacity 0.2s, border-color 0.2s;
  }
  .sg-lb-strip-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .sg-lb-strip-thumb.active { border-color: var(--gold); opacity: 1; }
  .sg-lb-strip-thumb:hover { opacity: 0.8; }

  /* ── HERO ── */
  .sg-hero {
    position: relative; height: 72vh; min-height: 500px;
    overflow: hidden; cursor: pointer;
  }
  .sg-hero-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform 7s ease;
  }
  .sg-hero:hover .sg-hero-img { transform: scale(1.04); }
  .sg-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      to top,
      rgba(10,8,6,0.92) 0%,
      rgba(10,8,6,0.4) 40%,
      rgba(10,8,6,0.08) 100%
    );
    pointer-events: none;
  }

  .sg-hero-nav {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,0.10); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.18); color: white;
    font-size: 2rem; width: 52px; height: 52px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.22s; z-index: 5;
  }
  .sg-hero-nav:hover { background: rgba(201,168,76,0.22); border-color: var(--gold); color: var(--gold-light); }
  .sg-hero-prev { left: 28px; }
  .sg-hero-next { right: 28px; }

  .sg-hero-content {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 44px 52px; z-index: 5;
    display: flex; flex-direction: column; gap: 18px;
    animation: fadeUp 0.6s ease both;
  }
  .sg-back {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.08); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.14); color: rgba(245,240,232,0.8);
    font-family: 'DM Sans', sans-serif; font-size: 12px; letter-spacing: 0.08em;
    padding: 8px 18px; border-radius: 24px; cursor: pointer;
    transition: all 0.2s; align-self: flex-start;
  }
  .sg-back:hover { background: rgba(201,168,76,0.18); border-color: rgba(201,168,76,0.4); color: var(--gold-light); }
  .sg-hero-eyebrow {
    font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 8px; display: block; font-weight: 400;
  }
  .sg-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 4.5vw, 3.2rem); font-weight: 300;
    color: var(--white); margin-bottom: 16px; line-height: 1.1;
    letter-spacing: -0.01em;
  }
  .sg-hero-meta {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  .sg-hero-loc, .sg-hero-count { font-size: 13px; color: rgba(245,240,232,0.6); }
  .sg-hero-sep { color: rgba(245,240,232,0.25); }
  .sg-expand-btn {
    background: var(--gold-dim); border: 1px solid rgba(201,168,76,0.28);
    color: var(--gold); font-family: 'DM Sans', sans-serif;
    font-size: 11px; padding: 5px 14px; border-radius: 20px;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.06em;
  }
  .sg-expand-btn:hover { background: rgba(201,168,76,0.3); border-color: rgba(201,168,76,0.5); }

  .sg-hero-dots {
    position: absolute; bottom: 16px; right: 52px;
    display: flex; gap: 6px; z-index: 6;
  }
  .sg-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.3); border: none; cursor: pointer;
    transition: all 0.25s; padding: 0;
  }
  .sg-dot.active { background: var(--gold); transform: scale(1.4); }

  /* ── THUMBNAIL STRIP ── */
  .sg-strip-wrap {
    background: var(--ink-soft); padding: 14px 0; overflow: hidden;
    border-bottom: 1px solid rgba(201,168,76,0.1);
  }
  .sg-strip {
    display: flex; gap: 8px; padding: 0 52px;
    overflow-x: auto; scrollbar-width: none;
  }
  .sg-strip::-webkit-scrollbar { display: none; }
  .sg-strip-item {
    position: relative; width: 76px; height: 76px; flex-shrink: 0;
    border-radius: 6px; overflow: hidden; cursor: pointer;
    border: 2px solid transparent; transition: all 0.22s; opacity: 0.55;
  }
  .sg-strip-item img { width: 100%; height: 100%; object-fit: cover; }
  .sg-strip-item:hover { opacity: 0.85; border-color: rgba(201,168,76,0.35); }
  .sg-strip-item.active { border-color: var(--gold); opacity: 1; }
  .sg-strip-active-bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px; background: var(--gold);
  }

  /* ── BODY ── */
  .sg-body {
    max-width: 1180px; margin: 0 auto; padding: 52px 40px 88px;
  }

  .sg-section-header {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-bottom: 32px; flex-wrap: wrap; gap: 16px;
  }
  .sg-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem; font-weight: 600; color: var(--ink); margin-bottom: 5px;
  }
  .sg-section-sub { font-size: 13px; color: var(--muted); }
  .sg-view-service-btn {
    padding: 12px 26px; background: var(--ink); color: var(--white);
    border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 0.22s; letter-spacing: 0.03em; white-space: nowrap;
  }
  .sg-view-service-btn:hover {
    background: var(--gold); color: var(--ink);
    transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.28);
  }

  /* ── SMART GRID LAYOUTS ── */
  .sg-grid {
    margin-bottom: 56px;
    display: grid;
    gap: 12px;
  }

  /* Solo: 1 image — full width tall */
  .sg-grid-solo {
    grid-template-columns: 1fr;
    grid-auto-rows: 560px;
  }

  /* Duo: 2 images — side by side equal, same height */
  .sg-grid-duo {
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 440px;
  }
  .sg-grid-duo .sg-grid-featured {
    grid-column: span 1;
    grid-row: span 1;
  }

  /* Trio: 3 images — 1 large left + 2 stacked right */
  .sg-grid-trio {
    grid-template-columns: 1.6fr 1fr;
    grid-template-rows: 260px 260px;
  }
  .sg-grid-trio .sg-grid-featured {
    grid-column: 1;
    grid-row: 1 / 3;
  }

  /* Many: 4+ images — masonry-like 4-col */
  .sg-grid-many {
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 220px;
  }
  .sg-grid-many .sg-grid-featured {
    grid-column: span 2;
    grid-row: span 2;
  }

  @media (max-width: 960px) {
    .sg-grid-many { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 190px; }
    .sg-grid-duo  { grid-template-columns: 1fr 1fr; grid-auto-rows: 340px; }
    .sg-grid-trio { grid-template-columns: 1.4fr 1fr; grid-template-rows: 220px 220px; }
  }
  @media (max-width: 640px) {
    .sg-grid-many  { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 160px; }
    .sg-grid-duo   { grid-template-columns: 1fr; grid-auto-rows: 280px; }
    .sg-grid-trio  { grid-template-columns: 1fr; grid-template-rows: auto; }
    .sg-grid-trio .sg-grid-featured { grid-column: 1; grid-row: 1; }
    .sg-grid-solo  { grid-auto-rows: 360px; }
    .sg-grid-many .sg-grid-featured { grid-column: span 2; }
  }

  /* ── GRID ITEMS ── */
  .sg-grid-item {
    position: relative; border-radius: 10px; overflow: hidden;
    cursor: pointer; background: var(--cream-dark);
    border: 1px solid var(--border-soft);
    animation: fadeUp 0.45s ease both;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .sg-grid-item:hover {
    transform: scale(1.015);
    box-shadow: 0 16px 48px rgba(14,12,10,0.16);
    z-index: 2;
  }
  .sg-grid-item img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform 0.6s ease;
  }
  .sg-grid-item:hover img { transform: scale(1.07); }

  .sg-grid-overlay {
    position: absolute; inset: 0;
    background: rgba(10,8,6,0); display: flex;
    align-items: center; justify-content: center;
    transition: background 0.28s ease;
  }
  .sg-grid-item:hover .sg-grid-overlay { background: rgba(10,8,6,0.38); }

  .sg-grid-overlay-inner {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    opacity: 0; transform: translateY(6px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .sg-grid-item:hover .sg-grid-overlay-inner { opacity: 1; transform: translateY(0); }

  .sg-grid-expand {
    font-size: 1.6rem; color: white;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
    line-height: 1;
  }
  .sg-grid-label {
    font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
    color: rgba(255,255,255,0.85); font-weight: 500;
  }

  .sg-cover-badge {
    position: absolute; bottom: 14px; left: 14px;
    font-size: 9px; font-weight: 600; letter-spacing: 0.14em;
    text-transform: uppercase;
    background: rgba(201,168,76,0.92); color: var(--ink);
    padding: 5px 12px; border-radius: 20px;
    backdrop-filter: blur(4px);
  }

  /* ── VENDOR CARD ── */
  .sg-vendor-card {
    position: relative; overflow: hidden;
    background: var(--white); 
    border: 1px solid var(--border);
    border-radius: 16px; 
    padding: 32px 36px;
    display: flex; justify-content: space-between; align-items: center;
    gap: 24px; flex-wrap: wrap;
    box-shadow: var(--shadow-md);
    animation: fadeUp 0.5s ease 0.1s both;
  }
  .sg-vendor-card-bg {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 60%);
  }
  .sg-vendor-left {
    display: flex; align-items: center; gap: 20px; position: relative;
  }
  .sg-vendor-avatar {
    width: 60px; height: 60px; border-radius: 50%;
    background: var(--ink); 
    border: 2px solid rgba(201,168,76,0.25);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(14,12,10,0.15);
  }
  .sg-vendor-avatar span {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 600; color: var(--gold);
    line-height: 1;
  }
  .sg-vendor-details { }
  .sg-vendor-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.25rem; font-weight: 600; color: var(--ink); 
    margin-bottom: 4px; letter-spacing: -0.01em;
  }
  .sg-vendor-type { 
    font-size: 11px; color: var(--gold); margin-bottom: 5px; 
    letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500;
  }
  .sg-vendor-loc  { font-size: 12px; color: var(--muted); }
  
  .sg-vendor-divider {
    width: 1px; height: 56px; background: var(--border);
    flex-shrink: 0;
  }

  .sg-vendor-right { 
    display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
    position: relative;
  }
  .sg-vendor-price { display: flex; flex-direction: column; gap: 2px; }
  .sg-from { 
    font-size: 10px; color: var(--muted); text-transform: uppercase; 
    letter-spacing: 0.14em; 
  }
  .sg-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.7rem; font-weight: 600; color: var(--ink);
    letter-spacing: -0.02em; line-height: 1;
  }
  .sg-book-btn {
    padding: 14px 30px; background: var(--ink); color: var(--white);
    border: none; border-radius: 9px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 0.22s; letter-spacing: 0.03em; white-space: nowrap;
  }
  .sg-book-btn:hover {
    background: var(--gold); color: var(--ink);
    transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.3);
  }

  @keyframes fadeUp  { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes lbZoom  { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

  @media (max-width: 640px) {
    .sg-hero-content  { padding: 24px 20px; }
    .sg-strip         { padding: 0 20px; }
    .sg-body          { padding: 32px 20px 64px; }
    .sg-hero-prev     { left: 12px; }
    .sg-hero-next     { right: 12px; }
    .sg-lb-prev       { left: 8px; }
    .sg-lb-next       { right: 8px; }
    .sg-vendor-card   { padding: 22px 20px; }
    .sg-vendor-divider { display: none; }
  }
`;