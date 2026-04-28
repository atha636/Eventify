import { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import ServiceCard from "../components/ServiceCard";
import Logo from "../components/Logo";

// ─── SEO HEAD MANAGER ───────────────────────────────────────────
function SEOHead({ category, search, dateFilter, count }) {
  useEffect(() => {
    const base = "Evencers — India's Premier Event Vendor Marketplace";
    const descriptions = {
      all: `Discover ${count}+ verified event professionals across India. Book photographers, caterers, decorators, DJs, florists & venues for weddings, corporate events and more.`,
      decor: `Browse top-rated event decoration vendors in India. From wedding mandaps to corporate setups — find the perfect decor team on Evencers.`,
      photography: `Hire professional event photographers & videographers in India. Candid, traditional, pre-wedding shoots — all verified on Evencers.`,
      catering: `Find the best event catering services in India. Multi-cuisine, live counters, buffet & plated dining — book verified caterers on Evencers.`,
      music: `Hire DJs & live music artists for weddings, parties & corporate events across India. All vetted professionals on Evencers.`,
      florals: `Discover floral artists & decorators in India for weddings, mehendi, receptions & corporate events. Book fresh florals on Evencers.`,
      venues: `Explore premium event venues across India — banquet halls, outdoor gardens, rooftop spaces & more. Book your perfect venue on Evencers.`,
    };

    const title = search
      ? `"${search}" — Event Vendors | Evencers`
      : category !== "all"
      ? `${CATEGORIES.find(c => c.value === category)?.label} Vendors in India | Evencers`
      : base;

    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = descriptions[category] || descriptions.all;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = `https://evencers.com/vendors${category !== "all" ? `?cat=${category}` : ""}`;

    const ogTags = {
      "og:title": title,
      "og:description": descriptions[category] || descriptions.all,
      "og:type": "website",
      "og:url": canonical.href,
      "og:image": "https://evencers.com/og-vendors.jpg",
      "og:site_name": "Evencers",
    };
    Object.entries(ogTags).forEach(([prop, content]) => {
      let tag = document.querySelector(`meta[property="${prop}"]`);
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute("property", prop); document.head.appendChild(tag); }
      tag.content = content;
    });

    let sd = document.querySelector("#evencers-sd");
    if (!sd) { sd = document.createElement("script"); sd.type = "application/ld+json"; sd.id = "evencers-sd"; document.head.appendChild(sd); }
    sd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": title,
      "description": descriptions[category] || descriptions.all,
      "url": canonical.href,
      "numberOfItems": count,
    });
  }, [category, search, count]);

  return null;
}

// Categories — comingSoon flags for ones with no real vendors yet
const CATEGORIES = [
  { value: "all",         label: "All",         emoji: "✦",  count: null,  comingSoon: false },
  { value: "decor",       label: "Decor",       emoji: "🎨", count: "10+", comingSoon: false },
  { value: "photography", label: "Photography", emoji: "📸", count: "8+",  comingSoon: false },
  { value: "catering",    label: "Catering",    emoji: "🍽",  count: null,  comingSoon: true  },
  { value: "music",       label: "Music & DJ",  emoji: "🎵", count: null,  comingSoon: true  },
  { value: "florals",     label: "Florals",     emoji: "💐", count: null,  comingSoon: true  },
  { value: "venues",      label: "Venues",      emoji: "🏛",  count: null,  comingSoon: true  },
];

const SORT_OPTIONS = [
  { value: "default",    label: "Recommended"       },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating",     label: "Top Rated"         },
  { value: "newest",     label: "Newest First"      },
];

const TRUST_STATS = [
  { value: "20+",  label: "Verified Vendors"  },
  { value: "30+",  label: "Events Completed"  },
  { value: "4.9★", label: "Avg. Rating"       },
  { value: "2+",   label: "Cities Covered"    },
];

// Floating hero card data (like the About page style in image 3)
const HERO_CARDS = [
  { icon: "🏆", title: "Best Platform 2026", sub: "Evencers Award", side: "right", top: "22%" },
  { icon: "👥", title: "100+ Happy Clients",  sub: "& counting",    side: "left",  top: "30%" },
  { icon: "⭐", title: "4.9★ Average Rating", sub: "Verified Reviews", side: "right", top: "58%" },
];

