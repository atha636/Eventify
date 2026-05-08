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
  const shareUrl  = `${window.location.origin}/vendor/${vendor._id}`;
  const startPrice = vendor.packages?.[0]?.price || vendor.price || 0;
  const shareText = `Check out ${vendor.title} on Evencers — starting at ₹${Number(startPrice).toLocaleString()}`;

  const platforms = [
    {
      name: "WhatsApp", color: "#25D366", bg: "rgba(37,211,102,0.08)", border: "rgba(37,211,102,0.22)",
      href: `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`,
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
    },
    {
      name: "Twitter / X", color: "#000000", bg: "rgba(0,0,0,0.05)", border: "rgba(0,0,0,0.12)",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    },
    {
      name: "Facebook", color: "#1877F2", bg: "rgba(24,119,242,0.07)", border: "rgba(24,119,242,0.18)",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    },
    {
      name: "Telegram", color: "#26A5E4", bg: "rgba(38,165,228,0.07)", border: "rgba(38,165,228,0.18)",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
    },
  ];

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); }
    catch { const el = document.createElement("textarea"); el.value = shareUrl; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <style>{shareModalStyles}</style>
      <div className="vsm-backdrop" onClick={onClose} />
      <div className="vsm-modal">
        <button className="vsm-close" onClick={onClose}>✕</button>
        <div className="vsm-header">
          <h3 className="vsm-title">Share this Service</h3>
          <p className="vsm-subtitle">Spread the word about <strong>{vendor.title}</strong></p>
        </div>
        <div className="vsm-platforms">
          {platforms.map((p) => (
            <button key={p.name} className="vsm-platform"
              style={{ "--pc": p.color, "--pbg": p.bg, "--pborder": p.border }}
              onClick={() => window.open(p.href, "_blank", "noopener,noreferrer,width=620,height=520")}>
              <span style={{ color: p.color }}>{p.icon}</span>
              <span className="vsm-p-name">{p.name}</span>
            </button>
          ))}
        </div>
        <div className="vsm-copy">
          <span className="vsm-copy-text">{shareUrl}</span>
          <button className={`vsm-copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Custom Date Picker ────────────────────────────────────────────────────────
function CustomDatePicker({ value, onChange, hasError }) {
  const [open, setOpen]           = useState(false);
  const [viewYear, setViewYear]   = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [showYearGrid, setShowYearGrid] = useState(false);
  const [popupStyle, setPopupStyle]     = useState({});
  const ref     = useRef(null);
  const trigRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open || !trigRef.current) return;
    const rect = trigRef.current.getBoundingClientRect();
    const popW = Math.min(288, window.innerWidth - 24);
    const popH = 320;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    let top = (spaceBelow >= popH || spaceBelow >= spaceAbove)
      ? rect.bottom + window.scrollY + 6
      : rect.top + window.scrollY - popH - 6;
    let left = rect.left + window.scrollX;
    if (left + popW > window.innerWidth - 12) left = window.innerWidth - popW - 12;
    if (left < 12) left = 12;
    setPopupStyle({ position: "fixed", top: rect.bottom + 6, left, width: popW,
      ...(spaceBelow < popH && spaceAbove > spaceBelow ? { top: rect.top - popH - 6 } : {}) });
  }, [open]);

  const today   = new Date(); today.setHours(0,0,0,0);
  const minDate = new Date(today.getTime() + 86400000);
  const selected = value ? new Date(value + "T00:00:00") : null;
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, type: "prev" });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, type: "cur" });
  for (let i = 1; i <= 42 - cells.length; i++) cells.push({ day: i, type: "next" });

  const handleDayClick = (cell) => {
    if (cell.type !== "cur") return;
    const d = new Date(viewYear, viewMonth, cell.day);
    if (d < minDate) return;
    onChange(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(cell.day).padStart(2,"0")}`);
    setOpen(false);
  };

  const isDisabled = (cell) => cell.type !== "cur" || new Date(viewYear, viewMonth, cell.day) < minDate;
  const isSelected = (cell) => selected && cell.type === "cur" && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === cell.day;
  const isToday    = (cell) => cell.type === "cur" && today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === cell.day;

  const displayValue = selected
    ? selected.toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })
    : "Select your event date";

  const yearBase = Math.floor(viewYear / 12) * 12;
  const years = Array.from({length:12}, (_,i) => yearBase + i);

  return (
    <div className="cdp-root" ref={ref}>
      <button ref={trigRef} type="button" className={`cdp-trigger ${hasError ? "error" : ""} ${open ? "open" : ""}`} onClick={() => setOpen(o => !o)}>
        <span className="cdp-icon">🗓</span>
        <span className={`cdp-val ${!selected ? "placeholder" : ""}`}>{displayValue}</span>
        <span className="cdp-arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="cdp-pop" style={popupStyle}>
          <div className="cdp-header">
            <button className="cdp-nav" onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y=>y-1)) : setViewMonth(m=>m-1)}>‹</button>
            <button className="cdp-month-btn" onClick={() => setShowYearGrid(g=>!g)}>
              {MONTHS[viewMonth].slice(0,3)} {viewYear} <span className="cdp-chevron">{showYearGrid?"▲":"▼"}</span>
            </button>
            <button className="cdp-nav" onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y=>y+1)) : setViewMonth(m=>m+1)}>›</button>
          </div>
          {showYearGrid ? (
            <div className="cdp-year-grid">
              <div className="cdp-yr-nav-row">
                <button className="cdp-yr-nav" onClick={() => setViewYear(y=>y-12)}>‹</button>
                <span className="cdp-yr-range">{yearBase}–{yearBase+11}</span>
                <button className="cdp-yr-nav" onClick={() => setViewYear(y=>y+12)}>›</button>
              </div>
              <div className="cdp-yr-cells">
                {years.map(y => <button key={y} className={`cdp-yr-cell ${y===viewYear?"active":""}`} onClick={() => { setViewYear(y); setShowYearGrid(false); }}>{y}</button>)}
              </div>
            </div>
          ) : (
            <>
              <div className="cdp-daynames">{DAYS.map(d=><span key={d}>{d}</span>)}</div>
              <div className="cdp-grid">
                {cells.map((cell,idx) => (
                  <button key={idx}
                    className={["cdp-cell", cell.type!=="cur"?"other":"", isDisabled(cell)?"disabled":"", isSelected(cell)?"selected":"", isToday(cell)?"today":""].filter(Boolean).join(" ")}
                    onClick={() => handleDayClick(cell)} disabled={isDisabled(cell)}>
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

// ── Payment Plan Selector ─────────────────────────────────────────────────────
function PaymentPlanSelector({ price, selectedPlan, onChange }) {
  const plans = [
    {
      id: "25", label: "Book Date", badge: "25% Now",
      color: "#2d6a4f", bgColor: "rgba(45,106,79,0.07)", borderColor: "rgba(45,106,79,0.3)",
      amountNow: Math.round(price * 0.25),
      description: "Pay 25% to lock your date",
      steps: [
        { label: "Now",           detail: `₹${Math.round(price * 0.25).toLocaleString("en-IN")} (25%)` },
        { label: "3 days before", detail: `₹${Math.round(price * 0.50).toLocaleString("en-IN")} (50%) — reminder sent daily` },
        { label: "After event",   detail: `₹${Math.round(price * 0.25).toLocaleString("en-IN")} (25%)` },
      ],
    },
    {
      id: "75", label: "Partial Pay", badge: "75% Now",
      color: "#b87333", bgColor: "rgba(184,115,51,0.07)", borderColor: "rgba(184,115,51,0.3)",
      amountNow: Math.round(price * 0.75),
      description: "Pay 75% now, rest after event",
      steps: [
        { label: "Now",         detail: `₹${Math.round(price * 0.75).toLocaleString("en-IN")} (75%)` },
        { label: "After event", detail: `₹${Math.round(price * 0.25).toLocaleString("en-IN")} (25%)` },
      ],
    },
    {
      id: "100", label: "Full Pay", badge: "5% Off",
      color: "#c9a84c", bgColor: "rgba(201,168,76,0.07)", borderColor: "rgba(201,168,76,0.3)",
      amountNow: Math.round(price * 0.95),
      description: "Pay full amount, get 5% discount",
      steps: [
        { label: "Now", detail: `₹${Math.round(price * 0.95).toLocaleString("en-IN")} (save ₹${Math.round(price * 0.05).toLocaleString("en-IN")})` },
      ],
    },
  ];

  return (
    <div className="pps-root">
      <label className="vd-label">Choose Payment Plan</label>
      <div className="pps-cards">
        {plans.map((plan) => {
          const isActive = selectedPlan === plan.id;
          return (
            <button
              key={plan.id}
              className={`pps-card ${isActive ? "active" : ""}`}
              style={{ "--plan-color": plan.color, "--plan-bg": plan.bgColor, "--plan-border": plan.borderColor }}
              onClick={() => onChange(plan.id)}
              type="button"
            >
              <div className="pps-top">
                <span className="pps-plan-label">{plan.label}</span>
                <span className="pps-badge" style={{ background: plan.bgColor, color: plan.color, border: `1px solid ${plan.borderColor}` }}>{plan.badge}</span>
              </div>
              <div className="pps-amount-now">
                ₹{plan.amountNow.toLocaleString("en-IN")}
                <span className="pps-amount-label"> due now</span>
              </div>
              <p className="pps-desc">{plan.description}</p>
              {isActive && (
                <div className="pps-steps">
                  {plan.steps.map((step, i) => (
                    <div key={i} className="pps-step">
                      <div className="pps-step-dot" style={{ background: plan.color }} />
                      <div className="pps-step-info">
                        <span className="pps-step-label">{step.label}</span>
                        <span className="pps-step-detail">{step.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isActive && <span className="pps-active-bar" style={{ background: plan.color }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Time Slot Selector (Decor) ────────────────────────────────────────────────
function TimeSlotSelector({ slots, selectedSlot, onChange }) {
  if (!slots || slots.length === 0) return null;
  return (
    <div className="tss-root">
      <label className="vd-label">Select Time Slot</label>
      <div className="tss-grid">
        {slots.map((slot, i) => (
          <button
            key={i}
            type="button"
            className={`tss-btn ${selectedSlot === slot ? "active" : ""}`}
            onClick={() => onChange(slot)}
          >
            <span className="tss-check">{selectedSlot === slot ? "✓" : ""}</span>
            <span className="tss-label">{slot}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor,          setVendor]          = useState(null);
  const [selectedDate,    setSelectedDate]    = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedSlot,    setSelectedSlot]    = useState("");   // decor
  const [selectedPlan,    setSelectedPlan]    = useState("100");
  const [loading,         setLoading]         = useState(false);
  const [dateWarning,     setDateWarning]     = useState("");

  const [showVendorModal,  setShowVendorModal]  = useState(false);
  const [showLoginModal,   setShowLoginModal]   = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showWaitModal,    setShowWaitModal]    = useState(false);
  const [showShareModal,   setShowShareModal]   = useState(false);

  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const isVendor = user?.role === "vendor";

  useEffect(() => {
    const controller = new AbortController();
    API.get(`/vendors/single/${id}`, { signal: controller.signal })
      .then((res) => {
        const v = res.data;
        setVendor(v);
        if (v?.packages?.length > 0) setSelectedPackage(0);
        // Auto-select first time slot for decor
        if (v?.serviceType === "decor" && v?.timeSlots?.length > 0) {
          setSelectedSlot(v.timeSlots[0]);
        }
      })
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED")
          console.error("Failed to load vendor:", err);
      });
    return () => controller.abort();
  }, [id]);

  // ── Derived: is this a decor service? ────────────────────────────────────
  const isDecor = vendor?.serviceType === "decor";

  // ── Location display helper ───────────────────────────────────────────────
  // Support both new `locations` array and old `location` string
  const getLocationDisplay = (v) => {
    if (!v) return "";
    if (Array.isArray(v.locations) && v.locations.length > 0) {
      return v.locations.join(" · ");
    }
    return v.location || "";
  };

  // ── Price for current selection ───────────────────────────────────────────
  const currentPrice = isDecor
    ? (vendor?.price || 0)
    : (vendor?.packages?.[selectedPackage]?.price || 0);

  const getButtonAmount = () => {
    if (!currentPrice) return 0;
    if (selectedPlan === "25")  return Math.round(currentPrice * 0.25);
    if (selectedPlan === "75")  return Math.round(currentPrice * 0.75);
    return Math.round(currentPrice * 0.95);
  };

  const getPlanNote = () => {
    if (selectedPlan === "25")  return "Secure your date · Pay remaining 75% in installments";
    if (selectedPlan === "75")  return "75% now · 25% after event confirmation";
    return "Best value · 5% discount applied · One-time payment";
  };

  // ── Reserve click handler ─────────────────────────────────────────────────
  const handleReserveClick = () => {
    if (isVendor) { setShowVendorModal(true); return; }
    const token = localStorage.getItem("token");
    if (!token)  { setShowLoginModal(true); return; }
    if (!selectedDate) { setDateWarning("Please select a date to continue."); return; }
    const picked = new Date(selectedDate);
    if (isNaN(picked.getTime()))     { setDateWarning("Please select a valid date."); return; }
    if (picked.getFullYear() > 2100) { setDateWarning("Please select a realistic date."); return; }
    if (isDecor && !selectedSlot)    { setDateWarning("Please select a time slot."); return; }
    setDateWarning("");
    setShowDetailsModal(true);
  };

  const handleDetailsConfirm = async (userDetails) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const pkg = !isDecor ? vendor.packages[selectedPackage] : null;

      await API.post(
        "/bookings",
        {
          vendorId:     vendor._id,
          date:         selectedDate,
          // Package-based (photography etc.)
          packageName:  pkg?.name  || null,
          packagePrice: pkg?.price || null,
          // Decor-specific
          timeSlot:     isDecor ? selectedSlot : null,
          price:        isDecor ? vendor.price  : null,
          userDetails,
          paymentPlan:  selectedPlan,
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
        <div className="vd-loader"><div className="vd-spinner" /><p>Curating your experience…</p></div>
      </>
    );
  }

  const pkg = !isDecor ? vendor.packages?.[selectedPackage] : null;

  return (
    <>
      <style>{styles}</style>
      <style>{shareModalStyles}</style>
      <Navbar />

      {showDetailsModal && (
        <BookingDetailsModal
          // For non-decor pass the package; for decor pass a synthetic "pkg" object
          pkg={isDecor
            ? { name: selectedSlot || "Decor Service", price: vendor.price }
            : pkg
          }
          vendor={vendor}
          date={selectedDate}
          paymentPlan={selectedPlan}
          isDecor={isDecor}
          selectedSlot={selectedSlot}
          onConfirm={handleDetailsConfirm}
          onClose={() => setShowDetailsModal(false)}
          loading={loading}
        />
      )}
      {showWaitModal && (
        <BookingWaitModal
          vendor={vendor}
          paymentPlan={selectedPlan}
          onClose={() => { setShowWaitModal(false); navigate("/my-bookings"); }}
        />
      )}
      {showShareModal && (
        <ShareModal vendor={vendor} onClose={() => setShowShareModal(false)} />
      )}

      {/* Login modal */}
      {showLoginModal && (
        <div className="vd-modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="vd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vd-modal-icon-ring"><Logo /></div>
            <h3 className="vd-modal-title">Sign in to Continue</h3>
            <p className="vd-modal-body">You need an account to reserve this vendor. Sign in or create a free account — it only takes a minute.</p>
            <div className="vd-modal-actions">
              <button className="vd-modal-cancel"   onClick={() => setShowLoginModal(false)}>Maybe Later</button>
              <button className="vd-modal-login"    onClick={() => navigate("/login",    { state: { from: `/vendor/${id}` } })}>Sign In</button>
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
            <p className="vd-modal-body">You are currently logged in as a <strong>Vendor</strong>. To book services, you need a client account.</p>
            <div className="vd-modal-actions">
              <button className="vd-modal-cancel"   onClick={() => setShowVendorModal(false)}>Stay as Vendor</button>
              <button className="vd-modal-register" onClick={() => { setShowVendorModal(false); navigate("/register", { state: { role: "user" } }); }}>Yes, Register as Client</button>
            </div>
          </div>
        </div>
      )}

      <div className="vd-root">
        {/* ── Hero ── */}
        <div className="vd-hero">
          <img src={vendor.images?.[0] || "/placeholder.jpg"} alt={vendor.title} className="vd-hero-img" />
          <div className="vd-hero-overlay" />
          <div className="vd-hero-content">
            {/* ── Location: support array and string ── */}
            <span className="vd-tag">
              📍 {getLocationDisplay(vendor) || "India"}
            </span>
            <h1 className="vd-title">{vendor.title}</h1>
            <div className="vd-badge-row">
              <span className="vd-badge">⭐ Premium Vendor</span>
              <span className="vd-badge">✓ Verified</span>
              {isDecor ? (
                <span className="vd-badge">🎨 Decor Service</span>
              ) : (
                <span className="vd-badge">📦 {vendor.packages?.length} {vendor.packages?.length === 1 ? "Package" : "Packages"}</span>
              )}
              <button className="vd-share-badge" onClick={() => setShowShareModal(true)} title="Share this service">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="vd-body">

          {/* ── Sidebar: packages (non-decor) or decor info ── */}
          <aside className="vd-sidebar">
            {isDecor ? (
              <>
                <h2 className="vd-section-label">Service Details</h2>
                <div className="vd-decor-info-card">
                  <div className="vd-decor-emoji">🎨</div>
                  <h3 className="vd-decor-name">{vendor.title}</h3>
                  {vendor.description && (
                    <p className="vd-decor-desc">{vendor.description}</p>
                  )}
                  <div className="vd-decor-price-row">
                    <span className="vd-decor-price-label">Service Price</span>
                    <span className="vd-decor-price">₹{vendor.price?.toLocaleString("en-IN") || "—"}</span>
                  </div>
                  {/* Location pills */}
                  {(Array.isArray(vendor.locations) && vendor.locations.length > 0) && (
                    <div className="vd-decor-locs">
                      <span className="vd-decor-locs-label">Available in</span>
                      <div className="vd-decor-loc-pills">
                        {vendor.locations.map((loc) => (
                          <span key={loc} className="vd-decor-loc-pill">📍 {loc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Time slots list */}
                  {vendor.timeSlots?.length > 0 && (
                    <div className="vd-decor-slots-preview">
                      <span className="vd-decor-locs-label">Available Slots</span>
                      {vendor.timeSlots.map((s) => (
                        <span key={s} className="vd-decor-slot-tag">⏰ {s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="vd-section-label">Choose a Package</h2>
                <div className="vd-pkg-list">
                  {vendor.packages.map((p, i) => (
                    <button key={i} className={`vd-pkg-card ${selectedPackage === i ? "active" : ""}`} onClick={() => setSelectedPackage(i)}>
                      <div className="vd-pkg-top">
                        <span className="vd-pkg-name">{p.name}</span>
                        <span className="vd-pkg-price">₹{p.price?.toLocaleString()}</span>
                      </div>
                      <ul className="vd-pkg-desc">{p.features?.map((f, fi) => <li key={fi}>✔ {f}</li>)}</ul>
                      {selectedPackage === i && <span className="vd-pkg-selected-dot" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </aside>

          {/* ── Main booking panel ── */}
          <main className="vd-main">
            <div className="vd-booking-panel">
              {/* Panel header */}
              <div className="vd-panel-header">
                <h3 className="vd-panel-title">
                  {isDecor ? vendor.title : (pkg?.name || "—")}
                </h3>
                <div className="vd-panel-right">
                  <div className="vd-panel-price">
                    <span className="vd-price-label">
                      {isDecor ? "Fixed Price" : "Starting at"}
                    </span>
                    <span className="vd-price-value">
                      ₹{currentPrice?.toLocaleString("en-IN") || "—"}
                    </span>
                  </div>
                  <button className="vd-panel-share-btn" onClick={() => setShowShareModal(true)} title="Share">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </button>
                </div>
              </div>

              {/* Features list (non-decor) */}
              {!isDecor && pkg?.features?.length > 0 && (
                <ul className="vd-panel-desc">
                  {pkg.features.map((f, i) => <li key={i}>✔ {f}</li>)}
                </ul>
              )}

              {/* Location pills in booking panel */}
              {Array.isArray(vendor.locations) && vendor.locations.length > 0 && (
                <div className="vd-panel-locs">
                  {vendor.locations.map((loc) => (
                    <span key={loc} className="vd-panel-loc-pill">📍 {loc}</span>
                  ))}
                </div>
              )}

              <div className="vd-divider" />

              {/* ── Time slot selector (decor only) ── */}
              {isDecor && vendor.timeSlots?.length > 0 && (
                <>
                  <TimeSlotSelector
                    slots={vendor.timeSlots}
                    selectedSlot={selectedSlot}
                    onChange={setSelectedSlot}
                  />
                  <div className="vd-divider" />
                </>
              )}

              {/* ── Payment plan ── */}
              <PaymentPlanSelector
                price={currentPrice}
                selectedPlan={selectedPlan}
                onChange={setSelectedPlan}
              />

              <div className="vd-divider" />

              {/* ── Date picker ── */}
              <div className="vd-date-section">
                <label className="vd-label">Select Your Date</label>
                <CustomDatePicker
                  value={selectedDate}
                  onChange={(iso) => { setSelectedDate(iso); setDateWarning(""); }}
                  hasError={!!dateWarning}
                />
                {dateWarning && (
                  <p className="vd-date-warning"><span className="vd-warn-icon">⚠</span> {dateWarning}</p>
                )}
              </div>

              {/* ── Reserve button ── */}
              <button
                className={`vd-book-btn ${loading ? "loading" : ""} plan-${selectedPlan}`}
                onClick={handleReserveClick}
                disabled={loading}
              >
                {isVendor ? (
                  "It seems you are a Vendor — Explore as a Client"
                ) : loading ? (
                  <><span className="vd-btn-spinner" /> Processing…</>
                ) : (
                  <>
                    {selectedPlan === "25"  && `Book Date — Pay ₹${getButtonAmount().toLocaleString("en-IN")} Now`}
                    {selectedPlan === "75"  && `Pay 75% — ₹${getButtonAmount().toLocaleString("en-IN")} Now`}
                    {selectedPlan === "100" && `Pay Full — ₹${getButtonAmount().toLocaleString("en-IN")} (5% off)`}
                  </>
                )}
              </button>

              <div className="vd-bottom-row">
                <p className="vd-note">{getPlanNote()}</p>
                <button className="vd-share-text-btn" onClick={() => setShowShareModal(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Share
                </button>
              </div>
            </div>

            {/* ── Gallery ── */}
            {vendor.images?.length > 1 && (
              <div className="vd-gallery">
                <h2 className="vd-section-label">Gallery</h2>
                <div className="vd-gallery-grid">
                  {vendor.images.map((img, i) => (
                    <div key={i} className="vd-gallery-item"><img src={img} alt={`gallery-${i}`} /></div>
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

// ── Styles ────────────────────────────────────────────────────────────────────
const shareModalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;500&display=swap');
  .vsm-backdrop { position:fixed;inset:0;background:rgba(14,12,10,0.62);backdrop-filter:blur(7px);z-index:1100; }
  .vsm-modal { position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1101;background:#faf7f2;border:1px solid rgba(201,168,76,0.28);border-radius:22px;padding:40px 36px 32px;width:min(460px,92vw);box-shadow:0 40px 100px rgba(14,12,10,0.24); }
  .vsm-close { position:absolute;top:18px;right:20px;background:none;border:none;font-size:13px;color:#a09890;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center; }
  .vsm-header { text-align:center;margin-bottom:24px; }
  .vsm-title { font-family:'Cormorant Garamond',serif;font-size:1.55rem;font-weight:600;color:#0e0c0a;margin:0 0 7px; }
  .vsm-subtitle { font-family:'DM Sans',sans-serif;font-size:13px;color:#7a7265;margin:0; }
  .vsm-platforms { display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:22px; }
  .vsm-platform { display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 6px 11px;background:var(--pbg);border:1px solid var(--pborder);border-radius:12px;cursor:pointer;transition:all 0.2s; }
  .vsm-platform:hover { transform:translateY(-4px);border-color:var(--pc); }
  .vsm-p-name { font-size:9.5px;color:#7a7265;text-align:center; }
  .vsm-copy { display:flex;align-items:center;gap:8px;background:rgba(14,12,10,0.035);border:1px solid rgba(201,168,76,0.22);border-radius:10px;padding:5px 5px 5px 13px; }
  .vsm-copy-text { font-size:11.5px;color:#7a7265;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .vsm-copy-btn { padding:9px 18px;background:#0e0c0a;border:none;border-radius:7px;font-size:12px;font-weight:500;color:white;cursor:pointer;transition:all 0.22s;white-space:nowrap; }
  .vsm-copy-btn:hover { background:#c9a84c;color:#0e0c0a; }
  .vsm-copy-btn.copied { background:#2d6a4f; }
`;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink:#0e0c0a; --cream:#f5f0e8; --gold:#c9a84c;
    --gold-light:#e8d5a3; --muted:#7a7265;
    --border:rgba(201,168,76,0.2); --surface:#faf7f2;
    --white:#ffffff; --success:#2d6a4f;
    --danger:#a93226; --danger-bg:#fdf0ef;
    --danger-border:rgba(169,50,38,0.25);
  }

  .vd-root { font-family:'DM Sans',sans-serif;background:var(--cream);min-height:100vh;color:var(--ink); }

  /* Modals */
  .vd-modal-backdrop { position:fixed;inset:0;background:rgba(14,12,10,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px; }
  .vd-modal { background:var(--white);border-radius:16px;padding:44px 40px 36px;max-width:420px;width:100%;text-align:center;border:1px solid var(--border);box-shadow:0 24px 64px rgba(14,12,10,0.18); }
  .vd-modal-icon-ring { width:60px;height:60px;background:linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05));border:1.5px solid var(--border);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--gold);margin:0 auto 20px; }
  .vd-modal-icon { font-size:28px;margin-bottom:14px;display:block;color:var(--gold); }
  .vd-modal-title { font-family:'Cormorant Garamond',serif;font-size:1.65rem;font-weight:600;color:var(--ink);margin:0 0 12px;font-style:italic; }
  .vd-modal-body { font-size:13.5px;color:var(--muted);line-height:1.7;margin:0 0 28px; }
  .vd-modal-body strong { color:var(--ink);font-weight:500; }
  .vd-modal-actions { display:flex;gap:10px;flex-wrap:wrap; }
  .vd-modal-cancel   { flex:1;min-width:100px;padding:13px 16px;background:transparent;border:1px solid var(--border);border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--muted);cursor:pointer; }
  .vd-modal-login    { flex:1;min-width:80px;padding:13px 16px;background:var(--surface);border:1px solid var(--border);border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--ink);cursor:pointer; }
  .vd-modal-register { flex:1.4;min-width:120px;padding:13px 16px;background:var(--ink);border:none;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--white);cursor:pointer;transition:all 0.2s; }
  .vd-modal-register:hover { background:var(--gold);color:var(--ink); }
  .vd-modal-note { font-size:11px;color:var(--muted);margin-top:18px;letter-spacing:0.05em; }

  /* Hero */
  .vd-hero { position:relative;height:520px;overflow:hidden; }
  .vd-hero-img { width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.03);transition:transform 8s ease; }
  .vd-hero:hover .vd-hero-img { transform:scale(1); }
  .vd-hero-overlay { position:absolute;inset:0;background:linear-gradient(to top,rgba(14,12,10,0.85) 0%,rgba(14,12,10,0.2) 50%,transparent 100%); }
  .vd-hero-content { position:absolute;bottom:0;left:0;right:0;padding:48px 56px; }
  .vd-tag { font-size:12px;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;color:var(--gold-light);display:block;margin-bottom:12px; }
  .vd-title { font-family:'Cormorant Garamond',serif;font-size:clamp(2.4rem,5vw,3.6rem);font-weight:300;color:var(--white);line-height:1.1;margin:0 0 20px; }
  .vd-badge-row { display:flex;gap:10px;flex-wrap:wrap;align-items:center; }
  .vd-badge { display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--gold);border:1px solid rgba(201,168,76,0.5);padding:6px 14px;border-radius:20px;backdrop-filter:blur(6px);background:rgba(201,168,76,0.1); }
  .vd-share-badge { display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--white);border:1px solid rgba(255,255,255,0.4);padding:6px 14px;border-radius:20px;backdrop-filter:blur(6px);background:rgba(255,255,255,0.12);cursor:pointer;transition:all 0.22s; }
  .vd-share-badge:hover { background:rgba(201,168,76,0.25);border-color:var(--gold);color:var(--gold); }

  /* Body */
  .vd-body { display:grid;grid-template-columns:340px 1fr;gap:0;max-width:1200px;margin:0 auto;padding:48px 32px;align-items:start; }
  .vd-sidebar { padding-right:40px; }
  .vd-section-label { font-size:10px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);margin:0 0 20px; }

  /* ── Decor sidebar card ── */
  .vd-decor-info-card { background:var(--white);border:1px solid var(--border);border-radius:12px;padding:24px;box-shadow:0 4px 20px rgba(14,12,10,0.05); }
  .vd-decor-emoji { font-size:2.2rem;margin-bottom:12px;display:block; }
  .vd-decor-name { font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:600;color:var(--ink);margin:0 0 10px; }
  .vd-decor-desc { font-size:13px;color:var(--muted);line-height:1.6;margin:0 0 16px; }
  .vd-decor-price-row { display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:14px; }
  .vd-decor-price-label { font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted); }
  .vd-decor-price { font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:600;color:var(--gold); }
  .vd-decor-locs { margin-bottom:14px; }
  .vd-decor-locs-label { font-size:10px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px; }
  .vd-decor-loc-pills { display:flex;flex-wrap:wrap;gap:6px; }
  .vd-decor-loc-pill { font-size:11.5px;color:var(--ink);background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:4px 10px; }
  .vd-decor-slots-preview { display:flex;flex-direction:column;gap:6px; }
  .vd-decor-slot-tag { font-size:12px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px 10px; }

  /* Packages */
  .vd-pkg-list { display:flex;flex-direction:column;gap:12px; }
  .vd-pkg-card { position:relative;background:var(--white);border:1px solid var(--border);border-radius:8px;padding:20px;text-align:left;cursor:pointer;transition:all 0.25s;overflow:hidden; }
  .vd-pkg-card:hover { border-color:var(--gold);transform:translateX(4px);box-shadow:0 4px 20px rgba(201,168,76,0.12); }
  .vd-pkg-card.active { border-color:var(--gold);background:linear-gradient(135deg,#faf7f0 0%,#fff8e8 100%);box-shadow:0 6px 24px rgba(201,168,76,0.18); }
  .vd-pkg-top { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px; }
  .vd-pkg-name { font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:600;color:var(--ink); }
  .vd-pkg-price { font-size:13px;font-weight:500;color:var(--gold);white-space:nowrap; }
  .vd-pkg-desc { font-size:12.5px;color:var(--muted);line-height:1.5;margin:0;padding-left:0;list-style:none; }
  .vd-pkg-selected-dot { position:absolute;top:0;left:0;width:3px;height:100%;background:var(--gold);border-radius:0 2px 2px 0; }

  /* Main */
  .vd-main { display:flex;flex-direction:column;gap:40px; }
  .vd-booking-panel { background:var(--white);border:1px solid var(--border);border-radius:12px;padding:36px;box-shadow:0 8px 40px rgba(14,12,10,0.06); }
  .vd-panel-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px; }
  .vd-panel-title { font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:400;margin:0;color:var(--ink);font-style:italic; }
  .vd-panel-right { display:flex;align-items:flex-start;gap:10px; }
  .vd-panel-price { text-align:right; }
  .vd-price-label { display:block;font-size:11px;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:2px; }
  .vd-price-value { font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:600;color:var(--ink); }
  .vd-panel-share-btn { width:36px;height:36px;background:var(--surface);border:1px solid var(--border);border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--muted);transition:all 0.2s;flex-shrink:0;margin-top:4px; }
  .vd-panel-share-btn:hover { border-color:var(--gold);color:var(--gold); }
  .vd-panel-desc { font-size:13.5px;color:var(--muted);line-height:1.7;margin:0 0 16px;padding-left:0;list-style:none; }
  .vd-panel-locs { display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px; }
  .vd-panel-loc-pill { font-size:11.5px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:4px 10px; }
  .vd-divider { height:1px;background:var(--border);margin:24px 0; }

  /* ── Time Slot Selector ── */
  .tss-root { margin-bottom:4px; }
  .tss-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px; }
  .tss-btn { display:flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid var(--border);border-radius:8px;background:var(--surface);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--muted);transition:all 0.2s;text-align:left;min-height:48px; }
  .tss-btn:hover { border-color:var(--gold);color:var(--ink); }
  .tss-btn.active { border-color:var(--gold);background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.03));color:var(--ink);font-weight:500;box-shadow:0 2px 10px rgba(201,168,76,0.12); }
  .tss-check { width:18px;height:18px;border-radius:4px;border:1.5px solid rgba(201,168,76,0.4);background:transparent;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--gold);flex-shrink:0;transition:all 0.2s; }
  .tss-btn.active .tss-check { background:var(--gold);border-color:var(--gold);color:white;font-weight:700; }
  .tss-label { flex:1; }

  /* ── Payment Plan Selector ── */
  .pps-root { margin-bottom:4px; }
  .pps-cards { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px; }
  .pps-card { position:relative;overflow:hidden;background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:16px 14px;text-align:left;cursor:pointer;transition:all 0.25s ease; }
  .pps-card:hover { border-color:var(--plan-border,var(--gold));box-shadow:0 4px 16px rgba(14,12,10,0.08); }
  .pps-card.active { background:var(--plan-bg,rgba(201,168,76,0.07));border-color:var(--plan-color,var(--gold));box-shadow:0 6px 24px rgba(14,12,10,0.10); }
  .pps-top { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px; }
  .pps-plan-label { font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:600;color:var(--ink); }
  .pps-badge { font-size:9px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:3px 7px;border-radius:20px;white-space:nowrap; }
  .pps-amount-now { font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:600;color:var(--ink);margin-bottom:4px; }
  .pps-amount-label { font-family:'DM Sans',sans-serif;font-size:11px;font-weight:400;color:var(--muted); }
  .pps-desc { font-size:11px;color:var(--muted);line-height:1.4;margin:0; }
  .pps-steps { margin-top:12px;display:flex;flex-direction:column;gap:0;border-top:1px solid rgba(14,12,10,0.06);padding-top:10px; }
  .pps-step { display:flex;align-items:flex-start;gap:8px;padding:5px 0; }
  .pps-step-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:4px; }
  .pps-step-info { display:flex;flex-direction:column;gap:1px; }
  .pps-step-label { font-size:10px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:var(--muted); }
  .pps-step-detail { font-size:11.5px;color:var(--ink);font-weight:500; }
  .pps-active-bar { position:absolute;bottom:0;left:0;right:0;height:3px;border-radius:0 0 8px 8px; }

  /* Date */
  .vd-date-section { margin-bottom:28px; }
  .vd-label { display:block;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted);margin-bottom:10px; }
  .vd-date-warning { display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--danger);margin:8px 0 0;padding:9px 13px;background:var(--danger-bg);border:1px solid var(--danger-border);border-radius:5px; }
  .vd-warn-icon { font-size:13px;flex-shrink:0; }

  /* Reserve button */
  .vd-book-btn { width:100%;padding:17px 24px;background:var(--gold);color:var(--ink);border:none;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;letter-spacing:0.05em;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:14px; }
  .vd-book-btn:hover:not(:disabled) { background:var(--ink);color:var(--white);transform:translateY(-1px);box-shadow:0 8px 24px rgba(14,12,10,0.2); }
  .vd-book-btn.plan-25 { background:var(--success);color:#fff; }
  .vd-book-btn.plan-25:hover:not(:disabled) { background:#1e4d38;color:#fff; }
  .vd-book-btn.plan-75 { background:#b87333;color:#fff; }
  .vd-book-btn.plan-75:hover:not(:disabled) { background:#8c5726;color:#fff; }
  .vd-book-btn.loading { opacity:0.7;pointer-events:none; }
  .vd-btn-spinner { width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block; }

  .vd-bottom-row { display:flex;align-items:center;justify-content:space-between;gap:10px; }
  .vd-note { font-size:11.5px;color:var(--muted);margin:0;flex:1; }
  .vd-share-text-btn { display:flex;align-items:center;gap:5px;padding:6px 12px;background:none;border:1px solid var(--border);border-radius:20px;font-family:'DM Sans',sans-serif;font-size:11.5px;font-weight:500;color:var(--muted);cursor:pointer;transition:all 0.2s;white-space:nowrap;flex-shrink:0; }
  .vd-share-text-btn:hover { border-color:var(--gold);color:var(--gold); }

  /* Gallery */
  .vd-gallery-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:16px; }
  .vd-gallery-item { aspect-ratio:4/3;border-radius:6px;overflow:hidden;border:1px solid var(--border); }
  .vd-gallery-item img { width:100%;height:100%;object-fit:cover;transition:transform 0.4s; }
  .vd-gallery-item:hover img { transform:scale(1.06); }

  .vd-loader { min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:var(--muted);font-size:13px;letter-spacing:0.1em; }
  .vd-spinner { width:36px;height:36px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin 0.9s linear infinite; }

  /* Date picker */
  .cdp-root { position:relative;width:100%; }
  .cdp-trigger { width:100%;display:flex;align-items:center;gap:9px;border:1px solid var(--border);border-radius:6px;padding:11px 14px;background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);cursor:pointer;transition:border-color 0.2s,box-shadow 0.2s;text-align:left; }
  .cdp-trigger:hover,.cdp-trigger.open { border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,168,76,0.08); }
  .cdp-trigger.error { border-color:var(--danger-border);background:var(--danger-bg); }
  .cdp-icon { font-size:14px;flex-shrink:0;line-height:1; }
  .cdp-val { flex:1;font-size:13px; }
  .cdp-val.placeholder { color:var(--muted); }
  .cdp-arrow { font-size:9px;color:var(--muted);flex-shrink:0; }
  .cdp-pop { z-index:9999;background:var(--white);border:1px solid rgba(201,168,76,0.22);border-radius:12px;overflow:hidden;box-shadow:0 12px 40px rgba(14,12,10,0.18); }
  .cdp-header { display:flex;align-items:center;justify-content:space-between;background:var(--ink);padding:9px 10px; }
  .cdp-nav { background:none;border:none;color:var(--gold);font-size:16px;cursor:pointer;width:28px;height:28px;border-radius:4px;display:flex;align-items:center;justify-content:center;transition:background 0.15s; }
  .cdp-nav:hover { background:rgba(201,168,76,0.15); }
  .cdp-month-btn { background:none;border:none;cursor:pointer;font-family:'Cormorant Garamond',serif;font-size:0.95rem;font-style:italic;color:var(--white);letter-spacing:0.04em;padding:3px 8px;border-radius:4px;display:flex;align-items:center;gap:5px; }
  .cdp-chevron { font-size:8px;color:var(--gold); }
  .cdp-daynames { display:grid;grid-template-columns:repeat(7,1fr);background:#1a1714;padding:4px 8px 5px; }
  .cdp-daynames span { font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--gold);text-align:center;line-height:2; }
  .cdp-grid { display:grid;grid-template-columns:repeat(7,1fr);padding:5px 8px 8px;gap:1px; }
  .cdp-cell { aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:11.5px;color:var(--ink);background:none;border:none;border-radius:50%;cursor:pointer;transition:background 0.12s,color 0.12s,transform 0.1s; }
  .cdp-cell:hover:not(.disabled):not(.other) { background:var(--cream);transform:scale(1.1); }
  .cdp-cell.other { color:rgba(14,12,10,0.18);cursor:default; }
  .cdp-cell.disabled { color:rgba(14,12,10,0.18)!important;cursor:not-allowed; }
  .cdp-cell.today:not(.selected) { color:var(--gold);font-weight:600;box-shadow:inset 0 0 0 1px rgba(201,168,76,0.45); }
  .cdp-cell.selected { background:var(--gold)!important;color:var(--ink)!important;font-weight:700; }
  .cdp-year-grid { padding:10px 12px; }
  .cdp-yr-nav-row { display:flex;align-items:center;justify-content:space-between;margin-bottom:8px; }
  .cdp-yr-range { font-size:11px;color:var(--muted); }
  .cdp-yr-nav { background:none;border:none;color:var(--gold);font-size:14px;cursor:pointer;width:26px;height:26px;border-radius:4px;display:flex;align-items:center;justify-content:center; }
  .cdp-yr-cells { display:grid;grid-template-columns:repeat(4,1fr);gap:4px; }
  .cdp-yr-cell { padding:7px 0;background:none;border:1px solid transparent;border-radius:5px;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--ink);cursor:pointer;text-align:center;transition:all 0.13s; }
  .cdp-yr-cell:hover { background:var(--surface);border-color:var(--border); }
  .cdp-yr-cell.active { background:var(--ink);color:var(--white);border-color:var(--ink); }

  @media(max-width:900px){
    .vd-body { grid-template-columns:1fr;padding:32px 20px; }
    .vd-sidebar { padding-right:0;margin-bottom:32px; }
    .vd-hero-content { padding:32px 24px; }
    .vd-hero { height:360px; }
    .pps-cards { grid-template-columns:1fr; }
    .tss-grid { grid-template-columns:1fr; }
  }
  @media(max-width:480px){
    .vd-hero { height:280px; }
    .vd-body { padding:20px 16px; }
    .vd-booking-panel { padding:24px 18px; }
  }

  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`;