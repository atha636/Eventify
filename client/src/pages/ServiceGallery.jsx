import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function ServiceGallery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeImg, setActiveImg]   = useState(0);
  const [lightbox, setLightbox]     = useState(false);
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

  // Keyboard navigation for lightbox
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

            {/* Thumbnail strip at bottom */}
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

        {/* ── HERO — FEATURED IMAGE ── */}
        <div className="sg-hero">
          <img
            src={images[activeImg]}
            alt={vendor.title}
            className="sg-hero-img"
            onClick={() => openLightbox(activeImg)}
          />
          <div className="sg-hero-overlay" />

          {/* Navigation arrows on hero */}
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
                <span className="sg-hero-count">{images.length} photos</span>
                <span className="sg-hero-sep">·</span>
                <button className="sg-expand-btn" onClick={() => openLightbox(activeImg)}>
                  ⤢ Expand
                </button>
              </div>
            </div>
          </div>

          {/* Dot indicators */}
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

        {/* ── GRID GALLERY ── */}
        <div className="sg-body">
          <div className="sg-section-header">
            <div>
              <h2 className="sg-section-title">All Photos</h2>
              <p className="sg-section-sub">{images.length} images in this portfolio</p>
            </div>
            <button className="sg-view-service-btn" onClick={() => navigate(`/vendor/${id}`)}>
              View Service & Book →
            </button>
          </div>

          <div className="sg-grid">
            {images.map((img, i) => (
              <div
                key={i}
                className={`sg-grid-item ${i === 0 ? "sg-grid-featured" : ""}`}
                onClick={() => openLightbox(i)}
              >
                <img src={img} alt={`${vendor.title} — ${i + 1}`} />
                <div className="sg-grid-overlay">
                  <span className="sg-grid-expand">⤢</span>
                </div>
                {i === 0 && <span className="sg-cover-badge">Cover Photo</span>}
              </div>
            ))}
          </div>

          {/* ── VENDOR INFO CARD ── */}
          <div className="sg-vendor-card">
            <div className="sg-vendor-left">
              <div className="sg-vendor-avatar">
                {vendor.vendorName?.charAt(0)?.toUpperCase() || "V"}
              </div>
              <div>
                <p className="sg-vendor-name">{vendor.vendorName || "Vendor"}</p>
                <p className="sg-vendor-type">
                  {vendor.serviceType?.charAt(0).toUpperCase() + vendor.serviceType?.slice(1)} Specialist
                </p>
                <p className="sg-vendor-loc">📍 {vendor.location}</p>
              </div>
            </div>
            <div className="sg-vendor-right">
              {vendor.packages?.length > 0 && (
                <div className="sg-vendor-price">
                  <span className="sg-from">Starting at</span>
                  <span className="sg-price">₹{Number(vendor.packages[0].price).toLocaleString()}</span>
                </div>
              )}
              <button
                className="sg-book-btn"
                onClick={() => navigate(`/vendor/${id}`)}
              >
                View Packages & Book →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');

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

  /* ── EMPTY ── */
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
    border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
  }
  .sg-back-btn:hover { background: var(--gold); color: var(--ink); }

  /* ── LIGHTBOX ── */
  .sg-lightbox {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(10, 8, 6, 0.96);
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    animation: fadeIn 0.2s ease both;
  }
  .sg-lb-close {
    position: absolute; top: 20px; right: 24px;
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.8); font-size: 18px;
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; z-index: 10;
  }
  .sg-lb-close:hover { background: rgba(255,255,255,0.2); color: white; }
  .sg-lb-nav {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
    color: white; font-size: 2rem;
    width: 52px; height: 52px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; z-index: 10;
  }
  .sg-lb-nav:hover { background: rgba(201,168,76,0.3); border-color: var(--gold); }
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
    box-shadow: 0 32px 80px rgba(0,0,0,0.6);
  }
  .sg-lb-meta {
    display: flex; align-items: center; gap: 16px;
    margin-top: 16px;
  }
  .sg-lb-count { font-size: 12px; color: rgba(255,255,255,0.5); letter-spacing: 0.1em; }
  .sg-lb-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; color: rgba(255,255,255,0.8); font-style: italic;
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
    border: 2px solid transparent; transition: border-color 0.2s; opacity: 0.55;
    transition: opacity 0.2s, border-color 0.2s;
  }
  .sg-lb-strip-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .sg-lb-strip-thumb.active { border-color: var(--gold); opacity: 1; }
  .sg-lb-strip-thumb:hover { opacity: 0.85; }

  /* ── HERO ── */
  .sg-hero {
    position: relative; height: 72vh; min-height: 480px;
    overflow: hidden; cursor: pointer;
  }
  .sg-hero-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform 6s ease;
  }
  .sg-hero:hover .sg-hero-img { transform: scale(1.03); }
  .sg-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      to top,
      rgba(14,12,10,0.90) 0%,
      rgba(14,12,10,0.35) 45%,
      rgba(14,12,10,0.1)  100%
    );
    pointer-events: none;
  }

  /* Hero nav arrows */
  .sg-hero-nav {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,0.12); backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.2); color: white;
    font-size: 2rem; width: 52px; height: 52px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.22s; z-index: 5;
  }
  .sg-hero-nav:hover { background: rgba(201,168,76,0.25); border-color: var(--gold); }
  .sg-hero-prev { left: 24px; }
  .sg-hero-next { right: 24px; }

  .sg-hero-content {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 40px 48px; z-index: 5;
    display: flex; flex-direction: column; gap: 16px;
    animation: fadeUp 0.6s ease both;
  }
  .sg-back {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.1); backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.15); color: rgba(245,240,232,0.85);
    font-family: 'DM Sans', sans-serif; font-size: 12px; letter-spacing: 0.08em;
    padding: 7px 16px; border-radius: 20px; cursor: pointer;
    transition: all 0.2s; align-self: flex-start;
  }
  .sg-back:hover { background: rgba(201,168,76,0.2); border-color: var(--gold); color: var(--gold); }
  .sg-hero-info { }
  .sg-hero-eyebrow {
    font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 10px; display: block;
  }
  .sg-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 4vw, 3rem); font-weight: 300;
    color: var(--white); margin-bottom: 14px; line-height: 1.1;
  }
  .sg-hero-meta {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  .sg-hero-loc { font-size: 13px; color: rgba(245,240,232,0.65); }
  .sg-hero-sep { color: rgba(245,240,232,0.3); }
  .sg-hero-count { font-size: 13px; color: rgba(245,240,232,0.65); }
  .sg-expand-btn {
    background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.3);
    color: var(--gold); font-family: 'DM Sans', sans-serif;
    font-size: 12px; padding: 4px 12px; border-radius: 20px;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.05em;
  }
  .sg-expand-btn:hover { background: rgba(201,168,76,0.25); }

  /* Hero dots */
  .sg-hero-dots {
    position: absolute; bottom: 14px; right: 48px;
    display: flex; gap: 6px; z-index: 6;
  }
  .sg-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.35); border: none; cursor: pointer;
    transition: all 0.2s; padding: 0;
  }
  .sg-dot.active { background: var(--gold); transform: scale(1.3); }

  /* ── THUMBNAIL STRIP ── */
  .sg-strip-wrap {
    background: var(--ink); padding: 12px 0; overflow: hidden;
  }
  .sg-strip {
    display: flex; gap: 6px; padding: 0 48px;
    overflow-x: auto; scrollbar-width: none;
  }
  .sg-strip::-webkit-scrollbar { display: none; }
  .sg-strip-item {
    position: relative; width: 72px; height: 72px; flex-shrink: 0;
    border-radius: 6px; overflow: hidden; cursor: pointer;
    border: 2px solid transparent; transition: all 0.2s; opacity: 0.6;
  }
  .sg-strip-item img { width: 100%; height: 100%; object-fit: cover; }
  .sg-strip-item:hover { opacity: 0.9; }
  .sg-strip-item.active { border-color: var(--gold); opacity: 1; }
  .sg-strip-active-bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px; background: var(--gold); border-radius: 0 0 4px 4px;
  }

  /* ── BODY ── */
  .sg-body {
    max-width: 1160px; margin: 0 auto; padding: 48px 32px 80px;
  }

  .sg-section-header {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
  }
  .sg-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 600; color: var(--ink); margin-bottom: 4px;
  }
  .sg-section-sub { font-size: 13px; color: var(--muted); }
  .sg-view-service-btn {
    padding: 11px 24px; background: var(--ink); color: var(--white);
    border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 0.22s; letter-spacing: 0.03em; white-space: nowrap;
  }
  .sg-view-service-btn:hover {
    background: var(--gold); color: var(--ink);
    transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,168,76,0.3);
  }

  /* ── PHOTO GRID ── */
  .sg-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 220px;
    gap: 10px;
    margin-bottom: 48px;
  }
  @media (max-width: 960px) {
    .sg-grid { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 180px; }
  }
  @media (max-width: 640px) {
    .sg-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 160px; }
  }

  .sg-grid-featured {
    grid-column: span 2;
    grid-row: span 2;
  }

  .sg-grid-item {
    position: relative; border-radius: 8px; overflow: hidden;
    cursor: pointer; background: var(--surface);
    border: 1px solid var(--border);
    animation: fadeUp 0.45s ease both;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .sg-grid-item:hover { transform: scale(1.02); box-shadow: 0 12px 40px rgba(14,12,10,0.15); }
  .sg-grid-item img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform 0.5s ease;
  }
  .sg-grid-item:hover img { transform: scale(1.06); }

  .sg-grid-overlay {
    position: absolute; inset: 0;
    background: rgba(14,12,10,0); display: flex;
    align-items: center; justify-content: center;
    transition: background 0.25s ease;
  }
  .sg-grid-item:hover .sg-grid-overlay { background: rgba(14,12,10,0.3); }
  .sg-grid-expand {
    font-size: 1.5rem; color: white; opacity: 0;
    transition: opacity 0.2s ease;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
  }
  .sg-grid-item:hover .sg-grid-expand { opacity: 1; }

  .sg-cover-badge {
    position: absolute; bottom: 12px; left: 12px;
    font-size: 10px; font-weight: 500; letter-spacing: 0.12em;
    text-transform: uppercase;
    background: rgba(201,168,76,0.9); color: var(--ink);
    padding: 4px 10px; border-radius: 20px;
  }

  /* ── VENDOR INFO CARD ── */
  .sg-vendor-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 28px 32px;
    display: flex; justify-content: space-between; align-items: center;
    gap: 24px; flex-wrap: wrap;
    box-shadow: 0 4px 24px rgba(14,12,10,0.05);
    animation: fadeUp 0.5s ease both;
  }
  .sg-vendor-left { display: flex; align-items: center; gap: 20px; }
  .sg-vendor-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--ink); color: var(--gold);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.4rem; font-weight: 600; flex-shrink: 0;
  }
  .sg-vendor-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600; color: var(--ink); margin-bottom: 3px;
  }
  .sg-vendor-type { font-size: 12px; color: var(--gold); margin-bottom: 4px; letter-spacing: 0.05em; }
  .sg-vendor-loc  { font-size: 12px; color: var(--muted); }

  .sg-vendor-right { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
  .sg-vendor-price { display: flex; flex-direction: column; }
  .sg-from { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 2px; }
  .sg-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 600; color: var(--ink);
  }
  .sg-book-btn {
    padding: 13px 28px; background: var(--ink); color: var(--white);
    border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 0.22s; letter-spacing: 0.03em; white-space: nowrap;
  }
  .sg-book-btn:hover {
    background: var(--gold); color: var(--ink);
    transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,168,76,0.3);
  }

  @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes lbZoom  { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

  @media (max-width: 640px) {
    .sg-hero-content { padding: 24px; }
    .sg-strip { padding: 0 24px; }
    .sg-body  { padding: 32px 20px 60px; }
    .sg-hero-prev { left: 12px; }
    .sg-hero-next { right: 12px; }
    .sg-lb-prev { left: 8px; }
    .sg-lb-next { right: 8px; }
    .sg-vendor-card { padding: 20px; }
  }
`;