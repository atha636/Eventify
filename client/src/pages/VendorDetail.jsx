import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function VendorDetail() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/vendors").then((res) => {
      const found = res.data.find((v) => v._id === id);
      setVendor(found);
      if (found?.packages?.length > 0) setSelectedPackage(0);
    });
  }, [id]);

  const handleBooking = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login first");
    if (!selectedDate) return alert("Please select a date");

    setLoading(true);
    try {
      await API.post(
        "/bookings",
        { vendorId: vendor._id, date: selectedDate },
        { headers: { Authorization: token } }
      );
      setBooked(true);
      setTimeout(() => setBooked(false), 3000);
      setSelectedDate("");
    } catch (err) {
      console.error(err);
      alert("Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (!vendor) {
    return (
      <>
        <style>{styles}</style>
        <Navbar />
        <div className="vd-loader">
          <div className="vd-spinner" />
          <p>Curating your experience…</p>
        </div>
      </>
    );
  }

  const pkg = vendor.packages?.[selectedPackage];

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="vd-root">
        {/* HERO */}
        <div className="vd-hero">
          <img
            src={vendor.images?.[0]}
            alt={vendor.title}
            className="vd-hero-img"
          />
          <div className="vd-hero-overlay" />
          <div className="vd-hero-content">
            <span className="vd-tag">📍 {vendor.location}</span>
            <h1 className="vd-title">{vendor.title}</h1>
            <div className="vd-badge-row">
              <span className="vd-badge">✦ Premium Vendor</span>
              <span className="vd-badge">✦ Verified</span>
              <span className="vd-badge">✦ {vendor.packages?.length} Packages</span>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="vd-body">

          {/* LEFT — PACKAGE SELECTOR */}
          <aside className="vd-sidebar">
            <h2 className="vd-section-label">Choose a Package</h2>
            <div className="vd-pkg-list">
              {vendor.packages.map((p, i) => (
                <button
                  key={i}
                  className={`vd-pkg-card ${selectedPackage === i ? "active" : ""}`}
                  onClick={() => setSelectedPackage(i)}
                >
                  <div className="vd-pkg-top">
                    <span className="vd-pkg-name">{p.name}</span>
                    <span className="vd-pkg-price">₹{p.price?.toLocaleString()}</span>
                  </div>
                  <p className="vd-pkg-desc">{p.details}</p>
                  {selectedPackage === i && (
                    <span className="vd-pkg-selected-dot" />
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* RIGHT — BOOKING PANEL */}
          <main className="vd-main">
            {pkg && (
              <div className="vd-booking-panel">
                <div className="vd-panel-header">
                  <h3 className="vd-panel-title">{pkg.name}</h3>
                  <div className="vd-panel-price">
                    <span className="vd-price-label">Starting at</span>
                    <span className="vd-price-value">₹{pkg.price?.toLocaleString()}</span>
                  </div>
                </div>

                <p className="vd-panel-desc">{pkg.details}</p>

                <div className="vd-divider" />

                <div className="vd-date-section">
                  <label className="vd-label">Select Your Date</label>
                  <div className="vd-date-wrapper">
                    <span className="vd-date-icon">🗓</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="vd-date-input"
                    />
                  </div>
                </div>

                <button
                  className={`vd-book-btn ${booked ? "success" : ""} ${loading ? "loading" : ""}`}
                  onClick={handleBooking}
                  disabled={loading || booked}
                >
                  {booked ? (
                    <>✓ Booking Confirmed!</>
                  ) : loading ? (
                    <><span className="vd-btn-spinner" /> Processing…</>
                  ) : (
                    <>Reserve Now — ₹{pkg.price?.toLocaleString()}</>
                  )}
                </button>

                <p className="vd-note">✦ No cancellation fee within 48 hours &nbsp;·&nbsp; Secure payment</p>
              </div>
            )}

            {/* GALLERY STRIP */}
            {vendor.images?.length > 1 && (
              <div className="vd-gallery">
                <h2 className="vd-section-label">Gallery</h2>
                <div className="vd-gallery-grid">
                  {vendor.images.slice(1).map((img, i) => (
                    <div key={i} className="vd-gallery-item">
                      <img src={img} alt={`gallery-${i}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --muted: #7a7265;
    --border: rgba(201,168,76,0.2);
    --surface: #faf7f2;
    --white: #ffffff;
    --success: #2d6a4f;
  }

  .vd-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  /* HERO */
  .vd-hero {
    position: relative;
    height: 520px;
    overflow: hidden;
  }
  .vd-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transform: scale(1.03);
    transition: transform 8s ease;
  }
  .vd-hero:hover .vd-hero-img { transform: scale(1); }
  .vd-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(14,12,10,0.85) 0%, rgba(14,12,10,0.2) 50%, transparent 100%);
  }
  .vd-hero-content {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 48px 56px;
    animation: fadeUp 0.7s ease both;
  }
  .vd-tag {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold-light);
    display: block;
    margin-bottom: 12px;
  }
  .vd-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.4rem, 5vw, 3.6rem);
    font-weight: 300;
    color: var(--white);
    line-height: 1.1;
    margin: 0 0 20px;
    letter-spacing: -0.01em;
  }
  .vd-badge-row { display: flex; gap: 16px; flex-wrap: wrap; }
  .vd-badge {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold);
    border: 1px solid var(--gold);
    padding: 5px 12px;
    border-radius: 2px;
    backdrop-filter: blur(4px);
    background: rgba(201,168,76,0.08);
  }

  /* BODY */
  .vd-body {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 0;
    max-width: 1200px;
    margin: 0 auto;
    padding: 48px 32px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .vd-body { grid-template-columns: 1fr; }
    .vd-hero-content { padding: 32px; }
  }

  /* SIDEBAR */
  .vd-sidebar { padding-right: 40px; }
  .vd-section-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 20px;
  }
  .vd-pkg-list { display: flex; flex-direction: column; gap: 12px; }
  .vd-pkg-card {
    position: relative;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    text-align: left;
    cursor: pointer;
    transition: all 0.25s ease;
    overflow: hidden;
  }
  .vd-pkg-card:hover {
    border-color: var(--gold);
    transform: translateX(4px);
    box-shadow: 0 4px 20px rgba(201,168,76,0.12);
  }
  .vd-pkg-card.active {
    border-color: var(--gold);
    background: linear-gradient(135deg, #faf7f0 0%, #fff8e8 100%);
    box-shadow: 0 6px 24px rgba(201,168,76,0.18);
  }
  .vd-pkg-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .vd-pkg-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--ink);
  }
  .vd-pkg-price {
    font-size: 13px;
    font-weight: 500;
    color: var(--gold);
    white-space: nowrap;
  }
  .vd-pkg-desc { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin: 0; }
  .vd-pkg-selected-dot {
    position: absolute;
    top: 0; left: 0;
    width: 3px;
    height: 100%;
    background: var(--gold);
    border-radius: 0 2px 2px 0;
  }

  /* MAIN */
  .vd-main { display: flex; flex-direction: column; gap: 40px; }

  /* BOOKING PANEL */
  .vd-booking-panel {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 36px;
    box-shadow: 0 8px 40px rgba(14,12,10,0.06);
    animation: fadeUp 0.5s ease both;
  }
  .vd-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .vd-panel-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem;
    font-weight: 400;
    margin: 0;
    color: var(--ink);
    font-style: italic;
  }
  .vd-panel-price { text-align: right; }
  .vd-price-label { display: block; font-size: 11px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 2px; }
  .vd-price-value { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: var(--ink); }
  .vd-panel-desc { font-size: 13.5px; color: var(--muted); line-height: 1.7; margin: 0; }
  .vd-divider { height: 1px; background: var(--border); margin: 24px 0; }

  .vd-date-section { margin-bottom: 28px; }
  .vd-label { display: block; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
  .vd-date-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px 16px;
    background: var(--surface);
    transition: border-color 0.2s;
  }
  .vd-date-wrapper:focus-within { border-color: var(--gold); }
  .vd-date-icon { font-size: 16px; }
  .vd-date-input {
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--ink);
    outline: none;
    width: 100%;
    cursor: pointer;
  }

  .vd-book-btn {
    width: 100%;
    padding: 17px 24px;
    background: var(--ink);
    color: var(--white);
    border: none;
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 14px;
  }
  .vd-book-btn:hover:not(:disabled) {
    background: var(--gold);
    color: var(--ink);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(201,168,76,0.35);
  }
  .vd-book-btn.success { background: var(--success); pointer-events: none; }
  .vd-book-btn.loading { opacity: 0.7; pointer-events: none; }
  .vd-btn-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  .vd-note { font-size: 11.5px; color: var(--muted); text-align: center; margin: 0; }

  /* GALLERY */
  .vd-gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }
  .vd-gallery-item {
    aspect-ratio: 4/3;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .vd-gallery-item img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
  .vd-gallery-item:hover img { transform: scale(1.06); }

  /* LOADER */
  .vd-loader {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--muted);
    font-size: 13px;
    letter-spacing: 0.1em;
  }
  .vd-spinner {
    width: 36px; height: 36px;
    border: 2px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;