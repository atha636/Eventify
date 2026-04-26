import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import ServiceCard from "../components/ServiceCard";
import Logo from "../components/Logo";

const STATUS_META = {
  pending:  { label: "Pending",  color: "#c9a84c", bg: "rgba(201,168,76,0.1)",  border: "rgba(201,168,76,0.3)"  },
  approved: { label: "Approved", color: "#2d6a4f", bg: "rgba(45,106,79,0.1)",   border: "rgba(45,106,79,0.3)"   },
  rejected: { label: "Rejected", color: "#b85c5c", bg: "rgba(184,92,92,0.1)",   border: "rgba(184,92,92,0.3)"   },
  cancelled:{ label: "Cancelled",color: "#999",    bg: "rgba(150,150,150,0.1)", border: "rgba(150,150,150,0.3)" },
};

const PAY_META = {
  paid:    { label: "Payment Successful", color: "#2d6a4f", bg: "rgba(45,106,79,0.08)",   border: "rgba(45,106,79,0.25)",   icon: "✓" },
  pending: { label: "Payment Pending",    color: "#c9a84c", bg: "rgba(201,168,76,0.08)",  border: "rgba(201,168,76,0.25)",  icon: "⏳" },
  failed:  { label: "Payment Failed",     color: "#b85c5c", bg: "rgba(184,92,92,0.08)",   border: "rgba(184,92,92,0.25)",   icon: "✕" },
};

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
// TOAST NOTIFICATION (replaces ugly browser alert)
// ─────────────────────────────────────────────────────────────
function Toast({ message, type = "info", onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const icons = { info: "ℹ", success: "✓", error: "✕", warning: "⚠" };
  const colors = {
    info:    { color: "#c9a84c", bg: "rgba(201,168,76,0.08)",  border: "rgba(201,168,76,0.28)" },
    success: { color: "#2d6a4f", bg: "rgba(45,106,79,0.08)",   border: "rgba(45,106,79,0.28)"  },
    error:   { color: "#b85c5c", bg: "rgba(184,92,92,0.08)",   border: "rgba(184,92,92,0.28)"  },
    warning: { color: "#c9a84c", bg: "rgba(201,168,76,0.08)",  border: "rgba(201,168,76,0.28)" },
  };
  const c = colors[type] || colors.info;

  return (
    <div className="toast-wrap">
      <div className="toast" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        <span className="toast-icon" style={{ color: c.color, background: `${c.color}18`, border: `1px solid ${c.color}33` }}>
          {icons[type]}
        </span>
        <span className="toast-msg">{message}</span>
        <button className="toast-close" onClick={onDismiss}>✕</button>
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
    } catch (e) {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("en-IN", { month: "long" });

  const unavailableThisMonth = Object.entries(availability).filter(([key, val]) => {
    return val === false && key.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`);
  }).length;

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="ac-overlay" onClick={handleBackdrop}>
      <div className="ac-modal">
        <button className="ac-close" onClick={onClose}>✕</button>

        <div className="ac-header">
          <div className="ac-header-icon">📅</div>
          <div>
            <h2 className="ac-title">Availability Calendar</h2>
            <p className="ac-subtitle">Tell clients when you're available to work</p>
          </div>
        </div>

        {services.length > 1 && (
          <div className="ac-service-select-wrap">
            <label className="ac-label">Manage availability for</label>
            <select
              className="ac-service-select"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              {services.map((s) => (
                <option key={s._id} value={s._id}>{s.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="ac-legend">
          <div className="ac-legend-item">
            <span className="ac-legend-dot ac-dot-available" />
            <span>Available <span className="ac-legend-sub">(default)</span></span>
          </div>
          <div className="ac-legend-item">
            <span className="ac-legend-dot ac-dot-unavailable" />
            <span>Unavailable</span>
          </div>
          <div className="ac-legend-item">
            <span className="ac-legend-dot ac-dot-past" />
            <span>Past date</span>
          </div>
        </div>

        <p className="ac-instruction">
          Click any <strong>future date</strong> to toggle between available and unavailable.
          Dates marked unavailable won't appear in user date-filtered searches.
        </p>

        {loading ? (
          <div className="ac-loading">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="ac-skeleton-day" style={{ animationDelay: `${i * 0.01}s` }} />
            ))}
          </div>
        ) : (
          <>
            <div className="ac-month-nav">
              <button className="ac-nav-btn" onClick={prevMonth}>‹</button>
              <span className="ac-month-label">{monthName} {viewYear}</span>
              <button className="ac-nav-btn" onClick={nextMonth}>›</button>
            </div>

            <div className="ac-grid">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="ac-day-header">{d}</div>
              ))}

              {[...Array(firstDayOfWeek)].map((_, i) => (
                <div key={`empty-${i}`} className="ac-day-cell ac-empty" />
              ))}

              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isPast = key < today;
                const isToday = key === today;
                const isUnavailable = availability[key] === false;

                let cls = "ac-day-cell";
                if (isPast)             cls += " ac-past";
                else if (isUnavailable) cls += " ac-unavailable";
                else                    cls += " ac-available";
                if (isToday)            cls += " ac-today";

                return (
                  <button
                    key={key}
                    className={cls}
                    onClick={() => toggleDate(key)}
                    disabled={isPast}
                    title={isPast ? "Past date" : isUnavailable ? "Click to mark available" : "Click to mark unavailable"}
                  >
                    <span className="ac-day-num">{day}</span>
                    {isUnavailable && <span className="ac-unavail-dot" />}
                  </button>
                );
              })}
            </div>

            {unavailableThisMonth > 0 && (
              <p className="ac-month-stat">
                {unavailableThisMonth} day{unavailableThisMonth !== 1 ? "s" : ""} marked unavailable this month
              </p>
            )}
          </>
        )}

        <div className="ac-footer">
          <button className="ac-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className={`ac-save-btn ${saved ? "ac-saved" : ""}`}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? <span className="ac-spinner" /> : saved ? "✓ Saved!" : "Save Availability"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CONFIRM UNDO POPUP
// ═══════════════════════════════════════════════════════
function ConfirmUndoPopup({ bookingName, onConfirm, onCancel, confirming }) {
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onCancel(); };
  return (
    <div className="cu-overlay" onClick={handleBackdrop}>
      <div className="cu-modal">
        <div className="cu-icon-wrap">↩</div>
        <h3 className="cu-title">Move Back to Pending?</h3>
        <p className="cu-sub">
          This will revert <strong>{bookingName || "this booking"}</strong>'s status from{" "}
          <span className="cu-status-word cu-approved">Approved</span> back to{" "}
          <span className="cu-status-word cu-pending">Pending</span>.
          The client will need to await re-approval.
        </p>
        <div className="cu-btns">
          <button className="cu-cancel-btn" onClick={onCancel} disabled={confirming}>Cancel</button>
          <button className="cu-confirm-btn" onClick={onConfirm} disabled={confirming}>
            {confirming ? <span className="cu-spinner" /> : "↩ Yes, Move to Pending"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BOOKING DETAIL POPUP
// ═══════════════════════════════════════════════════════
function BookingDetailPopup({ booking, onClose, onUpdateStatus, updating, onRequestUndo }) {
  const b       = booking;
  const meta    = STATUS_META[b.status] || STATUS_META.pending;
  const payMeta = PAY_META[b.paymentStatus] || PAY_META.pending;
  const dcr     = b.dateChangeRequest;
  const hasDcr  = dcr?.status === "pending";

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="bd-overlay" onClick={handleBackdrop}>
      <div className="bd-modal">
        <button className="bd-close" onClick={onClose}>✕</button>

        <div className="bd-top">
          <div className="bd-avatar">{b.userId?.name?.charAt(0)?.toUpperCase() || "?"}</div>
          <div className="bd-top-info">
            <h2 className="bd-name">{b.userId?.name || "Unknown Client"}</h2>
            <p className="bd-email">{b.userId?.email || ""}</p>
          </div>
          <span className="bd-status-badge" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
            {meta.label}
          </span>
        </div>

        <div className="bd-pay-banner" style={{ background: payMeta.bg, border: `1px solid ${payMeta.border}` }}>
          <div className="bd-pay-icon-wrap" style={{ color: payMeta.color }}>
            <span>{payMeta.icon}</span>
          </div>
          <div className="bd-pay-info">
            <span className="bd-pay-label" style={{ color: payMeta.color }}>{payMeta.label}</span>
            {b.paymentStatus === "paid"    && b.paidAt && <span className="bd-pay-time">Paid on {fmtTime(b.paidAt)}</span>}
            {b.paymentStatus === "pending" && <span className="bd-pay-time">Awaiting payment from client</span>}
            {b.paymentStatus === "failed"  && <span className="bd-pay-time">Payment was not completed</span>}
          </div>
          {b.paymentStatus === "paid" && (
            <span className="bd-pay-amount">₹{b.packagePrice?.toLocaleString()}</span>
          )}
        </div>

        <div className="bd-grid">
          <div className="bd-info-block">
            <span className="bd-info-label">Booking Date</span>
            <span className="bd-info-value">🗓 {fmt(b.date)}</span>
          </div>
          <div className="bd-info-block">
            <span className="bd-info-label">Package</span>
            <span className="bd-info-value">📦 {b.packageName || "—"}</span>
          </div>
          <div className="bd-info-block">
            <span className="bd-info-label">Package Price</span>
            <span className="bd-info-value">₹ {b.packagePrice?.toLocaleString() || "—"}</span>
          </div>
          <div className="bd-info-block">
            <span className="bd-info-label">Booked On</span>
            <span className="bd-info-value">{b.createdAt ? fmtTime(b.createdAt) : "—"}</span>
          </div>
        </div>

        <div className="bd-section-title">Client Details</div>
        <div className="bd-client-details">
          {b.userDetails?.name && (
            <div className="bd-detail-row">
              <span className="bd-detail-icon">👤</span>
              <div>
                <span className="bd-detail-label">Name on Booking</span>
                <span className="bd-detail-value">{b.userDetails.name}</span>
              </div>
            </div>
          )}
          {b.userDetails?.phone && (
            <div className="bd-detail-row">
              <span className="bd-detail-icon">📱</span>
              <div>
                <span className="bd-detail-label">Phone</span>
                <span className="bd-detail-value">{b.userDetails.phone}</span>
              </div>
            </div>
          )}
          {b.userDetails?.address && (
            <div className="bd-detail-row">
              <span className="bd-detail-icon">📍</span>
              <div>
                <span className="bd-detail-label">Address</span>
                <span className="bd-detail-value">{b.userDetails.address}</span>
              </div>
            </div>
          )}
        </div>

        {hasDcr && (
          <div className="bd-dcr-box">
            <div className="bd-dcr-header">
              <span className="bd-dcr-tag">📅 Change Request Pending</span>
            </div>
            {dcr.requestedDate && (
              <div className="bd-dcr-row">
                <span className="bd-dcr-key">New Date</span>
                <span className="bd-dcr-val">{fmt(dcr.requestedDate)}</span>
              </div>
            )}
            {dcr.requestedAddress && (
              <div className="bd-dcr-row">
                <span className="bd-dcr-key">New Address</span>
                <span className="bd-dcr-val">{dcr.requestedAddress}</span>
              </div>
            )}
            {dcr.reason && <div className="bd-dcr-reason">"{dcr.reason}"</div>}
          </div>
        )}

        {b.status === "pending" && (
          <div className="bd-actions">
            <button className="bd-reject-btn" onClick={() => onUpdateStatus(b._id, "rejected")} disabled={!!updating}>
              {updating === b._id + "rejected" ? <span className="bd-spinner bd-spinner-dark" /> : "✕ Reject Booking"}
            </button>
            <button className="bd-accept-btn" onClick={() => onUpdateStatus(b._id, "approved")} disabled={!!updating}>
              {updating === b._id + "approved" ? <span className="bd-spinner" /> : "✓ Approve Booking"}
            </button>
          </div>
        )}

        {b.status === "approved" && !hasDcr && (
          <div className="bd-actions">
            <button className="bd-undo-btn" onClick={() => onRequestUndo(b)} disabled={!!updating}>
              ↩ Move back to Pending
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DATE CHANGE POPUP
// ═══════════════════════════════════════════════════════
function DateChangePopup({ booking, onAccept, onReject, responding }) {
  const dcr    = booking.dateChangeRequest;
  const client = booking.userId?.name || "The client";
  const changeItems = [];
  if (dcr.requestedDate)    changeItems.push({ icon: "🗓", label: "New Date",    value: fmt(dcr.requestedDate) });
  if (dcr.requestedAddress) changeItems.push({ icon: "📍", label: "New Address", value: dcr.requestedAddress   });

  return (
    <div className="vd-popup-overlay">
      <div className="vd-popup">
        <div className="vd-popup-icon-wrap">📅</div>
        <h3 className="vd-popup-title">Client Wants to Change Booking</h3>
        <p className="vd-popup-sub">
          <strong>{client}</strong> has requested the following changes to their booking.
        </p>
        <div className="vd-popup-changes">
          {changeItems.map((item) => (
            <div key={item.label} className="vd-popup-change-row">
              <span className="vd-popup-change-icon">{item.icon}</span>
              <div>
                <span className="vd-popup-change-label">{item.label}</span>
                <span className="vd-popup-change-value">{item.value}</span>
              </div>
            </div>
          ))}
          {dcr.reason && (
            <div className="vd-popup-reason">
              <span className="vd-popup-reason-label">Client's reason:</span>
              <span className="vd-popup-reason-text">"{dcr.reason}"</span>
            </div>
          )}
        </div>
        <div className="vd-popup-current">
          <span className="vd-popup-current-label">Current:</span>
          <span>{fmt(booking.date)}</span>
          {booking.userDetails?.address && <span>· {booking.userDetails.address}</span>}
        </div>
        <div className="vd-popup-btns">
          <button className="vd-popup-reject-btn" onClick={onReject} disabled={responding}>
            {responding === "reject" ? <span className="vd-spinner vd-spinner-dark" /> : "✕ Decline"}
          </button>
          <button className="vd-popup-accept-btn" onClick={onAccept} disabled={responding}>
            {responding === "approve" ? <span className="vd-spinner" /> : "✓ Accept Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════
export default function VendorDashboard() {
  const [bookings,         setBookings]         = useState([]);
  const [services,         setServices]         = useState([]);
  const [loadingB,         setLoadingB]         = useState(true);
  const [loadingS,         setLoadingS]         = useState(true);
  const [updating,         setUpdating]         = useState(null);
  const [filter,           setFilter]           = useState("all");
  const [popupBooking,     setPopupBooking]     = useState(null);
  const [responding,       setResponding]       = useState(null);
  const [detailBooking,    setDetailBooking]    = useState(null);
  const [undoTarget,       setUndoTarget]       = useState(null);
  const [confirming,       setConfirming]       = useState(false);
  const [showAvailCal,     setShowAvailCal]     = useState(false);
  // ── TOAST STATE (replaces browser alert) ──
  const [toast,            setToast]            = useState(null); // { message, type }

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

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

  useEffect(() => { fetchBookings(); fetchServices(); }, []);

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem("token");
    setUpdating(id + status);
    try {
      await API.put(`/bookings/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchBookings();
      setDetailBooking((prev) => prev && prev._id === id ? { ...prev, status } : prev);
    } finally {
      setUpdating(null);
    }
  };

  const handleRequestUndo = (booking) => setUndoTarget(booking);

  const handleConfirmUndo = async () => {
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

  const handleCancelUndo = () => setUndoTarget(null);

  const handleAcceptChange = async () => {
    if (!popupBooking) return;
    setResponding("approve");
    try {
      await API.put(`/bookings/${popupBooking._id}/date-change`, { action: "approve" });
      setPopupBooking(null);
      await fetchBookings();
    } catch (e) { console.error(e); }
    finally { setResponding(null); }
  };

  const handleRejectChange = async () => {
    if (!popupBooking) return;
    setResponding("reject");
    try {
      await API.put(`/bookings/${popupBooking._id}/date-change`, { action: "reject" });
      setPopupBooking(null);
      await fetchBookings();
    } catch (e) { console.error(e); }
    finally { setResponding(null); }
  };

  const handleServiceDeleted = (id) => setServices((p) => p.filter((s) => s._id !== id));

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const counts   = {
    all:      bookings.length,
    pending:  bookings.filter((b) => b.status === "pending").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };
  const pendingDcrCount = bookings.filter((b) => b.dateChangeRequest?.status === "pending").length;

  return (
    <>
      <style>{styles}</style>
      <div className="vd-root">
        <Navbar />

        {/* ── TOAST ── */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}

        {/* ── DATE CHANGE POPUP ── */}
        {popupBooking && (
          <DateChangePopup
            booking={popupBooking}
            onAccept={handleAcceptChange}
            onReject={handleRejectChange}
            responding={responding}
          />
        )}

        {/* ── BOOKING DETAIL POPUP ── */}
        {detailBooking && (
          <BookingDetailPopup
            booking={detailBooking}
            onClose={() => setDetailBooking(null)}
            onUpdateStatus={updateStatus}
            updating={updating}
            onRequestUndo={handleRequestUndo}
          />
        )}

        {/* ── CONFIRM UNDO POPUP ── */}
        {undoTarget && (
          <ConfirmUndoPopup
            bookingName={undoTarget.userId?.name}
            onConfirm={handleConfirmUndo}
            onCancel={handleCancelUndo}
            confirming={confirming}
          />
        )}

        {/* ── AVAILABILITY CALENDAR MODAL ── */}
        {showAvailCal && services.length > 0 && (
          <AvailabilityCalendar
            services={services}
            onClose={() => setShowAvailCal(false)}
          />
        )}

        <div className="vd-body">

          {/* ── HEADER ── */}
          <div className="vd-header">
            <div className="vd-header-left">
              <p className="vd-eyebrow"> Portal</p>
              <h1 className="vd-title">Dashboard</h1>
              <p className="vd-subtitle">Manage your bookings and services</p>

              {/* ─── AVAILABILITY SECTION ─── */}
              <div className="vd-avail-section">
                <p className="vd-avail-text">Tell us about your availability</p>
                <button
                  className="vd-avail-btn"
                  onClick={() => {
                    if (loadingS) return;
                    if (services.length === 0) {
                      // ✅ Styled toast instead of ugly browser alert
                      showToast("Add at least one service before setting availability.", "warning");
                      return;
                    }
                    setShowAvailCal(true);
                  }}
                  disabled={loadingS}
                >
                  <span className="vd-avail-btn-icon">📅</span>
                  Manage Calendar
                </button>
              </div>
            </div>
            <a href="/add-service" className="vd-add-btn">+ Add New Service</a>
          </div>

          {/* ── STATS ── */}
          <div className="vd-stats">
            {[
              { label: "Total Bookings", value: counts.all,      icon: "📋" },
              { label: "Pending",        value: counts.pending,  icon: "⏳" },
              { label: "Approved",       value: counts.approved, icon: "✓"  },
              { label: "Rejected",       value: counts.rejected, icon: "✕"  },
            ].map((s) => (
              <div key={s.label} className="vd-stat-card">
                <span className="vd-stat-icon">{s.icon}</span>
                <span className="vd-stat-value">{s.value}</span>
                <span className="vd-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── DCR ALERT ── */}
          {pendingDcrCount > 0 && (
            <div className="vd-dcr-alert" onClick={() => {
              const first = bookings.find((b) => b.dateChangeRequest?.status === "pending");
              if (first) setPopupBooking(first);
            }}>
              <span className="vd-dcr-alert-icon">📅</span>
              <div>
                <strong>{pendingDcrCount} client{pendingDcrCount !== 1 ? "s" : ""}</strong>{" "}
                want{pendingDcrCount === 1 ? "s" : ""} to change their booking details
              </div>
              <span className="vd-dcr-alert-cta">Review →</span>
            </div>
          )}

          {/* ── MY SERVICES ── */}
          <div className="vd-section">
            <div className="vd-section-header">
              <div>
                <h2 className="vd-section-title">My Services</h2>
                <p className="vd-section-sub">
                  {loadingS ? "Loading…" : `${services.length} service${services.length !== 1 ? "s" : ""} listed`}
                </p>
              </div>
              <a href="/add-service" className="vd-section-add">+ New Service</a>
            </div>
            {loadingS ? (
              <div className="vd-svc-grid">
                {[...Array(3)].map((_, i) => <div key={i} className="vd-skeleton vd-skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />)}
              </div>
            ) : services.length === 0 ? (
              <div className="vd-svc-empty">
                <span className="vd-svc-empty-icon">🏷</span>
                <p className="vd-svc-empty-title">No services yet</p>
                <p className="vd-svc-empty-sub">Add your first service to start receiving bookings.</p>
                <a href="/add-service" className="vd-add-btn" style={{ marginTop: 16, display: "inline-block" }}>+ Add Service</a>
              </div>
            ) : (
              <div className="vd-svc-grid">
                {services.map((v, i) => (
                  <div key={v._id} style={{ animationDelay: `${i * 0.06}s` }} className="vd-svc-card-wrapper">
                    <ServiceCard vendor={v} showDelete={true} onDeleted={handleServiceDeleted} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── BOOKINGS ── */}
          <div className="vd-section">
            <div className="vd-section-header">
              <div>
                <h2 className="vd-section-title">Bookings</h2>
                <p className="vd-section-sub">Click any booking card to view full details</p>
              </div>
            </div>

            <div className="vd-tabs">
              {["all", "pending", "approved", "rejected"].map((tab) => (
                <button key={tab} className={`vd-tab ${filter === tab ? "active" : ""}`} onClick={() => setFilter(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="vd-tab-count">{counts[tab]}</span>
                </button>
              ))}
            </div>

            {loadingB ? (
              <div className="vd-loading">
                {[...Array(3)].map((_, i) => <div key={i} className="vd-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="vd-empty">
                <div className="vd-empty-icon">📭</div>
                <h3>No bookings found</h3>
                <p>{filter === "all" ? "You haven't received any bookings yet." : `No ${filter} bookings.`}</p>
              </div>
            ) : (
              <div className="vd-bookings">
                {filtered.map((b, i) => {
                  const meta    = STATUS_META[b.status] || STATUS_META.pending;
                  const payMeta = PAY_META[b.paymentStatus] || PAY_META.pending;
                  const dcr     = b.dateChangeRequest;
                  const hasDcr  = dcr?.status === "pending";

                  return (
                    <div
                      key={b._id}
                      className={`vd-booking-card ${hasDcr ? "vd-booking-card-dcr" : ""}`}
                      style={{ animationDelay: `${i * 0.06}s`, cursor: "pointer" }}
                      onClick={() => setDetailBooking(b)}
                    >
                      <div className="vd-booking-left">
                        <div className="vd-avatar">{b.userId?.name?.charAt(0)?.toUpperCase() || "?"}</div>
                        <div className="vd-booking-info">
                          <h3 className="vd-booking-name">{b.userId?.name || "Unknown Client"}</h3>
                          <p className="vd-booking-email">{b.userId?.email || ""}</p>
                          <div className="vd-booking-meta">
                            <span className="vd-meta-item">
                              🗓 {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
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
                            <div className="vd-dcr-pill" onClick={(e) => { e.stopPropagation(); setPopupBooking(b); }}>
                              <span>📅 Client wants changes</span>
                              {dcr.requestedDate    && <span className="vd-dcr-pill-detail">Date → {fmt(dcr.requestedDate)}</span>}
                              {dcr.requestedAddress && <span className="vd-dcr-pill-detail">Addr → {dcr.requestedAddress}</span>}
                              <span className="vd-dcr-pill-cta">Review →</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="vd-booking-right" onClick={(e) => e.stopPropagation()}>
                        <span className="vd-pay-chip" style={{ color: payMeta.color, background: payMeta.bg, border: `1px solid ${payMeta.border}` }}>
                          {payMeta.icon} {payMeta.label}
                        </span>
                        <span className="vd-status-badge" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                          {meta.label}
                        </span>
                        {b.status === "pending" && (
                          <div className="vd-actions">
                            <button
                              className={`vd-accept-btn ${updating === b._id + "approved" ? "loading" : ""}`}
                              onClick={(e) => { e.stopPropagation(); updateStatus(b._id, "approved"); }}
                              disabled={!!updating}
                            >
                              {updating === b._id + "approved" ? <span className="vd-spinner" /> : "✓ Accept"}
                            </button>
                            <button
                              className={`vd-reject-btn ${updating === b._id + "rejected" ? "loading" : ""}`}
                              onClick={(e) => { e.stopPropagation(); updateStatus(b._id, "rejected"); }}
                              disabled={!!updating}
                            >
                              {updating === b._id + "rejected" ? <span className="vd-spinner vd-spinner-dark" /> : "✕ Reject"}
                            </button>
                          </div>
                        )}
                        {b.status === "approved" && !hasDcr && (
                          <button
                            className="vd-undo-btn"
                            onClick={(e) => { e.stopPropagation(); handleRequestUndo(b); }}
                          >
                            Undo
                          </button>
                        )}
                        <span className="vd-view-hint">View details →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --muted: #7a7265; --border: rgba(201,168,76,0.2); --surface: #faf7f2; --white: #ffffff;
  }

  .vd-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }
  .vd-body { width: 100%; max-width: 1200px; margin: 0 auto; padding: 48px 32px 80px; }

  /* ═══════════════════════════════════════════
     TOAST NOTIFICATION (replaces browser alert)
  ═══════════════════════════════════════════ */
  .toast-wrap {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    width: min(420px, 92vw);
    animation: toastIn 0.32s cubic-bezier(0.34, 1.2, 0.64, 1) both;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    backdrop-filter: blur(12px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
  }
  .toast-icon {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
  }
  .toast-msg {
    flex: 1;
    font-size: 13.5px;
    color: var(--ink);
    line-height: 1.5;
    font-family: 'DM Sans', sans-serif;
  }
  .toast-close {
    background: none; border: none; cursor: pointer;
    font-size: 11px; color: var(--muted);
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.2s, color 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .toast-close:hover { background: rgba(14,12,10,0.08); color: var(--ink); }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.95); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
  }

  /* ═══════════════════════════════════════════
     AVAILABILITY CALENDAR BUTTON
  ═══════════════════════════════════════════ */
  .vd-avail-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
    flex-wrap: wrap;
  }
  .vd-avail-text {
    font-size: 13px;
    color: var(--muted);
    font-style: italic;
  }
  .vd-avail-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.22s;
    white-space: nowrap;
  }
  .vd-avail-btn:hover:not(:disabled) {
    background: rgba(201,168,76,0.07);
    border-color: var(--gold);
    color: var(--gold);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(201,168,76,0.15);
  }
  .vd-avail-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .vd-avail-btn-icon { font-size: 1rem; line-height: 1; }

  /* ═══════════════════════════════════════════
     AVAILABILITY CALENDAR MODAL
  ═══════════════════════════════════════════ */
  .ac-overlay {
    position: fixed; inset: 0;
    background: rgba(14,12,10,0.7); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1400; padding: 16px;
    animation: fadeIn 0.2s ease both;
  }
  .ac-modal {
    position: relative;
    background: var(--white);
    border: 1px solid rgba(201,168,76,0.22);
    border-radius: 24px;
    padding: 36px 32px 28px;
    width: min(600px, 98vw);
    max-height: 96vh;
    overflow-y: auto;
    box-shadow: 0 40px 100px rgba(0,0,0,0.28);
    animation: popupUp 0.32s cubic-bezier(0.34,1.15,0.64,1) both;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }
  .ac-modal::-webkit-scrollbar { width: 4px; }
  .ac-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .ac-close {
    position: absolute; top: 14px; right: 14px;
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--surface); border: 1px solid var(--border);
    font-size: 12px; color: var(--muted); cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif;
  }
  .ac-close:hover { background: var(--ink); color: var(--white); border-color: var(--ink); }

  .ac-header {
    display: flex; align-items: center; gap: 14px; margin-bottom: 22px;
  }
  .ac-header-icon {
    width: 48px; height: 48px; flex-shrink: 0;
    border-radius: 12px;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem;
  }
  .ac-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 600; color: var(--ink); margin-bottom: 3px;
  }
  .ac-subtitle { font-size: 12.5px; color: var(--muted); }

  .ac-service-select-wrap { margin-bottom: 18px; }
  .ac-label {
    display: block; font-size: 10.5px; font-weight: 500;
    letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
    margin-bottom: 6px;
  }
  .ac-service-select {
    width: 100%; padding: 9px 12px;
    border: 1px solid var(--border); border-radius: 8px;
    background: var(--surface);
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink);
    outline: none; cursor: pointer; transition: border-color 0.2s;
  }
  .ac-service-select:focus { border-color: var(--gold); }

  .ac-legend {
    display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .ac-legend-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--muted);
  }
  .ac-legend-dot {
    width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0;
  }
  .ac-dot-available   { background: rgba(45,106,79,0.15); border: 1.5px solid rgba(45,106,79,0.4); }
  .ac-dot-unavailable { background: rgba(184,92,92,0.15); border: 1.5px solid rgba(184,92,92,0.4); }
  .ac-dot-past        { background: rgba(122,114,101,0.12); border: 1.5px solid rgba(122,114,101,0.25); }
  .ac-legend-sub { font-size: 10.5px; opacity: 0.7; }

  .ac-instruction {
    font-size: 12.5px; color: var(--muted); line-height: 1.6;
    margin-bottom: 18px; padding: 10px 14px;
    background: rgba(201,168,76,0.05);
    border: 1px solid rgba(201,168,76,0.18);
    border-radius: 8px;
  }
  .ac-instruction strong { color: var(--ink); }

  .ac-month-nav {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }
  .ac-nav-btn {
    width: 34px; height: 34px; border-radius: 8px;
    background: var(--surface); border: 1px solid var(--border);
    font-size: 18px; color: var(--muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; line-height: 1;
  }
  .ac-nav-btn:hover { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.06); }
  .ac-month-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem; font-weight: 600; color: var(--ink);
  }

  .ac-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 14px;
  }
  .ac-day-header {
    text-align: center; font-size: 10px; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); padding: 6px 0;
  }
  .ac-day-cell {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    border: 1.5px solid transparent;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
    background: none;
    min-height: 36px;
  }
  .ac-day-cell.ac-empty { background: none; border: none; cursor: default; }
  .ac-day-cell.ac-available {
    background: rgba(45,106,79,0.07);
    border-color: rgba(45,106,79,0.2);
  }
  .ac-day-cell.ac-available:hover {
    background: rgba(184,92,92,0.1);
    border-color: rgba(184,92,92,0.35);
    transform: scale(1.06);
  }
  .ac-day-cell.ac-unavailable {
    background: rgba(184,92,92,0.1);
    border-color: rgba(184,92,92,0.35);
  }
  .ac-day-cell.ac-unavailable:hover {
    background: rgba(45,106,79,0.1);
    border-color: rgba(45,106,79,0.3);
    transform: scale(1.06);
  }
  .ac-day-cell.ac-past {
    background: rgba(122,114,101,0.06);
    border-color: transparent;
    cursor: not-allowed; opacity: 0.45;
  }
  .ac-day-cell.ac-today .ac-day-num {
    background: var(--gold);
    color: var(--white);
    width: 22px; height: 22px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 600; font-size: 11px;
  }
  .ac-day-num { font-size: 12px; color: var(--ink); line-height: 1; }
  .ac-unavail-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: #b85c5c; margin-top: 2px;
  }
  .ac-month-stat {
    font-size: 11.5px; color: var(--muted); text-align: center;
    margin-bottom: 8px;
    padding: 6px 12px;
    background: rgba(184,92,92,0.06);
    border: 1px solid rgba(184,92,92,0.18);
    border-radius: 20px;
    display: inline-block;
    margin-left: 50%;
    transform: translateX(-50%);
  }
  .ac-loading {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 14px;
  }
  .ac-skeleton-day {
    aspect-ratio: 1; border-radius: 8px;
    background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease infinite;
  }
  .ac-footer {
    display: flex; gap: 10px; padding-top: 18px;
    border-top: 1px solid var(--border);
    margin-top: 8px;
  }
  .ac-cancel-btn {
    flex: 1; padding: 12px 16px;
    background: none; color: var(--muted);
    border: 1px solid var(--border); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    cursor: pointer; transition: all 0.2s;
  }
  .ac-cancel-btn:hover { border-color: var(--gold); color: var(--ink); }
  .ac-save-btn {
    flex: 2; padding: 12px 16px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.22s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .ac-save-btn:hover:not(:disabled) {
    background: #2a2420; transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(14,12,10,0.2);
  }
  .ac-save-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .ac-save-btn.ac-saved { background: #2d6a4f; }
  .ac-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }

  @media (max-width: 480px) {
    .ac-modal { padding: 24px 16px 20px; }
    .ac-day-cell { min-height: 30px; border-radius: 6px; }
    .ac-day-num { font-size: 10px; }
    .ac-day-header { font-size: 8.5px; }
    .ac-footer { flex-direction: column; }
    .ac-month-label { font-size: 1rem; }
  }

  /* ═══════════════════════════════════════════
     CONFIRM UNDO POPUP
  ═══════════════════════════════════════════ */
  .cu-overlay {
    position: fixed; inset: 0;
    background: rgba(14,12,10,0.65); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1300; padding: 20px;
    animation: fadeIn 0.18s ease both;
  }
  .cu-modal {
    background: var(--white);
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 20px;
    padding: 36px 32px 30px;
    width: min(440px, 95vw);
    box-shadow: 0 32px 80px rgba(0,0,0,0.22);
    animation: popupUp 0.28s cubic-bezier(0.34,1.2,0.64,1) both;
    text-align: center;
  }
  .cu-icon-wrap {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(201,168,76,0.08);
    border: 1px solid rgba(201,168,76,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; color: var(--gold);
    margin: 0 auto 20px;
    font-family: 'DM Sans', sans-serif;
  }
  .cu-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.55rem; font-weight: 600;
    color: var(--ink); margin-bottom: 12px;
  }
  .cu-sub { font-size: 13.5px; color: var(--muted); line-height: 1.7; margin-bottom: 28px; }
  .cu-sub strong { color: var(--ink); font-weight: 500; }
  .cu-status-word {
    display: inline-block; font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 2px 10px; border-radius: 20px;
  }
  .cu-approved { color: #2d6a4f; background: rgba(45,106,79,0.1); border: 1px solid rgba(45,106,79,0.25); }
  .cu-pending  { color: #c9a84c; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3); }
  .cu-btns { display: flex; gap: 10px; }
  .cu-cancel-btn {
    flex: 1; padding: 13px 16px;
    background: none; color: var(--muted);
    border: 1px solid var(--border); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    cursor: pointer; transition: all 0.2s;
  }
  .cu-cancel-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--ink); }
  .cu-cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .cu-confirm-btn {
    flex: 2; padding: 13px 16px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.22s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .cu-confirm-btn:hover:not(:disabled) { background: #2a2420; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,12,10,0.2); }
  .cu-confirm-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .cu-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }

  /* ═══════════════════════════════════════════
     BOOKING DETAIL POPUP
  ═══════════════════════════════════════════ */
  .bd-overlay { position: fixed; inset: 0; background: rgba(14,12,10,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 20px; animation: fadeIn 0.2s ease both; }
  .bd-modal { position: relative; background: var(--white); border: 1px solid rgba(201,168,76,0.2); border-radius: 24px; padding: 40px 36px 32px; width: min(580px, 95vw); max-height: 90vh; overflow-y: auto; box-shadow: 0 40px 100px rgba(0,0,0,0.22); animation: popupUp 0.3s cubic-bezier(0.34,1.15,0.64,1) both; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .bd-modal::-webkit-scrollbar { width: 4px; }
  .bd-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .bd-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); font-size: 13px; color: var(--muted); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; }
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
  .bd-pay-amount { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: #2d6a4f; flex-shrink: 0; }
  .bd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .bd-info-block { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 5px; }
  .bd-info-label { font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .bd-info-value { font-size: 13.5px; color: var(--ink); font-weight: 500; }
  .bd-section-title { font-size: 10px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  .bd-client-details { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; }
  .bd-detail-row { display: flex; align-items: flex-start; gap: 12px; }
  .bd-detail-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; }
  .bd-detail-label { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
  .bd-detail-value { font-size: 13.5px; color: var(--ink); }
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

  /* ═══════════════════════════════════════════
     DATE CHANGE POPUP
  ═══════════════════════════════════════════ */
  .vd-popup-overlay { position: fixed; inset: 0; background: rgba(14,12,10,0.65); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1200; padding: 20px; animation: fadeIn 0.2s ease both; }
  .vd-popup { background: var(--white); border: 1px solid rgba(201,168,76,0.25); border-radius: 20px; padding: 36px 32px 30px; width: min(500px, 95vw); box-shadow: 0 32px 80px rgba(0,0,0,0.2); animation: popupUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both; }
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
  .vd-popup-reason-text { font-size: 13px; color: var(--muted); font-style: italic; }
  .vd-popup-current { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--muted); margin-bottom: 24px; padding: 8px 12px; background: rgba(122,114,101,0.06); border-radius: 8px; }
  .vd-popup-current-label { font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; }
  .vd-popup-btns { display: flex; gap: 10px; }
  .vd-popup-reject-btn { flex: 1; padding: 13px 16px; background: rgba(184,92,92,0.08); color: #b85c5c; border: 1px solid rgba(184,92,92,0.25); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.22s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .vd-popup-reject-btn:hover:not(:disabled) { background: #b85c5c; color: white; border-color: #b85c5c; }
  .vd-popup-reject-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .vd-popup-accept-btn { flex: 2; padding: 13px 16px; background: #2d6a4f; color: white; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.22s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .vd-popup-accept-btn:hover:not(:disabled) { background: #1e4f39; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,106,79,0.3); }
  .vd-popup-accept-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  /* ═══════════════════════════════════════════
     HEADER
  ═══════════════════════════════════════════ */
  .vd-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; animation: fadeUp 0.5s ease both; }
  .vd-eyebrow { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .vd-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 300; color: var(--ink); line-height: 1.1; margin-bottom: 6px; }
  .vd-subtitle { font-size: 13.5px; color: var(--muted); }
  .vd-add-btn { display: inline-block; padding: 12px 24px; background: var(--ink); color: var(--white); text-decoration: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; letter-spacing: 0.03em; transition: all 0.22s ease; white-space: nowrap; }
  .vd-add-btn:hover { background: var(--gold); color: var(--ink); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,168,76,0.3); }

  /* ═══════════════════════════════════════════
     STATS
  ═══════════════════════════════════════════ */
  .vd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; animation: fadeUp 0.5s ease 0.1s both; }
  @media (max-width: 800px) { .vd-stats { grid-template-columns: repeat(2, 1fr); } }
  .vd-stat-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 22px 20px; display: flex; flex-direction: column; gap: 6px; transition: box-shadow 0.2s, transform 0.2s; }
  .vd-stat-card:hover { box-shadow: 0 6px 24px rgba(201,168,76,0.12); transform: translateY(-2px); }
  .vd-stat-icon { font-size: 1.4rem; }
  .vd-stat-value { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 600; color: var(--ink); line-height: 1; }
  .vd-stat-label { font-size: 11.5px; color: var(--muted); }

  .vd-dcr-alert { display: flex; align-items: center; gap: 12px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.28); border-radius: 12px; padding: 14px 18px; margin-bottom: 32px; cursor: pointer; transition: background 0.2s; font-size: 13.5px; color: var(--ink); animation: fadeUp 0.4s ease both; }
  .vd-dcr-alert:hover { background: rgba(201,168,76,0.14); }
  .vd-dcr-alert-icon { font-size: 1.3rem; flex-shrink: 0; }
  .vd-dcr-alert-cta { margin-left: auto; color: var(--gold); font-weight: 500; font-size: 13px; white-space: nowrap; }

  .vd-section { margin-bottom: 56px; animation: fadeUp 0.5s ease 0.15s both; }
  .vd-section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  .vd-section-title { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: var(--ink); margin-bottom: 3px; }
  .vd-section-sub { font-size: 12.5px; color: var(--muted); }
  .vd-section-add { font-size: 12.5px; color: var(--gold); text-decoration: none; font-weight: 500; border: 1px solid var(--border); padding: 6px 14px; border-radius: 6px; transition: all 0.2s; white-space: nowrap; }
  .vd-section-add:hover { background: rgba(201,168,76,0.07); border-color: var(--gold); }
  .vd-svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  @media (max-width: 900px) { .vd-svc-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 560px) { .vd-svc-grid { grid-template-columns: 1fr; } }
  .vd-svc-card-wrapper { animation: fadeUp 0.45s ease both; }
  .vd-svc-empty { background: var(--white); border: 1px dashed rgba(201,168,76,0.35); border-radius: 12px; padding: 48px 24px; text-align: center; }
  .vd-svc-empty-icon { font-size: 2.2rem; display: block; margin-bottom: 12px; }
  .vd-svc-empty-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .vd-svc-empty-sub { font-size: 13px; color: var(--muted); }

  .vd-tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .vd-tab { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: none; border: none; border-bottom: 2px solid transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer; transition: all 0.2s; margin-bottom: -1px; text-transform: capitalize; }
  .vd-tab:hover { color: var(--ink); }
  .vd-tab.active { color: var(--ink); border-bottom-color: var(--gold); font-weight: 500; }
  .vd-tab-count { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1px 8px; font-size: 11px; color: var(--muted); }
  .vd-tab.active .vd-tab-count { background: var(--ink); color: var(--white); border-color: var(--ink); }

  .vd-bookings { display: flex; flex-direction: column; gap: 12px; }
  .vd-booking-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center; gap: 20px; animation: fadeUp 0.45s ease both; transition: box-shadow 0.25s, border-color 0.25s, transform 0.2s; }
  .vd-booking-card:hover { box-shadow: 0 8px 32px rgba(14,12,10,0.09); border-color: rgba(201,168,76,0.4); transform: translateY(-1px); }
  .vd-booking-card-dcr { border-color: rgba(201,168,76,0.4) !important; box-shadow: 0 0 0 2px rgba(201,168,76,0.12) !important; }
  .vd-booking-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; min-width: 0; }
  .vd-avatar { width: 46px; height: 46px; background: var(--ink); color: var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; flex-shrink: 0; }
  .vd-booking-info { flex: 1; min-width: 0; }
  .vd-booking-name { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
  .vd-booking-email { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  .vd-booking-meta { display: flex; gap: 14px; flex-wrap: wrap; }
  .vd-meta-item { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 4px; }
  .vd-user-details { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
  .vd-detail-chip { font-size: 11.5px; color: #6b6358; line-height: 1.4; max-width: 320px; }
  .vd-booking-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
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

  .vd-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  .vd-spinner-dark { border-color: rgba(184,92,92,0.3); border-top-color: #b85c5c; }
  .vd-loading { display: flex; flex-direction: column; gap: 12px; }
  .vd-skeleton { height: 88px; border-radius: 12px; background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }
  .vd-skeleton-card { height: 280px; }
  .vd-empty { text-align: center; padding: 72px 20px; }
  .vd-empty-icon { font-size: 3rem; margin-bottom: 16px; }
  .vd-empty h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
  .vd-empty p { font-size: 13.5px; color: var(--muted); }

  @media (max-width: 768px) {
    .vd-body { padding: 32px 16px 60px; }
    .vd-booking-card { flex-direction: column; align-items: flex-start; }
    .vd-booking-right { width: 100%; justify-content: flex-start; }
    .vd-header { flex-direction: column; align-items: flex-start; }
    .vd-popup { padding: 28px 20px 24px; }
    .vd-popup-btns { flex-direction: column; }
    .bd-modal { padding: 28px 20px 24px; }
    .bd-grid { grid-template-columns: 1fr; }
    .bd-top { flex-wrap: wrap; }
    .bd-status-badge { margin-left: 0; }
    .bd-actions { flex-direction: column; }
    .cu-modal { padding: 28px 20px 24px; }
    .cu-btns { flex-direction: column; }
    .vd-avail-section { flex-direction: column; align-items: flex-start; }
    .toast-wrap { top: 70px; }
  }

  @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes popupUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;