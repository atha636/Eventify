import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import PaymentModal from "../components/PaymentModal";
import Logo from "../components/Logo";

// ── SEO Head Manager ──────────────────────────────────────────
function SEOHead({ title, description, canonical }) {
  useEffect(() => {
    document.title = title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement("meta"); desc.name = "description"; document.head.appendChild(desc); }
    desc.content = description;
    let og = document.querySelector('meta[property="og:title"]');
    if (!og) { og = document.createElement("meta"); og.setAttribute("property","og:title"); document.head.appendChild(og); }
    og.content = title;
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) { ogDesc = document.createElement("meta"); ogDesc.setAttribute("property","og:description"); document.head.appendChild(ogDesc); }
    ogDesc.content = description;
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = "noindex, nofollow";
    return () => { document.title = "EventPro"; };
  }, [title, description, canonical]);
  return null;
}

const STATUS_META = {
  pending:   { label: "Pending",   color: "#c9a84c", bg: "rgba(201,168,76,0.08)",  border: "rgba(201,168,76,0.25)",  icon: "◷" },
  approved:  { label: "Confirmed", color: "#3a8a62", bg: "rgba(58,138,98,0.08)",   border: "rgba(58,138,98,0.25)",   icon: "✓" },
  rejected:  { label: "Declined",  color: "#b85c5c", bg: "rgba(184,92,92,0.08)",   border: "rgba(184,92,92,0.25)",   icon: "✕" },
  cancelled: { label: "Cancelled", color: "#7a7265", bg: "rgba(122,114,101,0.08)", border: "rgba(122,114,101,0.22)", icon: "✕" },
};

const DCR_META = {
  pending:  { label: "Waiting for Vendor",  color: "#c9a84c", bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.3)" },
  approved: { label: "Changes Accepted",    color: "#3a8a62", bg: "rgba(58,138,98,0.08)",  border: "rgba(58,138,98,0.3)"  },
  rejected: { label: "Changes Declined",    color: "#b85c5c", bg: "rgba(184,92,92,0.08)",  border: "rgba(184,92,92,0.3)"  },
};

