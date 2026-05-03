import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";

const SERVICE_TYPES = [
  { value: "decor",       label: "Decor",       emoji: "🎨", available: true  },
  { value: "photography", label: "Photography", emoji: "📸", available: true  },
  { value: "catering",    label: "Catering",    emoji: "🍽️", available: false },
  { value: "music",       label: "Music & DJ",  emoji: "🎵", available: false },
  { value: "florals",     label: "Florals",     emoji: "💐", available: false },
  { value: "venues",      label: "Venues",      emoji: "🏛️", available: false },
];

const TIER_LABELS = ["Basic", "Standard", "Premium", "Ultra Premium"];

const TIME_SLOTS = [
  "Morning (8AM – 12PM)",
  "Afternoon (12PM – 4PM)",
  "Evening (4PM – 8PM)",
  "Full Day (8AM – 8PM)",
  "Custom",
];

const INDIAN_CITIES = [
  "Agra", "Ahmedabad", "Ajmer", "Aligarh", "Allahabad", "Alwar", "Ambala",
  "Amritsar", "Asansol", "Aurangabad", "Bangalore", "Bareilly", "Bhopal",
  "Bhubaneswar", "Bikaner", "Chandigarh", "Chennai", "Coimbatore", "Dehradun",
  "Delhi", "Dhanbad", "Durgapur", "Faridabad", "Ghaziabad", "Gorakhpur",
  "Gurgaon", "Guwahati", "Gwalior", "Howrah", "Hubli", "Hyderabad",
  "Indore", "Jabalpur", "Jaipur", "Jalandhar", "Jammu", "Jamshedpur",
  "Jodhpur", "Kanpur", "Kochi", "Kolkata", "Kozhikode", "Lucknow",
  "Ludhiana", "Madurai", "Mangalore", "Meerut", "Mumbai", "Mysore",
  "Nagpur", "Nashik", "Navi Mumbai", "Noida", "Patna", "Pune",
  "Raipur", "Rajkot", "Ranchi", "Siliguri", "Solapur", "Srinagar",
  "Surat", "Thane", "Thiruvananthapuram", "Tiruchirappalli", "Udaipur",
  "Vadodara", "Varanasi", "Vijayawada", "Visakhapatnam", "Warangal",
];

