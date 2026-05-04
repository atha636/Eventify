import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import ServiceCard from "../components/ServiceCard";
import Logo from "../components/Logo";

const CATEGORY_META = {
  decor:       { emoji: "🎨", desc: "Transform any space into something magical and memorable.", color: "#c9a84c" },
  photography: { emoji: "📸", desc: "Capture every fleeting moment, preserved forever in stunning detail.", color: "#a07850" },
  catering:    { emoji: "🍽", desc: "Exquisite menus and culinary experiences crafted for your occasion.", color: "#6a8c5a" },
  music:       { emoji: "🎵", desc: "Set the perfect atmosphere with world-class performers and DJs.", color: "#7b5ea7" },
  florals:     { emoji: "💐", desc: "Breathtaking blooms that bring life and elegance to every detail.", color: "#b8637a" },
  venues:      { emoji: "🏛",  desc: "Iconic and intimate spaces that become the canvas for your story.", color: "#5a7a8c" },
};

const SORT_OPTIONS = [
  { label: "Recommended",       value: "default"    },
  { label: "Price: Low → High", value: "price_asc"  },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Top Rated",         value: "rating"     },
];

const PRICE_RANGES = [
  { label: "Any",       value: "any",     min: 0,      max: Infinity },
  { label: "₹0–5K",    value: "0-5k",    min: 0,      max: 5000     },
  { label: "₹5K–20K",  value: "5k-20k",  min: 5000,   max: 20000    },
  { label: "₹20K–50K", value: "20k-50k", min: 20000,  max: 50000    },
  { label: "₹50K–1L",  value: "50k-1l",  min: 50000,  max: 100000   },
  { label: "₹1L+",     value: "1l+",     min: 100000, max: Infinity  },
];

const INDIAN_CITIES = [
  "Agra","Ahmedabad","Ajmer","Aligarh","Allahabad","Amravati","Amritsar",
  "Asansol","Aurangabad","Bareilly","Belgaum","Bengaluru","Bhilai","Bhiwandi",
  "Bhopal","Bhubaneswar","Bikaner","Bombay","Chandigarh","Chennai","Coimbatore",
  "Cuttack","Dehradun","Delhi","Dhanbad","Durgapur","Erode","Faridabad",
  "Firozabad","Gaya","Ghaziabad","Gorakhpur","Gulbarga","Guntur","Guwahati",
  "Gwalior","Howrah","Hubli-Dharwad","Hyderabad","Indore","Jabalpur","Jaipur",
  "Jalandhar","Jalgaon","Jamnagar","Jammu","Jamshedpur","Jhansi","Jodhpur",
  "Kalyan-Dombivali","Kanpur","Kochi","Kolhapur","Kolkata","Kota","Lucknow",
  "Ludhiana","Madurai","Maheshtala","Malegaon","Mangalore","Meerut","Moradabad",
  "Mumbai","Mysore","Nagpur","Nanded","Nashik","Navi Mumbai","Noida","Patna",
  "Pimpri-Chinchwad","Pondicherry","Pune","Raipur","Rajkot","Ranchi","Salem",
  "Saharanpur","Sangli-Miraj","Shimla","Siliguri","Solapur","Srinagar","Surat",
  "Thane","Tiruchirappalli","Tirunelveli","Udaipur","Ujjain","Ulhasnagar",
  "Vadodara","Varanasi","Vasai-Virar","Vijayawada","Visakhapatnam","Warangal",
].sort();

