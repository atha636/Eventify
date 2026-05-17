import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [removing, setRemoving]   = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token || user?.role !== "user") {
      navigate("/login");
      return;
    }
    API.get("/favorites")
      .then(res => setFavorites(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (vendorId) => {
    setRemoving(vendorId);
    try {
      await API.post(`/favorites/${vendorId}`);
      setFavorites(prev => prev.filter(v => v._id !== vendorId));
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(null);
    }
  };

  // ── FIX: same price logic as ServiceCard ──────────────────────
  const getPrice = (vendor) => {
    const isDecor = vendor?.serviceType === "decor";
    return isDecor
      ? (vendor.price || null)
      : (vendor.packages?.[0]?.price || null);
  };

  const getPriceLabel = (vendor) => {
    return vendor?.serviceType === "decor" ? "Fixed price" : "Starting at";
  };

  return (
    <>
      <style>{styles}</style>
      <div className="fv-root">
        <Navbar />

        {/* ── HERO ────────────────────────────────────────────── */}
        <div className="fv-hero">
          <div className="fv-hero-grain" />
          <div className="fv-hero-orb fv-orb1" />
          <div className="fv-hero-orb fv-orb2" />
          <div className="fv-hero-orb fv-orb3" />

          <div className="fv-hero-inner">
            <div className="fv-eyebrow-wrap">
              <span className="fv-eyebrow-line" />
              <span className="fv-eyebrow">Saved Collection</span>
              <span className="fv-eyebrow-line" />
            </div>
            <h1 className="fv-title">
              My <em>Favourites</em>
            </h1>
            <p className="fv-sub">
              {loading
                ? "Loading your saved vendors…"
                : favorites.length === 0
                  ? "Your wishlist awaits its first gem"
                  : `${favorites.length} vendor${favorites.length !== 1 ? "s" : ""} saved to your collection`}
            </p>
          </div>

          {/* decorative count pill */}
          {!loading && favorites.length > 0 && (
            <div className="fv-count-pill">
              <span className="fv-count-heart">♥</span>
              <span>{favorites.length}</span>
            </div>
          )}
        </div>

        {/* ── CONTENT ─────────────────────────────────────────── */}
        <div className="fv-body">

          {loading ? (
            <div className="fv-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="fv-skeleton" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="fv-skeleton-img" />
                  <div className="fv-skeleton-body">
                    <div className="fv-skeleton-line fv-sl-title" />
                    <div className="fv-skeleton-line fv-sl-loc" />
                    <div className="fv-skeleton-line fv-sl-price" />
                  </div>
                </div>
              ))}
            </div>

          ) : favorites.length === 0 ? (
            <div className="fv-empty">
              <div className="fv-empty-ring fv-ring1" />
              <div className="fv-empty-ring fv-ring2" />
              <div className="fv-empty-icon-wrap">
                <span className="fv-empty-heart">♡</span>
              </div>
              <h3 className="fv-empty-title">Nothing saved yet</h3>
              <p className="fv-empty-desc">
                Browse our vendors and tap the heart icon to save your favourites here for easy access anytime.
              </p>
              <button className="fv-empty-cta" onClick={() => navigate("/vendors")}>
                <span>Explore Vendors</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

          ) : (
            <>
              {/* sort/filter bar */}
              <div className="fv-topbar">
                <p className="fv-topbar-count">
                  <strong>{favorites.length}</strong> saved vendor{favorites.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="fv-grid">
                {favorites.map((v, i) => {
                  const price     = getPrice(v);
                  const label     = getPriceLabel(v);
                  const isDecor   = v.serviceType === "decor";
                  const isRemoving = removing === v._id;

                  const locationDisplay = (() => {
                    if (Array.isArray(v.locations) && v.locations.length > 0)
                      return v.locations.join(" · ");
                    return v.location || "";
                  })();

                  return (
                    <div
                      key={v._id}
                      className={`fv-card ${isRemoving ? "fv-card-removing" : ""}`}
                      style={{ animationDelay: `${i * 0.06}s` }}
                      onClick={() => !isRemoving && navigate(`/vendor/${v._id}`)}
                    >
                      {/* ── Image ── */}
                      <div className="fv-img-wrap">
                        {v.images?.[0] ? (
                          <img src={v.images[0]} alt={v.title} className="fv-img" />
                        ) : (
                          <div className="fv-img-fallback"><span>📷</span></div>
                        )}
                        <div className="fv-img-overlay" />

                        {/* Remove heart button */}
                        <button
                          className={`fv-heart ${isRemoving ? "fv-heart-removing" : ""}`}
                          onClick={e => { e.stopPropagation(); handleRemove(v._id); }}
                          title="Remove from favourites"
                          disabled={isRemoving}
                        >
                          {isRemoving
                            ? <span className="fv-spinner" />
                            : <span className="fv-heart-icon">♥</span>}
                        </button>

                        {/* Service type badge */}
                        {v.serviceType && (
                          <span className={`fv-type-badge ${isDecor ? "fv-badge-decor" : ""}`}>
                            {isDecor ? "🎨 " : ""}{v.serviceType}
                          </span>
                        )}

                        {/* Verified badge */}
                        {(v.vendorId?.isVendorVerified ?? v.isVendorVerified) && (
                          <span className="fv-verified">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>

                      {/* ── Body ── */}
                      <div className="fv-card-body">
                        <div className="fv-card-top">
                          <div className="fv-title-wrap">
                            <h3 className="fv-vendor-title">{v.title}</h3>
                            {locationDisplay && (
                              <p className="fv-location">
                                <span className="fv-loc-dot">◉</span>
                                <span className="fv-loc-text">{locationDisplay}</span>
                              </p>
                            )}
                          </div>
                          {v.rating && (
                            <div className="fv-rating">
                              <span className="fv-star">★</span>
                              <span>{v.rating}</span>
                            </div>
                          )}
                        </div>

                        <div className="fv-footer">
                          <div className="fv-price-block">
                            <span className="fv-price-label">{label}</span>
                            <span className="fv-price">
                              {price
                                ? `₹${Number(price).toLocaleString("en-IN")}`
                                : "Contact"}
                            </span>
                          </div>
                          <div className="fv-footer-actions">
                            <button
                              className="fv-remove-btn"
                              onClick={e => { e.stopPropagation(); handleRemove(v._id); }}
                              disabled={isRemoving}
                              title="Remove"
                            >
                              ♡
                            </button>
                            <button
                              className="fv-book-btn"
                              onClick={e => { e.stopPropagation(); navigate(`/vendor/${v._id}`); }}
                            >
                              View →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:        #0e0c0a;
    --cream:      #f5f0e8;
    --gold:       #c9a84c;
    --gold-light: #e8d5a3;
    --gold-dim:   rgba(201,168,76,0.15);
    --muted:      #7a7265;
    --border:     rgba(201,168,76,0.2);
    --surface:    #faf7f2;
    --white:      #ffffff;
    --rose:       #c0445a;
    --green:      #2d6a4f;
  }

  /* ── ROOT ───────────────────────────────────────────── */
  .fv-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  /* ── HERO ───────────────────────────────────────────── */
  .fv-hero {
    position: relative;
    overflow: hidden;
    background: var(--ink);
    padding: 110px 32px 72px;
    text-align: center;
  }

  /* grain texture */
  .fv-hero-grain {
    position: absolute; inset: 0; pointer-events: none; z-index: 1;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.35;
  }

  .fv-hero-orb {
    position: absolute; border-radius: 50%;
    filter: blur(110px); pointer-events: none; z-index: 0;
  }
  .fv-orb1 { width: 500px; height: 500px; background: var(--gold);  opacity: 0.09; top: -180px; left: -100px; }
  .fv-orb2 { width: 320px; height: 320px; background: #c05ea7;       opacity: 0.07; bottom: -100px; right: -60px; }
  .fv-orb3 { width: 200px; height: 200px; background: var(--rose);   opacity: 0.07; top: 20px; right: 30%; }

  .fv-hero-inner {
    position: relative; z-index: 2;
    animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both;
  }

  .fv-eyebrow-wrap {
    display: flex; align-items: center; justify-content: center;
    gap: 14px; margin-bottom: 18px;
  }
  .fv-eyebrow-line {
    display: block; height: 1px; width: 40px;
    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5));
  }
  .fv-eyebrow-wrap .fv-eyebrow-line:last-child {
    background: linear-gradient(90deg, rgba(201,168,76,0.5), transparent);
  }
  .fv-eyebrow {
    font-size: 10px; letter-spacing: 0.28em;
    text-transform: uppercase; color: var(--gold);
    font-weight: 500;
  }

  .fv-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.6rem, 5.5vw, 3.8rem);
    font-weight: 300; color: var(--white);
    margin-bottom: 14px; line-height: 1.1;
  }
  .fv-title em {
    font-style: italic;
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 50%, #b8922e 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .fv-sub {
    font-size: 13.5px; color: rgba(245,240,232,0.42);
    font-weight: 300; letter-spacing: 0.02em;
  }

  /* count pill */
  .fv-count-pill {
    position: absolute; top: 32px; right: 36px; z-index: 3;
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.06); backdrop-filter: blur(10px);
    border: 1px solid rgba(201,168,76,0.2); border-radius: 40px;
    padding: 7px 16px;
    font-size: 13px; font-weight: 500; color: var(--gold-light);
    animation: fadeUp 0.5s 0.2s ease both;
  }
  .fv-count-heart { color: var(--rose); }

  /* ── BODY ───────────────────────────────────────────── */
  .fv-body {
    max-width: 1140px;
    margin: 0 auto;
    padding: 48px 28px 100px;
  }

  /* topbar */
  .fv-topbar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .fv-topbar-count {
    font-size: 13px; color: var(--muted);
  }
  .fv-topbar-count strong { color: var(--ink); font-weight: 600; }

  /* ── GRID ───────────────────────────────────────────── */
  .fv-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
  }
  @media (max-width: 960px) { .fv-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 580px) { .fv-grid { grid-template-columns: 1fr; } }

  /* ── CARD ───────────────────────────────────────────── */
  .fv-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    animation: fadeUp 0.45s ease both;
    transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease, opacity 0.3s ease;
  }
  .fv-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 56px rgba(14,12,10,0.11), 0 0 0 1px var(--gold);
    border-color: var(--gold);
  }
  .fv-card-removing {
    opacity: 0.4; pointer-events: none; transform: scale(0.97);
  }

  /* image wrap */
  .fv-img-wrap {
    position: relative;
    height: 210px;
    overflow: hidden;
    flex-shrink: 0;
    background: #e8e2d8;
  }
  .fv-img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
    transition: transform 0.5s ease;
    display: block;
  }
  .fv-card:hover .fv-img { transform: scale(1.06); }
  .fv-img-fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #ede8e0, #e0d8cc);
    font-size: 2.5rem; color: var(--muted);
  }
  .fv-img-overlay {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to top, rgba(14,12,10,0.5) 0%, rgba(14,12,10,0.15) 45%, transparent 70%);
  }

  /* heart remove button */
  .fv-heart {
    position: absolute; top: 11px; right: 11px;
    width: 36px; height: 36px;
    background: rgba(255,255,255,0.93); backdrop-filter: blur(8px);
    border: none; border-radius: 50%; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.22s; z-index: 3;
    box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  }
  .fv-heart:hover { transform: scale(1.15); background: white; }
  .fv-heart:hover .fv-heart-icon { color: var(--muted); }
  .fv-heart-icon { font-size: 16px; color: var(--rose); transition: color 0.2s; }
  .fv-heart-removing { pointer-events: none; opacity: 0.6; }

  /* spinner */
  .fv-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(192,68,90,0.25);
    border-top-color: var(--rose);
    animation: spin 0.7s linear infinite; display: inline-block;
  }

  /* badges */
  .fv-type-badge {
    position: absolute; bottom: 10px; left: 10px; z-index: 3;
    font-size: 10px; font-weight: 500; letter-spacing: 0.09em;
    text-transform: capitalize;
    background: rgba(14,12,10,0.7); backdrop-filter: blur(6px);
    color: var(--gold-light); padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.25);
  }
  .fv-badge-decor {
    background: rgba(45,106,79,0.78);
    color: #a8e6c3;
    border-color: rgba(45,106,79,0.4);
  }
  .fv-verified {
    position: absolute; top: 11px; left: 11px; z-index: 3;
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 9.5px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase;
    background: linear-gradient(135deg, #c9a84c 0%, #e8d5a3 50%, #b8922e 100%);
    color: #3a2a00; border: 1px solid rgba(232,213,163,0.6);
    border-radius: 20px; padding: 4px 9px 4px 7px;
    box-shadow: 0 2px 10px rgba(201,168,76,0.4);
  }

  /* card body */
  .fv-card-body {
    padding: 16px 18px 18px;
    display: flex; flex-direction: column;
    flex: 1; gap: 0;
  }

  .fv-card-top {
    display: flex; justify-content: space-between;
    align-items: flex-start; gap: 8px;
    margin-bottom: 14px;
  }
  .fv-title-wrap { flex: 1; min-width: 0; }
  .fv-vendor-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 600; color: var(--ink);
    margin-bottom: 5px; line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .fv-location {
    display: flex; align-items: center; gap: 5px;
    font-size: 11.5px; color: var(--muted);
  }
  .fv-loc-dot { font-size: 7px; color: var(--gold); flex-shrink: 0; }
  .fv-loc-text {
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 150px;
  }
  .fv-rating {
    display: flex; align-items: center; gap: 3px;
    font-size: 12px; font-weight: 500; color: var(--ink);
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 3px 9px; flex-shrink: 0;
    white-space: nowrap;
  }
  .fv-star { color: var(--gold); font-size: 11px; }

  /* footer */
  .fv-footer {
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid var(--border); padding-top: 14px;
    margin-top: auto; gap: 8px;
  }
  .fv-price-block {
    display: flex; flex-direction: column; gap: 1px; min-width: 0;
  }
  .fv-price-label {
    font-size: 9px; letter-spacing: 0.13em;
    text-transform: uppercase; color: var(--muted); white-space: nowrap;
  }
  .fv-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600; color: var(--ink);
    white-space: nowrap;
  }
  .fv-footer-actions {
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  }
  .fv-remove-btn {
    width: 34px; height: 34px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; font-size: 16px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); transition: all 0.2s;
  }
  .fv-remove-btn:hover { border-color: var(--rose); color: var(--rose); background: rgba(192,68,90,0.05); }
  .fv-remove-btn:disabled { opacity: 0.4; pointer-events: none; }
  .fv-book-btn {
    padding: 9px 18px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    cursor: pointer; transition: all 0.22s; white-space: nowrap;
    letter-spacing: 0.02em;
  }
  .fv-book-btn:hover { background: var(--gold); color: var(--ink); transform: translateX(2px); box-shadow: 0 4px 16px rgba(201,168,76,0.3); }

  /* ── SKELETON ───────────────────────────────────────── */
  .fv-skeleton {
    border-radius: 14px; overflow: hidden;
    border: 1px solid var(--border);
    background: var(--white);
    animation: fadeUp 0.4s ease both;
  }
  .fv-skeleton-img {
    height: 210px;
    background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease infinite;
  }
  .fv-skeleton-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
  .fv-skeleton-line {
    border-radius: 6px; height: 12px;
    background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease infinite;
  }
  .fv-sl-title { width: 75%; height: 18px; }
  .fv-sl-loc   { width: 50%; }
  .fv-sl-price { width: 40%; margin-top: 4px; }

  /* ── EMPTY STATE ────────────────────────────────────── */
  .fv-empty {
    position: relative; text-align: center;
    padding: 96px 20px 80px; overflow: hidden;
  }
  .fv-empty-ring {
    position: absolute; border-radius: 50%; pointer-events: none;
    border: 1px solid rgba(201,168,76,0.1);
    top: 50%; left: 50%; transform: translate(-50%,-50%);
  }
  .fv-ring1 { width: 420px; height: 420px; animation: ringPulse 4s ease infinite; }
  .fv-ring2 { width: 280px; height: 280px; animation: ringPulse 4s 1s ease infinite; }

  .fv-empty-icon-wrap {
    display: flex; align-items: center; justify-content: center;
    width: 88px; height: 88px; margin: 0 auto 28px;
    background: rgba(192,68,90,0.06); border: 1px solid rgba(192,68,90,0.18);
    border-radius: 50%; animation: heartbeat 2.6s ease infinite;
  }
  .fv-empty-heart { font-size: 2.2rem; color: rgba(192,68,90,0.35); }

  .fv-empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 300; color: var(--ink);
    margin-bottom: 12px;
  }
  .fv-empty-desc {
    font-size: 13.5px; color: var(--muted); line-height: 1.7;
    max-width: 380px; margin: 0 auto 32px;
  }
  .fv-empty-cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: 8px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    transition: all 0.22s; letter-spacing: 0.02em;
  }
  .fv-empty-cta:hover { background: var(--gold); color: var(--ink); box-shadow: 0 6px 24px rgba(201,168,76,0.3); }

  /* ── RESPONSIVE ─────────────────────────────────────── */
  @media (max-width: 580px) {
    .fv-hero { padding: 92px 20px 56px; }
    .fv-body { padding: 32px 16px 64px; }
    .fv-count-pill { top: 16px; right: 16px; font-size: 11.5px; padding: 5px 12px; }
    .fv-img-wrap { height: 190px; }
    .fv-book-btn { padding: 8px 14px; font-size: 12px; }
    .fv-price { font-size: 1.1rem; }
    .fv-loc-text { max-width: 110px; }
  }

  /* ── KEYFRAMES ───────────────────────────────────────── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    14%       { transform: scale(1.12); }
    28%       { transform: scale(1); }
    42%       { transform: scale(1.08); }
    56%       { transform: scale(1); }
  }
  @keyframes ringPulse {
    0%, 100% { opacity: 0.4; transform: translate(-50%,-50%) scale(1); }
    50%       { opacity: 0.1; transform: translate(-50%,-50%) scale(1.08); }
  }
`;