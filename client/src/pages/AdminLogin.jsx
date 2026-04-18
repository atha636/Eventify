import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Logo from "../components/Logo";
export default function AdminLogin() {
  const navigate  = useNavigate();
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [data, setData]       = useState({ name: "", email: "", password: "", adminSecret: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!data.email || !data.password) { setError("Email and password are required."); return; }
    if (mode === "register" && (!data.name || !data.adminSecret)) {
      setError("Name and admin secret are required."); return;
    }
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/admin/login" : "/admin/register";
      const payload  = mode === "login"
        ? { email: data.email, password: data.password }
        : { name: data.name, email: data.email, password: data.password, adminSecret: data.adminSecret };

      const res = await API.post(endpoint, payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/admin");
    } catch (err) {
      setError(err?.response?.data?.msg || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="al-root">
        {/* Left panel */}
        <div className="al-left">
          <div className="al-left-inner">
            <div className="al-logo"> <Logo /> Evencers</div>
            <h2 className="al-tagline">Admin Control Centre</h2>
            <p className="al-sub">Full oversight of users, vendors, services, and platform bookings. Restricted access only.</p>
            <div className="al-perms">
              {["Manage all users & vendors","Oversee every booking","Approve or suspend services","Full platform analytics"].map((p, i) => (
                <div key={i} className="al-perm">
                  <span className="al-perm-icon">◈</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="al-orb al-orb1" />
          <div className="al-orb al-orb2" />
        </div>

        {/* Right panel */}
        <div className="al-right">
          <div className="al-card">
            <div className="al-shield">🛡️</div>
            <div className="al-card-header">
              <h1>{mode === "login" ? "Admin Sign In" : "Create Admin"}</h1>
              <p>{mode === "login" ? "Restricted to authorised personnel only." : "Requires a valid admin secret key."}</p>
            </div>

            {/* Toggle */}
            <div className="al-toggle">
              {["login","register"].map((m) => (
                <button key={m} className={`al-toggle-btn ${mode === m ? "active" : ""}`} onClick={() => { setMode(m); setError(""); }}>
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <div className="al-fields">
              {mode === "register" && (
                <div className="al-field">
                  <label>Full Name</label>
                  <div className="al-input-wrap">
                    <span className="al-icon">◈</span>
                    <input placeholder="Admin Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                  </div>
                </div>
              )}
              <div className="al-field">
                <label>Email Address</label>
                <div className="al-input-wrap">
                  <span className="al-icon">✉</span>
                  <input type="email" placeholder="admin@evencers.com" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
                </div>
              </div>
              <div className="al-field">
                <label>Password</label>
                <div className="al-input-wrap">
                  <span className="al-icon">◆</span>
                  <input type={showPass ? "text" : "password"} placeholder="••••••••" value={data.password} onChange={e => setData({...data, password: e.target.value})}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                  <button className="al-eye" onClick={() => setShowPass(!showPass)}>{showPass ? "🙈" : "👁"}</button>
                </div>
              </div>
              {mode === "register" && (
                <div className="al-field">
                  <label>Admin Secret Key</label>
                  <div className="al-input-wrap al-secret">
                    <span className="al-icon">🔑</span>
                    <input type="password" placeholder="Enter secret from .env" value={data.adminSecret} onChange={e => setData({...data, adminSecret: e.target.value})} />
                  </div>
                  <p className="al-field-hint">This is the ADMIN_SECRET value set in your server .env file.</p>
                </div>
              )}
            </div>

            {error && <div className="al-error">⚠ {error}</div>}

            <button className={`al-submit ${loading ? "loading" : ""}`} onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="al-spinner" /> : (mode === "login" ? "Sign In to Admin Panel →" : "Create Admin Account →")}
            </button>

            <p className="al-back-link">
              <a href="/" className="al-link">← Back to Evencers</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c; --gold-light: #e8d5a3;
    --muted: #7a7265; --border: rgba(201,168,76,0.22); --surface: #faf7f2;
    --error: #b85c5c; --white: #ffffff;
  }
  .al-root { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
  @media (max-width: 780px) { .al-root { grid-template-columns: 1fr; } .al-left { display: none; } }

  .al-left { background: #0a0806; position: relative; overflow: hidden; display: flex; align-items: center; padding: 60px 56px; }
  .al-left-inner { position: relative; z-index: 2; }
  .al-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--gold); letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 56px; }
  .al-tagline { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 300; color: var(--cream); margin-bottom: 14px; line-height: 1.25; }
  .al-sub { font-size: 13px; color: var(--muted); line-height: 1.7; margin-bottom: 48px; max-width: 300px; }
  .al-perms { display: flex; flex-direction: column; gap: 12px; }
  .al-perm { display: flex; gap: 12px; align-items: center; font-size: 13px; color: var(--gold-light); }
  .al-perm-icon { color: var(--gold); font-size: 14px; }
  .al-orb { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.12; pointer-events: none; }
  .al-orb1 { width: 350px; height: 350px; background: var(--gold); top: -80px; right: -100px; }
  .al-orb2 { width: 280px; height: 280px; background: #7b3fa7; bottom: -80px; left: -60px; }

  .al-right { background: var(--cream); display: flex; align-items: center; justify-content: center; padding: 48px 32px; }
  .al-card { width: 100%; max-width: 420px; background: var(--white); border: 1px solid var(--border); border-radius: 16px; padding: 44px 40px; box-shadow: 0 12px 48px rgba(14,12,10,0.07); }
  .al-shield { font-size: 2.5rem; text-align: center; margin-bottom: 16px; }
  .al-card-header { text-align: center; margin-bottom: 28px; }
  .al-card-header h1 { font-family: 'Cormorant Garamond', serif; font-size: 1.9rem; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .al-card-header p { font-size: 12.5px; color: var(--muted); }

  .al-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 5px; margin-bottom: 28px; }
  .al-toggle-btn { padding: 10px; border: none; border-radius: 6px; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer; transition: all 0.22s; }
  .al-toggle-btn.active { background: var(--white); color: var(--ink); font-weight: 500; box-shadow: 0 2px 10px rgba(14,12,10,0.08); border: 1px solid var(--border); }

  .al-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 22px; }
  .al-field { display: flex; flex-direction: column; gap: 7px; }
  .al-field label { font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted); }
  .al-input-wrap { display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 7px; padding: 12px 14px; background: var(--surface); transition: border-color 0.2s, box-shadow 0.2s; }
  .al-input-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .al-secret { border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.04); }
  .al-icon { font-size: 13px; color: var(--gold); opacity: 0.8; flex-shrink: 0; }
  .al-input-wrap input { border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); outline: none; width: 100%; }
  .al-input-wrap input::placeholder { color: #bbb4a8; }
  .al-eye { background: none; border: none; cursor: pointer; font-size: 14px; padding: 0; flex-shrink: 0; }
  .al-field-hint { font-size: 11px; color: var(--muted); margin-top: 4px; }

  .al-error { font-size: 12.5px; color: var(--error); background: rgba(184,92,92,0.07); border: 1px solid rgba(184,92,92,0.2); border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
  .al-submit { width: 100%; padding: 15px; background: var(--ink); color: var(--white); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.25s; display: flex; align-items: center; justify-content: center; min-height: 50px; margin-bottom: 16px; }
  .al-submit:hover:not(:disabled) { background: var(--gold); color: var(--ink); box-shadow: 0 6px 24px rgba(201,168,76,0.3); }
  .al-submit.loading { opacity: 0.65; pointer-events: none; }
  .al-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  .al-back-link { text-align: center; font-size: 12px; }
  .al-link { color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .al-link:hover { color: var(--gold); }
  @keyframes spin { to { transform: rotate(360deg); } }
`;