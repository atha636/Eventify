import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ProfilePopup from "./ProfilePopup";
import NotificationPanel from "./NotificationPanel";
import API from "../services/api";

export default function Navbar() {
  const location  = useLocation();
  const navigate  = useNavigate();

  // triple click → admin
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const handleLogoClick = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current === 3) { navigate("/admin/login"); clickCountRef.current = 0; return; }
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      if (clickCountRef.current === 1) navigate("/");
      clickCountRef.current = 0;
    }, 400);
  };

  const [scrolled, setScrolled]           = useState(false);
  const [hidden, setHidden]               = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  const lastScrollY = useRef(0);

  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "null");
  const isUser   = user?.role === "user";
  const isVendor = user?.role === "vendor";
  // Both users and vendors receive notifications
  const canReceiveNotifs = isUser || isVendor;

  // ── Fetch unread count on mount (users + vendors) ─────────────────
  useEffect(() => {
    if (!token || !canReceiveNotifs) return;
    const fetchCount = async () => {
      try {
        const res = await API.get("/notifications");
        setUnreadCount(res.data.unreadCount || 0);
      } catch {}
    };
    fetchCount();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [token, canReceiveNotifs]);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 40);
      setHidden(currentY > lastScrollY.current && currentY > 80);
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); setNotifOpen(false); }, [location]);

  const handleLogout = () => { localStorage.clear(); window.location.href = "/"; };
  const isActive = (path) => location.pathname === path;

  const darkPages = ["/", "/login", "/register"];
  const isDark = darkPages.includes(location.pathname) || location.pathname.startsWith("/category");
  const isTransparent = isDark && !scrolled;

  const initial = (user?.name || "U").charAt(0).toUpperCase();

  // Shared bell button component logic
  const BellButton = ({ onClick }) => (
    <button
      className="nb-bell-btn"
      onClick={onClick}
      title="Notifications"
    >
      <span className="nb-bell-icon">🔔</span>
      {unreadCount > 0 && (
        <span className="nb-bell-badge">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      <style>{styles}</style>
      <nav className={`nb-root ${isTransparent ? "nb-transparent" : "nb-solid"} ${scrolled ? "nb-scrolled" : ""} ${hidden ? "nb-hidden" : ""}`}>
        <div className="nb-inner">

          {/* LOGO */}
          <div className="nb-logo" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
            <span className="nb-logo-mark">✦</span>
            <span className="nb-logo-text">Evencers</span>
          </div>

          {/* DESKTOP LINKS */}
          <div className="nb-links">
            <Link to="/" className={`nb-link ${isActive("/") ? "nb-link-active" : ""}`}>Home</Link>
            <Link to="/category/decor" className={`nb-link ${location.pathname.startsWith("/category") ? "nb-link-active" : ""}`}>Services</Link>
            <Link to="/vendors" className={`nb-link ${isActive("/vendors") ? "nb-link-active" : ""}`}>Vendors</Link>
          </div>

          {/* ACTIONS */}
          <div className="nb-actions">
            {token ? (
              <>
                {/* ── VENDOR ACTIONS ── */}
                {isVendor && (
                  <>
                    <Link to="/vendor-dashboard" className="nb-ghost-btn">Dashboard</Link>

                    {/* VENDOR NOTIFICATION BELL */}
                    <BellButton onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }} />
                  </>
                )}

                {/* ── USER ACTIONS ── */}
                {isUser && (
                  <>
                    <Link
                      to="/favourites"
                      className={`nb-heart-btn ${isActive("/favourites") ? "nb-heart-active" : ""}`}
                      title="My Favourites"
                    >
                      {isActive("/favourites") ? "♥" : "♡"}
                    </Link>
                    <Link to="/my-bookings" className="nb-ghost-btn">My Bookings</Link>

                    {/* USER NOTIFICATION BELL */}
                    <BellButton onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }} />
                  </>
                )}

                {/* PROFILE AVATAR — both roles */}
                <button
                  className="nb-avatar-btn"
                  onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                  title="My Profile"
                >
                  <span className="nb-avatar-initial">{initial}</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nb-ghost-btn">Sign In</Link>
                <Link to="/register" className="nb-solid-btn">Get Started</Link>
              </>
            )}
          </div>

          {/* HAMBURGER */}
          <button
            className={`nb-burger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* MOBILE MENU */}
        <div className={`nb-mobile-menu ${menuOpen ? "open" : ""} ${isTransparent ? "nb-mobile-dark" : ""}`}>
          <div className="nb-mobile-links">
            <Link to="/" className="nb-mobile-link">Home</Link>
            <Link to="/category/decor" className="nb-mobile-link">Services</Link>
            <Link to="/vendors" className="nb-mobile-link">Vendors</Link>
          </div>
          <div className="nb-mobile-divider" />
          <div className="nb-mobile-actions">
            {token ? (
              <>
                {/* ── VENDOR MOBILE ── */}
                {isVendor && (
                  <>
                    <Link to="/vendor-dashboard" className="nb-mobile-link">Vendor Dashboard</Link>
                    <button
                      className="nb-mobile-link"
                      style={{ textAlign: "left" }}
                      onClick={() => { setMenuOpen(false); setNotifOpen(true); }}
                    >
                      🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                  </>
                )}

                {/* ── USER MOBILE ── */}
                {isUser && (
                  <>
                    <Link to="/favourites" className="nb-mobile-link">♡ My Favourites</Link>
                    <Link to="/my-bookings" className="nb-mobile-link">My Bookings</Link>
                    <button
                      className="nb-mobile-link"
                      style={{ textAlign: "left" }}
                      onClick={() => { setMenuOpen(false); setNotifOpen(true); }}
                    >
                      🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                  </>
                )}

                <button
                  className="nb-mobile-link"
                  style={{ textAlign: "left", fontWeight: 500 }}
                  onClick={() => { setMenuOpen(false); setProfileOpen(true); }}
                >
                  👤 {user?.name || "My Profile"}
                </button>
                <button className="nb-mobile-link nb-mobile-logout" onClick={handleLogout}>Log Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nb-mobile-link">Sign In</Link>
                <Link to="/register" className="nb-mobile-cta">Get Started →</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── PROFILE POPUP ── */}
      {profileOpen && <ProfilePopup onClose={() => setProfileOpen(false)} />}

      {/* ── NOTIFICATION PANEL (users + vendors) ── */}
      {notifOpen && (
        <NotificationPanel
          onClose={() => setNotifOpen(false)}
          onUnreadChange={(count) => setUnreadCount(count)}
        />
      )}
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --gold-glow: rgba(201,168,76,0.18); --muted: #7a7265; --border: rgba(201,168,76,0.18);
    --white: #ffffff; --surface: #faf8f4;
    --nb-height: 66px; --nb-height-mobile: 58px;
  }

  .nb-root { width:100%; position:fixed; top:0; left:0; right:0; z-index:100; font-family:'DM Sans',sans-serif; transition:transform 0.38s cubic-bezier(0.4,0,0.2,1),background 0.3s ease,box-shadow 0.3s ease,border-color 0.3s ease; }
  .nb-hidden { transform:translateY(-100%); }

  .nb-transparent { background:transparent; border-bottom:1px solid transparent; }
  .nb-transparent .nb-link,.nb-transparent .nb-ghost-btn { color:rgba(245,240,232,0.88); }
  .nb-transparent .nb-link:hover,.nb-transparent .nb-ghost-btn:hover { color:var(--gold); }
  .nb-transparent .nb-link-active { color:var(--gold)!important; }
  .nb-transparent .nb-logo-text { color:var(--gold-light); }
  .nb-transparent .nb-logo-mark { color:var(--gold); }
  .nb-transparent .nb-solid-btn { background:rgba(255,255,255,0.1); backdrop-filter:blur(8px); color:var(--white); border:1px solid rgba(255,255,255,0.22); }
  .nb-transparent .nb-solid-btn:hover { background:var(--gold); color:var(--ink); border-color:var(--gold); }
  .nb-transparent .nb-heart-btn { color:rgba(245,240,232,0.7); }
  .nb-transparent .nb-heart-btn:hover { color:#e88fa0; }
  .nb-transparent .nb-burger span { background:rgba(245,240,232,0.9); }
  .nb-transparent .nb-avatar-btn { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.25); }
  .nb-transparent .nb-avatar-initial { color:var(--white); }
  .nb-transparent .nb-bell-btn { color:rgba(245,240,232,0.75); }
  .nb-transparent .nb-bell-btn:hover { color:var(--gold); }

  .nb-solid { background:var(--white); border-bottom:1px solid var(--border); }
  .nb-solid .nb-link { color:var(--muted); }
  .nb-solid .nb-link:hover { color:var(--ink); }
  .nb-solid .nb-link-active { color:var(--ink)!important; font-weight:500; }
  .nb-solid .nb-logo-text { color:var(--ink); }
  .nb-solid .nb-logo-mark { color:var(--gold); }
  .nb-solid .nb-ghost-btn { color:var(--muted); }
  .nb-solid .nb-ghost-btn:hover { color:var(--ink); }
  .nb-solid .nb-solid-btn { background:var(--ink); color:var(--white); border:1px solid var(--ink); }
  .nb-solid .nb-solid-btn:hover { background:var(--gold); color:var(--ink); border-color:var(--gold); }
  .nb-solid .nb-heart-btn { color:#c8b0b8; }
  .nb-solid .nb-heart-btn:hover { color:#c0445a; }
  .nb-solid .nb-heart-btn.nb-heart-active { color:#c0445a; }
  .nb-solid .nb-burger span { background:var(--ink); }
  .nb-solid .nb-avatar-btn { background:var(--surface); border-color:var(--border); }
  .nb-solid .nb-avatar-initial { color:var(--ink); }
  .nb-solid .nb-bell-btn { color:var(--muted); }
  .nb-solid .nb-bell-btn:hover { color:var(--ink); }

  .nb-scrolled { background:rgba(12,10,8,0.82)!important; backdrop-filter:blur(16px) saturate(1.4); -webkit-backdrop-filter:blur(16px) saturate(1.4); border-bottom:1px solid rgba(201,168,76,0.12)!important; box-shadow:0 1px 0 rgba(201,168,76,0.08),0 8px 32px rgba(0,0,0,0.2); }
  .nb-scrolled .nb-link,.nb-scrolled .nb-ghost-btn { color:rgba(245,240,232,0.82); }
  .nb-scrolled .nb-link:hover,.nb-scrolled .nb-ghost-btn:hover { color:var(--gold)!important; }
  .nb-scrolled .nb-link-active { color:var(--gold)!important; }
  .nb-scrolled .nb-logo-text { color:var(--gold-light); }
  .nb-scrolled .nb-logo-mark { color:var(--gold); }
  .nb-scrolled .nb-solid-btn { background:var(--gold); color:var(--ink); border:none; }
  .nb-scrolled .nb-solid-btn:hover { background:var(--gold-light); color:var(--ink); }
  .nb-scrolled .nb-heart-btn { color:rgba(245,240,232,0.5); }
  .nb-scrolled .nb-heart-btn:hover { color:#e88fa0; }
  .nb-scrolled .nb-heart-btn.nb-heart-active { color:#e88fa0; }
  .nb-scrolled .nb-burger span { background:rgba(245,240,232,0.9); }
  .nb-scrolled .nb-avatar-btn { background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.2); }
  .nb-scrolled .nb-avatar-initial { color:var(--white); }
  .nb-scrolled .nb-bell-btn { color:rgba(245,240,232,0.75); }
  .nb-scrolled .nb-bell-btn:hover { color:var(--gold); }

  .nb-inner { display:flex; align-items:center; justify-content:space-between; max-width:1200px; margin:0 auto; padding:0 36px; height:var(--nb-height); }

  .nb-logo { display:flex; align-items:center; gap:8px; flex-shrink:0; text-decoration:none; user-select:none; }
  .nb-logo-mark { font-size:0.95rem; transition:color 0.3s,transform 0.4s ease; display:inline-block; }
  .nb-logo:hover .nb-logo-mark { transform:rotate(45deg) scale(1.1); color:var(--gold)!important; }
  .nb-logo-text { font-family:'Cormorant Garamond',serif; font-size:1.35rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; transition:color 0.3s; }

  .nb-links { display:flex; align-items:center; gap:36px; }
  .nb-link { text-decoration:none; font-size:12.5px; font-weight:400; letter-spacing:0.06em; text-transform:uppercase; transition:color 0.2s; position:relative; padding-bottom:3px; }
  .nb-link::after { content:''; position:absolute; bottom:-1px; left:0; width:0; height:1px; background:var(--gold); transition:width 0.28s cubic-bezier(0.4,0,0.2,1); }
  .nb-link:hover::after,.nb-link-active::after { width:100%; }

  .nb-actions { display:flex; align-items:center; gap:4px; }
  .nb-ghost-btn { text-decoration:none; font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:400; letter-spacing:0.03em; padding:8px 14px; border-radius:6px; border:none; background:none; cursor:pointer; transition:color 0.2s,background 0.2s; }
  .nb-ghost-btn:hover { background:var(--gold-glow); }

  .nb-heart-btn { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:50%; font-size:17px; text-decoration:none; background:none; border:none; cursor:pointer; transition:color 0.22s,transform 0.22s,background 0.22s; }
  .nb-heart-btn:hover { transform:scale(1.15); background:rgba(192,68,90,0.08); }
  .nb-heart-btn.nb-heart-active { animation:heartPop 0.35s ease; }

  /* ── BELL BUTTON ── */
  .nb-bell-btn {
    position:relative; width:34px; height:34px; border-radius:50%;
    background:none; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    font-size:16px; transition:transform 0.2s,background 0.2s;
  }
  .nb-bell-btn:hover { transform:scale(1.12); background:var(--gold-glow); }
  .nb-bell-btn:hover .nb-bell-icon { animation:nbBellRing 0.4s ease; }
  .nb-bell-icon { display:inline-block; }
  .nb-bell-badge {
    position:absolute; top:0; right:0;
    min-width:16px; height:16px; border-radius:8px;
    background:#e03c3c; color:#fff;
    font-size:9px; font-weight:700; font-family:'DM Sans',sans-serif;
    display:flex; align-items:center; justify-content:center;
    padding:0 3px;
    border:1.5px solid var(--white);
    animation:nbBadgePop 0.3s cubic-bezier(0.34,1.6,0.64,1) both;
  }

  .nb-solid-btn { text-decoration:none; font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:500; letter-spacing:0.04em; padding:9px 20px; border-radius:6px; cursor:pointer; transition:background 0.22s ease,color 0.22s ease,border-color 0.22s ease,transform 0.18s ease,box-shadow 0.22s ease; display:inline-block; }
  .nb-solid-btn:hover { transform:translateY(-1px); box-shadow:0 4px 18px rgba(201,168,76,0.22); }

  .nb-avatar-btn { width:34px; height:34px; border-radius:50%; border:1.5px solid; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s; flex-shrink:0; }
  .nb-avatar-btn:hover { transform:scale(1.08); box-shadow:0 0 0 3px rgba(201,168,76,0.2); border-color:var(--gold)!important; }
  .nb-avatar-initial { font-family:'Cormorant Garamond',serif; font-size:1rem; font-weight:600; line-height:1; }

  .nb-burger { display:none; flex-direction:column; justify-content:center; align-items:flex-end; gap:5px; width:36px; height:36px; background:none; border:none; cursor:pointer; padding:4px 2px; }
  .nb-burger span { display:block; height:1.5px; border-radius:2px; transition:all 0.32s cubic-bezier(0.4,0,0.2,1); }
  .nb-burger span:nth-child(1) { width:22px; }
  .nb-burger span:nth-child(2) { width:16px; }
  .nb-burger span:nth-child(3) { width:22px; }
  .nb-burger.open span:nth-child(1) { width:22px; transform:translateY(6.5px) rotate(45deg); }
  .nb-burger.open span:nth-child(2) { opacity:0; transform:scaleX(0); }
  .nb-burger.open span:nth-child(3) { width:22px; transform:translateY(-6.5px) rotate(-45deg); }

  .nb-mobile-menu { display:none; flex-direction:column; overflow:hidden; max-height:0; transition:max-height 0.38s cubic-bezier(0.4,0,0.2,1); background:var(--white); border-top:1px solid var(--border); }
  .nb-mobile-menu.open { max-height:560px; }
  .nb-mobile-menu.nb-mobile-dark { background:rgba(11,9,7,0.97); backdrop-filter:blur(16px); border-top:1px solid rgba(201,168,76,0.12); }
  .nb-mobile-menu.nb-mobile-dark .nb-mobile-link { color:rgba(245,240,232,0.75); }
  .nb-mobile-menu.nb-mobile-dark .nb-mobile-link:hover { color:var(--gold); background:rgba(201,168,76,0.06); }
  .nb-mobile-menu.nb-mobile-dark .nb-mobile-logout { color:#e07878; }
  .nb-mobile-menu.nb-mobile-dark .nb-mobile-divider { background:rgba(201,168,76,0.15); }
  .nb-mobile-menu.nb-mobile-dark .nb-mobile-cta { background:var(--gold); color:var(--ink); }

  .nb-mobile-links,.nb-mobile-actions { display:flex; flex-direction:column; padding:6px 0; }
  .nb-mobile-link { display:block; padding:13px 28px; font-size:13px; font-weight:400; letter-spacing:0.03em; color:var(--muted); text-decoration:none; background:none; border:none; text-align:left; cursor:pointer; font-family:'DM Sans',sans-serif; transition:color 0.2s,background 0.2s; width:100%; }
  .nb-mobile-link:hover { color:var(--ink); background:var(--surface); }
  .nb-mobile-logout { color:#b85c5c; }
  .nb-mobile-divider { height:1px; background:var(--border); margin:4px 24px; }
  .nb-mobile-cta { display:block; margin:8px 24px 16px; padding:13px 20px; background:var(--ink); color:var(--white); text-decoration:none; text-align:center; border-radius:7px; font-size:13px; font-weight:500; letter-spacing:0.04em; font-family:'DM Sans',sans-serif; transition:background 0.2s,color 0.2s; }
  .nb-mobile-cta:hover { background:var(--gold); color:var(--ink); }

  @media(max-width:768px){
    .nb-links{display:none}.nb-actions{display:none}
    .nb-burger{display:flex}.nb-mobile-menu{display:flex}
    .nb-inner{padding:0 22px;height:var(--nb-height-mobile)}
  }

  @keyframes heartPop{0%{transform:scale(1)}40%{transform:scale(1.35)}70%{transform:scale(0.9)}100%{transform:scale(1)}}
  @keyframes nbBellRing{0%,100%{transform:rotate(0)}20%{transform:rotate(-18deg)}40%{transform:rotate(16deg)}60%{transform:rotate(-12deg)}80%{transform:rotate(8deg)}}
  @keyframes nbBadgePop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
`;