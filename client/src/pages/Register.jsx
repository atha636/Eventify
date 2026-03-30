import { useState } from "react";
import API from "../services/api";

export default function Register() {
  const [data, setData] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!data.name || !data.email || !data.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/register", data);
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="rg-root">
        {/* LEFT PANEL */}
        <div className="rg-left">
          <div className="rg-left-inner">
            <div className="rg-logo">✦ Eventique</div>
            <h2 className="rg-tagline">
              Every great event<br />begins with a single step.
            </h2>
            <p className="rg-sub">Join thousands of couples, planners, and vendors building unforgettable moments.</p>
            <div className="rg-features">
              {["Verified premium vendors", "Instant booking & confirmation", "Secure payments, zero fees"].map((f, i) => (
                <div key={i} className="rg-feature-item">
                  <span className="rg-check">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rg-orb rg-orb1" />
          <div className="rg-orb rg-orb2" />
        </div>

        {/* RIGHT PANEL */}
        <div className="rg-right">
          <div className="rg-card">
            {done ? (
              <div className="rg-success">
                <div className="rg-success-icon">✓</div>
                <h3>Welcome aboard!</h3>
                <p>Your account has been created. You can now log in and start exploring.</p>
                <a href="/login" className="rg-login-link">Go to Login →</a>
              </div>
            ) : (
              <>
                <div className="rg-card-header">
                  <h1>Create account</h1>
                  <p>Already have one? <a href="/login" className="rg-link">Sign in</a></p>
                </div>

                {/* ROLE TOGGLE */}
                <div className="rg-role-toggle">
                  {["user", "vendor"].map((r) => (
                    <button
                      key={r}
                      className={`rg-role-btn ${data.role === r ? "active" : ""}`}
                      onClick={() => setData({ ...data, role: r })}
                    >
                      {r === "user" ? "👤 I'm a Client" : "🏢 I'm a Vendor"}
                    </button>
                  ))}
                </div>

                <div className="rg-fields">
                  <div className="rg-field">
                    <label>Full Name</label>
                    <div className="rg-input-wrap">
                      <span className="rg-icon">◈</span>
                      <input
                        placeholder="Jane Doe"
                        value={data.name}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="rg-field">
                    <label>Email Address</label>
                    <div className="rg-input-wrap">
                      <span className="rg-icon">✉</span>
                      <input
                        placeholder="jane@example.com"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData({ ...data, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="rg-field">
                    <label>Password</label>
                    <div className="rg-input-wrap">
                      <span className="rg-icon">◆</span>
                      <input
                        placeholder="Min. 8 characters"
                        type={showPass ? "text" : "password"}
                        value={data.password}
                        onChange={(e) => setData({ ...data, password: e.target.value })}
                      />
                      <button className="rg-eye" onClick={() => setShowPass(!showPass)}>
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                </div>

                {error && <p className="rg-error">⚠ {error}</p>}

                <button
                  className={`rg-submit ${loading ? "loading" : ""}`}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <span className="rg-spinner" /> : "Create My Account →"}
                </button>

                <p className="rg-terms">
                  By registering, you agree to our <a href="#" className="rg-link">Terms</a> and <a href="#" className="rg-link">Privacy Policy</a>.
                </p>
              </>
            )}
          </div>
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
    --border: rgba(201,168,76,0.22);
    --surface: #faf7f2;
    --error: #b85c5c;
    --success: #2d6a4f;
    --white: #ffffff;
  }

  .rg-root {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
  }
  @media (max-width: 780px) {
    .rg-root { grid-template-columns: 1fr; }
    .rg-left { display: none; }
  }

  /* LEFT */
  .rg-left {
    background: var(--ink);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 60px 56px;
  }
  .rg-left-inner { position: relative; z-index: 2; }
  .rg-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--gold);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 64px;
  }
  .rg-tagline {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 3.5vw, 2.8rem);
    font-weight: 300;
    font-style: italic;
    color: var(--cream);
    line-height: 1.2;
    margin-bottom: 20px;
  }
  .rg-sub {
    font-size: 13.5px;
    color: var(--muted);
    line-height: 1.7;
    margin-bottom: 48px;
    max-width: 320px;
  }
  .rg-features { display: flex; flex-direction: column; gap: 14px; }
  .rg-feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: var(--gold-light);
  }
  .rg-check {
    width: 22px; height: 22px;
    border: 1px solid var(--gold);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    color: var(--gold);
    flex-shrink: 0;
  }
  .rg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.18;
    pointer-events: none;
  }
  .rg-orb1 { width: 400px; height: 400px; background: var(--gold); top: -100px; right: -120px; }
  .rg-orb2 { width: 300px; height: 300px; background: #8b5c8b; bottom: -80px; left: -60px; }

  /* RIGHT */
  .rg-right {
    background: var(--cream);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
  }
  .rg-card {
    width: 100%;
    max-width: 420px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 44px 40px;
    box-shadow: 0 12px 48px rgba(14,12,10,0.07);
    animation: fadeUp 0.5s ease both;
  }

  .rg-card-header { margin-bottom: 28px; }
  .rg-card-header h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 6px;
  }
  .rg-card-header p { font-size: 13px; color: var(--muted); }

  /* ROLE TOGGLE */
  .rg-role-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 5px;
    margin-bottom: 28px;
  }
  .rg-role-btn {
    padding: 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.22s ease;
    font-weight: 400;
  }
  .rg-role-btn.active {
    background: var(--white);
    color: var(--ink);
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(14,12,10,0.08);
    border: 1px solid var(--border);
  }

  /* FIELDS */
  .rg-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 22px; }
  .rg-field { display: flex; flex-direction: column; gap: 7px; }
  .rg-field label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .rg-input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 12px 14px;
    background: var(--surface);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .rg-input-wrap:focus-within {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }
  .rg-icon { font-size: 13px; color: var(--gold); opacity: 0.8; flex-shrink: 0; }
  .rg-input-wrap input {
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--ink);
    outline: none;
    width: 100%;
  }
  .rg-input-wrap input::placeholder { color: #bbb4a8; }
  .rg-eye {
    background: none; border: none; cursor: pointer;
    font-size: 14px; padding: 0; line-height: 1; flex-shrink: 0;
  }

  .rg-error {
    font-size: 12.5px;
    color: var(--error);
    background: rgba(184,92,92,0.07);
    border: 1px solid rgba(184,92,92,0.2);
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 16px;
  }

  .rg-submit {
    width: 100%;
    padding: 15px;
    background: var(--ink);
    color: var(--white);
    border: none;
    border-radius: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    min-height: 50px;
  }
  .rg-submit:hover:not(:disabled) {
    background: var(--gold);
    color: var(--ink);
    box-shadow: 0 6px 24px rgba(201,168,76,0.3);
    transform: translateY(-1px);
  }
  .rg-submit.loading { opacity: 0.65; pointer-events: none; }
  .rg-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  .rg-terms { font-size: 11.5px; color: var(--muted); text-align: center; line-height: 1.6; }
  .rg-link { color: var(--gold); text-decoration: none; font-weight: 500; }
  .rg-link:hover { text-decoration: underline; }

  /* SUCCESS */
  .rg-success {
    text-align: center;
    padding: 20px 0;
    animation: fadeUp 0.5s ease both;
  }
  .rg-success-icon {
    width: 60px; height: 60px;
    background: rgba(45,106,79,0.1);
    border: 1px solid rgba(45,106,79,0.3);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    color: var(--success);
    margin: 0 auto 20px;
  }
  .rg-success h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.7rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 10px;
  }
  .rg-success p { font-size: 13.5px; color: var(--muted); line-height: 1.6; margin-bottom: 24px; }
  .rg-login-link {
    display: inline-block;
    padding: 12px 28px;
    background: var(--ink);
    color: var(--white);
    border-radius: 6px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
  }
  .rg-login-link:hover { background: var(--gold); color: var(--ink); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;