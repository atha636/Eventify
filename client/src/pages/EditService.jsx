import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function EditService() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    serviceType: "decor",
    title: "",
    description: "",
    location: "",
  });

  const [packages,       setPackages]       = useState([{ name: "Basic", price: "", features: [""] }]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages,      setNewImages]      = useState([]);
  const [removedImages,  setRemovedImages]  = useState([]);
  const [previewUrl,     setPreviewUrl]     = useState("");

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  // ── Load existing service ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    API.get("/vendors/my-services", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        const service = res.data.find((s) => s._id === id);
        if (!service) { navigate("/dashboard"); return; }
        setForm({
          serviceType: service.serviceType || "decor",
          title:       service.title       || "",
          description: service.description || "",
          location:    service.location    || "",
        });
        setPackages(
          service.packages?.length
            ? service.packages.map((p) => ({
                name:     p.name     || "",
                price:    p.price    || "",
                features: p.features?.length ? p.features : [""],
              }))
            : [{ name: "Basic", price: "", features: [""] }]
        );
        setExistingImages(service.images || []);
        if (service.images?.[0]) setPreviewUrl(service.images[0]);
      })
      .catch(() => navigate("/dashboard"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

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
  const addFeature = (pi) => {
    const u = [...packages]; u[pi].features.push(""); setPackages(u);
  };
  const removeFeature = (pi, fi) => {
    const u = [...packages]; u[pi].features.splice(fi, 1); setPackages(u);
  };
  const updateFeature = (pi, fi, val) => {
    const u = [...packages]; u[pi].features[fi] = val; setPackages(u);
  };

  // ── Remove existing image ──────────────────────────────────────
  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setRemovedImages((prev) => [...prev, url]);
    if (previewUrl === url) {
      const remaining = existingImages.filter((img) => img !== url);
      setPreviewUrl(remaining[0] || "");
    }
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
    data.append("serviceType",   form.serviceType);
    data.append("title",         form.title);
    data.append("description",   form.description);
    data.append("location",      form.location);
    data.append("packages",      JSON.stringify(packages));
    data.append("existingImages",JSON.stringify(existingImages));
    data.append("removedImages", JSON.stringify(removedImages));
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

  const selectedType = SERVICE_TYPES.find((t) => t.value === form.serviceType);

  // ── Loading skeleton ───────────────────────────────────────────
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

          {success ? (
            // ── SUCCESS ──────────────────────────────────────────
            <div className="es-success-screen">
              <div className="es-success-icon">✓</div>
              <h2>Service Updated!</h2>
              <p>Your changes have been saved and are now visible to clients.</p>
              <div className="es-success-btns">
                <a href="/dashboard" className="es-btn-primary">Go to Dashboard →</a>
                <button className="es-btn-ghost" onClick={() => navigate(`/vendor/${id}`)}>
                  View Service
                </button>
              </div>
            </div>
          ) : (
            <div className="es-layout">

              {/* ── LEFT — FORM ── */}
              <div className="es-form-col">
                <div className="es-form-header">
                  <a href="/dashboard" className="es-back">← Back to Dashboard</a>
                  <p className="es-eyebrow">✦ Vendor Portal</p>
                  <h1 className="es-title">Edit Service</h1>
                  <p className="es-subtitle">Update your listing details. Changes go live instantly.</p>
                </div>

                {/* SERVICE TYPE */}
                <div className="es-field">
                  <label className="es-label">Service Category</label>
                  <div className="es-type-grid">
                    {SERVICE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        className={`es-type-btn ${form.serviceType === t.value ? "active" : ""}`}
                        onClick={() => set("serviceType", t.value)}
                      >
                        <span className="es-type-emoji">{t.emoji}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TITLE */}
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

                {/* DESCRIPTION */}
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

                {/* LOCATION */}
                <div className="es-field">
                  <label className="es-label">Location</label>
                  <div className="es-input-wrap">
                    <span className="es-icon">◉</span>
                    <input
                      placeholder="e.g. Delhi, Mumbai…"
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                    />
                  </div>
                </div>

                {/* ── PACKAGES ── */}
                <div className="es-field">
                  <label className="es-label">Packages</label>
                  {packages.map((pkg, index) => (
                    <div key={index} className="es-pkg-card">
                      <div className="es-pkg-card-header">
                        <span className="es-pkg-tier">{TIER_LABELS[index] || `Package ${index + 1}`}</span>
                        {index > 0 && (
                          <button
                            type="button"
                            className="es-pkg-remove"
                            onClick={() => removePackage(index)}
                          >×</button>
                        )}
                      </div>
                      <div className="es-pkg-row">
                        <div className="es-input-wrap">
                          <input
                            placeholder="Package name"
                            value={pkg.name}
                            onChange={(e) => updatePackage(index, "name", e.target.value)}
                          />
                        </div>
                        <div className="es-input-wrap">
                          <span className="es-icon" style={{ fontSize: 11 }}>₹</span>
                          <input
                            type="number"
                            placeholder="Price"
                            value={pkg.price}
                            onChange={(e) => updatePackage(index, "price", e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="es-pkg-features-label">Features included</p>
                      {pkg.features.map((f, fi) => (
                        <div key={fi} className="es-pkg-feature-row">
                          <span className="es-pkg-dot" />
                          <div className="es-input-wrap" style={{ flex: 1 }}>
                            <input
                              placeholder="e.g. 3 hours shoot, HD delivery…"
                              value={f}
                              onChange={(e) => updateFeature(index, fi, e.target.value)}
                            />
                          </div>
                          {pkg.features.length > 1 && (
                            <button
                              type="button"
                              className="es-pkg-remove-feat"
                              onClick={() => removeFeature(index, fi)}
                            >×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="es-add-feat-btn" onClick={() => addFeature(index)}>
                        + Add feature
                      </button>
                    </div>
                  ))}
                  {packages.length < 4 && (
                    <button type="button" onClick={addPackage} className="es-add-pkg-btn">
                      + Add Package
                    </button>
                  )}
                </div>

                {/* ── EXISTING IMAGES ── */}
                {existingImages.length > 0 && (
                  <div className="es-field">
                    <label className="es-label">
                      Current Portfolio Images
                      <span className="es-label-sub"> — Click × to remove</span>
                    </label>
                    <div className="es-img-grid">
                      {existingImages.map((url, i) => (
                        <div
                          key={i}
                          className={`es-img-thumb ${previewUrl === url ? "es-img-thumb-active" : ""}`}
                          onClick={() => setPreviewUrl(url)}
                        >
                          <img src={url} alt={`img-${i}`} />
                          <button
                            className="es-img-remove"
                            onClick={(e) => { e.stopPropagation(); removeExistingImage(url); }}
                            title="Remove image"
                          >×</button>
                          {i === 0 && <span className="es-img-cover-badge">Cover</span>}
                        </div>
                      ))}
                    </div>
                    <p className="es-img-hint">
                      First image is used as the cover photo on your listing card.
                    </p>
                  </div>
                )}

                {/* ── ADD NEW IMAGES ── */}
                <div className="es-field">
                  <label className="es-label">
                    Add More Images
                    <span className="es-label-sub"> (up to 15 total)</span>
                  </label>
                  <div
                    className="es-upload-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files)
                        .filter((f) => f.type.startsWith("image/"))
                        .slice(0, 15 - existingImages.length);
                      setNewImages(files);
                      if (files[0]) setPreviewUrl(URL.createObjectURL(files[0]));
                    }}
                  >
                    <span className="es-upload-icon">⊕</span>
                    <p className="es-upload-text">Drag & drop images here or</p>
                    <label className="es-upload-label">
                      Browse Files
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const files = Array.from(e.target.files).slice(0, 15 - existingImages.length);
                          setNewImages(files);
                          if (files[0]) setPreviewUrl(URL.createObjectURL(files[0]));
                        }}
                      />
                    </label>
                    {newImages.length > 0 && (
                      <p className="es-upload-count">
                        ✓ {newImages.length} new image{newImages.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                </div>

                {error && <div className="es-error">⚠ {error}</div>}

                <div className="es-actions">
                  <button className="es-btn-ghost-full" onClick={() => navigate("/dashboard")} disabled={saving}>
                    Cancel
                  </button>
                  <button
                    className={`es-submit ${saving ? "loading" : ""}`}
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving
                      ? <><span className="es-spinner" /> Saving Changes…</>
                      : "Save Changes →"}
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
                  <p className="es-preview-label">✦ Live Preview</p>
                  <div className="es-preview-card">
                    <div className="es-preview-img">
                      {previewUrl ? (
                        <img src={previewUrl} alt="preview" onError={() => setPreviewUrl("")} />
                      ) : (
                        <div className="es-preview-placeholder">
                          <span>{selectedType?.emoji}</span>
                          <p>No image selected</p>
                        </div>
                      )}
                      <span className="es-preview-badge">{selectedType?.label}</span>
                      {existingImages.length > 1 && (
                        <span className="es-preview-count">
                          {existingImages.length + newImages.length} photos
                        </span>
                      )}
                    </div>
                    <div className="es-preview-body">
                      <h3 className="es-preview-title">
                        {form.title || "Your Service Title"}
                      </h3>
                      <p className="es-preview-loc">
                        {form.location ? `◉ ${form.location}` : "◉ Location"}
                      </p>
                      <p className="es-preview-desc">
                        {form.description || "Your service description will appear here…"}
                      </p>
                      {packages.length > 0 && (
                        <div className="es-preview-pkgs">
                          {packages.map((pkg, i) => (
                            <div key={i} className="es-preview-pkg-pill">
                              <span className="es-preview-pkg-name">
                                {pkg.name || TIER_LABELS[i]}
                              </span>
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
                          <span className="es-preview-price">
                            {packages[0]?.price
                              ? `₹${Number(packages[0].price).toLocaleString()}`
                              : "₹ —"}
                          </span>
                        </div>
                        <span className="es-preview-btn">View →</span>
                      </div>
                    </div>
                  </div>

                  {/* Image strip preview */}
                  {existingImages.length > 1 && (
                    <div className="es-preview-strip">
                      {existingImages.slice(0, 5).map((url, i) => (
                        <div
                          key={i}
                          className={`es-strip-thumb ${previewUrl === url ? "active" : ""}`}
                          onClick={() => setPreviewUrl(url)}
                        >
                          <img src={url} alt="" />
                        </div>
                      ))}
                      {existingImages.length > 5 && (
                        <div className="es-strip-more">+{existingImages.length - 5}</div>
                      )}
                    </div>
                  )}

                  <p className="es-preview-note">This is how clients will see your listing.</p>
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

  .es-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  .es-body {
    max-width: 1100px;
    margin: 0 auto;
    padding: 48px 32px 80px;
  }

  /* ── LOADING ── */
  .es-loading {
    min-height: 60vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; color: var(--muted);
    font-size: 13px; letter-spacing: 0.1em;
  }
  .es-load-spinner {
    width: 36px; height: 36px;
    border: 2px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  /* ── LAYOUT ── */
  .es-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 48px;
    align-items: start;
  }
  @media (max-width: 960px) {
    .es-layout { grid-template-columns: 1fr; }
    .es-preview-col { order: -1; }
  }

  /* ── FORM HEADER ── */
  .es-form-header { margin-bottom: 36px; animation: fadeUp 0.5s ease both; }
  .es-back {
    display: inline-block; font-size: 12px; color: var(--muted);
    text-decoration: none; margin-bottom: 20px;
    transition: color 0.2s; letter-spacing: 0.04em;
  }
  .es-back:hover { color: var(--gold); }
  .es-eyebrow {
    font-size: 11px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 8px;
  }
  .es-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.9rem, 3.5vw, 2.6rem);
    font-weight: 300; color: var(--ink); margin-bottom: 8px; line-height: 1.15;
  }
  .es-subtitle { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

  /* ── FIELDS ── */
  .es-field {
    display: flex; flex-direction: column; gap: 7px;
    margin-bottom: 22px; animation: fadeUp 0.5s ease both;
  }
  .es-label {
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted);
  }
  .es-label-sub {
    font-size: 10px; letter-spacing: 0.05em;
    text-transform: none; color: var(--muted); opacity: 0.75;
  }
  .es-input-wrap {
    display: flex; align-items: center; gap: 10px;
    border: 1px solid var(--border); border-radius: 7px;
    padding: 11px 14px; background: var(--white);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .es-input-wrap:focus-within {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }
  .es-icon { font-size: 13px; color: var(--gold); opacity: 0.85; flex-shrink: 0; }
  .es-input-wrap input {
    border: none; background: transparent; outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--ink); width: 100%;
  }
  .es-input-wrap input::placeholder { color: #bbb4a8; }

  .es-textarea-wrap {
    border: 1px solid var(--border); border-radius: 7px;
    background: var(--white); transition: border-color 0.2s, box-shadow 0.2s; overflow: hidden;
  }
  .es-textarea-wrap:focus-within {
    border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }
  .es-textarea-wrap textarea {
    width: 100%; padding: 12px 14px; border: none; outline: none; resize: vertical;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink);
    background: transparent; line-height: 1.6; min-height: 100px;
  }
  .es-textarea-wrap textarea::placeholder { color: #bbb4a8; }
  .es-char-count { font-size: 11px; color: var(--muted); text-align: right; }

  /* ── SERVICE TYPE GRID ── */
  .es-type-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
  }
  @media (max-width: 580px) { .es-type-grid { grid-template-columns: repeat(2,1fr); } }
  .es-type-btn {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 14px 10px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--white); cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--muted);
    transition: all 0.2s;
  }
  .es-type-btn:hover { border-color: var(--gold); color: var(--ink); }
  .es-type-btn.active {
    border-color: var(--gold);
    background: linear-gradient(135deg, #faf7f0, #fff8e8);
    color: var(--ink); font-weight: 500;
    box-shadow: 0 2px 12px rgba(201,168,76,0.15);
  }
  .es-type-emoji { font-size: 1.4rem; }

  /* ── PACKAGES ── */
  .es-pkg-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; margin-bottom: 14px;
    transition: border-color 0.2s, box-shadow 0.2s; animation: fadeUp 0.3s ease both;
  }
  .es-pkg-card:focus-within {
    border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.08);
  }
  .es-pkg-card-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
  }
  .es-pkg-tier {
    font-size: 10px; font-weight: 500; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--gold);
    background: rgba(201,168,76,0.08); border: 1px solid var(--border);
    padding: 3px 10px; border-radius: 20px;
  }
  .es-pkg-remove {
    background: none; border: none; cursor: pointer; color: #ccc;
    font-size: 20px; line-height: 1; padding: 2px 6px; border-radius: 4px;
    transition: color 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .es-pkg-remove:hover { color: #b85c5c; }
  .es-pkg-row {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
  }
  @media (max-width: 480px) { .es-pkg-row { grid-template-columns: 1fr; } }
  .es-pkg-features-label {
    font-size: 10.5px; font-weight: 500; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
  }
  .es-pkg-feature-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
  .es-pkg-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold); opacity: 0.55; flex-shrink: 0;
  }
  .es-pkg-remove-feat {
    background: none; border: none; cursor: pointer; color: #ccc;
    font-size: 16px; line-height: 1; padding: 0 4px; transition: color 0.2s; flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
  }
  .es-pkg-remove-feat:hover { color: #b85c5c; }
  .es-add-feat-btn {
    background: none; border: none; cursor: pointer; color: var(--gold);
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    padding: 6px 0 0; letter-spacing: 0.03em; transition: opacity 0.2s; text-align: left;
  }
  .es-add-feat-btn:hover { opacity: 0.7; }
  .es-add-pkg-btn {
    width: 100%; padding: 14px; background: none;
    border: 1px dashed rgba(201,168,76,0.4); border-radius: 10px;
    color: var(--muted); font-family: 'DM Sans', sans-serif;
    font-size: 13px; cursor: pointer; transition: all 0.2s;
    letter-spacing: 0.03em; margin-top: 2px;
  }
  .es-add-pkg-btn:hover {
    border-color: var(--gold); color: var(--ink); background: rgba(201,168,76,0.04);
  }

  /* ── IMAGE GRID (existing images) ── */
  .es-img-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;
  }
  .es-img-thumb {
    position: relative; aspect-ratio: 1;
    border-radius: 8px; overflow: hidden;
    border: 2px solid transparent; cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .es-img-thumb:hover { border-color: var(--gold); }
  .es-img-thumb-active { border-color: var(--gold) !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.2); }
  .es-img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .es-img-remove {
    position: absolute; top: 4px; right: 4px;
    width: 22px; height: 22px;
    background: rgba(184,92,92,0.9); color: white;
    border: none; border-radius: 50%; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; line-height: 1;
    transition: background 0.2s, transform 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .es-img-remove:hover { background: #b85c5c; transform: scale(1.1); }
  .es-img-cover-badge {
    position: absolute; bottom: 4px; left: 4px;
    font-size: 9px; font-weight: 500; letter-spacing: 0.08em;
    background: rgba(14,12,10,0.7); color: var(--gold-light);
    padding: 2px 7px; border-radius: 20px;
  }
  .es-img-hint { font-size: 11px; color: var(--muted); margin-top: 6px; }

  /* ── UPLOAD ZONE ── */
  .es-upload-zone {
    border: 1.5px dashed rgba(201,168,76,0.4);
    border-radius: 12px; padding: 32px 20px;
    background: var(--white); text-align: center;
    transition: border-color 0.2s, background 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .es-upload-zone:hover { border-color: var(--gold); background: rgba(201,168,76,0.02); }
  .es-upload-icon { font-size: 1.8rem; color: var(--gold); opacity: 0.7; }
  .es-upload-text { font-size: 13px; color: var(--muted); }
  .es-upload-label {
    display: inline-block; padding: 8px 20px;
    background: var(--ink); color: var(--white);
    border-radius: 6px; font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500; cursor: pointer;
    transition: all 0.2s; letter-spacing: 0.03em;
  }
  .es-upload-label:hover { background: var(--gold); color: var(--ink); }
  .es-upload-count { font-size: 12px; color: #2d6a4f; font-weight: 500; }

  /* ── ERROR ── */
  .es-error {
    font-size: 12.5px; color: #b85c5c;
    background: rgba(184,92,92,0.07); border: 1px solid rgba(184,92,92,0.2);
    border-radius: 6px; padding: 10px 14px; margin-bottom: 18px;
  }

  /* ── ACTIONS ROW ── */
  .es-actions {
    display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 14px;
  }
  .es-btn-ghost-full {
    padding: 16px; background: none;
    border: 1px solid var(--border); border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--muted);
    cursor: pointer; transition: all 0.2s;
  }
  .es-btn-ghost-full:hover:not(:disabled) { border-color: var(--gold); color: var(--ink); }
  .es-btn-ghost-full:disabled { opacity: 0.5; pointer-events: none; }

  .es-submit {
    padding: 16px; background: var(--ink); color: var(--white);
    border: none; border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    letter-spacing: 0.04em; cursor: pointer; transition: all 0.25s ease;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    min-height: 52px;
  }
  .es-submit:hover:not(:disabled) {
    background: var(--gold); color: var(--ink);
    transform: translateY(-1px); box-shadow: 0 8px 28px rgba(201,168,76,0.3);
  }
  .es-submit.loading { opacity: 0.65; pointer-events: none; }
  .es-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }
  .es-terms { font-size: 11.5px; color: var(--muted); text-align: center; line-height: 1.6; }
  .es-link { color: var(--gold); text-decoration: none; font-weight: 500; }
  .es-link:hover { text-decoration: underline; }

  /* ── PREVIEW ── */
  .es-preview-col { }
  .es-preview-sticky { position: sticky; top: 88px; }
  .es-preview-label {
    font-size: 11px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
  }
  .es-preview-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 8px 32px rgba(14,12,10,0.06);
  }
  .es-preview-img {
    position: relative; height: 200px;
    background: linear-gradient(135deg, #ede8e0, #e0d8cc); overflow: hidden;
  }
  .es-preview-img img { width: 100%; height: 100%; object-fit: cover; }
  .es-preview-placeholder {
    width: 100%; height: 100%; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    font-size: 2.5rem; color: var(--muted);
  }
  .es-preview-placeholder p { font-size: 12px; color: var(--muted); }
  .es-preview-badge {
    position: absolute; bottom: 10px; left: 10px;
    font-size: 10.5px; font-weight: 500; letter-spacing: 0.08em;
    background: rgba(14,12,10,0.65); backdrop-filter: blur(6px);
    color: var(--gold-light); padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.2);
  }
  .es-preview-count {
    position: absolute; bottom: 10px; right: 10px;
    font-size: 10px; font-weight: 500;
    background: rgba(14,12,10,0.65); backdrop-filter: blur(6px);
    color: var(--gold-light); padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.2);
  }
  .es-preview-body { padding: 18px 20px; }
  .es-preview-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600; color: var(--ink); margin-bottom: 5px; min-height: 1.5em;
  }
  .es-preview-loc { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
  .es-preview-desc {
    font-size: 12.5px; color: var(--muted); line-height: 1.6; margin-bottom: 14px;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    overflow: hidden; min-height: 3em;
  }
  .es-preview-pkgs { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .es-preview-pkg-pill {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 7px 12px;
  }
  .es-preview-pkg-name { font-size: 11.5px; font-weight: 500; color: var(--ink); letter-spacing: 0.03em; }
  .es-preview-pkg-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 14px; font-weight: 600; color: var(--gold);
  }
  .es-preview-footer {
    display: flex; justify-content: space-between; align-items: center;
    border-top: 1px solid var(--border); padding-top: 14px;
  }
  .es-preview-from { display: block; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .es-preview-price {
    font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink);
  }
  .es-preview-btn {
    padding: 8px 16px; background: var(--ink); color: var(--white);
    border-radius: 6px; font-size: 12px; font-weight: 500;
  }

  /* ── IMAGE STRIP PREVIEW ── */
  .es-preview-strip {
    display: flex; gap: 6px; margin-top: 10px; flex-wrap: nowrap; overflow-x: auto;
    scrollbar-width: none; padding-bottom: 2px;
  }
  .es-preview-strip::-webkit-scrollbar { display: none; }
  .es-strip-thumb {
    width: 52px; height: 52px; flex-shrink: 0;
    border-radius: 6px; overflow: hidden; cursor: pointer;
    border: 2px solid transparent; transition: border-color 0.2s;
  }
  .es-strip-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .es-strip-thumb.active { border-color: var(--gold); }
  .es-strip-thumb:hover { border-color: rgba(201,168,76,0.5); }
  .es-strip-more {
    width: 52px; height: 52px; flex-shrink: 0;
    border-radius: 6px; background: var(--surface);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--muted); font-weight: 500;
  }

  .es-preview-note { font-size: 11px; color: var(--muted); text-align: center; margin-top: 10px; }

  /* ── SUCCESS ── */
  .es-success-screen {
    max-width: 480px; margin: 80px auto; text-align: center; animation: fadeUp 0.5s ease both;
  }
  .es-success-icon {
    width: 70px; height: 70px;
    background: rgba(45,106,79,0.1); border: 1px solid rgba(45,106,79,0.3);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 28px; color: #2d6a4f; margin: 0 auto 24px;
    animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
  }
  .es-success-screen h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 600; color: var(--ink); margin-bottom: 10px;
  }
  .es-success-screen p { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 32px; }
  .es-success-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .es-btn-primary {
    padding: 13px 28px; background: var(--ink); color: var(--white);
    text-decoration: none; border-radius: 7px; font-size: 13px; font-weight: 500; transition: all 0.2s;
  }
  .es-btn-primary:hover { background: var(--gold); color: var(--ink); }
  .es-btn-ghost {
    padding: 13px 28px; background: none; color: var(--muted);
    border: 1px solid var(--border); border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s;
  }
  .es-btn-ghost:hover { border-color: var(--gold); color: var(--ink); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes popIn  { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;