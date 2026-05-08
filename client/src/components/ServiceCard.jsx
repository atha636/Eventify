import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

function Portal({ children }) {
  return createPortal(children, document.body);
}

// ── Image Carousel ───────────────────────────────────────────────
function ImageCarousel({ images, vendorId, vendorTitle, onGalleryClick }) {
  const [activeIdx, setActiveIdx]       = useState(0);
  const [prevIdx, setPrevIdx]           = useState(null);
  const [transitioning, setTransition]  = useState(false);
  const [paused, setPaused]             = useState(false);
  const [imgLoaded, setImgLoaded]       = useState({});

  const autoTimer   = useRef(null);
  const pauseTimer  = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const hasMultiple = images && images.length > 1;

  const goTo = useCallback((next, fromAuto = false) => {
    if (transitioning || next === activeIdx) return;
    if (!fromAuto) {
      clearInterval(autoTimer.current);
      clearTimeout(pauseTimer.current);
      setPaused(true);
      pauseTimer.current = setTimeout(() => setPaused(false), 5000);
    }
    setPrevIdx(activeIdx);
    setActiveIdx(next);
    setTransition(true);
    setTimeout(() => { setPrevIdx(null); setTransition(false); }, 500);
  }, [activeIdx, transitioning]);

  useEffect(() => {
    if (!hasMultiple || paused) return;
    autoTimer.current = setInterval(() => {
      setActiveIdx(cur => {
        const next = (cur + 1) % images.length;
        setPrevIdx(cur);
        setTransition(true);
        setTimeout(() => { setPrevIdx(null); setTransition(false); }, 500);
        return next;
      });
    }, 3200);
    return () => clearInterval(autoTimer.current);
  }, [hasMultiple, paused, images?.length]);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null || !hasMultiple) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 36 && dy < 60) {
      const len = images.length;
      if (dx < 0) goTo((activeIdx + 1) % len);
      else        goTo((activeIdx - 1 + len) % len);
    }
    touchStartX.current = null;
  };

  const handleImageClick = (e) => { e.stopPropagation(); onGalleryClick(e); };
  const handleArrow = (e, dir) => {
    e.stopPropagation(); e.preventDefault();
    const len = images.length;
    goTo(dir === "next" ? (activeIdx + 1) % len : (activeIdx - 1 + len) % len);
  };
  const handleDotClick = (e, i) => { e.stopPropagation(); e.preventDefault(); goTo(i); };

  if (!images || images.length === 0) {
    return <div className="sc-img-fallback"><span>📷</span></div>;
  }

  return (
    <div
      className="sc-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={handleImageClick}
    >
      {prevIdx !== null && (
        <img src={images[prevIdx]} alt="" className="sc-carousel-slide sc-slide-out" />
      )}
      <img
        key={activeIdx}
        src={images[activeIdx]}
        alt={vendorTitle}
        className={`sc-carousel-slide sc-slide-in ${imgLoaded[activeIdx] ? "loaded" : ""}`}
        onLoad={() => setImgLoaded(p => ({ ...p, [activeIdx]: true }))}
        draggable={false}
      />
      <div className="sc-carousel-overlay" />
      {hasMultiple && !paused && (
        <div className="sc-carousel-progress" key={`prog-${activeIdx}`}>
          <div className="sc-carousel-progress-fill" />
        </div>
      )}
      {hasMultiple && (
        <>
          <button className="sc-carousel-arrow sc-arrow-prev" onClick={(e) => handleArrow(e, "prev")} aria-label="Previous image">‹</button>
          <button className="sc-carousel-arrow sc-arrow-next" onClick={(e) => handleArrow(e, "next")} aria-label="Next image">›</button>
        </>
      )}
      {hasMultiple && images.length <= 10 && (
        <div className="sc-carousel-dots">
          {images.map((_, i) => (
            <button key={i} className={`sc-carousel-dot ${i === activeIdx ? "active" : ""}`} onClick={(e) => handleDotClick(e, i)} aria-label={`Go to image ${i + 1}`} />
          ))}
        </div>
      )}
      {hasMultiple && images.length > 10 && (
        <div className="sc-img-counter">{activeIdx + 1}/{images.length}</div>
      )}
    </div>
  );
}

