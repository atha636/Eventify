import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function VendorDetail() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateWarning, setDateWarning] = useState("");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false); // ← NEW
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const isVendor = user?.role === "vendor";

  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  useEffect(() => {
    API.get("/vendors").then((res) => {
      const found = res.data.find((v) => v._id === id);
      setVendor(found);
      if (found?.packages?.length > 0) setSelectedPackage(0);
    });
  }, [id]);

  const handleBooking = async () => {
    const token = localStorage.getItem("token");

    // ← REPLACED ugly alert with beautiful modal
    if (!token) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedDate) {
      setDateWarning("Please select a date to continue.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(selectedDate);

// ❌ invalid date check
if (isNaN(picked.getTime())) {
  setDateWarning("Please select a valid date.");
  return;
}

// ❌ too far future 
if (picked.getFullYear() > 2100) {
  setDateWarning("Please select a realistic date.");
  return;
}

    setDateWarning("");
    setLoading(true);
    try {
      await API.post(
        "/bookings",
        {
          vendorId: vendor._id,
          date: selectedDate,
          packageName: vendor.packages[selectedPackage].name,
          packagePrice: vendor.packages[selectedPackage].price,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBooked(true);
      setTimeout(() => setBooked(false), 3000);
      setSelectedDate("");
    } catch (err) {
      console.error(err);
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

      {/* ── LOGIN REQUIRED MODAL ── */}
      {showLoginModal && (
        <div className="vd-modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="vd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vd-modal-icon-ring">
              <span>✦</span>
            </div>
            <h3 className="vd-modal-title">Sign in to Continue</h3>
            <p className="vd-modal-body">
              You need an account to reserve this vendor. Sign in or create a free account — it only takes a minute.
            </p>
            <div className="vd-modal-actions">
              <button className="vd-modal-cancel" onClick={() => setShowLoginModal(false)}>
                Maybe Later
              </button>
              <button
                className="vd-modal-login"
                onClick={() => navigate("/login", { state: { from: `/vendor/${id}` } })}
              >
                Sign In
              </button>
              <button
                className="vd-modal-register"
                onClick={() => navigate("/register", { state: { from: `/vendor/${id}` } })}
              >
                Create Account →
              </button>
            </div>
            <p className="vd-modal-note">✦ Free to join · No credit card required</p>
          </div>
        </div>
      )}

      {/* ── VENDOR ROLE MODAL ── */}
      {showVendorModal && (
        <div className="vd-modal-backdrop" onClick={() => setShowVendorModal(false)}>
          <div className="vd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vd-modal-icon">⚠</div>
            <h3 className="vd-modal-title">Switch to Client Account?</h3>
            <p className="vd-modal-body">
              You are currently logged in as a <strong>Vendor</strong>. To book services,
              you need a client account. Would you like to register as a client?
            </p>
            <div className="vd-modal-actions">
              <button className="vd-modal-cancel" onClick={() => setShowVendorModal(false)}>
                Stay as Vendor
              </button>
              <button
                className="vd-modal-register"
                onClick={() => { setShowVendorModal(false); navigate("/register", { state: { role: "user" } }); }}
              >
                Yes, Register as Client
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="vd-root">
        {/* HERO */}
        <div className="vd-hero">
          <img src={vendor.images?.[0]} alt={vendor.title} className="vd-hero-img" />
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
                  <ul className="vd-pkg-desc">
                    {p.features?.map((f, i) => <li key={i}>✔ {f}</li>)}
                  </ul>
                  {selectedPackage === i && <span className="vd-pkg-selected-dot" />}
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

                <ul className="vd-panel-desc">
                  {pkg.features?.map((f, i) => <li key={i}>✔ {f}</li>)}
                </ul>

                <div className="vd-divider" />

                <div className="vd-date-section">
                  <label className="vd-label">Select Your Date</label>
                  <div className={`vd-date-wrapper ${dateWarning ? "date-error" : ""}`}>
                    <span className="vd-date-icon">🗓</span>
                    <DatePicker
  selected={selectedDate ? new Date(selectedDate) : null}
  onChange={(date) => {
    setSelectedDate(date.toISOString().split("T")[0]);
    setDateWarning("");
  }}
  minDate={new Date(Date.now() + 86400000)}
  placeholderText="Select your event date"
  className="vd-date-input"
  dateFormat="dd MMMM yyyy"

  showMonthDropdown
  showYearDropdown
  scrollableYearDropdown
  yearDropdownItemNumber={10}
  dropdownMode="select"

  portalId="root"
/>
                  </div>
                  {dateWarning && (
                    <p className="vd-date-warning">
                      <span className="vd-warn-icon">⚠</span> {dateWarning}
                    </p>
                  )}
                </div>

                <button
                  className={`vd-book-btn ${booked ? "success" : ""} ${loading ? "loading" : ""}`}
                  onClick={() => {
                    if (isVendor) setShowVendorModal(true);
                    else handleBooking();
                  }}
                  disabled={loading || booked}
                >
                  {isVendor ? (
                    <>It seems you are a Vendor — Explore as a Client</>
                  ) : booked ? (
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
    --danger: #a93226;
    --danger-bg: #fdf0ef;
    --danger-border: rgba(169,50,38,0.25);
  }

  .vd-root { font-family:'DM Sans',sans-serif; background:var(--cream); min-height:100vh; color:var(--ink); }

  /* ── MODALS ── */
  .vd-modal-backdrop {
    position:fixed; inset:0;
    background:rgba(14,12,10,0.6);
    backdrop-filter:blur(4px);
    display:flex; align-items:center; justify-content:center;
    z-index:1000;
    animation:fadeIn 0.2s ease both;
    padding: 20px;
  }

  .vd-modal {
    background:var(--white);
    border-radius:16px;
    padding:44px 40px 36px;
    max-width:420px; width:100%;
    text-align:center;
    animation:modalUp 0.28s cubic-bezier(0.34,1.4,0.64,1) both;
    border:1px solid var(--border);
    box-shadow: 0 24px 64px rgba(14,12,10,0.18);
  }

  .vd-modal-icon-ring {
    width:60px; height:60px;
    background:linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05));
    border:1.5px solid var(--border);
    border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:1.5rem; color:var(--gold);
    margin:0 auto 20px;
    animation:popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .vd-modal-icon { font-size:28px; margin-bottom:14px; display:block; color:var(--gold); }

  .vd-modal-title {
    font-family:'Cormorant Garamond',serif;
    font-size:1.65rem; font-weight:600;
    color:var(--ink); margin:0 0 12px;
    font-style:italic;
  }
  .vd-modal-body {
    font-size:13.5px; color:var(--muted);
    line-height:1.7; margin:0 0 28px;
  }
  .vd-modal-body strong { color:var(--ink); font-weight:500; }

  .vd-modal-actions { display:flex; gap:10px; flex-wrap:wrap; }

  .vd-modal-cancel {
    flex:1; min-width:100px;
    padding:13px 16px;
    background:transparent; border:1px solid var(--border);
    border-radius:6px; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:500; color:var(--muted);
    cursor:pointer; transition:all 0.2s ease;
  }
  .vd-modal-cancel:hover { border-color:var(--muted); color:var(--ink); background:var(--surface); }

  .vd-modal-login {
    flex:1; min-width:80px;
    padding:13px 16px;
    background:var(--surface); border:1px solid var(--border);
    border-radius:6px; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:500; color:var(--ink);
    cursor:pointer; transition:all 0.2s ease;
  }
  .vd-modal-login:hover { border-color:var(--gold); color:var(--gold); }

  .vd-modal-register {
    flex:1.4; min-width:120px;
    padding:13px 16px;
    background:var(--ink); border:none;
    border-radius:6px; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:500; color:var(--white);
    cursor:pointer; transition:all 0.2s ease;
  }
  .vd-modal-register:hover { background:var(--gold); color:var(--ink); transform:translateY(-1px); box-shadow:0 6px 20px rgba(201,168,76,0.3); }

  .vd-modal-note {
    font-size:11px; color:var(--muted);
    margin-top:18px; letter-spacing:0.05em;
  }

  /* ── HERO ── */
  .vd-hero { position:relative; height:520px; overflow:hidden; }
  .vd-hero-img { width:100%; height:100%; object-fit:cover; display:block; transform:scale(1.03); transition:transform 8s ease; }
  .vd-hero:hover .vd-hero-img { transform:scale(1); }
  .vd-hero-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(14,12,10,0.85) 0%,rgba(14,12,10,0.2) 50%,transparent 100%); }
  .vd-hero-content { position:absolute; bottom:0; left:0; right:0; padding:48px 56px; animation:fadeUp 0.7s ease both; }
  .vd-tag { font-size:12px; font-weight:500; letter-spacing:0.15em; text-transform:uppercase; color:var(--gold-light); display:block; margin-bottom:12px; }
  .vd-title { font-family:'Cormorant Garamond',serif; font-size:clamp(2.4rem,5vw,3.6rem); font-weight:300; color:var(--white); line-height:1.1; margin:0 0 20px; }
  .vd-badge-row { display:flex; gap:16px; flex-wrap:wrap; }
  .vd-badge { font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--gold); border:1px solid var(--gold); padding:5px 12px; border-radius:2px; backdrop-filter:blur(4px); background:rgba(201,168,76,0.08); }

  /* BODY */
  .vd-body { display:grid; grid-template-columns:340px 1fr; gap:0; max-width:1200px; margin:0 auto; padding:48px 32px; align-items:start; }
  @media (max-width:900px) { .vd-body { grid-template-columns:1fr; } .vd-hero-content { padding:32px; } .vd-modal-actions { flex-direction:column; } }

  /* SIDEBAR */
  .vd-sidebar { padding-right:40px; }
  .vd-section-label { font-size:10px; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; color:var(--muted); margin:0 0 20px; }
  .vd-pkg-list { display:flex; flex-direction:column; gap:12px; }
  .vd-pkg-card { position:relative; background:var(--white); border:1px solid var(--border); border-radius:8px; padding:20px; text-align:left; cursor:pointer; transition:all 0.25s ease; overflow:hidden; }
  .vd-pkg-card:hover { border-color:var(--gold); transform:translateX(4px); box-shadow:0 4px 20px rgba(201,168,76,0.12); }
  .vd-pkg-card.active { border-color:var(--gold); background:linear-gradient(135deg,#faf7f0 0%,#fff8e8 100%); box-shadow:0 6px 24px rgba(201,168,76,0.18); }
  .vd-pkg-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
  .vd-pkg-name { font-family:'Cormorant Garamond',serif; font-size:1.15rem; font-weight:600; color:var(--ink); }
  .vd-pkg-price { font-size:13px; font-weight:500; color:var(--gold); white-space:nowrap; }
  .vd-pkg-desc { font-size:12.5px; color:var(--muted); line-height:1.5; margin:0; }
  .vd-pkg-selected-dot { position:absolute; top:0; left:0; width:3px; height:100%; background:var(--gold); border-radius:0 2px 2px 0; }

  /* MAIN */
  .vd-main { display:flex; flex-direction:column; gap:40px; }

  /* BOOKING PANEL */
  .vd-booking-panel { background:var(--white); border:1px solid var(--border); border-radius:12px; padding:36px; box-shadow:0 8px 40px rgba(14,12,10,0.06); animation:fadeUp 0.5s ease both; }
  .vd-panel-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .vd-panel-title { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:400; margin:0; color:var(--ink); font-style:italic; }
  .vd-panel-price { text-align:right; }
  .vd-price-label { display:block; font-size:11px; color:var(--muted); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:2px; }
  .vd-price-value { font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:600; color:var(--ink); }
  .vd-panel-desc { font-size:13.5px; color:var(--muted); line-height:1.7; margin:0; }
  .vd-divider { height:1px; background:var(--border); margin:24px 0; }

  /* DATE */
  .vd-date-section { margin-bottom:28px; }
  .vd-label { display:block; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); margin-bottom:10px; }
  .vd-date-wrapper { display:flex; align-items:center; gap:12px; border:1px solid var(--border); border-radius:6px; padding:12px 16px; background:var(--surface); transition:border-color 0.2s,background 0.2s; }
  .vd-date-wrapper:focus-within { border-color:var(--gold); }
  .vd-date-wrapper.date-error { border-color:var(--danger-border); background:var(--danger-bg); animation:shake 0.35s ease; }
  .vd-date-icon { font-size:16px; }
  .vd-date-input { border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--ink); outline:none; width:100%; cursor:pointer; }
  .vd-date-warning { display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--danger); margin:8px 0 0; padding:9px 13px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:5px; animation:fadeUp 0.2s ease both; }
  .vd-warn-icon { font-size:13px; flex-shrink:0; }

  /* BOOK BTN */
  .vd-book-btn { width:100%; padding:17px 24px; background:var(--gold); color:var(--ink); border:none; border-radius:6px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; letter-spacing:0.05em; cursor:pointer; transition:all 0.3s ease; display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:14px; }
  .vd-book-btn:hover:not(:disabled) { background:var(--ink); color:var(--white); transform:translateY(-1px); box-shadow:0 8px 24px rgba(14,12,10,0.2); }
  .vd-book-btn.success { background:var(--success); color:var(--white); pointer-events:none; }
  .vd-book-btn.loading { opacity:0.7; pointer-events:none; }
  .vd-btn-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
  .vd-note { font-size:11.5px; color:var(--muted); text-align:center; margin:0; }

  /* GALLERY */
  .vd-gallery-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; margin-top:16px; }
  .vd-gallery-item { aspect-ratio:4/3; border-radius:6px; overflow:hidden; border:1px solid var(--border); }
  .vd-gallery-item img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease; }
  .vd-gallery-item:hover img { transform:scale(1.06); }

  /* LOADER */
  .vd-loader { min-height:80vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:var(--muted); font-size:13px; letter-spacing:0.1em; }
  .vd-spinner { width:36px; height:36px; border:2px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin 0.9s linear infinite; }

  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes modalUp { from { opacity:0; transform:translateY(24px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes popIn { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }
  @keyframes shake { 0%,100% { transform:translateX(0); } 20% { transform:translateX(-5px); } 40% { transform:translateX(5px); } 60% { transform:translateX(-4px); } 80% { transform:translateX(4px); } }


  /* ── DATEPICKER CUSTOM STYLE ── */

.react-datepicker-wrapper { width: 100%; }
.react-datepicker__input-container { width: 100%; }

.react-datepicker {
  font-family: 'DM Sans', sans-serif;
  border: 1px solid rgba(201,168,76,0.25);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(14,12,10,0.12);
  background: #ffffff;
}

/* ── HEADER (month/year bar) ── */
.react-datepicker__header {
  background: #0e0c0a;
  border-bottom: 1px solid rgba(201,168,76,0.15);
  padding: 18px 0 0;
  border-radius: 0;
}

.react-datepicker__current-month {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.15rem;
  font-weight: 400;
  font-style: italic;
  color: #ffffff;
  letter-spacing: 0.03em;
  margin-bottom: 4px;
}

/* month/year dropdowns */
.react-datepicker__month-read-view--selected-month,
.react-datepicker__year-read-view--selected-year {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.1rem;
  font-style: italic;
  color: #ffffff;
}
.react-datepicker__month-read-view--down-arrow,
.react-datepicker__year-read-view--down-arrow {
  border-top-color: #c9a84c;
  top: 4px;
}

/* day-of-week labels */
.react-datepicker__day-names {
  background: #0e0c0a;
  padding: 8px 8px 10px;
  margin: 0;
}
.react-datepicker__day-name {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #c9a84c;
  width: 2rem;
  line-height: 2rem;
}

/* nav arrows */
.react-datepicker__navigation {
  top: 18px;
}
.react-datepicker__navigation-icon::before {
  border-color: #c9a84c;
  border-width: 1.5px 1.5px 0 0;
}
.react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
  border-color: #ffffff;
}

/* ── MONTH BODY ── */
.react-datepicker__month {
  padding: 10px 8px 14px;
  margin: 0;
}

.react-datepicker__day {
  font-size: 13px;
  color: #0e0c0a;
  width: 2rem;
  line-height: 2rem;
  border-radius: 50%;
  transition: background 0.15s ease, color 0.15s ease;
}

.react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
  background: #f5f0e8;
  color: #0e0c0a;
  border-radius: 50%;
}

.react-datepicker__day--selected,
.react-datepicker__day--keyboard-selected {
  background: #c9a84c !important;
  color: #0e0c0a !important;
  font-weight: 500;
  border-radius: 50%;
}

.react-datepicker__day--today:not(.react-datepicker__day--selected) {
  font-weight: 500;
  color: #c9a84c;
  background: transparent;
}

.react-datepicker__day--disabled {
  color: rgba(14,12,10,0.2) !important;
  cursor: not-allowed;
}

.react-datepicker__day--outside-month {
  color: rgba(14,12,10,0.18);
}

/* ── DROPDOWNS ── */
.react-datepicker__month-dropdown,
.react-datepicker__year-dropdown {
  background: #ffffff;
  border: 1px solid rgba(201,168,76,0.25);
  border-radius: 10px;
  box-shadow: 0 10px 36px rgba(14,12,10,0.14);
  max-height: 200px;
  overflow-y: auto;
}

.react-datepicker__month-option,
.react-datepicker__year-option {
  font-size: 13px;
  color: #0e0c0a;
  padding: 6px 16px;
  transition: background 0.15s;
}

.react-datepicker__month-option:hover,
.react-datepicker__year-option:hover {
  background: #f5f0e8;
  color: #c9a84c;
}

.react-datepicker__month-option--selected_month,
.react-datepicker__year-option--selected_year {
  background: rgba(201,168,76,0.12);
  color: #c9a84c;
  font-weight: 500;
}

.react-datepicker__month-dropdown::-webkit-scrollbar,
.react-datepicker__year-dropdown::-webkit-scrollbar { width: 5px; }
.react-datepicker__month-dropdown::-webkit-scrollbar-thumb,
.react-datepicker__year-dropdown::-webkit-scrollbar-thumb {
  background: rgba(201,168,76,0.4);
  border-radius: 10px;
}

/* ── POPPER ── */
.react-datepicker-popper { z-index: 9999 !important; }
.react-datepicker__triangle { display: none; }


`;
