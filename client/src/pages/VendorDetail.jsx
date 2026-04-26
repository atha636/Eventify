import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import BookingDetailsModal from "../components/BookingDetailsModal";
import BookingWaitModal from "../components/BookingWaitModal";
import Logo from "../components/Logo";

// ── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ vendor, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/vendor/${vendor._id}`;
  const shareText = `Check out ${vendor.title} on Evencers — starting at ₹${Number(vendor.packages?.[0]?.price || 0).toLocaleString()}`;

  const platforms = [
    {
      name: "WhatsApp",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: "#25D366",
      bg: "rgba(37,211,102,0.08)",
      border: "rgba(37,211,102,0.22)",
      href: `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`,
    },
    {
      name: "Instagram",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: "#E1306C",
      bg: "rgba(225,48,108,0.07)",
      border: "rgba(225,48,108,0.18)",
      href: null,
      note: "Copies link",
    },
    {
      name: "Twitter / X",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: "#000000",
      bg: "rgba(0,0,0,0.05)",
      border: "rgba(0,0,0,0.12)",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: "#1877F2",
      bg: "rgba(24,119,242,0.07)",
      border: "rgba(24,119,242,0.18)",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      color: "#26A5E4",
      bg: "rgba(38,165,228,0.07)",
      border: "rgba(38,165,228,0.18)",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePlatformClick = (platform) => {
    if (!platform.href) { handleCopy(); return; }
    window.open(platform.href, "_blank", "noopener,noreferrer,width=620,height=520");
  };

  return (
    <>
      <style>{shareModalStyles}</style>
      <div className="vsm-backdrop" onClick={onClose} />
      <div className="vsm-modal">
        <button className="vsm-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="vsm-header">
          <div className="vsm-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </div>
          <h3 className="vsm-title">Share this Service</h3>
          <p className="vsm-subtitle">Spread the word about <strong>{vendor.title}</strong></p>
        </div>

        {/* Vendor preview strip */}
        <div className="vsm-preview">
          {vendor.images?.[0] && (
            <img src={vendor.images[0]} alt={vendor.title} className="vsm-preview-img" />
          )}
          <div className="vsm-preview-info">
            <span className="vsm-preview-title">{vendor.title}</span>
            <span className="vsm-preview-loc">📍 {vendor.location}</span>
            {vendor.packages?.[0]?.price && (
              <span className="vsm-preview-price">
                Starting at ₹{Number(vendor.packages[0].price).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Platforms */}
        <p className="vsm-section-label">Share on</p>
        <div className="vsm-platforms">
          {platforms.map((p) => (
            <button
              key={p.name}
              className="vsm-platform"
              style={{ "--pc": p.color, "--pbg": p.bg, "--pborder": p.border }}
              onClick={() => handlePlatformClick(p)}
              title={p.note ? `${p.name} — ${p.note}` : `Share on ${p.name}`}
            >
              <span className="vsm-p-icon" style={{ color: p.color }}>{p.icon}</span>
              <span className="vsm-p-name">{p.name}</span>
              {p.note && <span className="vsm-p-note">{p.note}</span>}
            </button>
          ))}
        </div>

        {/* Copy link */}
        <div className="vsm-copy">
          <div className="vsm-copy-url">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="13" height="13" style={{flexShrink:0,color:"#c9a84c"}}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span className="vsm-copy-text">{shareUrl}</span>
          </div>
          <button
            className={`vsm-copy-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
          >
            {copied ? (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                <polyline points="20 6 9 17 4 12"/></svg> Copied!</>
            ) : "Copy Link"}
          </button>
        </div>

        <p className="vsm-footer-note">Anyone with this link can view this service</p>
      </div>
    </>
  );
}

// ── Custom Calendar ───────────────────────────────────────────────────────────
function CustomDatePicker({ value, onChange, hasError }) {
  const [open, setOpen]             = useState(false);
  const [viewYear, setViewYear]     = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth]   = useState(() => new Date().getMonth());
  const [showYearGrid, setShowYearGrid] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const ref     = useRef(null);
  const trigRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open || !trigRef.current) return;
    const rect   = trigRef.current.getBoundingClientRect();
    const popW   = Math.min(288, window.innerWidth - 24);
    const popH   = 320;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    let top, left;
    if (spaceBelow >= popH || spaceBelow >= spaceAbove) {
      top = rect.bottom + window.scrollY + 6;
    } else {
      top = rect.top + window.scrollY - popH - 6;
    }

    left = rect.left + window.scrollX;
    const rightEdge = left + popW;
    if (rightEdge > window.innerWidth - 12) left = window.innerWidth - popW - 12;
    if (left < 12) left = 12;

    setPopupStyle({ position: "fixed", top: rect.bottom + 6, left, width: popW,
      ...(spaceBelow < popH && spaceAbove > spaceBelow
        ? { top: rect.top - popH - 6 } : {}) });
  }, [open]);

  const today   = new Date(); today.setHours(0,0,0,0);
  const minDate = new Date(today.getTime() + 86400000);
  const selected = value ? new Date(value + "T00:00:00") : null;

  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, type: "prev" });
  for (let i = 1; i <= daysInMonth; i++)
    cells.push({ day: i, type: "cur" });
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++)
    cells.push({ day: i, type: "next" });

  const handleDayClick = (cell) => {
    if (cell.type !== "cur") return;
    const d = new Date(viewYear, viewMonth, cell.day);
    if (d < minDate) return;
    const iso = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(cell.day).padStart(2,"0")}`;
    onChange(iso);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); }
    else setViewMonth(m => m-1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); }
    else setViewMonth(m => m+1);
  };

  const isDisabled = (cell) => {
    if (cell.type !== "cur") return true;
    return new Date(viewYear, viewMonth, cell.day) < minDate;
  };
  const isSelected = (cell) => {
    if (!selected || cell.type !== "cur") return false;
    return selected.getFullYear() === viewYear &&
           selected.getMonth()    === viewMonth &&
           selected.getDate()     === cell.day;
  };
  const isToday = (cell) => {
    if (cell.type !== "cur") return false;
    return today.getFullYear() === viewYear &&
           today.getMonth()    === viewMonth &&
           today.getDate()     === cell.day;
  };

  const displayValue = selected
    ? selected.toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })
    : "Select your event date";

  const yearBase = Math.floor(viewYear / 12) * 12;
  const years    = Array.from({length:12}, (_,i) => yearBase + i);

  return (
    <div className="cdp-root" ref={ref}>
      <button
        ref={trigRef}
        type="button"
        className={`cdp-trigger ${hasError ? "error" : ""} ${open ? "open" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="cdp-icon">🗓</span>
        <span className={`cdp-val ${!selected ? "placeholder" : ""}`}>{displayValue}</span>
        <span className="cdp-arrow">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="cdp-pop" style={popupStyle}>
          <div className="cdp-header">
            <button className="cdp-nav" onClick={prevMonth}>‹</button>
            <button className="cdp-month-btn" onClick={() => setShowYearGrid(g => !g)}>
              {MONTHS[viewMonth].slice(0,3)} {viewYear}
              <span className="cdp-chevron">{showYearGrid ? "▲" : "▼"}</span>
            </button>
            <button className="cdp-nav" onClick={nextMonth}>›</button>
          </div>

          {showYearGrid ? (
            <div className="cdp-year-grid">
              <div className="cdp-yr-nav-row">
                <button className="cdp-yr-nav" onClick={() => setViewYear(y => y-12)}>‹</button>
                <span className="cdp-yr-range">{yearBase}–{yearBase+11}</span>
                <button className="cdp-yr-nav" onClick={() => setViewYear(y => y+12)}>›</button>
              </div>
              <div className="cdp-yr-cells">
                {years.map(y => (
                  <button
                    key={y}
                    className={`cdp-yr-cell ${y === viewYear ? "active" : ""}`}
                    onClick={() => { setViewYear(y); setShowYearGrid(false); }}
                  >{y}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="cdp-daynames">
                {DAYS.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="cdp-grid">
                {cells.map((cell, idx) => (
                  <button
                    key={idx}
                    className={[
                      "cdp-cell",
                      cell.type !== "cur" ? "other"    : "",
                      isDisabled(cell)    ? "disabled" : "",
                      isSelected(cell)    ? "selected" : "",
                      isToday(cell)       ? "today"    : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => handleDayClick(cell)}
                    disabled={isDisabled(cell)}
                  >
                    {cell.day}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VendorDetail() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateWarning, setDateWarning] = useState("");

  const [showVendorModal, setShowVendorModal]   = useState(false);
  const [showLoginModal, setShowLoginModal]     = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showWaitModal, setShowWaitModal]       = useState(false);
  const [showShareModal, setShowShareModal]     = useState(false);

  const navigate = useNavigate();
  const user    = JSON.parse(localStorage.getItem("user"));
  const isVendor = user?.role === "vendor";

  useEffect(() => {
    const controller = new AbortController();
    API.get(`/vendors/single/${id}`, { signal: controller.signal })
      .then((res) => {
        setVendor(res.data);
        if (res.data?.packages?.length > 0) setSelectedPackage(0);
      })
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED")
          console.error("Failed to load vendor:", err);
      });
    return () => controller.abort();
  }, [id]);

  const handleReserveClick = () => {
    if (isVendor) { setShowVendorModal(true); return; }
    const token = localStorage.getItem("token");
    if (!token)  { setShowLoginModal(true);  return; }
    if (!selectedDate) { setDateWarning("Please select a date to continue."); return; }
    const picked = new Date(selectedDate);
    if (isNaN(picked.getTime()))     { setDateWarning("Please select a valid date."); return; }
    if (picked.getFullYear() > 2100) { setDateWarning("Please select a realistic date."); return; }
    setDateWarning("");
    setShowDetailsModal(true);
  };

  const handleDetailsConfirm = async (userDetails) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      await API.post(
        "/bookings",
        {
          vendorId:     vendor._id,
          date:         selectedDate,
          packageName:  vendor.packages[selectedPackage].name,
          packagePrice: vendor.packages[selectedPackage].price,
          userDetails,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDetailsModal(false);
      setShowWaitModal(true);
    } catch (err) {
      console.error(err);
      setDateWarning(err.response?.data?.error || "Failed to create booking");
      setShowDetailsModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (!vendor) {
    return (
      <>
        <style>{styles}</style>
        <Navbar />
        <div className="vd-loader">
          <div className="vd-spinner" />
          <p>Curating your experience…</p>
        </div>
      </>
    );
  }

  const pkg = vendor.packages?.[selectedPackage];

  return (
    <>
      <style>{styles}</style>
      <style>{shareModalStyles}</style>
      <Navbar />

      {showDetailsModal && pkg && (
        <BookingDetailsModal
          pkg={pkg} vendor={vendor} date={selectedDate}
          onConfirm={handleDetailsConfirm}
          onClose={() => setShowDetailsModal(false)}
          loading={loading}
        />
      )}
      {showWaitModal && (
        <BookingWaitModal
          vendor={vendor}
          onClose={() => { setShowWaitModal(false); navigate("/my-bookings"); }}
        />
      )}

      {/* Share Modal */}
      {showShareModal && vendor && (
        <ShareModal
          vendor={vendor}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Login modal */}
      {showLoginModal && (
        <div className="vd-modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="vd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vd-modal-icon-ring"><span><Logo /></span></div>
            <h3 className="vd-modal-title">Sign in to Continue</h3>
            <p className="vd-modal-body">
              You need an account to reserve this vendor. Sign in or create a free account — it only takes a minute.
            </p>
            <div className="vd-modal-actions">
              <button className="vd-modal-cancel" onClick={() => setShowLoginModal(false)}>Maybe Later</button>
              <button className="vd-modal-login" onClick={() => navigate("/login", { state: { from: `/vendor/${id}` } })}>Sign In</button>
              <button className="vd-modal-register" onClick={() => navigate("/register", { state: { from: `/vendor/${id}` } })}>Create Account →</button>
            </div>
            <p className="vd-modal-note">Free to join · No credit card required</p>
          </div>
        </div>
      )}

      {/* Vendor modal */}
      {showVendorModal && (
        <div className="vd-modal-backdrop" onClick={() => setShowVendorModal(false)}>
          <div className="vd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vd-modal-icon">⚠</div>
            <h3 className="vd-modal-title">Switch to Client Account?</h3>
            <p className="vd-modal-body">
              You are currently logged in as a <strong>Vendor</strong>. To book services, you need a client account.
            </p>
            <div className="vd-modal-actions">
              <button className="vd-modal-cancel" onClick={() => setShowVendorModal(false)}>Stay as Vendor</button>
              <button className="vd-modal-register" onClick={() => { setShowVendorModal(false); navigate("/register", { state: { role: "user" } }); }}>
                Yes, Register as Client
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="vd-root">
        {/* Hero */}
        <div className="vd-hero">
          <img src={vendor.images?.[0] || "/placeholder.jpg"} alt={vendor.title} className="vd-hero-img" />
          <div className="vd-hero-overlay" />
          <div className="vd-hero-content">
            <span className="vd-tag">📍 {vendor.location}</span>
            <h1 className="vd-title">{vendor.title}</h1>
            <div className="vd-badge-row">
              <span className="vd-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Premium Vendor
              </span>
              <span className="vd-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Verified
              </span>
              <span className="vd-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                {vendor.packages?.length} {vendor.packages?.length === 1 ? "Package" : "Packages"}
              </span>

              {/* ── Share Button in Hero ── */}
              <button
                className="vd-share-badge"
                onClick={() => setShowShareModal(true)}
                title="Share this service"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="vd-body">
          {/* Sidebar */}
          <aside className="vd-sidebar">
            <h2 className="vd-section-label">Choose a Package</h2>
            <div className="vd-pkg-list">
              {vendor.packages.map((p, i) => (
                <button
                  key={i}
                  className={`vd-pkg-card ${selectedPackage === i ? "active" : ""}`}
                  onClick={() => setSelectedPackage(i)}
                >
                  <div className="vd-pkg-top">
                    <span className="vd-pkg-name">{p.name}</span>
                    <span className="vd-pkg-price">₹{p.price?.toLocaleString()}</span>
                  </div>
                  <ul className="vd-pkg-desc">
                    {p.features?.map((f, fi) => <li key={fi}>✔ {f}</li>)}
                  </ul>
                  {selectedPackage === i && <span className="vd-pkg-selected-dot" />}
                </button>
              ))}
            </div>
          </aside>

          {/* Main */}
          <main className="vd-main">
            {pkg && (
              <div className="vd-booking-panel">
                <div className="vd-panel-header">
                  <h3 className="vd-panel-title">{pkg.name}</h3>
                  <div className="vd-panel-right">
                    <div className="vd-panel-price">
                      <span className="vd-price-label">Starting at</span>
                      <span className="vd-price-value">₹{pkg.price?.toLocaleString()}</span>
                    </div>
                    {/* Share button inside booking panel */}
                    <button
                      className="vd-panel-share-btn"
                      onClick={() => setShowShareModal(true)}
                      title="Share this service"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <ul className="vd-panel-desc">
                  {pkg.features?.map((f, i) => <li key={i}>✔ {f}</li>)}
                </ul>

                <div className="vd-divider" />

                {/* Calendar */}
                <div className="vd-date-section">
                  <label className="vd-label">Select Your Date</label>
                  <CustomDatePicker
                    value={selectedDate}
                    onChange={(iso) => { setSelectedDate(iso); setDateWarning(""); }}
                    hasError={!!dateWarning}
                  />
                  {dateWarning && (
                    <p className="vd-date-warning">
                      <span className="vd-warn-icon">⚠</span> {dateWarning}
                    </p>
                  )}
                </div>

                <button
                  className={`vd-book-btn ${loading ? "loading" : ""}`}
                  onClick={handleReserveClick}
                  disabled={loading}
                >
                  {isVendor ? (
                    <>It seems you are a Vendor — Explore as a Client</>
                  ) : loading ? (
                    <><span className="vd-btn-spinner" /> Processing…</>
                  ) : (
                    <>Reserve Now — ₹{pkg.price?.toLocaleString()}</>
                  )}
                </button>

                {/* Share + Note row */}
                <div className="vd-bottom-row">
                  <p className="vd-note">No payment now · Vendor confirms first · Then pay securely</p>
                  <button
                    className="vd-share-text-btn"
                    onClick={() => setShowShareModal(true)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            )}

            {vendor.images?.length > 1 && (
              <div className="vd-gallery">
                <h2 className="vd-section-label">Gallery</h2>
                <div className="vd-gallery-grid">
                  {vendor.images.slice(0).map((img, i) => (
                    <div key={i} className="vd-gallery-item">
                      <img src={img} alt={`gallery-${i}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

// ── Share Modal CSS ───────────────────────────────────────────────────────────
const shareModalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;500&display=swap');

  .vsm-backdrop {
    position: fixed; inset: 0;
    background: rgba(14,12,10,0.62); backdrop-filter: blur(7px);
    z-index: 1100; animation: vsmFadeIn 0.18s ease both;
  }
  .vsm-modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: 1101; background: #faf7f2;
    border: 1px solid rgba(201,168,76,0.28); border-radius: 22px;
    padding: 40px 36px 32px; width: min(460px, 92vw);
    box-shadow: 0 40px 100px rgba(14,12,10,0.24);
    animation: vsmSlideUp 0.26s cubic-bezier(0.34,1.5,0.64,1) both;
  }
  .vsm-close {
    position: absolute; top: 18px; right: 20px;
    background: none; border: none; font-size: 13px; color: #a09890;
    cursor: pointer; width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, color 0.15s;
  }
  .vsm-close:hover { background: rgba(14,12,10,0.07); color: #0e0c0a; }

  .vsm-header { text-align: center; margin-bottom: 24px; }
  .vsm-header-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg,rgba(201,168,76,0.16),rgba(201,168,76,0.05));
    border: 1.5px solid rgba(201,168,76,0.32);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; color: #c9a84c;
  }
  .vsm-title {
    font-family:'Cormorant Garamond',serif; font-size: 1.55rem;
    font-weight: 600; color: #0e0c0a; margin: 0 0 7px;
  }
  .vsm-subtitle {
    font-family:'DM Sans',sans-serif; font-size: 13px; color: #7a7265; margin: 0;
  }
  .vsm-subtitle strong { color: #0e0c0a; font-weight: 500; }

  .vsm-preview {
    display: flex; align-items: center; gap: 14px;
    background: rgba(14,12,10,0.035); border: 1px solid rgba(201,168,76,0.16);
    border-radius: 12px; padding: 12px 16px; margin-bottom: 22px;
  }
  .vsm-preview-img {
    width: 56px; height: 56px; object-fit: cover; border-radius: 8px; flex-shrink: 0;
    border: 1px solid rgba(201,168,76,0.22);
  }
  .vsm-preview-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .vsm-preview-title {
    font-family:'Cormorant Garamond',serif; font-size: 1.05rem; font-weight: 600;
    color: #0e0c0a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vsm-preview-loc { font-size: 11.5px; color: #7a7265; }
  .vsm-preview-price { font-size: 12px; color: #c9a84c; font-weight: 500; }

  .vsm-section-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; color: #a09890; margin: 0 0 12px;
  }

  .vsm-platforms {
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 9px; margin-bottom: 22px;
  }
  .vsm-platform {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 14px 6px 11px;
    background: var(--pbg, rgba(14,12,10,0.04));
    border: 1px solid var(--pborder, rgba(14,12,10,0.1));
    border-radius: 12px; cursor: pointer;
    transition: all 0.2s ease; position: relative;
  }
  .vsm-platform:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(14,12,10,0.1);
    border-color: var(--pc); background: var(--pbg);
  }
  .vsm-p-icon { display: flex; align-items: center; justify-content: center; }
  .vsm-p-name {
    font-family:'DM Sans',sans-serif; font-size: 9.5px; font-weight: 500;
    color: #7a7265; letter-spacing: 0.02em; text-align: center;
    white-space: nowrap; overflow: hidden; width: 100%; text-overflow: ellipsis;
  }
  .vsm-p-note {
    position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
    font-size: 7.5px; color: #c9a84c; background: #faf7f2;
    padding: 0 5px; white-space: nowrap; border-radius: 4px;
  }

  .vsm-copy {
    display: flex; align-items: center; gap: 8px;
    background: rgba(14,12,10,0.035); border: 1px solid rgba(201,168,76,0.22);
    border-radius: 10px; padding: 5px 5px 5px 13px; margin-bottom: 16px;
  }
  .vsm-copy-url {
    display: flex; align-items: center; gap: 7px;
    flex: 1; min-width: 0;
  }
  .vsm-copy-text {
    font-size: 11.5px; color: #7a7265; font-family:'DM Sans',sans-serif;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vsm-copy-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 18px; background: #0e0c0a; border: none; border-radius: 7px;
    font-family:'DM Sans',sans-serif; font-size: 12px; font-weight: 500;
    color: white; cursor: pointer; transition: all 0.22s; flex-shrink: 0;
    white-space: nowrap;
  }
  .vsm-copy-btn:hover { background: #c9a84c; color: #0e0c0a; }
  .vsm-copy-btn.copied { background: #2d6a4f; }

  .vsm-footer-note {
    font-family:'DM Sans',sans-serif; font-size: 11px;
    color: #b0a898; text-align: center; margin: 0; letter-spacing: 0.04em;
  }

  @keyframes vsmFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes vsmSlideUp {
    from { opacity:0; transform: translate(-50%,-46%); }
    to   { opacity:1; transform: translate(-50%,-50%); }
  }

  @media (max-width:480px) {
    .vsm-platforms { grid-template-columns: repeat(3,1fr); }
    .vsm-modal { padding: 32px 20px 26px; }
  }
`;

// ── Main Page CSS ─────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c;
    --gold-light: #e8d5a3; --muted: #7a7265;
    --border: rgba(201,168,76,0.2); --surface: #faf7f2;
    --white: #ffffff; --success: #2d6a4f;
    --danger: #a93226; --danger-bg: #fdf0ef;
    --danger-border: rgba(169,50,38,0.25);
  }

  .vd-root { font-family:'DM Sans',sans-serif; background:var(--cream); min-height:100vh; color:var(--ink); }

  /* ── Modals ── */
  .vd-modal-backdrop { position:fixed; inset:0; background:rgba(14,12,10,0.6); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:999; animation:fadeIn 0.2s ease both; padding:20px; }
  .vd-modal { background:var(--white); border-radius:16px; padding:44px 40px 36px; max-width:420px; width:100%; text-align:center; animation:modalUp 0.28s cubic-bezier(0.34,1.4,0.64,1) both; border:1px solid var(--border); box-shadow:0 24px 64px rgba(14,12,10,0.18); }
  .vd-modal-icon-ring { width:60px; height:60px; background:linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05)); border:1.5px solid var(--border); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:var(--gold); margin:0 auto 20px; }
  .vd-modal-icon { font-size:28px; margin-bottom:14px; display:block; color:var(--gold); }
  .vd-modal-title { font-family:'Cormorant Garamond',serif; font-size:1.65rem; font-weight:600; color:var(--ink); margin:0 0 12px; font-style:italic; }
  .vd-modal-body { font-size:13.5px; color:var(--muted); line-height:1.7; margin:0 0 28px; }
  .vd-modal-body strong { color:var(--ink); font-weight:500; }
  .vd-modal-actions { display:flex; gap:10px; flex-wrap:wrap; }
  .vd-modal-cancel { flex:1; min-width:100px; padding:13px 16px; background:transparent; border:1px solid var(--border); border-radius:6px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:var(--muted); cursor:pointer; transition:all 0.2s ease; }
  .vd-modal-cancel:hover { border-color:var(--muted); color:var(--ink); background:var(--surface); }
  .vd-modal-login { flex:1; min-width:80px; padding:13px 16px; background:var(--surface); border:1px solid var(--border); border-radius:6px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:var(--ink); cursor:pointer; transition:all 0.2s ease; }
  .vd-modal-login:hover { border-color:var(--gold); color:var(--gold); }
  .vd-modal-register { flex:1.4; min-width:120px; padding:13px 16px; background:var(--ink); border:none; border-radius:6px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:var(--white); cursor:pointer; transition:all 0.2s ease; }
  .vd-modal-register:hover { background:var(--gold); color:var(--ink); transform:translateY(-1px); }
  .vd-modal-note { font-size:11px; color:var(--muted); margin-top:18px; letter-spacing:0.05em; }

  /* ── Hero ── */
  .vd-hero { position:relative; height:520px; overflow:hidden; }
  .vd-hero-img { width:100%; height:100%; object-fit:cover; display:block; transform:scale(1.03); transition:transform 8s ease; }
  .vd-hero:hover .vd-hero-img { transform:scale(1); }
  .vd-hero-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(14,12,10,0.85) 0%,rgba(14,12,10,0.2) 50%,transparent 100%); }
  .vd-hero-content { position:absolute; bottom:0; left:0; right:0; padding:48px 56px; animation:fadeUp 0.7s ease both; }
  .vd-tag { font-size:12px; font-weight:500; letter-spacing:0.15em; text-transform:uppercase; color:var(--gold-light); display:block; margin-bottom:12px; }
  .vd-title { font-family:'Cormorant Garamond',serif; font-size:clamp(2.4rem,5vw,3.6rem); font-weight:300; color:var(--white); line-height:1.1; margin:0 0 20px; }
  .vd-badge-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  .vd-badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold); border:1px solid rgba(201,168,76,0.5); padding:6px 14px; border-radius:20px; backdrop-filter:blur(6px); background:rgba(201,168,76,0.1); transition:background 0.2s, border-color 0.2s; }
  .vd-badge:hover { background:rgba(201,168,76,0.2); border-color:var(--gold); }
  .vd-badge svg { flex-shrink:0; }

  /* ── Share badge in hero ── */
  .vd-share-badge {
    display:inline-flex; align-items:center; gap:7px;
    font-size:11px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase;
    color:var(--white); border:1px solid rgba(255,255,255,0.4);
    padding:6px 14px; border-radius:20px; backdrop-filter:blur(6px);
    background:rgba(255,255,255,0.12); cursor:pointer;
    transition:all 0.22s ease;
  }
  .vd-share-badge:hover {
    background:rgba(201,168,76,0.25); border-color:var(--gold); color:var(--gold);
    transform:translateY(-2px); box-shadow:0 6px 18px rgba(201,168,76,0.25);
  }
  .vd-share-badge svg { flex-shrink:0; }

  /* ── Body layout ── */
  .vd-body { display:grid; grid-template-columns:340px 1fr; gap:0; max-width:1200px; margin:0 auto; padding:48px 32px; align-items:start; }
  @media(max-width:900px){
    .vd-body { grid-template-columns:1fr; padding:32px 20px; }
    .vd-hero-content { padding:32px 24px; }
    .vd-sidebar { padding-right:0; margin-bottom:32px; }
    .vd-modal-actions { flex-direction:column; }
    .vd-hero { height:360px; }
  }
  @media(max-width:480px){
    .vd-hero { height:280px; }
    .vd-body { padding:20px 16px; }
    .vd-booking-panel { padding:24px 18px; }
    .vd-modal { padding:32px 24px 28px; }
  }

  .vd-sidebar { padding-right:40px; }
  .vd-section-label { font-size:10px; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; color:var(--muted); margin:0 0 20px; }
  .vd-pkg-list { display:flex; flex-direction:column; gap:12px; }
  .vd-pkg-card { position:relative; background:var(--white); border:1px solid var(--border); border-radius:8px; padding:20px; text-align:left; cursor:pointer; transition:all 0.25s ease; overflow:hidden; }
  .vd-pkg-card:hover { border-color:var(--gold); transform:translateX(4px); box-shadow:0 4px 20px rgba(201,168,76,0.12); }
  .vd-pkg-card.active { border-color:var(--gold); background:linear-gradient(135deg,#faf7f0 0%,#fff8e8 100%); box-shadow:0 6px 24px rgba(201,168,76,0.18); }
  .vd-pkg-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
  .vd-pkg-name { font-family:'Cormorant Garamond',serif; font-size:1.15rem; font-weight:600; color:var(--ink); }
  .vd-pkg-price { font-size:13px; font-weight:500; color:var(--gold); white-space:nowrap; }
  .vd-pkg-desc { font-size:12.5px; color:var(--muted); line-height:1.5; margin:0; padding-left:0; list-style:none; }
  .vd-pkg-selected-dot { position:absolute; top:0; left:0; width:3px; height:100%; background:var(--gold); border-radius:0 2px 2px 0; }

  .vd-main { display:flex; flex-direction:column; gap:40px; }

  .vd-booking-panel { background:var(--white); border:1px solid var(--border); border-radius:12px; padding:36px; box-shadow:0 8px 40px rgba(14,12,10,0.06); animation:fadeUp 0.5s ease both; }

  .vd-panel-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .vd-panel-title { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:400; margin:0; color:var(--ink); font-style:italic; }

  /* Right side of panel header: price + share button */
  .vd-panel-right { display:flex; align-items:flex-start; gap:10px; }
  .vd-panel-price { text-align:right; }
  .vd-price-label { display:block; font-size:11px; color:var(--muted); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:2px; }
  .vd-price-value { font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:600; color:var(--ink); }

  .vd-panel-share-btn {
    width:36px; height:36px; background:var(--surface); border:1px solid var(--border);
    border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:var(--muted); transition:all 0.2s; flex-shrink:0; margin-top:4px;
  }
  .vd-panel-share-btn:hover { border-color:var(--gold); color:var(--gold); background:rgba(201,168,76,0.07); }

  .vd-panel-desc { font-size:13.5px; color:var(--muted); line-height:1.7; margin:0; padding-left:0; list-style:none; }
  .vd-divider { height:1px; background:var(--border); margin:24px 0; }

  .vd-date-section { margin-bottom:28px; }
  .vd-label { display:block; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); margin-bottom:10px; }
  .vd-date-warning { display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--danger); margin:8px 0 0; padding:9px 13px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:5px; animation:fadeUp 0.2s ease both; }
  .vd-warn-icon { font-size:13px; flex-shrink:0; }

  .vd-book-btn { width:100%; padding:17px 24px; background:var(--gold); color:var(--ink); border:none; border-radius:6px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; letter-spacing:0.05em; cursor:pointer; transition:all 0.3s ease; display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:14px; }
  .vd-book-btn:hover:not(:disabled) { background:var(--ink); color:var(--white); transform:translateY(-1px); box-shadow:0 8px 24px rgba(14,12,10,0.2); }
  .vd-book-btn.loading { opacity:0.7; pointer-events:none; }
  .vd-btn-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }

  /* Bottom row: note + share text button */
  .vd-bottom-row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .vd-note { font-size:11.5px; color:var(--muted); margin:0; flex:1; }
  .vd-share-text-btn {
    display:flex; align-items:center; gap:5px;
    padding:6px 12px; background:none;
    border:1px solid var(--border); border-radius:20px;
    font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:500;
    color:var(--muted); cursor:pointer; transition:all 0.2s; white-space:nowrap; flex-shrink:0;
  }
  .vd-share-text-btn:hover { border-color:var(--gold); color:var(--gold); background:rgba(201,168,76,0.06); }

  .vd-gallery-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; margin-top:16px; }
  .vd-gallery-item { aspect-ratio:4/3; border-radius:6px; overflow:hidden; border:1px solid var(--border); }
  .vd-gallery-item img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease; }
  .vd-gallery-item:hover img { transform:scale(1.06); }

  .vd-loader { min-height:80vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:var(--muted); font-size:13px; letter-spacing:0.1em; }
  .vd-spinner { width:36px; height:36px; border:2px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin 0.9s linear infinite; }

  /* ═══════════════════════════════════════════
     CUSTOM DATE PICKER
  ═══════════════════════════════════════════ */
  .cdp-root { position:relative; width:100%; }
  .cdp-trigger { width:100%; display:flex; align-items:center; gap:9px; border:1px solid var(--border); border-radius:6px; padding:11px 14px; background:var(--surface); font-family:'DM Sans',sans-serif; font-size:13px; color:var(--ink); cursor:pointer; transition:border-color 0.2s, box-shadow 0.2s; text-align:left; }
  .cdp-trigger:hover, .cdp-trigger.open { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.08); }
  .cdp-trigger.error { border-color:var(--danger-border); background:var(--danger-bg); animation:shake 0.35s ease; }
  .cdp-icon  { font-size:14px; flex-shrink:0; line-height:1; }
  .cdp-val   { flex:1; font-size:13px; }
  .cdp-val.placeholder { color:var(--muted); }
  .cdp-arrow { font-size:9px; color:var(--muted); flex-shrink:0; }
  .cdp-pop { z-index:9999; background:var(--white); border:1px solid rgba(201,168,76,0.22); border-radius:12px; overflow:hidden; box-shadow:0 12px 40px rgba(14,12,10,0.18); animation:cdpDrop 0.18s cubic-bezier(0.34,1.3,0.64,1) both; }
  .cdp-header { display:flex; align-items:center; justify-content:space-between; background:var(--ink); padding:9px 10px; }
  .cdp-nav { background:none; border:none; color:var(--gold); font-size:16px; cursor:pointer; width:28px; height:28px; border-radius:4px; display:flex; align-items:center; justify-content:center; transition:background 0.15s; flex-shrink:0; line-height:1; }
  .cdp-nav:hover { background:rgba(201,168,76,0.15); }
  .cdp-month-btn { background:none; border:none; cursor:pointer; font-family:'Cormorant Garamond',serif; font-size:0.95rem; font-style:italic; color:var(--white); letter-spacing:0.04em; padding:3px 8px; border-radius:4px; display:flex; align-items:center; gap:5px; transition:background 0.15s; }
  .cdp-month-btn:hover { background:rgba(201,168,76,0.15); }
  .cdp-chevron { font-size:8px; color:var(--gold); }
  .cdp-daynames { display:grid; grid-template-columns:repeat(7,1fr); background:#1a1714; padding:4px 8px 5px; }
  .cdp-daynames span { font-size:9px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold); text-align:center; line-height:2; }
  .cdp-grid { display:grid; grid-template-columns:repeat(7,1fr); padding:5px 8px 8px; gap:1px; }
  .cdp-cell { aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:11.5px; font-family:'DM Sans',sans-serif; color:var(--ink); background:none; border:none; border-radius:50%; cursor:pointer; transition:background 0.12s, color 0.12s, transform 0.1s; line-height:1; }
  .cdp-cell:hover:not(.disabled):not(.other) { background:var(--cream); transform:scale(1.1); }
  .cdp-cell.other    { color:rgba(14,12,10,0.18); cursor:default; }
  .cdp-cell.disabled { color:rgba(14,12,10,0.18) !important; cursor:not-allowed; }
  .cdp-cell.today:not(.selected) { color:var(--gold); font-weight:600; box-shadow:inset 0 0 0 1px rgba(201,168,76,0.45); }
  .cdp-cell.selected { background:var(--gold) !important; color:var(--ink) !important; font-weight:700; box-shadow:0 2px 8px rgba(201,168,76,0.4); }
  .cdp-year-grid { padding:10px 12px; }
  .cdp-yr-nav-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .cdp-yr-range { font-size:11px; color:var(--muted); letter-spacing:0.06em; }
  .cdp-yr-nav { background:none; border:none; color:var(--gold); font-size:14px; cursor:pointer; width:26px; height:26px; border-radius:4px; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
  .cdp-yr-nav:hover { background:var(--surface); }
  .cdp-yr-cells { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
  .cdp-yr-cell { padding:7px 0; background:none; border:1px solid transparent; border-radius:5px; font-family:'DM Sans',sans-serif; font-size:12px; color:var(--ink); cursor:pointer; text-align:center; transition:all 0.13s; }
  .cdp-yr-cell:hover  { background:var(--surface); border-color:var(--border); }
  .cdp-yr-cell.active { background:var(--ink); color:var(--white); border-color:var(--ink); }

  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes modalUp { from{opacity:0;transform:translateY(24px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes cdpDrop { from{opacity:0;transform:translateY(-6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
`;