// ── Share Modal ──────────────────────────────────────────────────
function ShareModal({ vendor, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareUrl  = `${window.location.origin}/vendor/${vendor._id}`;

  // ── FIX: support both decor (vendor.price) and package-based pricing ──
  const displayPrice = vendor.packages?.[0]?.price || vendor.price || 0;
  const shareText = `Check out ${vendor.title} on Evencers — starting at ₹${Number(displayPrice).toLocaleString()}`;

  const platforms = [
    {
      name: "WhatsApp",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
      color: "#25D366", bg: "rgba(37,211,102,0.1)", border: "rgba(37,211,102,0.25)",
      href: `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`,
    },
    {
      name: "Instagram",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
      color: "#E1306C", bg: "rgba(225,48,108,0.08)", border: "rgba(225,48,108,0.2)",
      href: null, note: "Copy link to share",
    },
    {
      name: "Twitter / X",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
      color: "#000000", bg: "rgba(0,0,0,0.06)", border: "rgba(0,0,0,0.15)",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      color: "#1877F2", bg: "rgba(24,119,242,0.08)", border: "rgba(24,119,242,0.2)",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
      color: "#26A5E4", bg: "rgba(38,165,228,0.08)", border: "rgba(38,165,228,0.2)",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlatformClick = (platform) => {
    if (!platform.href) { handleCopy(); return; }
    window.open(platform.href, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  return (
    <Portal>
      <style>{shareModalStyles}</style>
      <div className="sm-backdrop" onClick={onClose} />
      <div className="sm-modal">
        <button className="sm-close" onClick={onClose}>✕</button>
        <div className="sm-header">
          <div className="sm-header-icon">↗</div>
          <h3 className="sm-title">Share this Service</h3>
          <p className="sm-subtitle">Let your friends discover <strong>{vendor.title}</strong></p>
        </div>
        <div className="sm-preview">
          {vendor.images?.[0] && <img src={vendor.images[0]} alt={vendor.title} className="sm-preview-img" />}
          <div className="sm-preview-info">
            <span className="sm-preview-name">{vendor.title}</span>
            <span className="sm-preview-loc">📍 {vendor.location || (Array.isArray(vendor.locations) ? vendor.locations[0] : "")}</span>
          </div>
        </div>
        <div className="sm-platforms">
          {platforms.map((p) => (
            <button
              key={p.name}
              className="sm-platform-btn"
              style={{ "--p-color": p.color, "--p-bg": p.bg, "--p-border": p.border }}
              onClick={() => handlePlatformClick(p)}
              title={p.note || `Share on ${p.name}`}
            >
              <span className="sm-platform-icon" style={{ color: p.color }}>{p.icon}</span>
              <span className="sm-platform-name">{p.name}</span>
              {p.note && <span className="sm-platform-note">{p.note}</span>}
            </button>
          ))}
        </div>
        <div className="sm-copy-row">
          <div className="sm-copy-url">
            <span className="sm-copy-icon">🔗</span>
            <span className="sm-copy-text">{shareUrl}</span>
          </div>
          <button className={`sm-copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
            {copied ? "✓ Copied!" : "🔗 Copy Link"}
          </button>
        </div>
        <p className="sm-note">Share this link anywhere — no app needed</p>
      </div>
    </Portal>
  );
}

// ── Delete Confirmation Modal ────────────────────────────────────
function DeleteModal({ serviceName, onConfirm, onCancel, deleting }) {
  return (
    <Portal>
      <style>{modalStyles}</style>
      <div className="dm-backdrop" onClick={onCancel} />
      <div className="dm-modal">
        <div className="dm-icon-wrap"><span className="dm-icon">🗑</span></div>
        <h3 className="dm-title">Delete Service?</h3>
        <p className="dm-desc">
          You're about to delete <strong>"{serviceName}"</strong>. This action cannot be undone and all bookings linked to this service will be affected.
        </p>
        <div className="dm-actions">
          <button className="dm-cancel" onClick={onCancel} disabled={deleting}>Keep Service</button>
          <button className={`dm-confirm ${deleting ? "loading" : ""}`} onClick={onConfirm} disabled={deleting}>
            {deleting ? <><span className="dm-spinner" /> Deleting…</> : "Yes, Delete"}
          </button>
        </div>
      </div>
    </Portal>
  );
}

// ── Favourite Confirmation Modal ─────────────────────────────────
function FavouriteModal({ vendor, onConfirm, onCancel, isLoggedIn }) {
  return (
    <Portal>
      <style>{modalStyles}</style>
      <div className="dm-backdrop" onClick={onCancel} />
      <div className="dm-modal">
        <div className="fav-icon-wrap"><span className="fav-icon-heart">♡</span></div>
        <h3 className="dm-title">{isLoggedIn ? "Save to Favourites?" : "Login Required"}</h3>
        <p className="dm-desc">
          {isLoggedIn
            ? <>Add <strong>"{vendor?.title}"</strong> to your favourites? You can view all saved vendors from your dashboard anytime.</>
            : <>You need to <strong>log in</strong> to save vendors to your favourites list. It only takes a moment!</>}
        </p>
        <div className="dm-actions">
          <button className="dm-cancel" onClick={onCancel}>{isLoggedIn ? "Not Now" : "Cancel"}</button>
          <button className="dm-confirm fav-confirm-btn" onClick={onConfirm}>
            {isLoggedIn ? "♥  Yes, Save It" : "Go to Login →"}
          </button>
        </div>
      </div>
    </Portal>
  );
}

// ── Service Card ─────────────────────────────────────────────────
export default function ServiceCard({ vendor, showDelete = false, onDeleted }) {
  const navigate = useNavigate();
  const [imgError,       setImgError]       = useState(false);
  const [favorited,      setFavorited]      = useState(false);
  const [favLoading,     setFavLoading]     = useState(false);
  const [showFavModal,   setShowFavModal]   = useState(false);
  const [showDelModal,   setShowDelModal]   = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [showToast,      setShowToast]      = useState(false);

  const token      = localStorage.getItem("token");
  const user       = JSON.parse(localStorage.getItem("user") || "{}");
  const isUser     = user?.role === "user";
  const isLoggedIn = !!token && isUser;

  // ── FIX: Detect decor service type ──────────────────────────────
  const isDecor = vendor?.serviceType === "decor";

  // ── FIX: Price — use vendor.price for decor, packages[0].price otherwise ──
  const startingPrice = isDecor
    ? (vendor.price || null)
    : (vendor.packages?.[0]?.price || null);

  // ── FIX: Package count — decor has no packages ──────────────────
  const packageCount = isDecor ? 0 : (Array.isArray(vendor.packages) ? vendor.packages.length : 0);

  // ── Time slots (decor only) ──────────────────────────────────────
  const timeSlots = isDecor ? (vendor.timeSlots || []) : [];

  const hasGallery = vendor.images?.length > 0;
  const isVerified = vendor.vendorId?.isVendorVerified ?? vendor.isVendorVerified ?? false;

  // ── Location display: support both array and string ──────────────
  const locationDisplay = (() => {
    if (Array.isArray(vendor.locations) && vendor.locations.length > 0)
      return vendor.locations.join(" · ");
    return vendor.location || "";
  })();

  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      const cached = JSON.parse(localStorage.getItem("favoriteIds") || "[]");
      setFavorited(cached.includes(vendor._id));
    } catch {}
  }, [vendor._id]);

  const handleHeartClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (favorited && isLoggedIn) { toggleFavouriteAPI(true); return; }
    setShowFavModal(true);
  };

  const handleFavConfirm = () => {
    setShowFavModal(false);
    if (!isLoggedIn) { navigate("/login"); return; }
    toggleFavouriteAPI(false);
  };

  const toggleFavouriteAPI = async (isRemoving) => {
    setFavLoading(true);
    const prev = favorited;
    setFavorited(!prev);
    try {
      const res = await API.post(`/favorites/${vendor._id}`);
      const ids = res.data.favorites || [];
      localStorage.setItem("favoriteIds", JSON.stringify(ids));
      setFavorited(res.data.favorited);
      if (!isRemoving) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      setFavorited(prev);
      console.error(err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await API.delete(`/vendors/${vendor._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setShowDelModal(false);
      if (onDeleted) onDeleted(vendor._id);
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setShowDelModal(false);
    }
  };

  const goToGallery    = (e) => { e.stopPropagation(); if (hasGallery) navigate(`/vendor/${vendor._id}/gallery`); };
  const goToDetail     = (e) => { e?.stopPropagation(); navigate(`/vendor/${vendor._id}`); };
  const handleShareClick = (e) => { e.stopPropagation(); e.preventDefault(); setShowShareModal(true); };

  return (
    <>
      <style>{cardStyles}</style>

      {showFavModal   && <FavouriteModal vendor={vendor} isLoggedIn={isLoggedIn} onConfirm={handleFavConfirm} onCancel={() => setShowFavModal(false)} />}
      {showDelModal   && <DeleteModal serviceName={vendor.title} onConfirm={handleDeleteConfirm} onCancel={() => setShowDelModal(false)} deleting={deleting} />}
      {showShareModal && <ShareModal vendor={vendor} onClose={() => setShowShareModal(false)} />}
      {showToast && (
        <Portal>
          <style>{cardStyles}</style>
          <div className="sc-toast"><span>♥</span> Saved to favourites!</div>
        </Portal>
      )}

      <div className="sc-card" onClick={goToDetail}>

        {/* ── IMAGE CAROUSEL ── */}
        <div className="sc-img-wrap">
          {!imgError && vendor.images?.length > 0 ? (
            <ImageCarousel
              images={vendor.images}
              vendorId={vendor._id}
              vendorTitle={vendor.title}
              onGalleryClick={goToGallery}
            />
          ) : (
            <div className="sc-img-fallback" onClick={goToGallery}><span>📷</span></div>
          )}

          {/* TOP-LEFT: Verified badge */}
          {isVerified && (
            <div className="sc-verified-wrap">
              <span className="sc-verified-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Verified
              </span>
            </div>
          )}

          {/* TOP-RIGHT: share + heart (normal view) */}
          {!showDelete && (
            <div className="sc-top-actions">
              <button className="sc-share-btn" onClick={handleShareClick} aria-label="Share" title="Share this service">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              <button
                className={`sc-wishlist ${favorited ? "active" : ""} ${favLoading ? "loading" : ""}`}
                onClick={handleHeartClick}
                aria-label={favorited ? "Remove from favourites" : "Save to favourites"}
              >
                {favLoading ? <span className="sc-fav-spinner" /> : favorited ? "♥" : "♡"}
              </button>
            </div>
          )}

          {/* TOP-RIGHT: vendor dashboard actions */}
          {showDelete && (
            <div className="sc-vendor-actions">
              <button className="sc-share-pill" onClick={handleShareClick} aria-label="Share">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
              <button className="sc-edit-btn" onClick={(e) => { e.stopPropagation(); navigate(`/edit-service/${vendor._id}`); }}>✎ Edit</button>
              <button className="sc-delete" onClick={(e) => { e.stopPropagation(); setShowDelModal(true); }}>🗑</button>
            </div>
          )}

          {/* BOTTOM-LEFT: package count OR decor badge */}
          <div className="sc-bottom-badges">
            {isDecor ? (
              <span className="sc-badge sc-badge-decor">🎨 Decor</span>
            ) : packageCount > 0 ? (
              <span className="sc-badge">
                {packageCount === 1 ? "1 Package" : `${packageCount} Packages`}
              </span>
            ) : null}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="sc-body">
          {/* Title + Rating */}
          <div className="sc-top">
            <div className="sc-title-wrap">
              <h3 className="sc-title">{vendor.title}</h3>
              <p className="sc-location">
                <span className="sc-loc-dot">◉</span>
                {locationDisplay || "India"}
              </p>
            </div>
            {vendor.rating && (
              <div className="sc-rating">
                <span className="sc-star">★</span>
                <span>{vendor.rating}</span>
              </div>
            )}
          </div>

          {/* ── TIME SLOTS (decor only) ── */}
          {isDecor && timeSlots.length > 0 && (
            <div className="sc-slots-row">
              <span className="sc-slots-label">⏰ Slots:</span>
              <div className="sc-slots-pills">
                {timeSlots.slice(0, 3).map((slot, i) => (
                  <span key={i} className="sc-slot-pill">{slot}</span>
                ))}
                {timeSlots.length > 3 && (
                  <span className="sc-slot-more">+{timeSlots.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          {/* Footer: price + actions */}
          <div className="sc-footer">
            <div className="sc-price-block">
              <span className="sc-price-label">
                {isDecor ? "Fixed price" : "Starting at"}
              </span>
              <span className="sc-price">
                {startingPrice
                  ? `₹${Number(startingPrice).toLocaleString("en-IN")}`
                  : "Contact"}
              </span>
            </div>
            <div className="sc-footer-actions">
              <button className="sc-share-inline" onClick={handleShareClick} title="Share">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              <button className="sc-btn" onClick={(e) => { e.stopPropagation(); goToDetail(); }}>View →</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Share Modal CSS ───────────────────────────────────────────────
const shareModalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;500&display=swap');
  .sm-backdrop { position:fixed; inset:0; background:rgba(14,12,10,0.6); backdrop-filter:blur(6px); z-index:9998; animation:smFadeIn 0.18s ease both; }
  .sm-modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:9999; background:#faf7f2; border:1px solid rgba(201,168,76,0.25); border-radius:20px; padding:36px 32px 28px; width:min(440px,92vw); box-shadow:0 32px 80px rgba(14,12,10,0.22); animation:smSlideUp 0.26s cubic-bezier(0.34,1.5,0.64,1) both; }
  .sm-close { position:absolute; top:16px; right:18px; background:none; border:none; font-size:14px; color:#7a7265; cursor:pointer; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:background 0.15s,color 0.15s; }
  .sm-close:hover { background:rgba(14,12,10,0.06); color:#0e0c0a; }
  .sm-header { text-align:center; margin-bottom:24px; }
  .sm-header-icon { width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,rgba(201,168,76,0.18),rgba(201,168,76,0.06)); border:1.5px solid rgba(201,168,76,0.3); display:flex; align-items:center; justify-content:center; margin:0 auto 14px; font-size:20px; color:#c9a84c; }
  .sm-title { font-family:'Cormorant Garamond',serif; font-size:1.45rem; font-weight:600; color:#0e0c0a; margin:0 0 6px; }
  .sm-subtitle { font-family:'DM Sans',sans-serif; font-size:13px; color:#7a7265; margin:0; }
  .sm-subtitle strong { color:#0e0c0a; font-weight:500; }
  .sm-preview { display:flex; align-items:center; gap:12px; background:rgba(14,12,10,0.04); border:1px solid rgba(201,168,76,0.15); border-radius:10px; padding:10px 14px; margin-bottom:20px; }
  .sm-preview-img { width:48px; height:48px; object-fit:cover; border-radius:6px; flex-shrink:0; border:1px solid rgba(201,168,76,0.2); }
  .sm-preview-info { display:flex; flex-direction:column; gap:3px; min-width:0; }
  .sm-preview-name { font-family:'Cormorant Garamond',serif; font-size:1rem; font-weight:600; color:#0e0c0a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sm-preview-loc { font-size:11.5px; color:#7a7265; }
  .sm-platforms { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:20px; }
  .sm-platform-btn { display:flex; flex-direction:column; align-items:center; gap:5px; padding:12px 6px 10px; background:var(--p-bg,rgba(14,12,10,0.04)); border:1px solid var(--p-border,rgba(14,12,10,0.1)); border-radius:10px; cursor:pointer; transition:all 0.2s ease; position:relative; }
  .sm-platform-btn:hover { transform:translateY(-3px); box-shadow:0 6px 20px rgba(14,12,10,0.1); border-color:var(--p-color); }
  .sm-platform-icon { display:flex; align-items:center; justify-content:center; }
  .sm-platform-name { font-family:'DM Sans',sans-serif; font-size:9.5px; font-weight:500; color:#7a7265; white-space:nowrap; }
  .sm-platform-note { font-size:8px; color:#c9a84c; position:absolute; bottom:-5px; left:50%; transform:translateX(-50%); white-space:nowrap; background:#faf7f2; padding:0 4px; }
  .sm-copy-row { display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }
  .sm-copy-url { display:flex; align-items:center; gap:8px; background:rgba(14,12,10,0.04); border:1px solid rgba(201,168,76,0.2); border-radius:8px; padding:10px 12px; }
  .sm-copy-icon { font-size:13px; flex-shrink:0; }
  .sm-copy-text { flex:1; font-size:11.5px; color:#7a7265; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sm-copy-btn { width:100%; padding:11px; background:#0e0c0a; border:none; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:white; cursor:pointer; transition:all 0.2s; }
  .sm-copy-btn:hover { background:#c9a84c; color:#0e0c0a; }
  .sm-copy-btn.copied { background:#2d6a4f; }
  .sm-note { font-family:'DM Sans',sans-serif; font-size:11px; color:#a09890; text-align:center; margin:0; }
  @keyframes smFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes smSlideUp { from{opacity:0;transform:translate(-50%,-46%)} to{opacity:1;transform:translate(-50%,-50%)} }
  @media(max-width:480px){ .sm-platforms{grid-template-columns:repeat(3,1fr)} .sm-modal{padding:28px 20px 22px} }
`;

// ── Modal CSS ────────────────────────────────────────────────────
const modalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;500&display=swap');
  .dm-backdrop { position:fixed; inset:0; background:rgba(14,12,10,0.55); backdrop-filter:blur(4px); z-index:9998; animation:dmFadeIn 0.18s ease both; }
  .dm-modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:9999; background:#faf7f2; border:1px solid rgba(201,168,76,0.2); border-radius:16px; padding:36px 32px 28px; width:min(420px,90vw); text-align:center; box-shadow:0 24px 64px rgba(14,12,10,0.18); animation:dmSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
  .dm-icon-wrap { width:60px; height:60px; background:rgba(184,92,92,0.08); border:1px solid rgba(184,92,92,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:1.5rem; }
  .fav-icon-wrap { width:60px; height:60px; background:rgba(192,68,90,0.08); border:1px solid rgba(192,68,90,0.25); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:1.7rem; color:#c0445a; animation:favPulse 1.4s ease infinite; }
  .dm-title { font-family:'Cormorant Garamond',serif; font-size:1.5rem; font-weight:600; color:#0e0c0a; margin-bottom:10px; }
  .dm-desc { font-family:'DM Sans',sans-serif; font-size:13.5px; color:#7a7265; line-height:1.65; margin-bottom:28px; }
  .dm-desc strong { color:#0e0c0a; font-weight:500; }
  .dm-actions { display:flex; gap:10px; }
  .dm-cancel { flex:1; padding:12px; background:none; border:1px solid rgba(201,168,76,0.25); border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; color:#7a7265; cursor:pointer; transition:all 0.2s; }
  .dm-cancel:hover:not(:disabled) { border-color:#c9a84c; color:#0e0c0a; }
  .dm-cancel:disabled { opacity:0.5; pointer-events:none; }
  .dm-confirm { flex:1; padding:12px; background:#b85c5c; border:none; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#fff; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
  .dm-confirm:hover:not(:disabled):not(.loading) { background:#a04848; transform:translateY(-1px); }
  .dm-confirm.loading { opacity:0.7; pointer-events:none; }
  .fav-confirm-btn { background:#0e0c0a !important; }
  .fav-confirm-btn:hover:not(:disabled) { background:#c9a84c !important; color:#0e0c0a !important; }
  .dm-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:dmSpin 0.7s linear infinite; display:inline-block; }
  @keyframes dmFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes dmSlideUp { from{opacity:0;transform:translate(-50%,-44%)} to{opacity:1;transform:translate(-50%,-50%)} }
  @keyframes dmSpin    { to{transform:rotate(360deg)} }
  @keyframes favPulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
`;

// ── Card CSS ─────────────────────────────────────────────────────
const cardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');
  :root {
    --ink:#0e0c0a; --cream:#f5f0e8; --gold:#c9a84c; --gold-light:#e8d5a3;
    --muted:#7a7265; --border:rgba(201,168,76,0.2); --surface:#faf7f2; --white:#ffffff;
  }

  /* ── CARD ── */
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
    height: 100%;
  }
  .sc-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 48px rgba(14,12,10,0.1), 0 0 0 1px var(--gold);
    border-color: var(--gold);
  }

  /* ── IMAGE WRAP ── */
  .sc-img-wrap {
    position: relative;
    height: 210px;
    flex-shrink: 0;
    overflow: hidden;
    background: #e8e2d8;
    border-radius: 12px 12px 0 0;
  }
  .sc-img-fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #ede8e0, #e0d8cc);
    font-size: 2.5rem; color: var(--muted); cursor: pointer;
  }

  /* ── CAROUSEL ── */
  .sc-carousel {
    position: relative;
    width: 100%; height: 100%;
    overflow: hidden;
    cursor: pointer;
  }
  .sc-carousel-slide {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
    display: block;
    pointer-events: none; user-select: none; -webkit-user-drag: none;
  }
  .sc-slide-out { z-index: 1; animation: scSlideOut 0.5s ease forwards; }
  .sc-slide-in  { z-index: 2; opacity: 0; animation: scSlideIn 0.5s ease forwards; }
  .sc-slide-in.loaded { animation: scSlideIn 0.5s ease forwards, scKenBurns 7s ease forwards; }

  .sc-carousel-overlay {
    position: absolute; inset: 0; z-index: 3; pointer-events: none;
    background: linear-gradient(to top, rgba(14,12,10,0.52) 0%, rgba(14,12,10,0.18) 40%, transparent 70%);
  }
  .sc-carousel-progress {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 2px; z-index: 4; pointer-events: none;
    background: rgba(255,255,255,0.15);
  }
  .sc-carousel-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-light));
    width: 0; animation: scProgress 3.2s linear forwards;
  }
  .sc-carousel-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    z-index: 5; pointer-events: all;
    width: 30px; height: 30px;
    background: rgba(255,255,255,0.88); backdrop-filter: blur(6px);
    border: none; border-radius: 50%;
    font-size: 1.2rem; color: var(--ink);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; opacity: 0;
    transition: opacity 0.22s ease, background 0.18s ease, transform 0.18s ease;
    line-height: 1; padding-bottom: 1px;
  }
  .sc-img-wrap:hover .sc-carousel-arrow { opacity: 1; }
  .sc-carousel-arrow:hover { background: var(--gold); color: var(--ink); transform: translateY(-50%) scale(1.1); }
  .sc-arrow-prev { left: 10px; }
  .sc-arrow-next { right: 10px; }
  .sc-carousel-dots {
    position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
    z-index: 6; display: flex; gap: 5px; pointer-events: none;
  }
  .sc-carousel-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(255,255,255,0.45); border: none;
    cursor: pointer; transition: all 0.25s ease; padding: 0;
    pointer-events: all; flex-shrink: 0;
  }
  .sc-carousel-dot.active { background: var(--gold); transform: scale(1.5); box-shadow: 0 0 6px rgba(201,168,76,0.7); }
  .sc-carousel-dot:hover:not(.active) { background: rgba(255,255,255,0.75); }
  .sc-img-counter {
    position: absolute; bottom: 10px; right: 10px; z-index: 6;
    font-size: 10px; font-weight: 500; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.85); background: rgba(14,12,10,0.55);
    backdrop-filter: blur(4px); padding: 3px 8px; border-radius: 20px; pointer-events: none;
  }

  /* ── VERIFIED BADGE ── */
  .sc-verified-wrap { position:absolute; top:11px; left:11px; z-index:7; animation:scVerifiedIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
  .sc-verified-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: 'DM Sans', sans-serif; font-size: 10.5px; font-weight: 600;
    letter-spacing: 0.09em; text-transform: uppercase;
    background: linear-gradient(135deg, #c9a84c 0%, #e8d5a3 50%, #b8922e 100%);
    color: #3a2a00; border: 1px solid rgba(232,213,163,0.6);
    border-radius: 20px; padding: 5px 11px 5px 9px; white-space: nowrap;
    box-shadow: 0 2px 12px rgba(201,168,76,0.45), 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.35);
    position: relative; overflow: hidden;
  }
  .sc-verified-badge::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%);
    transform: translateX(-100%); animation: scVerifiedShine 3s ease 0.5s infinite;
  }

  /* ── TOP-RIGHT ACTIONS (normal user view) ── */
  .sc-top-actions {
    position: absolute; top: 10px; right: 10px;
    display: flex; flex-direction: column; gap: 6px; z-index: 7;
  }
  .sc-share-btn {
    width: 34px; height: 34px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
    border: none; border-radius: 50%; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); transition: all 0.22s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .sc-share-btn:hover { transform: scale(1.12); background: white; color: var(--gold); }
  .sc-wishlist {
    width: 34px; height: 34px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
    border: none; border-radius: 50%; font-size: 16px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--muted); transition: all 0.22s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .sc-wishlist:hover { transform: scale(1.12); background: white; color: #c0445a; }
  .sc-wishlist.active { color: #c0445a; background: rgba(255,255,255,0.97); }
  .sc-wishlist.loading { pointer-events: none; opacity: 0.7; }
  .sc-fav-spinner {
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(122,114,101,0.3); border-top-color: #c0445a;
    animation: scSpin 0.7s linear infinite; display: inline-block;
  }

  /* ── TOP-RIGHT: vendor dashboard actions ── */
  .sc-vendor-actions {
    position: absolute; top: 10px; right: 10px;
    display: flex; gap: 6px; z-index: 7; align-items: center;
  }
  .sc-share-pill {
    display: flex; align-items: center; gap: 4px; padding: 5px 11px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
    border: 1px solid rgba(201,168,76,0.3); border-radius: 20px;
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1); white-space: nowrap;
  }
  .sc-share-pill:hover { background: white; border-color: var(--gold); color: var(--gold); transform: translateY(-1px); }
  .sc-edit-btn {
    display: flex; align-items: center; gap: 5px; padding: 5px 12px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
    border: 1px solid rgba(201,168,76,0.3); border-radius: 20px;
    font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 500;
    color: var(--ink); cursor: pointer; transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1); white-space: nowrap;
  }
  .sc-edit-btn:hover { background: var(--gold); border-color: var(--gold); color: var(--ink); transform: translateY(-1px); }
  .sc-delete {
    width: 34px; height: 34px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
    border: none; border-radius: 50%; font-size: 15px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #b85c5c; transition: all 0.2s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  }
  .sc-delete:hover { background: #b85c5c; color: white; transform: scale(1.1); }

  /* ── BOTTOM-LEFT: badges ── */
  .sc-bottom-badges {
    position: absolute; bottom: 12px; left: 12px;
    display: flex; gap: 6px; align-items: center; z-index: 6;
  }
  .sc-badge {
    font-size: 10.5px; font-weight: 500; letter-spacing: 0.08em;
    background: rgba(14,12,10,0.7); backdrop-filter: blur(6px);
    color: var(--gold-light); padding: 4px 10px; border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.25); white-space: nowrap;
  }
  .sc-badge-decor {
    background: rgba(45,106,79,0.75);
    color: #a8e6c3;
    border-color: rgba(45,106,79,0.4);
  }

  /* ── BODY ── */
  .sc-body {
    padding: 16px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-height: 0;
  }

  /* Title row */
  .sc-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .sc-title-wrap { flex: 1; min-width: 0; }
  .sc-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.08rem; font-weight: 600;
    color: var(--ink); margin-bottom: 5px;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .sc-location {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: var(--muted);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sc-loc-dot { font-size: 8px; color: var(--gold); flex-shrink: 0; }
  .sc-rating {
    display: flex; align-items: center; gap: 3px;
    font-size: 12.5px; font-weight: 500; color: var(--ink);
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 3px 9px; flex-shrink: 0;
    white-space: nowrap;
  }
  .sc-star { color: var(--gold); font-size: 12px; }

  /* ── TIME SLOTS ROW ── */
  .sc-slots-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 8px 10px;
    background: rgba(45,106,79,0.05);
    border: 1px solid rgba(45,106,79,0.15);
    border-radius: 8px;
  }
  .sc-slots-label {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #2d6a4f;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .sc-slots-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    flex: 1;
  }
  .sc-slot-pill {
    font-size: 10.5px;
    font-weight: 500;
    color: #2d6a4f;
    background: rgba(45,106,79,0.1);
    border: 1px solid rgba(45,106,79,0.25);
    border-radius: 20px;
    padding: 3px 9px;
    white-space: nowrap;
  }
  .sc-slot-more {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 3px 9px;
    white-space: nowrap;
  }

  /* ── FOOTER ── */
  .sc-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--border);
    padding-top: 12px;
    flex-wrap: nowrap;
    gap: 8px;
    flex-shrink: 0;
    margin-top: auto;
  }
  .sc-price-block {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex-shrink: 1;
  }
  .sc-price-label {
    font-size: 10px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted);
    white-space: nowrap;
  }
  .sc-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.22rem; font-weight: 600; color: var(--ink);
    white-space: nowrap;
  }
  .sc-footer-actions {
    display: flex; align-items: center; gap: 7px;
    flex-shrink: 0;
  }
  .sc-share-inline {
    width: 34px; height: 34px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); transition: all 0.2s; flex-shrink: 0;
  }
  .sc-share-inline:hover { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.06); }
  .sc-btn {
    padding: 9px 18px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: 6px;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    cursor: pointer; transition: all 0.22s ease;
    letter-spacing: 0.03em; flex-shrink: 0;
    white-space: nowrap;
  }
  .sc-btn:hover { background: var(--gold); color: var(--ink); box-shadow: 0 4px 16px rgba(201,168,76,0.3); transform: translateX(2px); }

  /* ── TOAST ── */
  .sc-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: #0e0c0a; color: white; padding: 12px 24px;
    border-radius: 40px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 8px 32px rgba(14,12,10,0.25); z-index: 9999;
    animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both; white-space: nowrap;
  }
  .sc-toast span { color: #c0445a; font-size: 15px; }

  /* ── KEYFRAMES ── */
  @keyframes scSlideIn     { from{opacity:0} to{opacity:1} }
  @keyframes scSlideOut    { from{opacity:1} to{opacity:0} }
  @keyframes scKenBurns    { from{transform:scale(1)} to{transform:scale(1.05)} }
  @keyframes scProgress    { from{width:0%} to{width:100%} }
  @keyframes scSpin        { to{transform:rotate(360deg)} }
  @keyframes scVerifiedIn  { from{opacity:0;transform:scale(0.7) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes scVerifiedShine { 0%{transform:translateX(-100%)} 40%{transform:translateX(200%)} 100%{transform:translateX(200%)} }
  @keyframes toastIn       { from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
`;