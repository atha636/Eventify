import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

// ── Secure admin guard ───────────────────────────────────────────────
function useAdminGuard() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
    if (!token || user?.role !== "admin") {
      localStorage.removeItem("token"); localStorage.removeItem("user");
      navigate("/admin/login"); return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        localStorage.removeItem("token"); localStorage.removeItem("user");
        navigate("/admin/login");
      }
    } catch {
      localStorage.removeItem("token"); localStorage.removeItem("user");
      navigate("/admin/login");
    }
  }, [navigate]);
}

// ── Spinner ──────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="ad-spinner-overlay">
      <div className="ad-spinner" />
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────
function StatCard({ icon, label, value }) {
  return (
    <div className="ad-stat">
      <div className="ad-stat-icon">{icon}</div>
      <div>
        <div className="ad-stat-value">{value ?? "—"}</div>
        <div className="ad-stat-label">{label}</div>
      </div>
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    pending:   { bg: "rgba(201,168,76,0.12)",  color: "#b8902a" },
    approved:  { bg: "rgba(60,160,80,0.12)",   color: "#2d7a3a" },
    rejected:  { bg: "rgba(184,92,92,0.12)",   color: "#b85c5c" },
    cancelled: { bg: "rgba(130,130,130,0.12)", color: "#888" },
    true:      { bg: "rgba(60,160,80,0.12)",   color: "#2d7a3a" },
    false:     { bg: "rgba(184,92,92,0.12)",   color: "#b85c5c" },
  };
  const key   = String(status);
  const c     = colors[key] || colors.pending;
  const label = key === "true" ? "Active" : key === "false" ? "Suspended" : key;
  return (
    <span className="ad-badge" style={{ background: c.bg, color: c.color }}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}

// ── Confirm dialog ───────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="ad-overlay">
      <div className="ad-dialog">
        <p className="ad-dialog-msg">{message}</p>
        <div className="ad-dialog-btns">
          <button className="ad-btn ad-btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting…" : "Confirm Delete"}
          </button>
          <button className="ad-btn ad-btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile card helpers ──────────────────────────────────────────────
