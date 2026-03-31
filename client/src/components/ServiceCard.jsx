import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// ── Delete Confirmation Modal ────────────────────────────────────
function DeleteModal({ serviceName, onConfirm, onCancel, deleting }) {
  return (
    <>
      <style>{modalStyles}</style>
      {/* Backdrop */}
      <div className="dm-backdrop" onClick={onCancel} />

      {/* Modal */}
      <div className="dm-modal">
        <div className="dm-icon-wrap">
          <span className="dm-icon">🗑</span>
        </div>

        <h3 className="dm-title">Delete Service?</h3>
        <p className="dm-desc">
          You're about to delete{" "}
          <strong>"{serviceName}"</strong>. This action cannot be undone and
          all bookings linked to this service will be affected.
        </p>

        <div className="dm-actions">
          <button className="dm-cancel" onClick={onCancel} disabled={deleting}>
            Keep Service
          </button>
          <button
            className={`dm-confirm ${deleting ? "loading" : ""}`}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? <><span className="dm-spinner" /> Deleting…</> : "Yes, Delete"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Service Card ─────────────────────────────────────────────────
export default function ServiceCard({ vendor, showDelete = false, onDeleted }) {
  const navigate = useNavigate();
  const [imgError,     setImgError]     = useState(false);
  const [wishlist,     setWishlist]     = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const startingPrice = vendor.packages?.[0]?.price;
  const packageCount  = Array.isArray(vendor.packages) ? vendor.packages.length : 0;

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const token = localStorage.getItem("token");
    try {
      await API.delete(`/vendors/${vendor._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      if (onDeleted) onDeleted(vendor._id);
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <style>{cardStyles}</style>

      {/* Delete modal — rendered outside card flow */}
      {showModal && (
        <DeleteModal
          serviceName={vendor.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowModal(false)}
          deleting={deleting}
        />
      )}

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
            <div className="sc-img-fallback"><span>📷</span></div>
          )}

          <div className="sc-img-overlay" />

          {/* Wishlist — hidden in delete mode */}
          {!showDelete && (
            <button
              className={`sc-wishlist ${wishlist ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setWishlist(!wishlist); }}
              aria-label="Save to wishlist"
            >
              {wishlist ? "♥" : "♡"}
            </button>
          )}

          {/* Delete trigger — only in vendor dashboard */}
          {showDelete && (
            <button
              className="sc-delete"
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              aria-label="Delete service"
            >
              🗑
            </button>
          )}

          {/* Package badge */}
          {packageCount > 0 && (
            <span className="sc-badge">
              {packageCount === 1 ? "1 Package" : `${packageCount} Packages`}
            </span>
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
                {startingPrice
                  ? `₹${Number(startingPrice).toLocaleString()}`
                  : "Contact"}
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

// ── Modal CSS ────────────────────────────────────────────────────
const modalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;500&display=swap');

  .dm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(14, 12, 10, 0.55);
    backdrop-filter: blur(4px);
    z-index: 999;
    animation: dmFadeIn 0.18s ease both;
  }

  .dm-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    background: #faf7f2;
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 16px;
    padding: 36px 32px 28px;
    width: min(420px, 90vw);
    text-align: center;
    box-shadow: 0 24px 64px rgba(14,12,10,0.18);
    animation: dmSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .dm-icon-wrap {
    width: 60px;
    height: 60px;
    background: rgba(184,92,92,0.08);
    border: 1px solid rgba(184,92,92,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 1.5rem;
  }

  .dm-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #0e0c0a;
    margin-bottom: 10px;
  }

  .dm-desc {
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    color: #7a7265;
    line-height: 1.65;
    margin-bottom: 28px;
  }
  .dm-desc strong {
    color: #0e0c0a;
    font-weight: 500;
  }

  .dm-actions {
    display: flex;
    gap: 10px;
  }

  .dm-cancel {
    flex: 1;
    padding: 12px;
    background: none;
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #7a7265;
    cursor: pointer;
    transition: all 0.2s;
  }
  .dm-cancel:hover:not(:disabled) {
    border-color: #c9a84c;
    color: #0e0c0a;
  }
  .dm-cancel:disabled { opacity: 0.5; pointer-events: none; }

  .dm-confirm {
    flex: 1;
    padding: 12px;
    background: #b85c5c;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .dm-confirm:hover:not(:disabled):not(.loading) {
    background: #a04848;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(184,92,92,0.3);
  }
  .dm-confirm.loading { opacity: 0.7; pointer-events: none; }

  .dm-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: dmSpin 0.7s linear infinite;
    display: inline-block;
  }

  @keyframes dmFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes dmSlideUp { from { opacity: 0; transform: translate(-50%, -44%); } to { opacity: 1; transform: translate(-50%, -50%); } }
  @keyframes dmSpin    { to { transform: rotate(360deg); } }
`;

// ── Card CSS ─────────────────────────────────────────────────────
const cardStyles = `
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
    font-size: 2.5rem; color: var(--muted);
  }

  .sc-wishlist {
    position: absolute; top: 12px; right: 12px;
    width: 34px; height: 34px;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(8px);
    border: none; border-radius: 50%;
    font-size: 16px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted);
    transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 2;
  }
  .sc-wishlist:hover { transform: scale(1.1); }
  .sc-wishlist.active { color: #c0445a; background: rgba(255,255,255,0.95); }

  .sc-delete {
    position: absolute; top: 12px; right: 12px;
    width: 34px; height: 34px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(8px);
    border: none; border-radius: 50%;
    font-size: 15px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #b85c5c;
    transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.12);
    z-index: 3;
  }
  .sc-delete:hover {
    background: #b85c5c;
    color: white;
    transform: scale(1.1);
  }

  .sc-badge {
    position: absolute; bottom: 12px; left: 12px;
    font-size: 10.5px; font-weight: 500;
    letter-spacing: 0.08em;
    background: rgba(14,12,10,0.7);
    backdrop-filter: blur(6px);
    color: var(--gold-light);
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.25);
    z-index: 2;
  }

  .sc-body {
    padding: 20px;
    display: flex; flex-direction: column;
    gap: 16px; flex: 1;
  }
  .sc-top {
    display: flex; justify-content: space-between;
    align-items: flex-start; gap: 8px;
  }
  .sc-title-wrap { flex: 1; min-width: 0; }
  .sc-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem; font-weight: 600;
    color: var(--ink); margin-bottom: 5px;
    line-height: 1.25;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sc-location {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: var(--muted);
  }
  .sc-loc-dot { font-size: 8px; color: var(--gold); }
  .sc-rating {
    display: flex; align-items: center; gap: 3px;
    font-size: 12.5px; font-weight: 500; color: var(--ink);
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 3px 9px; flex-shrink: 0;
  }
  .sc-star { color: var(--gold); font-size: 12px; }

  .sc-footer {
    display: flex; align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--border);
    padding-top: 16px; margin-top: auto;
  }
  .sc-price-block { display: flex; flex-direction: column; gap: 1px; }
  .sc-price-label {
    font-size: 10px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted);
  }
  .sc-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.25rem; font-weight: 600; color: var(--ink);
  }
  .sc-btn {
    padding: 9px 20px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500;
    cursor: pointer; transition: all 0.22s ease;
    letter-spacing: 0.03em; flex-shrink: 0;
  }
  .sc-btn:hover {
    background: var(--gold); color: var(--ink);
    box-shadow: 0 4px 16px rgba(201,168,76,0.3);
    transform: translateX(2px);
  }
`;