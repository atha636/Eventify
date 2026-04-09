import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

const STATUS_META = {
  pending:   { label: "Pending",   color: "#c9a84c", bg: "rgba(201,168,76,0.08)",  border: "rgba(201,168,76,0.25)",  icon: "◷", glow: "rgba(201,168,76,0.15)" },
  approved:  { label: "Confirmed", color: "#3a8a62", bg: "rgba(58,138,98,0.08)",   border: "rgba(58,138,98,0.25)",   icon: "✓", glow: "rgba(58,138,98,0.12)"  },
  rejected:  { label: "Declined",  color: "#b85c5c", bg: "rgba(184,92,92,0.08)",   border: "rgba(184,92,92,0.25)",   icon: "✕", glow: "rgba(184,92,92,0.12)"  },
  cancelled: { label: "Cancelled", color: "#7a7265", bg: "rgba(122,114,101,0.08)", border: "rgba(122,114,101,0.22)", icon: "✕", glow: "rgba(122,114,101,0.1)" },
};

const DCR_META = {
  pending:  { label: "Change Requested", color: "#c9a84c", bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.3)" },
  approved: { label: "Date Updated",     color: "#3a8a62", bg: "rgba(58,138,98,0.08)",  border: "rgba(58,138,98,0.3)"  },
  rejected: { label: "Request Declined", color: "#b85c5c", bg: "rgba(184,92,92,0.08)",  border: "rgba(184,92,92,0.3)"  },
};