// ── City Selector Modal (redesigned, fully responsive) ─────────
function CityModal({ onSelect, onBrowseAll }) {
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 40);
    const t2 = setTimeout(() => inputRef.current?.focus(), 220);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, []);

  const filtered = useMemo(() =>
    INDIAN_CITIES.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <div
      className={`ecm-backdrop ${visible ? "ecm-visible" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Select your city"
    >
      <div className="ecm-blob ecm-blob1" aria-hidden="true" />
      <div className="ecm-blob ecm-blob2" aria-hidden="true" />

      <div className="ecm-card">
        {/* Fixed top */}
        <div className="ecm-top">
          <div className="ecm-logo-row"><Logo /></div>
          <p className="ecm-eyebrow">
            <span className="ecm-dot" />SELECT YOUR CITY<span className="ecm-dot" />
          </p>
          <h2 className="ecm-heading">
            Where are you <em>planning your event?</em>
          </h2>
          <p className="ecm-subtext">
            We'll show vendors near you. You can change your city anytime.
          </p>

          <button className="ecm-browse-btn" onClick={onBrowseAll} aria-label="Browse vendors across all cities">
            <span className="ecm-browse-icon" aria-hidden="true">🌏</span>
            <span className="ecm-browse-text">Browse All Cities</span>
            <span className="ecm-browse-arrow" aria-hidden="true">→</span>
          </button>

          <div className="ecm-divider">
            <span className="ecm-divider-line" aria-hidden="true" />
            <span className="ecm-divider-label">or choose a specific city</span>
            <span className="ecm-divider-line" aria-hidden="true" />
          </div>

          <div className="ecm-search-box">
            <span className="ecm-search-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              ref={inputRef}
              className="ecm-search-input"
              type="text"
              placeholder="Search your city…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
              aria-label="Search city"
            />
            {search && (
              <button className="ecm-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable city list */}
        <div className="ecm-city-scroll" role="listbox" aria-label="City list">
          {filtered.length === 0 ? (
            <div className="ecm-empty" role="status">
              <span className="ecm-empty-icon" aria-hidden="true">🏙️</span>
              <p>No city found for <strong>"{search}"</strong></p>
              <span className="ecm-empty-hint">Try a different spelling</span>
            </div>
          ) : (
            <div className="ecm-city-grid">
              {filtered.map(city => (
                <button
                  key={city}
                  className="ecm-city-btn"
                  role="option"
                  onClick={() => onSelect(city)}
                  aria-label={`Select ${city}`}
                >
                  <span className="ecm-city-pin" aria-hidden="true">◉</span>
                  <span className="ecm-city-name">{city}</span>
                  <span className="ecm-city-arrow" aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ecm-footer" role="note">
          <span className="ecm-footer-dot" aria-hidden="true" />
          Currently serving Delhi, Chandigarh & Bombay · More cities launching Q3 2026
        </div>
      </div>
    </div>
  );
}

// ── City Bar ───────────────────────────────────────────────────────
function CityBar({ city, browseAll, onChangeCity, onBrowseAll }) {
  return (
    <div className="ct-citybar" role="status" aria-live="polite">
      <span className="ct-citybar-icon" aria-hidden="true">📍</span>
      {browseAll ? (
        <span>Showing vendors in <strong>All Cities</strong></span>
      ) : (
        <span>Showing vendors in <strong>{city}</strong></span>
      )}
      <div className="ct-citybar-actions">
        {!browseAll && (
          <button className="ct-citybar-all" onClick={onBrowseAll} aria-label="Show all cities">All Cities</button>
        )}
        <button className="ct-citybar-change" onClick={onChangeCity} aria-label="Change city">
          {browseAll ? "Choose City" : "Change City"}
        </button>
      </div>
    </div>
  );
}

export default function Category() {
  const { type }  = useParams();
  const navigate  = useNavigate();

  const [vendors,    setVendors]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [sort,       setSort]       = useState("default");
  const [search,     setSearch]     = useState("");
  const [priceRange, setPriceRange] = useState("any");

  const [selectedCity,  setSelectedCity]  = useState(() => {
    try { return localStorage.getItem("evencers_city") || ""; } catch { return ""; }
  });
  const [showCityModal, setShowCityModal] = useState(() => {
    try { return !localStorage.getItem("evencers_city"); } catch { return true; }
  });
  const [browseAll, setBrowseAll] = useState(() => {
    try { return localStorage.getItem("evencers_browse_all") === "true"; } catch { return false; }
  });

  const meta = CATEGORY_META[type?.toLowerCase()] || {
    emoji: "✦", desc: "Discover the best vendors for your event.", color: "#c9a84c",
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setVendors([]);
    API.get(`/vendors/${type}`, { signal: controller.signal })
      .then((res) => setVendors(res.data))
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") setVendors([]);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [type]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setBrowseAll(false);
    try {
      localStorage.setItem("evencers_city", city);
      localStorage.setItem("evencers_browse_all", "false");
    } catch {}
    setShowCityModal(false);
  };

  const handleBrowseAll = () => {
    setBrowseAll(true);
    setShowCityModal(false);
    try { localStorage.setItem("evencers_browse_all", "true"); } catch {}
  };

  const filtered = useMemo(() =>
    vendors
      .filter(v => {
        if (selectedCity && !browseAll) {
          if (!v.location?.toLowerCase().includes(selectedCity.toLowerCase())) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          if (!v.title?.toLowerCase().includes(q) && !v.location?.toLowerCase().includes(q)) return false;
        }
        if (priceRange !== "any") {
          const band = PRICE_RANGES.find(r => r.value === priceRange);
          if (band) {
            const p = v.packages?.[0]?.price || 0;
            if (p < band.min || (band.max !== Infinity && p >= band.max)) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "price_asc")  return (a.packages?.[0]?.price || 0) - (b.packages?.[0]?.price || 0);
        if (sort === "price_desc") return (b.packages?.[0]?.price || 0) - (a.packages?.[0]?.price || 0);
        if (sort === "rating")     return (b.rating || 0) - (a.rating || 0);
        return 0;
      }),
    [vendors, selectedCity, browseAll, search, priceRange, sort]
  );

  const hasFilters = search || priceRange !== "any";

  return (
    <>
      <style>{styles}</style>

      {showCityModal && <CityModal onSelect={handleCitySelect} onBrowseAll={handleBrowseAll} />}

      <div className="ct-root">
        <Navbar />

        {/* Hero */}
        <div className="ct-hero" style={{ "--accent": meta.color }}>
          <div className="ct-hero-orb ct-orb1" aria-hidden="true" />
          <div className="ct-hero-orb ct-orb2" aria-hidden="true" />
          <div className="ct-hero-inner">
            <button className="ct-back" onClick={() => navigate(-1)}>← Back</button>
            <div className="ct-hero-emoji" aria-hidden="true">{meta.emoji}</div>
            <h1 className="ct-hero-title">
              {type?.charAt(0).toUpperCase() + type?.slice(1)} Services
            </h1>
            <p className="ct-hero-desc">{meta.desc}</p>
            <div className="ct-hero-badge">
              {loading ? "Loading…" : `${vendors.length} verified vendor${vendors.length !== 1 ? "s" : ""}`}
            </div>
          </div>
        </div>

        {/* City Bar */}
        {(selectedCity || browseAll) && !showCityModal && (
          <CityBar
            city={selectedCity}
            browseAll={browseAll}
            onChangeCity={() => setShowCityModal(true)}
            onBrowseAll={handleBrowseAll}
          />
        )}

        {/* Toolbar */}
        <div className="ct-toolbar">
          <div className="ct-search-wrap">
            <span className="ct-search-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              className="ct-search"
              placeholder="Search by name or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search vendors"
            />
            {search && (
              <button className="ct-search-clear" onClick={() => setSearch("")} aria-label="Clear search">✕</button>
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
                  aria-pressed={sort === o.value}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Filter Bar */}
        <div className="ct-budget-bar" role="group" aria-label="Filter by budget">
          <span className="ct-budget-label">Budget:</span>
          <div className="ct-budget-pills">
            {PRICE_RANGES.map((r) => (
              <button
                key={r.value}
                className={`ct-budget-pill ${priceRange === r.value ? "active" : ""}`}
                onClick={() => setPriceRange(r.value)}
                aria-pressed={priceRange === r.value}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="ct-body">
          {loading ? (
            <div className="ct-loading" aria-label="Loading vendors" aria-busy="true">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="ct-skeleton" style={{ animationDelay: `${i * 0.08}s` }} aria-hidden="true" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="ct-result-count" aria-live="polite">
                Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? "vendor" : "vendors"}
                {browseAll ? <> across <em>all cities</em></> : selectedCity ? <> in <em>{selectedCity}</em></> : null}
                {search && <> for "<em>{search}</em>"</>}
              </p>
              <div className="ct-grid" role="list">
                {filtered.map((v, i) => (
                  <div key={v._id} className="ct-card-wrapper" style={{ animationDelay: `${i * 0.06}s` }} role="listitem">
                    <ServiceCard vendor={v} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="ct-empty" role="status">
              <div className="ct-empty-icon" aria-hidden="true">⌛</div>
              <h3>
                {selectedCity && !browseAll && !hasFilters
                  ? `No vendors in ${selectedCity} yet`
                  : "No results found"}
              </h3>
              <p>
                {hasFilters
                  ? "Try adjusting your filters or search term."
                  : selectedCity && !browseAll
                    ? `${type} vendors in ${selectedCity} will be available very soon!`
                    : `${type} vendors will be available soon. Check back!`}
              </p>
              <div className="ct-empty-btns">
                {hasFilters && (
                  <button className="ct-empty-btn" onClick={() => { setSearch(""); setPriceRange("any"); }}>
                    Clear Filters
                  </button>
                )}
                {selectedCity && !browseAll && (
                  <button className="ct-empty-btn ct-empty-btn-ghost" onClick={handleBrowseAll}>
                    🌏 Browse All Cities
                  </button>
                )}
                {(selectedCity || browseAll) && (
                  <button className="ct-empty-btn ct-empty-btn-ghost" onClick={() => setShowCityModal(true)}>
                    📍 Change City
                  </button>
                )}
              </div>
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
  .ct-root { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--ink); min-height: 100vh; }

  /* ═══════════════════════════════════════════════════════════
     CITY MODAL — same redesign as Vendors page
  ═══════════════════════════════════════════════════════════ */
  .ecm-backdrop {
    position: fixed; inset: 0; z-index: 2000;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    background: rgba(8, 7, 6, 0.82);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .ecm-backdrop.ecm-visible { opacity: 1; }
  .ecm-blob {
    position: fixed; border-radius: 50%;
    filter: blur(120px); pointer-events: none; z-index: 0;
  }
  .ecm-blob1 {
    width: 480px; height: 480px;
    background: radial-gradient(circle, #c9a84c 0%, transparent 70%);
    opacity: 0.12; top: -80px; left: -80px;
  }
  .ecm-blob2 {
    width: 340px; height: 340px;
    background: radial-gradient(circle, #7b5ea7 0%, transparent 70%);
    opacity: 0.1; bottom: -60px; right: -40px;
  }
  .ecm-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 540px;
    max-height: calc(100vh - 32px);
    background: #191714;
    border: 1px solid rgba(201,168,76,0.22);
    border-radius: 24px;
    display: flex; flex-direction: column;
    overflow: hidden;
    box-shadow:
      0 2px 0 rgba(255,255,255,0.04) inset,
      0 40px 100px rgba(0,0,0,0.65),
      0 0 0 1px rgba(0,0,0,0.4);
    animation: ecmSlideUp 0.42s cubic-bezier(0.34, 1.18, 0.64, 1) both;
  }
  .ecm-top {
    flex-shrink: 0;
    padding: 32px 28px 16px;
    border-bottom: 1px solid rgba(201,168,76,0.1);
    display: flex; flex-direction: column; align-items: center;
  }
  .ecm-logo-row { display: flex; justify-content: center; margin-bottom: 18px; }
  .ecm-logo-row img, .ecm-logo-row svg { width: 40px; height: 40px; }
  .ecm-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 9.5px; letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 12px; font-weight: 500;
  }
  .ecm-dot { display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: var(--gold); opacity: 0.55; }
  .ecm-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.55rem, 5vw, 2rem);
    font-weight: 300; color: #f5f0e8;
    line-height: 1.18; text-align: center; margin-bottom: 8px;
  }
  .ecm-heading em { font-style: italic; color: #e8d5a3; }
  .ecm-subtext {
    font-size: 12.5px; color: rgba(245,240,232,0.38);
    text-align: center; line-height: 1.6;
    margin-bottom: 20px; max-width: 340px;
  }
  .ecm-browse-btn {
    width: 100%;
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px;
    background: rgba(201,168,76,0.09);
    border: 1px solid rgba(201,168,76,0.28);
    border-radius: 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; color: #e8d5a3;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
    margin-bottom: 16px;
  }
  .ecm-browse-btn:hover { background: rgba(201,168,76,0.16); border-color: var(--gold); color: #fff; }
  .ecm-browse-icon { font-size: 1.2rem; flex-shrink: 0; }
  .ecm-browse-text { flex: 1; text-align: left; }
  .ecm-browse-arrow { font-size: 13px; color: var(--gold); opacity: 0.7; flex-shrink: 0; }
  .ecm-divider {
    display: flex; align-items: center; gap: 10px;
    width: 100%; margin-bottom: 14px;
  }
  .ecm-divider-line { flex: 1; height: 1px; background: rgba(201,168,76,0.1); }
  .ecm-divider-label { font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(245,240,232,0.22); white-space: nowrap; }
  .ecm-search-box {
    width: 100%; display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(201,168,76,0.18);
    border-radius: 12px; padding: 11px 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ecm-search-box:focus-within { border-color: rgba(201,168,76,0.55); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .ecm-search-icon { color: rgba(245,240,232,0.3); flex-shrink: 0; display: flex; }
  .ecm-search-input { flex: 1; background: none; border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #f5f0e8; }
  .ecm-search-input::placeholder { color: rgba(245,240,232,0.25); }
  .ecm-search-clear { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.07); border: none; display: flex; align-items: center; justify-content: center; color: rgba(245,240,232,0.45); cursor: pointer; flex-shrink: 0; transition: background 0.18s, color 0.18s; }
  .ecm-search-clear:hover { background: rgba(255,255,255,0.14); color: #f5f0e8; }
  .ecm-city-scroll {
    flex: 1; overflow-y: auto; padding: 14px 14px 0;
    scrollbar-width: thin; scrollbar-color: rgba(201,168,76,0.18) transparent;
  }
  .ecm-city-scroll::-webkit-scrollbar { width: 4px; }
  .ecm-city-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.18); border-radius: 4px; }
  .ecm-city-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; padding-bottom: 14px; }
  .ecm-city-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 13px;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(201,168,76,0.09);
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; color: rgba(245,240,232,0.65);
    cursor: pointer; text-align: left;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
    white-space: nowrap; overflow: hidden;
  }
  .ecm-city-btn:hover { background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.32); color: #e8d5a3; }
  .ecm-city-pin { font-size: 9px; color: var(--gold); opacity: 0.55; flex-shrink: 0; }
  .ecm-city-name { flex: 1; overflow: hidden; text-overflow: ellipsis; }
  .ecm-city-arrow { font-size: 10px; color: var(--gold); opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
  .ecm-city-btn:hover .ecm-city-arrow { opacity: 0.8; }
  .ecm-empty { padding: 40px 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
  .ecm-empty-icon { font-size: 2.4rem; opacity: 0.3; }
  .ecm-empty p { font-size: 13px; color: rgba(245,240,232,0.35); line-height: 1.6; }
  .ecm-empty-hint { font-size: 11px; color: rgba(245,240,232,0.2); }
  .ecm-footer {
    flex-shrink: 0; padding: 12px 20px;
    border-top: 1px solid rgba(201,168,76,0.09);
    font-size: 10.5px; color: rgba(245,240,232,0.22);
    text-align: center; letter-spacing: 0.03em;
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }
  .ecm-footer-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); opacity: 0.35; flex-shrink: 0; }
  @keyframes ecmSlideUp {
    from { opacity: 0; transform: translateY(28px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @media (max-width: 480px) {
    .ecm-top { padding: 24px 18px 14px; }
    .ecm-city-scroll { padding: 12px 10px 0; }
    .ecm-city-grid { grid-template-columns: 1fr; gap: 6px; }
  }

  /* ── CITY BAR ── */
  .ct-citybar { display: flex; align-items: center; gap: 10px; background: rgba(201,168,76,0.07); border-bottom: 1px solid rgba(201,168,76,0.18); padding: 10px 32px; font-size: 13px; color: var(--ink); }
  .ct-citybar-icon { font-size: 14px; flex-shrink: 0; }
  .ct-citybar-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  .ct-citybar-all { font-size: 12px; color: var(--muted); background: none; border: 1px solid rgba(14,12,10,0.12); border-radius: 20px; padding: 4px 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 400; transition: all 0.2s; white-space: nowrap; }
  .ct-citybar-all:hover { background: rgba(14,12,10,0.05); color: var(--ink); }
  .ct-citybar-change { font-size: 12px; color: var(--gold); background: none; border: 1px solid rgba(201,168,76,0.3); border-radius: 20px; padding: 4px 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.2s; white-space: nowrap; }
  .ct-citybar-change:hover { background: rgba(201,168,76,0.1); border-color: var(--gold); }
  @media (max-width: 640px) { .ct-citybar { padding: 10px 16px; font-size: 12px; } }

  /* ── HERO ── */
  .ct-hero { position: relative; background: var(--ink); overflow: hidden; padding: 64px 32px 56px; text-align: center; }
  .ct-hero-orb { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; }
  .ct-orb1 { width: 420px; height: 420px; background: var(--accent, var(--gold)); opacity: 0.15; top: -100px; left: -60px; }
  .ct-orb2 { width: 320px; height: 320px; background: var(--accent, var(--gold)); opacity: 0.08; bottom: -80px; right: -40px; }
  .ct-hero-inner { position: relative; z-index: 2; max-width: 640px; margin: 0 auto; animation: fadeUp 0.6s ease both; }
  .ct-back { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); color: var(--gold-light); font-family: 'DM Sans', sans-serif; font-size: 12px; letter-spacing: 0.08em; padding: 6px 14px; border-radius: 20px; cursor: pointer; margin-bottom: 28px; transition: all 0.2s; }
  .ct-back:hover { background: rgba(201,168,76,0.12); border-color: var(--gold); color: var(--gold); }
  .ct-hero-emoji { font-size: 3.2rem; margin-bottom: 16px; display: block; filter: drop-shadow(0 4px 20px rgba(201,168,76,0.3)); }
  .ct-hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.2rem,5vw,3.2rem); font-weight: 300; color: var(--white); margin-bottom: 14px; }
  .ct-hero-desc { font-size: 14px; color: rgba(245,240,232,0.6); line-height: 1.7; margin-bottom: 24px; }
  .ct-hero-badge { display: inline-block; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); border: 1px solid rgba(201,168,76,0.3); padding: 5px 16px; border-radius: 20px; background: rgba(201,168,76,0.08); }

  /* ── TOOLBAR ── */
  .ct-toolbar { background: var(--white); border-bottom: 1px solid var(--border); padding: 16px 32px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; position: sticky; top: 0; z-index: 10; box-shadow: 0 2px 16px rgba(14,12,10,0.05); }
  .ct-search-wrap { display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 7px; padding: 9px 14px; background: var(--surface); flex: 1; min-width: 200px; max-width: 320px; transition: border-color 0.2s, box-shadow 0.2s; }
  .ct-search-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .ct-search-icon { font-size: 16px; color: var(--muted); flex-shrink: 0; display: flex; }
  .ct-search { border: none; background: transparent; outline: none; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); width: 100%; }
  .ct-search::placeholder { color: #bbb4a8; }
  .ct-search-clear { background: none; border: none; cursor: pointer; font-size: 12px; color: var(--muted); flex-shrink: 0; padding: 0; transition: color 0.2s; }
  .ct-search-clear:hover { color: var(--ink); }
  .ct-sort-wrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .ct-sort-label { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
  .ct-sort-pills { display: flex; gap: 6px; flex-wrap: wrap; }
  .ct-sort-pill { font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--muted); border: 1px solid var(--border); border-radius: 20px; padding: 5px 13px; background: transparent; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .ct-sort-pill:hover { border-color: var(--gold); color: var(--gold); }
  .ct-sort-pill.active { background: var(--ink); color: var(--white); border-color: var(--ink); }
  @media (max-width: 640px) { .ct-toolbar { padding: 12px 16px; gap: 12px; } .ct-search-wrap { max-width: 100%; flex: 1 1 100%; } .ct-sort-wrap { width: 100%; } }

  /* ── BUDGET BAR ── */
  .ct-budget-bar { background: var(--surface); border-bottom: 1px solid var(--border); padding: 10px 32px 12px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .ct-budget-label { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); white-space: nowrap; flex-shrink: 0; }
  .ct-budget-pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .ct-budget-pill { font-size: 12px; padding: 6px 14px; border: 1px solid var(--border); border-radius: 20px; background: var(--white); color: var(--muted); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.18s; white-space: nowrap; }
  .ct-budget-pill:hover { border-color: var(--gold); color: var(--ink); background: rgba(201,168,76,0.06); }
  .ct-budget-pill.active { background: var(--ink); color: var(--white); border-color: var(--ink); font-weight: 500; }
  @media (max-width: 640px) { .ct-budget-bar { padding: 10px 16px 12px; } .ct-budget-pill { font-size: 11px; padding: 5px 10px; } }

  /* ── BODY ── */
  .ct-body { max-width: 1140px; margin: 0 auto; padding: 40px 32px 80px; }
  .ct-result-count { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
  .ct-result-count strong { color: var(--ink); font-weight: 500; }
  .ct-result-count em { font-style: italic; color: var(--ink); }
  .ct-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  @media (max-width: 960px) { .ct-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 580px) { .ct-grid { grid-template-columns: 1fr; } .ct-body { padding: 28px 16px 60px; } }
  .ct-card-wrapper { animation: fadeUp 0.5s ease both; }
  .ct-loading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  @media (max-width: 960px) { .ct-loading { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 580px) { .ct-loading { grid-template-columns: 1fr; } }
  .ct-skeleton { height: 280px; border-radius: 12px; background: linear-gradient(90deg, #ede8e0 25%, #e5dfd4 50%, #ede8e0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }
  .ct-empty { text-align: center; padding: 80px 20px; }
  .ct-empty-icon { font-size: 3rem; margin-bottom: 20px; display: block; }
  .ct-empty h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
  .ct-empty p { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 24px; }
  .ct-empty-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .ct-empty-btn { padding: 11px 26px; background: var(--ink); color: var(--white); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .ct-empty-btn:hover { background: var(--gold); color: var(--ink); }
  .ct-empty-btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .ct-empty-btn-ghost:hover { border-color: var(--gold); color: var(--gold); background: transparent; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;