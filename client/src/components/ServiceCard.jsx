import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ServiceCard({ vendor }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [wishlist, setWishlist] = useState(false);

  const startingPrice = vendor.packages?.[0]?.price;
  const packageCount = vendor.packages?.length || 0;

  return (
    <>
      <style>{styles}</style>
      <div className="sc-card" onClick={() => navigate(`/vendor/${vendor._id}`)}>

        {/* IMAGE */}
        <div className="sc-img-wrap">
          {!imgError && vendor.images?.[0] ? (
            <img
              src={vendor.images[0]}
              alt={vendor.title}
              className="sc-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="sc-img-fallback">
              <span>📷</span>
            </div>
          )}

          {/* OVERLAY GRADIENT */}
          <div className="sc-img-overlay" />

          {/* WISHLIST */}
          <button
            className={`sc-wishlist ${wishlist ? "active" : ""}`}
            onClick={(e) => { e.stopPropagation(); setWishlist(!wishlist); }}
            aria-label="Save to wishlist"
          >
            {wishlist ? "♥" : "♡"}
          </button>

          {/* PACKAGE BADGE */}
          {packageCount > 0 && (
            <span className="sc-badge">{packageCount} Package{packageCount > 1 ? "s" : ""}</span>
          )}
        </div>

        {/* BODY */}
        <div className="sc-body">
          <div className="sc-top">
            <div className="sc-title-wrap">
              <h3 className="sc-title">{vendor.title}</h3>
              <p className="sc-location">
                <span className="sc-loc-dot">◉</span> {vendor.location}
              </p>
            </div>
            {vendor.rating && (
              <div className="sc-rating">
                <span className="sc-star">★</span>
                <span>{vendor.rating}</span>
              </div>
            )}
          </div>

          <div className="sc-footer">
            <div className="sc-price-block">
              <span className="sc-price-label">Starting at</span>
              <span className="sc-price">
                {startingPrice ? `₹${startingPrice.toLocaleString()}` : "Contact"}
              </span>
            </div>
            <button
              className="sc-btn"
              onClick={(e) => { e.stopPropagation(); navigate(`/vendor/${vendor._id}`); }}
            >
              View →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

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

  .sc-card {
    font-family: 'DM Sans', sans-serif;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
    display: flex;
    flex-direction: column;
  }
  .sc-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 48px rgba(14,12,10,0.1), 0 0 0 1px var(--gold);
    border-color: var(--gold);
  }

  /* IMAGE */
  .sc-img-wrap {
    position: relative;
    height: 210px;
    overflow: hidden;
    background: #e8e2d8;
    flex-shrink: 0;
  }
  .sc-img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
    display: block;
  }
  .sc-card:hover .sc-img { transform: scale(1.05); }
  .sc-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(14,12,10,0.45) 0%, transparent 55%);
    pointer-events: none;
  }
  .sc-img-fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #ede8e0, #e0d8cc);
    font-size: 2.5rem;
    color: var(--muted);
  }

  /* WISHLIST BUTTON */
  .sc-wishlist {
    position: absolute; top: 12px; right: 12px;
    width: 34px; height: 34px;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(8px);
    border: none; border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted);
    transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 2;
  }
  .sc-wishlist:hover { transform: scale(1.1); }
  .sc-wishlist.active { color: #c0445a; background: rgba(255,255,255,0.95); }

  /* BADGE */
  .sc-badge {
    position: absolute; bottom: 12px; left: 12px;
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.08em;
    background: rgba(14,12,10,0.7);
    backdrop-filter: blur(6px);
    color: var(--gold-light);
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.25);
    z-index: 2;
  }

  /* BODY */
  .sc-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
  }
  .sc-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .sc-title-wrap { flex: 1; min-width: 0; }
  .sc-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 5px;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sc-location {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: var(--muted);
  }
  .sc-loc-dot { font-size: 8px; color: var(--gold); }

  .sc-rating {
    display: flex; align-items: center; gap: 3px;
    font-size: 12.5px; font-weight: 500;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 3px 9px;
    flex-shrink: 0;
  }
  .sc-star { color: var(--gold); font-size: 12px; }

  /* FOOTER */
  .sc-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--border);
    padding-top: 16px;
    margin-top: auto;
  }
  .sc-price-block { display: flex; flex-direction: column; gap: 1px; }
  .sc-price-label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .sc-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
  }

  .sc-btn {
    padding: 9px 20px;
    background: var(--ink);
    color: var(--white);
    border: none; border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500;
    cursor: pointer;
    transition: all 0.22s ease;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }
  .sc-btn:hover {
    background: var(--gold);
    color: var(--ink);
    box-shadow: 0 4px 16px rgba(201,168,76,0.3);
    transform: translateX(2px);
  }
`;