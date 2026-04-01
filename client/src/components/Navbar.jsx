import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const goingDown = currentY > lastScrollY.current;

      setScrolled(currentY > 40);
      setHidden(goingDown && currentY > 80);

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const isActive = (path) => location.pathname === path;

  // Detect dark hero pages to use transparent style
  const darkPages = ["/", "/login", "/register"];
  const isDark = darkPages.includes(location.pathname) || location.pathname.startsWith("/category");
  const isTransparent = isDark && !scrolled;

  return (
    <>
      <style>{styles}</style>
      <nav className={`nb-root ${isTransparent ? "nb-transparent" : "nb-solid"} ${scrolled ? "nb-scrolled" : ""} ${hidden ? "nb-hidden" : ""}`}>
        <div className="nb-inner">

          {/* LOGO */}
          <Link to="/" className="nb-logo">
            <span className="nb-logo-mark">✦</span>
            <span className="nb-logo-text">Eventique</span>
          </Link>

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
                {user?.role === "vendor" && (
                  <Link to="/vendor-dashboard" className="nb-ghost-btn">
                    Vendor Dashboard
                  </Link>
                )}
                {user?.role === "user" && (
                  <Link to="/my-bookings" className="nb-ghost-btn">
                    My Bookings
                  </Link>
                )}
                <button className="nb-solid-btn" onClick={handleLogout}>Log Out</button>
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
        <div className={`nb-mobile-menu ${menuOpen ? "open" : ""}`}>
          <Link to="/" className="nb-mobile-link">Home</Link>
          <Link to="/category/decor" className="nb-mobile-link">Services</Link>
          <Link to="/vendors" className="nb-mobile-link">Vendors</Link>
          <div className="nb-mobile-divider" />
          {token ? (
            <>
              {user?.role === "vendor" && (
                <Link to="/vendor-dashboard" className="nb-ghost-btn">
                  Vendor Dashboard
                </Link>
              )}
              {user?.role === "user" && (
                <Link to="/my-bookings" className="nb-ghost-btn">
                  My Bookings
                </Link>
              )}
              <button className="nb-mobile-link nb-mobile-logout" onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nb-mobile-link">Sign In</Link>
              <Link to="/register" className="nb-mobile-cta">Get Started →</Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --muted: #7a7265;
    --border: rgba(201,168,76,0.2);
    --white: #ffffff;
  }

  .nb-root {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    font-family: 'DM Sans', sans-serif;
    transition: transform 0.35s ease, background 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease;
  }

  /* Hide navbar by sliding it up */
  .nb-hidden {
    transform: translateY(-100%);
  }

  /* transparent over dark hero */
  .nb-transparent {
    background: transparent;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .nb-transparent .nb-link,
  .nb-transparent .nb-ghost-btn {
    color: rgba(245,240,232,0.92);
    text-shadow: 0 1px 6px rgba(0,0,0,0.4);
  }
  .nb-transparent .nb-link:hover,
  .nb-transparent .nb-ghost-btn:hover {
    color: var(--gold);
    text-shadow: 0 0 8px rgba(201,168,76,0.6);
  }
  .nb-transparent .nb-link-active {
    color: var(--gold) !important;
  }
  .nb-transparent .nb-logo-text {
    color: var(--gold-light);
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  }
  .nb-transparent .nb-logo-mark { color: var(--gold); }
  .nb-transparent .nb-solid-btn {
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(6px);
    color: var(--white);
    border: 1px solid rgba(255,255,255,0.2);
  }
  .nb-transparent .nb-solid-btn:hover {
    background: var(--gold);
    color: var(--ink);
    border-color: var(--gold);
  }
  .nb-transparent .nb-burger span { background: var(--cream); }

  /* solid white */
  .nb-solid {
    background: var(--white);
    border-bottom: 1px solid var(--border);
  }
  .nb-solid .nb-link { color: var(--muted); }
  .nb-solid .nb-link:hover { color: var(--ink); }
  .nb-solid .nb-link-active { color: var(--ink) !important; }
  .nb-solid .nb-logo-text { color: var(--ink); }
  .nb-solid .nb-logo-mark { color: var(--gold); }
  .nb-solid .nb-ghost-btn { color: var(--muted); }
  .nb-solid .nb-ghost-btn:hover { color: var(--ink); }
  .nb-solid .nb-solid-btn {
    background: var(--ink);
    color: var(--white);
    border: 1px solid var(--ink);
  }
  .nb-solid .nb-solid-btn:hover {
    background: var(--gold);
    color: var(--ink);
    border-color: var(--gold);
  }
  .nb-solid .nb-burger span { background: var(--ink); }

  /* scrolled — dark glass */
  .nb-scrolled {
    background: rgba(14, 12, 10, 0.85);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.25);
  }
  .nb-scrolled .nb-link,
  .nb-scrolled .nb-ghost-btn {
    color: rgba(245,240,232,0.95);
  }
  .nb-scrolled .nb-logo-text {
    color: var(--gold-light);
  }
  .nb-scrolled .nb-solid-btn {
    background: var(--gold);
    color: var(--ink);
    border: none;
  }

  .nb-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    height: 64px;
  }

  /* LOGO */
  .nb-logo {
    display: flex; align-items: center; gap: 7px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .nb-logo-mark {
    font-size: 1rem;
    transition: color 0.3s;
  }
  .nb-logo-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: color 0.3s;
  }

  /* LINKS */
  .nb-links {
    display: flex; align-items: center; gap: 32px;
  }
  .nb-link {
    text-decoration: none;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0.04em;
    transition: color 0.2s;
    position: relative;
    padding-bottom: 2px;
  }
  .nb-link::after {
    content: '';
    position: absolute; bottom: -2px; left: 0;
    width: 0; height: 1px;
    background: var(--gold);
    transition: width 0.25s ease;
  }
  .nb-link:hover::after,
  .nb-link-active::after { width: 100%; }

  /* ACTIONS */
  .nb-actions { display: flex; align-items: center; gap: 10px; }
  .nb-ghost-btn {
    text-decoration: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 400;
    padding: 8px 16px;
    border-radius: 6px;
    border: none; background: none;
    cursor: pointer;
    transition: color 0.2s;
  }
  .nb-solid-btn {
    text-decoration: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    padding: 9px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.22s ease;
    letter-spacing: 0.02em;
    display: inline-block;
  }
  .nb-solid-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(201,168,76,0.25); }

  /* HAMBURGER */
  .nb-burger {
    display: none;
    flex-direction: column; justify-content: center; gap: 5px;
    width: 36px; height: 36px;
    background: none; border: none; cursor: pointer; padding: 4px;
  }
  .nb-burger span {
    display: block; height: 1.5px; border-radius: 2px;
    transition: all 0.3s ease;
  }
  .nb-burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .nb-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .nb-burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  /* MOBILE MENU */
  .nb-mobile-menu {
    display: none;
    flex-direction: column;
    background: var(--white);
    border-top: 1px solid var(--border);
    padding: 8px 0 20px;
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.35s ease;
  }
  .nb-mobile-menu.open { max-height: 400px; }
  .nb-mobile-link {
    display: block;
    padding: 13px 28px;
    font-size: 14px;
    color: var(--muted);
    text-decoration: none;
    background: none; border: none; text-align: left;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: color 0.2s, background 0.2s;
  }
  .nb-mobile-link:hover { color: var(--ink); background: var(--surface, #faf7f2); }
  .nb-mobile-logout { color: #b85c5c; }
  .nb-mobile-divider { height: 1px; background: var(--border); margin: 8px 28px; }
  .nb-mobile-cta {
    display: block;
    margin: 8px 28px 0;
    padding: 12px 20px;
    background: var(--ink); color: var(--white);
    text-decoration: none; text-align: center;
    border-radius: 7px; font-size: 13px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.2s;
  }
  .nb-mobile-cta:hover { background: var(--gold); color: var(--ink); }

  @media (max-width: 768px) {
    .nb-links { display: none; }
    .nb-actions { display: none; }
    .nb-burger { display: flex; }
    .nb-mobile-menu { display: flex; }
    .nb-inner { padding: 0 20px; }
  }
`;