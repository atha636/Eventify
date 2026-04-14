import { useState } from "react";

export default function BookingDetailsModal({ pkg, vendor, date, onConfirm, onClose, loading }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({
    name:    user?.name || "",
    phone:   "",
    address: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Full name is required";
    if (!form.phone.trim())   e.phone   = "Phone number is required";
    else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
    if (!form.address.trim()) e.address = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onConfirm(form);
  };

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: "" }));
  };

  return (
    <div className="bdm-overlay" onClick={onClose}>
      <div className="bdm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <button className="bdm-close" onClick={onClose}>✕</button>
        <div className="bdm-header">
          <div className="bdm-icon-ring">✦</div>
          <h2 className="bdm-title">Complete Your Details</h2>
          <p className="bdm-subtitle">We share these with the vendor to confirm your booking</p>
        </div>

        {/* Booking summary strip */}
        <div className="bdm-summary">
          <div className="bdm-sum-item">
            <span className="bdm-sum-label">Package</span>
            <span className="bdm-sum-val">{pkg?.name}</span>
          </div>
          <div className="bdm-sum-sep" />
          <div className="bdm-sum-item">
            <span className="bdm-sum-label">Date</span>
            <span className="bdm-sum-val">
              {date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </span>
          </div>
          <div className="bdm-sum-sep" />
          <div className="bdm-sum-item">
            <span className="bdm-sum-label">Amount</span>
            <span className="bdm-sum-val bdm-sum-gold">₹{pkg?.price?.toLocaleString()}</span>
          </div>
        </div>

        {/* Form */}
        <div className="bdm-form">
          <div className="bdm-field">
            <label className="bdm-label">Full Name <span className="bdm-req">*</span></label>
            <input
              className={`bdm-input ${errors.name ? "bdm-input-err" : ""}`}
              placeholder="Your full name"
              value={form.name}
              onChange={e => set("name", e.target.value)}
            />
            {errors.name && <p className="bdm-err-msg">⚠ {errors.name}</p>}
          </div>

          <div className="bdm-field">
            <label className="bdm-label">Mobile Number <span className="bdm-req">*</span></label>
            <input
              className={`bdm-input ${errors.phone ? "bdm-input-err" : ""}`}
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
              type="tel"
            />
            {errors.phone && <p className="bdm-err-msg">⚠ {errors.phone}</p>}
          </div>

          <div className="bdm-field">
            <label className="bdm-label">Event Address <span className="bdm-req">*</span></label>
            <textarea
              className={`bdm-textarea ${errors.address ? "bdm-input-err" : ""}`}
              placeholder="Full address where the event will be held…"
              rows={3}
              value={form.address}
              onChange={e => set("address", e.target.value)}
            />
            {errors.address && <p className="bdm-err-msg">⚠ {errors.address}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="bdm-actions">
          <button className="bdm-btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`bdm-btn-confirm ${loading ? "bdm-loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><span className="bdm-spinner" /> Sending Request…</>
              : <>Send Booking Request →</>
            }
          </button>
        </div>

        <p className="bdm-note">✦ No payment now · Vendor confirms first</p>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c;
    --gold-light: #e8d5a3; --muted: #7a7265;
    --border: rgba(201,168,76,0.22); --surface: #faf7f2;
    --white: #ffffff; --danger: #a93226;
    --danger-bg: rgba(169,50,38,0.06); --danger-border: rgba(169,50,38,0.25);
  }

  .bdm-overlay {
    position: fixed; inset: 0;
    background: rgba(10,8,6,0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1500; padding: 20px;
    animation: bdmFade 0.2s ease both;
  }

  .bdm-modal {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px 36px 32px;
    width: 100%; max-width: 480px;
    position: relative;
    box-shadow: 0 40px 100px rgba(10,8,6,0.22), 0 0 0 1px rgba(255,255,255,0.35) inset;
    animation: bdmUp 0.32s cubic-bezier(0.34,1.2,0.64,1) both;
    /* FIX: prevent modal from being cut off on small screens */
    max-height: 90vh;
    overflow-y: auto;
  }

  /* Custom scrollbar for modal */
  .bdm-modal::-webkit-scrollbar { width: 4px; }
  .bdm-modal::-webkit-scrollbar-track { background: transparent; }
  .bdm-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .bdm-modal::-webkit-scrollbar-thumb:hover { background: var(--gold); }

  .bdm-close {
    position: sticky; top: 0; float: right;
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--white); border: 1px solid var(--border);
    color: var(--muted); font-size: 14px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; z-index: 10;
    margin-bottom: -30px;
  }
  .bdm-close:hover { border-color: var(--muted); color: var(--ink); }

  .bdm-header { text-align: center; margin-bottom: 24px; padding-top: 8px; }
  .bdm-icon-ring {
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05));
    border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem; color: var(--gold);
    margin: 0 auto 16px;
  }
  .bdm-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.7rem; font-weight: 400; font-style: italic;
    color: var(--ink); margin: 0 0 6px;
  }
  .bdm-subtitle { font-size: 12.5px; color: var(--muted); margin: 0; line-height: 1.5; }

  /* Summary strip */
  .bdm-summary {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 14px 18px;
    margin-bottom: 24px; gap: 8px;
  }
  .bdm-sum-item { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
  .bdm-sum-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .bdm-sum-val { font-size: 13.5px; font-weight: 500; color: var(--ink); text-align: center; }
  .bdm-sum-gold { color: var(--gold); font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; }
  .bdm-sum-sep { width: 1px; height: 32px; background: var(--border); flex-shrink: 0; }

  /* Form */
  .bdm-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
  .bdm-field { display: flex; flex-direction: column; gap: 6px; }
  .bdm-label {
    font-size: 11px; letter-spacing: 0.13em; text-transform: uppercase;
    color: var(--muted); font-weight: 500;
  }
  .bdm-req { color: var(--danger); }
  .bdm-input, .bdm-textarea {
    padding: 12px 14px;
    border: 1px solid var(--border); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--ink);
    background: var(--surface); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%; box-sizing: border-box;
  }
  .bdm-input:focus, .bdm-textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }
  .bdm-input-err { border-color: var(--danger-border) !important; background: var(--danger-bg) !important; }
  .bdm-textarea { resize: vertical; min-height: 80px; }
  .bdm-err-msg {
    font-size: 11.5px; color: var(--danger);
    display: flex; align-items: center; gap: 5px; margin: 0;
  }

  /* Actions */
  .bdm-actions { display: flex; gap: 10px; margin-bottom: 14px; }
  .bdm-btn-cancel {
    flex: 1; padding: 13px 16px;
    background: transparent; border: 1px solid var(--border);
    border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; color: var(--muted);
    cursor: pointer; transition: all 0.2s;
  }
  .bdm-btn-cancel:hover:not(:disabled) { border-color: var(--muted); color: var(--ink); }
  .bdm-btn-confirm {
    flex: 2; padding: 13px 16px;
    background: var(--gold); border: none;
    border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; color: var(--ink);
    cursor: pointer; transition: all 0.25s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .bdm-btn-confirm:hover:not(:disabled) {
    background: var(--ink); color: var(--white);
    transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,12,10,0.2);
  }
  .bdm-btn-confirm:disabled { opacity: 0.65; cursor: not-allowed; }
  .bdm-loading { pointer-events: none; }

  .bdm-spinner {
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(14,12,10,0.2); border-top-color: var(--ink);
    animation: bdmSpin 0.7s linear infinite; display: inline-block;
  }

  .bdm-note {
    text-align: center; font-size: 11px; color: var(--muted); margin: 0;
    letter-spacing: 0.05em;
  }

  @keyframes bdmFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes bdmUp {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes bdmSpin { to { transform: rotate(360deg); } }

  @media (max-width: 520px) {
    .bdm-modal { padding: 28px 18px 24px; border-radius: 16px; }
    .bdm-summary { flex-direction: column; gap: 12px; }
    .bdm-sum-sep { width: 100%; height: 1px; }
    .bdm-actions { flex-direction: column; }
  }
`;