function fmt(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

export default function UserDashboard() {
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("all");

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling]     = useState(false);
  const [cancelError, setCancelError]   = useState("");

  // Date change modal
  const [dcrTarget, setDcrTarget]       = useState(null);   // booking object
  const [dcrDate, setDcrDate]           = useState("");
  const [dcrReason, setDcrReason]       = useState("");
  const [dcrLoading, setDcrLoading]     = useState(false);
  const [dcrError, setDcrError]         = useState("");
  const [dcrSuccess, setDcrSuccess]     = useState("");

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

  // ── CANCEL ──────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await API.put(`/bookings/cancel/${cancelTarget._id}`, {});
      setBookings(prev => prev.filter(b => b._id !== cancelTarget._id));
      setCancelTarget(null);
    } catch (err) {
      setCancelError("Failed to cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  // ── DATE CHANGE REQUEST ─────────────────────────────────────────
  const openDcr = (booking) => {
    setDcrTarget(booking);
    setDcrDate("");
    setDcrReason("");
    setDcrError("");
    setDcrSuccess("");
  };

  const closeDcr = () => {
    if (dcrLoading) return;
    setDcrTarget(null);
    setDcrError("");
    setDcrSuccess("");
  };

  const handleDcrSubmit = async () => {
    if (!dcrDate) { setDcrError("Please select a new date."); return; }
    setDcrLoading(true);
    setDcrError("");
    try {
      const res = await API.post(`/bookings/${dcrTarget._id}/date-change`, {
        requestedDate: dcrDate,
        reason: dcrReason,
      });
      // Update booking in local state
      setBookings(prev =>
        prev.map(b => b._id === dcrTarget._id ? res.data.booking : b)
      );
      setDcrSuccess("Request sent! The vendor will respond soon.");
    } catch (err) {
      setDcrError(err.response?.data?.error || "Failed to submit request.");
    } finally {
      setDcrLoading(false);
    }
  };
  // ────────────────────────────────────────────────────────────────

  const filtered = filter === "all"
    ? bookings
    : bookings.filter(b => b.status === filter);

  const counts = {
    all:      bookings.length,
    pending:  bookings.filter(b => b.status === "pending").length,
    approved: bookings.filter(b => b.status === "approved").length,
    rejected: bookings.filter(b => b.status === "rejected").length,
  };

  const getInitial    = (b) => b.vendorId?.title?.charAt(0)?.toUpperCase() || "V";
  const getVendorName = (b) => b.vendorId?.title || `Vendor #${b.vendorId?.toString()?.slice(-5) || "—"}`;
  const getServiceType = (b) => b.vendorId?.serviceType || "Service";

  // Today string for min date on date picker
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      <style>{styles}</style>
      <div className="ud-root">
        <Navbar />

        {/* ── CANCEL MODAL ── */}
        {cancelTarget && (
          <div className="ud-overlay" onClick={() => { if (!cancelling) { setCancelTarget(null); setCancelError(""); } }}>
            <div className="ud-modal" onClick={e => e.stopPropagation()}>
              <div className="ud-modal-icon-wrap ud-modal-danger">
                <span>🗑</span>
              </div>
              <h3 className="ud-modal-title">Cancel Booking?</h3>
              <p className="ud-modal-body">
                You are about to cancel your booking with <strong>{getVendorName(cancelTarget)}</strong> on <strong>{fmt(cancelTarget.date)}</strong>. This action cannot be undone.
              </p>
              {cancelError && <p className="ud-modal-err">⚠ {cancelError}</p>}
              <div className="ud-modal-btns">
                <button className="ud-mbtn ud-mbtn-ghost" onClick={() => { setCancelTarget(null); setCancelError(""); }} disabled={cancelling}>Keep Booking</button>
                <button className="ud-mbtn ud-mbtn-danger" onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? <><span className="ud-spinner" /> Cancelling…</> : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DATE CHANGE MODAL ── */}
        {dcrTarget && (
          <div className="ud-overlay" onClick={closeDcr}>
            <div className="ud-modal ud-modal-wide" onClick={e => e.stopPropagation()}>
              <div className="ud-modal-icon-wrap ud-modal-gold">
                <span>📅</span>
              </div>
              <h3 className="ud-modal-title">Request Date Change</h3>
              <p className="ud-modal-body">
                Current date: <strong>{fmt(dcrTarget.date)}</strong>
                <br />Service: <strong>{getVendorName(dcrTarget)}</strong>
              </p>

              {dcrSuccess ? (
                <div className="ud-dcr-success">
                  <span className="ud-dcr-success-icon">✓</span>
                  <p>{dcrSuccess}</p>
                  <button className="ud-mbtn ud-mbtn-gold" onClick={closeDcr} style={{ marginTop: "16px", width: "100%" }}>Done</button>
                </div>
              ) : (
                <>
                  <div className="ud-field">
                    <label className="ud-label">New Preferred Date <span className="ud-req">*</span></label>
                    <input
                      type="date"
                      className="ud-input"
                      min={todayStr}
                      value={dcrDate}
                      onChange={e => { setDcrDate(e.target.value); setDcrError(""); }}
                    />
                  </div>

                  <div className="ud-field">
                    <label className="ud-label">Reason <span className="ud-optional">(optional)</span></label>
                    <textarea
                      className="ud-textarea"
                      rows={3}
                      placeholder="e.g. Family emergency, schedule conflict…"
                      value={dcrReason}
                      onChange={e => setDcrReason(e.target.value)}
                    />
                  </div>

                  {dcrError && <p className="ud-modal-err">⚠ {dcrError}</p>}

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

        {/* ── HERO HEADER ── */}
        <div className="ud-hero">
          <div className="ud-hero-orb ud-orb1" />
          <div className="ud-hero-orb ud-orb2" />
          <div className="ud-hero-inner">
            <span className="ud-eyebrow">✦ Client Portal</span>
            <h1 className="ud-hero-title">My Bookings</h1>
            <p className="ud-hero-sub">Track and manage all your event reservations</p>
            <a href="/vendors" className="ud-hero-btn">Browse Services →</a>
          </div>
          {/* Floating stat pills */}
          <div className="ud-hero-pills">
            <div className="ud-pill">
              <span className="ud-pill-val">{counts.all}</span>
              <span className="ud-pill-label">Total</span>
            </div>
            <div className="ud-pill ud-pill-gold">
              <span className="ud-pill-val">{counts.pending}</span>
              <span className="ud-pill-label">Pending</span>
            </div>
            <div className="ud-pill ud-pill-green">
              <span className="ud-pill-val">{counts.approved}</span>
              <span className="ud-pill-label">Confirmed</span>
            </div>
          </div>
        </div>

        <div className="ud-body">

          {/* ── STATS GRID ── */}
          <div className="ud-stats">
            {[
              { label: "Total Bookings", value: counts.all,      icon: "◈", color: "var(--ink)",  accent: "rgba(14,12,10,0.06)"     },
              { label: "Pending",        value: counts.pending,  icon: "◷", color: "#c9a84c",     accent: "rgba(201,168,76,0.08)"   },
              { label: "Confirmed",      value: counts.approved, icon: "◎", color: "#3a8a62",     accent: "rgba(58,138,98,0.08)"    },
              { label: "Declined",       value: counts.rejected, icon: "◌", color: "#b85c5c",     accent: "rgba(184,92,92,0.08)"    },
            ].map((s, i) => (
              <div key={s.label} className="ud-stat" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="ud-stat-icon-wrap" style={{ background: s.accent }}>
                  <span className="ud-stat-icon" style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div>
                  <div className="ud-stat-val" style={{ color: s.color }}>{s.value}</div>
                  <div className="ud-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── FILTER TABS ── */}
          <div className="ud-tabs-wrap">
            <div className="ud-tabs">
              {[
                { key: "all",      label: "All Bookings" },
                { key: "pending",  label: "Pending"      },
                { key: "approved", label: "Confirmed"    },
                { key: "rejected", label: "Declined"     },
              ].map(t => (
                <button
                  key={t.key}
                  className={`ud-tab ${filter === t.key ? "active" : ""}`}
                  onClick={() => setFilter(t.key)}
                >
                  {t.label}
                  <span className="ud-tab-pill">{counts[t.key]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── BOOKING LIST ── */}
          {loading ? (
            <div className="ud-skeletons">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="ud-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="ud-empty">
              <div className="ud-empty-orb" />
              <span className="ud-empty-icon">
                {filter === "all" ? "🗓" : filter === "pending" ? "◷" : filter === "approved" ? "✓" : "✕"}
              </span>
              <h3>{filter === "all" ? "No bookings yet" : `No ${filter === "approved" ? "confirmed" : filter} bookings`}</h3>
              <p>{filter === "all" ? "Start exploring vendors and book your perfect event experience." : `You don't have any ${filter === "approved" ? "confirmed" : filter} bookings right now.`}</p>
              {filter === "all" && <a href="/vendors" className="ud-empty-cta">Explore Vendors →</a>}
            </div>
          ) : (
            <div className="ud-list">
              {filtered.map((b, i) => {
                const meta = STATUS_META[b.status] || STATUS_META.pending;
                const isPending = b.status === "pending";
                const isApproved = b.status === "approved";
                const canRequestDateChange = (isPending || isApproved) && b.dateChangeRequest?.status !== "pending";
                const dcr = b.dateChangeRequest;
                const hasDcr = dcr && dcr.status !== "none" && dcr.requestedDate;

                return (
                  <div
                    key={b._id}
                    className="ud-card"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    {/* Left accent bar */}
                    <div className="ud-card-bar" style={{ background: meta.color }} />

                    {/* Vendor avatar */}
                    <div className="ud-avatar">
                      {b.vendorId?.images?.[0] ? (
                        <img src={b.vendorId.images[0]} alt="" />
                      ) : (
                        <span>{getInitial(b)}</span>
                      )}
                    </div>

                    {/* Main content */}
                    <div className="ud-card-content">
                      <div className="ud-card-top">
                        <div>
                          <h3 className="ud-vname">{getVendorName(b)}</h3>
                          <p className="ud-stype">
                            <span className="ud-stype-dot">◈</span>
                            {getServiceType(b)}
                            {b.vendorId?.location && (
                              <span className="ud-loc"> · {b.vendorId.location}</span>
                            )}
                          </p>
                        </div>
                        {/* Status badge — desktop right */}
                        <span
                          className="ud-badge ud-badge-desk"
                          style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
                        >
                          <span>{meta.icon}</span> {meta.label}
                        </span>
                      </div>

                      {/* Date row */}
                      <div className="ud-date-row">
                        <div className="ud-date-chip">
                          <span className="ud-date-icon">🗓</span>
                          <span>{fmt(b.date)}</span>
                        </div>
                        {b.packageName && (
                          <div className="ud-date-chip">
                            <span className="ud-date-icon">📦</span>
                            <span>{b.packageName}</span>
                          </div>
                        )}
                      </div>

                      {/* Date change request status banner */}
                      {hasDcr && (
                        <div
                          className="ud-dcr-banner"
                          style={{
                            color: DCR_META[dcr.status]?.color || "#c9a84c",
                            background: DCR_META[dcr.status]?.bg || "rgba(201,168,76,0.08)",
                            border: `1px solid ${DCR_META[dcr.status]?.border || "rgba(201,168,76,0.3)"}`,
                          }}
                        >
                          <span className="ud-dcr-label">
                            {dcr.status === "pending" && "⏳ "}
                            {dcr.status === "approved" && "✓ "}
                            {dcr.status === "rejected" && "✕ "}
                            {DCR_META[dcr.status]?.label}
                          </span>
                          {dcr.requestedDate && (
                            <span className="ud-dcr-date">→ {fmt(dcr.requestedDate)}</span>
                          )}
                        </div>
                      )}

                      {/* Actions row */}
                      <div className="ud-actions">
                        {/* Status badge — mobile */}
                        <span
                          className="ud-badge ud-badge-mob"
                          style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
                        >
                          <span>{meta.icon}</span> {meta.label}
                        </span>

                        <div className="ud-action-btns">
                          {b.vendorId?._id && (
                            <a href={`/vendor/${b.vendorId._id}`} className="ud-btn ud-btn-ghost">
                              View →
                            </a>
                          )}
                          {canRequestDateChange && (
                            <button
                              className="ud-btn ud-btn-date"
                              onClick={() => openDcr(b)}
                            >
                              📅 Change Date
                            </button>
                          )}
                          {isPending && (
                            <button
                              className="ud-btn ud-btn-cancel"
                              onClick={() => { setCancelError(""); setCancelTarget(b); }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --gold-glow: rgba(201,168,76,0.15);
    --muted: #7a7265;
    --border: rgba(201,168,76,0.18);
    --surface: #faf7f2;
    --white: #ffffff;
    --danger: #a93226;
    --danger-bg: rgba(169,50,38,0.06);
    --danger-border: rgba(169,50,38,0.22);
  }

  .ud-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  /* ── OVERLAY / MODAL ── */
  .ud-overlay {
    position: fixed; inset: 0;
    background: rgba(10,8,6,0.6);
    backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease both;
    padding: 20px;
  }
  .ud-modal {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 36px 32px 30px;
    width: 100%; max-width: 420px;
    text-align: center;
    animation: modalUp 0.28s cubic-bezier(0.34,1.2,0.64,1) both;
    box-shadow: 0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5) inset;
  }
  .ud-modal-wide { max-width: 480px; }
  .ud-modal-icon-wrap {
    width: 58px; height: 58px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; margin: 0 auto 18px;
  }
  .ud-modal-danger { background: rgba(169,50,38,0.08); border: 1px solid rgba(169,50,38,0.18); }
  .ud-modal-gold   { background: rgba(201,168,76,0.1);  border: 1px solid rgba(201,168,76,0.25); }
  .ud-modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.7rem; font-weight: 400; font-style: italic;
    color: var(--ink); margin-bottom: 10px;
  }
  .ud-modal-body {
    font-size: 13.5px; color: var(--muted); line-height: 1.7;
    margin-bottom: 20px;
  }
  .ud-modal-body strong { color: var(--ink); font-weight: 500; }
  .ud-modal-err {
    font-size: 12.5px; color: var(--danger);
    background: var(--danger-bg); border: 1px solid var(--danger-border);
    border-radius: 8px; padding: 9px 13px; text-align: left;
    margin-bottom: 14px;
  }
  .ud-modal-btns { display: flex; gap: 10px; }
  .ud-mbtn {
    flex: 1; padding: 13px 16px;
    border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 0.22s ease;
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }
  .ud-mbtn:disabled { opacity: 0.55; cursor: not-allowed; }
  .ud-mbtn-ghost {
    background: transparent;
    border: 1px solid var(--border); color: var(--muted);
  }
  .ud-mbtn-ghost:hover:not(:disabled) {
    border-color: var(--muted); color: var(--ink); background: var(--surface);
  }
  .ud-mbtn-danger {
    background: var(--danger); border: none; color: white;
  }
  .ud-mbtn-danger:hover:not(:disabled) {
    background: #8e1f14; transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(169,50,38,0.3);
  }
  .ud-mbtn-gold {
    background: var(--gold); border: none; color: var(--ink);
  }
  .ud-mbtn-gold:hover:not(:disabled) {
    background: #b8942f; transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(201,168,76,0.35);
  }
  .ud-spinner {
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
    animation: spin 0.7s linear infinite; display: inline-block; flex-shrink: 0;
  }

  /* Form fields inside modal */
  .ud-field { text-align: left; margin-bottom: 14px; }
  .ud-label {
    display: block; font-size: 11.5px; font-weight: 500;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 7px;
  }
  .ud-req { color: var(--danger); }
  .ud-optional { color: var(--muted); font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 11px; }
  .ud-input, .ud-textarea {
    width: 100%; padding: 11px 14px;
    border: 1px solid var(--border); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--ink);
    background: var(--surface); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ud-input:focus, .ud-textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
  }
  .ud-textarea { resize: vertical; min-height: 80px; }

  /* DCR success state */
  .ud-dcr-success {
    background: rgba(58,138,98,0.06); border: 1px solid rgba(58,138,98,0.2);
    border-radius: 10px; padding: 20px; text-align: center;
  }
  .ud-dcr-success-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(58,138,98,0.12); color: #3a8a62;
    font-size: 1.1rem; margin-bottom: 10px;
  }
  .ud-dcr-success p { font-size: 13.5px; color: #3a8a62; line-height: 1.6; }

  /* ── HERO ── */
  .ud-hero {
    position: relative; overflow: hidden;
    background: var(--ink);
    padding: 96px 32px 56px;
    text-align: center;
  }
  .ud-hero-orb {
    position: absolute; border-radius: 50%;
    filter: blur(100px); opacity: 0.12; pointer-events: none;
  }
  .ud-orb1 { width: 500px; height: 500px; background: var(--gold); top: -200px; left: -80px; }
  .ud-orb2 { width: 300px; height: 300px; background: #7b5ea7; bottom: -80px; right: -60px; }
  .ud-hero-inner {
    position: relative; z-index: 2;
    animation: fadeUp 0.55s ease both;
  }
  .ud-eyebrow {
    display: block; font-size: 10.5px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--gold);
    margin-bottom: 14px; font-weight: 400;
  }
  .ud-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.4rem, 5vw, 3.4rem); font-weight: 300;
    color: var(--white); margin-bottom: 10px;
    letter-spacing: 0.02em; line-height: 1.1;
  }
  .ud-hero-sub {
    font-size: 13.5px; color: rgba(245,240,232,0.45);
    margin-bottom: 28px; font-weight: 300;
  }
  .ud-hero-btn {
    display: inline-block;
    padding: 12px 28px; background: var(--gold); color: var(--ink);
    text-decoration: none; border-radius: 7px;
    font-size: 13px; font-weight: 500; letter-spacing: 0.04em;
    transition: all 0.22s ease;
  }
  .ud-hero-btn:hover {
    background: var(--gold-light); transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(201,168,76,0.3);
  }
  .ud-hero-pills {
    position: relative; z-index: 2;
    display: flex; justify-content: center; gap: 10px;
    margin-top: 32px; flex-wrap: wrap;
  }
  .ud-pill {
    display: flex; align-items: center; gap: 9px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 40px; padding: 8px 18px;
    backdrop-filter: blur(8px);
    animation: fadeUp 0.5s ease 0.2s both;
  }
  .ud-pill-val {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.4rem; font-weight: 600; color: var(--white);
    line-height: 1;
  }
  .ud-pill-label { font-size: 11px; color: rgba(245,240,232,0.5); letter-spacing: 0.08em; }
  .ud-pill-gold { border-color: rgba(201,168,76,0.3); background: rgba(201,168,76,0.08); }
  .ud-pill-gold .ud-pill-val { color: var(--gold); }
  .ud-pill-green { border-color: rgba(58,138,98,0.3); background: rgba(58,138,98,0.08); }
  .ud-pill-green .ud-pill-val { color: #5fb889; }

  /* ── BODY ── */
  .ud-body {
    max-width: 900px; margin: 0 auto;
    padding: 44px 28px 88px;
  }

  /* ── STATS ── */
  .ud-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 14px; margin-bottom: 32px;
  }
  @media (max-width: 680px) { .ud-stats { grid-template-columns: repeat(2,1fr); } }
  .ud-stat {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 18px 16px;
    display: flex; align-items: center; gap: 14px;
    animation: fadeUp 0.5s ease both;
    transition: transform 0.22s, box-shadow 0.22s;
  }
  .ud-stat:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.07);
  }
  .ud-stat-icon-wrap {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .ud-stat-icon { font-size: 1.15rem; }
  .ud-stat-val {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 600; line-height: 1;
    margin-bottom: 2px;
  }
  .ud-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.04em; }

  /* ── TABS ── */
  .ud-tabs-wrap {
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .ud-tabs { display: flex; gap: 2px; flex-wrap: wrap; }
  .ud-tab {
    display: flex; align-items: center; gap: 8px;
    padding: 11px 18px; background: none; border: none;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    color: var(--muted); cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
  }
  .ud-tab:hover { color: var(--ink); }
  .ud-tab.active { color: var(--ink); border-bottom-color: var(--gold); font-weight: 500; }
  .ud-tab-pill {
    font-size: 10.5px; background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 1px 7px; color: var(--muted);
  }
  .ud-tab.active .ud-tab-pill { background: var(--ink); color: var(--white); border-color: var(--ink); }

  /* ── BOOKINGS LIST ── */
  .ud-list { display: flex; flex-direction: column; gap: 14px; }

  .ud-card {
    position: relative; overflow: hidden;
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px;
    padding: 22px 24px 20px 36px;
    display: flex; align-items: flex-start; gap: 16px;
    animation: fadeUp 0.45s ease both;
    transition: box-shadow 0.25s, border-color 0.25s, transform 0.25s;
  }
  .ud-card:hover {
    box-shadow: 0 12px 40px rgba(14,12,10,0.08);
    border-color: rgba(201,168,76,0.32);
    transform: translateY(-2px);
  }
  .ud-card-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
    border-radius: 14px 0 0 14px; opacity: 0.7;
  }

  .ud-avatar {
    width: 54px; height: 54px; border-radius: 12px;
    background: var(--ink); border: 1px solid var(--border);
    overflow: hidden; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .ud-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .ud-avatar span {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.4rem; font-weight: 600; color: var(--gold);
  }

  .ud-card-content { flex: 1; min-width: 0; }
  .ud-card-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 12px; margin-bottom: 10px;
  }
  .ud-vname {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600; color: var(--ink);
    margin-bottom: 4px; line-height: 1.2;
  }
  .ud-stype {
    font-size: 12px; color: var(--muted);
    display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
    text-transform: capitalize;
  }
  .ud-stype-dot { color: var(--gold); font-size: 9px; }
  .ud-loc { color: #9e9690; }

  .ud-date-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
  .ud-date-chip {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--muted);
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 4px 11px;
    white-space: nowrap;
  }
  .ud-date-icon { font-size: 11px; }

  /* Date change banner */
  .ud-dcr-banner {
    display: flex; align-items: center; gap: 10px;
    border-radius: 8px; padding: 7px 12px; margin-bottom: 10px;
    font-size: 12px; font-weight: 500;
  }
  .ud-dcr-label { flex: 1; }
  .ud-dcr-date { font-weight: 400; opacity: 0.85; }

  /* Action row */
  .ud-actions {
    display: flex; align-items: center;
    justify-content: space-between; gap: 10px;
    flex-wrap: wrap;
  }
  .ud-action-btns { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

  .ud-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 500; letter-spacing: 0.06em;
    padding: 5px 12px; border-radius: 20px; white-space: nowrap;
  }
  .ud-badge-desk { display: inline-flex; }
  .ud-badge-mob  { display: none; }

  .ud-btn {
    font-size: 12px; font-family: 'DM Sans', sans-serif; font-weight: 500;
    padding: 7px 15px; border-radius: 7px; cursor: pointer;
    transition: all 0.2s ease; white-space: nowrap;
    text-decoration: none; display: inline-flex; align-items: center; gap: 5px;
  }
  .ud-btn-ghost {
    background: transparent; color: var(--muted);
    border: 1px solid var(--border);
  }
  .ud-btn-ghost:hover { border-color: var(--gold); color: var(--gold); }

  .ud-btn-date {
    background: rgba(201,168,76,0.08);
    color: #a07b28;
    border: 1px solid rgba(201,168,76,0.3);
  }
  .ud-btn-date:hover {
    background: rgba(201,168,76,0.15);
    border-color: var(--gold); color: var(--ink);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(201,168,76,0.2);
  }
  .ud-btn-cancel {
    background: transparent;
    color: var(--danger);
    border: 1px solid var(--danger-border);
  }
  .ud-btn-cancel:hover {
    background: var(--danger-bg);
    border-color: var(--danger);
  }

  /* ── SKELETON ── */
  .ud-skeletons { display: flex; flex-direction: column; gap: 14px; }
  .ud-skeleton {
    height: 110px; border-radius: 14px;
    background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease infinite;
  }

  /* ── EMPTY ── */
  .ud-empty {
    position: relative; text-align: center;
    padding: 88px 20px;
    animation: fadeUp 0.5s ease both;
    overflow: hidden;
  }
  .ud-empty-orb {
    position: absolute; width: 400px; height: 400px;
    background: var(--gold); border-radius: 50%; filter: blur(120px);
    opacity: 0.04; top: 50%; left: 50%; transform: translate(-50%,-50%);
    pointer-events: none;
  }
  .ud-empty-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 72px; height: 72px; border-radius: 50%;
    background: var(--white); border: 1px solid var(--border);
    font-size: 1.8rem; margin-bottom: 20px;
  }
  .ud-empty h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.7rem; font-weight: 400; color: var(--ink); margin-bottom: 10px;
  }
  .ud-empty p {
    font-size: 13.5px; color: var(--muted); line-height: 1.65;
    max-width: 360px; margin: 0 auto 24px;
  }
  .ud-empty-cta {
    display: inline-block; padding: 13px 30px;
    background: var(--ink); color: var(--white);
    text-decoration: none; border-radius: 8px;
    font-size: 13px; font-weight: 500;
    transition: all 0.22s;
  }
  .ud-empty-cta:hover { background: var(--gold); color: var(--ink); }

  /* ── RESPONSIVE ── */
  @media (max-width: 600px) {
    .ud-hero { padding: 88px 20px 44px; }
    .ud-body { padding: 28px 16px 64px; }
    .ud-card { padding-left: 28px; }
    .ud-badge-desk { display: none; }
    .ud-badge-mob  { display: inline-flex; }
    .ud-card-top { flex-wrap: wrap; }
    .ud-modal { padding: 28px 20px 24px; }
    .ud-modal-btns { flex-direction: column; }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes modalUp {
    from { opacity: 0; transform: translateY(28px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;