export default function AddService() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    serviceType: "decor",
    title: "",
    description: "",
    locations: [],
  });

  // ── City Toast Popup state ────────────────────────────────────
  const [showCityToast,    setShowCityToast]    = useState(false);
  const [citySearchInput,  setCitySearchInput]  = useState("");
  const [filteredCities,   setFilteredCities]   = useState(INDIAN_CITIES);
  const citySearchRef = useRef(null);

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [customSlot,    setCustomSlot]    = useState("");
  const [decorPrice,    setDecorPrice]    = useState("");

  const [packages,      setPackages]      = useState([{ name: "Basic", price: "", features: [""] }]);
  const [images,        setImages]        = useState([]);
  const [previews,      setPreviews]      = useState([]);
  const [activePreview, setActivePreview] = useState(null);
  const [dragging,      setDragging]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isDecor      = form.serviceType === "decor";
  const isComingSoon = !SERVICE_TYPES.find((t) => t.value === form.serviceType)?.available;

  // ── City search filter ────────────────────────────────────────
  useEffect(() => {
    const val = citySearchInput.trim().toLowerCase();
    if (!val) {
      setFilteredCities(INDIAN_CITIES.filter((c) => !form.locations.includes(c)));
      return;
    }
    setFilteredCities(
      INDIAN_CITIES.filter(
        (c) => c.toLowerCase().includes(val) && !form.locations.includes(c)
      )
    );
  }, [citySearchInput, form.locations]);

  // Focus search when toast opens
  useEffect(() => {
    if (showCityToast) {
      setTimeout(() => citySearchRef.current?.focus(), 80);
    } else {
      setCitySearchInput("");
    }
  }, [showCityToast]);

  // Close toast on ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setShowCityToast(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Prevent body scroll when toast open
  useEffect(() => {
    document.body.style.overflow = showCityToast ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showCityToast]);

  // ── Location helpers ──────────────────────────────────────────
  const addLocation = (city) => {
    if (!city || form.locations.includes(city) || form.locations.length >= 8) return;
    setForm((f) => ({ ...f, locations: [...f.locations, city] }));
  };

  const removeLocation = (loc) =>
    setForm((f) => ({ ...f, locations: f.locations.filter((l) => l !== loc) }));

  // ── Time Slot helpers ─────────────────────────────────────────
  const toggleSlot = (slot) =>
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );

  // ── Package helpers ───────────────────────────────────────────
  const addPackage    = () => { if (packages.length >= 4) return; setPackages([...packages, { name: TIER_LABELS[packages.length] || "", price: "", features: [""] }]); };
  const removePackage = (i) => setPackages(packages.filter((_, idx) => idx !== i));
  const updatePackage = (i, field, val) => { const u = [...packages]; u[i][field] = val; setPackages(u); };
  const addFeature    = (pi) => { const u = [...packages]; u[pi].features.push(""); setPackages(u); };
  const removeFeature = (pi, fi) => { const u = [...packages]; u[pi].features.splice(fi, 1); setPackages(u); };
  const updateFeature = (pi, fi, val) => { const u = [...packages]; u[pi].features[fi] = val; setPackages(u); };

  // ── Image helpers ─────────────────────────────────────────────
  const addImages = (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 15 - images.length);
    if (!valid.length) return;
    const newPreviews = valid.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...valid]);
    setPreviews((prev) => {
      const updated = [...prev, ...newPreviews];
      if (!activePreview) setActivePreview(updated[0]);
      return updated;
    });
  };

  const removeImage = (i) => {
    URL.revokeObjectURL(previews[i]);
    const newPreviews = previews.filter((_, idx) => idx !== i);
    const newImages   = images.filter((_, idx) => idx !== i);
    setPreviews(newPreviews);
    setImages(newImages);
    if (activePreview === previews[i]) setActivePreview(newPreviews[0] || null);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); addImages(e.dataTransfer.files); };

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    if (!form.title.trim())          return "Please enter a service title.";
    if (!form.description.trim())    return "Please add a description.";
    if (form.locations.length === 0) return "Please add at least one location.";
    if (images.length === 0)         return "Please upload at least 1 image.";
    if (isDecor) {
      if (selectedSlots.length === 0) return "Please select at least one time slot.";
      if (selectedSlots.includes("Custom") && !customSlot.trim()) return "Please describe your custom time slot.";
      if (!decorPrice) return "Please enter a price for your decor service.";
    } else {
      if (packages.length === 0) return "Add at least one package.";
      for (let i = 0; i < packages.length; i++)
        if (!packages[i].price) return `Please enter price for ${packages[i].name}`;
    }
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(""); setSaving(true);
    const token = localStorage.getItem("token");
    const data  = new FormData();
    data.append("serviceType",  form.serviceType);
    data.append("title",        form.title);
    data.append("description",  form.description);
    data.append("locations",    JSON.stringify(form.locations));
    if (isDecor) {
      const slots = selectedSlots.map((s) => (s === "Custom" ? customSlot : s));
      data.append("timeSlots", JSON.stringify(slots));
      data.append("price",     decorPrice);
    } else {
      data.append("packages", JSON.stringify(packages));
    }
    images.forEach((img) => data.append("images", img));
    try {
      await API.post("/vendors/add", data, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(true);
    } catch (e) {
      console.error("Add error:", e.response?.data);
      // 403 = vendor profile not yet approved by admin
      if (e.response?.status === 403) {
        setError(e.response.data?.error || "Your vendor profile is not yet approved. Please wait for admin verification before adding services.");
      } else {
        setError(e.response?.data?.error || "Failed to publish service. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => navigate(-1);
  const selectedType = SERVICE_TYPES.find((t) => t.value === form.serviceType);

  const previewPrice = isDecor
    ? (decorPrice ? `₹${Number(decorPrice).toLocaleString()}` : "₹ —")
    : (packages[0]?.price ? `₹${Number(packages[0].price).toLocaleString()}` : "₹ —");

  return (
    <>
      <style>{styles}</style>
      <div className="as-root">
        <Navbar />
        <div className="as-body">

          {/* ── CITY PICKER TOAST MODAL ── */}
          {showCityToast && (
            <div className="as-city-overlay" onClick={(e) => e.target === e.currentTarget && setShowCityToast(false)}>
              <div className="as-city-toast">
                <div className="as-city-toast-header">
                  <div>
                    <p className="as-city-toast-eyebrow">🇮🇳 Indian Cities</p>
                    <h3 className="as-city-toast-title">Select Locations</h3>
                  </div>
                  <button className="as-city-toast-close" onClick={() => setShowCityToast(false)}>×</button>
                </div>

                {form.locations.length > 0 && (
                  <div className="as-city-toast-selected">
                    <p className="as-city-toast-selected-label">Selected ({form.locations.length}/8)</p>
                    <div className="as-city-toast-tags">
                      {form.locations.map((loc) => (
                        <span key={loc} className="as-city-toast-tag">
                          <span className="as-city-toast-tag-dot">◉</span>
                          {loc}
                          <button
                            type="button"
                            className="as-city-toast-tag-remove"
                            onClick={() => removeLocation(loc)}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="as-city-toast-search-wrap">
                  <span className="as-city-toast-search-icon">⌕</span>
                  <input
                    ref={citySearchRef}
                    className="as-city-toast-search"
                    placeholder="Search city e.g. Delhi, Mumbai…"
                    value={citySearchInput}
                    onChange={(e) => setCitySearchInput(e.target.value)}
                  />
                  {citySearchInput && (
                    <button
                      type="button"
                      className="as-city-toast-search-clear"
                      onClick={() => setCitySearchInput("")}
                    >×</button>
                  )}
                </div>

                <div className="as-city-toast-list">
                  {filteredCities.length === 0 ? (
                    <div className="as-city-toast-empty">
                      <span>🔍</span>
                      <span>No matching city found</span>
                    </div>
                  ) : (
                    filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        className={`as-city-toast-item ${form.locations.includes(city) ? "selected" : ""} ${form.locations.length >= 8 && !form.locations.includes(city) ? "disabled" : ""}`}
                        onClick={() => {
                          if (form.locations.includes(city)) {
                            removeLocation(city);
                          } else if (form.locations.length < 8) {
                            addLocation(city);
                          }
                        }}
                        disabled={form.locations.length >= 8 && !form.locations.includes(city)}
                      >
                        <span className="as-city-toast-item-dot">◉</span>
                        <span className="as-city-toast-item-name">{city}</span>
                        {form.locations.includes(city) && (
                          <span className="as-city-toast-item-check">✓</span>
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="as-city-toast-footer">
                  {form.locations.length >= 8 && (
                    <p className="as-city-toast-max-note">Maximum 8 locations reached</p>
                  )}
                  <button
                    className="as-city-toast-done"
                    onClick={() => setShowCityToast(false)}
                  >
                    Done — {form.locations.length} {form.locations.length === 1 ? "city" : "cities"} selected →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SUCCESS MODAL — Service is live (vendor already approved) ── */}
          {success && (
            <div className="as-modal-overlay" onClick={(e) => e.target === e.currentTarget && navigate("/")}>
              <div className="as-modal">
                <div className="as-modal-orb" />
                <div className="as-modal-orb as-modal-orb-2" />
                <div className="as-modal-icon-ring">
                  <div className="as-modal-icon-inner">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M8 16.5l5.5 5.5 10.5-11"
                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="as-modal-ring-pulse" />
                </div>
                <div className="as-modal-tag as-modal-tag-live">Service Published</div>
                <h2 className="as-modal-heading">You're Live! 🎉</h2>
                <p className="as-modal-subtext">
                  Your service is now visible to clients on the platform. Customers can discover and book it right away.
                </p>
                <div className="as-modal-live-card">
                  <div className="as-modal-live-row">
                    <span className="as-modal-live-dot as-modal-live-dot-green" />
                    <span className="as-modal-live-label">Visible to clients</span>
                    <span className="as-modal-live-check">✓</span>
                  </div>
                  <div className="as-modal-live-row">
                    <span className="as-modal-live-dot as-modal-live-dot-green" />
                    <span className="as-modal-live-label">Accepting bookings</span>
                    <span className="as-modal-live-check">✓</span>
                  </div>
                  <div className="as-modal-live-row">
                    <span className="as-modal-live-dot as-modal-live-dot-green" />
                    <span className="as-modal-live-label">Confirmation email sent to you</span>
                    <span className="as-modal-live-check">✓</span>
                  </div>
                </div>
                <div className="as-modal-notice">
                  <span className="as-modal-notice-icon">💡</span>
                  <span>You can manage or edit this service from your dashboard at any time.</span>
                </div>
                <div className="as-modal-actions">
                  <button className="as-modal-btn-primary" onClick={() => navigate("/")}>
                    Go to Dashboard →
                  </button>
                  <button
                    className="as-modal-btn-ghost"
                    onClick={() => {
                      setSuccess(false);
                      setForm({ serviceType: "decor", title: "", description: "", locations: [] });
                      setPackages([{ name: "Basic", price: "", features: [""] }]);
                      setSelectedSlots([]); setCustomSlot(""); setDecorPrice("");
                      setImages([]); setPreviews([]); setActivePreview(null);
                    }}
                  >
                    Add Another Service
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={`as-layout ${isComingSoon ? "as-layout-full" : ""}`}>
            <div className={isComingSoon ? "as-coming-soon-layout" : "as-form-col"}>

              {/* ── HEADER ── */}
              <div className="as-form-header">
                <button className="as-back" onClick={goBack}>← Back to Dashboard</button>
                <p className="as-eyebrow"><Logo /> Vendor Portal</p>
                <h1 className="as-title">Add New Service</h1>
                <p className="as-subtitle">Fill in your listing details. Your service goes live immediately on the platform.</p>
              </div>

              {/* ── SERVICE TYPE ── */}
              <div className="as-field">
                <label className="as-label">Service Category</label>
                <div className="as-type-grid">
                  {SERVICE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      className={`as-type-btn ${form.serviceType === t.value ? "active" : ""} ${!t.available ? "as-type-btn-soon" : ""}`}
                      onClick={() => set("serviceType", t.value)}
                    >
                      <span className="as-type-emoji">{t.emoji}</span>
                      <span className="as-type-label">{t.label}</span>
                      {!t.available && <span className="as-type-soon-tag">Soon</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── COMING SOON PANEL ── */}
              {isComingSoon && (
                <div className="as-cs-panel">
                  <div className="as-cs-orb" />
                  <div className="as-cs-orb as-cs-orb-2" />
                  <div className="as-cs-content">
                    <div className="as-cs-icon-wrap">
                      <span className="as-cs-emoji">{selectedType?.emoji}</span>
                    </div>
                    <div className="as-cs-tag">Under Development</div>
                    <h2 className="as-cs-heading">{selectedType?.label}</h2>
                    <p className="as-cs-text">
                      We're crafting a premium listing experience for{" "}
                      <strong>{selectedType?.label}</strong> vendors. This category
                      will be available soon — check back shortly.
                    </p>
                    <div className="as-cs-divider">
                      <span /><span className="as-cs-divider-dot"><Logo /></span><span />
                    </div>
                    <div className="as-cs-steps">
                      <div className="as-cs-step as-cs-step-done">
                        <span className="as-cs-step-icon">✓</span><span>Decor listings live</span>
                      </div>
                      <div className="as-cs-step as-cs-step-done">
                        <span className="as-cs-step-icon">✓</span><span>Photography listings live</span>
                      </div>
                      <div className="as-cs-step as-cs-step-next">
                        <span className="as-cs-step-icon as-cs-pulse">◎</span>
                        <span>{selectedType?.label} — coming next</span>
                      </div>
                    </div>
                    <button className="as-cs-back-btn" onClick={() => set("serviceType", "decor")}>
                      ← Switch to an available category
                    </button>
                  </div>
                </div>
              )}

              {/* ── NORMAL FORM ── */}
              {!isComingSoon && (
                <>
                  {/* TITLE */}
                  <div className="as-field">
                    <label className="as-label">Service Title</label>
                    <div className="as-input-wrap">
                      <span className="as-icon">◈</span>
                      <input
                        placeholder={`e.g. Premium ${selectedType?.label} for Weddings`}
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="as-field">
                    <label className="as-label">Description</label>
                    <div className="as-textarea-wrap">
                      <textarea
                        placeholder="Describe what makes your service special…"
                        value={form.description}
                        rows={4}
                        onChange={(e) => set("description", e.target.value)}
                      />
                    </div>
                    <span className="as-char-count">{form.description.length} / 500</span>
                  </div>

                  {/* ── LOCATION — TOAST TRIGGER ── */}
                  <div className="as-field">
                    <label className="as-label">
                      Location
                      <span className="as-label-sub"> — select from Indian cities (up to 8)</span>
                    </label>

                    {/* Selected city tags */}
                    {form.locations.length > 0 && (
                      <div className="as-loc-tags">
                        {form.locations.map((loc) => (
                          <span key={loc} className="as-loc-tag">
                            <span className="as-loc-tag-dot">◉</span>
                            {loc}
                            <button
                              type="button"
                              className="as-loc-tag-remove"
                              onClick={() => removeLocation(loc)}
                              title={`Remove ${loc}`}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Toast trigger button */}
                    <button
                      type="button"
                      className={`as-loc-trigger ${form.locations.length >= 8 ? "as-loc-trigger-full" : ""}`}
                      onClick={() => form.locations.length < 8 && setShowCityToast(true)}
                      disabled={form.locations.length >= 8}
                    >
                      <span className="as-loc-trigger-icon">◉</span>
                      <span className="as-loc-trigger-text">
                        {form.locations.length === 0
                          ? "Select cities…"
                          : form.locations.length >= 8
                          ? "Maximum 8 cities reached"
                          : `Add more cities (${form.locations.length}/8)`}
                      </span>
                      {form.locations.length < 8 && (
                        <span className="as-loc-trigger-arrow">＋</span>
                      )}
                    </button>

                    {form.locations.length > 0 && form.locations.length < 8 && (
                      <p className="as-loc-hint">
                        Tap the button above to add more cities · click × on a tag to remove
                      </p>
                    )}
                  </div>

                  {/* ── DECOR: TIME SLOTS + PRICE ── */}
                  {isDecor && (
                    <div className="as-field">
                      <label className="as-label">
                        Availability & Pricing
                        <span className="as-label-sub"> — select your time slots</span>
                      </label>
                      <div className="as-slot-grid">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            className={`as-slot-btn ${selectedSlots.includes(slot) ? "as-slot-btn-active" : ""}`}
                            onClick={() => toggleSlot(slot)}
                          >
                            <span className="as-slot-check">{selectedSlots.includes(slot) ? "✓" : ""}</span>
                            <span className="as-slot-label">{slot}</span>
                          </button>
                        ))}
                      </div>

                      {selectedSlots.includes("Custom") && (
                        <div className="as-input-wrap" style={{ marginTop: 10 }}>
                          <span className="as-icon">✦</span>
                          <input
                            placeholder="Describe your custom time slot…"
                            value={customSlot}
                            onChange={(e) => setCustomSlot(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="as-slot-price-row">
                        <label className="as-slot-price-label">Service Price</label>
                        <div className="as-input-wrap" style={{ flex: 1 }}>
                          <span className="as-icon" style={{ fontSize: 11 }}>₹</span>
                          <input
                            type="number"
                            placeholder="Enter your price"
                            value={decorPrice}
                            onChange={(e) => setDecorPrice(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── NON-DECOR: PACKAGES ── */}
                  {!isDecor && (
                    <div className="as-field">
                      <label className="as-label">Packages</label>
                      {packages.map((pkg, index) => (
                        <div key={index} className="as-pkg-card">
                          <div className="as-pkg-card-header">
                            <span className="as-pkg-tier">{TIER_LABELS[index] || `Package ${index + 1}`}</span>
                            {index > 0 && (
                              <button type="button" className="as-pkg-remove" onClick={() => removePackage(index)}>×</button>
                            )}
                          </div>
                          <div className="as-pkg-row">
                            <div className="as-input-wrap">
                              <input
                                placeholder="Package name"
                                value={pkg.name}
                                onChange={(e) => updatePackage(index, "name", e.target.value)}
                              />
                            </div>
                            <div className="as-input-wrap">
                              <span className="as-icon" style={{ fontSize: 11 }}>₹</span>
                              <input
                                type="number"
                                placeholder="Price"
                                value={pkg.price}
                                onChange={(e) => updatePackage(index, "price", e.target.value)}
                              />
                            </div>
                          </div>
                          <p className="as-pkg-features-label">Features included</p>
                          {pkg.features.map((f, fi) => (
                            <div key={fi} className="as-pkg-feature-row">
                              <span className="as-pkg-dot" />
                              <div className="as-input-wrap" style={{ flex: 1 }}>
                                <input
                                  placeholder="e.g. 3 hours shoot, HD delivery…"
                                  value={f}
                                  onChange={(e) => updateFeature(index, fi, e.target.value)}
                                />
                              </div>
                              {pkg.features.length > 1 && (
                                <button type="button" className="as-pkg-remove-feat" onClick={() => removeFeature(index, fi)}>×</button>
                              )}
                            </div>
                          ))}
                          <button type="button" className="as-add-feat-btn" onClick={() => addFeature(index)}>
                            + Add feature
                          </button>
                        </div>
                      ))}
                      {packages.length < 4 && (
                        <button type="button" onClick={addPackage} className="as-add-pkg-btn">
                          + Add Package
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── PORTFOLIO IMAGES ── */}
                  <div className="as-field">
                    <label className="as-label">
                      Portfolio Images<span className="as-label-sub"> (up to 15 photos)</span>
                    </label>

                    {previews.length > 0 && (
                      <div className="as-img-grid">
                        {previews.map((url, i) => (
                          <div
                            key={i}
                            className={`as-img-thumb ${activePreview === url ? "as-img-thumb-active" : ""}`}
                            onClick={() => setActivePreview(url)}
                          >
                            <img src={url} alt={`preview-${i}`} />
                            <button
                              className="as-img-remove"
                              onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                              title="Remove image"
                            >×</button>
                            {i === 0 && <span className="as-img-cover-badge">Cover</span>}
                          </div>
                        ))}
                        {previews.length < 15 && (
                          <label className="as-img-add-tile">
                            <span className="as-img-add-icon">+</span>
                            <span className="as-img-add-text">Add more</span>
                            <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => addImages(e.target.files)} />
                          </label>
                        )}
                      </div>
                    )}

                    {previews.length > 0 && (
                      <p className="as-img-hint">
                        First image is used as the cover photo on your listing card.
                        <span className="as-img-count"> {previews.length}/15 uploaded</span>
                      </p>
                    )}

                    {previews.length === 0 && (
                      <div
                        className={`as-upload-zone ${dragging ? "dragging" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                      >
                        <div className="as-upload-icon-wrap">
                          <span className="as-upload-icon">⊕</span>
                        </div>
                        <p className="as-upload-title">Drag & drop your portfolio images</p>
                        <p className="as-upload-sub">JPG, PNG, WEBP — up to 15 photos</p>
                        <label className="as-upload-label">
                          Browse Files
                          <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => addImages(e.target.files)} />
                        </label>
                      </div>
                    )}

                    {previews.length > 0 && previews.length < 15 && (
                      <div
                        className={`as-upload-zone as-upload-zone-compact ${dragging ? "dragging" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                      >
                        <span className="as-upload-icon" style={{ fontSize: "1.3rem" }}>⊕</span>
                        <p className="as-upload-sub">Drop more images or</p>
                        <label className="as-upload-label as-upload-label-sm">
                          Browse Files
                          <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => addImages(e.target.files)} />
                        </label>
                      </div>
                    )}
                  </div>

                  {error && <div className="as-error">⚠ {error}</div>}

                  {/* ACTIONS */}
                  <div className="as-actions">
                    <button className="as-btn-ghost-full" onClick={goBack} disabled={saving}>Cancel</button>
                    <button
                      className={`as-submit ${saving ? "loading" : ""}`}
                      onClick={handleSubmit}
                      disabled={saving}
                    >
                      {saving ? <><span className="as-spinner" /> Publishing…</> : "Publish Service →"}
                    </button>
                  </div>

                  <p className="as-terms">
                    By publishing you agree to our{" "}
                    <a href="#" className="as-link">Vendor Terms</a> and{" "}
                    <a href="#" className="as-link">Content Policy</a>.
                  </p>
                </>
              )}
            </div>

            {/* ── RIGHT COLUMN — LIVE PREVIEW ── */}
            {!isComingSoon && (
              <div className="as-preview-col">
                <div className="as-preview-sticky">
                  <p className="as-preview-label"> Live Preview</p>
                  <div className="as-preview-card">
                    <div className="as-preview-img">
                      {activePreview ? (
                        <img src={activePreview} alt="preview" />
                      ) : (
                        <div className="as-preview-placeholder">
                          <span>{selectedType?.emoji}</span>
                          <p>No image selected</p>
                        </div>
                      )}
                      <span className="as-preview-badge">{selectedType?.label}</span>
                      {previews.length > 1 && (
                        <span className="as-preview-count">{previews.length} photos</span>
                      )}
                    </div>
                    <div className="as-preview-body">
                      <h3 className="as-preview-title">{form.title || "Your Service Title"}</h3>

                      {form.locations.length > 0 ? (
                        <div className="as-preview-loc-wrap">
                          {form.locations.map((loc) => (
                            <span key={loc} className="as-preview-loc-pill">◉ {loc}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="as-preview-loc">◉ Location</p>
                      )}

                      <p className="as-preview-desc">{form.description || "Your service description will appear here…"}</p>

                      {isDecor && selectedSlots.length > 0 && (
                        <div className="as-preview-slots">
                          <span className="as-preview-slots-label">Available Slots</span>
                          <div className="as-preview-slots-list">
                            {selectedSlots.map((s) => (
                              <span key={s} className="as-preview-slot-pill">
                                {s === "Custom" && customSlot ? customSlot : s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isDecor && packages.length > 0 && (
                        <div className="as-preview-pkgs">
                          {packages.map((pkg, i) => (
                            <div key={i} className="as-preview-pkg-pill">
                              <span className="as-preview-pkg-name">{pkg.name || TIER_LABELS[i]}</span>
                              <span className="as-preview-pkg-price">
                                {pkg.price ? `₹${Number(pkg.price).toLocaleString()}` : "₹ —"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="as-preview-footer">
                        <div>
                          <span className="as-preview-from">Starting at</span>
                          <span className="as-preview-price">{previewPrice}</span>
                        </div>
                        <span className="as-preview-btn">View →</span>
                      </div>
                    </div>
                  </div>

                  {previews.length > 1 && (
                    <div className="as-preview-strip">
                      {previews.slice(0, 5).map((url, i) => (
                        <div
                          key={i}
                          className={`as-strip-thumb ${activePreview === url ? "active" : ""}`}
                          onClick={() => setActivePreview(url)}
                        >
                          <img src={url} alt="" />
                        </div>
                      ))}
                      {previews.length > 5 && (
                        <div className="as-strip-more">+{previews.length - 5}</div>
                      )}
                    </div>
                  )}
                  <p className="as-preview-note">This is how clients will see your listing.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --muted: #7a7265; --border: rgba(201,168,76,0.2); --surface: #faf7f2; --white: #ffffff;
  }

  .as-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }
  .as-body { width: 100%; max-width: 1200px; margin: 0 auto; padding: 48px 32px 80px; }

  /* ── LAYOUT ── */
  .as-layout { display: grid; grid-template-columns: 1fr 380px; gap: 48px; align-items: start; }
  .as-layout-full { grid-template-columns: 1fr; }

  @media (max-width: 1024px) {
    .as-layout { grid-template-columns: 1fr 320px; gap: 32px; }
    .as-body { padding: 36px 24px 70px; }
  }
  @media (max-width: 768px) {
    .as-layout { grid-template-columns: 1fr; gap: 0; }
    .as-body { padding: 24px 16px 60px; }
    .as-preview-col { order: -1; margin-bottom: 28px; }
  }
  @media (max-width: 480px) {
    .as-body { padding: 16px 12px 52px; }
  }

  /* ── FORM HEADER ── */
  .as-form-header { margin-bottom: 36px; animation: fadeUp 0.5s ease both; }
  @media (max-width: 768px) { .as-form-header { margin-bottom: 24px; } }

  .as-back {
    display: inline-block; font-size: 12px; color: var(--muted);
    background: none; border: none; cursor: pointer;
    margin-bottom: 20px; transition: color 0.2s; letter-spacing: 0.04em;
    font-family: 'DM Sans', sans-serif; padding: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .as-back:hover { color: var(--gold); }

  .as-eyebrow { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .as-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.7rem, 4vw, 2.6rem); font-weight: 300; color: var(--ink); margin-bottom: 8px; line-height: 1.15; }
  .as-subtitle { font-size: 13.5px; color: var(--muted); line-height: 1.6; }
  @media (max-width: 480px) { .as-subtitle { font-size: 12.5px; } }

  /* ── FIELDS ── */
  .as-field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 22px; animation: fadeUp 0.5s ease both; }
  @media (max-width: 768px) { .as-field { margin-bottom: 18px; } }
  .as-label { font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted); }
  .as-label-sub { font-size: 10px; letter-spacing: 0.05em; text-transform: none; color: var(--muted); opacity: 0.75; }
  .as-input-wrap {
    display: flex; align-items: center; gap: 10px;
    border: 1px solid var(--border); border-radius: 7px; padding: 11px 14px;
    background: var(--white); transition: border-color 0.2s, box-shadow 0.2s;
  }
  .as-input-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .as-icon { font-size: 13px; color: var(--gold); opacity: 0.85; flex-shrink: 0; }
  .as-input-wrap input {
    border: none; background: transparent; outline: none;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); width: 100%;
    -webkit-appearance: none;
  }
  @media (max-width: 480px) { .as-input-wrap input { font-size: 16px; } }
  .as-input-wrap input::placeholder { color: #bbb4a8; }
  .as-textarea-wrap {
    border: 1px solid var(--border); border-radius: 7px; background: var(--white);
    transition: border-color 0.2s, box-shadow 0.2s; overflow: hidden;
  }
  .as-textarea-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .as-textarea-wrap textarea {
    width: 100%; padding: 12px 14px; border: none; outline: none; resize: vertical;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink);
    background: transparent; line-height: 1.6; min-height: 100px; -webkit-appearance: none;
  }
  @media (max-width: 480px) { .as-textarea-wrap textarea { font-size: 16px; } }
  .as-textarea-wrap textarea::placeholder { color: #bbb4a8; }
  .as-char-count { font-size: 11px; color: var(--muted); text-align: right; }

  /* ── SERVICE TYPE GRID ── */
  .as-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  @media (max-width: 580px) { .as-type-grid { grid-template-columns: repeat(2, 1fr); gap: 7px; } }
  @media (max-width: 340px) { .as-type-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; } }

  .as-type-btn {
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 14px 10px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--white); cursor: pointer; font-family: 'DM Sans', sans-serif;
    font-size: 12px; color: var(--muted); transition: all 0.2s;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  @media (max-width: 480px) { .as-type-btn { padding: 12px 8px; } }
  .as-type-btn:hover { border-color: var(--gold); color: var(--ink); }
  .as-type-btn.active {
    border-color: var(--gold); background: linear-gradient(135deg, #faf7f0, #fff8e8);
    color: var(--ink); font-weight: 500; box-shadow: 0 2px 12px rgba(201,168,76,0.15);
  }
  .as-type-btn-soon { border-style: dashed; opacity: 0.72; }
  .as-type-btn-soon:hover { opacity: 1; border-color: rgba(201,168,76,0.5); }
  .as-type-btn-soon.active { border-style: dashed; opacity: 1; border-color: var(--gold); background: linear-gradient(135deg, #faf7f0, #fffbf0); }
  .as-type-emoji { font-size: 1.4rem; }
  @media (max-width: 480px) { .as-type-emoji { font-size: 1.2rem; } }
  .as-type-label { font-size: 11.5px; }
  @media (max-width: 480px) { .as-type-label { font-size: 10.5px; } }
  .as-type-soon-tag {
    position: absolute; top: 6px; right: 6px;
    font-size: 8.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    background: rgba(201,168,76,0.12); color: var(--gold);
    border: 1px solid rgba(201,168,76,0.3); padding: 1.5px 6px; border-radius: 20px;
  }

  /* ── LOCATION TAGS ── */
  .as-loc-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 4px; }
  .as-loc-tag {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 8px 6px 12px;
    background: linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04));
    border: 1px solid rgba(201,168,76,0.35); border-radius: 20px;
    font-size: 12.5px; color: var(--ink); font-weight: 500;
    animation: tagIn 0.2s cubic-bezier(0.175,0.885,0.32,1.275) both;
  }
  @media (max-width: 480px) { .as-loc-tag { font-size: 12px; padding: 5px 7px 5px 10px; } }
  .as-loc-tag-dot { font-size: 10px; color: var(--gold); line-height: 1; }
  .as-loc-tag-remove {
    background: none; border: none; cursor: pointer; color: var(--muted);
    font-size: 16px; line-height: 1; width: 20px; height: 20px; border-radius: 50%;
    transition: color 0.18s, background 0.18s; font-family: 'DM Sans', sans-serif;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .as-loc-tag-remove:hover { color: #b85c5c; background: rgba(184,92,92,0.1); }

  /* ── LOCATION TRIGGER BUTTON ── */
  .as-loc-trigger {
    display: flex; align-items: center; gap: 10px;
    padding: 13px 16px; border: 1.5px dashed rgba(201,168,76,0.4);
    border-radius: 8px; background: var(--white); cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--muted);
    transition: all 0.2s; text-align: left; width: 100%;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation; min-height: 50px;
  }
  .as-loc-trigger:hover:not(:disabled) {
    border-color: var(--gold); color: var(--ink);
    background: rgba(201,168,76,0.03);
    box-shadow: 0 2px 10px rgba(201,168,76,0.1);
  }
  .as-loc-trigger-full { opacity: 0.55; cursor: not-allowed; }
  .as-loc-trigger-icon { font-size: 11px; color: var(--gold); flex-shrink: 0; }
  .as-loc-trigger-text { flex: 1; }
  .as-loc-trigger-arrow { font-size: 16px; color: var(--gold); flex-shrink: 0; font-weight: 300; }

  .as-loc-hint { font-size: 11px; color: var(--muted); line-height: 1.5; }

  /* ── CITY PICKER TOAST MODAL ── */
  .as-city-overlay {
    position: fixed; inset: 0;
    background: rgba(14,12,10,0.55);
    backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
    display: flex; align-items: flex-end; justify-content: center;
    z-index: 2000; padding: 0;
    animation: overlayIn 0.25s ease both;
  }
  @media (min-width: 600px) {
    .as-city-overlay { align-items: center; padding: 20px; }
  }

  .as-city-toast {
    background: var(--white);
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 520px;
    display: flex; flex-direction: column;
    max-height: 88vh;
    box-shadow: 0 -8px 40px rgba(14,12,10,0.15), 0 -2px 12px rgba(201,168,76,0.1);
    animation: toastUp 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both;
    overflow: hidden;
  }
  @media (min-width: 600px) {
    .as-city-toast {
      border-radius: 20px;
      max-height: 80vh;
      box-shadow: 0 24px 64px rgba(14,12,10,0.18), 0 4px 16px rgba(201,168,76,0.1);
      animation: modalIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both;
    }
  }

  .as-city-toast-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 20px 20px 0;
    flex-shrink: 0;
  }
  @media (max-width: 480px) { .as-city-toast-header { padding: 18px 16px 0; } }

  .as-city-toast-eyebrow {
    font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 4px;
  }
  .as-city-toast-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1.4rem;
    font-weight: 300; color: var(--ink); line-height: 1.1;
  }
  .as-city-toast-close {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--surface); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; color: var(--muted); cursor: pointer;
    transition: all 0.18s; flex-shrink: 0; margin-top: 2px;
    font-family: 'DM Sans', sans-serif; line-height: 1;
    -webkit-tap-highlight-color: transparent;
  }
  .as-city-toast-close:hover { background: rgba(184,92,92,0.08); color: #b85c5c; border-color: rgba(184,92,92,0.2); }

  .as-city-toast-selected {
    padding: 14px 20px 0;
    flex-shrink: 0;
  }
  @media (max-width: 480px) { .as-city-toast-selected { padding: 12px 16px 0; } }
  .as-city-toast-selected-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
    display: block;
  }
  .as-city-toast-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .as-city-toast-tag {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 7px 5px 10px;
    background: linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04));
    border: 1px solid rgba(201,168,76,0.35); border-radius: 20px;
    font-size: 12px; color: var(--ink); font-weight: 500;
    animation: tagIn 0.18s cubic-bezier(0.175,0.885,0.32,1.275) both;
  }
  .as-city-toast-tag-dot { font-size: 9px; color: var(--gold); }
  .as-city-toast-tag-remove {
    background: none; border: none; cursor: pointer; color: var(--muted);
    font-size: 15px; width: 18px; height: 18px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: color 0.15s, background 0.15s; flex-shrink: 0; padding: 0;
    font-family: 'DM Sans', sans-serif; line-height: 1;
    -webkit-tap-highlight-color: transparent;
  }
  .as-city-toast-tag-remove:hover { color: #b85c5c; background: rgba(184,92,92,0.1); }

  .as-city-toast-search-wrap {
    display: flex; align-items: center; gap: 10px;
    margin: 14px 20px 0;
    border: 1.5px solid rgba(201,168,76,0.3); border-radius: 10px;
    padding: 11px 14px; background: var(--surface);
    transition: border-color 0.2s, box-shadow 0.2s;
    flex-shrink: 0;
  }
  @media (max-width: 480px) { .as-city-toast-search-wrap { margin: 12px 16px 0; } }
  .as-city-toast-search-wrap:focus-within {
    border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
    background: var(--white);
  }
  .as-city-toast-search-icon { font-size: 16px; color: var(--gold); opacity: 0.7; flex-shrink: 0; }
  .as-city-toast-search {
    flex: 1; border: none; outline: none; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink);
    -webkit-appearance: none;
  }
  @media (max-width: 480px) { .as-city-toast-search { font-size: 16px; } }
  .as-city-toast-search::placeholder { color: #bbb4a8; }
  .as-city-toast-search-clear {
    background: none; border: none; cursor: pointer; color: var(--muted);
    font-size: 18px; padding: 0 2px; display: flex; align-items: center;
    transition: color 0.15s; flex-shrink: 0; font-family: 'DM Sans', sans-serif;
    line-height: 1;
  }
  .as-city-toast-search-clear:hover { color: #b85c5c; }

  .as-city-toast-list {
    flex: 1; overflow-y: auto; padding: 8px 12px;
    margin-top: 10px;
    scrollbar-width: thin; scrollbar-color: rgba(201,168,76,0.3) transparent;
  }
  @media (max-width: 480px) { .as-city-toast-list { padding: 8px 8px; } }
  .as-city-toast-list::-webkit-scrollbar { width: 5px; }
  .as-city-toast-list::-webkit-scrollbar-track { background: transparent; }
  .as-city-toast-list::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 10px; }

  .as-city-toast-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 11px 12px; border: none; border-radius: 8px;
    background: transparent; font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--ink); cursor: pointer; text-align: left;
    transition: background 0.12s; margin-bottom: 2px;
    -webkit-tap-highlight-color: transparent; min-height: 44px;
  }
  .as-city-toast-item:hover { background: rgba(201,168,76,0.07); }
  .as-city-toast-item.selected { background: rgba(201,168,76,0.1); font-weight: 500; }
  .as-city-toast-item.disabled { opacity: 0.35; cursor: not-allowed; }
  .as-city-toast-item-dot { font-size: 9px; color: var(--gold); flex-shrink: 0; }
  .as-city-toast-item.selected .as-city-toast-item-dot { color: #2d6a4f; }
  .as-city-toast-item-name { flex: 1; }
  .as-city-toast-item-check { font-size: 12px; color: #2d6a4f; font-weight: 700; flex-shrink: 0; }

  .as-city-toast-empty {
    display: flex; align-items: center; gap: 10px;
    padding: 20px 12px; font-size: 13px; color: var(--muted);
    justify-content: center;
  }

  .as-city-toast-footer {
    padding: 12px 20px 20px;
    border-top: 1px solid var(--border);
    flex-shrink: 0; display: flex; flex-direction: column; gap: 8px;
  }
  @media (max-width: 480px) { .as-city-toast-footer { padding: 10px 16px 24px; } }
  .as-city-toast-max-note {
    font-size: 11.5px; color: var(--gold); text-align: center; font-weight: 500;
  }
  .as-city-toast-done {
    width: 100%; padding: 15px; background: var(--ink); color: var(--white);
    border: none; border-radius: 9px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; letter-spacing: 0.04em; cursor: pointer;
    transition: all 0.22s ease; min-height: 52px;
    -webkit-tap-highlight-color: transparent;
  }
  .as-city-toast-done:hover { background: var(--gold); color: var(--ink); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(201,168,76,0.3); }

  /* ── TIME SLOTS (Decor) ── */
  .as-slot-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 4px; }
  @media (max-width: 480px) { .as-slot-grid { grid-template-columns: 1fr; gap: 7px; } }

  .as-slot-btn {
    display: flex; align-items: center; gap: 10px; padding: 12px 16px;
    border: 1px solid var(--border); border-radius: 8px; background: var(--white);
    cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted);
    transition: all 0.2s; text-align: left;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation; min-height: 48px;
  }
  @media (max-width: 480px) { .as-slot-btn { padding: 11px 14px; font-size: 13px; } }
  .as-slot-btn:hover { border-color: var(--gold); color: var(--ink); background: rgba(201,168,76,0.02); }
  .as-slot-btn-active {
    border-color: var(--gold); background: linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03));
    color: var(--ink); font-weight: 500; box-shadow: 0 2px 10px rgba(201,168,76,0.12);
  }
  .as-slot-check {
    width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid rgba(201,168,76,0.4);
    background: transparent; display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--gold); flex-shrink: 0; transition: all 0.2s;
  }
  .as-slot-btn-active .as-slot-check { background: var(--gold); border-color: var(--gold); color: white; font-weight: 700; }
  .as-slot-label { flex: 1; }

  .as-slot-price-row {
    display: flex; align-items: center; gap: 12px; margin-top: 14px;
    padding: 14px 16px; background: var(--white); border: 1px solid var(--border);
    border-radius: 8px; flex-wrap: wrap;
  }
  @media (max-width: 480px) {
    .as-slot-price-row { flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 14px; }
  }
  .as-slot-price-label { font-size: 12px; font-weight: 500; color: var(--muted); white-space: nowrap; letter-spacing: 0.04em; }
  .as-slot-price-row .as-input-wrap { border: none; padding: 0; box-shadow: none; background: transparent; }
  .as-slot-price-row .as-input-wrap:focus-within { box-shadow: none; }

  /* ── COMING SOON ── */
  .as-coming-soon-layout { display: flex; flex-direction: column; }
  .as-cs-panel {
    position: relative; overflow: hidden; background: var(--white);
    border: 1px solid var(--border); border-radius: 20px; padding: 64px 48px;
    margin-top: 8px; display: flex; align-items: center; justify-content: center;
    min-height: 420px;
    box-shadow: 0 16px 60px rgba(201,168,76,0.08), 0 4px 16px rgba(14,12,10,0.04);
    animation: fadeUp 0.5s ease both;
  }
  @media (max-width: 768px) { .as-cs-panel { padding: 40px 24px; min-height: 340px; } }
  @media (max-width: 480px) { .as-cs-panel { padding: 32px 16px; min-height: 300px; border-radius: 14px; } }
  .as-cs-orb { position: absolute; width: 380px; height: 380px; border-radius: 50%; background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%); top: -120px; right: -100px; pointer-events: none; }
  .as-cs-orb-2 { width: 260px; height: 260px; bottom: -80px; left: -60px; top: auto; right: auto; background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%); }
  .as-cs-content { position: relative; text-align: center; max-width: 480px; display: flex; flex-direction: column; align-items: center; gap: 0; }
  .as-cs-icon-wrap { width: 80px; height: 80px; background: linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04)); border: 1px solid rgba(201,168,76,0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 20px; box-shadow: 0 8px 24px rgba(201,168,76,0.12); animation: popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both; animation-delay: 0.1s; }
  .as-cs-emoji { font-size: 2rem; filter: drop-shadow(0 2px 6px rgba(201,168,76,0.3)); }
  .as-cs-tag { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2); padding: 4px 14px; border-radius: 20px; margin-bottom: 16px; animation: fadeUp 0.5s ease both; animation-delay: 0.15s; }
  .as-cs-heading { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 300; color: var(--ink); line-height: 1.1; margin-bottom: 14px; animation: fadeUp 0.5s ease both; animation-delay: 0.2s; }
  .as-cs-text { font-size: 14px; color: var(--muted); line-height: 1.7; margin-bottom: 28px; animation: fadeUp 0.5s ease both; animation-delay: 0.25s; }
  .as-cs-text strong { color: var(--ink); font-weight: 500; }
  .as-cs-divider { display: flex; align-items: center; gap: 12px; width: 100%; margin-bottom: 28px; animation: fadeUp 0.5s ease both; animation-delay: 0.3s; }
  .as-cs-divider span:first-child, .as-cs-divider span:last-child { flex: 1; height: 1px; background: var(--border); }
  .as-cs-divider-dot { font-size: 10px; color: var(--gold); opacity: 0.6; }
  .as-cs-steps { display: flex; flex-direction: column; gap: 10px; width: 100%; margin-bottom: 32px; animation: fadeUp 0.5s ease both; animation-delay: 0.35s; }
  .as-cs-step { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); font-size: 13px; color: var(--muted); text-align: left; }
  .as-cs-step-done { color: var(--ink); background: linear-gradient(135deg, rgba(45,106,79,0.04), rgba(45,106,79,0.02)); border-color: rgba(45,106,79,0.18); }
  .as-cs-step-next { border-color: rgba(201,168,76,0.3); background: linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02)); color: var(--ink); font-weight: 500; }
  .as-cs-step-icon { font-size: 14px; flex-shrink: 0; }
  .as-cs-step-done .as-cs-step-icon { color: #2d6a4f; }
  .as-cs-step-next .as-cs-step-icon { color: var(--gold); }
  .as-cs-pulse { animation: pulse 2s ease-in-out infinite; }
  .as-cs-back-btn { background: none; border: 1px solid var(--border); border-radius: 7px; padding: 11px 22px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer; transition: all 0.2s; letter-spacing: 0.02em; animation: fadeUp 0.5s ease both; animation-delay: 0.4s; -webkit-tap-highlight-color: transparent; }
  .as-cs-back-btn:hover { border-color: var(--gold); color: var(--ink); background: rgba(201,168,76,0.04); }

  /* ── PACKAGES ── */
  .as-pkg-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 14px; transition: border-color 0.2s, box-shadow 0.2s; animation: fadeUp 0.3s ease both; }
  @media (max-width: 480px) { .as-pkg-card { padding: 16px; } }
  .as-pkg-card:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.08); }
  .as-pkg-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .as-pkg-tier { font-size: 10px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); background: rgba(201,168,76,0.08); border: 1px solid var(--border); padding: 3px 10px; border-radius: 20px; }
  .as-pkg-remove { background: none; border: none; cursor: pointer; color: #ccc; font-size: 20px; line-height: 1; padding: 2px 6px; border-radius: 4px; transition: color 0.2s; font-family: 'DM Sans', sans-serif; min-width: 32px; min-height: 32px; display: flex; align-items: center; justify-content: center; }
  .as-pkg-remove:hover { color: #b85c5c; }
  .as-pkg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  @media (max-width: 480px) { .as-pkg-row { grid-template-columns: 1fr; gap: 10px; } }
  .as-pkg-features-label { font-size: 10.5px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .as-pkg-feature-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
  .as-pkg-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); opacity: 0.55; flex-shrink: 0; }
  .as-pkg-remove-feat { background: none; border: none; cursor: pointer; color: #ccc; font-size: 16px; line-height: 1; padding: 0 4px; transition: color 0.2s; flex-shrink: 0; font-family: 'DM Sans', sans-serif; min-width: 28px; min-height: 28px; display: flex; align-items: center; justify-content: center; }
  .as-pkg-remove-feat:hover { color: #b85c5c; }
  .as-add-feat-btn { background: none; border: none; cursor: pointer; color: var(--gold); font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; padding: 6px 0 0; letter-spacing: 0.03em; transition: opacity 0.2s; text-align: left; -webkit-tap-highlight-color: transparent; }
  .as-add-feat-btn:hover { opacity: 0.7; }
  .as-add-pkg-btn { width: 100%; padding: 14px; background: none; border: 1px dashed rgba(201,168,76,0.4); border-radius: 10px; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; letter-spacing: 0.03em; margin-top: 2px; min-height: 52px; -webkit-tap-highlight-color: transparent; }
  .as-add-pkg-btn:hover { border-color: var(--gold); color: var(--ink); background: rgba(201,168,76,0.04); }

  /* ── IMAGE PREVIEW GRID ── */
  .as-img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 10px; margin-bottom: 10px; animation: fadeUp 0.3s ease both; }
  @media (max-width: 480px) { .as-img-grid { grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 8px; } }
  .as-img-thumb { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2px solid transparent; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
  .as-img-thumb:hover { border-color: rgba(201,168,76,0.5); }
  .as-img-thumb-active { border-color: var(--gold) !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.2); }
  .as-img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .as-img-remove { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; background: rgba(184,92,92,0.88); color: white; border: none; border-radius: 50%; font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; line-height: 1; transition: background 0.2s, transform 0.2s; font-family: 'DM Sans', sans-serif; }
  .as-img-remove:hover { background: #b85c5c; transform: scale(1.12); }
  .as-img-cover-badge { position: absolute; bottom: 4px; left: 4px; font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(14,12,10,0.72); color: var(--gold-light); padding: 2px 7px; border-radius: 20px; backdrop-filter: blur(4px); }
  .as-img-add-tile { aspect-ratio: 1; border-radius: 8px; border: 1.5px dashed rgba(201,168,76,0.35); background: var(--white); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
  .as-img-add-tile:hover { border-color: var(--gold); background: rgba(201,168,76,0.03); }
  .as-img-add-icon { font-size: 1.4rem; color: var(--gold); opacity: 0.7; line-height: 1; }
  .as-img-add-text { font-size: 10px; color: var(--muted); letter-spacing: 0.05em; }
  .as-img-hint { font-size: 11.5px; color: var(--muted); line-height: 1.5; }
  .as-img-count { color: var(--gold); font-weight: 500; }

  /* ── UPLOAD ZONE ── */
  .as-upload-zone { border: 1.5px dashed rgba(201,168,76,0.4); border-radius: 12px; padding: 36px 20px; background: var(--white); text-align: center; transition: border-color 0.22s, background 0.22s, transform 0.15s; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  @media (max-width: 480px) { .as-upload-zone { padding: 28px 16px; border-radius: 10px; } }
  .as-upload-zone:hover { border-color: var(--gold); background: rgba(201,168,76,0.02); }
  .as-upload-zone.dragging { border-color: var(--gold); background: rgba(201,168,76,0.06); transform: scale(1.01); box-shadow: 0 0 0 4px rgba(201,168,76,0.1); }
  .as-upload-zone-compact { padding: 18px 20px; margin-top: 8px; flex-direction: row; justify-content: center; gap: 12px; background: var(--surface); }
  @media (max-width: 480px) { .as-upload-zone-compact { flex-wrap: wrap; padding: 14px; } }
  .as-upload-icon-wrap { width: 52px; height: 52px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; }
  .as-upload-icon { font-size: 1.6rem; color: var(--gold); }
  .as-upload-title { font-size: 14px; color: var(--ink); font-weight: 500; }
  @media (max-width: 480px) { .as-upload-title { font-size: 13px; } }
  .as-upload-sub   { font-size: 12px; color: var(--muted); }
  .as-upload-label { display: inline-flex; align-items: center; padding: 9px 22px; background: var(--ink); color: var(--white); border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.2s; letter-spacing: 0.03em; -webkit-tap-highlight-color: transparent; min-height: 40px; }
  .as-upload-label:hover { background: var(--gold); color: var(--ink); }
  .as-upload-label-sm { padding: 6px 16px; font-size: 12px; }

  /* ── ERROR ── */
  .as-error { font-size: 12.5px; color: #b85c5c; background: rgba(184,92,92,0.07); border: 1px solid rgba(184,92,92,0.2); border-radius: 6px; padding: 10px 14px; margin-bottom: 18px; }

  /* ── ACTIONS ROW ── */
  .as-actions { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 14px; }
  @media (max-width: 480px) { .as-actions { grid-template-columns: 1fr 1.5fr; gap: 10px; } }
  .as-btn-ghost-full { padding: 16px; background: none; border: 1px solid var(--border); border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--muted); cursor: pointer; transition: all 0.2s; min-height: 52px; -webkit-tap-highlight-color: transparent; }
  .as-btn-ghost-full:hover:not(:disabled) { border-color: var(--gold); color: var(--ink); }
  .as-btn-ghost-full:disabled { opacity: 0.5; pointer-events: none; }
  .as-submit { padding: 16px; background: var(--ink); color: var(--white); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .as-submit:hover:not(:disabled) { background: var(--gold); color: var(--ink); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(201,168,76,0.3); }
  .as-submit.loading { opacity: 0.65; pointer-events: none; }
  .as-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  .as-terms { font-size: 11.5px; color: var(--muted); text-align: center; line-height: 1.6; }
  .as-link { color: var(--gold); text-decoration: none; font-weight: 500; }
  .as-link:hover { text-decoration: underline; }

  /* ── PREVIEW COLUMN ── */
  .as-preview-sticky { position: sticky; top: 88px; }
  @media (max-width: 768px) { .as-preview-sticky { position: static; } }
  .as-preview-label { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; }
  .as-preview-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(14,12,10,0.06); }
  .as-preview-img { position: relative; height: 200px; background: linear-gradient(135deg, #ede8e0, #e0d8cc); overflow: hidden; }
  @media (max-width: 768px) { .as-preview-img { height: 180px; } }
  .as-preview-img img { width: 100%; height: 100%; object-fit: cover; }
  .as-preview-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 2.5rem; color: var(--muted); }
  .as-preview-placeholder p { font-size: 12px; color: var(--muted); }
  .as-preview-badge { position: absolute; bottom: 10px; left: 10px; font-size: 10.5px; font-weight: 500; letter-spacing: 0.08em; background: rgba(14,12,10,0.65); backdrop-filter: blur(6px); color: var(--gold-light); padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(201,168,76,0.2); }
  .as-preview-count { position: absolute; bottom: 10px; right: 10px; font-size: 10px; font-weight: 500; background: rgba(14,12,10,0.65); backdrop-filter: blur(6px); color: var(--gold-light); padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(201,168,76,0.2); }
  .as-preview-body { padding: 18px 20px; }
  @media (max-width: 480px) { .as-preview-body { padding: 14px 16px; } }
  .as-preview-title { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink); margin-bottom: 7px; min-height: 1.5em; }
  .as-preview-loc { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
  .as-preview-loc-wrap { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
  .as-preview-loc-pill { font-size: 11px; color: var(--muted); background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 3px 9px; font-weight: 500; white-space: nowrap; }
  .as-preview-desc { font-size: 12.5px; color: var(--muted); line-height: 1.6; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; min-height: 3em; }
  .as-preview-slots { margin-bottom: 14px; }
  .as-preview-slots-label { font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 6px; }
  .as-preview-slots-list { display: flex; flex-wrap: wrap; gap: 5px; }
  .as-preview-slot-pill { font-size: 11px; color: var(--ink); background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 3px 10px; font-weight: 500; }
  .as-preview-pkgs { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .as-preview-pkg-pill { display: flex; justify-content: space-between; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 7px 12px; }
  .as-preview-pkg-name { font-size: 11.5px; font-weight: 500; color: var(--ink); letter-spacing: 0.03em; }
  .as-preview-pkg-price { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 600; color: var(--gold); }
  .as-preview-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 14px; }
  .as-preview-from { display: block; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .as-preview-price { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink); }
  .as-preview-btn { padding: 8px 16px; background: var(--ink); color: var(--white); border-radius: 6px; font-size: 12px; font-weight: 500; }
  .as-preview-strip { display: flex; gap: 6px; margin-top: 10px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .as-preview-strip::-webkit-scrollbar { display: none; }
  .as-strip-thumb { width: 52px; height: 52px; flex-shrink: 0; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; }
  .as-strip-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .as-strip-thumb.active { border-color: var(--gold); }
  .as-strip-thumb:hover { border-color: rgba(201,168,76,0.5); }
  .as-strip-more { width: 52px; height: 52px; flex-shrink: 0; border-radius: 6px; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--muted); font-weight: 500; }
  .as-preview-note { font-size: 11px; color: var(--muted); text-align: center; margin-top: 10px; }

  /* ── VERIFICATION POPUP MODAL ── */
  .as-modal-overlay {
    position: fixed; inset: 0; background: rgba(14,12,10,0.6);
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px; animation: overlayIn 0.3s ease both;
  }
  .as-modal {
    position: relative; overflow: hidden;
    background: var(--white); border: 1px solid rgba(201,168,76,0.25);
    border-radius: 24px; padding: 48px 40px 40px;
    width: 100%; max-width: 480px;
    box-shadow: 0 32px 80px rgba(14,12,10,0.2), 0 8px 24px rgba(201,168,76,0.1);
    animation: modalIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    display: flex; flex-direction: column; align-items: center; gap: 0;
    max-height: 90vh; overflow-y: auto;
  }
  @media (max-width: 640px) { .as-modal { padding: 36px 24px 32px; border-radius: 18px; } }
  @media (max-width: 480px) { .as-modal { padding: 28px 18px 24px; border-radius: 16px; } .as-modal-heading { font-size: 1.6rem; } }
  .as-modal-orb { position: absolute; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%); top: -120px; right: -80px; pointer-events: none; }
  .as-modal-orb-2 { width: 200px; height: 200px; bottom: -60px; left: -50px; top: auto; right: auto; background: radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%); }
  .as-modal-icon-ring { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; animation: popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both; animation-delay: 0.1s; }
  .as-modal-icon-inner { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.05)); border: 1.5px solid rgba(201,168,76,0.35); display: flex; align-items: center; justify-content: center; color: var(--gold); position: relative; z-index: 1; box-shadow: 0 8px 24px rgba(201,168,76,0.15); }
  .as-modal-ring-pulse { position: absolute; inset: -8px; border-radius: 50%; border: 1px solid rgba(201,168,76,0.2); animation: ringPulse 2.5s ease-in-out infinite; }
  .as-modal-tag { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2); padding: 4px 14px; border-radius: 20px; margin-bottom: 12px; animation: fadeUp 0.4s ease both; animation-delay: 0.15s; }
  .as-modal-tag-live { color: #2d6a4f; background: rgba(45,106,79,0.08); border-color: rgba(45,106,79,0.25); }
  .as-modal-heading { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 300; color: var(--ink); line-height: 1.1; margin-bottom: 10px; text-align: center; animation: fadeUp 0.4s ease both; animation-delay: 0.2s; }
  .as-modal-subtext { font-size: 13.5px; color: var(--muted); line-height: 1.65; text-align: center; margin-bottom: 24px; max-width: 360px; animation: fadeUp 0.4s ease both; animation-delay: 0.25s; }

  /* ── Live card (replaces timeline) ── */
  .as-modal-live-card {
    width: 100%; background: linear-gradient(135deg, rgba(45,106,79,0.05), rgba(45,106,79,0.02));
    border: 1px solid rgba(45,106,79,0.18); border-radius: 10px;
    padding: 6px 4px; margin-bottom: 20px;
    display: flex; flex-direction: column;
    animation: fadeUp 0.4s ease both; animation-delay: 0.3s;
  }
  .as-modal-live-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; border-radius: 7px;
  }
  .as-modal-live-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }
  .as-modal-live-dot-green { background: #2d6a4f; box-shadow: 0 0 0 3px rgba(45,106,79,0.15); }
  .as-modal-live-label { flex: 1; font-size: 13px; color: var(--ink); font-weight: 500; }
  .as-modal-live-check { font-size: 13px; color: #2d6a4f; font-weight: 700; flex-shrink: 0; }
  .as-modal-notice { display: flex; align-items: center; gap: 10px; width: 100%; background: linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02)); border: 1px solid rgba(201,168,76,0.2); border-radius: 8px; padding: 12px 16px; font-size: 12.5px; color: var(--muted); margin-bottom: 24px; animation: fadeUp 0.4s ease both; animation-delay: 0.35s; }
  .as-modal-notice-icon { font-size: 16px; flex-shrink: 0; }
  .as-modal-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; animation: fadeUp 0.4s ease both; animation-delay: 0.4s; }
  .as-modal-btn-primary { width: 100%; padding: 15px; background: var(--ink); color: var(--white); border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; cursor: pointer; transition: all 0.25s ease; min-height: 52px; -webkit-tap-highlight-color: transparent; }
  .as-modal-btn-primary:hover { background: var(--gold); color: var(--ink); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(201,168,76,0.3); }
  .as-modal-btn-ghost { width: 100%; padding: 13px; background: none; color: var(--muted); border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; min-height: 48px; -webkit-tap-highlight-color: transparent; }
  .as-modal-btn-ghost:hover { border-color: var(--gold); color: var(--ink); }

  /* ── ANIMATIONS ── */
  @keyframes overlayIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalIn    { from { opacity: 0; transform: scale(0.88) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes toastUp    { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
  @keyframes ringPulse  { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0; transform: scale(1.5); } }
  @keyframes fadeUp     { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin       { to { transform: rotate(360deg); } }
  @keyframes popIn      { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes pulse      { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
  @keyframes tagIn      { from { opacity: 0; transform: scale(0.75); } to { opacity: 1; transform: scale(1); } }
`;