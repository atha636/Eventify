import { useEffect, useState, useMemo } from "react";
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
  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("all");
  const [sort, setSort]           = useState("default");
  const [layout, setLayout]       = useState("grid"); // grid | list
  const [maxPrice, setMaxPrice]   = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    API.get("/vendors")
      .then((res) => setVendors(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...vendors];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.location?.toLowerCase().includes(q) ||
          v.serviceType?.toLowerCase().includes(q)
      );
    }

    // category
    if (category !== "all") {
      list = list.filter(
        (v) => v.serviceType?.toLowerCase() === category
      );
    }

    // max price
    if (maxPrice) {
      list = list.filter(
        (v) => (v.packages?.[0]?.price || 0) <= Number(maxPrice)
      );
    }

    // sort
    switch (sort) {
      case "price_asc":
        list.sort((a, b) => (a.packages?.[0]?.price || 0) - (b.packages?.[0]?.price || 0));
        break;
      case "price_desc":
        list.sort((a, b) => (b.packages?.[0]?.price || 0) - (a.packages?.[0]?.price || 0));
        break;
      case "rating":
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      default:
        break;
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

        {/* ── HERO ── */}
        <div className="vn-hero">
          <div className="vn-hero-orb vn-orb1" />
          <div className="vn-hero-orb vn-orb2" />
          <div className="vn-hero-inner">
            <p className="vn-eyebrow">✦ Discover & Book</p>
            <h1 className="vn-hero-title">All Vendors</h1>
            <p className="vn-hero-sub">
              {loading
                ? "Loading our curated vendor network…"
                : `${vendors.length} verified professionals across India`}
            </p>

            {/* SEARCH */}
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

        {/* ── CATEGORY PILLS ── */}
        <div className="vn-category-strip">
          <div className="vn-category-inner">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                className={`vn-cat-pill ${category === c.value ? "active" : ""}`}
                onClick={() => setCategory(c.value)}
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── TOOLBAR ── */}
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
              <button className="vn-clear-btn" onClick={clearAll}>
                ✕ Clear filters
              </button>
            )}
          </div>

          <div className="vn-toolbar-right">
            {/* PRICE FILTER */}
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

            {/* SORT */}
            <select
              className="vn-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* LAYOUT TOGGLE */}
            <div className="vn-layout-toggle">
              <button
                className={`vn-layout-btn ${layout === "grid" ? "active" : ""}`}
                onClick={() => setLayout("grid")}
                title="Grid view"
              >
                ⊞
              </button>
              <button
                className={`vn-layout-btn ${layout === "list" ? "active" : ""}`}
                onClick={() => setLayout("list")}
                title="List view"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
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
              <div className="vn-empty-icon">🔍</div>
              <h3>No vendors found</h3>
              <p>
                {search
                  ? `No results for "${search}". Try adjusting your search or filters.`
                  : "No vendors match the selected filters."}
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

              {/* LOAD MORE hint */}
              {filtered.length >= 12 && (
                <p className="vn-load-hint">✦ Showing {filtered.length} results</p>
              )}
            </>
          )}
        </div>

        {/* ── FOOTER CTA ── */}
        {!loading && vendors.length > 0 && (
          <div className="vn-footer-cta">
            <div className="vn-footer-orb" />
            <p className="vn-eyebrow" style={{ color: "var(--gold)" }}>✦ Are you a professional?</p>
            <h2 className="vn-footer-title">List your services on Eventique</h2>
            <p className="vn-footer-sub">Join 850+ vendors and connect with thousands of clients planning their perfect event.</p>
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
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --muted: #7a7265;
    --border: rgba(201,168,76,0.2);
    --surface: #faf7f2;
    --white: #ffffff;
  }

  .vn-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  /* ── HERO ── */
  .vn-hero {
    position: relative;
    background: var(--ink);
    overflow: hidden;
    padding: 72px 32px 56px;
    text-align: center;
  }
  .vn-hero-orb {
    position: absolute; border-radius: 50%;
    filter: blur(100px); opacity: 0.15; pointer-events: none;
  }
  .vn-orb1 { width: 500px; height: 500px; background: var(--gold); top: -150px; left: -80px; }
  .vn-orb2 { width: 350px; height: 350px; background: #7b5ea7;    bottom: -80px; right: -60px; }
  .vn-hero-inner { position: relative; z-index: 2; max-width: 620px; margin: 0 auto; animation: fadeUp 0.6s ease both; }
  .vn-eyebrow {
    font-size: 11px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 12px; display: block;
  }
  .vn-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.4rem, 5vw, 3.4rem);
    font-weight: 300; color: var(--white);
    margin-bottom: 12px; letter-spacing: -0.01em;
  }
  .vn-hero-sub { font-size: 14px; color: rgba(245,240,232,0.6); margin-bottom: 32px; }

  /* SEARCH */
  .vn-search-bar {
    display: flex; align-items: center; gap: 10px;
    background: var(--white);
    border-radius: 10px; padding: 6px 6px 6px 16px;
    max-width: 540px; margin: 0 auto;
    box-shadow: 0 8px 40px rgba(0,0,0,0.25);
  }
  .vn-search-icon { font-size: 18px; color: var(--muted); flex-shrink: 0; }
  .vn-search-input {
    flex: 1; border: none; outline: none; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink);
  }
  .vn-search-input::placeholder { color: #bbb4a8; }
  .vn-search-clear {
    background: none; border: none; cursor: pointer;
    font-size: 12px; color: var(--muted); padding: 0; flex-shrink: 0;
    transition: color 0.2s;
  }
  .vn-search-clear:hover { color: var(--ink); }

  /* ── CATEGORIES ── */
  .vn-category-strip {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 64px; z-index: 9;
  }
  .vn-category-inner {
    max-width: 1160px; margin: 0 auto;
    padding: 0 32px;
    display: flex; gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .vn-category-inner::-webkit-scrollbar { display: none; }
  .vn-cat-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 14px 18px;
    background: none; border: none;
    border-bottom: 2px solid transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: var(--muted);
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap; margin-bottom: -1px;
  }
  .vn-cat-pill:hover { color: var(--ink); }
  .vn-cat-pill.active {
    color: var(--ink); font-weight: 500;
    border-bottom-color: var(--gold);
  }

  /* ── TOOLBAR ── */
  .vn-toolbar {
    max-width: 1160px; margin: 0 auto;
    padding: 18px 32px;
    display: flex; justify-content: space-between;
    align-items: center; flex-wrap: wrap; gap: 12px;
  }
  .vn-toolbar-left { display: flex; align-items: center; gap: 12px; }
  .vn-result-text { font-size: 13px; color: var(--muted); }
  .vn-result-text strong { color: var(--ink); font-weight: 500; }
  .vn-result-text em { font-style: italic; color: var(--ink); }
  .vn-clear-btn {
    font-size: 12px; color: var(--muted);
    background: none; border: 1px solid var(--border);
    border-radius: 20px; padding: 4px 12px;
    cursor: pointer; transition: all 0.2s;
  }
  .vn-clear-btn:hover { border-color: var(--gold); color: var(--gold); }

  .vn-toolbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

  .vn-price-wrap {
    display: flex; align-items: center; gap: 8px;
    border: 1px solid var(--border); border-radius: 7px;
    padding: 8px 12px; background: var(--white);
    transition: border-color 0.2s;
  }
  .vn-price-wrap:focus-within { border-color: var(--gold); }
  .vn-price-label { font-size: 12px; color: var(--muted); white-space: nowrap; }
  .vn-price-input {
    border: none; outline: none; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink);
    width: 70px;
  }
  .vn-price-input::placeholder { color: #bbb4a8; }

  .vn-sort-select {
    border: 1px solid var(--border); border-radius: 7px;
    padding: 9px 12px; background: var(--white);
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink);
    outline: none; cursor: pointer; transition: border-color 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237a7265'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
  }
  .vn-sort-select:focus { border-color: var(--gold); }

  .vn-layout-toggle {
    display: flex; border: 1px solid var(--border); border-radius: 7px; overflow: hidden;
  }
  .vn-layout-btn {
    padding: 9px 13px; background: var(--white);
    border: none; cursor: pointer; font-size: 16px; color: var(--muted);
    transition: all 0.2s; line-height: 1;
  }
  .vn-layout-btn.active { background: var(--ink); color: var(--white); }
  .vn-layout-btn:hover:not(.active) { background: var(--surface); }

  /* ── CONTENT ── */
  .vn-content {
    max-width: 1160px; margin: 0 auto;
    padding: 0 32px 64px;
  }

  /* GRID */
  .vn-grid.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .vn-grid.list {
    display: flex; flex-direction: column; gap: 14px;
  }
  /* In list mode, make ServiceCard stretch */
  .vn-grid.list .vn-card-wrap > * {
    display: flex; flex-direction: row;
  }

  @media (max-width: 960px) { .vn-grid.grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 580px)  { .vn-grid.grid { grid-template-columns: 1fr; } }

  .vn-card-wrap { animation: fadeUp 0.45s ease both; }

  /* SKELETON */
  .vn-skeleton {
    height: 280px; border-radius: 12px;
    background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease infinite;
  }
  .vn-skeleton-list { height: 100px; }

  /* EMPTY */
  .vn-empty {
    text-align: center; padding: 80px 20px;
    animation: fadeUp 0.5s ease both;
  }
  .vn-empty-icon { font-size: 2.8rem; margin-bottom: 16px; }
  .vn-empty h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem; font-weight: 600;
    color: var(--ink); margin-bottom: 8px;
  }
  .vn-empty p { font-size: 13.5px; color: var(--muted); line-height: 1.6; margin-bottom: 24px; }
  .vn-empty-btn {
    padding: 11px 26px; background: var(--ink); color: var(--white);
    border: none; border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
  }
  .vn-empty-btn:hover { background: var(--gold); color: var(--ink); }

  .vn-load-hint {
    text-align: center; font-size: 12px;
    color: var(--muted); margin-top: 32px;
    letter-spacing: 0.1em;
  }

  /* ── FOOTER CTA ── */
  .vn-footer-cta {
    position: relative; overflow: hidden;
    text-align: center; padding: 80px 32px;
    background: var(--ink);
  }
  .vn-footer-orb {
    position: absolute; width: 500px; height: 500px;
    background: var(--gold); border-radius: 50%;
    filter: blur(120px); opacity: 0.08;
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    pointer-events: none;
  }
  .vn-footer-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    font-weight: 300; color: var(--cream);
    margin: 10px 0 12px;
    position: relative; z-index: 1;
  }
  .vn-footer-sub {
    font-size: 13.5px; color: var(--muted);
    margin-bottom: 28px; max-width: 480px;
    margin-left: auto; margin-right: auto;
    position: relative; z-index: 1;
  }
  .vn-footer-btn {
    display: inline-block; position: relative; z-index: 1;
    padding: 14px 32px; background: var(--gold); color: var(--ink);
    text-decoration: none; border-radius: 7px;
    font-size: 13px; font-weight: 500; letter-spacing: 0.03em;
    transition: all 0.25s;
  }
  .vn-footer-btn:hover {
    background: var(--cream);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(201,168,76,0.3);
  }

  @media (max-width: 640px) {
    .vn-hero { padding: 56px 20px 40px; }
    .vn-content, .vn-toolbar { padding-left: 20px; padding-right: 20px; }
    .vn-category-inner { padding: 0 20px; }
    .vn-toolbar-right { width: 100%; justify-content: flex-start; }
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