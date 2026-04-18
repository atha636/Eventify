import { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import ServiceCard from "../components/ServiceCard";

const CATEGORIES = [
  { value: "all",         label: "All",         emoji: "✦" },
  { value: "decor",       label: "Decor",       emoji: "🎨" },
  { value: "photography", label: "Photography", emoji: "📸" },
  { value: "catering",    label: "Catering",    emoji: "🍽" },
  { value: "music",       label: "Music & DJ",  emoji: "🎵" },
  { value: "florals",     label: "Florals",     emoji: "💐" },
  { value: "venues",      label: "Venues",      emoji: "🏛" },
];

const SORT_OPTIONS = [
  { value: "default",    label: "Recommended"       },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating",     label: "Top Rated"         },
  { value: "newest",     label: "Newest First"      },
];

export default function Vendors() {
  const location = useLocation();
  const navigate = useNavigate();

  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort]         = useState("default");
  const [layout, setLayout]     = useState("grid");
  const [maxPrice, setMaxPrice] = useState("");

  // ── Guard flag: true when WE pushed the URL, so we don't re-read it ──
  const isNavigatingRef = useRef(false);

  // ── 1. Read URL params on mount and when URL changes externally ────
  useEffect(() => {
    // Skip if this URL change was caused by our own navigate() below
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const params = new URLSearchParams(location.search);
    const q         = params.get("q")    || "";
    const cat       = params.get("cat")  || "all";
    const max       = params.get("max")  || "";
    const sortParam = params.get("sort") || "default";

    setSearch(q);
    setMaxPrice(max);
    setSort(sortParam);
    setCategory(CATEGORIES.some((c) => c.value === cat) ? cat : "all");
  }, [location.search]);

  // ── 2. Fetch vendors ONCE on mount ────────────────────────────────
  useEffect(() => {
    API.get("/vendors")
      .then((res) => setVendors(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []); // ← empty array: runs once only

  // ── 3. Sync filters → URL (without triggering effect #1 again) ───
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim())      params.set("q",    search);
    if (category !== "all") params.set("cat",  category);
    if (maxPrice)           params.set("max",  maxPrice);
    if (sort !== "default") params.set("sort", sort);

    const newSearch = params.toString();
    const current   = location.search.replace(/^\?/, "");

    // Only navigate if the URL actually changed
    if (newSearch !== current) {
      isNavigatingRef.current = true; // tell effect #1 to skip next trigger
      navigate(`/vendors${newSearch ? `?${newSearch}` : ""}`, { replace: true });
    }
  }, [search, category, maxPrice, sort]); // ← NO location/navigate in deps

  // ── Client-side filter + sort ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...vendors];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.location?.toLowerCase().includes(q) ||
          v.serviceType?.toLowerCase().includes(q)
      );
    }
    if (category !== "all") {
      list = list.filter((v) => v.serviceType?.toLowerCase() === category);
    }
    if (maxPrice) {
      list = list.filter((v) => (v.packages?.[0]?.price || 0) <= Number(maxPrice));
    }

    switch (sort) {
      case "price_asc":  list.sort((a, b) => (a.packages?.[0]?.price || 0) - (b.packages?.[0]?.price || 0)); break;
      case "price_desc": list.sort((a, b) => (b.packages?.[0]?.price || 0) - (a.packages?.[0]?.price || 0)); break;
      case "rating":     list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "newest":     list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
      default: break;
    }
    return list;
  }, [vendors, search, category, sort, maxPrice]);

  const hasActiveFilters = category !== "all" || maxPrice || search;
  const clearAll = () => {
    setSearch("");
    setCategory("all");
    setSort("default");
    setMaxPrice("");
  };

  return (
    <>
      <style>{styles}</style>
      <div className="vn-root">
        <Navbar />

        <div className="vn-hero">
          <div className="vn-hero-orb vn-orb1" />
          <div className="vn-hero-orb vn-orb2" />
          <div className="vn-hero-inner">
            <span className="vn-eyebrow">✦ Discover & Book</span>
            <h1 className="vn-hero-title">All Vendors</h1>
            <p className="vn-hero-sub">
              {loading
                ? "Loading our curated vendor network…"
                : `${vendors.length} verified professionals across India`}
            </p>
            <div className="vn-search-bar">
              <span className="vn-search-icon">⌕</span>
              <input
                className="vn-search-input"
                placeholder="Search by name, service, or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="vn-search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
          </div>
        </div>

        <div className="vn-category-strip">
          <div className="vn-category-inner">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                className={`vn-cat-pill ${category === c.value ? "active" : ""}`}
                onClick={() => {
                  setCategory(c.value);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <span className="vn-cat-emoji">{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="vn-toolbar">
          <div className="vn-toolbar-left">
            <span className="vn-result-text">
              {loading ? "Loading…" : (
                <>
                  <strong>{filtered.length}</strong> vendor{filtered.length !== 1 ? "s" : ""}
                  {search && <> for "<em>{search}</em>"</>}
                </>
              )}
            </span>
            {hasActiveFilters && (
              <button className="vn-clear-btn" onClick={clearAll}>✕ Clear</button>
            )}
          </div>
          <div className="vn-toolbar-right">
            <div className="vn-price-wrap">
              <span className="vn-price-label">Max ₹</span>
              <input
                type="number"
                className="vn-price-input"
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <select
              className="vn-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="vn-layout-toggle">
              <button
                className={`vn-layout-btn ${layout === "grid" ? "active" : ""}`}
                onClick={() => setLayout("grid")}
                title="Grid view"
              >⊞</button>
              <button
                className={`vn-layout-btn ${layout === "list" ? "active" : ""}`}
                onClick={() => setLayout("list")}
                title="List view"
              >☰</button>
            </div>
          </div>
        </div>

        <div className="vn-content">
          {loading ? (
            <div className={`vn-grid ${layout}`}>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`vn-skeleton ${layout === "list" ? "vn-skeleton-list" : ""}`}
                  style={{ animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="vn-empty">
              <div className="vn-empty-icon">✦</div>
              <h3>coming soon...</h3>
              <p>
                {search
                  ? `No results for "${search}". Try adjusting your search or filters.`
                  : "Vendors coming soon to match the selected filters."}
              </p>
              <button className="vn-empty-btn" onClick={clearAll}>Clear all filters</button>
            </div>
          ) : (
            <>
              <div className={`vn-grid ${layout}`}>
                {filtered.map((v, i) => (
                  <div
                    key={v._id}
                    className="vn-card-wrap"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <ServiceCard vendor={v} />
                  </div>
                ))}
              </div>
              {filtered.length >= 12 && (
                <p className="vn-load-hint">✦ Showing all {filtered.length} results</p>
              )}
            </>
          )}
        </div>

        {!loading && vendors.length > 0 && (
          <div className="vn-footer-cta">
            <div className="vn-footer-orb" />
            <span className="vn-eyebrow" style={{ color: "var(--gold)" }}>✦ Are you a professional?</span>
            <h2 className="vn-footer-title">List your services on Evencers</h2>
            <p className="vn-footer-sub">
              Join 850+ vendors and connect with thousands of clients planning their perfect event.
            </p>
            <a href="/register" className="vn-footer-btn">Become a Vendor →</a>
          </div>
        )}
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --gold-glow: rgba(201,168,76,0.14); --muted: #7a7265; --border: rgba(201,168,76,0.18);
    --surface: #faf7f2; --white: #ffffff;
  }
  .vn-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }
  .vn-hero { position: relative; background: var(--ink); overflow: hidden; padding: 100px 32px 60px; text-align: center; }
  .vn-hero-orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.13; pointer-events: none; }
  .vn-orb1 { width: 480px; height: 480px; background: var(--gold); top: -160px; left: -60px; }
  .vn-orb2 { width: 320px; height: 320px; background: #7b5ea7; bottom: -100px; right: -40px; }
  .vn-hero-inner { position: relative; z-index: 2; max-width: 600px; margin: 0 auto; animation: fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both; }
  .vn-eyebrow { display: block; font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; font-weight: 400; }
  .vn-hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.6rem, 5.5vw, 3.6rem); font-weight: 300; color: var(--white); margin-bottom: 12px; letter-spacing: 0.02em; line-height: 1.1; }
  .vn-hero-sub { font-size: 13.5px; color: rgba(245,240,232,0.52); margin-bottom: 36px; font-weight: 300; }
  .vn-search-bar { display: flex; align-items: center; gap: 10px; background: var(--white); border-radius: 10px; padding: 7px 8px 7px 16px; max-width: 520px; margin: 0 auto; box-shadow: 0 12px 48px rgba(0,0,0,0.28), 0 0 0 1px rgba(201,168,76,0.1); transition: box-shadow 0.25s; }
  .vn-search-bar:focus-within { box-shadow: 0 12px 48px rgba(0,0,0,0.3), 0 0 0 2px var(--gold); }
  .vn-search-icon { font-size: 19px; color: var(--muted); flex-shrink: 0; line-height: 1; }
  .vn-search-input { flex: 1; border: none; outline: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--ink); padding: 4px 0; }
  .vn-search-input::placeholder { color: #bbb4a8; }
  .vn-search-clear { background: none; border: none; cursor: pointer; font-size: 11px; color: var(--muted); width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s, color 0.2s; }
  .vn-search-clear:hover { background: var(--cream); color: var(--ink); }
  .vn-category-strip { background: var(--white); border-bottom: 1px solid var(--border); position: sticky; top: 66px; z-index: 9; }
  .vn-category-inner { max-width: 1160px; margin: 0 auto; padding: 0 32px; display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; }
  .vn-category-inner::-webkit-scrollbar { display: none; }
  .vn-cat-pill { display: flex; align-items: center; gap: 7px; padding: 15px 16px; background: none; border: none; border-bottom: 2px solid transparent; font-family: 'DM Sans', sans-serif; font-size: 12.5px; letter-spacing: 0.03em; color: var(--muted); cursor: pointer; transition: color 0.2s, border-color 0.2s; white-space: nowrap; margin-bottom: -1px; flex-shrink: 0; }
  .vn-cat-emoji { font-size: 14px; line-height: 1; }
  .vn-cat-pill:hover { color: var(--ink); }
  .vn-cat-pill.active { color: var(--ink); font-weight: 500; border-bottom-color: var(--gold); }
  .vn-toolbar { max-width: 1160px; margin: 0 auto; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid var(--border); }
  .vn-toolbar-left { display: flex; align-items: center; gap: 10px; }
  .vn-result-text { font-size: 13px; color: var(--muted); }
  .vn-result-text strong { color: var(--ink); font-weight: 500; }
  .vn-result-text em { font-style: italic; color: var(--ink); }
  .vn-clear-btn { font-size: 11.5px; color: var(--muted); background: none; border: 1px solid var(--border); border-radius: 20px; padding: 4px 11px; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
  .vn-clear-btn:hover { border-color: var(--gold); color: var(--gold); }
  .vn-toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .vn-price-wrap { display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 7px; padding: 7px 12px; background: var(--white); transition: border-color 0.2s; }
  .vn-price-wrap:focus-within { border-color: var(--gold); }
  .vn-price-label { font-size: 12px; color: var(--muted); white-space: nowrap; }
  .vn-price-input { border: none; outline: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); width: 66px; }
  .vn-price-input::placeholder { color: #bbb4a8; }
  .vn-price-input::-webkit-outer-spin-button, .vn-price-input::-webkit-inner-spin-button { -webkit-appearance: none; }
  .vn-price-input[type=number] { -moz-appearance: textfield; }
  .vn-sort-select { border: 1px solid var(--border); border-radius: 7px; padding: 8px 30px 8px 12px; background: var(--white); font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); outline: none; cursor: pointer; transition: border-color 0.2s; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M4.5 5L0 0h9z' fill='%237a7265'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 11px center; }
  .vn-sort-select:focus { border-color: var(--gold); }
  .vn-layout-toggle { display: flex; border: 1px solid var(--border); border-radius: 7px; overflow: hidden; }
  .vn-layout-btn { padding: 8px 12px; background: var(--white); border: none; cursor: pointer; font-size: 15px; color: var(--muted); transition: background 0.2s, color 0.2s; line-height: 1; }
  .vn-layout-btn + .vn-layout-btn { border-left: 1px solid var(--border); }
  .vn-layout-btn.active { background: var(--ink); color: var(--white); }
  .vn-layout-btn:hover:not(.active) { background: var(--surface); color: var(--ink); }
  .vn-content { max-width: 1160px; margin: 0 auto; padding: 28px 32px 72px; }
  .vn-grid.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .vn-grid.list { display: flex; flex-direction: column; gap: 12px; }
  .vn-card-wrap { animation: fadeUp 0.42s cubic-bezier(0.4,0,0.2,1) both; }
  .vn-skeleton { height: 272px; border-radius: 12px; background: linear-gradient(90deg, #ede8e0 25%, #e4ddd3 50%, #ede8e0 75%); background-size: 200% 100%; animation: shimmer 1.5s ease infinite; }
  .vn-skeleton-list { height: 96px; }
  .vn-empty { text-align: center; padding: 88px 20px; animation: fadeUp 0.45s ease both; }
  .vn-empty-icon { font-size: 2rem; margin-bottom: 20px; color: var(--gold); display: block; animation: spin 8s linear infinite; }
  .vn-empty h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.7rem; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
  .vn-empty p { font-size: 13.5px; color: var(--muted); line-height: 1.65; margin-bottom: 24px; max-width: 380px; margin-left: auto; margin-right: auto; }
  .vn-empty-btn { padding: 11px 26px; background: var(--ink); color: var(--white); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.22s, color 0.22s, transform 0.18s; }
  .vn-empty-btn:hover { background: var(--gold); color: var(--ink); transform: translateY(-1px); }
  .vn-load-hint { text-align: center; font-size: 11.5px; color: var(--muted); margin-top: 36px; letter-spacing: 0.12em; text-transform: uppercase; }
  .vn-footer-cta { position: relative; overflow: hidden; text-align: center; padding: 88px 32px; background: var(--ink); }
  .vn-footer-orb { position: absolute; width: 560px; height: 560px; background: var(--gold); border-radius: 50%; filter: blur(130px); opacity: 0.07; top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
  .vn-footer-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.9rem, 3.5vw, 2.7rem); font-weight: 300; color: var(--cream); margin: 12px 0 14px; position: relative; z-index: 1; letter-spacing: 0.01em; }
  .vn-footer-sub { font-size: 13.5px; color: rgba(122,114,101,0.9); margin-bottom: 30px; max-width: 460px; margin-left: auto; margin-right: auto; position: relative; z-index: 1; line-height: 1.65; }
  .vn-footer-btn { display: inline-block; position: relative; z-index: 1; padding: 13px 32px; background: var(--gold); color: var(--ink); text-decoration: none; border-radius: 7px; font-size: 13px; font-weight: 500; letter-spacing: 0.04em; transition: background 0.22s, transform 0.18s, box-shadow 0.22s; }
  .vn-footer-btn:hover { background: var(--gold-light); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(201,168,76,0.28); }
  @media (max-width: 960px) { .vn-grid.grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) {
    .vn-hero { padding: 88px 20px 44px; }
    .vn-category-inner { padding: 0 16px; }
    .vn-toolbar { padding: 12px 16px; }
    .vn-content { padding: 20px 16px 56px; }
    .vn-grid.grid { grid-template-columns: 1fr; gap: 14px; }
    .vn-toolbar-right { width: 100%; }
    .vn-footer-cta { padding: 64px 20px; }
    .vn-layout-toggle { display: none; }
  }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;