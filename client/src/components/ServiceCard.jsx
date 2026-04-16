import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// ── Delete Confirmation Modal ────────────────────────────────────
function DeleteModal({ serviceName, onConfirm, onCancel, deleting }) {
  return (
    <>
      <style>{modalStyles}</style>
      <div className="dm-backdrop" onClick={onCancel} />
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

// ── Favourite Confirmation Modal ─────────────────────────────────
function FavouriteModal({ vendor, onConfirm, onCancel, isLoggedIn }) {
  return (
    <>
      <style>{modalStyles}</style>
      <div className="dm-backdrop" onClick={onCancel} />
      <div className="dm-modal">
        <div className="fav-icon-wrap">
          <span className="fav-icon-heart">♡</span>
        </div>
        <h3 className="dm-title">
          {isLoggedIn ? "Save to Favourites?" : "Login Required"}
        </h3>
        <p className="dm-desc">
          {isLoggedIn ? (
            <>
              Add <strong>"{vendor?.title}"</strong> to your favourites? You
              can view all saved vendors from your dashboard anytime.
            </>
          ) : (
            <>
              You need to <strong>log in</strong> to save vendors to your
              favourites list. It only takes a moment!
            </>
          )}
        </p>
        <div className="dm-actions">
          <button className="dm-cancel" onClick={onCancel}>
            {isLoggedIn ? "Not Now" : "Cancel"}
          </button>
          <button className="dm-confirm fav-confirm-btn" onClick={onConfirm}>
            {isLoggedIn ? "♥  Yes, Save It" : "Go to Login →"}
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
  const [favorited,    setFavorited]    = useState(false);
  const [favLoading,   setFavLoading]   = useState(false);
  const [showFavModal, setShowFavModal] = useState(false);
  const [showDelModal, setShowDelModal] = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [showToast,    setShowToast]    = useState(false);

  const token      = localStorage.getItem("token");
  const user       = JSON.parse(localStorage.getItem("user") || "{}");
  const isUser     = user?.role === "user";
  const isLoggedIn = !!token && isUser;

  const startingPrice = vendor.packages?.[0]?.price;
  const packageCount  = Array.isArray(vendor.packages) ? vendor.packages.length : 0;
  const hasGallery    = vendor.images?.length > 0;

  // ── Load initial favourite state from localStorage cache ─────
  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      const cached = JSON.parse(localStorage.getItem("favoriteIds") || "[]");
      setFavorited(cached.includes(vendor._id));
    } catch {}
  }, [vendor._id]);

  // ── Heart button clicked → ALWAYS show popup first ───────────
  const handleHeartClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Already saved → remove immediately without a confirm popup
    if (favorited && isLoggedIn) {
      toggleFavouriteAPI(true);
      return;
    }

    // Not saved → show popup (save confirm OR login prompt)
    setShowFavModal(true);
  };

  // ── User clicked confirm inside the popup ────────────────────
  const handleFavConfirm = () => {
    setShowFavModal(false);

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    toggleFavouriteAPI(false);
  };

  // ── Actual API toggle ─────────────────────────────────────────
  const toggleFavouriteAPI = async (isRemoving) => {
    setFavLoading(true);
    const prev = favorited;
    setFavorited(!prev); // optimistic update
    try {
      const res = await API.post(`/favorites/${vendor._id}`);
      const ids = res.data.favorites || [];
      localStorage.setItem("favoriteIds", JSON.stringify(ids));
      setFavorited(res.data.favorited);

      // Show toast only when adding
      if (!isRemoving) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      setFavorited(prev); // revert on error
      console.error(err);
    } finally {
      setFavLoading(false);
    }
  };

  // ── Delete handlers ───────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await API.delete(`/vendors/${vendor._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDelModal(false);
      if (onDeleted) onDeleted(vendor._id);
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setShowDelModal(false);
    }
  };

  const goToGallery = (e) => {
    e.stopPropagation();
    if (hasGallery) navigate(`/vendor/${vendor._id}/gallery`);
  };

  const goToDetail = (e) => {
    e?.stopPropagation();
    navigate(`/vendor/${vendor._id}`);
  };

  return (
    <>
      <style>{cardStyles}</style>

      {/* ── Favourite popup ── */}
      {showFavModal && (
        <FavouriteModal
          vendor={vendor}
          isLoggedIn={isLoggedIn}
          onConfirm={handleFavConfirm}
          onCancel={() => setShowFavModal(false)}
        />
      )}

      {/* ── Delete popup ── */}
      {showDelModal && (
        <DeleteModal
          serviceName={vendor.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDelModal(false)}
          deleting={deleting}
        />
      )}

      {/* ── Success toast ── */}
      {showToast && (
        <div className="sc-toast">
          <span>♥</span> Saved to favourites!
        </div>
      )}

      <div className="sc-card" onClick={goToDetail}>

        {/* IMAGE */}
        <div
          className={`sc-img-wrap ${hasGallery ? "sc-img-clickable" : ""}`}
          onClick={goToGallery}
          title={hasGallery ? "View full gallery" : undefined}
        >
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

          {vendor.images?.length > 1 && (
            <div className="sc-gallery-hint">
              <span className="sc-gallery-hint-icon">⊞</span>
              <span>View all {vendor.images.length} photos</span>
            </div>
          )}

          {/* Favourite heart — shown for users only, hidden in vendor mode */}
          {!showDelete && (
            <button
              className={`sc-wishlist ${favorited ? "active" : ""} ${favLoading ? "loading" : ""}`}
              onClick={handleHeartClick}
              aria-label={favorited ? "Remove from favourites" : "Save to favourites"}
              title={favorited ? "Remove from favourites" : "Save to favourites"}
            >
              {favLoading
                ? <span className="sc-fav-spinner" />
                : favorited ? "♥" : "♡"
              }
            </button>
          )}

          {/* Vendor dashboard: Edit + Delete buttons */}
          {showDelete && (
            <div className="sc-vendor-actions">
              <button
                className="sc-edit-btn"
                onClick={(e) => { e.stopPropagation(); navigate(`/edit-service/${vendor._id}`); }}
                aria-label="Edit service"
                title="Edit service"
              >
                ✎ Edit
              </button>
              <button
                className="sc-delete"
                onClick={(e) => { e.stopPropagation(); setShowDelModal(true); }}
                aria-label="Delete service"
                title="Delete service"
              >
                🗑
              </button>
            </div>
          )}

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
              onClick={(e) => { e.stopPropagation(); goToDetail(); }}
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
    position: fixed; inset: 0;
    background: rgba(14, 12, 10, 0.55);
    backdrop-filter: blur(4px); z-index: 999;
    animation: dmFadeIn 0.18s ease both;
  }
  .dm-modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: 1000; background: #faf7f2;
    border: 1px solid rgba(201,168,76,0.2); border-radius: 16px;
    padding: 36px 32px 28px; width: min(420px, 90vw);
    text-align: center; box-shadow: 0 24px 64px rgba(14,12,10,0.18);
    animation: dmSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .dm-icon-wrap {
    width: 60px; height: 60px;
    background: rgba(184,92,92,0.08); border: 1px solid rgba(184,92,92,0.2);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; font-size: 1.5rem;
  }
  .fav-icon-wrap {
    width: 60px; height: 60px;
    background: rgba(192,68,90,0.08); border: 1px solid rgba(192,68,90,0.25);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; font-size: 1.7rem; color: #c0445a;
    animation: favPulse 1.4s ease infinite;
  }

  .dm-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1.5rem;
    font-weight: 600; color: #0e0c0a; margin-bottom: 10px;
  }
  .dm-desc {
    font-family: 'DM Sans', sans-serif; font-size: 13.5px;
    color: #7a7265; line-height: 1.65; margin-bottom: 28px;
  }
  .dm-desc strong { color: #0e0c0a; font-weight: 500; }
  .dm-actions { display: flex; gap: 10px; }

  .dm-cancel {
    flex: 1; padding: 12px; background: none;
    border: 1px solid rgba(201,168,76,0.25); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: #7a7265;
    cursor: pointer; transition: all 0.2s;
  }
  .dm-cancel:hover:not(:disabled) { border-color: #c9a84c; color: #0e0c0a; }
  .dm-cancel:disabled { opacity: 0.5; pointer-events: none; }

  .dm-confirm {
    flex: 1; padding: 12px; background: #b85c5c; border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #fff;
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .dm-confirm:hover:not(:disabled):not(.loading) {
    background: #a04848; transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(184,92,92,0.3);
  }
  .dm-confirm.loading { opacity: 0.7; pointer-events: none; }

  /* Favourite confirm — dark/gold instead of red */
  .fav-confirm-btn { background: #0e0c0a !important; }
  .fav-confirm-btn:hover:not(:disabled) {
    background: #c9a84c !important; color: #0e0c0a !important;
    box-shadow: 0 6px 18px rgba(201,168,76,0.35) !important;
  }

  .dm-spinner {
    width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: dmSpin 0.7s linear infinite; display: inline-block;
  }

  @keyframes dmFadeIn  { from { opacity: 0; }               to { opacity: 1; } }
  @keyframes dmSlideUp { from { opacity: 0; transform: translate(-50%, -44%); } to { opacity: 1; transform: translate(-50%, -50%); } }
  @keyframes dmSpin    { to { transform: rotate(360deg); } }
  @keyframes favPulse  { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
`;

// ── Card CSS ─────────────────────────────────────────────────────
const cardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --muted: #7a7265; --border: rgba(201,168,76,0.2); --surface: #faf7f2; --white: #ffffff;
  }

  .sc-card {
    font-family: 'DM Sans', sans-serif;
    background: var(--white); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden; cursor: pointer;
    transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
    display: flex; flex-direction: column;
  }
  .sc-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 48px rgba(14,12,10,0.1), 0 0 0 1px var(--gold);
    border-color: var(--gold);
  }

  .sc-img-wrap {
    position: relative; height: 210px; overflow: hidden;
    background: #e8e2d8; flex-shrink: 0;
  }
  .sc-img-clickable { cursor: pointer; }
  .sc-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; display: block; }
  .sc-card:hover .sc-img { transform: scale(1.05); }
  .sc-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(14,12,10,0.45) 0%, transparent 55%);
    pointer-events: none;
  }
  .sc-img-fallback {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #ede8e0, #e0d8cc); font-size: 2.5rem; color: var(--muted);
  }

  .sc-gallery-hint {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    gap: 8px; color: white; font-size: 12.5px; letter-spacing: 0.05em; font-weight: 500;
    background: rgba(14,12,10,0); transition: background 0.25s ease; opacity: 0; pointer-events: none;
  }
  .sc-img-wrap:hover .sc-gallery-hint { background: rgba(14,12,10,0.4); opacity: 1; }
  .sc-gallery-hint-icon { font-size: 1.1rem; }

  .sc-wishlist {
    position: absolute; top: 12px; right: 12px; width: 34px; height: 34px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
    border: none; border-radius: 50%; font-size: 16px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); transition: all 0.22s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 2;
  }
  .sc-wishlist:hover { transform: scale(1.12); background: white; color: #c0445a; }
  .sc-wishlist.active { color: #c0445a; background: rgba(255,255,255,0.97); }
  .sc-wishlist.loading { pointer-events: none; opacity: 0.7; }
  .sc-fav-spinner {
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(122,114,101,0.3); border-top-color: #c0445a;
    animation: scSpin 0.7s linear infinite; display: inline-block;
  }

  .sc-vendor-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; z-index: 3; }
  .sc-edit-btn {
    display: flex; align-items: center; gap: 5px; padding: 5px 12px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
    border: 1px solid rgba(201,168,76,0.3); border-radius: 20px;
    font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 500;
    color: var(--ink); cursor: pointer; transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1); white-space: nowrap;
  }
  .sc-edit-btn:hover {
    background: var(--gold); border-color: var(--gold); color: var(--ink);
    transform: translateY(-1px); box-shadow: 0 4px 14px rgba(201,168,76,0.35);
  }
  .sc-delete {
    width: 34px; height: 34px; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
    border: none; border-radius: 50%; font-size: 15px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #b85c5c; transition: all 0.2s; box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  }
  .sc-delete:hover { background: #b85c5c; color: white; transform: scale(1.1); }

  .sc-badge {
    position: absolute; bottom: 12px; left: 12px; font-size: 10.5px;
    font-weight: 500; letter-spacing: 0.08em;
    background: rgba(14,12,10,0.7); backdrop-filter: blur(6px);
    color: var(--gold-light); padding: 4px 10px; border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.25); z-index: 2;
  }

  .sc-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; flex: 1; }
  .sc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .sc-title-wrap { flex: 1; min-width: 0; }
  .sc-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; font-weight: 600;
    color: var(--ink); margin-bottom: 5px; line-height: 1.25;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sc-location { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); }
  .sc-loc-dot { font-size: 8px; color: var(--gold); }
  .sc-rating {
    display: flex; align-items: center; gap: 3px; font-size: 12.5px; font-weight: 500;
    color: var(--ink); background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 3px 9px; flex-shrink: 0;
  }
  .sc-star { color: var(--gold); font-size: 12px; }
  .sc-footer {
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid var(--border); padding-top: 16px; margin-top: auto;
  }
  .sc-price-block { display: flex; flex-direction: column; gap: 1px; }
  .sc-price-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .sc-price { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600; color: var(--ink); }
  .sc-btn {
    padding: 9px 20px; background: var(--ink); color: var(--white); border: none;
    border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12.5px;
    font-weight: 500; cursor: pointer; transition: all 0.22s ease;
    letter-spacing: 0.03em; flex-shrink: 0;
  }
  .sc-btn:hover {
    background: var(--gold); color: var(--ink);
    box-shadow: 0 4px 16px rgba(201,168,76,0.3); transform: translateX(2px);
  }

  .sc-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: #0e0c0a; color: white; padding: 12px 24px; border-radius: 40px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 8px 32px rgba(14,12,10,0.25); z-index: 9999;
    animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
    white-space: nowrap;
  }
  .sc-toast span { color: #c0445a; font-size: 15px; }

  @keyframes scSpin  { to { transform: rotate(360deg); } }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
`;