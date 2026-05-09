import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

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

export default function EditService() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    serviceType: "decor",
    title: "",
    description: "",
    locations: [],
  });

  const [showCityToast,   setShowCityToast]   = useState(false);
  const [citySearchInput, setCitySearchInput] = useState("");
  const [filteredCities,  setFilteredCities]  = useState(INDIAN_CITIES);
  const citySearchRef = useRef(null);

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [customSlot,    setCustomSlot]    = useState("");
  const [decorPrice,    setDecorPrice]    = useState("");

  const [packages,       setPackages]       = useState([{ name: "Basic", price: "", features: [""] }]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages,      setNewImages]      = useState([]);
  const [newPreviews,    setNewPreviews]    = useState([]);
  const [removedImages,  setRemovedImages]  = useState([]);
  const [activePreview,  setActivePreview]  = useState("");
  const [dragging,       setDragging]       = useState(false);

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isDecor = form.serviceType === "decor";
  const selectedType = SERVICE_TYPES.find((t) => t.value === form.serviceType);

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

  useEffect(() => {
    if (showCityToast) {
      setTimeout(() => citySearchRef.current?.focus(), 80);
    } else {
      setCitySearchInput("");
    }
  }, [showCityToast]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setShowCityToast(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showCityToast ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showCityToast]);

  // ── Load existing service ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    API.get("/vendors/my-services", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        const service = res.data.find((s) => s._id === id);
        // ✅ FIX 3: was navigate("/dashboard") — now goes to vendor dashboard
        if (!service) { navigate("/vendor-dashboard"); return; }

        let locs = [];
        if (Array.isArray(service.locations)) locs = service.locations;
        else if (typeof service.location === "string" && service.location.trim()) {
          locs = service.location.split(",").map((l) => l.trim()).filter(Boolean);
        }

        setForm({
          serviceType: service.serviceType || "decor",
          title:       service.title       || "",
          description: service.description || "",
          locations:   locs,
        });

        if (service.serviceType === "decor") {
          if (Array.isArray(service.timeSlots) && service.timeSlots.length) {
            const presetLabels = TIME_SLOTS.filter((s) => s !== "Custom");
            const restoredSlots = [];
            let restoredCustom = "";
            service.timeSlots.forEach((s) => {
              if (presetLabels.includes(s)) {
                restoredSlots.push(s);
              } else {
                restoredSlots.push("Custom");
                restoredCustom = s;
              }
            });
            setSelectedSlots([...new Set(restoredSlots)]);
            setCustomSlot(restoredCustom);
          }
          setDecorPrice(service.price ? String(service.price) : "");
          setPackages([{ name: "Basic", price: "", features: [""] }]);
        } else {
          setPackages(
            service.packages?.length
              ? service.packages.map((p) => ({
                  name:     p.name     || "",
                  price:    p.price    || "",
                  features: p.features?.length ? p.features : [""],
                }))
              : [{ name: "Basic", price: "", features: [""] }]
          );
        }

        setExistingImages(service.images || []);
        if (service.images?.[0]) setActivePreview(service.images[0]);
      })
      // ✅ FIX 3: was navigate("/dashboard")
      .catch(() => navigate("/vendor-dashboard"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const addLocation = (city) => {
    if (!city || form.locations.includes(city) || form.locations.length >= 8) return;
    setForm((f) => ({ ...f, locations: [...f.locations, city] }));
  };
  const removeLocation = (loc) =>
    setForm((f) => ({ ...f, locations: f.locations.filter((l) => l !== loc) }));

  const toggleSlot = (slot) =>
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );

  const addPackage    = () => { if (packages.length >= 4) return; setPackages([...packages, { name: TIER_LABELS[packages.length] || "", price: "", features: [""] }]); };
  const removePackage = (i) => setPackages(packages.filter((_, idx) => idx !== i));
  const updatePackage = (i, field, val) => { const u = [...packages]; u[i][field] = val; setPackages(u); };
  const addFeature    = (pi) => { const u = [...packages]; u[pi].features.push(""); setPackages(u); };
  const removeFeature = (pi, fi) => { const u = [...packages]; u[pi].features.splice(fi, 1); setPackages(u); };
  const updateFeature = (pi, fi, val) => { const u = [...packages]; u[pi].features[fi] = val; setPackages(u); };

  const addNewImages = (files) => {
    const maxNew = 15 - existingImages.length;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, maxNew - newImages.length);
    if (!valid.length) return;
    const previews = valid.map((f) => URL.createObjectURL(f));
    setNewImages((prev) => [...prev, ...valid]);
    setNewPreviews((prev) => {
      const updated = [...prev, ...previews];
      if (!activePreview) setActivePreview(updated[0]);
      return updated;
    });
  };

  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setRemovedImages((prev) => [...prev, url]);
    if (activePreview === url) {
      const remaining = existingImages.filter((img) => img !== url);
      setActivePreview(remaining[0] || newPreviews[0] || "");
    }
  };

  const removeNewImage = (i) => {
    URL.revokeObjectURL(newPreviews[i]);
    const updatedPreviews = newPreviews.filter((_, idx) => idx !== i);
    const updatedImages   = newImages.filter((_, idx) => idx !== i);
    setNewPreviews(updatedPreviews);
    setNewImages(updatedImages);
    if (activePreview === newPreviews[i]) {
      setActivePreview(updatedPreviews[0] || existingImages[0] || "");
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); addNewImages(e.dataTransfer.files); };

  const allPreviews = [...existingImages, ...newPreviews];

  const validate = () => {
    if (!form.title.trim())          return "Please enter a service title.";
    if (!form.description.trim())    return "Please add a description.";
    if (form.locations.length === 0) return "Please add at least one location.";
    if (isDecor) {
      if (selectedSlots.length === 0) return "Please select at least one time slot.";
      if (selectedSlots.includes("Custom") && !customSlot.trim()) return "Please describe your custom time slot.";
      if (!decorPrice) return "Please enter a price for your decor service.";
    } else {
      if (packages.length === 0) return "Add at least one package.";
      for (let i = 0; i < packages.length; i++)
        if (!packages[i].price) return `Please enter price for ${packages[i].name || TIER_LABELS[i]}`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setSaving(true);

    const token = localStorage.getItem("token");
    const data  = new FormData();
    data.append("serviceType",    form.serviceType);
    data.append("title",          form.title);
    data.append("description",    form.description);
    data.append("locations",      JSON.stringify(form.locations));

    if (isDecor) {
      const slots = selectedSlots.map((s) => (s === "Custom" ? customSlot : s));
      data.append("timeSlots", JSON.stringify(slots));
      data.append("price",     decorPrice);
    } else {
      data.append("packages", JSON.stringify(packages));
    }

    data.append("existingImages", JSON.stringify(existingImages));
    data.append("removedImages",  JSON.stringify(removedImages));
    newImages.forEach((img) => data.append("images", img));

    try {
      await API.put(`/vendors/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
    } catch (e) {
      console.error("Edit error:", e.response?.data);
      setError(e.response?.data?.error || "Failed to update service. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const previewPrice = isDecor
    ? (decorPrice ? `₹${Number(decorPrice).toLocaleString()}` : "₹ —")
    : (packages[0]?.price ? `₹${Number(packages[0].price).toLocaleString()}` : "₹ —");

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="es-root">
          <Navbar />
          <div className="es-body">
            <div className="es-loading">
              <div className="es-load-spinner" />
              <p>Loading your service…</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="es-root">
        <Navbar />
        <div className="es-body">

          {/* ── CITY PICKER TOAST MODAL ── */}
          {showCityToast && (
            <div className="es-city-overlay" onClick={(e) => e.target === e.currentTarget && setShowCityToast(false)}>
              <div className="es-city-toast">
                <div className="es-city-toast-header">
                  <div>
                    <p className="es-city-toast-eyebrow">🇮🇳 Indian Cities</p>
                    <h3 className="es-city-toast-title">Select Locations</h3>
                  </div>
                  <button className="es-city-toast-close" onClick={() => setShowCityToast(false)}>×</button>
                </div>

                {form.locations.length > 0 && (
                  <div className="es-city-toast-selected">
                    <p className="es-city-toast-selected-label">Selected ({form.locations.length}/8)</p>
                    <div className="es-city-toast-tags">
                      {form.locations.map((loc) => (
                        <span key={loc} className="es-city-toast-tag">
                          <span className="es-city-toast-tag-dot">◉</span>
                          {loc}
                          <button type="button" className="es-city-toast-tag-remove" onClick={() => removeLocation(loc)}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="es-city-toast-search-wrap">
                  <span className="es-city-toast-search-icon">⌕</span>
                  <input
                    ref={citySearchRef}
                    className="es-city-toast-search"
                    placeholder="Search city e.g. Delhi, Mumbai…"
                    value={citySearchInput}
                    onChange={(e) => setCitySearchInput(e.target.value)}
                  />
                  {citySearchInput && (
                    <button type="button" className="es-city-toast-search-clear" onClick={() => setCitySearchInput("")}>×</button>
                  )}
                </div>

                <div className="es-city-toast-list">
                  {filteredCities.length === 0 ? (
                    <div className="es-city-toast-empty"><span>🔍</span><span>No matching city found</span></div>
                  ) : (
                    filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        className={`es-city-toast-item ${form.locations.includes(city) ? "selected" : ""} ${form.locations.length >= 8 && !form.locations.includes(city) ? "disabled" : ""}`}
                        onClick={() => {
                          if (form.locations.includes(city)) removeLocation(city);
                          else if (form.locations.length < 8) addLocation(city);
                        }}
                        disabled={form.locations.length >= 8 && !form.locations.includes(city)}
                      >
                        <span className="es-city-toast-item-dot">◉</span>
                        <span className="es-city-toast-item-name">{city}</span>
                        {form.locations.includes(city) && <span className="es-city-toast-item-check">✓</span>}
                      </button>
                    ))
                  )}
                </div>

                <div className="es-city-toast-footer">
                  {form.locations.length >= 8 && <p className="es-city-toast-max-note">Maximum 8 locations reached</p>}
                  <button className="es-city-toast-done" onClick={() => setShowCityToast(false)}>
                    Done — {form.locations.length} {form.locations.length === 1 ? "city" : "cities"} selected →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SUCCESS MODAL ── */}
          {success && (
            // ✅ FIX 3: backdrop click goes to vendor-dashboard
            <div className="es-modal-overlay" onClick={(e) => e.target === e.currentTarget && navigate("/vendor-dashboard")}>
              <div className="es-modal">
                <div className="es-modal-orb" />
                <div className="es-modal-orb es-modal-orb-2" />
                <div className="es-modal-icon-ring">
                  <div className="es-modal-icon-inner">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M8 16.5l5.5 5.5 10.5-11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="es-modal-ring-pulse" />
                </div>
                <div className="es-modal-tag es-modal-tag-live">Service Updated</div>
                <h2 className="es-modal-heading">Changes Saved! ✨</h2>
                <p className="es-modal-subtext">Your service has been updated and changes are now live on the platform.</p>
                <div className="es-modal-live-card">
                  <div className="es-modal-live-row">
                    <span className="es-modal-live-dot es-modal-live-dot-green" />
                    <span className="es-modal-live-label">Changes are live</span>
                    <span className="es-modal-live-check">✓</span>
                  </div>
                  <div className="es-modal-live-row">
                    <span className="es-modal-live-dot es-modal-live-dot-green" />
                    <span className="es-modal-live-label">Clients can see the updates</span>
                    <span className="es-modal-live-check">✓</span>
                  </div>
                </div>
                <div className="es-modal-actions">
                  {/* ✅ FIX 3: Go to Dashboard → /vendor-dashboard */}
                  <button className="es-modal-btn-primary" onClick={() => navigate("/vendor-dashboard")}>Go to Dashboard →</button>
                  <button className="es-modal-btn-ghost" onClick={() => navigate(`/vendor/${id}`)}>View Service</button>
                </div>
              </div>
            </div>
          )}

          <div className="es-layout">
            <div className="es-form-col">
              <div className="es-form-header">
                <button className="es-back" onClick={() => navigate(-1)}>← Back to Dashboard</button>
                <p className="es-eyebrow">Vendor Portal</p>
                <h1 className="es-title">Edit Service</h1>
                <p className="es-subtitle">Update your listing details. Changes go live instantly.</p>
              </div>

              <div className="es-field">
                <label className="es-label">Service Category</label>
                <div className="es-type-grid">
                  {SERVICE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      className={`es-type-btn ${form.serviceType === t.value ? "active" : ""} ${!t.available ? "es-type-btn-soon" : ""}`}
                      onClick={() => t.available && set("serviceType", t.value)}
                      disabled={!t.available}
                    >
                      <span className="es-type-emoji">{t.emoji}</span>
                      <span className="es-type-label">{t.label}</span>
                      {!t.available && <span className="es-type-soon-tag">Soon</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="es-field">
                <label className="es-label">Service Title</label>
                <div className="es-input-wrap">
                  <span className="es-icon">◈</span>
                  <input
                    placeholder={`e.g. Premium ${selectedType?.label} for Weddings`}
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </div>
              </div>

              <div className="es-field">
                <label className="es-label">Description</label>
                <div className="es-textarea-wrap">
                  <textarea
                    placeholder="Describe what makes your service special…"
                    value={form.description}
                    rows={4}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>
                <span className="es-char-count">{form.description.length} / 500</span>
              </div>

              <div className="es-field">
                <label className="es-label">
                  Location
                  <span className="es-label-sub"> — select from Indian cities (up to 8)</span>
                </label>

                {form.locations.length > 0 && (
                  <div className="es-loc-tags">
                    {form.locations.map((loc) => (
                      <span key={loc} className="es-loc-tag">
                        <span className="es-loc-tag-dot">◉</span>
                        {loc}
                        <button type="button" className="es-loc-tag-remove" onClick={() => removeLocation(loc)} title={`Remove ${loc}`}>×</button>
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className={`es-loc-trigger ${form.locations.length >= 8 ? "es-loc-trigger-full" : ""}`}
                  onClick={() => form.locations.length < 8 && setShowCityToast(true)}
                  disabled={form.locations.length >= 8}
                >
                  <span className="es-loc-trigger-icon">◉</span>
                  <span className="es-loc-trigger-text">
                    {form.locations.length === 0
                      ? "Select cities…"
                      : form.locations.length >= 8
                      ? "Maximum 8 cities reached"
                      : `Add more cities (${form.locations.length}/8)`}
                  </span>
                  {form.locations.length < 8 && <span className="es-loc-trigger-arrow">＋</span>}
                </button>

                {form.locations.length > 0 && form.locations.length < 8 && (
                  <p className="es-loc-hint">Tap the button above to add more cities · click × on a tag to remove</p>
                )}
              </div>

              {isDecor && (
                <div className="es-field">
                  <label className="es-label">
                    Availability & Pricing
                    <span className="es-label-sub"> — select your time slots</span>
                  </label>
                  <div className="es-slot-grid">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`es-slot-btn ${selectedSlots.includes(slot) ? "es-slot-btn-active" : ""}`}
                        onClick={() => toggleSlot(slot)}
                      >
                        <span className="es-slot-check">{selectedSlots.includes(slot) ? "✓" : ""}</span>
                        <span className="es-slot-label">{slot}</span>
                      </button>
                    ))}
                  </div>

                  {selectedSlots.includes("Custom") && (
                    <div className="es-input-wrap" style={{ marginTop: 10 }}>
                      <span className="es-icon">✦</span>
                      <input
                        placeholder="Describe your custom time slot…"
                        value={customSlot}
                        onChange={(e) => setCustomSlot(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="es-slot-price-row">
                    <label className="es-slot-price-label">Service Price</label>
                    <div className="es-input-wrap" style={{ flex: 1 }}>
                      <span className="es-icon" style={{ fontSize: 11 }}>₹</span>
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

              {!isDecor && (
                <div className="es-field">
                  <label className="es-label">Packages</label>
                  {packages.map((pkg, index) => (
                    <div key={index} className="es-pkg-card">
                      <div className="es-pkg-card-header">
                        <span className="es-pkg-tier">{TIER_LABELS[index] || `Package ${index + 1}`}</span>
                        {index > 0 && (
                          <button type="button" className="es-pkg-remove" onClick={() => removePackage(index)}>×</button>
                        )}
                      </div>
                      <div className="es-pkg-row">
                        <div className="es-input-wrap">
                          <input placeholder="Package name" value={pkg.name} onChange={(e) => updatePackage(index, "name", e.target.value)} />
                        </div>
                        <div className="es-input-wrap">
                          <span className="es-icon" style={{ fontSize: 11 }}>₹</span>
                          <input type="number" placeholder="Price" value={pkg.price} onChange={(e) => updatePackage(index, "price", e.target.value)} />
                        </div>
                      </div>
                      <p className="es-pkg-features-label">Features included</p>
                      {pkg.features.map((f, fi) => (
                        <div key={fi} className="es-pkg-feature-row">
                          <span className="es-pkg-dot" />
                          <div className="es-input-wrap" style={{ flex: 1 }}>
                            <input placeholder="e.g. 3 hours shoot, HD delivery…" value={f} onChange={(e) => updateFeature(index, fi, e.target.value)} />
                          </div>
                          {pkg.features.length > 1 && (
                            <button type="button" className="es-pkg-remove-feat" onClick={() => removeFeature(index, fi)}>×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="es-add-feat-btn" onClick={() => addFeature(index)}>+ Add feature</button>
                    </div>
                  ))}
                  {packages.length < 4 && (
                    <button type="button" onClick={addPackage} className="es-add-pkg-btn">+ Add Package</button>
                  )}
                </div>
              )}

              {existingImages.length > 0 && (
                <div className="es-field">
                  <label className="es-label">
                    Current Portfolio Images
                    <span className="es-label-sub"> — click × to remove</span>
                  </label>
                  <div className="es-img-grid">
                    {existingImages.map((url, i) => (
                      <div
                        key={i}
                        className={`es-img-thumb ${activePreview === url ? "es-img-thumb-active" : ""}`}
                        onClick={() => setActivePreview(url)}
                      >
                        <img src={url} alt={`img-${i}`} />
                        <button className="es-img-remove" onClick={(e) => { e.stopPropagation(); removeExistingImage(url); }} title="Remove image">×</button>
                        {i === 0 && <span className="es-img-cover-badge">Cover</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="es-field">
                <label className="es-label">
                  {existingImages.length > 0 ? "Add More Images" : "Portfolio Images"}
                  <span className="es-label-sub"> (up to {15 - existingImages.length} more)</span>
                </label>

                {newPreviews.length > 0 && (
                  <div className="es-img-grid" style={{ marginBottom: 10 }}>
                    {newPreviews.map((url, i) => (
                      <div
                        key={i}
                        className={`es-img-thumb ${activePreview === url ? "es-img-thumb-active" : ""}`}
                        onClick={() => setActivePreview(url)}
                      >
                        <img src={url} alt={`new-${i}`} />
                        <button className="es-img-remove" onClick={(e) => { e.stopPropagation(); removeNewImage(i); }} title="Remove image">×</button>
                        <span className="es-img-new-badge">New</span>
                      </div>
                    ))}
                  </div>
                )}

                {existingImages.length + newImages.length < 15 && (
                  <div
                    className={`es-upload-zone ${newPreviews.length > 0 ? "es-upload-zone-compact" : ""} ${dragging ? "dragging" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                  >
                    {newPreviews.length === 0 && (
                      <div className="es-upload-icon-wrap">
                        <span className="es-upload-icon">⊕</span>
                      </div>
                    )}
                    {newPreviews.length === 0 && <p className="es-upload-title">Drag & drop portfolio images</p>}
                    <p className="es-upload-sub">JPG, PNG, WEBP</p>
                    <label className="es-upload-label">
                      Browse Files
                      <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => addNewImages(e.target.files)} />
                    </label>
                    {newImages.length > 0 && (
                      <p className="es-upload-count">✓ {newImages.length} new image{newImages.length !== 1 ? "s" : ""} added</p>
                    )}
                  </div>
                )}

                {(existingImages.length > 0 || newPreviews.length > 0) && (
                  <p className="es-img-hint">
                    First image is used as the cover photo.
                    <span className="es-img-count"> {existingImages.length + newImages.length}/15 total</span>
                  </p>
                )}
              </div>

              {error && <div className="es-error">⚠ {error}</div>}

              <div className="es-actions">
                {/* ✅ FIX 3: Cancel goes to /vendor-dashboard */}
                <button className="es-btn-ghost-full" onClick={() => navigate("/vendor-dashboard")} disabled={saving}>Cancel</button>
                <button
                  className={`es-submit ${saving ? "loading" : ""}`}
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? <><span className="es-spinner" /> Saving Changes…</> : "Save Changes →"}
                </button>
              </div>

              <p className="es-terms">
                By updating this service you agree to our{" "}
                <a href="#" className="es-link">Vendor Terms</a> and{" "}
                <a href="#" className="es-link">Content Policy</a>.
              </p>
            </div>

            {/* ── RIGHT — LIVE PREVIEW ── */}
            <div className="es-preview-col">
              <div className="es-preview-sticky">
                <p className="es-preview-label">Live Preview</p>
                <div className="es-preview-card">
                  <div className="es-preview-img">
                    {activePreview ? (
                      <img src={activePreview} alt="preview" onError={() => setActivePreview("")} />
                    ) : (
                      <div className="es-preview-placeholder">
                        <span>{selectedType?.emoji}</span>
                        <p>No image selected</p>
                      </div>
                    )}
                    <span className="es-preview-badge">{selectedType?.label}</span>
                    {allPreviews.length > 1 && (
                      <span className="es-preview-count">{allPreviews.length} photos</span>
                    )}
                  </div>
                  <div className="es-preview-body">
                    <h3 className="es-preview-title">{form.title || "Your Service Title"}</h3>

                    {form.locations.length > 0 ? (
                      <div className="es-preview-loc-wrap">
                        {form.locations.map((loc) => (
                          <span key={loc} className="es-preview-loc-pill">◉ {loc}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="es-preview-loc">◉ Location</p>
                    )}

                    <p className="es-preview-desc">{form.description || "Your service description will appear here…"}</p>

                    {isDecor && selectedSlots.length > 0 && (
                      <div className="es-preview-slots">
                        <span className="es-preview-slots-label">Available Slots</span>
                        <div className="es-preview-slots-list">
                          {selectedSlots.map((s) => (
                            <span key={s} className="es-preview-slot-pill">
                              {s === "Custom" && customSlot ? customSlot : s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isDecor && packages.length > 0 && (
                      <div className="es-preview-pkgs">
                        {packages.map((pkg, i) => (
                          <div key={i} className="es-preview-pkg-pill">
                            <span className="es-preview-pkg-name">{pkg.name || TIER_LABELS[i]}</span>
                            <span className="es-preview-pkg-price">
                              {pkg.price ? `₹${Number(pkg.price).toLocaleString()}` : "₹ —"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="es-preview-footer">
                      <div>
                        <span className="es-preview-from">Starting at</span>
                        <span className="es-preview-price">{previewPrice}</span>
                      </div>
                      <span className="es-preview-btn">View →</span>
                    </div>
                  </div>
                </div>

                {allPreviews.length > 1 && (
                  <div className="es-preview-strip">
                    {allPreviews.slice(0, 5).map((url, i) => (
                      <div
                        key={i}
                        className={`es-strip-thumb ${activePreview === url ? "active" : ""}`}
                        onClick={() => setActivePreview(url)}
                      >
                        <img src={url} alt="" />
                      </div>
                    ))}
                    {allPreviews.length > 5 && (
                      <div className="es-strip-more">+{allPreviews.length - 5}</div>
                    )}
                  </div>
                )}
                <p className="es-preview-note">This is how clients will see your listing.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── STYLES (unchanged from original) ─────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --muted: #7a7265; --border: rgba(201,168,76,0.2); --surface: #faf7f2; --white: #ffffff;
  }

  .es-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }
  .es-body { width: 100%; max-width: 1200px; margin: 0 auto; padding: 48px 32px 80px; }

  .es-loading { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: var(--muted); font-size: 13px; letter-spacing: 0.1em; }
  .es-load-spinner { width: 36px; height: 36px; border: 2px solid var(--border); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.9s linear infinite; }

  .es-layout { display: grid; grid-template-columns: 1fr 380px; gap: 48px; align-items: start; }
  @media (max-width: 1024px) { .es-layout { grid-template-columns: 1fr 320px; gap: 32px; } .es-body { padding: 36px 24px 70px; } }
  @media (max-width: 768px)  { .es-layout { grid-template-columns: 1fr; gap: 0; } .es-body { padding: 24px 16px 60px; } .es-preview-col { order: -1; margin-bottom: 28px; } }
  @media (max-width: 480px)  { .es-body { padding: 16px 12px 52px; } }

  .es-form-header { margin-bottom: 36px; animation: fadeUp 0.5s ease both; }
  @media (max-width: 768px) { .es-form-header { margin-bottom: 24px; } }
  .es-back { display: inline-block; font-size: 12px; color: var(--muted); background: none; border: none; cursor: pointer; margin-bottom: 20px; transition: color 0.2s; letter-spacing: 0.04em; font-family: 'DM Sans', sans-serif; padding: 0; -webkit-tap-highlight-color: transparent; }
  .es-back:hover { color: var(--gold); }
  .es-eyebrow { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .es-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.7rem, 4vw, 2.6rem); font-weight: 300; color: var(--ink); margin-bottom: 8px; line-height: 1.15; }
  .es-subtitle { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

  .es-field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 22px; animation: fadeUp 0.5s ease both; }
  @media (max-width: 768px) { .es-field { margin-bottom: 18px; } }
  .es-label { font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted); }
  .es-label-sub { font-size: 10px; letter-spacing: 0.05em; text-transform: none; color: var(--muted); opacity: 0.75; }
  .es-input-wrap { display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 7px; padding: 11px 14px; background: var(--white); transition: border-color 0.2s, box-shadow 0.2s; }
  .es-input-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .es-icon { font-size: 13px; color: var(--gold); opacity: 0.85; flex-shrink: 0; }
  .es-input-wrap input { border: none; background: transparent; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); width: 100%; -webkit-appearance: none; }
  @media (max-width: 480px) { .es-input-wrap input { font-size: 16px; } }
  .es-input-wrap input::placeholder { color: #bbb4a8; }
  .es-textarea-wrap { border: 1px solid var(--border); border-radius: 7px; background: var(--white); transition: border-color 0.2s, box-shadow 0.2s; overflow: hidden; }
  .es-textarea-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .es-textarea-wrap textarea { width: 100%; padding: 12px 14px; border: none; outline: none; resize: vertical; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); background: transparent; line-height: 1.6; min-height: 100px; -webkit-appearance: none; }
  @media (max-width: 480px) { .es-textarea-wrap textarea { font-size: 16px; } }
  .es-textarea-wrap textarea::placeholder { color: #bbb4a8; }
  .es-char-count { font-size: 11px; color: var(--muted); text-align: right; }

  .es-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  @media (max-width: 580px) { .es-type-grid { grid-template-columns: repeat(2, 1fr); gap: 7px; } }
  .es-type-btn { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--white); cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--muted); transition: all 0.2s; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  @media (max-width: 480px) { .es-type-btn { padding: 12px 8px; } }
  .es-type-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--ink); }
  .es-type-btn.active { border-color: var(--gold); background: linear-gradient(135deg, #faf7f0, #fff8e8); color: var(--ink); font-weight: 500; box-shadow: 0 2px 12px rgba(201,168,76,0.15); }
  .es-type-btn-soon { border-style: dashed; opacity: 0.72; cursor: not-allowed !important; }
  .es-type-emoji { font-size: 1.4rem; }
  @media (max-width: 480px) { .es-type-emoji { font-size: 1.2rem; } }
  .es-type-label { font-size: 11.5px; }
  .es-type-soon-tag { position: absolute; top: 6px; right: 6px; font-size: 8.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; background: rgba(201,168,76,0.12); color: var(--gold); border: 1px solid rgba(201,168,76,0.3); padding: 1.5px 6px; border-radius: 20px; }

  .es-loc-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 4px; }
  .es-loc-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px 6px 12px; background: linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04)); border: 1px solid rgba(201,168,76,0.35); border-radius: 20px; font-size: 12.5px; color: var(--ink); font-weight: 500; animation: tagIn 0.2s cubic-bezier(0.175,0.885,0.32,1.275) both; }
  @media (max-width: 480px) { .es-loc-tag { font-size: 12px; padding: 5px 7px 5px 10px; } }
  .es-loc-tag-dot { font-size: 10px; color: var(--gold); line-height: 1; }
  .es-loc-tag-remove { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 16px; line-height: 1; width: 20px; height: 20px; border-radius: 50%; transition: color 0.18s, background 0.18s; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  .es-loc-tag-remove:hover { color: #b85c5c; background: rgba(184,92,92,0.1); }

  .es-loc-trigger { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border: 1.5px dashed rgba(201,168,76,0.4); border-radius: 8px; background: var(--white); cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--muted); transition: all 0.2s; text-align: left; width: 100%; -webkit-tap-highlight-color: transparent; touch-action: manipulation; min-height: 50px; }
  .es-loc-trigger:hover:not(:disabled) { border-color: var(--gold); color: var(--ink); background: rgba(201,168,76,0.03); box-shadow: 0 2px 10px rgba(201,168,76,0.1); }
  .es-loc-trigger-full { opacity: 0.55; cursor: not-allowed; }
  .es-loc-trigger-icon { font-size: 11px; color: var(--gold); flex-shrink: 0; }
  .es-loc-trigger-text { flex: 1; }
  .es-loc-trigger-arrow { font-size: 16px; color: var(--gold); flex-shrink: 0; font-weight: 300; }
  .es-loc-hint { font-size: 11px; color: var(--muted); line-height: 1.5; }

  .es-city-overlay { position: fixed; inset: 0; background: rgba(14,12,10,0.55); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); display: flex; align-items: flex-end; justify-content: center; z-index: 2000; padding: 0; animation: overlayIn 0.25s ease both; }
  @media (min-width: 600px) { .es-city-overlay { align-items: center; padding: 20px; } }
  .es-city-toast { background: var(--white); border: 1px solid rgba(201,168,76,0.2); border-radius: 20px 20px 0 0; width: 100%; max-width: 520px; display: flex; flex-direction: column; max-height: 88vh; box-shadow: 0 -8px 40px rgba(14,12,10,0.15), 0 -2px 12px rgba(201,168,76,0.1); animation: toastUp 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both; overflow: hidden; }
  @media (min-width: 600px) { .es-city-toast { border-radius: 20px; max-height: 80vh; box-shadow: 0 24px 64px rgba(14,12,10,0.18), 0 4px 16px rgba(201,168,76,0.1); animation: modalIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both; } }
  .es-city-toast-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 20px 0; flex-shrink: 0; }
  @media (max-width: 480px) { .es-city-toast-header { padding: 18px 16px 0; } }
  .es-city-toast-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 4px; }
  .es-city-toast-title { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 300; color: var(--ink); line-height: 1.1; }
  .es-city-toast-close { width: 32px; height: 32px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--muted); cursor: pointer; transition: all 0.18s; flex-shrink: 0; margin-top: 2px; font-family: 'DM Sans', sans-serif; line-height: 1; -webkit-tap-highlight-color: transparent; }
  .es-city-toast-close:hover { background: rgba(184,92,92,0.08); color: #b85c5c; border-color: rgba(184,92,92,0.2); }
  .es-city-toast-selected { padding: 14px 20px 0; flex-shrink: 0; }
  @media (max-width: 480px) { .es-city-toast-selected { padding: 12px 16px 0; } }
  .es-city-toast-selected-label { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; display: block; }
  .es-city-toast-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .es-city-toast-tag { display: inline-flex; align-items: center; gap: 5px; padding: 5px 7px 5px 10px; background: linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04)); border: 1px solid rgba(201,168,76,0.35); border-radius: 20px; font-size: 12px; color: var(--ink); font-weight: 500; animation: tagIn 0.18s cubic-bezier(0.175,0.885,0.32,1.275) both; }
  .es-city-toast-tag-dot { font-size: 9px; color: var(--gold); }
  .es-city-toast-tag-remove { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 15px; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: color 0.15s, background 0.15s; flex-shrink: 0; padding: 0; font-family: 'DM Sans', sans-serif; line-height: 1; -webkit-tap-highlight-color: transparent; }
  .es-city-toast-tag-remove:hover { color: #b85c5c; background: rgba(184,92,92,0.1); }
  .es-city-toast-search-wrap { display: flex; align-items: center; gap: 10px; margin: 14px 20px 0; border: 1.5px solid rgba(201,168,76,0.3); border-radius: 10px; padding: 11px 14px; background: var(--surface); transition: border-color 0.2s, box-shadow 0.2s; flex-shrink: 0; }
  @media (max-width: 480px) { .es-city-toast-search-wrap { margin: 12px 16px 0; } }
  .es-city-toast-search-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); background: var(--white); }
  .es-city-toast-search-icon { font-size: 16px; color: var(--gold); opacity: 0.7; flex-shrink: 0; }
  .es-city-toast-search { flex: 1; border: none; outline: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); -webkit-appearance: none; }
  @media (max-width: 480px) { .es-city-toast-search { font-size: 16px; } }
  .es-city-toast-search::placeholder { color: #bbb4a8; }
  .es-city-toast-search-clear { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 18px; padding: 0 2px; display: flex; align-items: center; transition: color 0.15s; flex-shrink: 0; font-family: 'DM Sans', sans-serif; line-height: 1; }
  .es-city-toast-search-clear:hover { color: #b85c5c; }
  .es-city-toast-list { flex: 1; overflow-y: auto; padding: 8px 12px; margin-top: 10px; scrollbar-width: thin; scrollbar-color: rgba(201,168,76,0.3) transparent; }
  @media (max-width: 480px) { .es-city-toast-list { padding: 8px 8px; } }
  .es-city-toast-list::-webkit-scrollbar { width: 5px; }
  .es-city-toast-list::-webkit-scrollbar-track { background: transparent; }
  .es-city-toast-list::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 10px; }
  .es-city-toast-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 12px; border: none; border-radius: 8px; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); cursor: pointer; text-align: left; transition: background 0.12s; margin-bottom: 2px; -webkit-tap-highlight-color: transparent; min-height: 44px; }
  .es-city-toast-item:hover { background: rgba(201,168,76,0.07); }
  .es-city-toast-item.selected { background: rgba(201,168,76,0.1); font-weight: 500; }
  .es-city-toast-item.disabled { opacity: 0.35; cursor: not-allowed; }
  .es-city-toast-item-dot { font-size: 9px; color: var(--gold); flex-shrink: 0; }
  .es-city-toast-item.selected .es-city-toast-item-dot { color: #2d6a4f; }
  .es-city-toast-item-name { flex: 1; }
  .es-city-toast-item-check { font-size: 12px; color: #2d6a4f; font-weight: 700; flex-shrink: 0; }
  .es-city-toast-empty { display: flex; align-items: center; gap: 10px; padding: 20px 12px; font-size: 13px; color: var(--muted); justify-content: center; }
  .es-city-toast-footer { padding: 12px 20px 20px; border-top: 1px solid var(--border); flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; }
  @media (max-width: 480px) { .es-city-toast-footer { padding: 10px 16px 24px; } }
  .es-city-toast-max-note { font-size: 11.5px; color: var(--gold); text-align: center; font-weight: 500; }
  .es-city-toast-done { width: 100%; padding: 15px; background: var(--ink); color: var(--white); border: none; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; cursor: pointer; transition: all 0.22s ease; min-height: 52px; -webkit-tap-highlight-color: transparent; }
  .es-city-toast-done:hover { background: var(--gold); color: var(--ink); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(201,168,76,0.3); }

  .es-slot-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 4px; }
  @media (max-width: 480px) { .es-slot-grid { grid-template-columns: 1fr; gap: 7px; } }
  .es-slot-btn { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--white); cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted); transition: all 0.2s; text-align: left; -webkit-tap-highlight-color: transparent; touch-action: manipulation; min-height: 48px; }
  @media (max-width: 480px) { .es-slot-btn { padding: 11px 14px; } }
  .es-slot-btn:hover { border-color: var(--gold); color: var(--ink); background: rgba(201,168,76,0.02); }
  .es-slot-btn-active { border-color: var(--gold); background: linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03)); color: var(--ink); font-weight: 500; box-shadow: 0 2px 10px rgba(201,168,76,0.12); }
  .es-slot-check { width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid rgba(201,168,76,0.4); background: transparent; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--gold); flex-shrink: 0; transition: all 0.2s; }
  .es-slot-btn-active .es-slot-check { background: var(--gold); border-color: var(--gold); color: white; font-weight: 700; }
  .es-slot-label { flex: 1; }
  .es-slot-price-row { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding: 14px 16px; background: var(--white); border: 1px solid var(--border); border-radius: 8px; flex-wrap: wrap; }
  @media (max-width: 480px) { .es-slot-price-row { flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 14px; } }
  .es-slot-price-label { font-size: 12px; font-weight: 500; color: var(--muted); white-space: nowrap; letter-spacing: 0.04em; }
  .es-slot-price-row .es-input-wrap { border: none; padding: 0; box-shadow: none; background: transparent; }
  .es-slot-price-row .es-input-wrap:focus-within { box-shadow: none; }

  .es-pkg-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 14px; transition: border-color 0.2s, box-shadow 0.2s; animation: fadeUp 0.3s ease both; }
  @media (max-width: 480px) { .es-pkg-card { padding: 16px; } }
  .es-pkg-card:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.08); }
  .es-pkg-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .es-pkg-tier { font-size: 10px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); background: rgba(201,168,76,0.08); border: 1px solid var(--border); padding: 3px 10px; border-radius: 20px; }
  .es-pkg-remove { background: none; border: none; cursor: pointer; color: #ccc; font-size: 20px; line-height: 1; padding: 2px 6px; border-radius: 4px; transition: color 0.2s; font-family: 'DM Sans', sans-serif; min-width: 32px; min-height: 32px; display: flex; align-items: center; justify-content: center; }
  .es-pkg-remove:hover { color: #b85c5c; }
  .es-pkg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  @media (max-width: 480px) { .es-pkg-row { grid-template-columns: 1fr; gap: 10px; } }
  .es-pkg-features-label { font-size: 10.5px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .es-pkg-feature-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
  .es-pkg-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); opacity: 0.55; flex-shrink: 0; }
  .es-pkg-remove-feat { background: none; border: none; cursor: pointer; color: #ccc; font-size: 16px; line-height: 1; padding: 0 4px; transition: color 0.2s; flex-shrink: 0; font-family: 'DM Sans', sans-serif; min-width: 28px; min-height: 28px; display: flex; align-items: center; justify-content: center; }
  .es-pkg-remove-feat:hover { color: #b85c5c; }
  .es-add-feat-btn { background: none; border: none; cursor: pointer; color: var(--gold); font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; padding: 6px 0 0; letter-spacing: 0.03em; transition: opacity 0.2s; text-align: left; -webkit-tap-highlight-color: transparent; }
  .es-add-feat-btn:hover { opacity: 0.7; }
  .es-add-pkg-btn { width: 100%; padding: 14px; background: none; border: 1px dashed rgba(201,168,76,0.4); border-radius: 10px; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; letter-spacing: 0.03em; margin-top: 2px; min-height: 52px; -webkit-tap-highlight-color: transparent; }
  .es-add-pkg-btn:hover { border-color: var(--gold); color: var(--ink); background: rgba(201,168,76,0.04); }

  .es-img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 10px; }
  @media (max-width: 480px) { .es-img-grid { grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 8px; } }
  .es-img-thumb { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2px solid transparent; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
  .es-img-thumb:hover { border-color: rgba(201,168,76,0.5); }
  .es-img-thumb-active { border-color: var(--gold) !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.2); }
  .es-img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .es-img-remove { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; background: rgba(184,92,92,0.88); color: white; border: none; border-radius: 50%; font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; line-height: 1; transition: background 0.2s, transform 0.2s; font-family: 'DM Sans', sans-serif; }
  .es-img-remove:hover { background: #b85c5c; transform: scale(1.12); }
  .es-img-cover-badge { position: absolute; bottom: 4px; left: 4px; font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(14,12,10,0.72); color: var(--gold-light); padding: 2px 7px; border-radius: 20px; backdrop-filter: blur(4px); }
  .es-img-new-badge { position: absolute; bottom: 4px; left: 4px; font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(45,106,79,0.85); color: #d4f5e9; padding: 2px 7px; border-radius: 20px; backdrop-filter: blur(4px); }
  .es-img-hint { font-size: 11.5px; color: var(--muted); line-height: 1.5; }
  .es-img-count { color: var(--gold); font-weight: 500; }

  .es-upload-zone { border: 1.5px dashed rgba(201,168,76,0.4); border-radius: 12px; padding: 36px 20px; background: var(--white); text-align: center; transition: border-color 0.22s, background 0.22s, transform 0.15s; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  @media (max-width: 480px) { .es-upload-zone { padding: 28px 16px; border-radius: 10px; } }
  .es-upload-zone:hover { border-color: var(--gold); background: rgba(201,168,76,0.02); }
  .es-upload-zone.dragging { border-color: var(--gold); background: rgba(201,168,76,0.06); transform: scale(1.01); box-shadow: 0 0 0 4px rgba(201,168,76,0.1); }
  .es-upload-zone-compact { padding: 18px 20px; margin-top: 8px; flex-direction: row; justify-content: center; gap: 12px; background: var(--surface); }
  @media (max-width: 480px) { .es-upload-zone-compact { flex-wrap: wrap; padding: 14px; } }
  .es-upload-icon-wrap { width: 52px; height: 52px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; }
  .es-upload-icon { font-size: 1.6rem; color: var(--gold); }
  .es-upload-title { font-size: 14px; color: var(--ink); font-weight: 500; }
  .es-upload-sub { font-size: 12px; color: var(--muted); }
  .es-upload-label { display: inline-flex; align-items: center; padding: 9px 22px; background: var(--ink); color: var(--white); border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.2s; letter-spacing: 0.03em; -webkit-tap-highlight-color: transparent; min-height: 40px; }
  .es-upload-label:hover { background: var(--gold); color: var(--ink); }
  .es-upload-count { font-size: 12px; color: #2d6a4f; font-weight: 500; }

  .es-error { font-size: 12.5px; color: #b85c5c; background: rgba(184,92,92,0.07); border: 1px solid rgba(184,92,92,0.2); border-radius: 6px; padding: 10px 14px; margin-bottom: 18px; }

  .es-actions { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 14px; }
  @media (max-width: 480px) { .es-actions { grid-template-columns: 1fr 1.5fr; gap: 10px; } }
  .es-btn-ghost-full { padding: 16px; background: none; border: 1px solid var(--border); border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--muted); cursor: pointer; transition: all 0.2s; min-height: 52px; -webkit-tap-highlight-color: transparent; }
  .es-btn-ghost-full:hover:not(:disabled) { border-color: var(--gold); color: var(--ink); }
  .es-btn-ghost-full:disabled { opacity: 0.5; pointer-events: none; }
  .es-submit { padding: 16px; background: var(--ink); color: var(--white); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .es-submit:hover:not(:disabled) { background: var(--gold); color: var(--ink); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(201,168,76,0.3); }
  .es-submit.loading { opacity: 0.65; pointer-events: none; }
  .es-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  .es-terms { font-size: 11.5px; color: var(--muted); text-align: center; line-height: 1.6; }
  .es-link { color: var(--gold); text-decoration: none; font-weight: 500; }
  .es-link:hover { text-decoration: underline; }

  .es-preview-sticky { position: sticky; top: 88px; }
  @media (max-width: 768px) { .es-preview-sticky { position: static; } }
  .es-preview-label { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; }
  .es-preview-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(14,12,10,0.06); }
  .es-preview-img { position: relative; height: 200px; background: linear-gradient(135deg, #ede8e0, #e0d8cc); overflow: hidden; }
  @media (max-width: 768px) { .es-preview-img { height: 180px; } }
  .es-preview-img img { width: 100%; height: 100%; object-fit: cover; }
  .es-preview-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 2.5rem; color: var(--muted); }
  .es-preview-placeholder p { font-size: 12px; color: var(--muted); }
  .es-preview-badge { position: absolute; bottom: 10px; left: 10px; font-size: 10.5px; font-weight: 500; letter-spacing: 0.08em; background: rgba(14,12,10,0.65); backdrop-filter: blur(6px); color: var(--gold-light); padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(201,168,76,0.2); }
  .es-preview-count { position: absolute; bottom: 10px; right: 10px; font-size: 10px; font-weight: 500; background: rgba(14,12,10,0.65); backdrop-filter: blur(6px); color: var(--gold-light); padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(201,168,76,0.2); }
  .es-preview-body { padding: 18px 20px; }
  @media (max-width: 480px) { .es-preview-body { padding: 14px 16px; } }
  .es-preview-title { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink); margin-bottom: 7px; min-height: 1.5em; }
  .es-preview-loc { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
  .es-preview-loc-wrap { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
  .es-preview-loc-pill { font-size: 11px; color: var(--muted); background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 3px 9px; font-weight: 500; white-space: nowrap; }
  .es-preview-desc { font-size: 12.5px; color: var(--muted); line-height: 1.6; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; min-height: 3em; }
  .es-preview-slots { margin-bottom: 14px; }
  .es-preview-slots-label { font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 6px; }
  .es-preview-slots-list { display: flex; flex-wrap: wrap; gap: 5px; }
  .es-preview-slot-pill { font-size: 11px; color: var(--ink); background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 3px 10px; font-weight: 500; }
  .es-preview-pkgs { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .es-preview-pkg-pill { display: flex; justify-content: space-between; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 7px 12px; }
  .es-preview-pkg-name { font-size: 11.5px; font-weight: 500; color: var(--ink); letter-spacing: 0.03em; }
  .es-preview-pkg-price { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 600; color: var(--gold); }
  .es-preview-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 14px; }
  .es-preview-from { display: block; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .es-preview-price { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink); }
  .es-preview-btn { padding: 8px 16px; background: var(--ink); color: var(--white); border-radius: 6px; font-size: 12px; font-weight: 500; }
  .es-preview-strip { display: flex; gap: 6px; margin-top: 10px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .es-preview-strip::-webkit-scrollbar { display: none; }
  .es-strip-thumb { width: 52px; height: 52px; flex-shrink: 0; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; }
  .es-strip-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .es-strip-thumb.active { border-color: var(--gold); }
  .es-strip-thumb:hover { border-color: rgba(201,168,76,0.5); }
  .es-strip-more { width: 52px; height: 52px; flex-shrink: 0; border-radius: 6px; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--muted); font-weight: 500; }
  .es-preview-note { font-size: 11px; color: var(--muted); text-align: center; margin-top: 10px; }

  .es-modal-overlay { position: fixed; inset: 0; background: rgba(14,12,10,0.6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; animation: overlayIn 0.3s ease both; }
  .es-modal { position: relative; overflow: hidden; background: var(--white); border: 1px solid rgba(201,168,76,0.25); border-radius: 24px; padding: 48px 40px 40px; width: 100%; max-width: 440px; box-shadow: 0 32px 80px rgba(14,12,10,0.2), 0 8px 24px rgba(201,168,76,0.1); animation: modalIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both; display: flex; flex-direction: column; align-items: center; gap: 0; max-height: 90vh; overflow-y: auto; }
  @media (max-width: 480px) { .es-modal { padding: 32px 20px 28px; border-radius: 18px; } }
  .es-modal-orb { position: absolute; width: 280px; height: 280px; border-radius: 50%; background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%); top: -100px; right: -60px; pointer-events: none; }
  .es-modal-orb-2 { width: 180px; height: 180px; bottom: -50px; left: -40px; top: auto; right: auto; background: radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%); }
  .es-modal-icon-ring { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; animation: popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both; animation-delay: 0.1s; }
  .es-modal-icon-inner { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, rgba(45,106,79,0.12), rgba(45,106,79,0.05)); border: 1.5px solid rgba(45,106,79,0.3); display: flex; align-items: center; justify-content: center; color: #2d6a4f; position: relative; z-index: 1; box-shadow: 0 8px 24px rgba(45,106,79,0.15); }
  .es-modal-ring-pulse { position: absolute; inset: -8px; border-radius: 50%; border: 1px solid rgba(45,106,79,0.2); animation: ringPulse 2.5s ease-in-out infinite; }
  .es-modal-tag { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px; animation: fadeUp 0.4s ease both; animation-delay: 0.15s; }
  .es-modal-tag-live { color: #2d6a4f; background: rgba(45,106,79,0.08); border: 1px solid rgba(45,106,79,0.25); }
  .es-modal-heading { font-family: 'Cormorant Garamond', serif; font-size: 1.9rem; font-weight: 300; color: var(--ink); line-height: 1.1; margin-bottom: 10px; text-align: center; animation: fadeUp 0.4s ease both; animation-delay: 0.2s; }
  .es-modal-subtext { font-size: 13px; color: var(--muted); line-height: 1.65; text-align: center; margin-bottom: 22px; animation: fadeUp 0.4s ease both; animation-delay: 0.25s; }
  .es-modal-live-card { width: 100%; background: linear-gradient(135deg, rgba(45,106,79,0.05), rgba(45,106,79,0.02)); border: 1px solid rgba(45,106,79,0.18); border-radius: 10px; padding: 6px 4px; margin-bottom: 20px; display: flex; flex-direction: column; animation: fadeUp 0.4s ease both; animation-delay: 0.3s; }
  .es-modal-live-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 7px; }
  .es-modal-live-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .es-modal-live-dot-green { background: #2d6a4f; box-shadow: 0 0 0 3px rgba(45,106,79,0.15); }
  .es-modal-live-label { flex: 1; font-size: 13px; color: var(--ink); font-weight: 500; }
  .es-modal-live-check { font-size: 13px; color: #2d6a4f; font-weight: 700; flex-shrink: 0; }
  .es-modal-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; animation: fadeUp 0.4s ease both; animation-delay: 0.35s; }
  .es-modal-btn-primary { width: 100%; padding: 15px; background: var(--ink); color: var(--white); border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; cursor: pointer; transition: all 0.25s ease; min-height: 52px; -webkit-tap-highlight-color: transparent; }
  .es-modal-btn-primary:hover { background: var(--gold); color: var(--ink); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(201,168,76,0.3); }
  .es-modal-btn-ghost { width: 100%; padding: 13px; background: none; color: var(--muted); border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; min-height: 48px; -webkit-tap-highlight-color: transparent; }
  .es-modal-btn-ghost:hover { border-color: var(--gold); color: var(--ink); }

  @keyframes overlayIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalIn    { from { opacity: 0; transform: scale(0.88) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes toastUp    { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
  @keyframes ringPulse  { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0; transform: scale(1.5); } }
  @keyframes fadeUp     { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin       { to { transform: rotate(360deg); } }
  @keyframes popIn      { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes tagIn      { from { opacity: 0; transform: scale(0.75); } to { opacity: 1; transform: scale(1); } }
`;