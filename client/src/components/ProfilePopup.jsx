import { useState, useRef, useEffect } from "react";
import API from "../services/api";

export default function ProfilePopup({ onClose }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [tab, setTab]             = useState("profile"); // "profile" | "password"
  const [name, setName]           = useState(user.name || "");
  const [email, setEmail]         = useState(user.email || "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState({ text: "", type: "" });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const popupRef = useRef(null);

  // Close on outside click — but NOT when the logout confirm modal is open
  useEffect(() => {
    const handler = (e) => {
      if (showLogoutConfirm) return; // let the modal handle its own clicks
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, showLogoutConfirm]);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) return showMsg("Name cannot be empty.", "error");
    if (!email.trim()) return showMsg("Email cannot be empty.", "error");
    setLoading(true);
    try {
      const res = await API.put("/auth/update-profile", { name: name.trim(), email: email.trim() });
      const updated = { ...user, name: res.data.user.name, email: res.data.user.email };
      localStorage.setItem("user", JSON.stringify(updated));
      showMsg("Profile updated successfully!");
    } catch (err) {
      showMsg(err.response?.data?.msg || "Failed to update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw) return showMsg("Enter your current password.", "error");
    if (!newPw)     return showMsg("Enter a new password.", "error");
    if (newPw.length < 6) return showMsg("New password must be at least 6 characters.", "error");
    if (newPw !== confirmPw) return showMsg("Passwords do not match.", "error");
    setLoading(true);
    try {
      await API.put("/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      showMsg("Password changed successfully!");
    } catch (err) {
      showMsg(err.response?.data?.msg || "Failed to change password.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLogoutLoading(true);
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "/";
    }, 1500);
  };

  const initial = (user.name || "U").charAt(0).toUpperCase();
  const roleLabel = user.role === "vendor" ? "Vendor" : "Customer";

  return (
    <>
      <style>{styles}</style>
      <div className="pp-backdrop" />
      <div className="pp-popup" ref={popupRef}>

        {/* ── Header ── */}
        <div className="pp-header">
          <div className="pp-avatar">{initial}</div>
          <div className="pp-header-info">
            <span className="pp-name">{user.name}</span>
            <span className="pp-role-badge">{roleLabel}</span>
          </div>
          <button className="pp-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Tabs ── */}
        <div className="pp-tabs">
          <button className={`pp-tab ${tab === "profile" ? "active" : ""}`} onClick={() => { setTab("profile"); setMsg({ text: "", type: "" }); }}>
            Profile
          </button>
          <button className={`pp-tab ${tab === "password" ? "active" : ""}`} onClick={() => { setTab("password"); setMsg({ text: "", type: "" }); }}>
            Password
          </button>
        </div>

        {/* ── Message ── */}
        {msg.text && (
          <div className={`pp-msg ${msg.type === "error" ? "pp-msg-error" : "pp-msg-success"}`}>
            {msg.type === "error" ? "✕ " : "✓ "}{msg.text}
          </div>
        )}

        {/* ── Profile Tab ── */}
        {tab === "profile" && (
          <div className="pp-body">
            <div className="pp-field">
              <label className="pp-label">Full Name</label>
              <input className="pp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="pp-field">
              <label className="pp-label">Email Address</label>
              <input className="pp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <button className="pp-btn-primary" onClick={handleUpdateProfile} disabled={loading}>
              {loading ? <span className="pp-spinner" /> : null}
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}

        {/* ── Password Tab ── */}
        {tab === "password" && (
          <div className="pp-body">
            <div className="pp-field">
              <label className="pp-label">Current Password</label>
              <input className="pp-input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="pp-field">
              <label className="pp-label">New Password</label>
              <input className="pp-input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 6 characters" />
            </div>
            <div className="pp-field">
              <label className="pp-label">Confirm New Password</label>
              <input className="pp-input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter new password" />
            </div>
            <button className="pp-btn-primary" onClick={handleChangePassword} disabled={loading}>
              {loading ? <span className="pp-spinner" /> : null}
              {loading ? "Updating…" : "Change Password"}
            </button>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="pp-footer">
          <button className="pp-logout-btn" onClick={() => setShowLogoutConfirm(true)}>
            <span className="pp-logout-icon">↩</span>
            Log Out
          </button>
        </div>
      </div>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <>
          <div className="lc-overlay" />
          <div className="lc-modal">
            <div className="lc-icon-wrap">
              <span className="lc-icon">↩</span>
            </div>
            <h3 className="lc-title">Logging out?</h3>
            <p className="lc-desc">You'll need to sign in again to access your account.</p>
            <div className="lc-actions">
              <button className="lc-btn-cancel" onClick={() => setShowLogoutConfirm(false)} disabled={logoutLoading}>
                Stay
              </button>
              <button className="lc-btn-confirm" onClick={handleLogout} disabled={logoutLoading}>
                {logoutLoading ? <span className="lc-spinner" /> : null}
                {logoutLoading ? "Logging out…" : "Yes, Log Out"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const styles = `
  .pp-backdrop {
    position: fixed; inset: 0; z-index: 998;
  }
  .pp-popup {
    position: fixed; top: 74px; right: 20px; z-index: 999;
    width: 320px;
    background: #ffffff;
    border: 1px solid rgba(201,168,76,0.22);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(14,12,10,0.18), 0 4px 16px rgba(14,12,10,0.1);
    overflow: hidden;
    animation: ppSlide 0.22s cubic-bezier(0.34,1.2,0.64,1) both;
    font-family: 'DM Sans', sans-serif;
  }
  @keyframes ppSlide {
    from { opacity: 0; transform: translateY(-10px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Header */
  .pp-header {
    display: flex; align-items: center; gap: 12px;
    padding: 18px 18px 14px;
    border-bottom: 1px solid rgba(201,168,76,0.12);
    background: #faf7f2;
  }
  .pp-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    background: #0e0c0a; color: #c9a84c;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600;
    flex-shrink: 0;
    border: 2px solid rgba(201,168,76,0.3);
  }
  .pp-header-info { flex: 1; min-width: 0; }
  .pp-name { display: block; font-size: 13.5px; font-weight: 500; color: #0e0c0a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pp-role-badge {
    display: inline-block; margin-top: 3px;
    font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
    background: rgba(201,168,76,0.1); color: #a07b28;
    border: 1px solid rgba(201,168,76,0.25);
    padding: 2px 8px; border-radius: 20px;
  }
  .pp-close {
    background: none; border: none; cursor: pointer;
    font-size: 12px; color: #7a7265; width: 28px; height: 28px;
    border-radius: 6px; display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, color 0.2s; flex-shrink: 0;
  }
  .pp-close:hover { background: #f0ece4; color: #0e0c0a; }

  /* Tabs */
  .pp-tabs {
    display: flex;
    border-bottom: 1px solid rgba(201,168,76,0.12);
    background: #faf7f2;
  }
  .pp-tab {
    flex: 1; padding: 10px 0;
    background: none; border: none; border-bottom: 2px solid transparent;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: #7a7265;
    cursor: pointer; transition: color 0.2s, border-color 0.2s;
    margin-bottom: -1px;
  }
  .pp-tab:hover { color: #0e0c0a; }
  .pp-tab.active { color: #0e0c0a; font-weight: 500; border-bottom-color: #c9a84c; }

  /* Message */
  .pp-msg {
    margin: 12px 16px 0;
    font-size: 12px; border-radius: 8px; padding: 9px 12px;
  }
  .pp-msg-success { background: rgba(58,138,98,0.08); color: #2d6a4f; border: 1px solid rgba(58,138,98,0.2); }
  .pp-msg-error   { background: rgba(184,92,92,0.08); color: #b85c5c; border: 1px solid rgba(184,92,92,0.2); }

  /* Body */
  .pp-body { padding: 16px 16px 4px; }
  .pp-field { margin-bottom: 12px; }
  .pp-label { display: block; font-size: 10.5px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: #7a7265; margin-bottom: 6px; }
  .pp-input {
    width: 100%; padding: 9px 12px;
    border: 1px solid rgba(201,168,76,0.22); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: #0e0c0a;
    background: #faf7f2; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .pp-input:focus { border-color: #c9a84c; box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .pp-input::placeholder { color: #bbb4a8; }
  .pp-btn-primary {
    width: 100%; padding: 11px;
    background: #0e0c0a; color: #ffffff;
    border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: background 0.22s, transform 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 4px;
  }
  .pp-btn-primary:hover:not(:disabled) { background: #c9a84c; color: #0e0c0a; }
  .pp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .pp-spinner {
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: ppSpin 0.7s linear infinite; display: inline-block;
  }
  @keyframes ppSpin { to { transform: rotate(360deg); } }

  /* Footer */
  .pp-footer {
    padding: 12px 16px 14px;
    border-top: 1px solid rgba(201,168,76,0.12);
    background: #faf7f2;
  }
  .pp-logout-btn {
    width: 100%; padding: 9px;
    background: none; border: 1px solid rgba(184,92,92,0.25);
    border-radius: 8px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: #b85c5c;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: background 0.2s, border-color 0.2s;
  }
  .pp-logout-btn:hover { background: rgba(184,92,92,0.06); border-color: #b85c5c; }
  .pp-logout-icon { font-size: 14px; }

  /* ── Logout Confirmation Modal ── */
  .lc-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(14,12,10,0.45);
    backdrop-filter: blur(4px);
    animation: lcFadeIn 0.2s ease both;
  }
  @keyframes lcFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .lc-modal {
    position: fixed; z-index: 1001;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    background: #ffffff;
    border-radius: 18px;
    border: 1px solid rgba(201,168,76,0.18);
    box-shadow: 0 24px 64px rgba(14,12,10,0.22), 0 4px 16px rgba(14,12,10,0.1);
    padding: 28px 24px 22px;
    text-align: center;
    font-family: 'DM Sans', sans-serif;
    animation: lcPopIn 0.25s cubic-bezier(0.34,1.3,0.64,1) both;
  }
  @keyframes lcPopIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  .lc-icon-wrap {
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(184,92,92,0.08);
    border: 1.5px solid rgba(184,92,92,0.2);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .lc-icon {
    font-size: 22px; color: #b85c5c;
    display: inline-block;
  }
  .lc-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.25rem; font-weight: 600;
    color: #0e0c0a; margin: 0 0 8px;
    letter-spacing: 0.01em;
  }
  .lc-desc {
    font-size: 12.5px; color: #7a7265;
    margin: 0 0 22px; line-height: 1.5;
  }
  .lc-actions {
    display: flex; gap: 10px;
  }
  .lc-btn-cancel {
    flex: 1; padding: 10px;
    background: #faf7f2;
    border: 1px solid rgba(201,168,76,0.22);
    border-radius: 8px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    font-weight: 500; color: #0e0c0a;
    transition: background 0.2s, border-color 0.2s;
  }
  .lc-btn-cancel:hover { background: #f0ece4; border-color: rgba(201,168,76,0.4); }
  .lc-btn-confirm {
    flex: 1; padding: 10px;
    background: #b85c5c; color: #ffffff;
    border: none; border-radius: 8px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    transition: background 0.2s, transform 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }
  .lc-btn-confirm:hover { background: #a04a4a; transform: scale(1.02); }
  .lc-btn-confirm:disabled { opacity: 0.75; cursor: not-allowed; transform: none; }
  .lc-btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
  .lc-spinner {
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: ppSpin 0.7s linear infinite; display: inline-block;
    flex-shrink: 0;
  }
`;