function fmt(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

// ── Booking Detail Drawer ──────────────────────────────────────
function BookingDetailDrawer({ booking, onClose, onPay, onCancel, onRequestChange }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (booking) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [booking]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  if (!booking) return null;

  const b = booking;
  const meta = STATUS_META[b.status] || STATUS_META.pending;
  const isPending       = b.status === "pending";
  const isApproved      = b.status === "approved";
  const needsPayment    = isApproved && b.paymentStatus !== "paid";
  const dcr             = b.dateChangeRequest;
  const hasPendingDcr   = dcr?.status === "pending";
  const hasDcr          = dcr && dcr.status !== "none" && dcr.requestedDate;
  const canRequestChange = (isPending || isApproved) && !hasPendingDcr;

  const getVendorName  = () => b.vendorId?.title || `Vendor #${b.vendorId?.toString()?.slice(-5) || "—"}`;
  const getServiceType = () => b.vendorId?.serviceType || "Service";
  const getInitial     = () => b.vendorId?.title?.charAt(0)?.toUpperCase() || "V";

  const details = [
    { icon: "🗓", label: "Event Date",    value: fmt(b.date) },
    { icon: "📦", label: "Package",       value: b.packageName  || "—" },
    { icon: "₹",  label: "Package Price", value: b.packagePrice ? `₹${b.packagePrice.toLocaleString()}` : "—" },
    { icon: "📍", label: "Address",       value: b.userDetails?.address || "—" },
    { icon: "👤", label: "Name",          value: b.userDetails?.name    || "—" },
    { icon: "📞", label: "Phone",         value: b.userDetails?.phone   || "—" },
    { icon: "✉️", label: "Email",         value: b.userDetails?.email   || "—" },
    { icon: "💳", label: "Payment",       value: b.paymentStatus === "paid" ? "Paid ✓" : "Pending" },
    { icon: "🔖", label: "Booking ID",    value: b._id ? `#${b._id.slice(-8).toUpperCase()}` : "—" },
  ].filter(d => d.value && d.value !== "—");

  return (
    <>
      <div className={`bdd-backdrop ${visible ? "bdd-backdrop--in" : ""}`} onClick={handleClose} aria-hidden="true" />
      <aside className={`bdd-drawer ${visible ? "bdd-drawer--in" : ""}`} role="dialog" aria-modal="true" aria-label={`Booking details for ${getVendorName()}`}>
        {/* Drawer Header */}
        <div className="bdd-header">
          <div className="bdd-header-bg" aria-hidden="true" />
          <button className="bdd-close" onClick={handleClose} aria-label="Close details">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="bdd-vendor-hero">
            <div className="bdd-avatar-lg" aria-hidden="true">
              {b.vendorId?.images?.[0]
                ? <img src={b.vendorId.images[0]} alt={getVendorName()} loading="lazy" />
                : <span>{getInitial()}</span>
              }
            </div>
            <div className="bdd-vendor-info">
              <div className="bdd-eyebrow">Booking Details</div>
              <h2 className="bdd-vname">{getVendorName()}</h2>
              <p className="bdd-stype">
                <span className="bdd-dot" aria-hidden="true">◈</span>
                {getServiceType()}
                {b.vendorId?.location && <span className="bdd-loc"> · {b.vendorId.location}</span>}
              </p>
            </div>
          </div>
          <div className="bdd-status-pill" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
            <span>{meta.icon}</span> {meta.label}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="bdd-body">
          {/* Pay Now Banner — UPDATED: shows "Pay →" only */}
          {needsPayment && (
            <div className="bdd-pay-banner" role="alert">
              <div className="bdd-pay-left">
                <span className="bdd-pay-icon" aria-hidden="true">🎉</span>
                <div>
                  <p className="bdd-pay-title">Vendor confirmed your booking!</p>
                  <p className="bdd-pay-sub">Complete payment to lock in your slot</p>
                </div>
              </div>
              <button
                className="bdd-pay-btn"
                onClick={() => { onPay(b); handleClose(); }}
                aria-label={`Pay for ${getVendorName()}`}
              >
                Pay →
              </button>
            </div>
          )}

          {/* Paid badge */}
          {isApproved && b.paymentStatus === "paid" && (
            <div className="bdd-paid-badge" role="status">
              <span aria-hidden="true">✓</span> Payment Complete
            </div>
          )}

          {/* Waiting for DCR */}
          {hasPendingDcr && (
            <div className="bdd-waiting-banner" role="status">
              <span aria-hidden="true">⏳</span>
              <div>
                <p className="bdd-waiting-title">Waiting for vendor to respond</p>
                <p className="bdd-waiting-sub">
                  Your change request is under review.
                  {dcr.requestedDate    && ` New date: ${fmt(dcr.requestedDate)}.`}
                  {dcr.requestedAddress && ` New address: ${dcr.requestedAddress}.`}
                </p>
              </div>
            </div>
          )}

          {/* DCR result */}
          {hasDcr && !hasPendingDcr && (
            <div className="bdd-dcr-banner" style={{ color: DCR_META[dcr.status]?.color, background: DCR_META[dcr.status]?.bg, border: `1px solid ${DCR_META[dcr.status]?.border}` }}>
              <span>{dcr.status === "approved" ? "✓ " : dcr.status === "rejected" ? "✕ " : ""}{DCR_META[dcr.status]?.label}</span>
              {dcr.requestedDate    && <span className="bdd-dcr-chip">📅 {fmt(dcr.requestedDate)}</span>}
              {dcr.requestedAddress && <span className="bdd-dcr-chip">📍 {dcr.requestedAddress}</span>}
            </div>
          )}

          {/* Details Grid */}
          <div className="bdd-section">
            <h3 className="bdd-section-title"><span className="bdd-section-line" aria-hidden="true" />Booking Information</h3>
            <div className="bdd-details-grid">
              {details.map((d, i) => (
                <div key={i} className="bdd-detail-item" style={{ animationDelay: `${0.05 + i * 0.04}s` }}>
                  <div className="bdd-detail-icon" aria-hidden="true">{d.icon}</div>
                  <div>
                    <div className="bdd-detail-label">{d.label}</div>
                    <div className="bdd-detail-val" style={d.label === "Payment" && b.paymentStatus === "paid" ? { color: "#3a8a62", fontWeight: 500 } : {}}>{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Info */}
          {(b.vendorId?.description || b.vendorId?.rating) && (
            <div className="bdd-section">
              <h3 className="bdd-section-title"><span className="bdd-section-line" aria-hidden="true" />About the Vendor</h3>
              {b.vendorId?.rating && (
                <div className="bdd-rating">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="bdd-star" style={{ color: s <= Math.round(b.vendorId.rating) ? "#c9a84c" : "#d4cfc8" }} aria-hidden="true">★</span>
                  ))}
                  <span className="bdd-rating-val">{b.vendorId.rating.toFixed(1)}</span>
                </div>
              )}
              {b.vendorId?.description && <p className="bdd-vendor-desc">{b.vendorId.description}</p>}
            </div>
          )}

          {/* Timeline */}
          <div className="bdd-section">
            <h3 className="bdd-section-title"><span className="bdd-section-line" aria-hidden="true" />Booking Timeline</h3>
            <div className="bdd-timeline">
              <div className="bdd-tl-item bdd-tl-done">
                <div className="bdd-tl-dot"><span>✓</span></div>
                <div><p className="bdd-tl-label">Booking Submitted</p><p className="bdd-tl-sub">{b.createdAt ? fmt(b.createdAt) : "Date not available"}</p></div>
              </div>
              <div className={`bdd-tl-item ${b.status !== "pending" ? "bdd-tl-done" : "bdd-tl-active"}`}>
                <div className="bdd-tl-dot"><span>{b.status === "approved" ? "✓" : b.status === "rejected" ? "✕" : "◷"}</span></div>
                <div><p className="bdd-tl-label">Vendor Review</p><p className="bdd-tl-sub">{b.status === "pending" ? "Awaiting vendor response" : b.status === "approved" ? "Confirmed by vendor" : "Declined by vendor"}</p></div>
              </div>
              <div className={`bdd-tl-item ${b.paymentStatus === "paid" ? "bdd-tl-done" : needsPayment ? "bdd-tl-active" : "bdd-tl-pending"}`}>
                <div className="bdd-tl-dot"><span>{b.paymentStatus === "paid" ? "✓" : "₹"}</span></div>
                <div><p className="bdd-tl-label">Payment</p><p className="bdd-tl-sub">{b.paymentStatus === "paid" ? "Payment complete" : needsPayment ? "Payment required" : "Pending confirmation"}</p></div>
              </div>
              <div className={`bdd-tl-item ${b.paymentStatus === "paid" ? "bdd-tl-active" : "bdd-tl-pending"}`}>
                <div className="bdd-tl-dot"><span>🎉</span></div>
                <div><p className="bdd-tl-label">Event Day</p><p className="bdd-tl-sub">{fmt(b.date)}</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bdd-footer">
          {b.vendorId?._id && (
            <a href={`/vendor/${b.vendorId._id}`} className="bdd-foot-btn bdd-foot-ghost" aria-label={`View ${getVendorName()} profile`}>View Vendor →</a>
          )}
          {canRequestChange && (
            <button className="bdd-foot-btn bdd-foot-gold" onClick={() => { onRequestChange(b); handleClose(); }}>
              📅 Change Date / Address
            </button>
          )}
          {isPending && (
            <button className="bdd-foot-btn bdd-foot-danger" onClick={() => { onCancel(b); handleClose(); }}>Cancel Booking</button>
          )}
        </div>
      </aside>
    </>
  );
}

export default function UserDashboard() {
  const [bookings, setBookings]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [filter,   setFilter]     = useState("all");

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelError,  setCancelError]  = useState("");

  const [dcrTarget,   setDcrTarget]   = useState(null);
  const [dcrDate,     setDcrDate]     = useState("");
  const [dcrAddress,  setDcrAddress]  = useState("");
  const [dcrReason,   setDcrReason]   = useState("");
  const [dcrLoading,  setDcrLoading]  = useState(false);
  const [dcrError,    setDcrError]    = useState("");
  const [dcrSuccess,  setDcrSuccess]  = useState("");

  const [paymentTarget,  setPaymentTarget]  = useState(null);
  const [detailBooking,  setDetailBooking]  = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await API.get("/bookings");
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true); setCancelError("");
    try {
      await API.delete(`/bookings/${cancelTarget._id}`);
      setBookings((prev) => prev.filter((b) => b._id !== cancelTarget._id));
      setCancelTarget(null);
    } catch {
      setCancelError("Failed to cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const openDcr = (booking) => {
    setDcrTarget(booking);
    setDcrDate(""); setDcrAddress(""); setDcrReason("");
    setDcrError(""); setDcrSuccess("");
  };
  const closeDcr = () => { if (dcrLoading) return; setDcrTarget(null); setDcrError(""); setDcrSuccess(""); };

  const handleDcrSubmit = async () => {
    if (!dcrDate && !dcrAddress.trim()) { setDcrError("Please enter a new date, a new address, or both."); return; }
    setDcrLoading(true); setDcrError("");
    try {
      const payload = { reason: dcrReason };
      if (dcrDate)           payload.requestedDate    = dcrDate;
      if (dcrAddress.trim()) payload.requestedAddress = dcrAddress.trim();
      const res = await API.post(`/bookings/${dcrTarget._id}/change-request`, payload);
      setBookings((prev) => prev.map((b) => b._id === dcrTarget._id ? res.data.booking : b));
      setDcrSuccess("Request sent! Please wait for the vendor to review your changes.");
    } catch (err) {
      setDcrError(err.response?.data?.error || "Failed to submit request.");
    } finally {
      setDcrLoading(false);
    }
  };

  const handlePaymentSuccess = () => { setPaymentTarget(null); fetchBookings(); };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const counts   = {
    all:      bookings.length,
    pending:  bookings.filter((b) => b.status === "pending").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };

  const getInitial     = (b) => b.vendorId?.title?.charAt(0)?.toUpperCase() || "V";
  const getVendorName  = (b) => b.vendorId?.title || `Vendor #${b.vendorId?.toString()?.slice(-5) || "—"}`;
  const getServiceType = (b) => b.vendorId?.serviceType || "Service";
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      <SEOHead
        title="My Bookings — Client Portal | EventPro"
        description="Manage and track all your event bookings."
        canonical={typeof window !== "undefined" ? window.location.href : ""}
      />
      <style>{styles}</style>

      <div className="ud-root" role="main">
        <Navbar />

        {/* Booking Detail Drawer */}
        <BookingDetailDrawer
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
          onPay={(b) => setPaymentTarget(b)}
          onCancel={(b) => { setCancelError(""); setCancelTarget(b); }}
          onRequestChange={(b) => openDcr(b)}
        />

        {paymentTarget && (
          <PaymentModal
            booking={paymentTarget}
            vendor={paymentTarget.vendorId}
            onSuccess={handlePaymentSuccess}
            onClose={() => setPaymentTarget(null)}
          />
        )}

        {/* Cancel Modal */}
        {cancelTarget && (
          <div className="ud-overlay" role="dialog" aria-modal="true"
            onClick={() => { if (!cancelling) { setCancelTarget(null); setCancelError(""); } }}>
            <div className="ud-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ud-modal-icon-wrap ud-modal-danger"><span>🗑</span></div>
              <h3 className="ud-modal-title">Cancel Booking?</h3>
              <p className="ud-modal-body">
                You are about to cancel your booking with <strong>{getVendorName(cancelTarget)}</strong> on <strong>{fmt(cancelTarget.date)}</strong>. This action cannot be undone.
              </p>
              {cancelError && <p className="ud-modal-err" role="alert">⚠ {cancelError}</p>}
              <div className="ud-modal-btns">
                <button className="ud-mbtn ud-mbtn-ghost" onClick={() => { setCancelTarget(null); setCancelError(""); }} disabled={cancelling}>Keep Booking</button>
                <button className="ud-mbtn ud-mbtn-danger" onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? <><span className="ud-spinner" /> Cancelling…</> : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Date + Address Change Modal */}
        {dcrTarget && (
          <div className="ud-overlay" role="dialog" aria-modal="true" onClick={closeDcr}>
            <div className="ud-modal ud-modal-wide" onClick={(e) => e.stopPropagation()}>
              <div className="ud-modal-icon-wrap ud-modal-gold"><span>📅</span></div>
              <h3 className="ud-modal-title">Request Changes</h3>
              <p className="ud-modal-body">
                Current date: <strong>{fmt(dcrTarget.date)}</strong><br />
                Current address: <strong>{dcrTarget.userDetails?.address || "—"}</strong><br />
                Service: <strong>{getVendorName(dcrTarget)}</strong>
              </p>
              {dcrSuccess ? (
                <div className="ud-dcr-success" role="status">
                  <div className="ud-dcr-wait-icon">⏳</div>
                  <p className="ud-dcr-wait-title">Request Sent!</p>
                  <p className="ud-dcr-wait-body">Please wait for the vendor to review your changes. You'll receive a notification once they accept or decline.</p>
                  <button className="ud-mbtn ud-mbtn-gold" onClick={closeDcr} style={{ marginTop: 16, width: "100%" }}>Got it</button>
                </div>
              ) : (
                <>
                  <p className="ud-dcr-hint">Fill in what you'd like to change. You can update the date, address, or both.</p>
                  <div className="ud-field">
                    <label className="ud-label" htmlFor="dcr-date">New Preferred Date <span className="ud-optional">(leave blank to keep current)</span></label>
                    <input id="dcr-date" type="date" className="ud-input" min={todayStr} value={dcrDate} onChange={(e) => { setDcrDate(e.target.value); setDcrError(""); }} />
                  </div>
                  <div className="ud-field">
                    <label className="ud-label" htmlFor="dcr-address">New Address <span className="ud-optional">(leave blank to keep current)</span></label>
                    <textarea id="dcr-address" className="ud-textarea" rows={2} placeholder="e.g. 123 Main St, New Delhi 110001" value={dcrAddress} onChange={(e) => { setDcrAddress(e.target.value); setDcrError(""); }} />
                  </div>
                  <div className="ud-field">
                    <label className="ud-label" htmlFor="dcr-reason">Reason <span className="ud-optional">(optional)</span></label>
                    <textarea id="dcr-reason" className="ud-textarea" rows={2} placeholder="e.g. Family emergency, venue changed…" value={dcrReason} onChange={(e) => setDcrReason(e.target.value)} />
                  </div>
                  {dcrError && <p className="ud-modal-err" role="alert">⚠ {dcrError}</p>}
                  <div className="ud-modal-btns">
                    <button className="ud-mbtn ud-mbtn-ghost" onClick={closeDcr} disabled={dcrLoading}>Cancel</button>
                    <button className="ud-mbtn ud-mbtn-gold" onClick={handleDcrSubmit} disabled={dcrLoading}>
                      {dcrLoading ? <><span className="ud-spinner" /> Sending…</> : "Send Request →"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Hero */}
        <header className="ud-hero" role="banner">
          <div className="ud-hero-orb ud-orb1" />
          <div className="ud-hero-orb ud-orb2" />
          <div className="ud-hero-orb ud-orb3" />
          <div className="ud-hero-inner">
            <div className="ud-eyebrow"><span className="ud-eyebrow-dot" /><span>Client Portal</span></div>
            <h1 className="ud-hero-title">My Bookings</h1>
            <p className="ud-hero-sub">Track and manage all your event reservations in one place</p>
            <a href="/vendors" className="ud-hero-btn">
              <span>Explore Services</span>
              <span className="ud-hero-btn-arrow">→</span>
            </a>
          </div>
          <div className="ud-hero-pills">
            <div className="ud-pill"><span className="ud-pill-val">{counts.all}</span><span className="ud-pill-label">Total</span></div>
            <div className="ud-pill ud-pill-gold"><span className="ud-pill-val">{counts.pending}</span><span className="ud-pill-label">Pending</span></div>
            <div className="ud-pill ud-pill-green"><span className="ud-pill-val">{counts.approved}</span><span className="ud-pill-label">Confirmed</span></div>
          </div>
          <div className="ud-hero-wave">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none"><path d="M0,60 C360,0 1080,60 1440,20 L1440,60 Z" fill="#f5f0e8"/></svg>
          </div>
        </header>

        <div className="ud-body">
          {/* Stats */}
          <section className="ud-stats">
            {[
              { label: "Total Bookings", value: counts.all,      icon: "◈", color: "var(--ink)", accent: "rgba(14,12,10,0.05)"   },
              { label: "Pending",        value: counts.pending,  icon: "◷", color: "#c9a84c",    accent: "rgba(201,168,76,0.08)" },
              { label: "Confirmed",      value: counts.approved, icon: "◎", color: "#3a8a62",    accent: "rgba(58,138,98,0.08)"  },
              { label: "Declined",       value: counts.rejected, icon: "◌", color: "#b85c5c",    accent: "rgba(184,92,92,0.08)"  },
            ].map((s, i) => (
              <article key={s.label} className="ud-stat" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="ud-stat-icon-wrap" style={{ background: s.accent }}><span className="ud-stat-icon" style={{ color: s.color }}>{s.icon}</span></div>
                <div><div className="ud-stat-val" style={{ color: s.color }}>{s.value}</div><div className="ud-stat-label">{s.label}</div></div>
              </article>
            ))}
          </section>

          {/* Filter Tabs */}
          <nav className="ud-tabs-wrap">
            <div className="ud-tabs" role="tablist">
              {[
                { key: "all",      label: "All Bookings" },
                { key: "pending",  label: "Pending"      },
                { key: "approved", label: "Confirmed"    },
                { key: "rejected", label: "Declined"     },
              ].map((t) => (
                <button key={t.key} role="tab" aria-selected={filter === t.key}
                  className={`ud-tab ${filter === t.key ? "active" : ""}`}
                  onClick={() => setFilter(t.key)}>
                  {t.label}
                  <span className="ud-tab-pill">{counts[t.key]}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Booking List */}
          {loading ? (
            <div className="ud-skeletons">
              {[...Array(3)].map((_, i) => <div key={i} className="ud-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <section className="ud-empty">
              <div className="ud-empty-orb" />
              <span className="ud-empty-icon">{filter === "all" ? "🗓" : filter === "pending" ? "◷" : filter === "approved" ? "✓" : "✕"}</span>
              <h2>{filter === "all" ? "No bookings yet" : `No ${filter === "approved" ? "confirmed" : filter} bookings`}</h2>
              <p>{filter === "all" ? "Start exploring vendors and book your perfect event experience." : `You don't have any ${filter === "approved" ? "confirmed" : filter} bookings right now.`}</p>
              {filter === "all" && <a href="/vendors" className="ud-empty-cta">Explore Vendors →</a>}
            </section>
          ) : (
            <section className="ud-list">
              {filtered.map((b, i) => {
                const meta            = STATUS_META[b.status] || STATUS_META.pending;
                const isPending       = b.status === "pending";
                const isApproved      = b.status === "approved";
                const needsPayment    = isApproved && b.paymentStatus !== "paid";
                const dcr             = b.dateChangeRequest;
                const hasPendingDcr   = dcr?.status === "pending";
                const hasDcr          = dcr && dcr.status !== "none" && dcr.requestedDate;
                const canRequestChange = (isPending || isApproved) && !hasPendingDcr;

                return (
                  <article key={b._id} className="ud-card" style={{ animationDelay: `${i * 0.06}s` }}
                    onClick={() => setDetailBooking(b)} role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetailBooking(b); } }}>
                    <div className="ud-card-bar" style={{ background: meta.color }} />
                    <div className="ud-card-peek">Details →</div>

                    <div className="ud-avatar">
                      {b.vendorId?.images?.[0]
                        ? <img src={b.vendorId.images[0]} alt={`${getVendorName(b)} logo`} loading="lazy" />
                        : <span>{getInitial(b)}</span>
                      }
                    </div>

                    <div className="ud-card-content">
                      <div className="ud-card-top">
                        <div>
                          <h3 className="ud-vname">{getVendorName(b)}</h3>
                          <p className="ud-stype">
                            <span className="ud-stype-dot">◈</span>
                            <span>{getServiceType(b)}</span>
                            {b.vendorId?.location && <span className="ud-loc"> · {b.vendorId.location}</span>}
                          </p>
                        </div>
                        <span className="ud-badge ud-badge-desk" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                          <span>{meta.icon}</span> {meta.label}
                        </span>
                      </div>

                      {/* Date + chips */}
                      <div className="ud-date-row">
                        <div className="ud-date-chip"><span className="ud-date-icon">🗓</span><time dateTime={new Date(b.date).toISOString().split("T")[0]}>{fmt(b.date)}</time></div>
                        {b.packageName  && <div className="ud-date-chip"><span className="ud-date-icon">📦</span><span>{b.packageName}</span></div>}
                        {b.packagePrice && <div className="ud-date-chip"><span className="ud-date-icon">₹</span><span>{b.packagePrice.toLocaleString()}</span></div>}
                      </div>

                      {/* ── Pay Now Banner — UPDATED: "Pay →" only ── */}
                      {needsPayment && (
                        <div className="ud-pay-banner" role="alert" onClick={(e) => e.stopPropagation()}>
                          <div className="ud-pay-banner-left">
                            <span className="ud-pay-icon">🎉</span>
                            <div>
                              <p className="ud-pay-title">Vendor confirmed your booking!</p>
                              <p className="ud-pay-sub">Complete payment to lock in your slot</p>
                            </div>
                          </div>
                          <button className="ud-pay-btn"
                            onClick={(e) => { e.stopPropagation(); setPaymentTarget(b); }}
                            aria-label={`Pay for ${getVendorName(b)}`}>
                            Pay →
                          </button>
                        </div>
                      )}

                      {isApproved && b.paymentStatus === "paid" && (
                        <div className="ud-paid-badge"><span>✓</span> Payment Complete</div>
                      )}

                      {hasPendingDcr && (
                        <div className="ud-waiting-banner">
                          <span className="ud-waiting-icon">⏳</span>
                          <div>
                            <p className="ud-waiting-title">Waiting for vendor to respond</p>
                            <p className="ud-waiting-sub">
                              Your change request is under review.
                              {dcr.requestedDate    && ` New date: ${fmt(dcr.requestedDate)}.`}
                              {dcr.requestedAddress && ` New address: ${dcr.requestedAddress}.`}
                            </p>
                          </div>
                        </div>
                      )}

                      {hasDcr && !hasPendingDcr && (
                        <div className="ud-dcr-banner" style={{ color: DCR_META[dcr.status]?.color || "#c9a84c", background: DCR_META[dcr.status]?.bg, border: `1px solid ${DCR_META[dcr.status]?.border}` }}>
                          <span className="ud-dcr-label">
                            {dcr.status === "approved" && "✓ "}
                            {dcr.status === "rejected" && "✕ "}
                            {DCR_META[dcr.status]?.label}
                          </span>
                          {dcr.requestedDate    && <span className="ud-dcr-date">Date → {fmt(dcr.requestedDate)}</span>}
                          {dcr.requestedAddress && <span className="ud-dcr-date">Addr → {dcr.requestedAddress}</span>}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="ud-actions" onClick={(e) => e.stopPropagation()}>
                        <span className="ud-badge ud-badge-mob" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                          <span>{meta.icon}</span> {meta.label}
                        </span>
                        <div className="ud-action-btns">
                          {b.vendorId?._id && (
                            <a href={`/vendor/${b.vendorId._id}`} className="ud-btn ud-btn-ghost" onClick={(e) => e.stopPropagation()}>View →</a>
                          )}
                          {canRequestChange && (
                            <button className="ud-btn ud-btn-date" onClick={(e) => { e.stopPropagation(); openDcr(b); }}>
                              📅 Change Date / Address
                            </button>
                          )}
                          {isPending && (
                            <button className="ud-btn ud-btn-cancel" onClick={(e) => { e.stopPropagation(); setCancelError(""); setCancelTarget(b); }}>Cancel</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>

        {/* Footer trust bar */}
        <footer className="ud-trust-bar">
          <div className="ud-trust-inner">
            <div className="ud-trust-item"><span>🔒</span><span>Secure & Encrypted Payments</span></div>
            <div className="ud-trust-divider" />
            <div className="ud-trust-item"><span>📞</span><span>24/7 Customer Support</span></div>
            <div className="ud-trust-divider" />
            <div className="ud-trust-item"><span>✓</span><span>Verified Vendors Only</span></div>
          </div>
        </footer>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root {
    --ink:#0e0c0a;--cream:#f5f0e8;--gold:#c9a84c;--gold-light:#e8d5a3;
    --gold-glow:rgba(201,168,76,0.15);--muted:#7a7265;--border:rgba(201,168,76,0.18);
    --surface:#faf7f2;--white:#ffffff;--danger:#a93226;
    --danger-bg:rgba(169,50,38,0.06);--danger-border:rgba(169,50,38,0.22);
    --radius-sm:8px;--radius-md:14px;--radius-lg:20px;
    --shadow-sm:0 2px 8px rgba(14,12,10,0.06);
    --shadow-md:0 8px 28px rgba(14,12,10,0.09);
    --shadow-lg:0 20px 60px rgba(14,12,10,0.14);
    --transition:all 0.22s ease;
  }
  .ud-root{font-family:'DM Sans',sans-serif;background:var(--cream);min-height:100vh;color:var(--ink)}

  /* MODAL */
  .ud-overlay{position:fixed;inset:0;background:rgba(10,8,6,0.65);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;z-index:1000;animation:fadeIn 0.2s ease both;padding:20px;overflow-y:auto;}
  .ud-modal{background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:36px 32px 30px;width:100%;max-width:420px;text-align:center;animation:modalUp 0.28s cubic-bezier(0.34,1.2,0.64,1) both;box-shadow:var(--shadow-lg);max-height:calc(100vh - 40px);overflow-y:auto;margin:auto;scrollbar-width:thin;scrollbar-color:var(--border) transparent;}
  .ud-modal::-webkit-scrollbar{width:5px}.ud-modal::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#e8d5a3,#c9a84c);border-radius:3px}
  .ud-modal-wide{max-width:500px;text-align:left}
  .ud-modal-icon-wrap{width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 18px}
  .ud-modal-danger{background:rgba(169,50,38,0.08);border:1px solid rgba(169,50,38,0.18)}
  .ud-modal-gold{background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.25);margin:0 auto 18px}
  .ud-modal-title{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:400;font-style:italic;color:var(--ink);margin-bottom:10px;text-align:center}
  .ud-modal-body{font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:16px;text-align:center}
  .ud-modal-body strong{color:var(--ink);font-weight:500}
  .ud-modal-err{font-size:12.5px;color:var(--danger);background:var(--danger-bg);border:1px solid var(--danger-border);border-radius:var(--radius-sm);padding:9px 13px;text-align:left;margin-bottom:14px}
  .ud-modal-btns{display:flex;gap:10px}
  .ud-mbtn{flex:1;padding:13px 16px;border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:var(--transition);display:flex;align-items:center;justify-content:center;gap:7px;border:none}
  .ud-mbtn:disabled{opacity:0.55;cursor:not-allowed}
  .ud-mbtn-ghost{background:transparent;border:1px solid var(--border);color:var(--muted)}
  .ud-mbtn-ghost:hover:not(:disabled){border-color:var(--muted);color:var(--ink);background:var(--surface)}
  .ud-mbtn-danger{background:var(--danger);color:white}
  .ud-mbtn-danger:hover:not(:disabled){background:#8e1f14;transform:translateY(-1px);box-shadow:0 6px 20px rgba(169,50,38,0.3)}
  .ud-mbtn-gold{background:var(--gold);color:var(--ink)}
  .ud-mbtn-gold:hover:not(:disabled){background:#b8942f;transform:translateY(-1px);box-shadow:0 6px 20px rgba(201,168,76,0.35)}
  .ud-spinner{width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:white;animation:spin 0.7s linear infinite;display:inline-block;flex-shrink:0}
  .ud-field{text-align:left;margin-bottom:14px}
  .ud-label{display:block;font-size:11px;font-weight:500;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);margin-bottom:7px}
  .ud-optional{color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0;font-size:11px}
  .ud-input,.ud-textarea{width:100%;padding:11px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:13.5px;color:var(--ink);background:var(--surface);outline:none;transition:border-color 0.2s,box-shadow 0.2s}
  .ud-input:focus,.ud-textarea:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,168,76,0.12)}
  .ud-textarea{resize:vertical;min-height:72px}
  .ud-dcr-hint{font-size:12.5px;color:var(--muted);margin-bottom:16px;line-height:1.55;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px}
  .ud-dcr-success{background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:24px;text-align:center}
  .ud-dcr-wait-icon{font-size:2.2rem;margin-bottom:12px}
  .ud-dcr-wait-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:600;color:var(--ink);margin-bottom:8px}
  .ud-dcr-wait-body{font-size:13px;color:var(--muted);line-height:1.65}
  .ud-waiting-banner{display:flex;align-items:flex-start;gap:10px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.25);border-radius:10px;padding:12px 14px;margin-bottom:10px}
  .ud-waiting-icon{font-size:1.3rem;flex-shrink:0;margin-top:1px}
  .ud-waiting-title{font-size:13px;font-weight:500;color:var(--ink);margin:0 0 3px}
  .ud-waiting-sub{font-size:12px;color:var(--muted);line-height:1.5;margin:0}

  /* DRAWER */
  .bdd-backdrop{position:fixed;inset:0;background:rgba(10,8,6,0);backdrop-filter:blur(0px);z-index:900;pointer-events:none;transition:background 0.32s ease,backdrop-filter 0.32s ease;}
  .bdd-backdrop--in{background:rgba(10,8,6,0.6);backdrop-filter:blur(5px);pointer-events:auto;}
  .bdd-drawer{position:fixed;top:0;right:0;bottom:0;width:min(480px,100vw);background:var(--white);border-left:1px solid var(--border);box-shadow:-20px 0 60px rgba(14,12,10,0.18);z-index:950;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.32s cubic-bezier(0.32,0.72,0,1);will-change:transform;}
  .bdd-drawer--in{transform:translateX(0);}
  .bdd-header{position:relative;overflow:hidden;background:linear-gradient(160deg,#0e0c0a 0%,#1a1610 60%,#14110d 100%);padding:28px 24px 24px;flex-shrink:0;}
  .bdd-header-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 60% 0%,rgba(201,168,76,0.1) 0%,transparent 70%);pointer-events:none;}
  .bdd-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:rgba(245,240,232,0.7);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s,color 0.2s,transform 0.2s;z-index:2;}
  .bdd-close:hover{background:rgba(255,255,255,0.16);color:white;transform:scale(1.08)}
  .bdd-vendor-hero{position:relative;z-index:1;display:flex;align-items:center;gap:16px;margin-bottom:18px}
  .bdd-avatar-lg{width:68px;height:68px;border-radius:16px;background:linear-gradient(135deg,#1e1b15,#2a2419);border:1px solid rgba(201,168,76,0.3);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 6px 24px rgba(0,0,0,0.4);}
  .bdd-avatar-lg img{width:100%;height:100%;object-fit:cover}
  .bdd-avatar-lg span{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:600;color:var(--gold)}
  .bdd-vendor-info{flex:1;min-width:0}
  .bdd-eyebrow{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:5px;opacity:0.8}
  .bdd-vname{font-family:'Cormorant Garamond',serif;font-size:1.45rem;font-weight:600;color:white;line-height:1.2;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bdd-stype{font-size:11.5px;color:rgba(245,240,232,0.5);display:flex;align-items:center;gap:5px;flex-wrap:wrap}
  .bdd-dot{color:var(--gold);font-size:8px}
  .bdd-loc{color:rgba(245,240,232,0.35)}
  .bdd-status-pill{position:relative;z-index:1;display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:500;letter-spacing:0.06em;padding:6px 14px;border-radius:20px;}
  .bdd-body{flex:1;overflow-y:auto;padding:0;scrollbar-width:thin;scrollbar-color:var(--border) transparent;}
  .bdd-body::-webkit-scrollbar{width:4px}
  .bdd-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
  .bdd-pay-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.04));border-bottom:1px solid rgba(201,168,76,0.25);padding:16px 24px;animation:fadeUp 0.3s ease both;}
  .bdd-pay-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
  .bdd-pay-icon{font-size:1.4rem;flex-shrink:0}
  .bdd-pay-title{font-size:13px;font-weight:500;color:var(--ink);margin:0 0 2px}
  .bdd-pay-sub{font-size:11.5px;color:var(--muted);margin:0}
  .bdd-pay-btn{padding:10px 18px;background:var(--gold);border:none;border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:500;color:var(--ink);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:var(--transition);animation:payPulse 2.5s ease infinite;}
  .bdd-pay-btn:hover{background:var(--ink);color:white;animation:none;transform:translateY(-1px)}
  .bdd-paid-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#3a8a62;font-weight:500;background:rgba(58,138,98,0.08);border-bottom:1px solid rgba(58,138,98,0.2);padding:12px 24px;width:100%}
  .bdd-waiting-banner{display:flex;align-items:flex-start;gap:10px;background:rgba(201,168,76,0.05);border-bottom:1px solid rgba(201,168,76,0.2);padding:14px 24px;font-size:13px}
  .bdd-waiting-title{font-weight:500;color:var(--ink);margin:0 0 3px}
  .bdd-waiting-sub{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  .bdd-dcr-banner{display:flex;align-items:center;gap:10px;padding:12px 24px;border-bottom:1px solid;font-size:12.5px;font-weight:500;flex-wrap:wrap}
  .bdd-dcr-chip{font-weight:400;opacity:0.85;font-size:12px}
  .bdd-section{padding:22px 24px;border-bottom:1px solid var(--border)}
  .bdd-section:last-child{border-bottom:none}
  .bdd-section-title{display:flex;align-items:center;gap:10px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);margin-bottom:16px;font-weight:500;}
  .bdd-section-line{flex:none;width:20px;height:1px;background:var(--gold);opacity:0.6}
  .bdd-details-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:380px){.bdd-details-grid{grid-template-columns:1fr}}
  .bdd-detail-item{display:flex;align-items:flex-start;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 13px;animation:fadeUp 0.3s ease both;transition:border-color 0.2s,transform 0.2s;}
  .bdd-detail-item:hover{border-color:rgba(201,168,76,0.3);transform:translateY(-1px)}
  .bdd-detail-icon{font-size:1.1rem;flex-shrink:0;margin-top:1px;line-height:1}
  .bdd-detail-label{font-size:10px;letter-spacing:0.07em;text-transform:uppercase;color:var(--muted);margin-bottom:3px;font-weight:500}
  .bdd-detail-val{font-size:13px;color:var(--ink);font-weight:400;word-break:break-word;line-height:1.4}
  .bdd-rating{display:flex;align-items:center;gap:3px;margin-bottom:10px}
  .bdd-star{font-size:1rem}
  .bdd-rating-val{font-size:13px;color:var(--muted);margin-left:6px;font-weight:500}
  .bdd-vendor-desc{font-size:13px;color:var(--muted);line-height:1.65}
  .bdd-timeline{display:flex;flex-direction:column;gap:0}
  .bdd-tl-item{display:flex;align-items:flex-start;gap:14px;padding-bottom:18px;position:relative}
  .bdd-tl-item:not(:last-child)::before{content:'';position:absolute;left:15px;top:32px;bottom:0;width:1px;background:var(--border);z-index:0;}
  .bdd-tl-dot{width:32px;height:32px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;position:relative;z-index:1;border:2px solid var(--border);background:var(--surface);color:var(--muted);transition:var(--transition);}
  .bdd-tl-done .bdd-tl-dot{background:var(--ink);border-color:var(--ink);color:white}
  .bdd-tl-active .bdd-tl-dot{background:rgba(201,168,76,0.15);border-color:var(--gold);color:var(--gold)}
  .bdd-tl-pending .bdd-tl-dot{background:var(--surface);border-color:var(--border);color:var(--muted);opacity:0.5}
  .bdd-tl-label{font-size:13px;font-weight:500;color:var(--ink);margin-bottom:2px}
  .bdd-tl-done .bdd-tl-label{color:var(--ink)}
  .bdd-tl-pending .bdd-tl-label{color:var(--muted);opacity:0.6}
  .bdd-tl-sub{font-size:11.5px;color:var(--muted);line-height:1.4}
  .bdd-footer{flex-shrink:0;padding:16px 24px;border-top:1px solid var(--border);background:var(--surface);display:flex;gap:10px;flex-wrap:wrap;}
  .bdd-foot-btn{flex:1;min-width:120px;padding:12px 16px;border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:500;cursor:pointer;transition:var(--transition);display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;border:none;white-space:nowrap;}
  .bdd-foot-ghost{background:transparent;color:var(--muted);border:1px solid var(--border)}
  .bdd-foot-ghost:hover{border-color:var(--gold);color:var(--gold)}
  .bdd-foot-gold{background:var(--gold);color:var(--ink)}
  .bdd-foot-gold:hover{background:#b8942f;transform:translateY(-1px);box-shadow:0 6px 18px rgba(201,168,76,0.3)}
  .bdd-foot-danger{background:transparent;color:var(--danger);border:1px solid var(--danger-border)}
  .bdd-foot-danger:hover{background:var(--danger-bg);border-color:var(--danger)}

  /* HERO */
  .ud-hero{position:relative;overflow:hidden;background:linear-gradient(160deg,#0e0c0a 0%,#1a1610 55%,#12100d 100%);padding:100px 32px 80px;text-align:center;}
  .ud-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(201,168,76,0.07) 0%,transparent 70%);pointer-events:none;}
  .ud-hero-orb{position:absolute;border-radius:50%;filter:blur(100px);opacity:0.12;pointer-events:none}
  .ud-orb1{width:600px;height:600px;background:var(--gold);top:-250px;left:-120px}
  .ud-orb2{width:350px;height:350px;background:#7b5ea7;bottom:-100px;right:-80px}
  .ud-orb3{width:200px;height:200px;background:#4a7c9e;top:50%;right:10%;opacity:0.08}
  .ud-hero-inner{position:relative;z-index:2;animation:fadeUp 0.55s ease both}
  .ud-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:10.5px;letter-spacing:0.22em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;font-weight:400;}
  .ud-eyebrow-dot{width:5px;height:5px;border-radius:50%;background:var(--gold);display:inline-block;animation:pulse 2s ease infinite;}
  .ud-hero-title{font-family:'Cormorant Garamond',serif;font-size:clamp(2.6rem,5vw,3.8rem);font-weight:300;color:var(--white);margin-bottom:12px;letter-spacing:0.02em;line-height:1.1;}
  .ud-hero-sub{font-size:14px;color:rgba(245,240,232,0.45);margin-bottom:32px;font-weight:300;max-width:400px;margin-left:auto;margin-right:auto;line-height:1.6}
  .ud-hero-btn{display:inline-flex;align-items:center;gap:10px;padding:13px 32px;background:var(--gold);color:var(--ink);text-decoration:none;border-radius:var(--radius-sm);font-size:13px;font-weight:500;letter-spacing:0.04em;transition:var(--transition);box-shadow:0 4px 20px rgba(201,168,76,0.3);}
  .ud-hero-btn:hover{background:var(--gold-light);transform:translateY(-2px);box-shadow:0 8px 28px rgba(201,168,76,0.4)}
  .ud-hero-btn-arrow{transition:transform 0.2s}
  .ud-hero-btn:hover .ud-hero-btn-arrow{transform:translateX(4px)}
  .ud-hero-pills{position:relative;z-index:2;display:flex;justify-content:center;gap:12px;margin-top:36px;flex-wrap:wrap}
  .ud-pill{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:40px;padding:10px 20px;backdrop-filter:blur(10px);animation:fadeUp 0.5s ease 0.2s both;transition:var(--transition);}
  .ud-pill:hover{background:rgba(255,255,255,0.1);transform:translateY(-1px)}
  .ud-pill-val{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--white);line-height:1}
  .ud-pill-label{font-size:11px;color:rgba(245,240,232,0.5);letter-spacing:0.08em}
  .ud-pill-gold{border-color:rgba(201,168,76,0.3);background:rgba(201,168,76,0.08)}
  .ud-pill-gold .ud-pill-val{color:var(--gold)}
  .ud-pill-green{border-color:rgba(58,138,98,0.3);background:rgba(58,138,98,0.08)}
  .ud-pill-green .ud-pill-val{color:#5fb889}
  .ud-hero-wave{position:absolute;bottom:0;left:0;right:0;z-index:1;line-height:0}
  .ud-hero-wave svg{width:100%;height:60px;display:block}

  /* BODY */
  .ud-body{max-width:920px;margin:0 auto;padding:48px 28px 96px}

  /* STATS */
  .ud-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:36px}
  @media(max-width:680px){.ud-stats{grid-template-columns:repeat(2,1fr)}}
  .ud-stat{background:var(--white);border:1px solid var(--border);border-radius:var(--radius-md);padding:20px 18px;display:flex;align-items:center;gap:14px;animation:fadeUp 0.5s ease both;transition:transform 0.22s,box-shadow 0.22s,border-color 0.22s;}
  .ud-stat:hover{transform:translateY(-3px);box-shadow:var(--shadow-md);border-color:rgba(201,168,76,0.3)}
  .ud-stat-icon-wrap{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .ud-stat-icon{font-size:1.15rem}
  .ud-stat-val{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;line-height:1;margin-bottom:2px}
  .ud-stat-label{font-size:11px;color:var(--muted);letter-spacing:0.04em}

  /* TABS */
  .ud-tabs-wrap{margin-bottom:24px;border-bottom:1px solid var(--border)}
  .ud-tabs{display:flex;gap:2px;flex-wrap:wrap}
  .ud-tab{display:flex;align-items:center;gap:8px;padding:11px 18px;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-1px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--muted);cursor:pointer;transition:color 0.2s,border-color 0.2s;white-space:nowrap;}
  .ud-tab:hover{color:var(--ink)}
  .ud-tab.active{color:var(--ink);border-bottom-color:var(--gold);font-weight:500}
  .ud-tab-pill{font-size:10.5px;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:1px 7px;color:var(--muted)}
  .ud-tab.active .ud-tab-pill{background:var(--ink);color:var(--white);border-color:var(--ink)}

  /* CARDS */
  .ud-list{display:flex;flex-direction:column;gap:14px}
  .ud-card{position:relative;overflow:hidden;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-md);padding:24px 26px 22px 38px;display:flex;align-items:flex-start;gap:18px;animation:fadeUp 0.45s ease both;transition:box-shadow 0.25s,border-color 0.25s,transform 0.25s;cursor:pointer;}
  .ud-card:hover{box-shadow:var(--shadow-md);border-color:rgba(201,168,76,0.32);transform:translateY(-2px)}
  .ud-card:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
  .ud-card-bar{position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:var(--radius-md) 0 0 var(--radius-md);opacity:0.7}
  .ud-card-peek{position:absolute;top:14px;right:14px;font-size:10.5px;letter-spacing:0.08em;color:var(--gold);background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:20px;padding:3px 10px;opacity:0;transition:opacity 0.2s,transform 0.2s;transform:translateX(4px);pointer-events:none;z-index:2;}
  .ud-card:hover .ud-card-peek{opacity:1;transform:translateX(0)}
  .ud-avatar{width:56px;height:56px;border-radius:12px;background:var(--ink);border:1px solid var(--border);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:var(--shadow-sm);}
  .ud-avatar img{width:100%;height:100%;object-fit:cover}
  .ud-avatar span{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:600;color:var(--gold)}
  .ud-card-content{flex:1;min-width:0}
  .ud-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
  .ud-vname{font-family:'Cormorant Garamond',serif;font-size:1.22rem;font-weight:600;color:var(--ink);margin-bottom:4px;line-height:1.2}
  .ud-stype{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:5px;flex-wrap:wrap;text-transform:capitalize}
  .ud-stype-dot{color:var(--gold);font-size:9px}
  .ud-loc{color:#9e9690}
  .ud-date-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
  .ud-date-chip{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:4px 12px;white-space:nowrap;transition:var(--transition);}
  .ud-date-chip:hover{border-color:rgba(201,168,76,0.35);color:var(--ink)}
  .ud-date-icon{font-size:11px}

  /* PAY BANNER */
  .ud-pay-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.04));border:1px solid rgba(201,168,76,0.35);border-radius:12px;padding:14px 16px;margin-bottom:12px;animation:fadeUp 0.4s ease both;}
  .ud-pay-banner-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
  .ud-pay-icon{font-size:1.3rem;flex-shrink:0}
  .ud-pay-title{font-size:13px;font-weight:500;color:var(--ink);margin:0 0 2px}
  .ud-pay-sub{font-size:11.5px;color:var(--muted);margin:0}
  /* ── Pay button: compact, no amount ── */
  .ud-pay-btn{padding:10px 22px;background:var(--gold);border:none;border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--ink);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:var(--transition);animation:payPulse 2.5s ease infinite;}
  .ud-pay-btn:hover{background:var(--ink);color:var(--white);transform:translateY(-1px);box-shadow:0 6px 18px rgba(14,12,10,0.2);animation:none}
  .ud-paid-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#3a8a62;font-weight:500;background:rgba(58,138,98,0.08);border:1px solid rgba(58,138,98,0.2);border-radius:20px;padding:4px 12px;margin-bottom:10px}
  .ud-dcr-banner{display:flex;align-items:center;gap:10px;border-radius:var(--radius-sm);padding:8px 12px;margin-bottom:10px;font-size:12px;font-weight:500;flex-wrap:wrap}
  .ud-dcr-label{flex:1}
  .ud-dcr-date{font-weight:400;opacity:0.85}

  /* ACTIONS */
  .ud-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .ud-action-btns{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .ud-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:500;letter-spacing:0.06em;padding:5px 12px;border-radius:20px;white-space:nowrap}
  .ud-badge-desk{display:inline-flex}
  .ud-badge-mob{display:none}
  .ud-btn{font-size:12px;font-family:'DM Sans',sans-serif;font-weight:500;padding:7px 16px;border-radius:7px;cursor:pointer;transition:var(--transition);white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;gap:5px;border:none}
  .ud-btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border)}
  .ud-btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
  .ud-btn-date{background:rgba(201,168,76,0.08);color:#a07b28;border:1px solid rgba(201,168,76,0.3)}
  .ud-btn-date:hover{background:rgba(201,168,76,0.15);border-color:var(--gold);color:var(--ink);transform:translateY(-1px);box-shadow:0 4px 14px rgba(201,168,76,0.2)}
  .ud-btn-cancel{background:transparent;color:var(--danger);border:1px solid var(--danger-border)}
  .ud-btn-cancel:hover{background:var(--danger-bg);border-color:var(--danger)}

  /* SKELETON */
  .ud-skeletons{display:flex;flex-direction:column;gap:14px}
  .ud-skeleton{height:120px;border-radius:var(--radius-md);background:linear-gradient(90deg,#ede8e0 25%,#e5dfd4 50%,#ede8e0 75%);background-size:200% 100%;animation:shimmer 1.4s ease infinite}

  /* EMPTY */
  .ud-empty{position:relative;text-align:center;padding:96px 20px;animation:fadeUp 0.5s ease both;overflow:hidden}
  .ud-empty-orb{position:absolute;width:400px;height:400px;background:var(--gold);border-radius:50%;filter:blur(120px);opacity:0.04;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
  .ud-empty-icon{display:inline-flex;align-items:center;justify-content:center;width:76px;height:76px;border-radius:50%;background:var(--white);border:1px solid var(--border);font-size:1.9rem;margin-bottom:22px;box-shadow:var(--shadow-sm)}
  .ud-empty h2{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:400;color:var(--ink);margin-bottom:10px}
  .ud-empty p{font-size:13.5px;color:var(--muted);line-height:1.65;max-width:360px;margin:0 auto 26px}
  .ud-empty-cta{display:inline-block;padding:13px 32px;background:var(--ink);color:var(--white);text-decoration:none;border-radius:var(--radius-sm);font-size:13px;font-weight:500;transition:var(--transition);box-shadow:var(--shadow-sm)}
  .ud-empty-cta:hover{background:var(--gold);color:var(--ink);box-shadow:0 6px 20px rgba(201,168,76,0.3)}

  /* TRUST BAR */
  .ud-trust-bar{background:var(--white);border-top:1px solid var(--border);padding:20px 32px;}
  .ud-trust-inner{max-width:920px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:wrap;}
  .ud-trust-item{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);padding:8px 28px;}
  .ud-trust-item span:first-child{font-size:14px}
  .ud-trust-divider{width:1px;height:20px;background:var(--border)}
  @media(max-width:600px){.ud-trust-divider{display:none}.ud-trust-item{padding:6px 14px}}

  /* RESPONSIVE */
  @media(max-width:600px){
    .ud-hero{padding:90px 20px 60px}
    .ud-body{padding:28px 16px 64px}
    .ud-card{padding-left:28px}
    .ud-badge-desk{display:none}
    .ud-badge-mob{display:inline-flex}
    .ud-card-top{flex-wrap:wrap}
    .ud-modal{padding:28px 20px 24px}
    .ud-modal-btns{flex-direction:column}
    .ud-pay-banner{flex-direction:column;align-items:flex-start}
    .ud-pay-btn{width:100%}
    .ud-stats{gap:10px}
    .bdd-footer{padding:14px 16px}
    .bdd-foot-btn{min-width:100px;font-size:12px;padding:11px 12px}
    .bdd-header{padding:22px 16px 20px}
    .bdd-section{padding:18px 16px}
    .bdd-details-grid{grid-template-columns:1fr 1fr}
    .bdd-pay-banner{flex-direction:column;align-items:flex-start;padding:14px 16px}
    .bdd-pay-btn{width:100%}
    .bdd-paid-badge,.bdd-waiting-banner,.bdd-dcr-banner{padding:12px 16px}
  }
  @media(max-width:360px){.bdd-details-grid{grid-template-columns:1fr}}

  /* ANIMATIONS */
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes modalUp{from{opacity:0;transform:translateY(28px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.7)}}
  @keyframes payPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)}50%{box-shadow:0 0 0 6px rgba(201,168,76,0)}}
`;