import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { GoogleLogin } from "@react-oauth/google";
import Logo from "../components/Logo";
const OTP_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_OTP_SENDS = 3;

export default function Register() {
  const [data, setData] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("register");
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [otpSendCount, setOtpSendCount] = useState(0);
  const [windowExpiry, setWindowExpiry] = useState(null); // timestamp when 1-min window resets
  const [windowTimer, setWindowTimer] = useState(0); // countdown to window reset
  const [maxReached, setMaxReached] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const otpRefs = useRef([]);

  // ─── RESTORE STATE FROM LOCALSTORAGE ────────────────────────────────
  useEffect(() => {
    const savedStep = localStorage.getItem("otp_step");
    const savedEmail = localStorage.getItem("otp_email");
    const savedExpiry = localStorage.getItem("otp_resend_expiry"); // when next resend unlocks
    const savedCount = parseInt(localStorage.getItem("otp_send_count") || "0", 10);
    const savedWindowExpiry = localStorage.getItem("otp_window_expiry"); // 1-min window end

    if (savedStep === "otp" && savedEmail) {
      setStep("otp");
      setData((prev) => ({ ...prev, email: savedEmail }));
      setOtpSendCount(savedCount);

      const now = Date.now();

      // Check if 1-min send window is expired → reset count
      if (savedWindowExpiry) {
        const winExp = parseInt(savedWindowExpiry, 10);
        if (now < winExp) {
          setWindowExpiry(winExp);
          if (savedCount >= MAX_OTP_SENDS) {
            setMaxReached(true);
          }
        } else {
          // Window expired, reset
          localStorage.setItem("otp_send_count", "0");
          localStorage.removeItem("otp_window_expiry");
          setOtpSendCount(0);
          setMaxReached(false);
        }
      }

      // Restore per-resend 30s timer
      if (savedExpiry) {
        const remaining = Math.ceil((parseInt(savedExpiry, 10) - now) / 1000);
        if (remaining > 0) {
          setTimer(remaining);
          setCanResend(false);
        } else {
          setCanResend(true);
          setTimer(0);
        }
      }
    }
  }, []);

  // ─── 30s RESEND COUNTDOWN ────────────────────────────────────────────
  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, step]);

  // ─── 1-MIN WINDOW COUNTDOWN ──────────────────────────────────────────
  useEffect(() => {
    if (!windowExpiry) return;
    const tick = () => {
      const remaining = Math.ceil((windowExpiry - Date.now()) / 1000);
      if (remaining <= 0) {
        setWindowTimer(0);
        setWindowExpiry(null);
        setMaxReached(false);
        setOtpSendCount(0);
        setCanResend(true);
        localStorage.setItem("otp_send_count", "0");
        localStorage.removeItem("otp_window_expiry");
      } else {
        setWindowTimer(remaining);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [windowExpiry]);

  // ─── FOCUS FIRST OTP INPUT ON STEP CHANGE ───────────────────────────
  useEffect(() => {
    if (step === "otp") setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, [step]);

  // ─── SEND OTP / REGISTER ─────────────────────────────────────────────
  const sendOtp = async (isResend = false) => {
    if (!data.name || !data.email || !data.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/register", data);

      const now = Date.now();
      const newCount = isResend ? otpSendCount + 1 : 1;
      setOtpSendCount(newCount);
      localStorage.setItem("otp_send_count", String(newCount));

      // Set 1-min window on first send
      if (!isResend || !windowExpiry) {
        const winEnd = now + OTP_WINDOW_MS;
        setWindowExpiry(winEnd);
        localStorage.setItem("otp_window_expiry", String(winEnd));
      }

      if (newCount >= MAX_OTP_SENDS) {
        setMaxReached(true);
        setCanResend(false);
      } else {
        setCanResend(false);
        const resendExpiry = now + 30000;
        setTimer(30);
        localStorage.setItem("otp_resend_expiry", String(resendExpiry));
      }

      setStep("otp");
      localStorage.setItem("otp_email", data.email);
      localStorage.setItem("otp_step", "otp");
    } catch (err) {
      setError(err?.response?.data?.msg || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP INPUT HANDLING ──────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ─── VERIFY OTP ──────────────────────────────────────────────────────
  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/verify-otp", { email: data.email, otp: otpString });
      localStorage.removeItem("otp_step");
      localStorage.removeItem("otp_email");
      localStorage.removeItem("otp_resend_expiry");
      localStorage.removeItem("otp_send_count");
      localStorage.removeItem("otp_window_expiry");
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setVerifySuccess(true);
      setTimeout(() => (window.location.href = "/"), 1200);
    } catch (err) {
      setError(err?.response?.data?.msg || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const filledCount = otp.filter(Boolean).length;
  const progressPct = (filledCount / 6) * 100;

  return (
    <>
      <style>{styles}</style>
      <div className="rg-root">
        {/* LEFT PANEL */}
        <div className="rg-left">
          <div className="rg-left-inner">
            <div className="rg-logo"><Logo /> Evencers</div>
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

            {/* ── OTP STEP ── */}
            {step === "otp" ? (
              <div className="otp-wrapper">

                {/* Header */}
                <div className="otp-header">
                  <div className="otp-icon-ring">
                    {verifySuccess ? (
                      <span className="otp-icon-success">✓</span>
                    ) : (
                      <span className="otp-icon-envelope">✉</span>
                    )}
                    {!verifySuccess && <div className="otp-icon-pulse" />}
                  </div>
                  <h2 className="otp-title">
                    {verifySuccess ? "Verified!" : "Check your inbox"}
                  </h2>
                  <p className="otp-subtitle">
                    {verifySuccess
                      ? "Redirecting you to your dashboard…"
                      : <>We sent a 6-digit code to<br /><strong>{data.email}</strong></>
                    }
                  </p>
                </div>

                {!verifySuccess && (
                  <>
                    {/* Attempt badge */}
                    <div className="otp-attempt-bar">
                      {[...Array(MAX_OTP_SENDS)].map((_, i) => (
                        <div
                          key={i}
                          className={`otp-attempt-dot ${i < otpSendCount ? "used" : ""}`}
                          title={i < otpSendCount ? "OTP sent" : "Available"}
                        />
                      ))}
                      <span className="otp-attempt-label">
                        {otpSendCount}/{MAX_OTP_SENDS} sends used
                      </span>
                    </div>

                    {/* Max reached lockout */}
                    {maxReached && (
                      <div className="otp-lockout">
                        <span className="otp-lockout-icon">⏳</span>
                        <div>
                          <p className="otp-lockout-title">Maximum OTPs reached</p>
                          <p className="otp-lockout-sub">
                            You can request a new code in <strong>{windowTimer}s</strong>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* OTP Boxes */}
                    <div className="otp-boxes" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          className={`otp-box ${digit ? "filled" : ""} ${error ? "shake" : ""}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          disabled={verifySuccess}
                        />
                      ))}
                    </div>

                    {/* Fill progress */}
                    <div className="otp-progress-track">
                      <div className="otp-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="otp-error">
                        <span>⚠</span> {error}
                      </div>
                    )}

                    {/* Verify button */}
                    <button
                      className={`rg-submit ${loading ? "loading" : ""} ${filledCount === 6 ? "ready" : ""}`}
                      disabled={loading || filledCount < 6}
                      onClick={handleVerify}
                    >
                      {loading ? <span className="rg-spinner" /> : (
                        <span className="otp-btn-inner">
                          Verify & Continue
                          <span className="otp-btn-arrow">→</span>
                        </span>
                      )}
                    </button>

                    {/* Resend row */}
                    <div className="otp-resend-row">
                      <span className="otp-resend-label">Didn't receive it?</span>
                      {maxReached ? (
                        <span className="otp-resend-locked">Wait {windowTimer}s to resend</span>
                      ) : canResend ? (
                        <button
                          className="otp-resend-btn"
                          onClick={() => sendOtp(true)}
                          disabled={loading}
                        >
                          Resend code
                        </button>
                      ) : (
                        <span className="otp-timer-badge">
                          <span className="otp-timer-ring">
                            <svg viewBox="0 0 36 36" className="otp-ring-svg">
                              <circle cx="18" cy="18" r="15" className="otp-ring-track" />
                              <circle
                                cx="18" cy="18" r="15"
                                className="otp-ring-progress"
                                strokeDasharray={`${((30 - timer) / 30) * 94} 94`}
                              />
                            </svg>
                          </span>
                          Resend in {timer}s
                        </span>
                      )}
                    </div>

                    {/* Change email */}
                    <div className="otp-change-email">
                      <button
                        className="otp-change-btn"
                        onClick={() => {
                          setStep("register");
                          setOtp(["", "", "", "", "", ""]);
                          setError("");
                          localStorage.removeItem("otp_step");
                        }}
                      >
                        ← Change email address
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ── REGISTER STEP ── */
              <>
                <div className="rg-card-header">
                  <h1>Create account</h1>
                  <p>Already have one? <a href="/login" className="rg-link">Sign in</a></p>
                </div>

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
                  onClick={() => sendOtp(false)}
                  disabled={loading}
                >
                  {loading ? <span className="rg-spinner" /> : "Create My Account →"}
                </button>

                <div style={{ marginTop: "16px" }}>
                  <div style={{ textAlign: "center", marginBottom: "10px", fontSize: "12px", color: "#7a7265" }}>
                    or continue with
                  </div>
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      try {
                        const res = await API.post("/auth/google", { token: credentialResponse.credential });
                        localStorage.setItem("token", res.data.token);
                        localStorage.setItem("user", JSON.stringify(res.data.user));
                        window.location.href = "/";
                      } catch {
                        setError("Google signup failed");
                      }
                    }}
                    onError={() => setError("Google signup failed")}
                  />
                </div>

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

  /* ─── LEFT ─── */
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
  .rg-sub { font-size: 13.5px; color: var(--muted); line-height: 1.7; margin-bottom: 48px; max-width: 320px; }
  .rg-features { display: flex; flex-direction: column; gap: 14px; }
  .rg-feature-item { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--gold-light); }
  .rg-check {
    width: 22px; height: 22px;
    border: 1px solid var(--gold);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--gold); flex-shrink: 0;
  }
  .rg-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.18; pointer-events: none; }
  .rg-orb1 { width: 400px; height: 400px; background: var(--gold); top: -100px; right: -120px; }
  .rg-orb2 { width: 300px; height: 300px; background: #8b5c8b; bottom: -80px; left: -60px; }

  /* ─── RIGHT ─── */
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
    font-size: 2rem; font-weight: 600; color: var(--ink); margin-bottom: 6px;
  }
  .rg-card-header p { font-size: 13px; color: var(--muted); }

  /* ROLE TOGGLE */
  .rg-role-toggle {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 5px; margin-bottom: 28px;
  }
  .rg-role-btn {
    padding: 10px; border: none; border-radius: 6px;
    background: transparent; font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: var(--muted); cursor: pointer;
    transition: all 0.22s ease; font-weight: 400;
  }
  .rg-role-btn.active {
    background: var(--white); color: var(--ink); font-weight: 500;
    box-shadow: 0 2px 10px rgba(14,12,10,0.08); border: 1px solid var(--border);
  }

  /* FIELDS */
  .rg-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 22px; }
  .rg-field { display: flex; flex-direction: column; gap: 7px; }
  .rg-field label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.13em;
    text-transform: uppercase; color: var(--muted);
  }
  .rg-input-wrap {
    display: flex; align-items: center; gap: 10px;
    border: 1px solid var(--border); border-radius: 7px;
    padding: 12px 14px; background: var(--surface);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .rg-input-wrap:focus-within {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }
  .rg-icon { font-size: 13px; color: var(--gold); opacity: 0.8; flex-shrink: 0; }
  .rg-input-wrap input {
    border: none; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    color: var(--ink); outline: none; width: 100%;
  }
  .rg-input-wrap input::placeholder { color: #bbb4a8; }
  .rg-eye { background: none; border: none; cursor: pointer; font-size: 14px; padding: 0; line-height: 1; flex-shrink: 0; }
  .rg-error {
    font-size: 12.5px; color: var(--error);
    background: rgba(184,92,92,0.07); border: 1px solid rgba(184,92,92,0.2);
    border-radius: 6px; padding: 10px 14px; margin-bottom: 16px;
  }

  /* SUBMIT */
  .rg-submit {
    width: 100%; padding: 15px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    font-weight: 500; letter-spacing: 0.04em;
    cursor: pointer; transition: all 0.25s ease;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px; min-height: 50px;
    opacity: 0.5;
  }
  .rg-submit.ready, .rg-submit:not([disabled]) {
    opacity: 1;
  }
  .rg-submit:hover:not(:disabled) {
    background: var(--gold); color: var(--ink);
    box-shadow: 0 6px 24px rgba(201,168,76,0.3);
    transform: translateY(-1px);
  }
  .rg-submit.loading { opacity: 0.65; pointer-events: none; }
  .rg-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }
  .rg-terms { font-size: 11.5px; color: var(--muted); text-align: center; line-height: 1.6; }
  .rg-link { color: var(--gold); text-decoration: none; font-weight: 500; }
  .rg-link:hover { text-decoration: underline; }

  /* ─── OTP SECTION ─── */
  .otp-wrapper { animation: fadeUp 0.45s ease both; }

  .otp-header { text-align: center; margin-bottom: 28px; }

  .otp-icon-ring {
    position: relative;
    width: 68px; height: 68px;
    margin: 0 auto 18px;
    background: linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04));
    border: 1.5px solid var(--border);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .otp-icon-envelope { font-size: 26px; }
  .otp-icon-success {
    font-size: 28px; color: var(--success);
    animation: successPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .otp-icon-pulse {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1.5px solid rgba(201,168,76,0.35);
    animation: pulse 2s ease-in-out infinite;
  }
  .otp-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.75rem; font-weight: 600; color: var(--ink);
    margin-bottom: 8px;
  }
  .otp-subtitle { font-size: 13px; color: var(--muted); line-height: 1.6; }
  .otp-subtitle strong { color: var(--ink); font-weight: 500; }

  /* Attempt dots */
  .otp-attempt-bar {
    display: flex; align-items: center; gap: 8px;
    justify-content: center; margin-bottom: 22px;
  }
  .otp-attempt-dot {
    width: 10px; height: 10px; border-radius: 50%;
    border: 1.5px solid var(--border);
    background: var(--surface);
    transition: all 0.3s ease;
  }
  .otp-attempt-dot.used {
    background: var(--gold);
    border-color: var(--gold);
    box-shadow: 0 0 6px rgba(201,168,76,0.4);
  }
  .otp-attempt-label {
    font-size: 11px; color: var(--muted);
    letter-spacing: 0.06em; margin-left: 4px;
  }

  /* Lockout banner */
  .otp-lockout {
    display: flex; align-items: flex-start; gap: 12px;
    background: rgba(184,92,92,0.06);
    border: 1px solid rgba(184,92,92,0.18);
    border-radius: 10px; padding: 14px 16px;
    margin-bottom: 20px;
  }
  .otp-lockout-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
  .otp-lockout-title { font-size: 13px; font-weight: 500; color: var(--error); margin-bottom: 3px; }
  .otp-lockout-sub { font-size: 12px; color: var(--muted); }
  .otp-lockout-sub strong { color: var(--ink); }

  /* OTP Boxes */
  .otp-boxes {
    display: flex; justify-content: center; gap: 10px;
    margin-bottom: 14px;
  }
  .otp-box {
    width: 52px; height: 60px;
    text-align: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 600;
    color: var(--ink);
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    outline: none;
    transition: all 0.2s ease;
    caret-color: var(--gold);
  }
  .otp-box:focus {
    border-color: var(--gold);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(201,168,76,0.12), 0 4px 16px rgba(201,168,76,0.1);
    transform: translateY(-2px);
  }
  .otp-box.filled {
    border-color: rgba(201,168,76,0.5);
    background: linear-gradient(135deg, #fff 60%, rgba(201,168,76,0.05));
    color: var(--ink);
  }
  .otp-box.shake { animation: shake 0.4s ease; }

  /* Progress bar */
  .otp-progress-track {
    height: 2px;
    background: rgba(201,168,76,0.12);
    border-radius: 999px;
    margin-bottom: 18px;
    overflow: hidden;
  }
  .otp-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold-light), var(--gold));
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  /* Error */
  .otp-error {
    font-size: 12.5px; color: var(--error);
    background: rgba(184,92,92,0.07);
    border: 1px solid rgba(184,92,92,0.2);
    border-radius: 6px; padding: 10px 14px;
    margin-bottom: 16px; text-align: center;
  }

  /* Verify button inner */
  .otp-btn-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }
  .otp-btn-arrow { transition: transform 0.2s ease; }
  .rg-submit:hover .otp-btn-arrow { transform: translateX(4px); }

  /* Resend row */
  .otp-resend-row {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; font-size: 12.5px; color: var(--muted);
    margin-bottom: 16px;
  }
  .otp-resend-label { color: var(--muted); }
  .otp-resend-btn {
    background: none; border: none;
    color: var(--gold); font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500;
    cursor: pointer; padding: 0; text-decoration: underline;
    transition: opacity 0.2s;
  }
  .otp-resend-btn:hover { opacity: 0.75; }
  .otp-resend-locked { font-size: 12px; color: var(--error); font-weight: 500; }

  /* Circular timer badge */
  .otp-timer-badge {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--muted);
  }
  .otp-timer-ring { width: 20px; height: 20px; display: inline-block; }
  .otp-ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .otp-ring-track { fill: none; stroke: rgba(201,168,76,0.15); stroke-width: 4; }
  .otp-ring-progress {
    fill: none; stroke: var(--gold); stroke-width: 4;
    stroke-linecap: round;
    transition: stroke-dasharray 1s linear;
  }

  /* Change email */
  .otp-change-email { text-align: center; }
  .otp-change-btn {
    background: none; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; color: var(--muted);
    cursor: pointer; padding: 0;
    transition: color 0.2s;
  }
  .otp-change-btn:hover { color: var(--ink); }

  /* ─── ANIMATIONS ─── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.12); opacity: 0.2; }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }
  @keyframes successPop {
    from { transform: scale(0); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
`;