import { useState } from "react";
import API from "../services/api";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!data.email || !data.password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", data);
      localStorage.setItem("token", res.data.token);
localStorage.setItem("user", JSON.stringify(res.data.user));
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      setError(err?.response?.data?.msg || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="lg-root">

        {/* LEFT PANEL */}
        <div className="lg-left">
          <div className="lg-left-inner">
            <div className="lg-logo">✦ Eventify</div>

            <div className="lg-quote-block">
              <span className="lg-quote-mark">"</span>
              <p className="lg-quote">
                The details are not the details.<br />
                They make the design.
              </p>
              <span className="lg-quote-author">— Charles Eames</span>
            </div>

            <div className="lg-stats">
              {[
                { num: "12K+", label: "Happy Clients" },
                { num: "850+", label: "Verified Vendors" },
                { num: "4.9★", label: "Avg. Rating" },
              ].map((s, i) => (
                <div key={i} className="lg-stat">
                  <span className="lg-stat-num">{s.num}</span>
                  <span className="lg-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg-orb lg-orb1" />
          <div className="lg-orb lg-orb2" />
          <div className="lg-orb lg-orb3" />
        </div>

        {/* RIGHT PANEL */}
        <div className="lg-right">
          <div className="lg-card">

            {success ? (
              <div className="lg-success">
                <div className="lg-success-ring">
                  <span>✓</span>
                </div>
                <h3>Welcome back!</h3>
                <p>Login successful. Redirecting you now…</p>
                <div className="lg-progress-bar">
                  <div className="lg-progress-fill" />
                </div>
              </div>
            ) : (
              <>
                <div className="lg-card-header">
                  <p className="lg-eyebrow">✦ Welcome back</p>
                  <h1>Sign in to<br />your account</h1>
                  <p className="lg-sub-text">
                    Don't have an account?{" "}
                    <a href="/register" className="lg-link">Create one →</a>
                  </p>
                </div>

                <div className="lg-fields" onKeyDown={handleKeyDown}>
                  <div className="lg-field">
                    <label>Email Address</label>
                    <div className="lg-input-wrap">
                      <span className="lg-icon">✉</span>
                      <input
                        type="email"
                        placeholder="jane@example.com"
                        value={data.email}
                        onChange={(e) => setData({ ...data, email: e.target.value })}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="lg-field">
                    <div className="lg-label-row">
                      <label>Password</label>
                      <a href="/forgot-password" className="lg-link lg-forgot">Forgot password?</a>
                    </div>
                    <div className="lg-input-wrap">
                      <span className="lg-icon">◆</span>
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Enter your password"
                        value={data.password}
                        onChange={(e) => setData({ ...data, password: e.target.value })}
                        autoComplete="current-password"
                      />
                      <button
                        className="lg-eye"
                        onClick={() => setShowPass(!showPass)}
                        tabIndex={-1}
                      >
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="lg-error">
                    <span>⚠</span> {error}
                  </div>
                )}

                <button
                  className={`lg-submit ${loading ? "loading" : ""}`}
                  onClick={handleSubmit}
                  disabled={loading || success}
                >
                  {loading
                    ? <span className="lg-spinner" />
                    : "Sign In →"}
                </button>

                <div className="lg-divider">
                  <span>or continue with</span>
                </div>

                <div className="lg-socials">

  {/* GOOGLE LOGIN */}
  <GoogleLogin
    onSuccess={async (credentialResponse) => {
      try {
        const res = await API.post("/auth/google", {
          token: credentialResponse.credential,
        });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        window.location.href = "/";

      } catch (err) {
        console.error("Google login error:", err);
        setError("Google login failed");
      }
    }}
    onError={() => setError("Google login failed")}
  />

  {/* OPTIONAL: keep Facebook UI */}
  <button className="lg-social-btn">
    <span className="lg-social-icon">f</span>
    Facebook
  </button>

</div>

                <p className="lg-terms">
                  Protected by reCAPTCHA ·{" "}
                  <a href="#" className="lg-link">Privacy</a> ·{" "}
                  <a href="#" className="lg-link">Terms</a>
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
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

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

  .lg-root {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
  }
  @media (max-width: 780px) {
    .lg-root { grid-template-columns: 1fr; }
    .lg-left { display: none; }
  }

  /* ── LEFT ── */
  .lg-left {
    background: var(--ink);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 60px 56px;
  }
  .lg-left-inner { position: relative; z-index: 2; width: 100%; }

  .lg-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--gold);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 80px;
  }

  .lg-quote-block { margin-bottom: 72px; }
  .lg-quote-mark {
    font-family: 'Cormorant Garamond', serif;
    font-size: 5rem;
    color: var(--gold);
    opacity: 0.4;
    line-height: 0.6;
    display: block;
    margin-bottom: 16px;
  }
  .lg-quote {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.6rem, 2.8vw, 2.2rem);
    font-weight: 300;
    font-style: italic;
    color: var(--cream);
    line-height: 1.35;
    margin-bottom: 16px;
  }
  .lg-quote-author {
    font-size: 12px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .lg-stats {
    display: flex;
    gap: 0;
    border-top: 1px solid rgba(201,168,76,0.15);
    padding-top: 32px;
  }
  .lg-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-right: 24px;
    border-right: 1px solid rgba(201,168,76,0.15);
  }
  .lg-stat:last-child { border-right: none; padding-right: 0; padding-left: 24px; }
  .lg-stat:not(:first-child):not(:last-child) { padding-left: 24px; }
  .lg-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--gold);
  }
  .lg-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; }

  .lg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.14;
    pointer-events: none;
  }
  .lg-orb1 { width: 380px; height: 380px; background: var(--gold);    top: -80px;  right: -100px; }
  .lg-orb2 { width: 280px; height: 280px; background: #7b5ea7;        bottom: -60px; left: -40px;  }
  .lg-orb3 { width: 180px; height: 180px; background: var(--gold);    bottom: 120px; right: 40px; opacity: 0.07; }

  /* ── RIGHT ── */
  .lg-right {
    background: var(--cream);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
  }

  .lg-card {
    width: 100%;
    max-width: 400px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 44px 40px;
    box-shadow: 0 12px 48px rgba(14,12,10,0.07);
    animation: fadeUp 0.5s ease both;
  }

  .lg-card-header { margin-bottom: 32px; }
  .lg-eyebrow {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 10px;
  }
  .lg-card-header h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.1rem;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.15;
    margin-bottom: 10px;
  }
  .lg-sub-text { font-size: 13px; color: var(--muted); }

  /* FIELDS */
  .lg-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 20px; }
  .lg-field { display: flex; flex-direction: column; gap: 7px; }
  .lg-label-row { display: flex; justify-content: space-between; align-items: center; }
  .lg-field label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .lg-forgot { font-size: 11px !important; }

  .lg-input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 13px 14px;
    background: var(--surface);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .lg-input-wrap:focus-within {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
    background: var(--white);
  }
  .lg-icon { font-size: 13px; color: var(--gold); opacity: 0.8; flex-shrink: 0; }
  .lg-input-wrap input {
    border: none; background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--ink);
    outline: none; width: 100%;
  }
  .lg-input-wrap input::placeholder { color: #bbb4a8; }
  .lg-eye {
    background: none; border: none; cursor: pointer;
    font-size: 14px; padding: 0; line-height: 1; flex-shrink: 0;
    opacity: 0.7; transition: opacity 0.15s;
  }
  .lg-eye:hover { opacity: 1; }

  .lg-error {
    font-size: 12.5px;
    color: var(--error);
    background: rgba(184,92,92,0.07);
    border: 1px solid rgba(184,92,92,0.2);
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* SUBMIT */
  .lg-submit {
    width: 100%;
    padding: 15px;
    background: var(--ink);
    color: var(--white);
    border: none;
    border-radius: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 22px;
    min-height: 50px;
  }
  .lg-submit:hover:not(:disabled) {
    background: var(--gold);
    color: var(--ink);
    box-shadow: 0 6px 24px rgba(201,168,76,0.3);
    transform: translateY(-1px);
  }
  .lg-submit.loading { opacity: 0.65; pointer-events: none; }
  .lg-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  /* DIVIDER */
  .lg-divider {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 16px;
  }
  .lg-divider::before, .lg-divider::after {
    content: ''; flex: 1;
    height: 1px; background: var(--border);
  }
  .lg-divider span { font-size: 11px; color: var(--muted); white-space: nowrap; letter-spacing: 0.08em; }

  /* SOCIALS */
  .lg-socials { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .lg-social-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: var(--surface);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 400;
  }
  .lg-social-btn:hover {
    border-color: var(--gold);
    background: var(--white);
    box-shadow: 0 2px 12px rgba(201,168,76,0.12);
  }
  .lg-social-icon {
    width: 20px; height: 20px;
    background: var(--ink); color: var(--white);
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    flex-shrink: 0;
  }

  .lg-terms { font-size: 11px; color: var(--muted); text-align: center; line-height: 1.7; }
  .lg-link { color: var(--gold); text-decoration: none; font-weight: 500; }
  .lg-link:hover { text-decoration: underline; }

  /* SUCCESS */
  .lg-success {
    text-align: center;
    padding: 16px 0;
    animation: fadeUp 0.4s ease both;
  }
  .lg-success-ring {
    width: 64px; height: 64px;
    border: 2px solid rgba(45,106,79,0.4);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; color: var(--success);
    margin: 0 auto 20px;
    background: rgba(45,106,79,0.07);
    animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
  }
  .lg-success h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 600;
    color: var(--ink); margin-bottom: 8px;
  }
  .lg-success p { font-size: 13.5px; color: var(--muted); margin-bottom: 28px; }
  .lg-progress-bar {
    height: 2px; background: var(--border);
    border-radius: 2px; overflow: hidden;
  }
  .lg-progress-fill {
    height: 100%; width: 0;
    background: var(--gold);
    animation: progress 1.2s ease forwards;
    border-radius: 2px;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes popIn {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }
  @keyframes progress {
    from { width: 0; }
    to   { width: 100%; }
  }
`;