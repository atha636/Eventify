import { useEffect, useState, useCallback, useRef } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import ServiceCard from "../components/ServiceCard";
import Logo from "../components/Logo";

// ─────────────────────────────────────────────────────────────
// SEO HELMET COMPONENT
// ─────────────────────────────────────────────────────────────
function DashboardHelmet({ vendorName, serviceCount, pendingCount }) {
  useEffect(() => {
    const prev = document.title;
    const title = vendorName
      ? `${vendorName} – Vendor Dashboard | Manage Bookings & Services`
      : "Vendor Dashboard | Manage Bookings & Services";
    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = `Manage your vendor profile, bookings, and services. ${serviceCount} service${serviceCount !== 1 ? "s" : ""} listed. ${pendingCount > 0 ? `${pendingCount} pending booking${pendingCount !== 1 ? "s" : ""} awaiting review.` : ""}`;

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.name = "robots";
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = "noindex, nofollow";

    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/vendor/dashboard";

    return () => {
      document.title = prev;
    };
  }, [vendorName, serviceCount, pendingCount]);

  return null;
}

// ─────────────────────────────────────────────────────────────
// STATUS / PAYMENT METADATA
// ─────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:   { label: "Pending",   color: "#c9a84c", bg: "rgba(201,168,76,0.1)",  border: "rgba(201,168,76,0.3)"  },
  approved:  { label: "Approved",  color: "#2d6a4f", bg: "rgba(45,106,79,0.1)",   border: "rgba(45,106,79,0.3)"   },
  rejected:  { label: "Rejected",  color: "#b85c5c", bg: "rgba(184,92,92,0.1)",   border: "rgba(184,92,92,0.3)"   },
  cancelled: { label: "Cancelled", color: "#999",    bg: "rgba(150,150,150,0.1)", border: "rgba(150,150,150,0.3)" },
};

const PAY_META = {
  paid:    { label: "Payment Successful", color: "#2d6a4f", bg: "rgba(45,106,79,0.08)",   border: "rgba(45,106,79,0.25)",   icon: "✓" },
  pending: { label: "Payment Pending",    color: "#c9a84c", bg: "rgba(201,168,76,0.08)",  border: "rgba(201,168,76,0.25)",  icon: "⏳" },
  failed:  { label: "Payment Failed",     color: "#b85c5c", bg: "rgba(184,92,92,0.08)",   border: "rgba(184,92,92,0.25)",   icon: "✕" },
};

// ─────────────────────────────────────────────────────────────
// SERVICE TYPE FILTER OPTIONS
// ─────────────────────────────────────────────────────────────
const SERVICE_TYPE_FILTERS = [
  { key: "all",         label: "All Services", emoji: "✦" },
  { key: "decor",       label: "Decor",        emoji: "🎨" },
  { key: "photography", label: "Photography",  emoji: "📸" },
  { key: "catering",    label: "Catering",     emoji: "🍽️" },
  { key: "music",       label: "Music & DJ",   emoji: "🎵" },
  { key: "florals",     label: "Florals",      emoji: "💐" },
  { key: "venues",      label: "Venues",       emoji: "🏛️" },
];

