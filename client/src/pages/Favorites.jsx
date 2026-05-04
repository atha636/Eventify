import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);
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
    try {
      await API.post(`/favorites/${vendorId}`);
      setFavorites(prev => prev.filter(v => v._id !== vendorId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="fv-root">
        <Navbar />

        {/* HERO */}
        <div className="fv-hero">
          <div className="fv-hero-orb fv-orb1" />
          <div className="fv-hero-orb fv-orb2" />
          <div className="fv-hero-inner">
            <span className="fv-eyebrow"> Saved Collection</span>
            <h1 className="fv-title">My Favourites</h1>
            <p className="fv-sub">
              {loading
                ? "Loading your saved vendors…"
                : `${favorites.length} saved vendor${favorites.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="fv-body">
          {loading ? (
            <div className="fv-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="fv-skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="fv-empty">
              <div className="fv-empty-orb" />
              <span className="fv-empty-heart">♡</span>
              <h3>No saved vendors yet</h3>
              <p>Tap the heart on any vendor card to save them here for easy access later.</p>
              <a href="/vendors" className="fv-empty-cta">Browse Vendors →</a>
            </div>
          ) : (
            <div className="fv-grid">
              {favorites.map((v, i) => {
                const price = v.packages?.[0]?.price;
                return (
                  <div
                    key={v._id}
                    className="fv-card"
                    style={{ animationDelay: `${i * 0.06}s` }}
                    onClick={() => navigate(`/vendor/${v._id}`)}
                  >
                    {/* Image */}
                    <div className="fv-img-wrap">
                      {v.images?.[0] ? (
                        <img src={v.images[0]} alt={v.title} className="fv-img" />
                      ) : (
                        <div className="fv-img-fallback"><span>📷</span></div>
                      )}
                      <div className="fv-img-overlay" />

                      {/* Remove heart */}
                      <button
                        className="fv-heart active"
                        onClick={e => { e.stopPropagation(); handleRemove(v._id); }}
                        title="Remove from favourites"
                      >
                        ♥
                      </button>

                      {/* Service type badge */}
                      {v.serviceType && (
                        <span className="fv-type-badge">{v.serviceType}</span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="fv-card-body">
                      <div className="fv-card-top">
                        <div className="fv-title-wrap">
                          <h3 className="fv-vendor-title">{v.title}</h3>
                          {v.location && (
                            <p className="fv-location">
                              <span className="fv-loc-dot">◉</span> {v.location}
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
                          <span className="fv-price-label">Starting at</span>
                          <span className="fv-price">
                            {price ? `₹${Number(price).toLocaleString()}` : "Contact"}
                          </span>
                        </div>
                        <button
                          className="fv-book-btn"
                          onClick={e => { e.stopPropagation(); navigate(`/vendor/${v._id}`); }}
                        >
                          Book →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --muted: #7a7265;
    --border: rgba(201,168,76,0.18);
    --surface: #faf7f2;
    --white: #ffffff;
  }

  .fv-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh; color: var(--ink);
  }

  /* HERO */
  .fv-hero {
    position: relative; overflow: hidden;
    background: var(--ink); padding: 100px 32px 60px;
    text-align: center;
  }
  .fv-hero-orb {
    position: absolute; border-radius: 50%;
    filter: blur(100px); opacity: 0.12; pointer-events: none;
  }
  .fv-orb1 { width: 460px; height: 460px; background: var(--gold); top: -160px; left: -80px; }
  .fv-orb2 { width: 280px; height: 280px; background: #c05ea7; bottom: -80px; right: -40px; }
  .fv-hero-inner { position: relative; z-index: 2; animation: fadeUp 0.5s ease both; }
  .fv-eyebrow {
    display: block; font-size: 10.5px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
  }
  .fv-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.4rem, 5vw, 3.4rem); font-weight: 300;
    color: var(--white); margin-bottom: 10px;
  }
  .fv-sub { font-size: 13.5px; color: rgba(245,240,232,0.45); font-weight: 300; }

  /* BODY */
  .fv-body { max-width: 1100px; margin: 0 auto; padding: 44px 28px 88px; }

  /* GRID */
  .fv-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 900px) { .fv-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 560px) { .fv-grid { grid-template-columns: 1fr; } }

  /* CARD */
  .fv-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden; cursor: pointer;
    animation: fadeUp 0.45s ease both;
    transition: transform 0.28s, box-shadow 0.28s, border-color 0.28s;
  }
  .fv-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 48px rgba(14,12,10,0.1);
    border-color: var(--gold);
  }

  .fv-img-wrap {
    position: relative; height: 200px; overflow: hidden;
    background: #e8e2d8;
  }
  .fv-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
  .fv-card:hover .fv-img { transform: scale(1.05); }
  .fv-img-fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #ede8e0, #e0d8cc);
    font-size: 2.5rem; color: var(--muted);
  }
  .fv-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(14,12,10,0.4) 0%, transparent 55%);
    pointer-events: none;
  }

  .fv-heart {
    position: absolute; top: 12px; right: 12px;
    width: 34px; height: 34px;
    background: rgba(255,255,255,0.92); border: none; border-radius: 50%;
    font-size: 16px; cursor: pointer; display: flex;
    align-items: center; justify-content: center;
    transition: all 0.2s; z-index: 2;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .fv-heart.active { color: #c0445a; }
  .fv-heart:hover { transform: scale(1.15); background: white; }

  .fv-type-badge {
    position: absolute; bottom: 10px; left: 10px;
    font-size: 10px; font-weight: 500; letter-spacing: 0.1em;
    text-transform: capitalize;
    background: rgba(14,12,10,0.68); backdrop-filter: blur(6px);
    color: var(--gold-light); padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.22); z-index: 2;
  }

  .fv-card-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
  .fv-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .fv-title-wrap { flex: 1; min-width: 0; }
  .fv-vendor-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem; font-weight: 600; color: var(--ink);
    margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .fv-location { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 5px; }
  .fv-loc-dot { font-size: 8px; color: var(--gold); }
  .fv-rating {
    display: flex; align-items: center; gap: 3px;
    font-size: 12.5px; font-weight: 500; color: var(--ink);
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 3px 9px; flex-shrink: 0;
  }
  .fv-star { color: var(--gold); }
  .fv-footer {
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid var(--border); padding-top: 14px;
  }
  .fv-price-block { display: flex; flex-direction: column; gap: 1px; }
  .fv-price-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .fv-price { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink); }
  .fv-book-btn {
    padding: 9px 20px; background: var(--ink); color: white;
    border: none; border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    cursor: pointer; transition: all 0.22s;
  }
  .fv-book-btn:hover { background: var(--gold); color: var(--ink); transform: translateX(2px); }

  /* SKELETON */
  .fv-skeleton {
    height: 280px; border-radius: 14px;
    background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease infinite;
  }

  /* EMPTY */
  .fv-empty {
    position: relative; text-align: center;
    padding: 100px 20px; overflow: hidden;
  }
  .fv-empty-orb {
    position: absolute; width: 400px; height: 400px;
    background: var(--gold); border-radius: 50%; filter: blur(130px); opacity: 0.05;
    top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none;
  }
  .fv-empty-heart {
    display: block; font-size: 3rem; color: rgba(192,68,90,0.25);
    margin-bottom: 20px; animation: pulse 2.5s ease infinite;
  }
  .fv-empty h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 400; color: var(--ink); margin-bottom: 10px;
  }
  .fv-empty p {
    font-size: 13.5px; color: var(--muted); line-height: 1.65;
    max-width: 360px; margin: 0 auto 28px;
  }
  .fv-empty-cta {
    display: inline-block; padding: 13px 30px;
    background: var(--ink); color: white;
    text-decoration: none; border-radius: 8px;
    font-size: 13px; font-weight: 500; transition: all 0.22s;
  }
  .fv-empty-cta:hover { background: var(--gold); color: var(--ink); }

  /* RESPONSIVE */
  @media (max-width: 560px) {
    .fv-hero { padding: 88px 20px 44px; }
    .fv-body { padding: 28px 16px 64px; }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.25; }
    50%       { transform: scale(1.1); opacity: 0.45; }
  }
`;