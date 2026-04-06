import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

const SERVICE_TYPES = [
  { value: "decor",       label: "Decor",                    emoji: "🎨" },
  { value: "photography", label: "Photography",              emoji: "📸" },
  { value: "catering",    label: "Catering coming soon..",   emoji: "🍽⌛" },
  { value: "music",       label: "Music & DJ coming soon..", emoji: "🎵⌛" },
  { value: "florals",     label: "Florals coming soon..",    emoji: "💐⌛" },
  { value: "venues",      label: "Venues coming soon..",     emoji: "🏛⌛" },
];

const TIER_LABELS = ["Basic", "Standard", "Premium", "Ultra Premium"];

export default function AddService() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    serviceType: "decor",
    title: "",
    description: "",
    location: "",
  });

  const [packages, setPackages] = useState([{ name: "Basic", price: "", features: [""] }]);
  const [images,   setImages]   = useState([]);        // File objects
  const [previews, setPreviews] = useState([]);        // Object URLs for display
  const [activePreview, setActivePreview] = useState(null);
  const [dragging,  setDragging]  = useState(false);

  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Package helpers ────────────────────────────────────────────
  const addPackage = () => {
    if (packages.length >= 4) return;
    setPackages([...packages, { name: TIER_LABELS[packages.length] || "", price: "", features: [""] }]);
  };
  const removePackage = (i) => setPackages(packages.filter((_, idx) => idx !== i));
  const updatePackage = (i, field, val) => {
    const u = [...packages]; u[i][field] = val; setPackages(u);
  };
  const addFeature    = (pi) => { const u = [...packages]; u[pi].features.push(""); setPackages(u); };
  const removeFeature = (pi, fi) => { const u = [...packages]; u[pi].features.splice(fi, 1); setPackages(u); };
  const updateFeature = (pi, fi, val) => { const u = [...packages]; u[pi].features[fi] = val; setPackages(u); };

  // ── Image helpers ──────────────────────────────────────────────
  const addImages = (files) => {
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 15 - images.length);
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
    if (activePreview === previews[i]) {
      setActivePreview(newPreviews[0] || null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addImages(e.dataTransfer.files);
  };

  // ── Validation ─────────────────────────────────────────────────
  const validate = () => {
    if (!form.title.trim())       return "Please enter a service title.";
    if (!form.description.trim()) return "Please add a description.";
    if (!form.location.trim())    return "Please enter a location.";
    if (packages.length === 0)    return "Add at least one package.";
    for (let i = 0; i < packages.length; i++) {
      if (!packages[i].price) return `Please enter a price for the ${TIER_LABELS[i] || `Package ${i + 1}`} package.`;
    }
    return null;
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setSaving(true);

    const token = localStorage.getItem("token");
    const data  = new FormData();
    data.append("serviceType",  form.serviceType);
    data.append("title",        form.title);
    data.append("description",  form.description);
    data.append("location",     form.location);
    data.append("packages",     JSON.stringify(packages));
    images.forEach((img) => data.append("images", img));

    try {
      await API.post("/vendors", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
    } catch (e) {
      console.error("Add error:", e.response?.data);
      setError(e.response?.data?.error || "Failed to publish service. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedType = SERVICE_TYPES.find((t) => t.value === form.serviceType);

  return (
    <>
      <style>{styles}</style>
      <div className="as-root">
        <Navbar />
        <div className="as-body">

          {success ? (
            // ── SUCCESS STATE ─────────────────────────────────────
            <div className="as-success-screen">
              <div className="as-success-icon">✓</div>
              <h2>Service Published!</h2>
              <p>Your listing is now live and visible to clients browsing the platform.</p>
              <div className="as-success-btns">
                <a href="/dashboard" className="as-btn-primary">Go to Dashboard →</a>
                <button className="as-btn-ghost" onClick={() => { setSuccess(false); setForm({ serviceType:"decor", title:"", description:"", location:"" }); setPackages([{name:"Basic",price:"",features:[""]}]); setImages([]); setPreviews([]); setActivePreview(null); }}>
                  Add Another
                </button>
              </div>
            </div>
          ) : (
            <div className="as-layout">

              {/* ── LEFT COLUMN — FORM ── */}
              <div className="as-form-col">
                <div className="as-form-header">
                  <a href="/dashboard" className="as-back">← Back to Dashboard</a>
                  <p className="as-eyebrow">✦ Vendor Portal</p>
                  <h1 className="as-title">Add New Service</h1>
                  <p className="as-subtitle">Fill in your listing details. Your service goes live immediately after publishing.</p>
                </div>

                {/* SERVICE TYPE */}
                <div className="as-field">
                  <label className="as-label">Service Category</label>
                  <div className="as-type-grid">
                    {SERVICE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        className={`as-type-btn ${form.serviceType === t.value ? "active" : ""}`}
                        onClick={() => set("serviceType", t.value)}
                      >
                        <span className="as-type-emoji">{t.emoji}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

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

                {/* LOCATION */}
                <div className="as-field">
                  <label className="as-label">Location</label>
                  <div className="as-input-wrap">
                    <span className="as-icon">◉</span>
                    <input
                      placeholder="e.g. Delhi, Mumbai…"
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                    />
                  </div>
                </div>

                {/* ── PACKAGES ── */}
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

                {/* ── PORTFOLIO IMAGES ── */}
                <div className="as-field">
                  <label className="as-label">
                    Portfolio Images
                    <span className="as-label-sub"> (up to 15 photos)</span>
                  </label>

                  {/* Image preview grid — shown when images are selected */}
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

                      {/* Add more inline tile */}
                      {previews.length < 15 && (
                        <label className="as-img-add-tile">
                          <span className="as-img-add-icon">+</span>
                          <span className="as-img-add-text">Add more</span>
                          <input
                            type="file" multiple accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => addImages(e.target.files)}
                          />
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

                  {/* Upload zone — always visible if under limit */}
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
                        <input
                          type="file" multiple accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => addImages(e.target.files)}
                        />
                      </label>
                    </div>
                  )}

                  {/* Compact add-more zone when some images already chosen */}
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
                        <input
                          type="file" multiple accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => addImages(e.target.files)}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {error && <div className="as-error">⚠ {error}</div>}

                {/* ACTIONS */}
                <div className="as-actions">
                  <button className="as-btn-ghost-full" onClick={() => navigate("/dashboard")} disabled={saving}>
                    Cancel
                  </button>
                  <button
                    className={`as-submit ${saving ? "loading" : ""}`}
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving
                      ? <><span className="as-spinner" /> Publishing…</>
                      : "Publish Service →"}
                  </button>
                </div>

                <p className="as-terms">
                  By publishing you agree to our{" "}
                  <a href="#" className="as-link">Vendor Terms</a> and{" "}
                  <a href="#" className="as-link">Content Policy</a>.
                </p>
              </div>

              {/* ── RIGHT COLUMN — LIVE PREVIEW ── */}
              <div className="as-preview-col">
                <div className="as-preview-sticky">
                  <p className="as-preview-label">✦ Live Preview</p>
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
                      <h3 className="as-preview-title">
                        {form.title || "Your Service Title"}
                      </h3>
                      <p className="as-preview-loc">
                        {form.location ? `◉ ${form.location}` : "◉ Location"}
                      </p>
                      <p className="as-preview-desc">
                        {form.description || "Your service description will appear here…"}
                      </p>
                      {packages.length > 0 && (
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
                          <span className="as-preview-price">
                            {packages[0]?.price
                              ? `₹${Number(packages[0].price).toLocaleString()}`
                              : "₹ —"}
                          </span>
                        </div>
                        <span className="as-preview-btn">View →</span>
                      </div>
                    </div>
                  </div>

                  {/* Image strip */}
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

            </div>
          )}
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
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --muted: #7a7265;
    --border: rgba(201,168,76,0.2);
    --surface: #faf7f2;
    --white: #ffffff;
  }

  .as-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  .as-body {
    max-width: 1100px;
    margin: 0 auto;
    padding: 48px 32px 80px;
  }

  /* ── LAYOUT ── */
  .as-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 48px;
    align-items: start;
  }
  @media (max-width: 960px) {
    .as-layout { grid-template-columns: 1fr; }
    .as-preview-col { order: -1; }
  }

  /* ── FORM HEADER ── */
  .as-form-header { margin-bottom: 36px; animation: fadeUp 0.5s ease both; }
  .as-back {
    display: inline-block; font-size: 12px; color: var(--muted);
    text-decoration: none; margin-bottom: 20px;
    transition: color 0.2s; letter-spacing: 0.04em;
  }
  .as-back:hover { color: var(--gold); }
  .as-eyebrow {
    font-size: 11px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 8px;
  }
  .as-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.9rem, 3.5vw, 2.6rem);
    font-weight: 300; color: var(--ink); margin-bottom: 8px; line-height: 1.15;
  }
  .as-subtitle { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

  /* ── FIELDS ── */
  .as-field {
    display: flex; flex-direction: column; gap: 7px;
    margin-bottom: 22px; animation: fadeUp 0.5s ease both;
  }
  .as-label {
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted);
  }
  .as-label-sub {
    font-size: 10px; letter-spacing: 0.05em;
    text-transform: none; color: var(--muted); opacity: 0.75;
  }
  .as-input-wrap {
    display: flex; align-items: center; gap: 10px;
    border: 1px solid var(--border); border-radius: 7px;
    padding: 11px 14px; background: var(--white);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .as-input-wrap:focus-within {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }
  .as-icon { font-size: 13px; color: var(--gold); opacity: 0.85; flex-shrink: 0; }
  .as-input-wrap input {
    border: none; background: transparent; outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--ink); width: 100%;
  }
  .as-input-wrap input::placeholder { color: #bbb4a8; }
  .as-textarea-wrap {
    border: 1px solid var(--border); border-radius: 7px;
    background: var(--white); transition: border-color 0.2s, box-shadow 0.2s; overflow: hidden;
  }
  .as-textarea-wrap:focus-within {
    border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }
  .as-textarea-wrap textarea {
    width: 100%; padding: 12px 14px; border: none; outline: none; resize: vertical;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink);
    background: transparent; line-height: 1.6; min-height: 100px;
  }
  .as-textarea-wrap textarea::placeholder { color: #bbb4a8; }
  .as-char-count { font-size: 11px; color: var(--muted); text-align: right; }

  /* ── SERVICE TYPE GRID ── */
  .as-type-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
  }
  @media (max-width: 580px) { .as-type-grid { grid-template-columns: repeat(2,1fr); } }
  .as-type-btn {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 14px 10px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--white); cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--muted);
    transition: all 0.2s;
  }
  .as-type-btn:hover { border-color: var(--gold); color: var(--ink); }
  .as-type-btn.active {
    border-color: var(--gold);
    background: linear-gradient(135deg, #faf7f0, #fff8e8);
    color: var(--ink); font-weight: 500;
    box-shadow: 0 2px 12px rgba(201,168,76,0.15);
  }
  .as-type-emoji { font-size: 1.4rem; }

  /* ── PACKAGES ── */
  .as-pkg-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; margin-bottom: 14px;
    transition: border-color 0.2s, box-shadow 0.2s; animation: fadeUp 0.3s ease both;
  }
  .as-pkg-card:focus-within {
    border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.08);
  }
  .as-pkg-card-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
  }
  .as-pkg-tier {
    font-size: 10px; font-weight: 500; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--gold);
    background: rgba(201,168,76,0.08); border: 1px solid var(--border);
    padding: 3px 10px; border-radius: 20px;
  }
  .as-pkg-remove {
    background: none; border: none; cursor: pointer; color: #ccc;
    font-size: 20px; line-height: 1; padding: 2px 6px; border-radius: 4px;
    transition: color 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .as-pkg-remove:hover { color: #b85c5c; }
  .as-pkg-row {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
  }
  @media (max-width: 480px) { .as-pkg-row { grid-template-columns: 1fr; } }
  .as-pkg-features-label {
    font-size: 10.5px; font-weight: 500; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
  }
  .as-pkg-feature-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
  .as-pkg-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold); opacity: 0.55; flex-shrink: 0;
  }
  .as-pkg-remove-feat {
    background: none; border: none; cursor: pointer; color: #ccc;
    font-size: 16px; line-height: 1; padding: 0 4px; transition: color 0.2s; flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
  }
  .as-pkg-remove-feat:hover { color: #b85c5c; }
  .as-add-feat-btn {
    background: none; border: none; cursor: pointer; color: var(--gold);
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    padding: 6px 0 0; letter-spacing: 0.03em; transition: opacity 0.2s; text-align: left;
  }
  .as-add-feat-btn:hover { opacity: 0.7; }
  .as-add-pkg-btn {
    width: 100%; padding: 14px; background: none;
    border: 1px dashed rgba(201,168,76,0.4); border-radius: 10px;
    color: var(--muted); font-family: 'DM Sans', sans-serif;
    font-size: 13px; cursor: pointer; transition: all 0.2s;
    letter-spacing: 0.03em; margin-top: 2px;
  }
  .as-add-pkg-btn:hover {
    border-color: var(--gold); color: var(--ink); background: rgba(201,168,76,0.04);
  }

  /* ── IMAGE PREVIEW GRID ── */
  .as-img-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 10px;
    margin-bottom: 10px;
    animation: fadeUp 0.3s ease both;
  }
  .as-img-thumb {
    position: relative; aspect-ratio: 1;
    border-radius: 8px; overflow: hidden;
    border: 2px solid transparent; cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .as-img-thumb:hover { border-color: rgba(201,168,76,0.5); }
  .as-img-thumb-active {
    border-color: var(--gold) !important;
    box-shadow: 0 0 0 3px rgba(201,168,76,0.2);
  }
  .as-img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .as-img-remove {
    position: absolute; top: 4px; right: 4px;
    width: 22px; height: 22px;
    background: rgba(184,92,92,0.88); color: white;
    border: none; border-radius: 50%; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; line-height: 1;
    transition: background 0.2s, transform 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .as-img-remove:hover { background: #b85c5c; transform: scale(1.12); }
  .as-img-cover-badge {
    position: absolute; bottom: 4px; left: 4px;
    font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    background: rgba(14,12,10,0.72); color: var(--gold-light);
    padding: 2px 7px; border-radius: 20px;
    backdrop-filter: blur(4px);
  }

  /* Add-more tile inside grid */
  .as-img-add-tile {
    aspect-ratio: 1;
    border-radius: 8px;
    border: 1.5px dashed rgba(201,168,76,0.35);
    background: var(--white);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 4px; cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .as-img-add-tile:hover { border-color: var(--gold); background: rgba(201,168,76,0.03); }
  .as-img-add-icon { font-size: 1.4rem; color: var(--gold); opacity: 0.7; line-height: 1; }
  .as-img-add-text { font-size: 10px; color: var(--muted); letter-spacing: 0.05em; }

  .as-img-hint {
    font-size: 11.5px; color: var(--muted); line-height: 1.5;
  }
  .as-img-count {
    color: var(--gold); font-weight: 500;
  }

  /* ── UPLOAD ZONE ── */
  .as-upload-zone {
    border: 1.5px dashed rgba(201,168,76,0.4);
    border-radius: 12px; padding: 36px 20px;
    background: var(--white); text-align: center;
    transition: border-color 0.22s, background 0.22s, transform 0.15s;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .as-upload-zone:hover { border-color: var(--gold); background: rgba(201,168,76,0.02); }
  .as-upload-zone.dragging {
    border-color: var(--gold);
    background: rgba(201,168,76,0.06);
    transform: scale(1.01);
    box-shadow: 0 0 0 4px rgba(201,168,76,0.1);
  }
  /* Compact version when images exist */
  .as-upload-zone-compact {
    padding: 18px 20px;
    margin-top: 8px;
    flex-direction: row;
    justify-content: center;
    gap: 12px;
    background: var(--surface);
  }

  .as-upload-icon-wrap {
    width: 52px; height: 52px;
    background: rgba(201,168,76,0.08);
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 2px;
  }
  .as-upload-icon { font-size: 1.6rem; color: var(--gold); }
  .as-upload-title { font-size: 14px; color: var(--ink); font-weight: 500; }
  .as-upload-sub   { font-size: 12px; color: var(--muted); }
  .as-upload-label {
    display: inline-block; padding: 9px 22px;
    background: var(--ink); color: var(--white);
    border-radius: 6px; font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.03em;
  }
  .as-upload-label:hover { background: var(--gold); color: var(--ink); }
  .as-upload-label-sm { padding: 6px 16px; font-size: 12px; }

  /* ── ERROR ── */
  .as-error {
    font-size: 12.5px; color: #b85c5c;
    background: rgba(184,92,92,0.07); border: 1px solid rgba(184,92,92,0.2);
    border-radius: 6px; padding: 10px 14px; margin-bottom: 18px;
  }

  /* ── ACTIONS ROW ── */
  .as-actions {
    display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 14px;
  }
  .as-btn-ghost-full {
    padding: 16px; background: none;
    border: 1px solid var(--border); border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--muted);
    cursor: pointer; transition: all 0.2s;
  }
  .as-btn-ghost-full:hover:not(:disabled) { border-color: var(--gold); color: var(--ink); }
  .as-btn-ghost-full:disabled { opacity: 0.5; pointer-events: none; }
  .as-submit {
    padding: 16px; background: var(--ink); color: var(--white);
    border: none; border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    letter-spacing: 0.04em; cursor: pointer; transition: all 0.25s ease;
    display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px;
  }
  .as-submit:hover:not(:disabled) {
    background: var(--gold); color: var(--ink);
    transform: translateY(-1px); box-shadow: 0 8px 28px rgba(201,168,76,0.3);
  }
  .as-submit.loading { opacity: 0.65; pointer-events: none; }
  .as-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }
  .as-terms { font-size: 11.5px; color: var(--muted); text-align: center; line-height: 1.6; }
  .as-link { color: var(--gold); text-decoration: none; font-weight: 500; }
  .as-link:hover { text-decoration: underline; }

  /* ── PREVIEW ── */
  .as-preview-col { }
  .as-preview-sticky { position: sticky; top: 88px; }
  .as-preview-label {
    font-size: 11px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
  }
  .as-preview-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 8px 32px rgba(14,12,10,0.06);
  }
  .as-preview-img {
    position: relative; height: 200px;
    background: linear-gradient(135deg, #ede8e0, #e0d8cc); overflow: hidden;
  }
  .as-preview-img img { width: 100%; height: 100%; object-fit: cover; }
  .as-preview-placeholder {
    width: 100%; height: 100%; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    font-size: 2.5rem; color: var(--muted);
  }
  .as-preview-placeholder p { font-size: 12px; color: var(--muted); }
  .as-preview-badge {
    position: absolute; bottom: 10px; left: 10px;
    font-size: 10.5px; font-weight: 500; letter-spacing: 0.08em;
    background: rgba(14,12,10,0.65); backdrop-filter: blur(6px);
    color: var(--gold-light); padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.2);
  }
  .as-preview-count {
    position: absolute; bottom: 10px; right: 10px;
    font-size: 10px; font-weight: 500;
    background: rgba(14,12,10,0.65); backdrop-filter: blur(6px);
    color: var(--gold-light); padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.2);
  }
  .as-preview-body { padding: 18px 20px; }
  .as-preview-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600; color: var(--ink); margin-bottom: 5px; min-height: 1.5em;
  }
  .as-preview-loc { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
  .as-preview-desc {
    font-size: 12.5px; color: var(--muted); line-height: 1.6; margin-bottom: 14px;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    overflow: hidden; min-height: 3em;
  }
  .as-preview-pkgs { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .as-preview-pkg-pill {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 7px 12px;
  }
  .as-preview-pkg-name { font-size: 11.5px; font-weight: 500; color: var(--ink); letter-spacing: 0.03em; }
  .as-preview-pkg-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 14px; font-weight: 600; color: var(--gold);
  }
  .as-preview-footer {
    display: flex; justify-content: space-between; align-items: center;
    border-top: 1px solid var(--border); padding-top: 14px;
  }
  .as-preview-from { display: block; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .as-preview-price {
    font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink);
  }
  .as-preview-btn {
    padding: 8px 16px; background: var(--ink); color: var(--white);
    border-radius: 6px; font-size: 12px; font-weight: 500;
  }

  /* ── IMAGE STRIP PREVIEW ── */
  .as-preview-strip {
    display: flex; gap: 6px; margin-top: 10px; overflow-x: auto;
    scrollbar-width: none; padding-bottom: 2px;
  }
  .as-preview-strip::-webkit-scrollbar { display: none; }
  .as-strip-thumb {
    width: 52px; height: 52px; flex-shrink: 0;
    border-radius: 6px; overflow: hidden; cursor: pointer;
    border: 2px solid transparent; transition: border-color 0.2s;
  }
  .as-strip-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .as-strip-thumb.active { border-color: var(--gold); }
  .as-strip-thumb:hover { border-color: rgba(201,168,76,0.5); }
  .as-strip-more {
    width: 52px; height: 52px; flex-shrink: 0;
    border-radius: 6px; background: var(--surface);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--muted); font-weight: 500;
  }
  .as-preview-note { font-size: 11px; color: var(--muted); text-align: center; margin-top: 10px; }

  /* ── SUCCESS ── */
  .as-success-screen {
    max-width: 480px; margin: 80px auto; text-align: center; animation: fadeUp 0.5s ease both;
  }
  .as-success-icon {
    width: 70px; height: 70px;
    background: rgba(45,106,79,0.1); border: 1px solid rgba(45,106,79,0.3);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 28px; color: #2d6a4f; margin: 0 auto 24px;
    animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
  }
  .as-success-screen h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 600; color: var(--ink); margin-bottom: 10px;
  }
  .as-success-screen p { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 32px; }
  .as-success-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .as-btn-primary {
    padding: 13px 28px; background: var(--ink); color: var(--white);
    text-decoration: none; border-radius: 7px; font-size: 13px; font-weight: 500; transition: all 0.2s;
  }
  .as-btn-primary:hover { background: var(--gold); color: var(--ink); }
  .as-btn-ghost {
    padding: 13px 28px; background: none; color: var(--muted);
    border: 1px solid var(--border); border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s;
  }
  .as-btn-ghost:hover { border-color: var(--gold); color: var(--ink); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes popIn  { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  @media (max-width: 640px) {
    .as-body { padding: 32px 20px 60px; }
    .as-actions { grid-template-columns: 1fr 1.5fr; }
  }
`;