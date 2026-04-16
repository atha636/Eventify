import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import ServiceCard from "../components/ServiceCard";

const CATEGORY_META = {
  decor:       { emoji: "🎨", desc: "Transform any space into something magical and memorable.", color: "#c9a84c" },
  photography: { emoji: "📸", desc: "Capture every fleeting moment, preserved forever in stunning detail.", color: "#a07850" },
  catering:    { emoji: "🍽", desc: "Exquisite menus and culinary experiences crafted for your occasion.", color: "#6a8c5a" },
  music:       { emoji: "🎵", desc: "Set the perfect atmosphere with world-class performers and DJs.", color: "#7b5ea7" },
  florals:     { emoji: "💐", desc: "Breathtaking blooms that bring life and elegance to every detail.", color: "#b8637a" },
  venues:      { emoji: "🏛",  desc: "Iconic and intimate spaces that become the canvas for your story.", color: "#5a7a8c" },
};

const SORT_OPTIONS = [
  { label: "Recommended",      value: "default"    },
  { label: "Price: Low → High", value: "price_asc"  },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Top Rated",         value: "rating"     },
];

export default function Category() {
  const { type } = useParams();
  const navigate  = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort]       = useState("default");
  const [search, setSearch]   = useState("");

  const meta = CATEGORY_META[type?.toLowerCase()] || {
    emoji: "✦", desc: "Discover the best vendors for your event.", color: "#c9a84c",
  };

  // ── Fetch vendors — AbortController stops double-fetch in React StrictMode ──
  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setVendors([]);

    API.get(`/vendors/${type}`, { signal: controller.signal })
      .then((res) => setVendors(res.data))
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          setVendors([]);
        }
      })
      .finally(() => setLoading(false));

    // Cleanup: cancel request on unmount or type change
    return () => controller.abort();
  }, [type]); // ← only re-fetches when the category type changes

  const filtered = vendors
    .filter(
      (v) =>
        v.title?.toLowerCase().includes(search.toLowerCase()) ||
        v.location?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "price_asc")  return (a.packages?.[0]?.price || 0) - (b.packages?.[0]?.price || 0);
      if (sort === "price_desc") return (b.packages?.[0]?.price || 0) - (a.packages?.[0]?.price || 0);
      if (sort === "rating")     return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  return (
    <>
      <style>{styles}</style>
      <div className="ct-root">
        <Navbar />

        <div className="ct-hero" style={{ "--accent": meta.color }}>
          <div className="ct-hero-orb ct-orb1" />
          <div className="ct-hero-orb ct-orb2" />

          <div className="ct-hero-inner">
            <button className="ct-back" onClick={() => navigate(-1)}>← Back</button>
            <div className="ct-hero-emoji">{meta.emoji}</div>
            <h1 className="ct-hero-title">
              {type?.charAt(0).toUpperCase() + type?.slice(1)} Services
            </h1>
            <p className="ct-hero-desc">{meta.desc}</p>
            <div className="ct-hero-badge">
              {loading ? "Loading…" : `${vendors.length} verified vendors`}
            </div>
          </div>
        </div>

        <div className="ct-toolbar">
          <div className="ct-search-wrap">
            <span className="ct-search-icon">⌕</span>
            <input
              className="ct-search"
              placeholder="Search by name or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="ct-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          <div className="ct-sort-wrap">
            <span className="ct-sort-label">Sort by</span>
            <div className="ct-sort-pills">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className={`ct-sort-pill ${sort === o.value ? "active" : ""}`}
                  onClick={() => setSort(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ct-body">
          {loading ? (
            <div className="ct-loading">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="ct-skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="ct-result-count">
                Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? "vendor" : "vendors"}
                {search && <> for "<em>{search}</em>"</>}
              </p>
              <div className="ct-grid">
                {filtered.map((v, i) => (
                  <div
                    key={v._id}
                    className="ct-card-wrapper"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <ServiceCard vendor={v} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="ct-empty">
              <div className="ct-empty-icon">⌛</div>
              <h3>Coming Soon…</h3>
              <p>
                {search
                  ? `No results for "${search}". Try a different search.`
                  : `${type} vendors will be available very soon. Check back soon!`}
              </p>
              {search && (
                <button className="ct-empty-btn" onClick={() => setSearch("")}>
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c;
    --gold-light: #e8d5a3; --muted: #7a7265;
    --border: rgba(201,168,76,0.2); --surface: #faf7f2; --white: #ffffff;
  }

  .ct-root { font-family:'DM Sans',sans-serif; background:var(--cream); color:var(--ink); min-height:100vh; }

  .ct-hero { position:relative; background:var(--ink); overflow:hidden; padding:64px 32px 56px; text-align:center; }
  .ct-hero-orb { position:absolute; border-radius:50%; filter:blur(90px); pointer-events:none; }
  .ct-orb1 { width:420px; height:420px; background:var(--accent,var(--gold)); opacity:0.15; top:-100px; left:-60px; }
  .ct-orb2 { width:320px; height:320px; background:var(--accent,var(--gold)); opacity:0.08; bottom:-80px; right:-40px; }

  .ct-hero-inner { position:relative; z-index:2; max-width:640px; margin:0 auto; animation:fadeUp 0.6s ease both; }

  .ct-back { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); color:var(--gold-light); font-family:'DM Sans',sans-serif; font-size:12px; letter-spacing:0.08em; padding:6px 14px; border-radius:20px; cursor:pointer; margin-bottom:28px; transition:all 0.2s; }
  .ct-back:hover { background:rgba(201,168,76,0.12); border-color:var(--gold); color:var(--gold); }

  .ct-hero-emoji { font-size:3.2rem; margin-bottom:16px; display:block; filter:drop-shadow(0 4px 20px rgba(201,168,76,0.3)); }
  .ct-hero-title { font-family:'Cormorant Garamond',serif; font-size:clamp(2.2rem,5vw,3.2rem); font-weight:300; color:var(--white); margin-bottom:14px; letter-spacing:-0.01em; }
  .ct-hero-desc { font-size:14px; color:rgba(245,240,232,0.6); line-height:1.7; margin-bottom:24px; }
  .ct-hero-badge { display:inline-block; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:var(--gold); border:1px solid rgba(201,168,76,0.3); padding:5px 16px; border-radius:20px; background:rgba(201,168,76,0.08); }

  .ct-toolbar { background:var(--white); border-bottom:1px solid var(--border); padding:16px 32px; display:flex; align-items:center; gap:20px; flex-wrap:wrap; position:sticky; top:0; z-index:10; box-shadow:0 2px 16px rgba(14,12,10,0.05); }

  .ct-search-wrap { display:flex; align-items:center; gap:10px; border:1px solid var(--border); border-radius:7px; padding:9px 14px; background:var(--surface); flex:1; min-width:200px; max-width:320px; transition:border-color 0.2s,box-shadow 0.2s; }
  .ct-search-wrap:focus-within { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }
  .ct-search-icon { font-size:16px; color:var(--muted); flex-shrink:0; }
  .ct-search { border:none; background:transparent; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; color:var(--ink); width:100%; }
  .ct-search::placeholder { color:#bbb4a8; }
  .ct-search-clear { background:none; border:none; cursor:pointer; font-size:12px; color:var(--muted); flex-shrink:0; padding:0; transition:color 0.2s; }
  .ct-search-clear:hover { color:var(--ink); }

  .ct-sort-wrap { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .ct-sort-label { font-size:11px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); white-space:nowrap; }
  .ct-sort-pills { display:flex; gap:6px; flex-wrap:wrap; }
  .ct-sort-pill { font-family:'DM Sans',sans-serif; font-size:12px; color:var(--muted); border:1px solid var(--border); border-radius:20px; padding:5px 13px; background:transparent; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .ct-sort-pill:hover { border-color:var(--gold); color:var(--gold); }
  .ct-sort-pill.active { background:var(--ink); color:var(--white); border-color:var(--ink); }

  .ct-body { max-width:1140px; margin:0 auto; padding:40px 32px 80px; }

  .ct-result-count { font-size:13px; color:var(--muted); margin-bottom:24px; }
  .ct-result-count strong { color:var(--ink); font-weight:500; }
  .ct-result-count em { font-style:italic; color:var(--ink); }

  .ct-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  @media(max-width:960px){ .ct-grid { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:580px){ .ct-grid { grid-template-columns:1fr; } }

  .ct-card-wrapper { animation:fadeUp 0.5s ease both; }

  .ct-loading { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  @media(max-width:960px){ .ct-loading { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:580px){ .ct-loading { grid-template-columns:1fr; } }

  .ct-skeleton { height:280px; border-radius:12px; background:linear-gradient(90deg,#ede8e0 25%,#e5dfd4 50%,#ede8e0 75%); background-size:200% 100%; animation:shimmer 1.4s ease infinite; }

  .ct-empty { text-align:center; padding:80px 20px; grid-column:1/-1; }
  .ct-empty-icon { font-size:3rem; margin-bottom:20px; }
  .ct-empty h3 { font-family:'Cormorant Garamond',serif; font-size:1.6rem; font-weight:600; color:var(--ink); margin-bottom:10px; }
  .ct-empty p { font-size:14px; color:var(--muted); line-height:1.6; margin-bottom:24px; }
  .ct-empty-btn { padding:11px 26px; background:var(--ink); color:var(--white); border:none; border-radius:7px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:all 0.2s; }
  .ct-empty-btn:hover { background:var(--gold); color:var(--ink); }

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;