function MobileCard({ children }) {
  return <div className="ad-mobile-card">{children}</div>;
}
function MobileRow({ label, children }) {
  return (
    <div className="ad-mobile-row">
      <span className="ad-mobile-label">{label}</span>
      <span className="ad-mobile-value">{children}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  useAdminGuard();
  const navigate = useNavigate();

  const [tab, setTab]           = useState("overview");
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loadingTab,    setLoadingTab]    = useState(false);
  const [loadingStats,  setLoadingStats]  = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionTarget,  setActionTarget]  = useState(null);

  const [confirm, setConfirm] = useState(null);
  const [toast,   setToast]   = useState({ msg: "", type: "info" });

  const admin = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "info" }), 3500);
  }, []);

  // ── Fetchers ─────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try { const r = await API.get("/admin/stats"); setStats(r.data); }
    catch (err) { showToast(err?.response?.data?.msg || "Failed to load stats.", "error"); }
    finally { setLoadingStats(false); }
  }, [showToast]);

  const fetchUsers = useCallback(async () => {
    setLoadingTab(true);
    try { const r = await API.get("/admin/users"); setUsers(r.data); }
    catch (err) { showToast(err?.response?.data?.msg || "Failed to load users.", "error"); }
    finally { setLoadingTab(false); }
  }, [showToast]);

  const fetchServices = useCallback(async () => {
    setLoadingTab(true);
    try { const r = await API.get("/admin/services"); setServices(r.data); }
    catch (err) { showToast(err?.response?.data?.msg || "Failed to load services.", "error"); }
    finally { setLoadingTab(false); }
  }, [showToast]);

  const fetchBookings = useCallback(async () => {
    setLoadingTab(true);
    try { const r = await API.get("/admin/bookings"); setBookings(r.data); }
    catch (err) { showToast(err?.response?.data?.msg || "Failed to load bookings.", "error"); }
    finally { setLoadingTab(false); }
  }, [showToast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (tab === "users")    fetchUsers();
    if (tab === "services") fetchServices();
    if (tab === "bookings") fetchBookings();
  }, [tab, fetchUsers, fetchServices, fetchBookings]);

  // ── Actions ───────────────────────────────────────────────────────
  const deleteUser = (id, name) => setConfirm({
    msg: `Delete user "${name}"? This also removes their services and bookings.`,
    onConfirm: async () => {
      setLoadingAction(true);
      try { await API.delete(`/admin/users/${id}`); setUsers(u => u.filter(x => x._id !== id)); showToast("User deleted.", "success"); }
      catch (err) { showToast(err?.response?.data?.msg || "Failed to delete user.", "error"); }
      finally { setLoadingAction(false); setConfirm(null); }
    },
  });

  const changeRole = async (id, role) => {
    setActionTarget(id + "role");
    try { await API.put(`/admin/users/${id}/role`, { role }); setUsers(u => u.map(x => x._id === id ? { ...x, role } : x)); showToast("Role updated.", "success"); }
    catch (err) { showToast(err?.response?.data?.msg || "Failed to update role.", "error"); }
    finally { setActionTarget(null); }
  };

  const deleteService = (id, title) => setConfirm({
    msg: `Delete service "${title}"? All related bookings will also be removed.`,
    onConfirm: async () => {
      setLoadingAction(true);
      try { await API.delete(`/admin/services/${id}`); setServices(s => s.filter(x => x._id !== id)); showToast("Service deleted.", "success"); }
      catch (err) { showToast(err?.response?.data?.msg || "Failed to delete service.", "error"); }
      finally { setLoadingAction(false); setConfirm(null); }
    },
  });

  const toggleApproval = async (id) => {
    setActionTarget(id + "toggle");
    try { const r = await API.put(`/admin/services/${id}/toggle`); setServices(s => s.map(x => x._id === id ? { ...x, isApproved: r.data.service.isApproved } : x)); showToast(r.data.msg || "Status updated.", "success"); }
    catch (err) { showToast(err?.response?.data?.msg || "Failed to toggle.", "error"); }
    finally { setActionTarget(null); }
  };

  const updateBookingStatus = async (id, status) => {
    setActionTarget(id + "status");
    try { await API.put(`/admin/bookings/${id}`, { status }); setBookings(b => b.map(x => x._id === id ? { ...x, status } : x)); showToast("Booking updated.", "success"); }
    catch (err) { showToast(err?.response?.data?.msg || "Failed to update booking.", "error"); }
    finally { setActionTarget(null); }
  };

  const deleteBooking = (id) => setConfirm({
    msg: "Delete this booking permanently?",
    onConfirm: async () => {
      setLoadingAction(true);
      try { await API.delete(`/admin/bookings/${id}`); setBookings(b => b.filter(x => x._id !== id)); showToast("Booking deleted.", "success"); }
      catch (err) { showToast(err?.response?.data?.msg || "Failed to delete booking.", "error"); }
      finally { setLoadingAction(false); setConfirm(null); }
    },
  });

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/admin/login"); };

  const NAV_ITEMS = [
    { key: "overview", icon: "◈", label: "Overview" },
    { key: "users",    icon: "👥", label: "Users" },
    { key: "services", icon: "🏷️", label: "Services" },
    { key: "bookings", icon: "📋", label: "Bookings" },
  ];

  const switchTab = (key) => { setTab(key); setSidebarOpen(false); };

  // ════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{styles}</style>
      <div className="ad-root">

        {/* Mobile backdrop */}
        {sidebarOpen && <div className="ad-backdrop" onClick={() => setSidebarOpen(false)} />}

        {/* ── Sidebar ── */}
        <aside className={`ad-sidebar ${sidebarOpen ? "ad-sidebar-open" : ""}`}>
          <div className="ad-sidebar-top">
            <div className="ad-logo">✦ Eventify</div>
            <div className="ad-admin-tag">Admin Panel</div>
            <div className="ad-admin-name">{admin.name}</div>
          </div>
          <nav className="ad-nav">
            {NAV_ITEMS.map(item => (
              <button key={item.key} className={`ad-nav-item ${tab === item.key ? "active" : ""}`} onClick={() => switchTab(item.key)}>
                <span className="ad-nav-icon">{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div className="ad-sidebar-bottom">
            <button className="ad-nav-item ad-logout" onClick={logout}>
              <span className="ad-nav-icon">↩</span>Log Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="ad-main">

          {/* Topbar */}
          <div className="ad-topbar">
            <button className="ad-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
            <h1 className="ad-page-title">
              {tab === "overview" && "Dashboard"}
              {tab === "users"    && "Users"}
              {tab === "services" && "Services"}
              {tab === "bookings" && "Bookings"}
            </h1>
            <button className="ad-mobile-logout" onClick={logout} title="Log out">↩</button>
          </div>

          {/* ══ OVERVIEW ══ */}
          {tab === "overview" && (
            <div className="ad-content">
              {loadingStats ? <Spinner /> : (
                <>
                  <div className="ad-stats-grid">
                    <StatCard icon="👥" label="Total Users"    value={stats?.totalUsers} />
                    <StatCard icon="🏷️" label="Total Services" value={stats?.totalVendors} />
                    <StatCard icon="📋" label="Bookings"       value={stats?.totalBookings} />
                    <StatCard icon="⏳" label="Pending"        value={stats?.pendingBookings} />
                    <StatCard icon="💰" label="Revenue"        value={stats ? `₹${stats.totalRevenue.toLocaleString("en-IN")}` : null} />
                  </div>

                  {stats?.recentBookings?.length > 0 && (
                    <div className="ad-section">
                      <h2 className="ad-section-title">Recent Bookings</h2>

                      {/* Desktop table */}
                      <div className="ad-table-wrap ad-desktop-only">
                        <table className="ad-table">
                          <thead><tr><th>Client</th><th>Service</th><th>Package</th><th>Amount</th><th>Status</th></tr></thead>
                          <tbody>
                            {stats.recentBookings.map(b => (
                              <tr key={b._id}>
                                <td><div className="ad-cell-name">{b.userId?.name || "—"}</div><div className="ad-cell-sub">{b.userId?.email}</div></td>
                                <td>{b.vendorId?.title || "—"}</td>
                                <td>{b.packageName}</td>
                                <td>₹{b.packagePrice?.toLocaleString("en-IN")}</td>
                                <td><StatusBadge status={b.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="ad-mobile-only">
                        {stats.recentBookings.map(b => (
                          <MobileCard key={b._id}>
                            <MobileRow label="Client">{b.userId?.name || "—"}</MobileRow>
                            <MobileRow label="Service">{b.vendorId?.title || "—"}</MobileRow>
                            <MobileRow label="Package">{b.packageName}</MobileRow>
                            <MobileRow label="Amount">₹{b.packagePrice?.toLocaleString("en-IN")}</MobileRow>
                            <MobileRow label="Status"><StatusBadge status={b.status} /></MobileRow>
                          </MobileCard>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══ USERS ══ */}
          {tab === "users" && (
            <div className="ad-content">
              {loadingTab ? <Spinner /> : (
                <>
                  <div className="ad-section-meta">{users.length} users found</div>

                  {/* Desktop */}
                  <div className="ad-table-wrap ad-desktop-only">
                    <table className="ad-table">
                      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Joined</th><th>Actions</th></tr></thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id}>
                            <td><div className="ad-cell-name">{u.name}</div></td>
                            <td className="ad-cell-muted">{u.email}</td>
                            <td>
                              <select className="ad-role-select" value={u.role} onChange={e => changeRole(u._id, e.target.value)} disabled={actionTarget === u._id + "role"}>
                                <option value="user">User</option>
                                <option value="vendor">Vendor</option>
                              </select>
                            </td>
                            <td><StatusBadge status={u.isVerified} /></td>
                            <td className="ad-cell-muted">{new Date(u.createdAt || Date.now()).toLocaleDateString("en-IN")}</td>
                            <td><button className="ad-action-btn ad-action-danger" onClick={() => deleteUser(u._id, u.name)}>Delete</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="ad-mobile-only">
                    {users.map(u => (
                      <MobileCard key={u._id}>
                        <MobileRow label="Name"><span className="ad-cell-name">{u.name}</span></MobileRow>
                        <MobileRow label="Email"><span style={{fontSize:"11px",color:"var(--muted)"}}>{u.email}</span></MobileRow>
                        <MobileRow label="Role">
                          <select className="ad-role-select" value={u.role} onChange={e => changeRole(u._id, e.target.value)} disabled={actionTarget === u._id + "role"}>
                            <option value="user">User</option>
                            <option value="vendor">Vendor</option>
                          </select>
                        </MobileRow>
                        <MobileRow label="Verified"><StatusBadge status={u.isVerified} /></MobileRow>
                        <MobileRow label="Joined">{new Date(u.createdAt || Date.now()).toLocaleDateString("en-IN")}</MobileRow>
                        <div style={{marginTop:"10px"}}>
                          <button className="ad-action-btn ad-action-danger" style={{width:"100%"}} onClick={() => deleteUser(u._id, u.name)}>Delete User</button>
                        </div>
                      </MobileCard>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ SERVICES ══ */}
          {tab === "services" && (
            <div className="ad-content">
              {loadingTab ? <Spinner /> : (
                <>
                  <div className="ad-section-meta">{services.length} services found</div>

                  {/* Desktop */}
                  <div className="ad-table-wrap ad-desktop-only">
                    <table className="ad-table">
                      <thead><tr><th>Title</th><th>Type</th><th>Vendor</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {services.map(s => (
                          <tr key={s._id}>
                            <td><div className="ad-cell-name">{s.title}</div></td>
                            <td className="ad-cell-type">{s.serviceType}</td>
                            <td><div className="ad-cell-name">{s.vendorId?.name || s.vendorName || "—"}</div><div className="ad-cell-sub">{s.vendorId?.email}</div></td>
                            <td className="ad-cell-muted">{s.location}</td>
                            <td><StatusBadge status={s.isApproved} /></td>
                            <td className="ad-actions-cell">
                              <button className={`ad-action-btn ${s.isApproved ? "ad-action-warn" : "ad-action-ok"}`} onClick={() => toggleApproval(s._id)} disabled={actionTarget === s._id + "toggle"}>
                                {actionTarget === s._id + "toggle" ? "…" : s.isApproved ? "Suspend" : "Approve"}
                              </button>
                              <button className="ad-action-btn ad-action-danger" onClick={() => deleteService(s._id, s.title)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="ad-mobile-only">
                    {services.map(s => (
                      <MobileCard key={s._id}>
                        <MobileRow label="Title"><span className="ad-cell-name">{s.title}</span></MobileRow>
                        <MobileRow label="Type"><span className="ad-cell-type">{s.serviceType}</span></MobileRow>
                        <MobileRow label="Vendor">{s.vendorId?.name || s.vendorName || "—"}</MobileRow>
                        <MobileRow label="Location"><span style={{color:"var(--muted)",fontSize:"12px"}}>{s.location}</span></MobileRow>
                        <MobileRow label="Status"><StatusBadge status={s.isApproved} /></MobileRow>
                        <div className="ad-mobile-actions">
                          <button className={`ad-action-btn ${s.isApproved ? "ad-action-warn" : "ad-action-ok"}`} onClick={() => toggleApproval(s._id)} disabled={actionTarget === s._id + "toggle"} style={{flex:1}}>
                            {actionTarget === s._id + "toggle" ? "…" : s.isApproved ? "Suspend" : "Approve"}
                          </button>
                          <button className="ad-action-btn ad-action-danger" onClick={() => deleteService(s._id, s.title)} style={{flex:1}}>Delete</button>
                        </div>
                      </MobileCard>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ BOOKINGS ══ */}
          {tab === "bookings" && (
            <div className="ad-content">
              {loadingTab ? <Spinner /> : (
                <>
                  <div className="ad-section-meta">{bookings.length} bookings found</div>

                  {/* Desktop */}
                  <div className="ad-table-wrap ad-desktop-only">
                    <table className="ad-table">
                      <thead><tr><th>Client</th><th>Service</th><th>Package</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b._id}>
                            <td><div className="ad-cell-name">{b.userId?.name || "—"}</div><div className="ad-cell-sub">{b.userId?.email}</div></td>
                            <td><div className="ad-cell-name">{b.vendorId?.title || "—"}</div><div className="ad-cell-sub">{b.vendorId?.serviceType}</div></td>
                            <td>{b.packageName}</td>
                            <td className="ad-cell-muted">{b.date ? new Date(b.date).toLocaleDateString("en-IN") : "—"}</td>
                            <td>₹{b.packagePrice?.toLocaleString("en-IN")}</td>
                            <td>
                              <select className="ad-status-select" value={b.status} onChange={e => updateBookingStatus(b._id, e.target.value)} disabled={actionTarget === b._id + "status"}>
                                {["pending","approved","rejected","cancelled"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                              </select>
                            </td>
                            <td><button className="ad-action-btn ad-action-danger" onClick={() => deleteBooking(b._id)}>Delete</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="ad-mobile-only">
                    {bookings.map(b => (
                      <MobileCard key={b._id}>
                        <MobileRow label="Client"><span className="ad-cell-name">{b.userId?.name || "—"}</span></MobileRow>
                        <MobileRow label="Email"><span style={{fontSize:"11px",color:"var(--muted)"}}>{b.userId?.email}</span></MobileRow>
                        <MobileRow label="Service">{b.vendorId?.title || "—"}</MobileRow>
                        <MobileRow label="Package">{b.packageName}</MobileRow>
                        <MobileRow label="Date">{b.date ? new Date(b.date).toLocaleDateString("en-IN") : "—"}</MobileRow>
                        <MobileRow label="Amount">₹{b.packagePrice?.toLocaleString("en-IN")}</MobileRow>
                        <MobileRow label="Status">
                          <select className="ad-status-select" value={b.status} onChange={e => updateBookingStatus(b._id, e.target.value)} disabled={actionTarget === b._id + "status"}>
                            {["pending","approved","rejected","cancelled"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                          </select>
                        </MobileRow>
                        <div style={{marginTop:"10px"}}>
                          <button className="ad-action-btn ad-action-danger" style={{width:"100%"}} onClick={() => deleteBooking(b._id)}>Delete Booking</button>
                        </div>
                      </MobileCard>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Mobile bottom tab bar ── */}
          <nav className="ad-bottom-nav">
            {NAV_ITEMS.map(item => (
              <button key={item.key} className={`ad-bottom-tab ${tab === item.key ? "active" : ""}`} onClick={() => switchTab(item.key)}>
                <span className="ad-bottom-icon">{item.icon}</span>
                <span className="ad-bottom-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </main>
      </div>

      {confirm && (
        <ConfirmDialog message={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => !loadingAction && setConfirm(null)} loading={loadingAction} />
      )}

      {toast.msg && (
        <div className={`ad-toast ${toast.type === "error" ? "ad-toast-error" : toast.type === "success" ? "ad-toast-success" : ""}`}>
          {toast.type === "error"   && <span className="ad-toast-icon">✕</span>}
          {toast.type === "success" && <span className="ad-toast-icon">✓</span>}
          {toast.msg}
        </div>
      )}
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --muted: #7a7265; --border: rgba(201,168,76,0.18); --surface: #faf7f2; --white: #ffffff;
    --sidebar-w: 240px; --topbar-h: 60px; --bottomnav-h: 64px;
  }

  .ad-root { display: flex; min-height: 100vh; font-family: 'DM Sans', sans-serif; background: var(--surface); }

  /* ══ SIDEBAR ══ */
  .ad-sidebar {
    width: var(--sidebar-w); background: var(--ink);
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; height: 100vh; z-index: 200;
    transition: transform 0.28s cubic-bezier(.4,0,.2,1);
  }
  .ad-sidebar-top { padding: 32px 24px 24px; border-bottom: 1px solid rgba(201,168,76,0.1); }
  .ad-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--gold); letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 16px; }
  .ad-admin-tag { display: inline-block; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; background: rgba(201,168,76,0.12); color: var(--gold); border: 1px solid rgba(201,168,76,0.25); padding: 3px 10px; border-radius: 20px; margin-bottom: 8px; }
  .ad-admin-name { font-size: 13px; color: rgba(245,240,232,0.7); }
  .ad-nav { flex: 1; padding: 24px 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
  .ad-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border: none; background: transparent; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 13.5px; border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; }
  .ad-nav-item:hover  { background: rgba(201,168,76,0.07); color: var(--gold-light); }
  .ad-nav-item.active { background: rgba(201,168,76,0.12); color: var(--gold); font-weight: 500; }
  .ad-nav-icon { font-size: 16px; flex-shrink: 0; }
  .ad-sidebar-bottom { padding: 12px; border-top: 1px solid rgba(201,168,76,0.1); }
  .ad-logout { color: #b85c5c !important; }
  .ad-logout:hover { background: rgba(184,92,92,0.1) !important; }

  /* ══ MAIN ══ */
  .ad-main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; min-height: 100vh; }

  /* ══ TOPBAR ══ */
  .ad-topbar { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 24px; height: var(--topbar-h); display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 50; }
  .ad-page-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: var(--ink); flex: 1; }
  .ad-hamburger { display: none; flex-direction: column; justify-content: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; flex-shrink: 0; }
  .ad-hamburger span { display: block; width: 20px; height: 2px; background: var(--ink); border-radius: 2px; }
  .ad-hamburger:hover { background: rgba(201,168,76,0.08); }
  .ad-mobile-logout { display: none; background: none; border: none; font-size: 18px; cursor: pointer; color: #b85c5c; padding: 6px 10px; border-radius: 6px; }

  .ad-content { padding: 28px 32px 32px; }
  .ad-section-meta { font-size: 12px; color: var(--muted); margin-bottom: 16px; }

  /* ══ SPINNER ══ */
  .ad-spinner-overlay { display: flex; align-items: center; justify-content: center; min-height: 240px; }
  .ad-spinner { width: 36px; height: 36px; border-radius: 50%; border: 3px solid var(--border); border-top-color: var(--gold); animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ══ STATS ══ */
  .ad-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 14px; margin-bottom: 36px; }
  .ad-stat { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 20px 18px; display: flex; gap: 14px; align-items: center; }
  .ad-stat-icon { font-size: 1.7rem; flex-shrink: 0; }
  .ad-stat-value { font-family: 'Cormorant Garamond', serif; font-size: 1.75rem; font-weight: 600; color: var(--ink); line-height: 1; }
  .ad-stat-label { font-size: 11px; color: var(--muted); margin-top: 4px; }
  .ad-section-title { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600; color: var(--ink); margin-bottom: 14px; }

  /* ══ TABLE ══ */
  .ad-table-wrap { background: var(--white); border: 1px solid var(--border); border-radius: 12px; overflow: auto; }
  .ad-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .ad-table thead tr { border-bottom: 1px solid var(--border); }
  .ad-table th { padding: 13px 16px; text-align: left; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); font-weight: 500; white-space: nowrap; }
  .ad-table td { padding: 14px 16px; border-bottom: 1px solid rgba(201,168,76,0.07); vertical-align: middle; }
  .ad-table tbody tr:last-child td { border-bottom: none; }
  .ad-table tbody tr:hover { background: rgba(201,168,76,0.03); }
  .ad-cell-name { font-weight: 500; color: var(--ink); }
  .ad-cell-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .ad-cell-muted { color: var(--muted); }
  .ad-cell-type { text-transform: capitalize; color: var(--gold); font-size: 12px; }
  .ad-badge { font-size: 10px; padding: 3px 10px; border-radius: 20px; font-weight: 500; letter-spacing: 0.05em; white-space: nowrap; }

  .ad-role-select, .ad-status-select { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--ink); background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 5px 8px; cursor: pointer; outline: none; }
  .ad-role-select:focus, .ad-status-select:focus { border-color: var(--gold); }
  .ad-role-select:disabled, .ad-status-select:disabled { opacity: 0.5; cursor: not-allowed; }

  .ad-actions-cell { display: flex; gap: 6px; }
  .ad-action-btn { font-family: 'DM Sans', sans-serif; font-size: 11.5px; padding: 5px 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; transition: all 0.2s; white-space: nowrap; }
  .ad-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ad-action-danger { background: rgba(184,92,92,0.1); color: #b85c5c; }
  .ad-action-danger:hover:not(:disabled) { background: #b85c5c; color: white; }
  .ad-action-warn { background: rgba(184,120,50,0.1); color: #b87832; }
  .ad-action-warn:hover:not(:disabled) { background: #b87832; color: white; }
  .ad-action-ok { background: rgba(60,160,80,0.1); color: #2d7a3a; }
  .ad-action-ok:hover:not(:disabled) { background: #2d7a3a; color: white; }

  /* ══ MOBILE CARDS ══ */
  .ad-mobile-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 10px; }
  .ad-mobile-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid rgba(201,168,76,0.06); }
  .ad-mobile-row:last-of-type { border-bottom: none; }
  .ad-mobile-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); font-weight: 500; flex-shrink: 0; margin-right: 12px; }
  .ad-mobile-value { font-size: 13px; color: var(--ink); text-align: right; }
  .ad-mobile-actions { display: flex; gap: 8px; margin-top: 12px; }

  /* ══ BOTTOM TAB BAR ══ */
  .ad-bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; height: var(--bottomnav-h); background: var(--ink); border-top: 1px solid rgba(201,168,76,0.15); z-index: 200; }
  .ad-bottom-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; background: none; border: none; cursor: pointer; padding: 8px 4px; transition: all 0.2s; }
  .ad-bottom-tab.active .ad-bottom-icon,
  .ad-bottom-tab.active .ad-bottom-label { color: var(--gold); }
  .ad-bottom-icon { font-size: 18px; color: var(--muted); transition: color 0.2s; }
  .ad-bottom-label { font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--muted); transition: color 0.2s; }

  /* ══ BACKDROP ══ */
  .ad-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 199; backdrop-filter: blur(2px); }

  /* ══ DIALOG ══ */
  .ad-overlay { position: fixed; inset: 0; background: rgba(14,12,10,0.6); display: flex; align-items: center; justify-content: center; z-index: 999; backdrop-filter: blur(4px); padding: 16px; }
  .ad-dialog { background: var(--white); border: 1px solid var(--border); border-radius: 14px; padding: 32px 28px; max-width: 400px; width: 100%; }
  .ad-dialog-msg { font-size: 14.5px; color: var(--ink); line-height: 1.65; margin-bottom: 24px; }
  .ad-dialog-btns { display: flex; gap: 10px; }
  .ad-btn { font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 10px 20px; border-radius: 7px; border: none; cursor: pointer; font-weight: 500; transition: all 0.2s; flex: 1; }
  .ad-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .ad-btn-danger { background: #b85c5c; color: white; }
  .ad-btn-danger:hover:not(:disabled) { background: #a94444; }
  .ad-btn-ghost { background: var(--surface); color: var(--muted); border: 1px solid var(--border); }
  .ad-btn-ghost:hover:not(:disabled) { color: var(--ink); border-color: var(--ink); }

  /* ══ TOAST ══ */
  .ad-toast { position: fixed; bottom: 28px; right: 28px; background: var(--ink); color: var(--gold-light); font-size: 13px; padding: 12px 18px; border-radius: 8px; border: 1px solid rgba(201,168,76,0.2); box-shadow: 0 8px 24px rgba(0,0,0,0.3); z-index: 9999; animation: slideUp 0.3s ease; display: flex; align-items: center; gap: 8px; }
  .ad-toast-error   { background: #3d1a1a; color: #e88; border-color: rgba(184,92,92,0.3); }
  .ad-toast-success { background: #0f2a14; color: #7ec88a; border-color: rgba(60,160,80,0.3); }
  .ad-toast-icon { font-size: 12px; font-weight: 700; flex-shrink: 0; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  /* ══ VISIBILITY HELPERS ══ */
  .ad-desktop-only { display: block; }
  .ad-mobile-only  { display: none; }

  /* ══ DESKTOP (>768px) ══ */
  @media (min-width: 769px) {
    .ad-bottom-nav    { display: none !important; }
    .ad-hamburger     { display: none !important; }
    .ad-mobile-logout { display: none !important; }
    .ad-toast { bottom: 28px; right: 28px; left: auto; max-width: 360px; }
  }

  /* ══ MOBILE (≤768px) ══ */
  @media (max-width: 768px) {
    /* Sidebar → slide-in drawer */
    .ad-sidebar { transform: translateX(-100%); }
    .ad-sidebar.ad-sidebar-open { transform: translateX(0); box-shadow: 8px 0 32px rgba(0,0,0,0.4); }

    /* Main takes full width, pad for bottom nav */
    .ad-main { margin-left: 0; padding-bottom: var(--bottomnav-h); }

    /* Show hamburger + mobile logout */
    .ad-hamburger     { display: flex; }
    .ad-mobile-logout { display: block; }

    /* Show bottom nav */
    .ad-bottom-nav { display: flex; }

    /* Cards instead of tables */
    .ad-desktop-only { display: none !important; }
    .ad-mobile-only  { display: block; }

    /* Stats: 2-col grid */
    .ad-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
    .ad-stat { padding: 14px 12px; gap: 10px; border-radius: 10px; }
    .ad-stat-value { font-size: 1.4rem; }
    .ad-stat-label { font-size: 10px; }

    .ad-content { padding: 14px 14px 20px; }

    /* Toast above bottom nav */
    .ad-toast { bottom: calc(var(--bottomnav-h) + 10px); right: 12px; left: 12px; max-width: none; font-size: 12px; }
  }
`;