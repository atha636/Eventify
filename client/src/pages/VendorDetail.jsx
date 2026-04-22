import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import BookingDetailsModal from "../components/BookingDetailsModal";
import BookingWaitModal from "../components/BookingWaitModal";
import Logo from "../components/Logo";

// ── Custom Calendar ───────────────────────────────────────────────────────────
function CustomDatePicker({ value, onChange, hasError }) {
  const [open, setOpen]             = useState(false);
  const [viewYear, setViewYear]     = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth]   = useState(() => new Date().getMonth());
  const [showYearGrid, setShowYearGrid] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const ref     = useRef(null);
  const trigRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Compute popup position so it never overflows the viewport
  useEffect(() => {
    if (!open || !trigRef.current) return;
    const rect   = trigRef.current.getBoundingClientRect();
    const popW   = Math.min(288, window.innerWidth - 24);
    const popH   = 320; // approx popup height
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    let top, left;

    // vertical: prefer below, else above
    if (spaceBelow >= popH || spaceBelow >= spaceAbove) {
      top = rect.bottom + window.scrollY + 6;
    } else {
      top = rect.top + window.scrollY - popH - 6;
    }

    // horizontal: align left edge, clamp to screen
    left = rect.left + window.scrollX;
    const rightEdge = left + popW;
    if (rightEdge > window.innerWidth - 12) {
      left = window.innerWidth - popW - 12;
    }
    if (left < 12) left = 12;

    setPopupStyle({ position: "fixed", top: rect.bottom + 6, left, width: popW,
      ...(spaceBelow < popH && spaceAbove > spaceBelow
        ? { top: rect.top - popH - 6 }
        : {}) });
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
          {/* Header */}
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
                  <div className="vd-panel-price">
                    <span className="vd-price-label">Starting at</span>
                    <span className="vd-price-value">₹{pkg.price?.toLocaleString()}</span>
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

                <p className="vd-note">No payment now · Vendor confirms first · Then pay securely</p>
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
  .vd-panel-price { text-align:right; }
  .vd-price-label { display:block; font-size:11px; color:var(--muted); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:2px; }
  .vd-price-value { font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:600; color:var(--ink); }
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
  .vd-note { font-size:11.5px; color:var(--muted); text-align:center; margin:0; }

  .vd-gallery-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; margin-top:16px; }
  .vd-gallery-item { aspect-ratio:4/3; border-radius:6px; overflow:hidden; border:1px solid var(--border); }
  .vd-gallery-item img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease; }
  .vd-gallery-item:hover img { transform:scale(1.06); }

  .vd-loader { min-height:80vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:var(--muted); font-size:13px; letter-spacing:0.1em; }
  .vd-spinner { width:36px; height:36px; border:2px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin 0.9s linear infinite; }

  /* ═══════════════════════════════════════════
     CUSTOM DATE PICKER — fixed-position popup
  ═══════════════════════════════════════════ */
  .cdp-root { position:relative; width:100%; }

  /* Trigger button */
  .cdp-trigger {
    width:100%; display:flex; align-items:center; gap:9px;
    border:1px solid var(--border); border-radius:6px;
    padding:11px 14px; background:var(--surface);
    font-family:'DM Sans',sans-serif; font-size:13px; color:var(--ink);
    cursor:pointer; transition:border-color 0.2s, box-shadow 0.2s;
    text-align:left;
  }
  .cdp-trigger:hover, .cdp-trigger.open {
    border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.08);
  }
  .cdp-trigger.error { border-color:var(--danger-border); background:var(--danger-bg); animation:shake 0.35s ease; }
  .cdp-icon  { font-size:14px; flex-shrink:0; line-height:1; }
  .cdp-val   { flex:1; font-size:13px; }
  .cdp-val.placeholder { color:var(--muted); }
  .cdp-arrow { font-size:9px; color:var(--muted); flex-shrink:0; }

  /* Popup — now uses fixed positioning (set via JS) so it never clips */
  .cdp-pop {
    /* position/top/left/width set via inline style from JS */
    z-index:9999;
    background:var(--white);
    border:1px solid rgba(201,168,76,0.22);
    border-radius:12px; overflow:hidden;
    box-shadow:0 12px 40px rgba(14,12,10,0.18);
    animation:cdpDrop 0.18s cubic-bezier(0.34,1.3,0.64,1) both;
  }

  /* Header bar */
  .cdp-header {
    display:flex; align-items:center; justify-content:space-between;
    background:var(--ink); padding:9px 10px;
  }
  .cdp-nav {
    background:none; border:none; color:var(--gold); font-size:16px;
    cursor:pointer; width:28px; height:28px; border-radius:4px;
    display:flex; align-items:center; justify-content:center;
    transition:background 0.15s; flex-shrink:0; line-height:1;
  }
  .cdp-nav:hover { background:rgba(201,168,76,0.15); }
  .cdp-month-btn {
    background:none; border:none; cursor:pointer;
    font-family:'Cormorant Garamond',serif; font-size:0.95rem;
    font-style:italic; color:var(--white); letter-spacing:0.04em;
    padding:3px 8px; border-radius:4px;
    display:flex; align-items:center; gap:5px; transition:background 0.15s;
  }
  .cdp-month-btn:hover { background:rgba(201,168,76,0.15); }
  .cdp-chevron { font-size:8px; color:var(--gold); }

  /* Day-name row */
  .cdp-daynames {
    display:grid; grid-template-columns:repeat(7,1fr);
    background:#1a1714; padding:4px 8px 5px;
  }
  .cdp-daynames span {
    font-size:9px; font-weight:600; letter-spacing:0.1em;
    text-transform:uppercase; color:var(--gold); text-align:center; line-height:2;
  }

  /* Day cell grid */
  .cdp-grid {
    display:grid; grid-template-columns:repeat(7,1fr);
    padding:5px 8px 8px; gap:1px;
  }
  .cdp-cell {
    aspect-ratio:1; display:flex; align-items:center; justify-content:center;
    font-size:11.5px; font-family:'DM Sans',sans-serif;
    color:var(--ink); background:none; border:none; border-radius:50%;
    cursor:pointer; transition:background 0.12s, color 0.12s, transform 0.1s; line-height:1;
  }
  .cdp-cell:hover:not(.disabled):not(.other) { background:var(--cream); transform:scale(1.1); }
  .cdp-cell.other    { color:rgba(14,12,10,0.18); cursor:default; }
  .cdp-cell.disabled { color:rgba(14,12,10,0.18) !important; cursor:not-allowed; }
  .cdp-cell.today:not(.selected) {
    color:var(--gold); font-weight:600; box-shadow:inset 0 0 0 1px rgba(201,168,76,0.45);
  }
  .cdp-cell.selected {
    background:var(--gold) !important; color:var(--ink) !important;
    font-weight:700; box-shadow:0 2px 8px rgba(201,168,76,0.4);
  }

  /* Year picker */
  .cdp-year-grid { padding:10px 12px; }
  .cdp-yr-nav-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .cdp-yr-range { font-size:11px; color:var(--muted); letter-spacing:0.06em; }
  .cdp-yr-nav {
    background:none; border:none; color:var(--gold); font-size:14px;
    cursor:pointer; width:26px; height:26px; border-radius:4px;
    display:flex; align-items:center; justify-content:center; transition:background 0.15s;
  }
  .cdp-yr-nav:hover { background:var(--surface); }
  .cdp-yr-cells { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
  .cdp-yr-cell {
    padding:7px 0; background:none; border:1px solid transparent; border-radius:5px;
    font-family:'DM Sans',sans-serif; font-size:12px; color:var(--ink);
    cursor:pointer; text-align:center; transition:all 0.13s;
  }
  .cdp-yr-cell:hover  { background:var(--surface); border-color:var(--border); }
  .cdp-yr-cell.active { background:var(--ink); color:var(--white); border-color:var(--ink); }

  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes modalUp { from{opacity:0;transform:translateY(24px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes cdpDrop { from{opacity:0;transform:translateY(-6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
`;