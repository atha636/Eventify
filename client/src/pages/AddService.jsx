import { useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

const SERVICE_TYPES = [
  { value: "decor",       label: "Decor",       emoji: "🎨" },
  { value: "photography", label: "Photography", emoji: "📸" },
  { value: "catering",    label: "Catering",    emoji: "🍽" },
  { value: "music",       label: "Music & DJ",  emoji: "🎵" },
  { value: "florals",     label: "Florals",     emoji: "💐" },
  { value: "venues",      label: "Venues",      emoji: "🏛" },
];

export default function AddService() {
  const [form, setForm] = useState({
    serviceType: "decor",
    title: "",
    description: "",
    price: "",
    location: "",
    image: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleImageChange = (val) => {
    set("image", val);
    setImagePreview(val);
  };

  const validate = () => {
    if (!form.title.trim())       return "Please enter a service title.";
    if (!form.description.trim()) return "Please add a description.";
    if (!form.price)              return "Please enter a price.";
    if (!form.location.trim())    return "Please enter a location.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      await API.post("/vendors/add", form, {
        headers: { Authorization: token },
      });
      setSuccess(true);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to add service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = SERVICE_TYPES.find(t => t.value === form.serviceType);

  return (
    <>
      <style>{styles}</style>
      <div className="as-root">
        <Navbar />

        <div className="as-body">
          {success ? (
            <div className="as-success-screen">
              <div className="as-success-icon">✓</div>
              <h2>Service Listed!</h2>
              <p>Your service has been successfully added and is now visible to clients.</p>
              <div className="as-success-btns">
                <a href="/dashboard" className="as-btn-primary">Go to Dashboard →</a>
                <button
                  className="as-btn-ghost"
                  onClick={() => { setSuccess(false); setForm({ serviceType: "decor", title: "", description: "", price: "", location: "", image: "" }); setImagePreview(""); }}
                >
                  Add Another
                </button>
              </div>
            </div>
          ) : (
            <div className="as-layout">

              {/* LEFT — FORM */}
              <div className="as-form-col">
                <div className="as-form-header">
                  <a href="/dashboard" className="as-back">← Back to Dashboard</a>
                  <p className="as-eyebrow">✦ Vendor Portal</p>
                  <h1 className="as-title">List a New Service</h1>
                  <p className="as-subtitle">Fill in the details below to make your service visible to thousands of clients.</p>
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
                      placeholder="Describe what makes your service special, what's included, your experience…"
                      value={form.description}
                      rows={4}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  </div>
                  <span className="as-char-count">{form.description.length} / 500</span>
                </div>

                {/* PRICE + LOCATION */}
                <div className="as-row">
                  <div className="as-field">
                    <label className="as-label">Starting Price (₹)</label>
                    <div className="as-input-wrap">
                      <span className="as-icon">₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 15000"
                        value={form.price}
                        onChange={(e) => set("price", e.target.value)}
                      />
                    </div>
                  </div>
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
                </div>

                {/* IMAGE */}
                <div className="as-field">
                  <label className="as-label">Cover Image URL</label>
                  <div className="as-input-wrap">
                    <span className="as-icon">🖼</span>
                    <input
                      placeholder="https://example.com/image.jpg"
                      value={form.image}
                      onChange={(e) => handleImageChange(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="as-error">⚠ {error}</div>
                )}

                <button
                  className={`as-submit ${loading ? "loading" : ""}`}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading
                    ? <><span className="as-spinner" /> Publishing Service…</>
                    : "Publish Service →"}
                </button>

                <p className="as-terms">
                  By listing a service you agree to our{" "}
                  <a href="#" className="as-link">Vendor Terms</a> and{" "}
                  <a href="#" className="as-link">Content Policy</a>.
                </p>
              </div>

              {/* RIGHT — PREVIEW */}
              <div className="as-preview-col">
                <div className="as-preview-sticky">
                  <p className="as-preview-label">✦ Live Preview</p>
                  <div className="as-preview-card">
                    <div className="as-preview-img">
                      {imagePreview ? (
                        <img src={imagePreview} alt="preview" onError={() => setImagePreview("")} />
                      ) : (
                        <div className="as-preview-placeholder">
                          <span>{selectedType?.emoji}</span>
                          <p>Add an image URL to preview</p>
                        </div>
                      )}
                      <span className="as-preview-badge">{selectedType?.label}</span>
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
                      <div className="as-preview-footer">
                        <div>
                          <span className="as-preview-from">Starting at</span>
                          <span className="as-preview-price">
                            {form.price ? `₹${Number(form.price).toLocaleString()}` : "₹ —"}
                          </span>
                        </div>
                        <span className="as-preview-btn">View →</span>
                      </div>
                    </div>
                  </div>
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
    display: inline-block;
    font-size: 12px;
    color: var(--muted);
    text-decoration: none;
    margin-bottom: 20px;
    transition: color 0.2s;
    letter-spacing: 0.04em;
  }
  .as-back:hover { color: var(--gold); }
  .as-eyebrow {
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 8px;
  }
  .as-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.9rem, 3.5vw, 2.6rem);
    font-weight: 300;
    color: var(--ink);
    margin-bottom: 8px;
    line-height: 1.15;
  }
  .as-subtitle { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

  /* ── FIELDS ── */
  .as-field {
    display: flex; flex-direction: column; gap: 7px;
    margin-bottom: 22px;
    animation: fadeUp 0.5s ease both;
  }
  .as-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .as-input-wrap {
    display: flex; align-items: center; gap: 10px;
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 12px 14px;
    background: var(--white);
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
    border: 1px solid var(--border);
    border-radius: 7px;
    background: var(--white);
    transition: border-color 0.2s, box-shadow 0.2s;
    overflow: hidden;
  }
  .as-textarea-wrap:focus-within {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }
  .as-textarea-wrap textarea {
    width: 100%; padding: 12px 14px;
    border: none; outline: none; resize: vertical;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--ink);
    background: transparent; line-height: 1.6;
    min-height: 100px;
  }
  .as-textarea-wrap textarea::placeholder { color: #bbb4a8; }
  .as-char-count { font-size: 11px; color: var(--muted); text-align: right; }

  /* ROW */
  .as-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 580px) { .as-row { grid-template-columns: 1fr; } }

  /* SERVICE TYPE GRID */
  .as-type-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  @media (max-width: 580px) { .as-type-grid { grid-template-columns: repeat(2,1fr); } }
  .as-type-btn {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 14px 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--white);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; color: var(--muted);
    transition: all 0.2s;
  }
  .as-type-btn:hover { border-color: var(--gold); color: var(--ink); }
  .as-type-btn.active {
    border-color: var(--gold);
    background: linear-gradient(135deg, #faf7f0, #fff8e8);
    color: var(--ink);
    font-weight: 500;
    box-shadow: 0 2px 12px rgba(201,168,76,0.15);
  }
  .as-type-emoji { font-size: 1.4rem; }

  /* ERROR */
  .as-error {
    font-size: 12.5px;
    color: #b85c5c;
    background: rgba(184,92,92,0.07);
    border: 1px solid rgba(184,92,92,0.2);
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 18px;
  }

  /* SUBMIT */
  .as-submit {
    width: 100%;
    padding: 16px;
    background: var(--ink);
    color: var(--white);
    border: none; border-radius: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.25s ease;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    margin-bottom: 14px;
    min-height: 52px;
  }
  .as-submit:hover:not(:disabled) {
    background: var(--gold);
    color: var(--ink);
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(201,168,76,0.3);
  }
  .as-submit.loading { opacity: 0.65; pointer-events: none; }
  .as-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  .as-terms { font-size: 11.5px; color: var(--muted); text-align: center; line-height: 1.6; }
  .as-link { color: var(--gold); text-decoration: none; font-weight: 500; }
  .as-link:hover { text-decoration: underline; }

  /* ── PREVIEW ── */
  .as-preview-col { }
  .as-preview-sticky { position: sticky; top: 88px; }
  .as-preview-label {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 14px;
  }
  .as-preview-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(14,12,10,0.06);
  }
  .as-preview-img {
    position: relative;
    height: 200px;
    background: linear-gradient(135deg, #ede8e0, #e0d8cc);
    overflow: hidden;
  }
  .as-preview-img img {
    width: 100%; height: 100%; object-fit: cover;
  }
  .as-preview-placeholder {
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    font-size: 2.5rem; color: var(--muted);
  }
  .as-preview-placeholder p { font-size: 12px; color: var(--muted); }
  .as-preview-badge {
    position: absolute; bottom: 10px; left: 10px;
    font-size: 10.5px; font-weight: 500;
    letter-spacing: 0.08em;
    background: rgba(14,12,10,0.65);
    backdrop-filter: blur(6px);
    color: var(--gold-light);
    padding: 3px 10px;
    border-radius: 20px;
    border: 1px solid rgba(201,168,76,0.2);
  }
  .as-preview-body { padding: 18px 20px; }
  .as-preview-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600;
    color: var(--ink); margin-bottom: 5px;
    min-height: 1.5em;
  }
  .as-preview-loc { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
  .as-preview-desc {
    font-size: 12.5px; color: var(--muted);
    line-height: 1.6; margin-bottom: 16px;
    display: -webkit-box; -webkit-line-clamp: 3;
    -webkit-box-orient: vertical; overflow: hidden;
    min-height: 3em;
  }
  .as-preview-footer {
    display: flex; justify-content: space-between; align-items: center;
    border-top: 1px solid var(--border); padding-top: 14px;
  }
  .as-preview-from { display: block; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .as-preview-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600; color: var(--ink);
  }
  .as-preview-btn {
    padding: 8px 16px;
    background: var(--ink); color: var(--white);
    border-radius: 6px; font-size: 12px; font-weight: 500;
  }
  .as-preview-note { font-size: 11px; color: var(--muted); text-align: center; margin-top: 10px; }

  /* ── SUCCESS ── */
  .as-success-screen {
    max-width: 480px; margin: 80px auto; text-align: center;
    animation: fadeUp 0.5s ease both;
  }
  .as-success-icon {
    width: 70px; height: 70px;
    background: rgba(45,106,79,0.1);
    border: 1px solid rgba(45,106,79,0.3);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; color: #2d6a4f;
    margin: 0 auto 24px;
    animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
  }
  .as-success-screen h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 600; color: var(--ink); margin-bottom: 10px;
  }
  .as-success-screen p { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 32px; }
  .as-success-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .as-btn-primary {
    padding: 13px 28px;
    background: var(--ink); color: var(--white);
    text-decoration: none; border-radius: 7px;
    font-size: 13px; font-weight: 500;
    transition: all 0.2s;
  }
  .as-btn-primary:hover { background: var(--gold); color: var(--ink); }
  .as-btn-ghost {
    padding: 13px 28px;
    background: none; color: var(--muted);
    border: 1px solid var(--border); border-radius: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; cursor: pointer;
    transition: all 0.2s;
  }
  .as-btn-ghost:hover { border-color: var(--gold); color: var(--ink); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes popIn {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
`;