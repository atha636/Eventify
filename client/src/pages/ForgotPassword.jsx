import { useState, useRef, useEffect } from "react";
import API from "../services/api";

export default function ForgotPassword() {
  const [step, setStep] = useState("email"); // "email" | "otp" | "password" | "done"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Focus first OTP box when step changes
  useEffect(() => {
    if (step === "otp") setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, [step]);

  // ── Step 1: Send OTP ──────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setError(""); setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setStep("otp");
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err?.response?.data?.msg || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResend = async () => {
    setError(""); setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err?.response?.data?.msg || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Input Handling ────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); otpRefs.current[5]?.focus(); }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) { setError("Please enter the complete 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      const res = await API.post("/auth/verify-reset-otp", { email, otp: otpString });
      setResetToken(res.data.resetToken);
      setStep("password");
    } catch (err) {
      setError(err?.response?.data?.msg || "Invalid or expired OTP.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters."); return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match."); return;
    }
    setError(""); setLoading(true);
    try {
      await API.post("/auth/reset-password", { resetToken, newPassword });
      setStep("done");
    } catch (err) {
      setError(err?.response?.data?.msg || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const filledCount = otp.filter(Boolean).length;

  return (
    <>
      <style>{styles}</style>
      <div className="fp-root">

        {/* LEFT PANEL */}
        <div className="fp-left">
          <div className="fp-left-inner">
            <div className="fp-logo">✦ Eventify</div>
            <div className="fp-quote-block">
              <span className="fp-quote-mark">"</span>
              <p className="fp-quote">
                Every new beginning<br />comes from some other<br />beginning's end.
              </p>
              <span className="fp-quote-author">— Seneca</span>
            </div>
            <div className="fp-steps-preview">
              {[
                { n: "01", label: "Enter your email" },
                { n: "02", label: "Verify the OTP" },
                { n: "03", label: "Set new password" },
              ].map((s, i) => {
                const stepMap = { email: 0, otp: 1, password: 2, done: 3 };
                const current = stepMap[step];
                return (
                  <div key={i} className={`fp-step-item ${i < current ? "done" : i === current ? "active" : ""}`}>
                    <span className="fp-step-n">{i < current ? "✓" : s.n}</span>
                    <span className="fp-step-label">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="fp-orb fp-orb1" />
          <div className="fp-orb fp-orb2" />
        </div>

        {/* RIGHT PANEL */}
        <div className="fp-right">
          <div className="fp-card">

            {/* ── STEP: EMAIL ── */}
            {step === "email" && (
              <div className="fp-section">
                <a href="/login" className="fp-back">← Back to login</a>
                <div className="fp-header">
                  <p className="fp-eyebrow">✦ Account recovery</p>
                  <h1>Forgot your<br />password?</h1>
                  <p className="fp-sub">No worries. Enter your email and we'll send you a 6-digit code to reset it.</p>
                </div>
                <div className="fp-field">
                  <label>Email Address</label>
                  <div className="fp-input-wrap">
                    <span className="fp-icon">✉</span>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                      autoFocus
                    />
                  </div>
                </div>
                {error && <div className="fp-error"><span>⚠</span> {error}</div>}
                <button className={`fp-btn ${loading ? "loading" : ""}`} onClick={handleSendOTP} disabled={loading}>
                  {loading ? <span className="fp-spinner" /> : "Send OTP →"}
                </button>
              </div>
            )}

            {/* ── STEP: OTP ── */}
            {step === "otp" && (
              <div className="fp-section">
                <button className="fp-back" onClick={() => { setStep("email"); setError(""); }}>← Change email</button>
                <div className="fp-header">
                  <p className="fp-eyebrow">✦ Verify identity</p>
                  <h1>Check your<br />inbox</h1>
                  <p className="fp-sub">
                    We sent a 6-digit code to<br />
                    <strong style={{ color: "var(--ink)" }}>{email}</strong>
                  </p>
                </div>

                {/* OTP Boxes */}
                <div className="fp-otp-boxes" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      className={`fp-otp-box ${digit ? "filled" : ""} ${error ? "shake" : ""}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>

                {/* Progress bar */}
                <div className="fp-otp-progress">
                  <div className="fp-otp-fill" style={{ width: `${(filledCount / 6) * 100}%` }} />
                </div>

                {error && <div className="fp-error"><span>⚠</span> {error}</div>}

                <button
                  className={`fp-btn ${loading ? "loading" : ""} ${filledCount === 6 ? "ready" : ""}`}
                  onClick={handleVerifyOTP}
                  disabled={loading || filledCount < 6}
                >
                  {loading ? <span className="fp-spinner" /> : "Verify Code →"}
                </button>

                <div className="fp-resend-row">
                  <span>Didn't receive it?</span>
                  {canResend ? (
                    <button className="fp-resend-btn" onClick={handleResend} disabled={loading}>
                      Resend code
                    </button>
                  ) : (
                    <span className="fp-timer">Resend in {timer}s</span>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP: NEW PASSWORD ── */}
            {step === "password" && (
              <div className="fp-section">
                <div className="fp-header">
                  <p className="fp-eyebrow">✦ Almost there</p>
                  <h1>Set a new<br />password</h1>
                  <p className="fp-sub">Choose something strong and memorable. At least 8 characters.</p>
                </div>

                <div className="fp-fields">
                  <div className="fp-field">
                    <label>New Password</label>
                    <div className="fp-input-wrap">
                      <span className="fp-icon">◆</span>
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button className="fp-eye" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>

                  <div className="fp-field">
                    <label>Confirm Password</label>
                    <div className="fp-input-wrap">
                      <span className="fp-icon">◆</span>
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                      />
                      <button className="fp-eye" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                        {showConfirm ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="fp-strength">
                    {["weak", "fair", "good", "strong"].map((level, i) => {
                      const score = Math.min(Math.floor(newPassword.length / 3), 3);
                      return (
                        <div
                          key={i}
                          className={`fp-strength-bar ${i <= score ? `bar-${level}` : ""}`}
                        />
                      );
                    })}
                    <span className="fp-strength-label">
                      {["weak", "fair", "good", "strong"][Math.min(Math.floor(newPassword.length / 3), 3)]}
                    </span>
                  </div>
                )}

                {error && <div className="fp-error"><span>⚠</span> {error}</div>}

                <button className={`fp-btn ${loading ? "loading" : ""}`} onClick={handleResetPassword} disabled={loading}>
                  {loading ? <span className="fp-spinner" /> : "Reset Password →"}
                </button>
              </div>
            )}

            {/* ── STEP: DONE ── */}
            {step === "done" && (
              <div className="fp-done">
                <div className="fp-done-ring">
                  <span>✓</span>
                </div>
                <p className="fp-eyebrow" style={{ textAlign: "center" }}>✦ Success</p>
                <h2>Password reset!</h2>
                <p>Your password has been updated successfully. You can now sign in with your new password.</p>
                <a href="/login" className="fp-btn" style={{ textDecoration: "none", textAlign: "center" }}>
                  Go to Login →
                </a>
              </div>
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

  .fp-root {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
  }
  @media (max-width: 780px) {
    .fp-root { grid-template-columns: 1fr; }
    .fp-left { display: none; }
  }

  /* ── LEFT ── */
  .fp-left {
    background: var(--ink);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 60px 56px;
  }
  .fp-left-inner { position: relative; z-index: 2; width: 100%; }

  .fp-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem; font-weight: 600;
    color: var(--gold); letter-spacing: 0.18em;
    text-transform: uppercase; margin-bottom: 80px;
  }

  .fp-quote-block { margin-bottom: 64px; }
  .fp-quote-mark {
    font-family: 'Cormorant Garamond', serif;
    font-size: 5rem; color: var(--gold); opacity: 0.4;
    line-height: 0.6; display: block; margin-bottom: 16px;
  }
  .fp-quote {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.5rem, 2.6vw, 2rem);
    font-weight: 300; font-style: italic;
    color: var(--cream); line-height: 1.4; margin-bottom: 14px;
  }
  .fp-quote-author {
    font-size: 11px; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--muted);
  }

  /* Step progress on left */
  .fp-steps-preview { display: flex; flex-direction: column; gap: 18px; }
  .fp-step-item {
    display: flex; align-items: center; gap: 14px;
    opacity: 0.35; transition: opacity 0.3s;
  }
  .fp-step-item.active { opacity: 1; }
  .fp-step-item.done { opacity: 0.65; }
  .fp-step-n {
    width: 32px; height: 32px;
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--gold); flex-shrink: 0;
    font-family: 'Cormorant Garamond', serif;
  }
  .fp-step-item.active .fp-step-n {
    background: rgba(201,168,76,0.15);
    border-color: var(--gold);
  }
  .fp-step-item.done .fp-step-n {
    background: rgba(201,168,76,0.1);
    color: var(--gold);
  }
  .fp-step-label { font-size: 13px; color: var(--cream); }

  .fp-orb {
    position: absolute; border-radius: 50%;
    filter: blur(90px); opacity: 0.14; pointer-events: none;
  }
  .fp-orb1 { width: 380px; height: 380px; background: var(--gold); top: -80px; right: -100px; }
  .fp-orb2 { width: 280px; height: 280px; background: #7b5ea7; bottom: -60px; left: -40px; }

  /* ── RIGHT ── */
  .fp-right {
    background: var(--cream);
    display: flex; align-items: center; justify-content: center;
    padding: 48px 32px;
  }

  .fp-card {
    width: 100%; max-width: 400px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 44px 40px;
    box-shadow: 0 12px 48px rgba(14,12,10,0.07);
    animation: fadeUp 0.5s ease both;
  }

  .fp-section { animation: fadeUp 0.4s ease both; }

  .fp-back {
    display: inline-block;
    font-size: 12px; color: var(--muted);
    text-decoration: none; margin-bottom: 28px;
    transition: color 0.2s;
    background: none; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    padding: 0;
  }
  .fp-back:hover { color: var(--ink); }

  .fp-header { margin-bottom: 28px; }
  .fp-eyebrow {
    font-size: 11px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 10px;
    display: block;
  }
  .fp-header h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 600;
    color: var(--ink); line-height: 1.15; margin-bottom: 10px;
  }
  .fp-sub { font-size: 13px; color: var(--muted); line-height: 1.65; }

  /* Fields */
  .fp-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 20px; }
  .fp-field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 20px; }
  .fp-field label {
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted);
  }
  .fp-input-wrap {
    display: flex; align-items: center; gap: 10px;
    border: 1px solid var(--border); border-radius: 7px;
    padding: 13px 14px; background: var(--surface);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .fp-input-wrap:focus-within {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
    background: var(--white);
  }
  .fp-icon { font-size: 13px; color: var(--gold); opacity: 0.8; flex-shrink: 0; }
  .fp-input-wrap input {
    border: none; background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--ink); outline: none; width: 100%;
  }
  .fp-input-wrap input::placeholder { color: #bbb4a8; }
  .fp-eye {
    background: none; border: none; cursor: pointer;
    font-size: 14px; padding: 0; opacity: 0.7; flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .fp-eye:hover { opacity: 1; }

  /* Password strength */
  .fp-strength {
    display: flex; align-items: center; gap: 6px; margin-bottom: 20px;
  }
  .fp-strength-bar {
    flex: 1; height: 3px; border-radius: 2px;
    background: rgba(201,168,76,0.12);
    transition: background 0.3s;
  }
  .fp-strength-bar.bar-weak   { background: #b85c5c; }
  .fp-strength-bar.bar-fair   { background: #c9933a; }
  .fp-strength-bar.bar-good   { background: #9aad55; }
  .fp-strength-bar.bar-strong { background: #2d6a4f; }
  .fp-strength-label { font-size: 11px; color: var(--muted); text-transform: capitalize; white-space: nowrap; }

  /* Error */
  .fp-error {
    font-size: 12.5px; color: var(--error);
    background: rgba(184,92,92,0.07);
    border: 1px solid rgba(184,92,92,0.2);
    border-radius: 6px; padding: 10px 14px;
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }

  /* Button */
  .fp-btn {
    width: 100%; padding: 15px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all 0.25s ease;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px; min-height: 50px;
    opacity: 0.55;
  }
  .fp-btn.ready, .fp-btn:not([disabled]) { opacity: 1; }
  .fp-btn:hover:not(:disabled) {
    background: var(--gold); color: var(--ink);
    box-shadow: 0 6px 24px rgba(201,168,76,0.3);
    transform: translateY(-1px);
  }
  .fp-btn.loading { opacity: 0.65; pointer-events: none; }
  .fp-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* OTP Boxes */
  .fp-otp-boxes {
    display: flex; justify-content: center; gap: 9px; margin-bottom: 12px;
  }
  .fp-otp-box {
    width: 50px; height: 58px; text-align: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 600; color: var(--ink);
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 10px; outline: none;
    transition: all 0.2s ease; caret-color: var(--gold);
  }
  .fp-otp-box:focus {
    border-color: var(--gold); background: #fff;
    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
    transform: translateY(-2px);
  }
  .fp-otp-box.filled {
    border-color: rgba(201,168,76,0.5);
    background: linear-gradient(135deg,#fff 60%,rgba(201,168,76,0.05));
  }
  .fp-otp-box.shake { animation: shake 0.4s ease; }

  .fp-otp-progress {
    height: 2px; background: rgba(201,168,76,0.12);
    border-radius: 999px; margin-bottom: 18px; overflow: hidden;
  }
  .fp-otp-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold-light), var(--gold));
    border-radius: 999px; transition: width 0.3s ease;
  }

  /* Resend row */
  .fp-resend-row {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; font-size: 12.5px; color: var(--muted); margin-top: -8px;
  }
  .fp-resend-btn {
    background: none; border: none; color: var(--gold);
    font-family: 'DM Sans', sans-serif; font-size: 12.5px;
    font-weight: 500; cursor: pointer; text-decoration: underline;
    padding: 0; transition: opacity 0.2s;
  }
  .fp-resend-btn:hover { opacity: 0.75; }
  .fp-timer { font-size: 12px; color: var(--muted); }

  /* Done state */
  .fp-done {
    text-align: center; padding: 16px 0;
    display: flex; flex-direction: column; gap: 12px;
    animation: fadeUp 0.4s ease both;
  }
  .fp-done-ring {
    width: 64px; height: 64px;
    border: 2px solid rgba(45,106,79,0.4);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; color: var(--success);
    margin: 0 auto;
    background: rgba(45,106,79,0.07);
    animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
  }
  .fp-done h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 600; color: var(--ink);
  }
  .fp-done p { font-size: 13.5px; color: var(--muted); line-height: 1.65; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes shake {
    0%,100% { transform:translateX(0); }
    20% { transform:translateX(-5px); }
    40% { transform:translateX(5px); }
    60% { transform:translateX(-3px); }
    80% { transform:translateX(3px); }
  }
  @keyframes popIn { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }
`;