// ─────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────
function fmt(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
function fmtTime(date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────
function Toast({ message, type = "info", onDismiss }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  const icons  = { info: "ℹ", success: "✓", error: "✕", warning: "⚠" };
  const colors = {
    info:    { color: "#c9a84c", bg: "rgba(201,168,76,0.08)",  border: "rgba(201,168,76,0.28)" },
    success: { color: "#2d6a4f", bg: "rgba(45,106,79,0.08)",   border: "rgba(45,106,79,0.28)"  },
    error:   { color: "#b85c5c", bg: "rgba(184,92,92,0.08)",   border: "rgba(184,92,92,0.28)"  },
    warning: { color: "#c9a84c", bg: "rgba(201,168,76,0.08)",  border: "rgba(201,168,76,0.28)" },
  };
  const c = colors[type] || colors.info;

  return (
    <div className="toast-wrap" role="alert" aria-live="assertive" aria-atomic="true">
      <div className="toast" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        <span className="toast-icon" aria-hidden="true" style={{ color: c.color, background: `${c.color}18`, border: `1px solid ${c.color}33` }}>
          {icons[type]}
        </span>
        <span className="toast-msg">{message}</span>
        <button className="toast-close" onClick={onDismiss} aria-label="Dismiss notification">✕</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AVAILABILITY CALENDAR MODAL
// ─────────────────────────────────────────────────────────────
function AvailabilityCalendar({ services, onClose }) {
  const [selectedServiceId, setSelectedServiceId] = useState(
    services.length > 0 ? services[0]._id : null
  );
  const [availability, setAvailability] = useState({});
  const [viewYear,  setViewYear]  = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const firstFocusRef = useRef(null);

  useEffect(() => {
    firstFocusRef.current?.focus();
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!selectedServiceId) return;
    setLoading(true);
    API.get(`/vendors/${selectedServiceId}/availability`)
      .then((res) => {
        const map = {};
        (res.data || []).forEach((entry) => {
          const key = toKey(new Date(entry.date));
          map[key] = entry.available;
        });
        setAvailability(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedServiceId]);

  const toKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const today = toKey(new Date());

  const toggleDate = (key) => {
    if (key < today) return;
    setAvailability((prev) => {
      const current = prev[key];
      if (current === false) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: false };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedServiceId) return;
    setSaving(true);
    try {
      const dates = Object.entries(availability).map(([date, available]) => ({ date, available }));
      await API.put(`/vendors/${selectedServiceId}/availability`, { dates });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthName      = new Date(viewYear, viewMonth, 1).toLocaleString("en-IN", { month: "long" });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const unavailableThisMonth = Object.entries(availability).filter(([key, val]) =>
    val === false && key.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`)
  ).length;

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="ac-overlay" onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label="Availability Calendar">
      <div className="ac-modal">
        <button className="ac-close" onClick={onClose} ref={firstFocusRef} aria-label="Close calendar">✕</button>
        <div className="ac-header">
          <div className="ac-header-icon" aria-hidden="true">📅</div>
          <div>
            <h2 className="ac-title">Availability Calendar</h2>
            <p className="ac-subtitle">Tell clients when you're available to work</p>
          </div>
        </div>

        {services.length > 1 && (
          <div className="ac-service-select-wrap">
            <label className="ac-label" htmlFor="ac-service-select">Manage availability for</label>
            <select id="ac-service-select" className="ac-service-select" value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}>
              {services.map((s) => (<option key={s._id} value={s._id}>{s.title}</option>))}
            </select>
          </div>
        )}

        <div className="ac-legend" role="list" aria-label="Calendar legend">
          {[
            { cls: "ac-dot-available",   label: "Available",   sub: "(default)" },
            { cls: "ac-dot-unavailable", label: "Unavailable", sub: null },
            { cls: "ac-dot-past",        label: "Past date",   sub: null },
          ].map(({ cls, label, sub }) => (
            <div key={label} className="ac-legend-item" role="listitem">
              <span className={`ac-legend-dot ${cls}`} aria-hidden="true" />
              <span>{label}{sub && <span className="ac-legend-sub"> {sub}</span>}</span>
            </div>
          ))}
        </div>

        <p className="ac-instruction">
          Click any <strong>future date</strong> to toggle between available and unavailable.
        </p>

        {loading ? (
          <div className="ac-loading" aria-label="Loading calendar…" role="status">
            {[...Array(35)].map((_, i) => (<div key={i} className="ac-skeleton-day" style={{ animationDelay: `${i * 0.01}s` }} />))}
          </div>
        ) : (
          <>
            <div className="ac-month-nav" role="navigation" aria-label="Month navigation">
              <button className="ac-nav-btn" onClick={prevMonth} aria-label="Previous month">‹</button>
              <span className="ac-month-label" aria-live="polite">{monthName} {viewYear}</span>
              <button className="ac-nav-btn" onClick={nextMonth} aria-label="Next month">›</button>
            </div>
            <div className="ac-grid" role="grid" aria-label={`${monthName} ${viewYear} availability calendar`}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="ac-day-header" role="columnheader">{d}</div>
              ))}
              {[...Array(firstDayOfWeek)].map((_, i) => (
                <div key={`empty-${i}`} className="ac-day-cell ac-empty" role="gridcell" aria-hidden="true" />
              ))}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isPast       = key < today;
                const isToday      = key === today;
                const isUnavailable = availability[key] === false;
                let cls = "ac-day-cell";
                if (isPast)             cls += " ac-past";
                else if (isUnavailable) cls += " ac-unavailable";
                else                    cls += " ac-available";
                if (isToday)            cls += " ac-today";
                const label = isPast
                  ? `${day} ${monthName}, past date`
                  : isUnavailable
                    ? `${day} ${monthName}, marked unavailable`
                    : `${day} ${monthName}, available`;
                return (
                  <button key={key} className={cls} role="gridcell" onClick={() => toggleDate(key)} disabled={isPast} aria-label={label} aria-pressed={isUnavailable}>
                    <span className="ac-day-num">{day}</span>
                    {isUnavailable && <span className="ac-unavail-dot" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {unavailableThisMonth > 0 && (
              <p className="ac-month-stat" aria-live="polite">
                {unavailableThisMonth} day{unavailableThisMonth !== 1 ? "s" : ""} marked unavailable this month
              </p>
            )}
          </>
        )}

        <div className="ac-footer">
          <button className="ac-cancel-btn" onClick={onClose}>Cancel</button>
          <button className={`ac-save-btn ${saved ? "ac-saved" : ""}`} onClick={handleSave} disabled={saving || loading} aria-busy={saving}>
            {saving ? <span className="ac-spinner" aria-hidden="true" /> : saved ? "✓ Saved!" : "Save Availability"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONFIRM UNDO POPUP
// ─────────────────────────────────────────────────────────────
function ConfirmUndoPopup({ bookingName, onConfirm, onCancel, confirming }) {
  const btnRef = useRef(null);
  useEffect(() => {
    btnRef.current?.focus();
    const handleKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onCancel(); };
  return (
    <div className="cu-overlay" onClick={handleBackdrop} role="alertdialog" aria-modal="true" aria-labelledby="cu-title" aria-describedby="cu-desc">
      <div className="cu-modal">
        <div className="cu-icon-wrap" aria-hidden="true">↩</div>
        <h3 id="cu-title" className="cu-title">Move Back to Pending?</h3>
        <p id="cu-desc" className="cu-sub">
          This will revert <strong>{bookingName || "this booking"}</strong>'s status from{" "}
          <span className="cu-status-word cu-approved">Approved</span> back to{" "}
          <span className="cu-status-word cu-pending">Pending</span>.
        </p>
        <div className="cu-btns">
          <button className="cu-cancel-btn" onClick={onCancel} disabled={confirming}>Cancel</button>
          <button className="cu-confirm-btn" onClick={onConfirm} disabled={confirming} ref={btnRef} aria-busy={confirming}>
            {confirming ? <span className="cu-spinner" aria-hidden="true" /> : "↩ Yes, Move to Pending"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BOOKING DETAIL POPUP
// ─────────────────────────────────────────────────────────────
function BookingDetailPopup({ booking, onClose, onUpdateStatus, updating, onRequestUndo }) {
  const b       = booking;
  const meta    = STATUS_META[b.status] || STATUS_META.pending;
  const payMeta = PAY_META[b.paymentStatus] || PAY_META.pending;
  const dcr     = b.dateChangeRequest;
  const hasDcr  = dcr?.status === "pending";
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="bd-overlay" onClick={handleBackdrop} role="dialog" aria-modal="true" aria-labelledby="bd-name">
      <div className="bd-modal">
        <button className="bd-close" onClick={onClose} ref={closeRef} aria-label="Close booking details">✕</button>
        <div className="bd-top">
          <div className="bd-avatar" aria-hidden="true">{b.userId?.name?.charAt(0)?.toUpperCase() || "?"}</div>
          <div className="bd-top-info">
            <h2 id="bd-name" className="bd-name">{b.userId?.name || "Unknown Client"}</h2>
            <p className="bd-email">{b.userId?.email || ""}</p>
          </div>
          <span className="bd-status-badge" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }} aria-label={`Booking status: ${meta.label}`}>
            {meta.label}
          </span>
        </div>

        <div className="bd-pay-banner" style={{ background: payMeta.bg, border: `1px solid ${payMeta.border}` }} role="status" aria-label={payMeta.label}>
          <div className="bd-pay-icon-wrap" style={{ color: payMeta.color }} aria-hidden="true"><span>{payMeta.icon}</span></div>
          <div className="bd-pay-info">
            <span className="bd-pay-label" style={{ color: payMeta.color }}>{payMeta.label}</span>
            {b.paymentStatus === "paid"    && b.paidAt && <span className="bd-pay-time">Paid on {fmtTime(b.paidAt)}</span>}
            {b.paymentStatus === "pending" && <span className="bd-pay-time">Awaiting payment from client</span>}
            {b.paymentStatus === "failed"  && <span className="bd-pay-time">Payment was not completed</span>}
          </div>
          {b.paymentStatus === "paid" && <span className="bd-pay-amount">₹{b.packagePrice?.toLocaleString()}</span>}
        </div>

        <dl className="bd-grid">
          <div className="bd-info-block"><dt className="bd-info-label">Booking Date</dt><dd className="bd-info-value">🗓 {fmt(b.date)}</dd></div>
          <div className="bd-info-block"><dt className="bd-info-label">Package</dt><dd className="bd-info-value">📦 {b.packageName || "—"}</dd></div>
          <div className="bd-info-block"><dt className="bd-info-label">Package Price</dt><dd className="bd-info-value">₹ {b.packagePrice?.toLocaleString() || "—"}</dd></div>
          <div className="bd-info-block"><dt className="bd-info-label">Booked On</dt><dd className="bd-info-value">{b.createdAt ? fmtTime(b.createdAt) : "—"}</dd></div>
        </dl>

        <h3 className="bd-section-title">Client Details</h3>
        <address className="bd-client-details">
          {b.userDetails?.name && (
            <div className="bd-detail-row"><span className="bd-detail-icon" aria-hidden="true">👤</span><div><span className="bd-detail-label">Name on Booking</span><span className="bd-detail-value">{b.userDetails.name}</span></div></div>
          )}
          {b.userDetails?.phone && (
            <div className="bd-detail-row"><span className="bd-detail-icon" aria-hidden="true">📱</span><div><span className="bd-detail-label">Phone</span><a className="bd-detail-value bd-detail-link" href={`tel:${b.userDetails.phone}`}>{b.userDetails.phone}</a></div></div>
          )}
          {b.userDetails?.address && (
            <div className="bd-detail-row"><span className="bd-detail-icon" aria-hidden="true">📍</span><div><span className="bd-detail-label">Address</span><span className="bd-detail-value">{b.userDetails.address}</span></div></div>
          )}
        </address>

        {hasDcr && (
          <div className="bd-dcr-box" role="region" aria-label="Pending change request">
            <div className="bd-dcr-header"><span className="bd-dcr-tag">📅 Change Request Pending</span></div>
            {dcr.requestedDate && <div className="bd-dcr-row"><span className="bd-dcr-key">New Date</span><span className="bd-dcr-val">{fmt(dcr.requestedDate)}</span></div>}
            {dcr.requestedAddress && <div className="bd-dcr-row"><span className="bd-dcr-key">New Address</span><span className="bd-dcr-val">{dcr.requestedAddress}</span></div>}
            {dcr.reason && <div className="bd-dcr-reason">"{dcr.reason}"</div>}
          </div>
        )}

        {b.status === "pending" && (
          <div className="bd-actions" role="group" aria-label="Booking actions">
            <button className="bd-reject-btn" onClick={() => onUpdateStatus(b._id, "rejected")} disabled={!!updating} aria-busy={updating === b._id + "rejected"}>
              {updating === b._id + "rejected" ? <span className="bd-spinner bd-spinner-dark" aria-hidden="true" /> : "✕ Reject Booking"}
            </button>
            <button className="bd-accept-btn" onClick={() => onUpdateStatus(b._id, "approved")} disabled={!!updating} aria-busy={updating === b._id + "approved"}>
              {updating === b._id + "approved" ? <span className="bd-spinner" aria-hidden="true" /> : "✓ Approve Booking"}
            </button>
          </div>
        )}

        {b.status === "approved" && !hasDcr && (
          <div className="bd-actions">
            <button className="bd-undo-btn" onClick={() => onRequestUndo(b)} disabled={!!updating}>↩ Move back to Pending</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DATE CHANGE POPUP
// ─────────────────────────────────────────────────────────────
function DateChangePopup({ booking, onAccept, onReject, responding }) {
  const dcr       = booking.dateChangeRequest;
  const client    = booking.userId?.name || "The client";
  const rejectRef = useRef(null);
  useEffect(() => { rejectRef.current?.focus(); }, []);
  const changeItems = [];
  if (dcr.requestedDate)    changeItems.push({ icon: "🗓", label: "New Date",    value: fmt(dcr.requestedDate) });
  if (dcr.requestedAddress) changeItems.push({ icon: "📍", label: "New Address", value: dcr.requestedAddress  });
  return (
    <div className="vd-popup-overlay" role="alertdialog" aria-modal="true" aria-labelledby="dcp-title" aria-describedby="dcp-desc">
      <div className="vd-popup">
        <div className="vd-popup-icon-wrap" aria-hidden="true">📅</div>
        <h3 id="dcp-title" className="vd-popup-title">Client Wants to Change Booking</h3>
        <p id="dcp-desc" className="vd-popup-sub"><strong>{client}</strong> has requested the following changes.</p>
        <div className="vd-popup-changes">
          {changeItems.map((item) => (
            <div key={item.label} className="vd-popup-change-row">
              <span className="vd-popup-change-icon" aria-hidden="true">{item.icon}</span>
              <div><span className="vd-popup-change-label">{item.label}</span><span className="vd-popup-change-value">{item.value}</span></div>
            </div>
          ))}
          {dcr.reason && (
            <div className="vd-popup-reason">
              <span className="vd-popup-reason-label">Client's reason:</span>
              <blockquote className="vd-popup-reason-text">"{dcr.reason}"</blockquote>
            </div>
          )}
        </div>
        <div className="vd-popup-current">
          <span className="vd-popup-current-label">Current:</span>
          <span>{fmt(booking.date)}</span>
          {booking.userDetails?.address && <span>· {booking.userDetails.address}</span>}
        </div>
        <div className="vd-popup-btns" role="group" aria-label="Change request actions">
          <button className="vd-popup-reject-btn" onClick={onReject} disabled={!!responding} ref={rejectRef} aria-busy={responding === "reject"}>
            {responding === "reject" ? <span className="vd-spinner vd-spinner-dark" aria-hidden="true" /> : "✕ Decline"}
          </button>
          <button className="vd-popup-accept-btn" onClick={onAccept} disabled={!!responding} aria-busy={responding === "approve"}>
            {responding === "approve" ? <span className="vd-spinner" aria-hidden="true" /> : "✓ Accept Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SEARCH / FILTER BAR
// ─────────────────────────────────────────────────────────────
function BookingSearchBar({ value, onChange }) {
  return (
    <div className="vd-search-wrap">
      <span className="vd-search-icon" aria-hidden="true">🔍</span>
      <input
        className="vd-search-input"
        type="search"
        placeholder="Search by client name or email…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search bookings"
        autoComplete="off"
      />
      {value && (
        <button className="vd-search-clear" onClick={() => onChange("")} aria-label="Clear search">✕</button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LEGAL MODAL
// ─────────────────────────────────────────────────────────────
const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy", icon: "🔒",
    sections: [
      { heading: "Information We Collect", body: "We collect information you provide directly — such as your name, email, business details, and service listings — as well as booking data generated through your vendor account." },
      { heading: "How We Use Your Information", body: "Your data is used to operate the platform, process bookings, send important notifications, and improve our services. We do not sell your personal information to third parties." },
      { heading: "Data Security", body: "All data is transmitted over HTTPS and stored with industry-standard encryption. Access to vendor data is restricted to authorised personnel only." },
      { heading: "Cookies", body: "We use essential cookies to keep you logged in and remember your preferences. No advertising or third-party tracking cookies are used on the vendor portal." },
      { heading: "Your Rights", body: "You may request access to, correction of, or deletion of your personal data at any time by contacting our support team." },
      { heading: "Contact", body: "For privacy-related queries, reach us at admineventify2005@gmail.com." },
    ],
  },
  terms: {
    title: "Terms of Service", icon: "📄",
    sections: [
      { heading: "Acceptance of Terms", body: "By accessing or using the Vendor Portal, you agree to be bound by these Terms of Service." },
      { heading: "Vendor Responsibilities", body: "You are responsible for maintaining accurate service listings, responding to booking requests in a timely manner, and honouring approved bookings." },
      { heading: "Payments", body: "All payments are processed through our secure payment gateway. The platform charges a service fee on completed bookings as outlined in your vendor agreement." },
      { heading: "Cancellations", body: "Cancellation policies are governed by your individual service settings. Repeated cancellations may affect your vendor standing and search visibility." },
      { heading: "Intellectual Property", body: "All content you upload remains your property. You grant us a limited licence to display it on the platform." },
      { heading: "Limitation of Liability", body: "The platform is provided 'as is'. We are not liable for indirect or consequential damages arising from use of the service." },
      { heading: "Changes to Terms", body: "We may update these terms periodically. Continued use of the platform after changes constitutes acceptance of the revised terms." },
    ],
  },
  help: {
    title: "Help & Support", icon: "💬",
    sections: [
      { heading: "Managing Bookings", body: "Review incoming bookings under the Bookings section. Click any card to open full details. Use the Accept / Reject buttons to respond." },
      { heading: "Availability Calendar", body: "Click 'Manage Calendar' in the dashboard header to block out dates you're unavailable." },
      { heading: "Adding Services", body: "Click '+ Add New Service' to create a new listing. Fill in your title, description, packages, and photos." },
      { heading: "Date Change Requests", body: "When a client requests a date or address change, a banner will appear at the top of your bookings." },
      { heading: "Payment Issues", body: "If a payment shows as 'Failed', ask the client to retry from their booking page. For disputes, contact admineventify2005@gmail.com." },
      { heading: "Contact Support", body: "Email us at admineventify2005@gmail.com. We typically respond within 2 business hours." },
    ],
  },
};

function LegalModal({ type, onClose }) {
  const content  = LEGAL_CONTENT[type];
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };
  if (!content) return null;
  return (
    <div className="lm-overlay" onClick={handleBackdrop} role="dialog" aria-modal="true" aria-labelledby="lm-title">
      <div className="lm-modal">
        <button className="lm-close" onClick={onClose} ref={closeRef} aria-label="Close">✕</button>
        <div className="lm-header">
          <span className="lm-header-icon" aria-hidden="true">{content.icon}</span>
          <h2 id="lm-title" className="lm-title">{content.title}</h2>
        </div>
        <div className="lm-body">
          {content.sections.map((s) => (
            <div key={s.heading} className="lm-section">
              <h3 className="lm-section-heading">{s.heading}</h3>
              <p className="lm-section-body">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="lm-footer"><button className="lm-close-btn" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function VendorDashboard() {
  const [bookings,      setBookings]      = useState([]);
  const [services,      setServices]      = useState([]);
  const [loadingB,      setLoadingB]      = useState(true);
  const [loadingS,      setLoadingS]      = useState(true);
  const [updating,      setUpdating]      = useState(null);
  const [filter,        setFilter]        = useState("all");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [popupBooking,  setPopupBooking]  = useState(null);
  const [responding,    setResponding]    = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);
  const [undoTarget,    setUndoTarget]    = useState(null);
  const [confirming,    setConfirming]    = useState(false);
  const [showAvailCal,  setShowAvailCal]  = useState(false);
  const [toast,         setToast]         = useState(null);
  const [vendorName,    setVendorName]    = useState("");
  const [legalModal,    setLegalModal]    = useState(null);

  // ── NEW: service type filter for My Services section ──
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    const isOpen = popupBooking || detailBooking || undoTarget || showAvailCal || legalModal;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [popupBooking, detailBooking, undoTarget, showAvailCal]);

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await API.get("/bookings/vendor", { headers: { Authorization: `Bearer ${token}` } });
      setBookings(res.data);
      const withPendingDcr = res.data.find((b) => b.dateChangeRequest?.status === "pending");
      if (withPendingDcr) setPopupBooking(withPendingDcr);
    } catch (e) {
      console.error("fetchBookings:", e);
    } finally {
      setLoadingB(false);
    }
  };

  const fetchServices = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await API.get("/vendors/my-services", { headers: { Authorization: `Bearer ${token}` } });
      setServices(res.data);
    } catch (e) {
      console.error("fetchServices:", e);
    } finally {
      setLoadingS(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    API.get("/vendors/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setVendorName(res.data?.businessName || res.data?.name || ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchServices();
  }, []);

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem("token");
    setUpdating(id + status);
    try {
      await API.put(`/bookings/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchBookings();
      setDetailBooking((prev) => (prev && prev._id === id ? { ...prev, status } : prev));
      showToast(
        status === "approved" ? "Booking approved successfully." : "Booking rejected.",
        status === "approved" ? "success" : "error"
      );
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleRequestUndo  = (booking) => setUndoTarget(booking);
  const handleConfirmUndo  = async () => {
    if (!undoTarget) return;
    setConfirming(true);
    try {
      await updateStatus(undoTarget._id, "pending");
      setUndoTarget(null);
      setDetailBooking((prev) => prev && prev._id === undoTarget._id ? { ...prev, status: "pending" } : prev);
    } finally {
      setConfirming(false);
    }
  };
  const handleCancelUndo   = () => setUndoTarget(null);

  const handleAcceptChange = async () => {
    if (!popupBooking) return;
    setResponding("approve");
    try {
      await API.put(`/bookings/${popupBooking._id}/change-request`, { action: "approved" });
      setPopupBooking(null);
      await fetchBookings();
      showToast("Change request approved.", "success");
    } catch { showToast("Failed to approve change. Try again.", "error"); }
    finally  { setResponding(null); }
  };

  const handleRejectChange = async () => {
    if (!popupBooking) return;
    setResponding("reject");
    try {
      await API.put(`/bookings/${popupBooking._id}/change-request`, { action: "rejected" });
      setPopupBooking(null);
      await fetchBookings();
      showToast("Change request declined.", "info");
    } catch { showToast("Failed to decline change. Try again.", "error"); }
    finally  { setResponding(null); }
  };

  const handleServiceDeleted = (id) => {
    setServices((p) => p.filter((s) => s._id !== id));
    showToast("Service removed.", "info");
  };

  // ── Bookings filter + search ──
  const statusFiltered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const filtered = searchQuery.trim()
    ? statusFiltered.filter((b) => {
        const q = searchQuery.toLowerCase();
        return b.userId?.name?.toLowerCase().includes(q) || b.userId?.email?.toLowerCase().includes(q);
      })
    : statusFiltered;

  const counts = {
    all:      bookings.length,
    pending:  bookings.filter((b) => b.status === "pending").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };
  const pendingDcrCount = bookings.filter((b) => b.dateChangeRequest?.status === "pending").length;

  // ── NEW: filtered services by type ──
  const filteredServices = serviceTypeFilter === "all"
    ? services
    : services.filter((s) => s.serviceType === serviceTypeFilter);

  // ── NEW: service counts per type ──
  const serviceTypeCounts = SERVICE_TYPE_FILTERS.reduce((acc, t) => {
    acc[t.key] = t.key === "all" ? services.length : services.filter((s) => s.serviceType === t.key).length;
    return acc;
  }, {});

  // Only show tabs that have services OR are "all"
  const activeServiceTypeTabs = SERVICE_TYPE_FILTERS.filter(
    (t) => t.key === "all" || serviceTypeCounts[t.key] > 0
  );

  const TABS = [
    { key: "all",      label: "All" },
    { key: "pending",  label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <>
      <style>{styles}</style>

      <DashboardHelmet vendorName={vendorName} serviceCount={services.length} pendingCount={counts.pending} />

      <a className="vd-skip-link" href="#vd-main-content">Skip to main content</a>

      <div className="vd-root">
        <Navbar />

        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

        {popupBooking && (
          <DateChangePopup booking={popupBooking} onAccept={handleAcceptChange} onReject={handleRejectChange} responding={responding} />
        )}

        {detailBooking && (
          <BookingDetailPopup booking={detailBooking} onClose={() => setDetailBooking(null)} onUpdateStatus={updateStatus} updating={updating} onRequestUndo={handleRequestUndo} />
        )}

        {undoTarget && (
          <ConfirmUndoPopup bookingName={undoTarget.userId?.name} onConfirm={handleConfirmUndo} onCancel={handleCancelUndo} confirming={confirming} />
        )}

        {showAvailCal && services.length > 0 && (
          <AvailabilityCalendar services={services} onClose={() => setShowAvailCal(false)} />
        )}

        {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}

        <div className="vd-bg-ornament" aria-hidden="true">
          <div className="vd-bg-circle vd-bg-circle-1" />
          <div className="vd-bg-circle vd-bg-circle-2" />
        </div>

        <main id="vd-main-content" className="vd-body">

          {/* ── HEADER ── */}
          <header className="vd-header" role="banner">
            <div className="vd-header-left">
              <p className="vd-eyebrow">Vendor Portal</p>
              <h1 className="vd-title">{vendorName ? `${vendorName}'s Dashboard` : "Dashboard"}</h1>
              <p className="vd-subtitle">Manage your bookings and services</p>
              <div className="vd-avail-section">
                <p className="vd-avail-text">Tell us about your availability</p>
                <button
                  className="vd-avail-btn"
                  onClick={() => {
                    if (loadingS) return;
                    if (services.length === 0) { showToast("Add at least one service before setting availability.", "warning"); return; }
                    setShowAvailCal(true);
                  }}
                  disabled={loadingS}
                  aria-label="Open availability calendar"
                >
                  <span className="vd-avail-btn-icon" aria-hidden="true">📅</span>
                  Manage Calendar
                </button>
              </div>
            </div>
            <a href="/add-service" className="vd-add-btn" aria-label="Add a new service">+ Add New Service</a>
          </header>

          {/* ── STATS ── */}
          <section aria-label="Booking statistics">
            <div className="vd-stats" role="list">
              {[
                { label: "Total Bookings", value: counts.all,      icon: "📋", color: "#0e0c0a" },
                { label: "Pending",        value: counts.pending,  icon: "⏳", color: "#c9a84c" },
                { label: "Approved",       value: counts.approved, icon: "✓",  color: "#2d6a4f" },
                { label: "Rejected",       value: counts.rejected, icon: "✕",  color: "#b85c5c" },
              ].map((s) => (
                <div key={s.label} className="vd-stat-card" role="listitem">
                  <span className="vd-stat-icon" aria-hidden="true">{s.icon}</span>
                  <span className="vd-stat-value" style={{ color: s.color }}>{s.value}</span>
                  <span className="vd-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── DCR ALERT ── */}
          {pendingDcrCount > 0 && (
            <div
              className="vd-dcr-alert"
              role="alert"
              onClick={() => {
                const first = bookings.find((b) => b.dateChangeRequest?.status === "pending");
                if (first) setPopupBooking(first);
              }}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const first = bookings.find((b) => b.dateChangeRequest?.status === "pending");
                  if (first) setPopupBooking(first);
                }
              }}
            >
              <span className="vd-dcr-alert-icon" aria-hidden="true">📅</span>
              <div><strong>{pendingDcrCount} client{pendingDcrCount !== 1 ? "s" : ""}</strong>{" "}want{pendingDcrCount === 1 ? "s" : ""} to change their booking details</div>
              <span className="vd-dcr-alert-cta" aria-hidden="true">Review →</span>
            </div>
          )}

          {/* ── MY SERVICES ── */}
          <section className="vd-section" aria-labelledby="services-heading">
            <div className="vd-section-header">
              <div>
                <h2 id="services-heading" className="vd-section-title">My Services</h2>
                <p className="vd-section-sub">
                  {loadingS ? "Loading…" : `${services.length} service${services.length !== 1 ? "s" : ""} listed`}
                </p>
              </div>
              <a href="/add-service" className="vd-section-add" aria-label="Add a new service">+ New Service</a>
            </div>

            {/* ── SERVICE TYPE FILTER TABS (NEW) ── */}
            {!loadingS && services.length > 0 && activeServiceTypeTabs.length > 1 && (
              <div className="vd-svc-type-tabs" role="tablist" aria-label="Filter services by type">
                {activeServiceTypeTabs.map(({ key, label, emoji }) => (
                  <button
                    key={key}
                    role="tab"
                    className={`vd-svc-type-tab ${serviceTypeFilter === key ? "active" : ""}`}
                    onClick={() => setServiceTypeFilter(key)}
                    aria-selected={serviceTypeFilter === key}
                  >
                    <span className="vd-svc-type-tab-emoji">{emoji}</span>
                    <span>{label}</span>
                    <span className="vd-svc-type-tab-count">{serviceTypeCounts[key]}</span>
                  </button>
                ))}
              </div>
            )}

            {loadingS ? (
              <div className="vd-svc-grid" aria-label="Loading services…" role="status">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="vd-skeleton vd-skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="vd-svc-empty" role="status">
                <span className="vd-svc-empty-icon" aria-hidden="true">🏷</span>
                <p className="vd-svc-empty-title">No services yet</p>
                <p className="vd-svc-empty-sub">Add your first service to start receiving bookings.</p>
                <a href="/add-service" className="vd-add-btn" style={{ marginTop: 16, display: "inline-block" }}>+ Add Service</a>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="vd-svc-empty" role="status">
                <span className="vd-svc-empty-icon" aria-hidden="true">🔍</span>
                <p className="vd-svc-empty-title">No {SERVICE_TYPE_FILTERS.find(t => t.key === serviceTypeFilter)?.label} services</p>
                <p className="vd-svc-empty-sub">You haven't added any {SERVICE_TYPE_FILTERS.find(t => t.key === serviceTypeFilter)?.label.toLowerCase()} services yet.</p>
                <button className="vd-clear-search-btn" onClick={() => setServiceTypeFilter("all")} style={{ marginTop: 12 }}>Show all services</button>
              </div>
            ) : (
              <div className="vd-svc-grid">
                {filteredServices.map((v, i) => (
                  <div key={v._id} style={{ animationDelay: `${i * 0.06}s` }} className="vd-svc-card-wrapper">
                    <ServiceCard vendor={v} showDelete={true} onDeleted={handleServiceDeleted} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── BOOKINGS ── */}
          <section className="vd-section" aria-labelledby="bookings-heading">
            <div className="vd-section-header">
              <div>
                <h2 id="bookings-heading" className="vd-section-title">Bookings</h2>
                <p className="vd-section-sub">Click any booking card to view full details</p>
              </div>
            </div>

            <BookingSearchBar value={searchQuery} onChange={setSearchQuery} />

            <div className="vd-tabs" role="tablist" aria-label="Filter bookings by status">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  role="tab"
                  className={`vd-tab ${filter === key ? "active" : ""}`}
                  onClick={() => { setFilter(key); setSearchQuery(""); }}
                  aria-selected={filter === key}
                  aria-controls="bookings-list"
                  id={`tab-${key}`}
                >
                  {label}
                  <span className="vd-tab-count" aria-label={`${counts[key]} bookings`}>{counts[key]}</span>
                </button>
              ))}
            </div>

            {loadingB ? (
              <div className="vd-loading" role="status" aria-label="Loading bookings…">
                {[...Array(3)].map((_, i) => (<div key={i} className="vd-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="vd-empty" role="status" id="bookings-list">
                <div className="vd-empty-icon" aria-hidden="true">📭</div>
                <h3>No bookings found</h3>
                <p>
                  {searchQuery
                    ? `No results for "${searchQuery}".`
                    : filter === "all" ? "You haven't received any bookings yet." : `No ${filter} bookings.`}
                </p>
                {searchQuery && (<button className="vd-clear-search-btn" onClick={() => setSearchQuery("")}>Clear search</button>)}
              </div>
            ) : (
              <ol className="vd-bookings" id="bookings-list" aria-labelledby={`tab-${filter}`} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {filtered.map((b, i) => {
                  const meta    = STATUS_META[b.status] || STATUS_META.pending;
                  const payMeta = PAY_META[b.paymentStatus] || PAY_META.pending;
                  const dcr     = b.dateChangeRequest;
                  const hasDcr  = dcr?.status === "pending";
                  return (
                    <li key={b._id} className={`vd-booking-card ${hasDcr ? "vd-booking-card-dcr" : ""}`} style={{ animationDelay: `${i * 0.06}s` }}>
                      <button
                        className="vd-booking-card-btn"
                        onClick={() => setDetailBooking(b)}
                        aria-label={`View details for ${b.userId?.name || "Unknown Client"}'s booking`}
                      >
                        <div className="vd-booking-left">
                          <div className="vd-avatar" aria-hidden="true">{b.userId?.name?.charAt(0)?.toUpperCase() || "?"}</div>
                          <div className="vd-booking-info">
                            <h3 className="vd-booking-name">{b.userId?.name || "Unknown Client"}</h3>
                            <p className="vd-booking-email">{b.userId?.email || ""}</p>
                            <div className="vd-booking-meta">
                              <span className="vd-meta-item">🗓 {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                              {b.packageName  && <span className="vd-meta-item">📦 {b.packageName}</span>}
                              {b.packagePrice && <span className="vd-meta-item">₹ {b.packagePrice.toLocaleString()}</span>}
                            </div>
                            {(b.userDetails?.phone || b.userDetails?.address) && (
                              <div className="vd-user-details">
                                {b.userDetails.phone   && <span className="vd-detail-chip">📱 {b.userDetails.phone}</span>}
                                {b.userDetails.address && <span className="vd-detail-chip">📍 {b.userDetails.address}</span>}
                              </div>
                            )}
                            {hasDcr && (
                              <div
                                className="vd-dcr-pill"
                                role="button" tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); setPopupBooking(b); }}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setPopupBooking(b); } }}
                                aria-label="Review pending change request"
                              >
                                <span>📅 Client wants changes</span>
                                {dcr.requestedDate    && <span className="vd-dcr-pill-detail">Date → {fmt(dcr.requestedDate)}</span>}
                                {dcr.requestedAddress && <span className="vd-dcr-pill-detail">Addr → {dcr.requestedAddress}</span>}
                                <span className="vd-dcr-pill-cta" aria-hidden="true">Review →</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="vd-booking-right" onClick={(e) => e.stopPropagation()}>
                        <span className="vd-pay-chip" style={{ color: payMeta.color, background: payMeta.bg, border: `1px solid ${payMeta.border}` }} aria-label={payMeta.label}>
                          <span aria-hidden="true">{payMeta.icon}</span> {payMeta.label}
                        </span>
                        <span className="vd-status-badge" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }} aria-label={`Status: ${meta.label}`}>
                          {meta.label}
                        </span>

                        {b.status === "pending" && (
                          <div className="vd-actions" role="group" aria-label="Quick actions">
                            <button
                              className={`vd-accept-btn ${updating === b._id + "approved" ? "loading" : ""}`}
                              onClick={() => updateStatus(b._id, "approved")}
                              disabled={!!updating}
                              aria-busy={updating === b._id + "approved"}
                              aria-label={`Approve ${b.userId?.name || "this"}'s booking`}
                            >
                              {updating === b._id + "approved" ? <span className="vd-spinner" aria-hidden="true" /> : "✓ Accept"}
                            </button>
                            <button
                              className={`vd-reject-btn ${updating === b._id + "rejected" ? "loading" : ""}`}
                              onClick={() => updateStatus(b._id, "rejected")}
                              disabled={!!updating}
                              aria-busy={updating === b._id + "rejected"}
                              aria-label={`Reject ${b.userId?.name || "this"}'s booking`}
                            >
                              {updating === b._id + "rejected" ? <span className="vd-spinner vd-spinner-dark" aria-hidden="true" /> : "✕ Reject"}
                            </button>
                          </div>
                        )}

                        {b.status === "approved" && !hasDcr && (
                          <button className="vd-undo-btn" onClick={() => handleRequestUndo(b)} aria-label="Move booking back to pending">Undo</button>
                        )}

                        <span className="vd-view-hint" aria-hidden="true">View details →</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

        </main>

        {/* ── FOOTER ── */}
        <footer className="vd-footer-bar" role="contentinfo">
          <p className="vd-footer-text">© {new Date().getFullYear()} Vendor Portal. All bookings are secured and private.</p>
          <nav className="vd-footer-links" aria-label="Footer navigation">
            <button className="vd-footer-link" onClick={() => setLegalModal("help")}>Help</button>
            <button className="vd-footer-link" onClick={() => setLegalModal("privacy")}>Privacy</button>
            <button className="vd-footer-link" onClick={() => setLegalModal("terms")}>Terms</button>
          </nav>
        </footer>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:        #0e0c0a;
    --cream:      #f5f0e8;
    --gold:       #c9a84c;
    --gold-light: #e8d5a3;
    --gold-dim:   rgba(201,168,76,0.18);
    --muted:      #7a7265;
    --border:     rgba(201,168,76,0.2);
    --surface:    #faf7f2;
    --white:      #ffffff;
    --green:      #2d6a4f;
    --red:        #b85c5c;
    --radius-sm:  8px;
    --radius-md:  12px;
    --radius-lg:  20px;
    --shadow-sm:  0 2px 8px rgba(14,12,10,0.06);
    --shadow-md:  0 8px 32px rgba(14,12,10,0.1);
    --shadow-lg:  0 24px 64px rgba(14,12,10,0.16);
  }

  .vd-skip-link {
    position: fixed; top: -100%; left: 16px;
    background: var(--ink); color: var(--white);
    padding: 10px 18px; border-radius: 0 0 8px 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    text-decoration: none; z-index: 9999;
    transition: top 0.2s;
    outline: 2px solid var(--gold);
  }
  .vd-skip-link:focus { top: 0; }

  .vd-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
    position: relative;
    overflow-x: hidden;
  }

  .vd-bg-ornament { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
  .vd-bg-circle { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%); }
  .vd-bg-circle-1 { width: 700px; height: 700px; top: -200px; right: -200px; }
  .vd-bg-circle-2 { width: 500px; height: 500px; bottom: 10%; left: -150px; }

  .vd-body {
    position: relative; z-index: 1;
    width: 100%; max-width: 1200px;
    margin: 0 auto;
    padding: 48px 32px 80px;
  }

  /* ── TOAST ── */
  .toast-wrap { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 9999; width: min(420px, 92vw); animation: toastIn 0.32s cubic-bezier(0.34,1.2,0.64,1) both; }
  .toast { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 14px; backdrop-filter: blur(12px); box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08); }
  .toast-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; font-family: 'DM Sans', sans-serif; }
  .toast-msg { flex: 1; font-size: 13.5px; color: var(--ink); line-height: 1.5; }
  .toast-close { background: none; border: none; cursor: pointer; font-size: 11px; color: var(--muted); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s, color 0.2s; }
  .toast-close:hover { background: rgba(14,12,10,0.08); color: var(--ink); }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.95); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }

  /* ── AVAILABILITY CALENDAR ── */
  .ac-overlay { position: fixed; inset: 0; background: rgba(14,12,10,0.7); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1400; padding: 16px; animation: fadeIn 0.2s ease both; }
  .ac-modal { position: relative; background: var(--white); border: 1px solid rgba(201,168,76,0.22); border-radius: 24px; padding: 36px 32px 28px; width: min(600px, 98vw); max-height: 96vh; overflow-y: auto; box-shadow: var(--shadow-lg); animation: popupUp 0.32s cubic-bezier(0.34,1.15,0.64,1) both; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .ac-modal::-webkit-scrollbar { width: 4px; }
  .ac-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .ac-close { position: absolute; top: 14px; right: 14px; width: 30px; height: 30px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); font-size: 12px; color: var(--muted); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
  .ac-close:hover { background: var(--ink); color: var(--white); border-color: var(--ink); }
  .ac-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
  .ac-header-icon { width: 48px; height: 48px; flex-shrink: 0; border-radius: 12px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
  .ac-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: var(--ink); margin-bottom: 3px; }
  .ac-subtitle { font-size: 12.5px; color: var(--muted); }
  .ac-service-select-wrap { margin-bottom: 18px; }
  .ac-label { display: block; font-size: 10.5px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
  .ac-service-select { width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); outline: none; cursor: pointer; transition: border-color 0.2s; }
  .ac-service-select:focus { border-color: var(--gold); }
  .ac-legend { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin-bottom: 12px; }
  .ac-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
  .ac-legend-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
  .ac-dot-available   { background: rgba(45,106,79,0.15);   border: 1.5px solid rgba(45,106,79,0.4); }
  .ac-dot-unavailable { background: rgba(184,92,92,0.15);   border: 1.5px solid rgba(184,92,92,0.4); }
  .ac-dot-past        { background: rgba(122,114,101,0.12); border: 1.5px solid rgba(122,114,101,0.25); }
  .ac-legend-sub { font-size: 10.5px; opacity: 0.7; }
  .ac-instruction { font-size: 12.5px; color: var(--muted); line-height: 1.6; margin-bottom: 18px; padding: 10px 14px; background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.18); border-radius: 8px; }
  .ac-instruction strong { color: var(--ink); }
  .ac-month-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .ac-nav-btn { width: 34px; height: 34px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); font-size: 18px; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; line-height: 1; }
  .ac-nav-btn:hover { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.06); }
  .ac-month-label { font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; font-weight: 600; color: var(--ink); }
  .ac-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 14px; }
  .ac-day-header { text-align: center; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); padding: 6px 0; }
  .ac-day-cell { position: relative; aspect-ratio: 1; border-radius: 8px; border: 1.5px solid transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; background: none; min-height: 36px; }
  .ac-day-cell.ac-empty { background: none; border: none; cursor: default; }
  .ac-day-cell.ac-available { background: rgba(45,106,79,0.07); border-color: rgba(45,106,79,0.2); }
  .ac-day-cell.ac-available:hover { background: rgba(184,92,92,0.1); border-color: rgba(184,92,92,0.35); transform: scale(1.06); }
  .ac-day-cell.ac-unavailable { background: rgba(184,92,92,0.1); border-color: rgba(184,92,92,0.35); }
  .ac-day-cell.ac-unavailable:hover { background: rgba(45,106,79,0.1); border-color: rgba(45,106,79,0.3); transform: scale(1.06); }
  .ac-day-cell.ac-past { background: rgba(122,114,101,0.06); border-color: transparent; cursor: not-allowed; opacity: 0.45; }
  .ac-day-cell.ac-today .ac-day-num { background: var(--gold); color: var(--white); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 11px; }
  .ac-day-num { font-size: 12px; color: var(--ink); line-height: 1; }
  .ac-unavail-dot { width: 4px; height: 4px; border-radius: 50%; background: #b85c5c; margin-top: 2px; }
  .ac-month-stat { font-size: 11.5px; color: var(--muted); text-align: center; margin-bottom: 8px; padding: 6px 12px; background: rgba(184,92,92,0.06); border: 1px solid rgba(184,92,92,0.18); border-radius: 20px; display: inline-block; margin-left: 50%; transform: translateX(-50%); }
  .ac-loading { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; margin-bottom: 14px; }
  .ac-skeleton-day { aspect-ratio: 1; border-radius: 8px; background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }
  .ac-footer { display: flex; gap: 10px; padding-top: 18px; border-top: 1px solid var(--border); margin-top: 8px; }
  .ac-cancel-btn { flex: 1; padding: 12px 16px; background: none; color: var(--muted); border: 1px solid var(--border); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
  .ac-cancel-btn:hover { border-color: var(--gold); color: var(--ink); }
  .ac-save-btn { flex: 2; padding: 12px 16px; background: var(--ink); color: var(--white); border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.22s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .ac-save-btn:hover:not(:disabled) { background: #2a2420; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,12,10,0.2); }
  .ac-save-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .ac-save-btn.ac-saved { background: #2d6a4f; }
  .ac-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }

  /* ── CONFIRM UNDO ── */
  .cu-overlay { position: fixed; inset: 0; background: rgba(14,12,10,0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1300; padding: 20px; animation: fadeIn 0.18s ease both; }
  .cu-modal { background: var(--white); border: 1px solid rgba(201,168,76,0.25); border-radius: 20px; padding: 36px 32px 30px; width: min(440px, 95vw); box-shadow: var(--shadow-lg); animation: popupUp 0.28s cubic-bezier(0.34,1.2,0.64,1) both; text-align: center; }
  .cu-icon-wrap { width: 56px; height: 56px; border-radius: 50%; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.25); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--gold); margin: 0 auto 20px; }
  .cu-title { font-family: 'Cormorant Garamond', serif; font-size: 1.55rem; font-weight: 600; color: var(--ink); margin-bottom: 12px; }
  .cu-sub { font-size: 13.5px; color: var(--muted); line-height: 1.7; margin-bottom: 28px; }
  .cu-sub strong { color: var(--ink); font-weight: 500; }
  .cu-status-word { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 10px; border-radius: 20px; }
  .cu-approved { color: #2d6a4f; background: rgba(45,106,79,0.1); border: 1px solid rgba(45,106,79,0.25); }
  .cu-pending  { color: #c9a84c; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3); }
  .cu-btns { display: flex; gap: 10px; }
  .cu-cancel-btn { flex: 1; padding: 13px 16px; background: none; color: var(--muted); border: 1px solid var(--border); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
  .cu-cancel-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--ink); }
  .cu-cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .cu-confirm-btn { flex: 2; padding: 13px 16px; background: var(--ink); color: var(--white); border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.22s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .cu-confirm-btn:hover:not(:disabled) { background: #2a2420; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,12,10,0.2); }
  .cu-confirm-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .cu-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }

  /* ── BOOKING DETAIL POPUP ── */
  .bd-overlay { position: fixed; inset: 0; background: rgba(14,12,10,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 20px; animation: fadeIn 0.2s ease both; }
  .bd-modal { position: relative; background: var(--white); border: 1px solid rgba(201,168,76,0.2); border-radius: 24px; padding: 40px 36px 32px; width: min(580px, 95vw); max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); animation: popupUp 0.3s cubic-bezier(0.34,1.15,0.64,1) both; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .bd-modal::-webkit-scrollbar { width: 4px; }
  .bd-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .bd-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); font-size: 13px; color: var(--muted); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
  .bd-close:hover { background: var(--ink); color: var(--white); border-color: var(--ink); }
  .bd-top { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
  .bd-avatar { width: 54px; height: 54px; border-radius: 50%; background: var(--ink); color: var(--gold); display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; flex-shrink: 0; }
  .bd-top-info { flex: 1; min-width: 0; }
  .bd-name { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 600; color: var(--ink); line-height: 1.1; }
  .bd-email { font-size: 12px; color: var(--muted); margin-top: 3px; }
  .bd-status-badge { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
  .bd-pay-banner { display: flex; align-items: center; gap: 14px; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; }
  .bd-pay-icon-wrap { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.55); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 700; flex-shrink: 0; }
  .bd-pay-info { flex: 1; }
  .bd-pay-label { display: block; font-size: 13.5px; font-weight: 600; margin-bottom: 3px; }
  .bd-pay-time  { font-size: 11.5px; color: var(--muted); }
  .bd-pay-amount { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: var(--green); flex-shrink: 0; }
  .bd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .bd-info-block { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 5px; }
  .bd-info-label { font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .bd-info-value { font-size: 13.5px; color: var(--ink); font-weight: 500; }
  .bd-section-title { font-size: 10px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  .bd-client-details { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; font-style: normal; }
  .bd-detail-row { display: flex; align-items: flex-start; gap: 12px; }
  .bd-detail-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; }
  .bd-detail-label { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
  .bd-detail-value { font-size: 13.5px; color: var(--ink); }
  .bd-detail-link { color: var(--gold); text-decoration: none; }
  .bd-detail-link:hover { text-decoration: underline; }
  .bd-dcr-box { background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  .bd-dcr-header { margin-bottom: 12px; }
  .bd-dcr-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: #8a6f1e; background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.25); padding: 4px 12px; border-radius: 20px; }
  .bd-dcr-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 8px; }
  .bd-dcr-key { color: var(--muted); font-size: 12px; }
  .bd-dcr-val { color: var(--ink); font-weight: 500; }
  .bd-dcr-reason { font-size: 12.5px; color: var(--muted); font-style: italic; padding-top: 10px; border-top: 1px solid rgba(201,168,76,0.2); margin-top: 4px; }
  .bd-actions { display: flex; gap: 10px; margin-top: 4px; }
  .bd-accept-btn { flex: 2; padding: 14px 16px; background: #2d6a4f; color: white; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.22s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .bd-accept-btn:hover:not(:disabled) { background: #1e4f39; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,106,79,0.3); }
  .bd-accept-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .bd-reject-btn { flex: 1; padding: 14px 16px; background: rgba(184,92,92,0.08); color: #b85c5c; border: 1px solid rgba(184,92,92,0.25); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.22s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .bd-reject-btn:hover:not(:disabled) { background: #b85c5c; color: white; border-color: #b85c5c; }
  .bd-reject-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .bd-undo-btn { flex: 1; padding: 13px 16px; background: none; color: var(--muted); border: 1px solid var(--border); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
  .bd-undo-btn:hover { border-color: var(--gold); color: var(--ink); }
  .bd-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  .bd-spinner-dark { border-color: rgba(184,92,92,0.3); border-top-color: #b85c5c; }

  /* ── DATE CHANGE POPUP ── */
  .vd-popup-overlay { position: fixed; inset: 0; background: rgba(14,12,10,0.65); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1200; padding: 20px; animation: fadeIn 0.2s ease both; }
  .vd-popup { background: var(--white); border: 1px solid rgba(201,168,76,0.25); border-radius: 20px; padding: 36px 32px 30px; width: min(500px, 95vw); box-shadow: var(--shadow-lg); animation: popupUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both; }
  .vd-popup-icon-wrap { width: 60px; height: 60px; border-radius: 50%; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); display: flex; align-items: center; justify-content: center; font-size: 1.7rem; margin: 0 auto 20px; }
  .vd-popup-title { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: var(--ink); text-align: center; margin-bottom: 10px; }
  .vd-popup-sub { font-size: 13.5px; color: var(--muted); text-align: center; line-height: 1.65; margin-bottom: 24px; }
  .vd-popup-sub strong { color: var(--ink); font-weight: 500; }
  .vd-popup-changes { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 12px; }
  .vd-popup-change-row { display: flex; align-items: flex-start; gap: 10px; }
  .vd-popup-change-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 1px; }
  .vd-popup-change-label { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 3px; }
  .vd-popup-change-value { font-size: 14px; font-weight: 500; color: var(--ink); }
  .vd-popup-reason { padding-top: 12px; border-top: 1px solid var(--border); }
  .vd-popup-reason-label { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .vd-popup-reason-text { font-size: 13px; color: var(--muted); font-style: italic; display: block; }
  .vd-popup-current { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--muted); margin-bottom: 24px; padding: 8px 12px; background: rgba(122,114,101,0.06); border-radius: 8px; }
  .vd-popup-current-label { font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; }
  .vd-popup-btns { display: flex; gap: 10px; }
  .vd-popup-reject-btn { flex: 1; padding: 13px 16px; background: rgba(184,92,92,0.08); color: #b85c5c; border: 1px solid rgba(184,92,92,0.25); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.22s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .vd-popup-reject-btn:hover:not(:disabled) { background: #b85c5c; color: white; border-color: #b85c5c; }
  .vd-popup-reject-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .vd-popup-accept-btn { flex: 2; padding: 13px 16px; background: #2d6a4f; color: white; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.22s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .vd-popup-accept-btn:hover:not(:disabled) { background: #1e4f39; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,106,79,0.3); }
  .vd-popup-accept-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .vd-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  .vd-spinner-dark { border-color: rgba(184,92,92,0.3); border-top-color: #b85c5c; }

  /* ── HEADER ── */
  .vd-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; animation: fadeUp 0.5s ease both; }
  .vd-eyebrow { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .vd-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 300; color: var(--ink); line-height: 1.1; margin-bottom: 6px; text-shadow: 0 1px 0 rgba(255,255,255,0.6); }
  .vd-subtitle { font-size: 13.5px; color: var(--muted); }
  .vd-add-btn { display: inline-block; padding: 12px 24px; background: var(--ink); color: var(--white); text-decoration: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; letter-spacing: 0.03em; transition: all 0.22s ease; white-space: nowrap; }
  .vd-add-btn:hover { background: var(--gold); color: var(--ink); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,168,76,0.3); }
  .vd-avail-section { display: flex; align-items: center; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
  .vd-avail-text { font-size: 13px; color: var(--muted); font-style: italic; }
  .vd-avail-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; background: var(--white); border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: var(--ink); cursor: pointer; transition: all 0.22s; white-space: nowrap; }
  .vd-avail-btn:hover:not(:disabled) { background: rgba(201,168,76,0.07); border-color: var(--gold); color: var(--gold); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(201,168,76,0.15); }
  .vd-avail-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .vd-avail-btn-icon { font-size: 1rem; line-height: 1; }

  /* ── STATS ── */
  .vd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; animation: fadeUp 0.5s ease 0.1s both; }
  @media (max-width: 800px) { .vd-stats { grid-template-columns: repeat(2, 1fr); } }
  .vd-stat-card { background: var(--white); border: 1px solid var(--border); border-radius: 14px; padding: 22px 20px; display: flex; flex-direction: column; gap: 6px; transition: box-shadow 0.2s, transform 0.2s; box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), var(--shadow-sm); }
  .vd-stat-card:hover { box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), var(--shadow-md); transform: translateY(-2px); }
  .vd-stat-icon { font-size: 1.4rem; }
  .vd-stat-value { font-family: 'Cormorant Garamond', serif; font-size: 2.4rem; font-weight: 600; line-height: 1; transition: color 0.2s; }
  .vd-stat-label { font-size: 11.5px; color: var(--muted); }

  /* ── DCR ALERT ── */
  .vd-dcr-alert { display: flex; align-items: center; gap: 12px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.28); border-radius: 12px; padding: 14px 18px; margin-bottom: 32px; cursor: pointer; transition: background 0.2s; font-size: 13.5px; color: var(--ink); animation: fadeUp 0.4s ease both; }
  .vd-dcr-alert:hover { background: rgba(201,168,76,0.14); }
  .vd-dcr-alert-icon { font-size: 1.3rem; flex-shrink: 0; }
  .vd-dcr-alert-cta { margin-left: auto; color: var(--gold); font-weight: 500; font-size: 13px; white-space: nowrap; }

  /* ── SECTIONS ── */
  .vd-section { margin-bottom: 56px; animation: fadeUp 0.5s ease 0.15s both; }
  .vd-section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
  .vd-section-title { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: var(--ink); margin-bottom: 3px; }
  .vd-section-sub { font-size: 12.5px; color: var(--muted); }
  .vd-section-add { font-size: 12.5px; color: var(--gold); text-decoration: none; font-weight: 500; border: 1px solid var(--border); padding: 6px 14px; border-radius: 6px; transition: all 0.2s; white-space: nowrap; }
  .vd-section-add:hover { background: rgba(201,168,76,0.07); border-color: var(--gold); }

  /* ── SERVICE TYPE FILTER TABS (NEW) ── */
  .vd-svc-type-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .vd-svc-type-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--white);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .vd-svc-type-tab:hover {
    border-color: var(--gold);
    color: var(--ink);
    background: rgba(201,168,76,0.04);
  }
  .vd-svc-type-tab.active {
    background: var(--ink);
    color: var(--white);
    border-color: var(--ink);
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(14,12,10,0.15);
  }
  .vd-svc-type-tab-emoji {
    font-size: 14px;
    line-height: 1;
  }
  .vd-svc-type-tab-count {
    font-size: 10.5px;
    padding: 1px 7px;
    border-radius: 20px;
    background: rgba(255,255,255,0.15);
    color: inherit;
    opacity: 0.8;
    font-weight: 400;
    min-width: 20px;
    text-align: center;
  }
  .vd-svc-type-tab:not(.active) .vd-svc-type-tab-count {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
  }
  @media (max-width: 600px) {
    .vd-svc-type-tabs { gap: 5px; }
    .vd-svc-type-tab { padding: 7px 12px; font-size: 12px; }
  }

  .vd-svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  @media (max-width: 900px) { .vd-svc-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .vd-svc-grid { grid-template-columns: 1fr; } }
  .vd-svc-card-wrapper { animation: fadeUp 0.45s ease both; }
  .vd-svc-empty { background: var(--white); border: 1px dashed rgba(201,168,76,0.35); border-radius: 12px; padding: 48px 24px; text-align: center; }
  .vd-svc-empty-icon { font-size: 2.2rem; display: block; margin-bottom: 12px; }
  .vd-svc-empty-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .vd-svc-empty-sub { font-size: 13px; color: var(--muted); }

  /* ── SEARCH BAR ── */
  .vd-search-wrap { position: relative; display: flex; align-items: center; margin-bottom: 16px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }
  .vd-search-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.12); }
  .vd-search-icon { position: absolute; left: 14px; font-size: 14px; pointer-events: none; opacity: 0.5; }
  .vd-search-input { width: 100%; padding: 11px 40px 11px 40px; background: none; border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--ink); }
  .vd-search-input::placeholder { color: var(--muted); opacity: 0.7; }
  .vd-search-clear { position: absolute; right: 12px; background: none; border: none; cursor: pointer; font-size: 11px; color: var(--muted); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s; }
  .vd-search-clear:hover { background: rgba(14,12,10,0.07); color: var(--ink); }

  /* ── TABS ── */
  .vd-tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .vd-tab { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: none; border: none; border-bottom: 2px solid transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer; transition: all 0.2s; margin-bottom: -1px; text-transform: capitalize; }
  .vd-tab:hover { color: var(--ink); }
  .vd-tab.active { color: var(--ink); border-bottom-color: var(--gold); font-weight: 500; }
  .vd-tab-count { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1px 8px; font-size: 11px; color: var(--muted); }
  .vd-tab.active .vd-tab-count { background: var(--ink); color: var(--white); border-color: var(--ink); }

  /* ── BOOKING CARDS ── */
  .vd-bookings { display: flex; flex-direction: column; gap: 12px; }
  .vd-booking-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; display: flex; justify-content: space-between; align-items: stretch; animation: fadeUp 0.45s ease both; transition: box-shadow 0.25s, border-color 0.25s, transform 0.2s; overflow: hidden; }
  .vd-booking-card:hover { box-shadow: var(--shadow-md); border-color: rgba(201,168,76,0.4); transform: translateY(-1px); }
  .vd-booking-card-dcr { border-color: rgba(201,168,76,0.4) !important; box-shadow: 0 0 0 2px rgba(201,168,76,0.12) !important; }
  .vd-booking-card-btn { flex: 1; background: none; border: none; text-align: left; cursor: pointer; padding: 22px 20px 22px 24px; display: flex; align-items: flex-start; gap: 0; transition: background 0.2s; min-width: 0; }
  .vd-booking-card-btn:hover { background: rgba(201,168,76,0.03); }
  .vd-booking-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; min-width: 0; }
  .vd-avatar { width: 46px; height: 46px; background: var(--ink); color: var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; flex-shrink: 0; }
  .vd-booking-info { flex: 1; min-width: 0; }
  .vd-booking-name { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
  .vd-booking-email { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  .vd-booking-meta { display: flex; gap: 14px; flex-wrap: wrap; }
  .vd-meta-item { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 4px; }
  .vd-user-details { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
  .vd-detail-chip { font-size: 11.5px; color: #6b6358; line-height: 1.4; max-width: 320px; }
  .vd-booking-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; padding: 22px 20px 22px 12px; border-left: 1px solid rgba(201,168,76,0.1); }
  .vd-status-badge { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; white-space: nowrap; }
  .vd-pay-chip { font-size: 11px; font-weight: 500; padding: 4px 10px; border-radius: 20px; white-space: nowrap; display: flex; align-items: center; gap: 4px; }
  .vd-view-hint { font-size: 11px; color: var(--gold); font-weight: 500; white-space: nowrap; opacity: 0.8; }
  .vd-actions { display: flex; gap: 8px; }
  .vd-accept-btn { padding: 9px 18px; background: rgba(45,106,79,0.1); color: #2d6a4f; border: 1px solid rgba(45,106,79,0.3); border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; min-width: 90px; justify-content: center; }
  .vd-accept-btn:hover:not(:disabled) { background: #2d6a4f; color: var(--white); border-color: #2d6a4f; }
  .vd-reject-btn { padding: 9px 18px; background: rgba(184,92,92,0.08); color: #b85c5c; border: 1px solid rgba(184,92,92,0.25); border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; min-width: 90px; justify-content: center; }
  .vd-reject-btn:hover:not(:disabled) { background: #b85c5c; color: var(--white); border-color: #b85c5c; }
  .vd-accept-btn.loading, .vd-reject-btn.loading { opacity: 0.6; pointer-events: none; }
  .vd-accept-btn:disabled, .vd-reject-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .vd-undo-btn { padding: 7px 14px; background: none; color: var(--muted); border: 1px solid var(--border); border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.2s; }
  .vd-undo-btn:hover { border-color: var(--gold); color: var(--ink); }
  .vd-dcr-pill { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; padding: 8px 12px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.25); border-radius: 8px; font-size: 12px; color: #8a6f1e; cursor: pointer; transition: background 0.2s; font-weight: 500; }
  .vd-dcr-pill:hover { background: rgba(201,168,76,0.14); }
  .vd-dcr-pill-detail { font-weight: 400; color: var(--muted); }
  .vd-dcr-pill-cta { margin-left: auto; color: var(--gold); font-weight: 600; }

  /* ── CLEAR SEARCH ── */
  .vd-clear-search-btn { margin-top: 14px; padding: 9px 20px; background: none; color: var(--gold); border: 1px solid rgba(201,168,76,0.35); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
  .vd-clear-search-btn:hover { background: rgba(201,168,76,0.08); border-color: var(--gold); }

  /* ── SKELETONS / LOADING / EMPTY ── */
  .vd-loading { display: flex; flex-direction: column; gap: 12px; }
  .vd-skeleton { height: 88px; border-radius: 12px; background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }
  .vd-skeleton-card { height: 280px; }
  .vd-empty { text-align: center; padding: 72px 20px; }
  .vd-empty-icon { font-size: 3rem; margin-bottom: 16px; }
  .vd-empty h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
  .vd-empty p { font-size: 13.5px; color: var(--muted); }

  /* ── LEGAL MODAL ── */
  .lm-overlay { position: fixed; inset: 0; background: rgba(14,12,10,0.65); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1500; padding: 20px; animation: fadeIn 0.2s ease both; }
  .lm-modal { position: relative; background: var(--white); border: 1px solid rgba(201,168,76,0.22); border-radius: 24px; width: min(580px, 96vw); max-height: 88vh; display: flex; flex-direction: column; box-shadow: var(--shadow-lg); animation: popupUp 0.32s cubic-bezier(0.34,1.15,0.64,1) both; overflow: hidden; }
  .lm-close { position: absolute; top: 14px; right: 14px; width: 30px; height: 30px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); font-size: 12px; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; z-index: 1; }
  .lm-close:hover { background: var(--ink); color: var(--white); border-color: var(--ink); }
  .lm-header { display: flex; align-items: center; gap: 14px; padding: 28px 32px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .lm-header-icon { width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
  .lm-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: var(--ink); }
  .lm-body { flex: 1; overflow-y: auto; padding: 24px 32px; display: flex; flex-direction: column; gap: 20px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .lm-body::-webkit-scrollbar { width: 4px; }
  .lm-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .lm-section { padding-bottom: 20px; border-bottom: 1px solid rgba(201,168,76,0.1); }
  .lm-section:last-child { border-bottom: none; padding-bottom: 0; }
  .lm-section-heading { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .lm-section-body { font-size: 13.5px; color: #4a4540; line-height: 1.75; }
  .lm-footer { padding: 16px 32px 24px; border-top: 1px solid var(--border); flex-shrink: 0; display: flex; justify-content: flex-end; }
  .lm-close-btn { padding: 11px 28px; background: var(--ink); color: var(--white); border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.22s; }
  .lm-close-btn:hover { background: #2a2420; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,12,10,0.2); }

  /* ── FOOTER ── */
  .vd-footer-bar { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 20px 32px; border-top: 1px solid rgba(201,168,76,0.15); background: rgba(245,240,232,0.8); backdrop-filter: blur(8px); }
  .vd-footer-text { font-size: 11.5px; color: var(--muted); }
  .vd-footer-links { display: flex; gap: 20px; }
  .vd-footer-link { font-size: 11.5px; color: var(--muted); text-decoration: none; transition: color 0.2s; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .vd-footer-link:hover { color: var(--gold); }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .vd-body { padding: 32px 16px 60px; }
    .vd-booking-card { flex-direction: column; }
    .vd-booking-card-btn { padding: 18px 16px; }
    .vd-booking-right { width: 100%; justify-content: flex-start; border-left: none; border-top: 1px solid rgba(201,168,76,0.1); padding: 14px 16px; }
    .vd-header { flex-direction: column; align-items: flex-start; }
    .vd-avail-section { flex-direction: column; align-items: flex-start; }
    .vd-footer-bar { padding: 16px; flex-direction: column; align-items: flex-start; }
    .toast-wrap { top: 70px; }
  }
  @media (max-width: 480px) {
    .vd-stats { grid-template-columns: repeat(2, 1fr); }
    .vd-booking-right { flex-wrap: wrap; }
    .vd-actions { width: 100%; }
    .vd-accept-btn, .vd-reject-btn { flex: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }

  /* ── KEYFRAMES ── */
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes popupUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;