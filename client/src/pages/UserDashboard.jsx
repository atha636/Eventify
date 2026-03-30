import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

const STATUS_META = {
  pending:  { label: "Pending",  color: "#c9a84c", bg: "rgba(201,168,76,0.1)",  border: "rgba(201,168,76,0.3)",  icon: "⏳" },
  approved: { label: "Confirmed", color: "#2d6a4f", bg: "rgba(45,106,79,0.1)",  border: "rgba(45,106,79,0.3)",   icon: "✓" },
  rejected: { label: "Declined", color: "#b85c5c", bg: "rgba(184,92,92,0.1)",   border: "rgba(184,92,92,0.3)",   icon: "✕" },
};

export default function UserDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await API.get("/bookings", {
        headers: { Authorization: token },
      });
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const filtered = filter === "all"
    ? bookings
    : bookings.filter((b) => b.status === filter);

  const counts = {
    all:      bookings.length,
    pending:  bookings.filter(b => b.status === "pending").length,
    approved: bookings.filter(b => b.status === "approved").length,
    rejected: bookings.filter(b => b.status === "rejected").length,
  };

  // Get initials from vendor title or id
  const getInitial = (b) =>
    b.vendorId?.title?.charAt(0)?.toUpperCase() ||
    b.vendorId?.toString()?.charAt(0)?.toUpperCase() || "V";

  const getVendorName = (b) =>
    b.vendorId?.title || `Vendor #${b.vendorId?.toString()?.slice(-5) || "—"}`;

  const getServiceType = (b) =>
    b.vendorId?.serviceType || b.serviceType || "Service";

  return (
    <>
      <style>{styles}</style>
      <div className="ud-root">
        <Navbar />

        <div className="ud-body">

          {/* ── HEADER ── */}
          <div className="ud-header">
            <div>
              <p className="ud-eyebrow">✦ Client Portal</p>
              <h1 className="ud-title">My Bookings</h1>
              <p className="ud-subtitle">Track and manage all your event reservations</p>
            </div>
            <a href="/" className="ud-browse-btn">Browse Services →</a>
          </div>

          {/* ── STATS ── */}
          <div className="ud-stats">
            {[
              { label: "Total Bookings", value: counts.all,      icon: "📋", color: "var(--ink)" },
              { label: "Pending",        value: counts.pending,  icon: "⏳", color: "#c9a84c"    },
              { label: "Confirmed",      value: counts.approved, icon: "✓",  color: "#2d6a4f"    },
              { label: "Declined",       value: counts.rejected, icon: "✕",  color: "#b85c5c"    },
            ].map((s) => (
              <div key={s.label} className="ud-stat-card">
                <span className="ud-stat-icon">{s.icon}</span>
                <span className="ud-stat-value" style={{ color: s.color }}>{s.value}</span>
                <span className="ud-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── FILTER TABS ── */}
          <div className="ud-tabs">
            {["all", "pending", "approved", "rejected"].map((tab) => (
              <button
                key={tab}
                className={`ud-tab ${filter === tab ? "active" : ""}`}
                onClick={() => setFilter(tab)}
              >
                {tab === "all" ? "All" : tab === "approved" ? "Confirmed" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ud-tab-count">{counts[tab]}</span>
              </button>
            ))}
          </div>

          {/* ── BOOKINGS ── */}
          {loading ? (
            <div className="ud-loading">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="ud-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="ud-empty">
              <div className="ud-empty-icon">
                {filter === "all" ? "🗓" : filter === "pending" ? "⏳" : filter === "approved" ? "✓" : "✕"}
              </div>
              <h3>{filter === "all" ? "No bookings yet" : `No ${filter === "approved" ? "confirmed" : filter} bookings`}</h3>
              <p>
                {filter === "all"
                  ? "You haven't made any bookings yet. Explore our vendors and plan your perfect event!"
                  : `You don't have any ${filter === "approved" ? "confirmed" : filter} bookings right now.`}
              </p>
              {filter === "all" && (
                <a href="/" className="ud-empty-cta">Explore Vendors →</a>
              )}
            </div>
          ) : (
            <div className="ud-bookings">
              {filtered.map((b, i) => {
                const meta = STATUS_META[b.status] || STATUS_META.pending;
                return (
                  <div
                    key={b._id}
                    className="ud-card"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    {/* STATUS STRIPE */}
                    <div className="ud-card-stripe" style={{ background: meta.color }} />

                    {/* VENDOR AVATAR */}
                    <div className="ud-vendor-avatar">
                      {b.vendorId?.images?.[0] ? (
                        <img src={b.vendorId.images[0]} alt="vendor" />
                      ) : (
                        <span>{getInitial(b)}</span>
                      )}
                    </div>

                    {/* MAIN INFO */}
                    <div className="ud-card-info">
                      <h3 className="ud-vendor-name">{getVendorName(b)}</h3>
                      <p className="ud-service-type">
                        <span className="ud-service-dot">◈</span>
                        {getServiceType(b)}
                      </p>
                      <div className="ud-card-meta">
                        <span className="ud-meta-chip">
                          🗓 {new Date(b.date).toLocaleDateString("en-IN", {
                            weekday: "short", day: "numeric",
                            month: "short", year: "numeric",
                          })}
                        </span>
                        {b.package && (
                          <span className="ud-meta-chip">📦 {b.package}</span>
                        )}
                        {b.vendorId?.location && (
                          <span className="ud-meta-chip">◉ {b.vendorId.location}</span>
                        )}
                      </div>
                    </div>

                    {/* STATUS + ACTION */}
                    <div className="ud-card-right">
                      <span
                        className="ud-status-badge"
                        style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
                      >
                        {meta.icon} {meta.label}
                      </span>

                      {b.vendorId?._id && (
                        <a
                          href={`/vendor/${b.vendorId._id}`}
                          className="ud-view-btn"
                        >
                          View Vendor →
                        </a>
                      )}
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
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --muted: #7a7265;
    --border: rgba(201,168,76,0.2);
    --surface: #faf7f2;
    --white: #ffffff;
  }

  .ud-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  .ud-body {
    max-width: 1000px;
    margin: 0 auto;
    padding: 48px 32px 80px;
  }

  /* ── HEADER ── */
  .ud-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 40px;
    animation: fadeUp 0.5s ease both;
  }
  .ud-eyebrow {
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 8px;
  }
  .ud-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 4vw, 2.8rem);
    font-weight: 300;
    color: var(--ink);
    line-height: 1.1;
    margin-bottom: 6px;
  }
  .ud-subtitle { font-size: 13.5px; color: var(--muted); }

  .ud-browse-btn {
    display: inline-block;
    padding: 12px 24px;
    background: var(--ink);
    color: var(--white);
    text-decoration: none;
    border-radius: 7px;
    font-size: 13px; font-weight: 500;
    letter-spacing: 0.03em;
    transition: all 0.22s ease;
    white-space: nowrap;
  }
  .ud-browse-btn:hover {
    background: var(--gold);
    color: var(--ink);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(201,168,76,0.3);
  }

  /* ── STATS ── */
  .ud-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 32px;
    animation: fadeUp 0.5s ease 0.1s both;
  }
  @media (max-width: 700px) { .ud-stats { grid-template-columns: repeat(2,1fr); } }

  .ud-stat-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px 18px;
    display: flex; flex-direction: column; gap: 5px;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .ud-stat-card:hover {
    box-shadow: 0 4px 20px rgba(201,168,76,0.1);
    transform: translateY(-2px);
  }
  .ud-stat-icon { font-size: 1.3rem; }
  .ud-stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.2rem; font-weight: 600; line-height: 1;
  }
  .ud-stat-label { font-size: 11.5px; color: var(--muted); }

  /* ── TABS ── */
  .ud-tabs {
    display: flex; gap: 4px; flex-wrap: wrap;
    border-bottom: 1px solid var(--border);
    margin-bottom: 28px;
    animation: fadeUp 0.5s ease 0.15s both;
  }
  .ud-tab {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 18px;
    background: none; border: none;
    border-bottom: 2px solid transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: var(--muted);
    cursor: pointer; transition: all 0.2s;
    margin-bottom: -1px;
  }
  .ud-tab:hover { color: var(--ink); }
  .ud-tab.active { color: var(--ink); border-bottom-color: var(--gold); font-weight: 500; }
  .ud-tab-count {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 1px 8px; font-size: 11px; color: var(--muted);
  }
  .ud-tab.active .ud-tab-count {
    background: var(--ink); color: var(--white); border-color: var(--ink);
  }

  /* ── BOOKING CARDS ── */
  .ud-bookings { display: flex; flex-direction: column; gap: 12px; }

  .ud-card {
    position: relative;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 22px 24px 22px 32px;
    display: flex;
    align-items: center;
    gap: 18px;
    animation: fadeUp 0.45s ease both;
    transition: box-shadow 0.25s, border-color 0.25s, transform 0.25s;
    overflow: hidden;
  }
  .ud-card:hover {
    box-shadow: 0 8px 32px rgba(14,12,10,0.08);
    border-color: rgba(201,168,76,0.35);
    transform: translateY(-2px);
  }

  /* colored left stripe */
  .ud-card-stripe {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    border-radius: 12px 0 0 12px;
    opacity: 0.7;
  }

  .ud-vendor-avatar {
    width: 52px; height: 52px;
    border-radius: 10px;
    overflow: hidden;
    background: var(--ink);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }
  .ud-vendor-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .ud-vendor-avatar span {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem; font-weight: 600;
    color: var(--gold);
  }

  .ud-card-info { flex: 1; min-width: 0; }
  .ud-vendor-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem; font-weight: 600;
    color: var(--ink); margin-bottom: 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ud-service-type {
    font-size: 12px; color: var(--muted);
    display: flex; align-items: center; gap: 5px;
    margin-bottom: 10px; text-transform: capitalize;
  }
  .ud-service-dot { color: var(--gold); font-size: 10px; }

  .ud-card-meta { display: flex; gap: 10px; flex-wrap: wrap; }
  .ud-meta-chip {
    font-size: 11.5px; color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 3px 10px;
    white-space: nowrap;
  }

  .ud-card-right {
    display: flex; flex-direction: column;
    align-items: flex-end; gap: 10px;
    flex-shrink: 0;
  }
  .ud-status-badge {
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.08em;
    padding: 5px 12px;
    border-radius: 20px;
    white-space: nowrap;
    display: flex; align-items: center; gap: 5px;
  }
  .ud-view-btn {
    font-size: 12px; color: var(--muted);
    text-decoration: none;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 14px;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .ud-view-btn:hover { border-color: var(--gold); color: var(--gold); }

  /* SKELETON */
  .ud-loading { display: flex; flex-direction: column; gap: 12px; }
  .ud-skeleton {
    height: 96px; border-radius: 12px;
    background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease infinite;
  }

  /* EMPTY */
  .ud-empty {
    text-align: center; padding: 80px 20px;
    animation: fadeUp 0.5s ease both;
  }
  .ud-empty-icon {
    font-size: 3rem; margin-bottom: 16px;
    width: 72px; height: 72px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }
  .ud-empty h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem; font-weight: 600;
    color: var(--ink); margin-bottom: 8px;
  }
  .ud-empty p { font-size: 13.5px; color: var(--muted); line-height: 1.6; margin-bottom: 24px; max-width: 400px; margin-left: auto; margin-right: auto; }
  .ud-empty-cta {
    display: inline-block;
    padding: 13px 28px;
    background: var(--ink); color: var(--white);
    text-decoration: none; border-radius: 7px;
    font-size: 13px; font-weight: 500;
    transition: all 0.2s;
  }
  .ud-empty-cta:hover { background: var(--gold); color: var(--ink); }

  @media (max-width: 640px) {
    .ud-card { flex-wrap: wrap; padding-left: 28px; }
    .ud-card-right { flex-direction: row; width: 100%; justify-content: space-between; }
    .ud-body { padding: 32px 20px 60px; }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;