import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import ServiceCard from "../components/ServiceCard";

const STATUS_META = {
  pending:  { label: "Pending",  color: "#c9a84c", bg: "rgba(201,168,76,0.1)",  border: "rgba(201,168,76,0.3)"  },
  approved: { label: "Approved", color: "#2d6a4f", bg: "rgba(45,106,79,0.1)",   border: "rgba(45,106,79,0.3)"   },
  rejected: { label: "Rejected", color: "#b85c5c", bg: "rgba(184,92,92,0.1)",   border: "rgba(184,92,92,0.3)"   },
};

function fmt(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

// ═══════════════════════════════════════════════════════════════
// CHANGE 2 — Date/Address Change Request Popup
// Shown when a booking has a pending dateChangeRequest
// ═══════════════════════════════════════════════════════════════
function DateChangePopup({ booking, onAccept, onReject, responding }) {
  const dcr     = booking.dateChangeRequest;
  const client  = booking.userId?.name || "The client";

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
          Are you comfortable with the new details?
        </p>

        {/* What's changing */}
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

        {/* Current values for reference */}
        <div className="vd-popup-current">
          <span className="vd-popup-current-label">Current:</span>
          <span>{fmt(booking.date)}</span>
          {booking.userDetails?.address && <span>· {booking.userDetails.address}</span>}
        </div>

        <div className="vd-popup-btns">
          <button
            className="vd-popup-reject-btn"
            onClick={onReject}
            disabled={responding}
          >
            {responding === "reject" ? <span className="vd-spinner vd-spinner-dark" /> : "✕ Decline"}
          </button>
          <button
            className="vd-popup-accept-btn"
            onClick={onAccept}
            disabled={responding}
          >
            {responding === "approve" ? <span className="vd-spinner" /> : "✓ Accept Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const [bookings,  setBookings]  = useState([]);
  const [services,  setServices]  = useState([]);
  const [loadingB,  setLoadingB]  = useState(true);
  const [loadingS,  setLoadingS]  = useState(true);
  const [updating,  setUpdating]  = useState(null);
  const [filter,    setFilter]    = useState("all");

  // ── CHANGE 2: Which booking's popup is open + responding state ──
  const [popupBooking, setPopupBooking] = useState(null);
  const [responding,   setResponding]   = useState(null); // "approve" | "reject" | null

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await API.get("/bookings/vendor", { headers: { Authorization: `Bearer ${token}` } });
      setBookings(res.data);

      // ── CHANGE 2: Auto-open popup for first booking with pending DCR ──
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
    } finally {
      setUpdating(null);
    }
  };

  // ── CHANGE 2: Accept date/address change ────────────────────────
  const handleAcceptChange = async () => {
    if (!popupBooking) return;
    setResponding("approve");
    try {
      await API.put(`/bookings/${popupBooking._id}/date-change`, { action: "approve" });
      setPopupBooking(null);
      await fetchBookings();
    } catch (e) {
      console.error("acceptChange error:", e);
    } finally {
      setResponding(null);
    }
  };

  // ── CHANGE 2: Reject date/address change ────────────────────────
  const handleRejectChange = async () => {
    if (!popupBooking) return;
    setResponding("reject");
    try {
      await API.put(`/bookings/${popupBooking._id}/date-change`, { action: "reject" });
      setPopupBooking(null);
      await fetchBookings();
    } catch (e) {
      console.error("rejectChange error:", e);
    } finally {
      setResponding(null);
    }
  };

  const handleServiceDeleted = (deletedId) => setServices((prev) => prev.filter((s) => s._id !== deletedId));

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const counts   = {
    all:      bookings.length,
    pending:  bookings.filter((b) => b.status === "pending").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };

  // Count bookings with pending date change requests (for badge)
  const pendingDcrCount = bookings.filter((b) => b.dateChangeRequest?.status === "pending").length;

  return (
    <>
      <style>{styles}</style>
      <div className="vd-root">
        <Navbar />

        {/* ── CHANGE 2: Date/Address Change Popup ── */}
        {popupBooking && (
          <DateChangePopup
            booking={popupBooking}
            onAccept={handleAcceptChange}
            onReject={handleRejectChange}
            responding={responding}
          />
        )}

        <div className="vd-body">

          {/* ── HEADER ── */}
          <div className="vd-header">
            <div className="vd-header-left">
              <p className="vd-eyebrow">✦ Vendor Portal</p>
              <h1 className="vd-title">Dashboard</h1>
              <p className="vd-subtitle">Manage your bookings and services</p>
            </div>
            <a href="/add-service" className="vd-add-btn">+ Add New Service</a>
          </div>

          {/* ── STATS ── */}
          <div className="vd-stats">
            {[
              { label: "Total Bookings",   value: counts.all,      icon: "📋" },
              { label: "Pending",          value: counts.pending,  icon: "⏳" },
              { label: "Approved",         value: counts.approved, icon: "✓"  },
              { label: "Rejected",         value: counts.rejected, icon: "✕"  },
            ].map((s) => (
              <div key={s.label} className="vd-stat-card">
                <span className="vd-stat-icon">{s.icon}</span>
                <span className="vd-stat-value">{s.value}</span>
                <span className="vd-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── CHANGE 2: Alert banner when there are pending change requests ── */}
          {pendingDcrCount > 0 && (
            <div
              className="vd-dcr-alert"
              onClick={() => {
                const first = bookings.find((b) => b.dateChangeRequest?.status === "pending");
                if (first) setPopupBooking(first);
              }}
            >
              <span className="vd-dcr-alert-icon">📅</span>
              <div>
                <strong>{pendingDcrCount} client{pendingDcrCount !== 1 ? "s" : ""}</strong> want{pendingDcrCount === 1 ? "s" : ""} to change their booking details
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
              <div className="vd-svc-grid">{[...Array(3)].map((_, i) => <div key={i} className="vd-skeleton vd-skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />)}</div>
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
                <p className="vd-section-sub">Manage incoming booking requests</p>
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
              <div className="vd-loading">{[...Array(3)].map((_, i) => <div key={i} className="vd-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />)}</div>
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
                  const dcr     = b.dateChangeRequest;
                  const hasDcr  = dcr?.status === "pending";

                  return (
                    <div key={b._id} className={`vd-booking-card ${hasDcr ? "vd-booking-card-dcr" : ""}`} style={{ animationDelay: `${i * 0.06}s` }}>
                      {/* LEFT */}
                      <div className="vd-booking-left">
                        <div className="vd-avatar">{b.userId?.name?.charAt(0)?.toUpperCase() || "?"}</div>
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

                          {/* CHANGE 2: Show pending DCR inline on the card too */}
                          {hasDcr && (
                            <div className="vd-dcr-pill" onClick={() => setPopupBooking(b)}>
                              <span>📅 Client wants changes</span>
                              {dcr.requestedDate    && <span className="vd-dcr-pill-detail">Date → {fmt(dcr.requestedDate)}</span>}
                              {dcr.requestedAddress && <span className="vd-dcr-pill-detail">Addr → {dcr.requestedAddress}</span>}
                              <span className="vd-dcr-pill-cta">Review →</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="vd-booking-right">
                        <span className="vd-status-badge" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                          {meta.label}
                        </span>

                        {b.status === "pending" && (
                          <div className="vd-actions">
                            <button
                              className={`vd-accept-btn ${updating === b._id + "approved" ? "loading" : ""}`}
                              onClick={() => updateStatus(b._id, "approved")}
                              disabled={!!updating}
                            >
                              {updating === b._id + "approved" ? <span className="vd-spinner" /> : "✓ Accept"}
                            </button>
                            <button
                              className={`vd-reject-btn ${updating === b._id + "rejected" ? "loading" : ""}`}
                              onClick={() => updateStatus(b._id, "rejected")}
                              disabled={!!updating}
                            >
                              {updating === b._id + "rejected" ? <span className="vd-spinner vd-spinner-dark" /> : "✕ Reject"}
                            </button>
                          </div>
                        )}

                        {b.status === "approved" && !hasDcr && (
                          <button className="vd-undo-btn" onClick={() => updateStatus(b._id, "pending")}>Undo</button>
                        )}
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

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --muted: #7a7265; --border: rgba(201,168,76,0.2); --surface: #faf7f2; --white: #ffffff;
  }
  .vd-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }
  .vd-body { max-width: 1100px; margin: 0 auto; padding: 48px 32px 80px; }

  /* ── CHANGE 2: Date Change Popup ── */
  .vd-popup-overlay {
    position: fixed; inset: 0; background: rgba(14,12,10,0.65); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
    padding: 20px; animation: fadeIn 0.2s ease both;
  }
  .vd-popup {
    background: var(--white); border: 1px solid rgba(201,168,76,0.25); border-radius: 20px;
    padding: 36px 32px 30px; width: min(500px, 95vw);
    box-shadow: 0 32px 80px rgba(0,0,0,0.2);
    animation: popupUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both;
  }
  .vd-popup-icon-wrap {
    width: 60px; height: 60px; border-radius: 50%;
    background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.7rem; margin: 0 auto 20px;
  }
  .vd-popup-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600;
    color: var(--ink); text-align: center; margin-bottom: 10px;
  }
  .vd-popup-sub { font-size: 13.5px; color: var(--muted); text-align: center; line-height: 1.65; margin-bottom: 24px; }
  .vd-popup-sub strong { color: var(--ink); font-weight: 500; }
  .vd-popup-changes {
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 12px;
  }
  .vd-popup-change-row { display: flex; align-items: flex-start; gap: 10px; }
  .vd-popup-change-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 1px; }
  .vd-popup-change-label { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 3px; }
  .vd-popup-change-value { font-size: 14px; font-weight: 500; color: var(--ink); }
  .vd-popup-reason { padding-top: 12px; border-top: 1px solid var(--border); }
  .vd-popup-reason-label { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .vd-popup-reason-text { font-size: 13px; color: var(--muted); font-style: italic; }
  .vd-popup-current {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    font-size: 12px; color: var(--muted); margin-bottom: 24px;
    padding: 8px 12px; background: rgba(122,114,101,0.06); border-radius: 8px;
  }
  .vd-popup-current-label { font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; }
  .vd-popup-btns { display: flex; gap: 10px; }
  .vd-popup-reject-btn {
    flex: 1; padding: 13px 16px;
    background: rgba(184,92,92,0.08); color: #b85c5c;
    border: 1px solid rgba(184,92,92,0.25); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.22s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .vd-popup-reject-btn:hover:not(:disabled) { background: #b85c5c; color: white; border-color: #b85c5c; }
  .vd-popup-reject-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .vd-popup-accept-btn {
    flex: 2; padding: 13px 16px;
    background: #2d6a4f; color: white; border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.22s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .vd-popup-accept-btn:hover:not(:disabled) { background: #1e4f39; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,106,79,0.3); }
  .vd-popup-accept-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  /* Alert banner */
  .vd-dcr-alert {
    display: flex; align-items: center; gap: 12px;
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.28);
    border-radius: 12px; padding: 14px 18px; margin-bottom: 32px;
    cursor: pointer; transition: background 0.2s; font-size: 13.5px; color: var(--ink);
    animation: fadeUp 0.4s ease both;
  }
  .vd-dcr-alert:hover { background: rgba(201,168,76,0.14); }
  .vd-dcr-alert-icon { font-size: 1.3rem; flex-shrink: 0; }
  .vd-dcr-alert-cta { margin-left: auto; color: var(--gold); font-weight: 500; font-size: 13px; white-space: nowrap; }

  /* Booking card highlight for pending DCR */
  .vd-booking-card-dcr { border-color: rgba(201,168,76,0.4); box-shadow: 0 0 0 2px rgba(201,168,76,0.12); }

  /* DCR pill inside booking card */
  .vd-dcr-pill {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    margin-top: 8px; padding: 8px 12px;
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.25);
    border-radius: 8px; font-size: 12px; color: #8a6f1e; cursor: pointer;
    transition: background 0.2s; font-weight: 500;
  }
  .vd-dcr-pill:hover { background: rgba(201,168,76,0.14); }
  .vd-dcr-pill-detail { font-weight: 400; color: var(--muted); }
  .vd-dcr-pill-cta { margin-left: auto; color: var(--gold); font-weight: 600; }

  /* ── HEADER ── */
  .vd-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; animation: fadeUp 0.5s ease both; }
  .vd-eyebrow { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .vd-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 300; color: var(--ink); line-height: 1.1; margin-bottom: 6px; }
  .vd-subtitle { font-size: 13.5px; color: var(--muted); }
  .vd-add-btn { display: inline-block; padding: 12px 24px; background: var(--ink); color: var(--white); text-decoration: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; letter-spacing: 0.03em; transition: all 0.22s ease; white-space: nowrap; }
  .vd-add-btn:hover { background: var(--gold); color: var(--ink); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,168,76,0.3); }

  /* ── STATS ── */
  .vd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 32px; animation: fadeUp 0.5s ease 0.1s both; }
  @media (max-width: 700px) { .vd-stats { grid-template-columns: repeat(2,1fr); } }
  .vd-stat-card { background: var(--white); border: 1px solid var(--border); border-radius: 10px; padding: 20px 18px; display: flex; flex-direction: column; gap: 6px; transition: box-shadow 0.2s; }
  .vd-stat-card:hover { box-shadow: 0 4px 20px rgba(201,168,76,0.1); }
  .vd-stat-icon { font-size: 1.3rem; }
  .vd-stat-value { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: var(--ink); line-height: 1; }
  .vd-stat-label { font-size: 11.5px; color: var(--muted); }

  /* ── SECTIONS ── */
  .vd-section { margin-bottom: 56px; animation: fadeUp 0.5s ease 0.15s both; }
  .vd-section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  .vd-section-title { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: var(--ink); margin-bottom: 3px; }
  .vd-section-sub { font-size: 12.5px; color: var(--muted); }
  .vd-section-add { font-size: 12.5px; color: var(--gold); text-decoration: none; font-weight: 500; border: 1px solid var(--border); padding: 6px 14px; border-radius: 6px; transition: all 0.2s; white-space: nowrap; }
  .vd-section-add:hover { background: rgba(201,168,76,0.07); border-color: var(--gold); }

  /* ── SERVICES GRID ── */
  .vd-svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  @media (max-width: 900px) { .vd-svc-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 560px)  { .vd-svc-grid { grid-template-columns: 1fr; } }
  .vd-svc-card-wrapper { animation: fadeUp 0.45s ease both; }
  .vd-svc-empty { background: var(--white); border: 1px dashed rgba(201,168,76,0.35); border-radius: 12px; padding: 48px 24px; text-align: center; }
  .vd-svc-empty-icon { font-size: 2.2rem; display: block; margin-bottom: 12px; }
  .vd-svc-empty-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .vd-svc-empty-sub { font-size: 13px; color: var(--muted); }

  /* ── TABS ── */
  .vd-tabs { display: flex; gap: 6px; margin-bottom: 20px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .vd-tab { display: flex; align-items: center; gap: 7px; padding: 10px 18px; background: none; border: none; border-bottom: 2px solid transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer; transition: all 0.2s; margin-bottom: -1px; text-transform: capitalize; }
  .vd-tab:hover { color: var(--ink); }
  .vd-tab.active { color: var(--ink); border-bottom-color: var(--gold); font-weight: 500; }
  .vd-tab-count { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1px 8px; font-size: 11px; color: var(--muted); }
  .vd-tab.active .vd-tab-count { background: var(--ink); color: var(--white); border-color: var(--ink); }

  /* ── BOOKINGS ── */
  .vd-bookings { display: flex; flex-direction: column; gap: 12px; }
  .vd-booking-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center; gap: 20px; animation: fadeUp 0.45s ease both; transition: box-shadow 0.25s, border-color 0.25s; }
  .vd-booking-card:hover { box-shadow: 0 6px 28px rgba(14,12,10,0.07); border-color: rgba(201,168,76,0.35); }
  .vd-booking-left { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
  .vd-avatar { width: 46px; height: 46px; background: var(--ink); color: var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; flex-shrink: 0; }
  .vd-booking-name { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
  .vd-booking-email { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  .vd-booking-meta { display: flex; gap: 14px; flex-wrap: wrap; }
  .vd-meta-item { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 4px; }
  .vd-user-details { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
  .vd-detail-chip { font-size: 11.5px; color: #6b6358; line-height: 1.4; max-width: 320px; }
  .vd-booking-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
  .vd-status-badge { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; white-space: nowrap; }
  .vd-actions { display: flex; gap: 8px; }
  .vd-accept-btn { padding: 9px 18px; background: rgba(45,106,79,0.1); color: #2d6a4f; border: 1px solid rgba(45,106,79,0.3); border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; min-width: 90px; justify-content: center; }
  .vd-accept-btn:hover:not(:disabled) { background: #2d6a4f; color: var(--white); border-color: #2d6a4f; }
  .vd-reject-btn { padding: 9px 18px; background: rgba(184,92,92,0.08); color: #b85c5c; border: 1px solid rgba(184,92,92,0.25); border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; min-width: 90px; justify-content: center; }
  .vd-reject-btn:hover:not(:disabled) { background: #b85c5c; color: var(--white); border-color: #b85c5c; }
  .vd-accept-btn.loading, .vd-reject-btn.loading { opacity: 0.6; pointer-events: none; }
  .vd-accept-btn:disabled, .vd-reject-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .vd-undo-btn { padding: 7px 14px; background: none; color: var(--muted); border: 1px solid var(--border); border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.2s; }
  .vd-undo-btn:hover { border-color: var(--gold); color: var(--ink); }
  .vd-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  .vd-spinner-dark { border-color: rgba(184,92,92,0.3); border-top-color: #b85c5c; }
  .vd-loading { display: flex; flex-direction: column; gap: 12px; }
  .vd-skeleton { height: 88px; border-radius: 12px; background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }
  .vd-skeleton-card { height: 280px; }
  .vd-empty { text-align: center; padding: 72px 20px; }
  .vd-empty-icon { font-size: 3rem; margin-bottom: 16px; }
  .vd-empty h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
  .vd-empty p { font-size: 13.5px; color: var(--muted); }

  @media (max-width: 640px) {
    .vd-booking-card { flex-direction: column; align-items: flex-start; }
    .vd-booking-right { width: 100%; justify-content: flex-start; }
    .vd-body { padding: 32px 20px 60px; }
    .vd-popup { padding: 28px 20px 24px; }
    .vd-popup-btns { flex-direction: column; }
  }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes popupUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;