// ─────────────────────────────────────────────
// DATE PICKER MODAL
// ─────────────────────────────────────────────
function DatePickerModal({ value, onChange, onClear, onClose }) {
  const [viewYear,  setViewYear]  = useState(value ? new Date(value).getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? new Date(value).getMonth()    : new Date().getMonth());

  const toKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const today           = toKey(new Date());
  const daysInMonth     = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek  = new Date(viewYear, viewMonth, 1).getDay();
  const monthName       = new Date(viewYear, viewMonth, 1).toLocaleString("en-IN", { month: "long" });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDay = (day) => {
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (key < today) return;
    onChange(key);
    onClose();
  };

  return (
    <div className="dp-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dp-modal" role="dialog" aria-modal="true" aria-label="Select event date">
        <button className="dp-x-btn" onClick={onClose} aria-label="Close date picker">✕</button>
        <p className="dp-modal-title">Select Event Date</p>
        <div className="dp-nav">
          <button className="dp-nav-btn" onClick={prevMonth} aria-label="Previous month">‹</button>
          <span className="dp-month-label">{monthName} {viewYear}</span>
          <button className="dp-nav-btn" onClick={nextMonth} aria-label="Next month">›</button>
        </div>
        <div className="dp-grid" role="grid">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
            <div key={d} className="dp-hdr" role="columnheader">{d}</div>
          ))}
          {[...Array(firstDayOfWeek)].map((_, i) => <div key={`e${i}`} aria-hidden="true" />)}
          {[...Array(daysInMonth)].map((_, i) => {
            const day  = i + 1;
            const key  = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast     = key < today;
            const isToday    = key === today;
            const isSelected = key === value;
            return (
              <button
                key={key}
                className={`dp-day ${isPast ? "dp-past" : ""} ${isSelected ? "dp-selected" : ""} ${isToday && !isSelected ? "dp-today" : ""}`}
                onClick={() => handleDay(day)}
                disabled={isPast}
                aria-label={`${day} ${monthName} ${viewYear}${isPast ? " (unavailable)" : ""}${isSelected ? " (selected)" : ""}`}
                aria-pressed={isSelected}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="dp-footer">
          {value ? (
            <button className="dp-clear-btn" onClick={() => { onClear(); onClose(); }}>✕ Clear date filter</button>
          ) : (
            <button className="dp-cancel-btn" onClick={onClose}>Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ANIMATED COUNTER ───────────────────────────────────────────
function AnimCount({ target }) {
  const [n, setN] = useState(0);
  const hasRun = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !hasRun.current) {
        hasRun.current = true;
        const num = parseInt(target.replace(/\D/g, ""), 10);
        const steps = 30;
        let i = 0;
        const tick = setInterval(() => {
          i++;
          setN(Math.round((num * i) / steps));
          if (i >= steps) clearInterval(tick);
        }, 35);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  const num = parseInt(target.replace(/\D/g, ""), 10);
  const suffix = target.replace(/[\d,]/g, "");
  const hasComma = target.includes(",");

  return (
    <span ref={ref}>
      {hasComma ? n.toLocaleString("en-IN") : n}{suffix}
    </span>
  );
}

// ─── POPULAR SEARCHES ────────────────────────────────────────────
const POPULAR = ["Wedding Photographer", "Decor Delhi", "Wedding Decor", "DJ for Party", "Floral Designer", "Banquet Hall"];

// ─── FAQ ACCORDION ITEM ─────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`vn-faq-item ${open ? "open" : ""}`}>
      <button
        className="vn-faq-q"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <span className="vn-faq-chevron" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="vn-faq-a" role="region">{a}</div>}
    </div>
  );
}

// ─── COMING SOON EMPTY STATE ─────────────────────────────────────
function ComingSoonState({ category, onClear }) {
  const cat = CATEGORIES.find(c => c.value === category);
  return (
    <div className="vn-coming-soon" role="status">
      <div className="vn-cs-glow" aria-hidden="true" />
      <div className="vn-cs-icon" aria-hidden="true">{cat?.emoji}</div>
      <div className="vn-cs-badge">Coming Soon</div>
      <h2 className="vn-cs-title">{cat?.label} Vendors</h2>
      <p className="vn-cs-sub">
        We're onboarding the finest <strong>{cat?.label.toLowerCase()}</strong> professionals across India.
        Be the first to know when they go live.
      </p>
      <div className="vn-cs-notify">
        <input
          className="vn-cs-email"
          type="email"
          placeholder="Enter your email address"
          aria-label="Email for notification"
        />
        <button className="vn-cs-btn">Notify Me →</button>
      </div>
      <button className="vn-cs-back" onClick={onClear}>
        ← Browse available vendors
      </button>
      <div className="vn-cs-eta">
        <span className="vn-cs-eta-dot" />
        Launching in select cities by Q3 2026
      </div>
    </div>
  );
}

export default function Vendors() {
  const location = useLocation();
  const navigate = useNavigate();

  const [vendors,        setVendors]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [category,       setCategory]       = useState("all");
  const [sort,           setSort]           = useState("default");
  const [layout,         setLayout]         = useState("grid");
  const [maxPrice,       setMaxPrice]       = useState("");
  const [dateFilter,     setDateFilter]     = useState("");
  const [dateLoading,    setDateLoading]    = useState(false);
  const [availVendors,   setAvailVendors]   = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [heroVisible,    setHeroVisible]    = useState(false);

  const isNavigatingRef  = useRef(false);
  const searchRef        = useRef(null);
  const howItWorksRef    = useRef(null);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => { setTimeout(() => setHeroVisible(true), 80); }, []);

  useEffect(() => {
    if (isNavigatingRef.current) { isNavigatingRef.current = false; return; }
    const params    = new URLSearchParams(location.search);
    const q         = params.get("q")    || "";
    const cat       = params.get("cat")  || "all";
    const max       = params.get("max")  || "";
    const sortParam = params.get("sort") || "default";
    const date      = params.get("date") || "";
    setSearch(q); setMaxPrice(max); setSort(sortParam); setDateFilter(date);
    setCategory(CATEGORIES.some((c) => c.value === cat) ? cat : "all");
  }, [location.search]);

  useEffect(() => {
    API.get("/vendors")
      .then((res) => setVendors(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!dateFilter) { setAvailVendors(null); return; }
    setDateLoading(true);
    API.get(`/vendors/available?date=${dateFilter}`)
      .then((res) => setAvailVendors(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAvailVendors(null))
      .finally(() => setDateLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim())      params.set("q",    search);
    if (category !== "all") params.set("cat",  category);
    if (maxPrice)           params.set("max",  maxPrice);
    if (sort !== "default") params.set("sort", sort);
    if (dateFilter)         params.set("date", dateFilter);
    const newSearch = params.toString();
    const current   = location.search.replace(/^\?/, "");
    if (newSearch !== current) {
      isNavigatingRef.current = true;
      navigate(`/vendors${newSearch ? `?${newSearch}` : ""}`, { replace: true });
    }
  }, [search, category, maxPrice, sort, dateFilter]);

  const filtered = useMemo(() => {
    let base = dateFilter && availVendors !== null ? availVendors : vendors;
    let list  = [...base];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.title?.toLowerCase().includes(q) ||
        v.location?.toLowerCase().includes(q) ||
        v.serviceType?.toLowerCase().includes(q)
      );
    }
    if (category !== "all") list = list.filter((v) => v.serviceType?.toLowerCase() === category);
    if (maxPrice) list = list.filter((v) => (v.packages?.[0]?.price || 0) <= Number(maxPrice));
    switch (sort) {
      case "price_asc":  list.sort((a, b) => (a.packages?.[0]?.price || 0) - (b.packages?.[0]?.price || 0)); break;
      case "price_desc": list.sort((a, b) => (b.packages?.[0]?.price || 0) - (a.packages?.[0]?.price || 0)); break;
      case "rating":     list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "newest":     list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
    }
    return list;
  }, [vendors, availVendors, dateFilter, search, category, sort, maxPrice]);

  const hasActiveFilters = category !== "all" || maxPrice || search || dateFilter;
  const clearAll = () => { setSearch(""); setCategory("all"); setSort("default"); setMaxPrice(""); setDateFilter(""); setAvailVendors(null); };
  const dateLabel = dateFilter
    ? new Date(dateFilter + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const activeCat = CATEGORIES.find(c => c.value === category);

  // Is the selected category a "coming soon" one?
  const isCategoryComingSoon = activeCat?.comingSoon && !search && !dateFilter && !maxPrice;

  return (
    <>
      <style>{styles}</style>
      <SEOHead category={category} search={search} dateFilter={dateFilter} count={vendors.length || 20} />

      <div className="vn-root">
        <Navbar />

        {showDatePicker && (
          <DatePickerModal
            value={dateFilter}
            onChange={(d) => setDateFilter(d)}
            onClear={() => { setDateFilter(""); setAvailVendors(null); }}
            onClose={() => setShowDatePicker(false)}
          />
        )}

        {/* ── HERO ── */}
        <header className={`vn-hero ${heroVisible ? "vn-hero--visible" : ""}`} role="banner">
          <div className="vn-hero-grain" aria-hidden="true" />
          <div className="vn-hero-orb vn-orb1" aria-hidden="true" />
          <div className="vn-hero-orb vn-orb2" aria-hidden="true" />
          <div className="vn-hero-orb vn-orb3" aria-hidden="true" />

          {/* Floating cards — left side */}
          <div className="vn-float-card vn-fc-left vn-fc-1" aria-hidden="true">
            <span className="vn-fc-icon">👥</span>
            <div className="vn-fc-text">
              <span className="vn-fc-val">100+</span>
              <span className="vn-fc-label">Happy Clients</span>
            </div>
          </div>

          {/* Floating cards — right side */}
          <div className="vn-float-card vn-fc-right vn-fc-2" aria-hidden="true">
            <span className="vn-fc-icon">🏆</span>
            <div className="vn-fc-text">
              <span className="vn-fc-val">Best Platform</span>
              <span className="vn-fc-label">2026 Award</span>
            </div>
          </div>

          <div className="vn-float-card vn-fc-right vn-fc-3" aria-hidden="true">
            <span className="vn-fc-icon">⭐</span>
            <div className="vn-fc-text">
              <span className="vn-fc-val">4.9★ Rating</span>
              <span className="vn-fc-label">Avg. Rating</span>
            </div>
          </div>

          <div className="vn-hero-inner">
            <div className="vn-eyebrow">
              <span className="vn-eyebrow-dot" />
              <span>Discover &amp; Book</span>
              <span className="vn-eyebrow-dot" />
            </div>

            <h1 className="vn-hero-title">
              {category !== "all" ? (
                <>{activeCat.emoji} {activeCat.label} <em>Vendors</em></>
              ) : (
                <>Find Your Perfect <em>Event Team</em></>
              )}
            </h1>

            <p className="vn-hero-sub">
              {loading
                ? "Loading our curated vendor network across India…"
                : `${vendors.length || "20+"}+ verified event professionals across 2 cities in India`}
            </p>

            {/* Search */}
            <div className={`vn-search-bar ${searchFocused ? "focused" : ""}`} role="search">
              <span className="vn-search-icon" aria-hidden="true">⌕</span>
              <input
                ref={searchRef}
                className="vn-search-input"
                placeholder="Search vendors by name, city, or service type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                aria-label="Search vendors"
                autoComplete="off"
              />
              {search && (
                <button className="vn-search-clear" onClick={() => setSearch("")} aria-label="Clear search">✕</button>
              )}
            </div>

            {!search && (
              <div className="vn-popular" aria-label="Popular searches">
                <span className="vn-popular-label">Popular:</span>
                {POPULAR.map((p) => (
                  <button key={p} className="vn-popular-tag" onClick={() => setSearch(p)}>{p}</button>
                ))}
              </div>
            )}

            <div className="vn-trust-strip" role="list" aria-label="Platform statistics">
              {TRUST_STATS.map((s) => (
                <div key={s.label} className="vn-trust-item" role="listitem">
                  <span className="vn-trust-val">
                    <AnimCount target={s.value} />
                  </span>
                  <span className="vn-trust-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── CATEGORY STRIP ── */}
        <nav className="vn-category-strip" aria-label="Filter by service category">
          <div className="vn-category-inner">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                className={`vn-cat-pill ${category === c.value ? "active" : ""} ${c.comingSoon ? "vn-cat-soon" : ""}`}
                onClick={() => { setCategory(c.value); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                aria-pressed={category === c.value}
                aria-label={`${c.label}${c.comingSoon ? " — Coming Soon" : c.count ? ` — ${c.count} vendors` : ""}`}
              >
                <span className="vn-cat-emoji" aria-hidden="true">{c.emoji}</span>
                <span>{c.label}</span>
                {c.comingSoon ? (
                  <span className="vn-cat-soon-badge">Soon</span>
                ) : c.count ? (
                  <span className="vn-cat-count">{c.count}</span>
                ) : null}
              </button>
            ))}
          </div>
        </nav>

        {/* ── TOOLBAR ── */}
        {!isCategoryComingSoon && (
          <div className="vn-toolbar" role="toolbar" aria-label="Filter and sort vendors">
            <div className="vn-toolbar-left">
              <span className="vn-result-text" aria-live="polite" aria-atomic="true">
                {(loading || dateLoading) ? (
                  <span className="vn-result-loading"><span className="vn-pulse" />Finding vendors…</span>
                ) : (
                  <>
                    <strong>{filtered.length}</strong> vendor{filtered.length !== 1 ? "s" : ""}
                    {dateFilter && <> available on <em>{dateLabel}</em></>}
                    {search && !dateFilter && <> matching "<em>{search}</em>"</>}
                  </>
                )}
              </span>
              {hasActiveFilters && (
                <button className="vn-clear-btn" onClick={clearAll} aria-label="Clear all filters">✕ Clear all</button>
              )}
            </div>

            <div className="vn-toolbar-right">
              <button
                className={`vn-date-btn ${dateFilter ? "vn-date-active" : ""}`}
                onClick={() => setShowDatePicker(true)}
                aria-expanded={showDatePicker}
                aria-label={dateFilter ? `Date filter: ${dateLabel}. Click to change` : "Filter by available date"}
              >
                <span className="vn-date-icon" aria-hidden="true">📅</span>
                {dateFilter ? dateLabel : "By Date"}
                {dateFilter && (
                  <span
                    className="vn-date-clear-x"
                    role="button"
                    tabIndex={0}
                    aria-label="Remove date filter"
                    onClick={(e) => { e.stopPropagation(); setDateFilter(""); setAvailVendors(null); }}
                    onKeyDown={(e) => e.key === "Enter" && (() => { setDateFilter(""); setAvailVendors(null); })()}
                  >✕</span>
                )}
              </button>

              <div className="vn-price-wrap" title="Maximum budget filter">
                <span className="vn-price-label">Max ₹</span>
                <input
                  type="number"
                  className="vn-price-input"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  aria-label="Maximum price filter in rupees"
                  min={0}
                />
              </div>

              <select
                className="vn-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort vendors"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <div className="vn-layout-toggle" role="group" aria-label="View layout">
                <button
                  className={`vn-layout-btn ${layout === "grid" ? "active" : ""}`}
                  onClick={() => setLayout("grid")}
                  aria-pressed={layout === "grid"}
                  aria-label="Grid view"
                >⊞</button>
                <button
                  className={`vn-layout-btn ${layout === "list" ? "active" : ""}`}
                  onClick={() => setLayout("list")}
                  aria-pressed={layout === "list"}
                  aria-label="List view"
                >☰</button>
              </div>
            </div>
          </div>
        )}

        {/* ── DATE BANNER ── */}
        {dateFilter && !dateLoading && (
          <div className="vn-date-banner" role="status" aria-live="polite">
            <span className="vn-date-banner-icon" aria-hidden="true">📅</span>
            <span>
              Showing <strong>{filtered.length}</strong> vendor{filtered.length !== 1 ? "s" : ""} available on{" "}
              <strong>{dateLabel}</strong>
            </span>
            <button
              className="vn-date-banner-clear"
              onClick={() => { setDateFilter(""); setAvailVendors(null); }}
            >Clear date</button>
          </div>
        )}

        {/* ── ACTIVE FILTER CHIPS ── */}
        {hasActiveFilters && !isCategoryComingSoon && (
          <div className="vn-filter-chips" aria-label="Active filters">
            {category !== "all" && (
              <span className="vn-chip">
                {activeCat.emoji} {activeCat.label}
                <button onClick={() => setCategory("all")} aria-label={`Remove ${activeCat.label} filter`}>✕</button>
              </span>
            )}
            {maxPrice && (
              <span className="vn-chip">
                Under ₹{Number(maxPrice).toLocaleString("en-IN")}
                <button onClick={() => setMaxPrice("")} aria-label="Remove price filter">✕</button>
              </span>
            )}
            {sort !== "default" && (
              <span className="vn-chip">
                {SORT_OPTIONS.find(o => o.value === sort)?.label}
                <button onClick={() => setSort("default")} aria-label="Remove sort">✕</button>
              </span>
            )}
          </div>
        )}

        {/* ── CONTENT ── */}
        <main className="vn-content" id="vendor-results" aria-label="Vendor listings">

          {/* ── COMING SOON STATE for categories with no vendors yet ── */}
          {isCategoryComingSoon ? (
            <ComingSoonState category={category} onClear={clearAll} />
          ) : (loading || dateLoading) ? (
            <div className={`vn-grid ${layout}`} aria-busy="true" aria-label="Loading vendors">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`vn-skeleton ${layout === "list" ? "vn-skeleton-list" : ""}`}
                  style={{ animationDelay: `${i * 0.07}s` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="vn-empty" role="status">
              <div className="vn-empty-icon" aria-hidden="true">✨</div>
              {dateFilter ? (
                <>
                  <h2>No vendors available on {dateLabel}</h2>
                  <p>All vendors matching your filters are booked on this date. Try a different date or browse all vendors.</p>
                  <button className="vn-empty-btn" onClick={() => { setDateFilter(""); setAvailVendors(null); }}>
                    Show all vendors
                  </button>
                </>
              ) : (
                <>
                  <h2>No vendors found</h2>
                  <p>
                    {search
                      ? `No results for "${search}". Try adjusting your search terms or filters.`
                      : "No vendors match the selected filters. Try broadening your search."}
                  </p>
                  <button className="vn-empty-btn" onClick={clearAll}>Clear all filters</button>
                </>
              )}
              <div className="vn-empty-suggest">
                <p className="vn-empty-suggest-label">Try searching for:</p>
                <div className="vn-empty-suggest-tags">
                  {POPULAR.slice(0, 4).map(p => (
                    <button key={p} className="vn-popular-tag" onClick={() => { clearAll(); setSearch(p); }}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className={`vn-grid ${layout}`} role="list" aria-label={`${filtered.length} vendors`}>
                {filtered.map((v, i) => (
                  <div
                    key={v._id}
                    className="vn-card-wrap"
                    style={{ animationDelay: `${Math.min(i * 0.04, 0.5)}s` }}
                    role="listitem"
                  >
                    <ServiceCard vendor={v} />
                  </div>
                ))}
              </div>
              {filtered.length >= 12 && (
                <p className="vn-load-hint" aria-live="polite">Showing all {filtered.length} results</p>
              )}
            </>
          )}
        </main>

        {/* ── WHY EVENCERS SECTION ── */}
        {!loading && !search && category === "all" && !dateFilter && (
          <section className="vn-why-section" aria-labelledby="why-heading">
            <div className="vn-why-inner">
              <div className="vn-why-header">
                <span className="vn-why-eyebrow">Why Evencers?</span>
                <h2 id="why-heading" className="vn-why-title">India's Most Trusted Event Vendor Platform</h2>
                <p className="vn-why-sub">Every vendor is background-checked, insured, and reviewed by real clients.</p>
              </div>
              <div className="vn-why-grid">
                {[
                  { icon: "🛡️", title: "Verified Professionals", desc: "Every vendor undergoes document verification, portfolio review, and client reference checks before listing." },
                  { icon: "💰", title: "Transparent Pricing",    desc: "No hidden charges. Browse real package prices and get instant quotes directly from vendors." },
                  { icon: "🤝", title: "Secure Booking",         desc: "Book with confidence. Payments are held in escrow until your event is successfully completed." },
                  { icon: "⭐", title: "Genuine Reviews",        desc: "All reviews are from verified clients who booked through Evencers — no fake ratings, ever." },
                  { icon: "📞", title: "24/7 Support",           desc: "Our event experts are available around the clock to help you plan and resolve any issues." },
                  { icon: "🔄", title: "Easy Rescheduling",      desc: "Plans change. Reschedule or modify bookings up to 48 hours before your event with no penalty." },
                ].map((w) => (
                  <article key={w.title} className="vn-why-card">
                    <span className="vn-why-icon" aria-hidden="true">{w.icon}</span>
                    <h3 className="vn-why-card-title">{w.title}</h3>
                    <p className="vn-why-card-desc">{w.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── HOW IT WORKS ── */}
        {!loading && vendors.length > 0 && (
          <section className="vn-hiw-section" id="how-it-works" ref={howItWorksRef} aria-labelledby="hiw-heading">
            <div className="vn-hiw-inner">
              <div className="vn-hiw-header">
                <span className="vn-why-eyebrow">Simple &amp; Transparent</span>
                <h2 id="hiw-heading" className="vn-why-title">How Evencers Works</h2>
                <p className="vn-why-sub">From discovery to your event day — everything in four easy steps.</p>
              </div>

              <div className="vn-hiw-label">For Clients</div>
              <div className="vn-hiw-steps">
                {[
                  { n: "01", icon: "🔍", title: "Browse & Filter",    desc: "Search 20+ verified vendors by category, city, budget, and availability date. Every profile shows real photos, packages, and genuine client reviews." },
                  { n: "02", icon: "💬", title: "Get Instant Quotes", desc: "Send enquiries to multiple vendors at once. Compare detailed quotes, packages, and inclusions — all in one dashboard, no phone calls needed." },
                  { n: "03", icon: "🔒", title: "Secure Your Booking", desc: "Confirm your vendor with a secure deposit. Your payment is held in escrow and released to the vendor only after your event is successfully completed." },
                  { n: "04", icon: "🎉", title: "Enjoy Your Event",    desc: "Your vendor arrives prepared. After the event, leave a verified review to help other clients — and get cashback on your next booking." },
                ].map((s, i) => (
                  <div key={s.n} className="vn-hiw-card" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="vn-hiw-num">{s.n}</div>
                    <div className="vn-hiw-icon" aria-hidden="true">{s.icon}</div>
                    <h3 className="vn-hiw-title">{s.title}</h3>
                    <p className="vn-hiw-desc">{s.desc}</p>
                    {i < 3 && <div className="vn-hiw-arrow" aria-hidden="true">→</div>}
                  </div>
                ))}
              </div>

              <div className="vn-hiw-divider">
                <span className="vn-hiw-divider-label">Are you a vendor?</span>
              </div>

              <div className="vn-hiw-label">For Vendors</div>
              <div className="vn-hiw-steps vn-hiw-steps--vendor">
                {[
                  { n: "01", icon: "📋", title: "Create Your Profile",  desc: "List your services, showcase your portfolio, set your packages and pricing. Our team verifies your credentials within 24 hours." },
                  { n: "02", icon: "📥", title: "Receive Enquiries",     desc: "Get notified instantly when clients enquire. Respond with custom quotes, availability, and personalised offers directly from your dashboard." },
                  { n: "03", icon: "📅", title: "Manage Your Calendar",  desc: "Accept bookings, block unavailable dates, and track upcoming events all in one place. No double bookings, ever." },
                  { n: "04", icon: "💸", title: "Get Paid Securely",     desc: "Receive your payment within 48 hours of event completion. No chasing invoices — Evencers handles all payment processing for you." },
                ].map((s, i) => (
                  <div key={s.n} className="vn-hiw-card vn-hiw-card--vendor" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="vn-hiw-num vn-hiw-num--vendor">{s.n}</div>
                    <div className="vn-hiw-icon" aria-hidden="true">{s.icon}</div>
                    <h3 className="vn-hiw-title">{s.title}</h3>
                    <p className="vn-hiw-desc">{s.desc}</p>
                    {i < 3 && <div className="vn-hiw-arrow" aria-hidden="true">→</div>}
                  </div>
                ))}
              </div>

              <div className="vn-hiw-faq">
                <div className="vn-hiw-faq-header">
                  <h3 className="vn-hiw-faq-title">Frequently Asked Questions</h3>
                </div>
                <div className="vn-hiw-faq-grid">
                  {[
                    { q: "Is Evencers free to use for clients?",          a: "Yes — browsing, comparing, and messaging vendors is completely free for clients. You only pay when you confirm a booking." },
                    { q: "How are vendors verified?",                      a: "Every vendor submits government ID, business registration, and portfolio proof. Our team manually reviews each application before approval." },
                    { q: "What if my event gets cancelled?",               a: "Our cancellation policy protects both parties. Clients can cancel up to 48 hours before the event for a partial refund based on the vendor's policy." },
                    { q: "How does the escrow payment work?",              a: "Your deposit is held securely by Evencers. It is transferred to the vendor only after you confirm the event was completed satisfactorily." },
                    { q: "Can I book multiple vendors for one event?",     a: "Absolutely. Many clients book a photographer, caterer, decorator, and DJ all through Evencers — manage all bookings from a single dashboard." },
                    { q: "What cities does Evencers currently cover?",     a: "We currently cover cities across India including Delhi, Chandigarh, Bombay and more — with many more launching in Q3 2026." },
                  ].map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER CTA ── */}
        {!loading && vendors.length > 0 && (
          <section className="vn-footer-cta" aria-labelledby="cta-heading">
            <div className="vn-footer-orb" aria-hidden="true" />
            <div className="vn-footer-orb vn-footer-orb2" aria-hidden="true" />
            <div className="vn-eyebrow" style={{ color: "var(--gold)" }}>
              <div className="vn-eyebrow-logo"><Logo /></div>
              <span>Are you an event professional?</span>
            </div>
            <h2 id="cta-heading" className="vn-footer-title">Grow your business with Evencers</h2>
            <p className="vn-footer-sub">
              Join 20+ verified vendors already earning through Evencers. Get discovered by thousands of clients planning weddings, corporate events, and private parties across India.
            </p>
            <div className="vn-footer-cta-btns">
              <a href="/register" className="vn-footer-btn" aria-label="Register as a vendor on Evencers">
                Become a Vendor →
              </a>
              <button onClick={scrollToHowItWorks} className="vn-footer-btn-ghost" aria-label="Learn how Evencers works for vendors">
                How it works ↓
              </button>
            </div>
            <div className="vn-footer-logos" aria-label="Featured in">
              <span className="vn-footer-logos-label">Featured in</span>
              {["YourStory", "Inc42", "Economic Times", "Hindustan Times"].map(p => (
                <span key={p} className="vn-footer-press">{p}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a;
    --ink-soft: #1c1a17;
    --cream: #f5f0e8;
    --cream-dark: #ede7d9;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --gold-dim: rgba(201,168,76,0.12);
    --gold-glow: rgba(201,168,76,0.22);
    --muted: #7a7265;
    --muted-light: #a09890;
    --border: rgba(201,168,76,0.16);
    --border-soft: rgba(14,12,10,0.08);
    --surface: #faf7f2;
    --white: #ffffff;
    --red-soft: rgba(184,92,92,0.16);
    --red: #b85c5c;
  }

  /* ─── ROOT ─────────────────────────────────── */
  .vn-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  /* ─── HERO ──────────────────────────────────── */
  .vn-hero {
    position: relative;
    background: var(--ink);
    overflow: hidden;
    padding: 108px 32px 72px;
    text-align: center;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .vn-hero--visible { opacity: 1; transform: translateY(0); }

  .vn-hero-grain {
    position: absolute; inset: 0; z-index: 1; pointer-events: none;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 160px;
  }
  .vn-hero-orb {
    position: absolute; border-radius: 50%; filter: blur(120px);
    opacity: 0.11; pointer-events: none;
  }
  .vn-orb1 { width: 520px; height: 520px; background: var(--gold); top: -180px; left: -80px; }
  .vn-orb2 { width: 360px; height: 360px; background: #7b5ea7; bottom: -120px; right: -60px; }
  .vn-orb3 { width: 220px; height: 220px; background: #4a8ea7; top: 40%; left: 55%; opacity: 0.07; }

  /* ── FLOATING CARDS ─────────────────────────── */
  .vn-float-card {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 14px;
    padding: 12px 16px;
    z-index: 3;
    pointer-events: none;
    min-width: 160px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07);
  }
  .vn-fc-left  { left: clamp(16px, 5%, 80px); }
  .vn-fc-right { right: clamp(16px, 5%, 80px); }
  .vn-fc-1 { top: 28%; animation: floatCard1 5s ease-in-out infinite; }
  .vn-fc-2 { top: 22%; animation: floatCard2 6s ease-in-out infinite 0.8s; }
  .vn-fc-3 { top: 58%; animation: floatCard3 5.5s ease-in-out infinite 1.6s; }
  .vn-float-card.vn-fc-left  { animation-name: floatCard1; }
  .vn-float-card.vn-fc-right.vn-fc-2 { animation-name: floatCard2; }
  .vn-float-card.vn-fc-right.vn-fc-3 { animation-name: floatCard3; }

  .vn-fc-icon { font-size: 1.4rem; line-height: 1; flex-shrink: 0; }
  .vn-fc-text { display: flex; flex-direction: column; gap: 2px; }
  .vn-fc-val {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.95rem; font-weight: 600;
    color: var(--gold-light); line-height: 1.1;
  }
  .vn-fc-label {
    font-size: 10px; color: rgba(245,240,232,0.4);
    letter-spacing: 0.05em; text-transform: uppercase;
  }

  @keyframes floatCard1 {
    0%, 100% { transform: translateY(0px) rotate(-1deg); }
    50%       { transform: translateY(-10px) rotate(-1deg); }
  }
  @keyframes floatCard2 {
    0%, 100% { transform: translateY(0px) rotate(1.5deg); }
    50%       { transform: translateY(-8px) rotate(1.5deg); }
  }
  @keyframes floatCard3 {
    0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
    50%       { transform: translateY(-12px) rotate(-0.5deg); }
  }

  .vn-hero-inner {
    position: relative; z-index: 2;
    max-width: 640px; margin: 0 auto;
  }

  .vn-eyebrow {
    display: inline-flex; align-items: center; gap: 10px;
    font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 18px; font-weight: 400;
  }
  .vn-eyebrow-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: var(--gold); opacity: 0.6;
  }
  .vn-eyebrow-logo img, .vn-eyebrow-logo svg { width: 26px; height: 26px; }

  .vn-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.4rem, 5.5vw, 3.8rem);
    font-weight: 300;
    color: var(--white);
    margin-bottom: 14px;
    letter-spacing: 0.015em;
    line-height: 1.1;
    animation: fadeUp 0.65s 0.15s cubic-bezier(0.4,0,0.2,1) both;
  }
  .vn-hero-title em {
    font-style: italic;
    color: var(--gold-light);
    font-weight: 300;
  }

  .vn-hero-sub {
    font-size: 13.5px; color: rgba(245,240,232,0.48);
    margin-bottom: 32px; font-weight: 300; line-height: 1.6;
    animation: fadeUp 0.65s 0.25s cubic-bezier(0.4,0,0.2,1) both;
  }

  /* Search bar */
  .vn-search-bar {
    display: flex; align-items: center; gap: 10px;
    background: var(--white); border-radius: 12px;
    padding: 8px 8px 8px 18px;
    max-width: 540px; margin: 0 auto 16px;
    box-shadow: 0 16px 56px rgba(0,0,0,0.3), 0 0 0 1px rgba(201,168,76,0.08);
    transition: box-shadow 0.25s, transform 0.2s;
    animation: fadeUp 0.65s 0.3s cubic-bezier(0.4,0,0.2,1) both;
  }
  .vn-search-bar.focused {
    box-shadow: 0 16px 56px rgba(0,0,0,0.32), 0 0 0 2px var(--gold);
    transform: translateY(-1px);
  }
  .vn-search-icon { font-size: 20px; color: var(--muted); flex-shrink: 0; line-height: 1; }
  .vn-search-input {
    flex: 1; border: none; outline: none; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    color: var(--ink); padding: 5px 0;
  }
  .vn-search-input::placeholder { color: #bbb4a8; }
  .vn-search-clear {
    background: none; border: none; cursor: pointer;
    font-size: 11px; color: var(--muted); width: 30px; height: 30px;
    border-radius: 7px; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0;
    transition: background 0.2s, color 0.2s;
  }
  .vn-search-clear:hover { background: var(--cream); color: var(--ink); }

  /* Popular searches */
  .vn-popular {
    display: flex; align-items: center; flex-wrap: wrap;
    gap: 7px; justify-content: center; margin-bottom: 32px;
    animation: fadeUp 0.65s 0.38s cubic-bezier(0.4,0,0.2,1) both;
  }
  .vn-popular-label {
    font-size: 11px; color: rgba(245,240,232,0.35);
    letter-spacing: 0.05em; text-transform: uppercase; font-weight: 400;
  }
  .vn-popular-tag {
    font-size: 11.5px; color: rgba(245,240,232,0.55);
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; padding: 4px 12px;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .vn-popular-tag:hover {
    background: rgba(201,168,76,0.15);
    border-color: rgba(201,168,76,0.3);
    color: var(--gold-light);
  }

  /* Trust stats */
  .vn-trust-strip {
    display: flex; justify-content: center; gap: 0;
    border: 1px solid rgba(201,168,76,0.15);
    border-radius: 14px;
    overflow: hidden;
    background: rgba(255,255,255,0.04);
    max-width: 480px; margin: 0 auto;
    animation: fadeUp 0.65s 0.45s cubic-bezier(0.4,0,0.2,1) both;
  }
  .vn-trust-item {
    flex: 1; padding: 14px 8px;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    border-right: 1px solid rgba(201,168,76,0.1);
  }
  .vn-trust-item:last-child { border-right: none; }
  .vn-trust-val {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem; font-weight: 600; color: var(--gold-light);
    line-height: 1;
  }
  .vn-trust-label {
    font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(245,240,232,0.38); font-weight: 400;
  }

  /* ─── CATEGORY STRIP ─────────────────────────── */
  .vn-category-strip {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 66px; z-index: 9;
    box-shadow: 0 2px 12px rgba(14,12,10,0.05);
  }
  .vn-category-inner {
    max-width: 1160px; margin: 0 auto; padding: 0 32px;
    display: flex; gap: 2px;
    overflow-x: auto; scrollbar-width: none;
  }
  .vn-category-inner::-webkit-scrollbar { display: none; }
  .vn-cat-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 14px 15px;
    background: none; border: none; border-bottom: 2px solid transparent;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px;
    letter-spacing: 0.02em; color: var(--muted);
    cursor: pointer; transition: color 0.2s, border-color 0.2s;
    white-space: nowrap; margin-bottom: -1px; flex-shrink: 0;
  }
  .vn-cat-emoji { font-size: 14px; line-height: 1; }
  .vn-cat-count {
    font-size: 10px; background: var(--cream-dark);
    color: var(--muted); border-radius: 20px;
    padding: 1px 6px; font-weight: 400; line-height: 1.4;
  }
  /* Coming soon badge on category pill */
  .vn-cat-soon-badge {
    font-size: 9px; background: rgba(201,168,76,0.12);
    color: var(--gold); border: 1px solid rgba(201,168,76,0.25);
    border-radius: 20px; padding: 1px 6px;
    font-weight: 500; line-height: 1.4;
    letter-spacing: 0.04em;
  }
  .vn-cat-pill.vn-cat-soon { opacity: 0.7; }
  .vn-cat-pill:hover { color: var(--ink); opacity: 1; }
  .vn-cat-pill:hover .vn-cat-count { background: var(--gold-dim); color: var(--gold); }
  .vn-cat-pill.active {
    color: var(--ink); font-weight: 500;
    border-bottom-color: var(--gold);
    opacity: 1;
  }
  .vn-cat-pill.active .vn-cat-count { background: var(--gold-dim); color: var(--gold); }
  .vn-cat-pill.active .vn-cat-soon-badge {
    background: var(--gold-dim); color: var(--gold);
  }

  /* ─── TOOLBAR ────────────────────────────────── */
  .vn-toolbar {
    max-width: 1160px; margin: 0 auto;
    padding: 14px 32px;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 10px;
    border-bottom: 1px solid var(--border-soft);
    background: var(--surface);
  }
  .vn-toolbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .vn-result-text { font-size: 13px; color: var(--muted); }
  .vn-result-text strong { color: var(--ink); font-weight: 500; }
  .vn-result-text em { font-style: italic; color: var(--ink); }
  .vn-result-loading { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
  .vn-pulse {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--gold); animation: pulse 1.2s ease infinite;
  }
  .vn-clear-btn {
    font-size: 11.5px; color: var(--muted);
    background: none; border: 1px solid var(--border);
    border-radius: 20px; padding: 4px 12px; cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .vn-clear-btn:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }
  .vn-toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  /* Date button */
  .vn-date-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--border); border-radius: 8px;
    background: var(--white);
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted);
    cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .vn-date-btn:hover { border-color: var(--gold); color: var(--ink); }
  .vn-date-btn.vn-date-active {
    border-color: var(--gold);
    background: var(--gold-dim);
    color: var(--ink); font-weight: 500;
  }
  .vn-date-icon { font-size: 13px; line-height: 1; }
  .vn-date-clear-x {
    display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; border-radius: 50%;
    background: rgba(122,114,101,0.14); font-size: 9px;
    color: var(--muted); cursor: pointer; transition: background 0.2s;
    margin-left: 2px;
  }
  .vn-date-clear-x:hover { background: var(--red-soft); color: var(--red); }

  /* Price / sort */
  .vn-price-wrap {
    display: flex; align-items: center; gap: 8px;
    border: 1px solid var(--border); border-radius: 8px;
    padding: 7px 12px; background: var(--white);
    transition: border-color 0.2s;
  }
  .vn-price-wrap:focus-within { border-color: var(--gold); }
  .vn-price-label { font-size: 12px; color: var(--muted); white-space: nowrap; }
  .vn-price-input {
    border: none; outline: none; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    color: var(--ink); width: 68px;
  }
  .vn-price-input::placeholder { color: #bbb4a8; }
  .vn-price-input::-webkit-outer-spin-button,
  .vn-price-input::-webkit-inner-spin-button { -webkit-appearance: none; }
  .vn-price-input[type=number] { -moz-appearance: textfield; }
  .vn-sort-select {
    border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 30px 8px 12px; background: var(--white);
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    color: var(--ink); outline: none; cursor: pointer;
    transition: border-color 0.2s;
    appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M4.5 5L0 0h9z' fill='%237a7265'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 11px center;
  }
  .vn-sort-select:focus { border-color: var(--gold); }
  .vn-layout-toggle {
    display: flex; border: 1px solid var(--border);
    border-radius: 8px; overflow: hidden;
  }
  .vn-layout-btn {
    padding: 8px 12px; background: var(--white); border: none;
    cursor: pointer; font-size: 15px; color: var(--muted);
    transition: background 0.2s, color 0.2s; line-height: 1;
  }
  .vn-layout-btn + .vn-layout-btn { border-left: 1px solid var(--border); }
  .vn-layout-btn.active { background: var(--ink); color: var(--white); }
  .vn-layout-btn:hover:not(.active) { background: var(--surface); color: var(--ink); }

  /* ─── FILTER CHIPS ────────────────────────────── */
  .vn-filter-chips {
    max-width: 1160px; margin: 0 auto;
    padding: 10px 32px 0;
    display: flex; flex-wrap: wrap; gap: 7px;
  }
  .vn-chip {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--gold-dim); border: 1px solid rgba(201,168,76,0.25);
    border-radius: 20px; padding: 4px 8px 4px 12px;
    font-size: 12px; color: var(--ink); font-weight: 500;
  }
  .vn-chip button {
    width: 18px; height: 18px; border-radius: 50%;
    background: rgba(14,12,10,0.08); border: none;
    font-size: 9px; color: var(--muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; line-height: 1;
  }
  .vn-chip button:hover { background: var(--red-soft); color: var(--red); }

  /* ─── DATE BANNER ─────────────────────────────── */
  .vn-date-banner {
    max-width: 1160px; margin: 0 auto;
    padding: 10px 32px;
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    background: rgba(201,168,76,0.06);
    border-bottom: 1px solid rgba(201,168,76,0.18);
    font-size: 13px; color: var(--ink);
    animation: fadeIn 0.2s ease;
  }
  .vn-date-banner-icon { font-size: 1rem; }
  .vn-date-banner-clear {
    margin-left: auto; font-size: 12px; color: var(--muted);
    background: none; border: 1px solid var(--border);
    border-radius: 20px; padding: 3px 11px; cursor: pointer;
    transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .vn-date-banner-clear:hover { border-color: var(--gold); color: var(--gold); }

  /* ─── CONTENT ──────────────────────────────────── */
  .vn-content {
    max-width: 1160px; margin: 0 auto;
    padding: 28px 32px 72px;
  }
  .vn-grid.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
  }
  .vn-grid.list { display: flex; flex-direction: column; gap: 12px; }
  .vn-card-wrap { animation: fadeUp 0.42s cubic-bezier(0.4,0,0.2,1) both; }

  /* Skeletons */
  .vn-skeleton {
    height: 278px; border-radius: 14px;
    background: linear-gradient(90deg, #ede8e0 25%, #e5ddd3 50%, #ede8e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease infinite;
  }
  .vn-skeleton-list { height: 100px; }

  /* ─── COMING SOON STATE ──────────────────────── */
  .vn-coming-soon {
    position: relative;
    text-align: center;
    padding: 80px 20px 72px;
    animation: fadeUp 0.45s ease both;
    overflow: hidden;
  }
  .vn-cs-glow {
    position: absolute;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .vn-cs-icon {
    font-size: 3.2rem;
    display: block;
    margin-bottom: 20px;
    animation: floatY 3.5s ease-in-out infinite;
    filter: drop-shadow(0 8px 24px rgba(201,168,76,0.3));
  }
  .vn-cs-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--ink); color: var(--gold);
    font-size: 10px; font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase;
    padding: 6px 16px; border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.3);
    margin-bottom: 20px;
    position: relative;
  }
  .vn-cs-badge::before {
    content: '';
    display: inline-block;
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--gold);
    animation: pulse 1.5s ease infinite;
  }
  .vn-cs-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.9rem, 4vw, 2.8rem);
    font-weight: 300; color: var(--ink);
    margin-bottom: 14px; letter-spacing: 0.01em;
  }
  .vn-cs-sub {
    font-size: 14px; color: var(--muted); line-height: 1.7;
    margin-bottom: 36px; max-width: 420px;
    margin-left: auto; margin-right: auto;
  }
  .vn-cs-sub strong { color: var(--ink); font-weight: 500; }

  /* Notify email input */
  .vn-cs-notify {
    display: flex; align-items: center; gap: 0;
    max-width: 400px; margin: 0 auto 24px;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    background: var(--white);
    box-shadow: 0 4px 20px rgba(14,12,10,0.06);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .vn-cs-notify:focus-within {
    border-color: var(--gold);
    box-shadow: 0 4px 20px rgba(201,168,76,0.12);
  }
  .vn-cs-email {
    flex: 1; border: none; outline: none;
    padding: 13px 16px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px;
    color: var(--ink); background: transparent;
  }
  .vn-cs-email::placeholder { color: #bbb4a8; }
  .vn-cs-btn {
    padding: 13px 20px;
    background: var(--ink); color: var(--white);
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    font-weight: 500; white-space: nowrap;
    transition: background 0.22s;
    flex-shrink: 0;
  }
  .vn-cs-btn:hover { background: var(--gold); color: var(--ink); }

  .vn-cs-back {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12.5px; color: var(--muted);
    background: none; border: 1px solid var(--border);
    border-radius: 20px; padding: 7px 18px;
    cursor: pointer; margin-bottom: 28px;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .vn-cs-back:hover { border-color: var(--gold); color: var(--ink); background: var(--gold-dim); }

  .vn-cs-eta {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; color: var(--muted-light);
    letter-spacing: 0.05em;
  }
  .vn-cs-eta-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--gold); opacity: 0.5;
  }

  /* Empty state */
  .vn-empty {
    text-align: center; padding: 96px 20px 72px;
    animation: fadeUp 0.45s ease both;
  }
  .vn-empty-icon {
    font-size: 2.2rem; margin-bottom: 22px;
    color: var(--gold); display: block;
    animation: floatY 3s ease-in-out infinite;
  }
  .vn-empty h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 600;
    color: var(--ink); margin-bottom: 10px;
  }
  .vn-empty p {
    font-size: 13.5px; color: var(--muted); line-height: 1.7;
    margin-bottom: 26px; max-width: 400px;
    margin-left: auto; margin-right: auto;
  }
  .vn-empty-btn {
    padding: 12px 28px; background: var(--ink);
    color: var(--white); border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    font-weight: 500; cursor: pointer;
    transition: background 0.22s, transform 0.18s;
    margin-bottom: 36px;
  }
  .vn-empty-btn:hover { background: var(--gold); color: var(--ink); transform: translateY(-2px); }
  .vn-empty-suggest { margin-top: 12px; }
  .vn-empty-suggest-label {
    font-size: 11px; color: var(--muted-light); letter-spacing: 0.06em;
    text-transform: uppercase; margin-bottom: 10px; display: block;
  }
  .vn-empty-suggest-tags { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; }

  .vn-load-hint {
    text-align: center; font-size: 11.5px; color: var(--muted);
    margin-top: 40px; letter-spacing: 0.12em; text-transform: uppercase;
  }

  /* ─── WHY SECTION ──────────────────────────── */
  .vn-why-section {
    background: var(--white);
    border-top: 1px solid var(--border-soft);
    padding: 80px 32px;
  }
  .vn-why-inner { max-width: 1160px; margin: 0 auto; }
  .vn-why-header { text-align: center; margin-bottom: 52px; }
  .vn-why-eyebrow {
    display: inline-block; font-size: 10px;
    letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 14px; font-weight: 400;
  }
  .vn-why-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.7rem, 3vw, 2.4rem);
    font-weight: 300; color: var(--ink);
    margin-bottom: 12px; letter-spacing: 0.01em;
  }
  .vn-why-sub {
    font-size: 13.5px; color: var(--muted); max-width: 420px;
    margin: 0 auto; line-height: 1.65;
  }
  .vn-why-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
  }
  .vn-why-card {
    padding: 28px 24px; border-radius: 14px;
    border: 1px solid var(--border-soft);
    background: var(--surface);
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
  }
  .vn-why-card:hover {
    border-color: var(--border);
    box-shadow: 0 8px 32px rgba(14,12,10,0.07);
    transform: translateY(-3px);
  }
  .vn-why-icon { font-size: 1.6rem; display: block; margin-bottom: 14px; }
  .vn-why-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 600;
    color: var(--ink); margin-bottom: 8px;
  }
  .vn-why-card-desc {
    font-size: 12.5px; color: var(--muted); line-height: 1.65;
  }

  /* ─── DATE PICKER ───────────────────────────── */
  .dp-overlay {
    position: fixed; inset: 0;
    background: rgba(14,12,10,0.58);
    backdrop-filter: blur(7px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1500; padding: 20px;
    animation: fadeIn 0.18s ease both;
  }
  .dp-modal {
    position: relative; background: var(--white);
    border: 1px solid rgba(201,168,76,0.22);
    border-radius: 22px; padding: 30px 26px 24px;
    width: min(330px, 96vw);
    box-shadow: 0 28px 72px rgba(0,0,0,0.22);
    animation: popupUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both;
  }
  .dp-x-btn {
    position: absolute; top: 14px; right: 14px;
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--surface); border: 1px solid var(--border);
    font-size: 11px; color: var(--muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .dp-x-btn:hover { background: var(--ink); color: var(--white); border-color: var(--ink); }
  .dp-modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem; font-weight: 600; color: var(--ink);
    margin-bottom: 18px; text-align: center; padding-right: 26px;
  }
  .dp-nav {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 14px;
  }
  .dp-nav-btn {
    width: 32px; height: 32px; border-radius: 9px;
    background: var(--surface); border: 1px solid var(--border);
    font-size: 17px; color: var(--muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; line-height: 1;
  }
  .dp-nav-btn:hover { border-color: var(--gold); color: var(--gold); }
  .dp-month-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; font-weight: 600; color: var(--ink);
  }
  .dp-grid {
    display: grid; grid-template-columns: repeat(7, 1fr);
    gap: 3px; margin-bottom: 16px;
  }
  .dp-hdr {
    text-align: center; font-size: 9px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--muted); padding: 5px 0;
  }
  .dp-day {
    aspect-ratio: 1; border-radius: 9px; border: none;
    background: none; font-family: 'DM Sans', sans-serif;
    font-size: 12px; color: var(--ink); cursor: pointer;
    transition: all 0.15s;
    display: flex; align-items: center; justify-content: center;
    min-height: 33px;
  }
  .dp-day:hover:not(:disabled):not(.dp-selected) {
    background: var(--gold-dim); color: var(--ink);
  }
  .dp-day.dp-selected {
    background: var(--ink); color: var(--white); font-weight: 600;
    box-shadow: 0 3px 10px rgba(14,12,10,0.2);
  }
  .dp-day.dp-today {
    background: var(--gold-dim); color: var(--gold); font-weight: 600;
  }
  .dp-day.dp-past { opacity: 0.25; cursor: not-allowed; }
  .dp-footer { border-top: 1px solid var(--border); padding-top: 14px; }
  .dp-clear-btn {
    width: 100%; padding: 11px; border-radius: 10px;
    border: 1px solid rgba(184,92,92,0.22);
    background: var(--red-soft); color: var(--red);
    font-size: 13px; font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.2s;
  }
  .dp-clear-btn:hover { background: rgba(184,92,92,0.18); }
  .dp-cancel-btn {
    width: 100%; padding: 11px; border-radius: 10px;
    border: 1px solid var(--border); background: none;
    color: var(--muted); font-size: 13px;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.2s;
  }
  .dp-cancel-btn:hover { border-color: var(--gold); color: var(--ink); }

  /* ─── FOOTER CTA ────────────────────────────── */
  .vn-footer-cta {
    position: relative; overflow: hidden;
    text-align: center; padding: 96px 32px 72px;
    background: var(--ink-soft);
  }
  .vn-footer-orb {
    position: absolute; width: 600px; height: 600px;
    background: var(--gold); border-radius: 50%;
    filter: blur(140px); opacity: 0.065;
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    pointer-events: none;
  }
  .vn-footer-orb2 {
    width: 300px; height: 300px;
    background: #7b5ea7; opacity: 0.06;
    left: 15%; top: 20%; transform: none;
  }
  .vn-footer-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
    font-weight: 300; color: var(--cream);
    margin: 12px 0 14px; position: relative; z-index: 1;
    letter-spacing: 0.01em;
  }
  .vn-footer-sub {
    font-size: 13.5px; color: rgba(122,114,101,0.85);
    margin-bottom: 34px; max-width: 480px;
    margin-left: auto; margin-right: auto;
    position: relative; z-index: 1; line-height: 1.7;
  }
  .vn-footer-cta-btns {
    display: flex; align-items: center; justify-content: center; gap: 12px;
    flex-wrap: wrap; position: relative; z-index: 1; margin-bottom: 40px;
  }
  .vn-footer-btn {
    display: inline-block; padding: 13px 34px;
    background: var(--gold); color: var(--ink);
    text-decoration: none; border-radius: 8px;
    font-size: 13px; font-weight: 500;
    letter-spacing: 0.04em;
    transition: background 0.22s, transform 0.18s, box-shadow 0.22s;
  }
  .vn-footer-btn:hover {
    background: var(--gold-light); transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(201,168,76,0.3);
  }
  .vn-footer-btn-ghost {
    display: inline-block; padding: 13px 28px;
    background: transparent; color: rgba(245,240,232,0.55);
    text-decoration: none; border-radius: 8px;
    font-size: 13px; font-weight: 400;
    border: 1px solid rgba(245,240,232,0.15);
    transition: all 0.22s; cursor: pointer;
  }
  .vn-footer-btn-ghost:hover {
    border-color: rgba(201,168,76,0.4); color: var(--gold-light);
    background: rgba(201,168,76,0.05);
  }
  .vn-footer-logos {
    display: flex; align-items: center; justify-content: center;
    gap: 20px; flex-wrap: wrap; position: relative; z-index: 1;
  }
  .vn-footer-logos-label {
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(245,240,232,0.2);
  }
  .vn-footer-press {
    font-size: 11.5px; color: rgba(245,240,232,0.22);
    font-family: 'Cormorant Garamond', serif;
    letter-spacing: 0.04em; font-style: italic;
  }

  /* ─── RESPONSIVE ────────────────────────────── */
  @media (max-width: 1024px) {
    .vn-why-grid { grid-template-columns: repeat(2, 1fr); }
    .vn-float-card { display: none; }
  }
  @media (max-width: 960px) {
    .vn-grid.grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .vn-hero { padding: 92px 20px 52px; }
    .vn-trust-strip { max-width: 100%; }
    .vn-category-inner { padding: 0 16px; }
    .vn-toolbar { padding: 12px 16px; }
    .vn-filter-chips { padding: 8px 16px 0; }
    .vn-content { padding: 20px 16px 56px; }
    .vn-grid.grid { grid-template-columns: 1fr; gap: 14px; }
    .vn-toolbar-right { width: 100%; }
    .vn-footer-cta { padding: 68px 20px 56px; }
    .vn-layout-toggle { display: none; }
    .vn-date-banner { padding: 10px 16px; }
    .vn-why-section { padding: 56px 20px; }
    .vn-why-grid { grid-template-columns: 1fr; gap: 14px; }
    .vn-cs-notify { flex-direction: column; border-radius: 10px; }
    .vn-cs-email { text-align: center; }
    .vn-cs-btn { width: 100%; border-radius: 0 0 9px 9px; }
  }

  /* ─── KEYFRAMES ─────────────────────────────── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes popupUp {
    from { opacity: 0; transform: translateY(22px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1;   transform: scale(1);    }
    50%       { opacity: 0.4; transform: scale(0.85); }
  }
  @keyframes floatY {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(-8px); }
  }
  .vn-hiw-section .vn-why-eyebrow { color: rgba(201,168,76,0.7); }
  .vn-hiw-section .vn-why-title { color: var(--cream); }
  .vn-hiw-section .vn-why-sub { color: rgba(245,240,232,0.4); }

  /* ─── HOW IT WORKS ──────────────────────────── */
  .vn-hiw-section {
    background: var(--ink);
    padding: 88px 32px 80px;
    scroll-margin-top: 80px;
  }
  .vn-hiw-inner { max-width: 1160px; margin: 0 auto; }
  .vn-hiw-header { text-align: center; margin-bottom: 52px; }
  .vn-hiw-label {
    text-align: center; font-size: 10px;
    letter-spacing: 0.24em; text-transform: uppercase;
    color: rgba(201,168,76,0.55); margin-bottom: 22px;
    font-weight: 400;
  }
  .vn-hiw-steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    margin-bottom: 60px;
    position: relative;
  }
  .vn-hiw-card {
    padding: 28px 22px 28px;
    border: 1px solid rgba(201,168,76,0.1);
    border-right: none;
    background: rgba(255,255,255,0.025);
    position: relative;
    transition: background 0.25s, border-color 0.25s;
    animation: fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both;
  }
  .vn-hiw-card:last-child { border-right: 1px solid rgba(201,168,76,0.1); }
  .vn-hiw-card:hover { background: rgba(201,168,76,0.05); }
  .vn-hiw-card--vendor {
    background: rgba(255,255,255,0.018);
    border-color: rgba(122,114,101,0.15);
  }
  .vn-hiw-card--vendor:last-child { border-right: 1px solid rgba(122,114,101,0.15); }
  .vn-hiw-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.8rem; font-weight: 300; line-height: 1;
    color: rgba(201,168,76,0.18); margin-bottom: 10px;
    letter-spacing: -0.02em;
  }
  .vn-hiw-num--vendor { color: rgba(122,114,101,0.2); }
  .vn-hiw-icon { font-size: 1.5rem; display: block; margin-bottom: 12px; }
  .vn-hiw-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; font-weight: 600;
    color: var(--cream); margin-bottom: 10px;
    letter-spacing: 0.01em;
  }
  .vn-hiw-desc {
    font-size: 12.5px; color: rgba(245,240,232,0.42);
    line-height: 1.68;
  }
  .vn-hiw-arrow {
    position: absolute; right: -14px; top: 36px;
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--ink);
    border: 1px solid rgba(201,168,76,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; color: var(--gold); z-index: 2;
    pointer-events: none;
  }

  .vn-hiw-divider {
    display: flex; align-items: center; gap: 16px;
    margin: 0 0 36px;
  }
  .vn-hiw-divider::before,
  .vn-hiw-divider::after {
    content: ''; flex: 1;
    height: 1px; background: rgba(201,168,76,0.1);
  }
  .vn-hiw-divider-label {
    font-size: 11px; letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(201,168,76,0.4); white-space: nowrap;
  }

  /* FAQ */
  .vn-hiw-faq {
    margin-top: 64px;
    border-top: 1px solid rgba(201,168,76,0.1);
    padding-top: 52px;
  }
  .vn-hiw-faq-header { text-align: center; margin-bottom: 36px; }
  .vn-hiw-faq-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem; font-weight: 300;
    color: var(--cream); letter-spacing: 0.01em;
  }
  .vn-hiw-faq-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 0 32px;
  }
  .vn-faq-item {
    border-bottom: 1px solid rgba(201,168,76,0.08);
    overflow: hidden;
  }
  .vn-faq-q {
    width: 100%; background: none; border: none;
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; padding: 18px 0;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px;
    color: rgba(245,240,232,0.75); font-weight: 400;
    cursor: pointer; text-align: left;
    transition: color 0.2s; line-height: 1.5;
  }
  .vn-faq-q:hover { color: var(--cream); }
  .vn-faq-item.open .vn-faq-q { color: var(--gold-light); }
  .vn-faq-chevron {
    flex-shrink: 0; width: 22px; height: 22px;
    border: 1px solid rgba(201,168,76,0.2); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: var(--gold); margin-top: 1px;
    transition: background 0.2s;
  }
  .vn-faq-item.open .vn-faq-chevron { background: rgba(201,168,76,0.1); }
  .vn-faq-a {
    font-size: 12.5px; color: rgba(245,240,232,0.42);
    line-height: 1.7; padding: 0 28px 18px 0;
    animation: fadeUp 0.2s ease both;
  }

  /* How it works responsive */
  @media (max-width: 900px) {
    .vn-hiw-steps { grid-template-columns: repeat(2, 1fr); }
    .vn-hiw-card { border-right: 1px solid rgba(201,168,76,0.1); }
    .vn-hiw-card:nth-child(odd) { border-right: none; }
    .vn-hiw-card--vendor { border-color: rgba(122,114,101,0.15); }
    .vn-hiw-arrow { display: none; }
    .vn-hiw-faq-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .vn-hiw-section { padding: 60px 20px; }
    .vn-hiw-steps { grid-template-columns: 1fr; }
    .vn-hiw-card { border-right: 1px solid rgba(201,168,76,0.1) !important; border-bottom: none; }
    .vn-hiw-card:last-child { border-bottom: 1px solid rgba(201,168,76,0.1); }
  }
`;