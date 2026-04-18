
import { useState, useEffect, useRef, useCallback } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../firebase";
import Logo from "../components/Logo";

// ─── Human-readable Firebase error messages ───────────────────────────────────
const FIREBASE_ERRORS = {
  "auth/invalid-phone-number":       "Invalid phone number. Check and try again.",
  "auth/too-many-requests":          "Too many attempts. Please wait a few minutes.",
  "auth/quota-exceeded":             "SMS quota exceeded. Please try later.",
  "auth/captcha-check-failed":       "reCAPTCHA check failed. Refresh and retry.",
  "auth/invalid-verification-code":  "Wrong OTP. Please try again.",
  "auth/code-expired":               "OTP expired. Request a new one.",
  "auth/session-expired":            "Session expired. Request a new OTP.",
  "auth/provider-already-linked":    "This number is already linked to another account.",
};

const getFirebaseError = (err) =>
  FIREBASE_ERRORS[err?.code] ?? err?.message ?? "Something went wrong. Please try again.";

// ─── Component ────────────────────────────────────────────────────────────────
export default function BookingDetailsModal({
  pkg,
  vendor,
  date,
  onConfirm,
  onClose,
  loading,
}) {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:    user?.name ?? "",
    phone:   "",
    address: "",
  });
  const [errors, setErrors] = useState({});

  // ── OTP state ───────────────────────────────────────────────────────────────
  const [otpSent,              setOtpSent]              = useState(false);
  const [otpValue,             setOtpValue]             = useState("");
  const [otpVerified,          setOtpVerified]          = useState(false);
  const [otpLoading,           setOtpLoading]           = useState(false);
  const [sendingOtp,           setSendingOtp]           = useState(false);
  const [otpError,             setOtpError]             = useState("");
  const [otpSuccess,           setOtpSuccess]           = useState("");
  const [resendTimer,          setResendTimer]          = useState(0);
  const [confirmationResult,   setConfirmationResult]   = useState(null);

  // ── Stable refs (won't trigger re-renders, safe for cleanup) ────────────────
  const recaptchaVerifierRef = useRef(null);
  const resendIntervalRef    = useRef(null);
  const submittingRef        = useRef(false);   // guard against double-submit

  // ── Scroll lock + Escape key ─────────────────────────────────────────────────
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // ── Global cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(resendIntervalRef.current);
      clearRecaptcha();
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const clearRecaptcha = () => {
    try {
      recaptchaVerifierRef.current?.clear();
    } catch (_) {
      // already cleared — safe to ignore
    }
    recaptchaVerifierRef.current = null;
  };

  const startResendTimer = useCallback(() => {
    setResendTimer(30);
    clearInterval(resendIntervalRef.current);
    resendIntervalRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(resendIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const phone = form.phone.trim().replace(/\D/g, "");

    if (!/^\d{10}$/.test(phone)) {
      setErrors((e) => ({ ...e, phone: "Enter a valid 10-digit number" }));
      return;
    }

    setSendingOtp(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      // Always tear down previous verifier before creating a new one
      clearRecaptcha();

      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );

      const fullPhone = `+91${phone}`;
      let result;

      
      const currentUser = auth.currentUser;
     if (currentUser) {
  try {
    result = await linkWithPhoneNumber(
      currentUser,
      fullPhone,
      recaptchaVerifierRef.current
    );
  } catch (err) {
    // 🔥 FIX: fallback if already linked
    if (err.code === "auth/provider-already-linked") {
      result = await signInWithPhoneNumber(
        auth,
        fullPhone,
        recaptchaVerifierRef.current
      );
    } else {
      throw err;
    }
  }
} else {
  result = await signInWithPhoneNumber(
    auth,
    fullPhone,
    recaptchaVerifierRef.current
  );
}
      setConfirmationResult(result);
      setOtpSent(true);
      setOtpValue("");
      setOtpSuccess("OTP sent to your mobile!");
      startResendTimer();
    } catch (err) {
      console.error("[OTP send error]", err);
      setOtpError(getFirebaseError(err));
      clearRecaptcha(); // must clear on error so next attempt can render a fresh one
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerifyOTP = useCallback(async (codeOverride) => {
    const code = codeOverride ?? otpValue;
    if (!code || code.length !== 6) {
      setOtpError("Enter the 6-digit OTP");
      return;
    }
    if (!confirmationResult) {
      setOtpError("Session lost. Please request a new OTP.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      await confirmationResult.confirm(code);
      setOtpVerified(true);
      setOtpSuccess("Mobile number verified!");
      setErrors((e) => ({ ...e, phone: "" }));
      clearInterval(resendIntervalRef.current);
    } catch (err) {
      console.error("[OTP verify error]", err);
      setOtpError(getFirebaseError(err));
    } finally {
      setOtpLoading(false);
    }
  }, [otpValue, confirmationResult]);

  // ── Auto-verify when all 6 digits are entered ────────────────────────────────
  const handleOtpChange = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setOtpValue(digits);
    setOtpError("");
    if (digits.length === 6) {
      // Slight delay so the last digit visually renders first
      setTimeout(() => handleVerifyOTP(digits), 120);
    }
  };

  // ── Field setter ─────────────────────────────────────────────────────────────
  const setField = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));

    if (key === "phone") {
      // Reset entire OTP flow when phone number is edited
      setOtpSent(false);
      setOtpVerified(false);
      setOtpValue("");
      setOtpError("");
      setOtpSuccess("");
      setConfirmationResult(null);
      clearInterval(resendIntervalRef.current);
      setResendTimer(0);
      clearRecaptcha();
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Full name is required";
    if (!form.phone.trim())   e.phone   = "Phone number is required";
    else if (!otpVerified)    e.phone   = "Please verify your mobile number first";
    if (!form.address.trim()) e.address = "Event address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (submittingRef.current) return; // guard double-click
    if (!validate()) return;
    submittingRef.current = true;
    onConfirm(form);
    // reset guard after a tick (parent controls the loading state from here)
    setTimeout(() => { submittingRef.current = false; }, 500);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isSendDisabled = sendingOtp || resendTimer > 0;
  const sendLabel = sendingOtp
    ? null
    : resendTimer > 0
    ? `Resend (${resendTimer}s)`
    : otpSent
    ? "Resend OTP"
    : "Send OTP";

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "—";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="bdm-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Complete your booking details"
    >
      <div
        className="bdm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="bdm-close"
          onClick={onClose}
          aria-label="Close modal"
          type="button"
        >
          ✕
        </button>

        {/* Header */}
        <div className="bdm-header">
          <div className="bdm-icon-ring" aria-hidden="true"><Logo /></div>
          <h2 className="bdm-title">Complete Your Details</h2>
          <p className="bdm-subtitle">
            We share these with the vendor to confirm your booking
          </p>
        </div>

        {/* Booking summary strip */}
        <div className="bdm-summary" role="region" aria-label="Booking summary">
          <div className="bdm-sum-item">
            <span className="bdm-sum-label">Package</span>
            <span className="bdm-sum-val">{pkg?.name ?? "—"}</span>
          </div>
          <div className="bdm-sum-sep" aria-hidden="true" />
          <div className="bdm-sum-item">
            <span className="bdm-sum-label">Date</span>
            <span className="bdm-sum-val">{formattedDate}</span>
          </div>
          <div className="bdm-sum-sep" aria-hidden="true" />
          <div className="bdm-sum-item">
            <span className="bdm-sum-label">Amount</span>
            <span className="bdm-sum-val bdm-sum-gold">
              ₹{pkg?.price?.toLocaleString("en-IN") ?? "—"}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="bdm-form">

          {/* Full Name */}
          <div className="bdm-field">
            <label className="bdm-label" htmlFor="bdm-name">
              Full Name <span className="bdm-req" aria-hidden="true">*</span>
            </label>
            <input
              id="bdm-name"
              className={`bdm-input${errors.name ? " bdm-input-err" : ""}`}
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "bdm-name-err" : undefined}
            />
            {errors.name && (
              <p className="bdm-err-msg" id="bdm-name-err" role="alert">
                ⚠ {errors.name}
              </p>
            )}
          </div>

          {/* Mobile Number + OTP */}
          <div className="bdm-field">
            <label className="bdm-label" htmlFor="bdm-phone">
              Mobile Number <span className="bdm-req" aria-hidden="true">*</span>
              {otpVerified && (
                <span className="bdm-verified-badge" aria-label="Verified">
                  ✓ Verified
                </span>
              )}
            </label>

            {/* Phone row */}
            <div className="bdm-phone-row">
              <div className="bdm-phone-prefix" aria-hidden="true">+91</div>
              <input
                id="bdm-phone"
                className={`bdm-input bdm-phone-input${errors.phone ? " bdm-input-err" : ""}${otpVerified ? " bdm-input-verified" : ""}`}
                placeholder="98765 43210"
                value={form.phone}
                onChange={(e) =>
                  setField("phone", e.target.value.replace(/[^\d\s]/g, ""))
                }
                type="tel"
                maxLength={10}
                disabled={otpVerified}
                autoComplete="tel"
                inputMode="numeric"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "bdm-phone-err" : undefined}
              />
              {!otpVerified && (
                <button
                  className={`bdm-otp-send-btn${isSendDisabled ? " disabled" : ""}${sendingOtp ? " loading" : ""}`}
                  onClick={handleSendOTP}
                  disabled={isSendDisabled}
                  type="button"
                  aria-label={sendLabel ?? "Sending OTP"}
                >
                  {sendingOtp ? <span className="bdm-spinner" aria-hidden="true" /> : sendLabel}
                </button>
              )}
            </div>
            {errors.phone && (
              <p className="bdm-err-msg" id="bdm-phone-err" role="alert">
                ⚠ {errors.phone}
              </p>
            )}

            {/* OTP input — only when sent & not yet verified */}
            {otpSent && !otpVerified && (
              <div className="bdm-otp-section" aria-live="polite">
                <p className="bdm-otp-hint">
                  Enter the 6-digit OTP sent to your mobile
                </p>
                <div className="bdm-otp-row">
                  <input
                    className={`bdm-otp-input${otpError ? " bdm-input-err" : ""}`}
                    placeholder="——————"
                    value={otpValue}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    aria-label="One-time password"
                    aria-invalid={!!otpError}
                  />
                  <button
                    className={`bdm-otp-verify-btn${otpLoading ? " loading" : ""}`}
                    onClick={() => handleVerifyOTP()}
                    disabled={otpLoading || otpValue.length !== 6}
                    type="button"
                  >
                    {otpLoading
                      ? <span className="bdm-spinner" aria-hidden="true" />
                      : "Verify →"}
                  </button>
                </div>
                {otpError && (
                  <p className="bdm-err-msg" role="alert">⚠ {otpError}</p>
                )}
                {otpSuccess && !otpError && (
                  <p className="bdm-success-msg" role="status">✓ {otpSuccess}</p>
                )}
              </div>
            )}

            {otpVerified && (
              <p className="bdm-success-msg" role="status">
                ✓ Mobile number verified successfully
              </p>
            )}
          </div>

          {/* Event Address */}
          <div className="bdm-field">
            <label className="bdm-label" htmlFor="bdm-address">
              Event Address <span className="bdm-req" aria-hidden="true">*</span>
            </label>
            <textarea
              id="bdm-address"
              className={`bdm-textarea${errors.address ? " bdm-input-err" : ""}`}
              placeholder="Full address where the event will be held…"
              rows={3}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? "bdm-address-err" : undefined}
            />
            {errors.address && (
              <p className="bdm-err-msg" id="bdm-address-err" role="alert">
                ⚠ {errors.address}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bdm-actions">
          <button
            className="bdm-btn-cancel"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`bdm-btn-confirm${loading ? " bdm-loading" : ""}${!otpVerified ? " bdm-btn-disabled-hint" : ""}`}
            onClick={handleSubmit}
            disabled={loading}
            type="button"
            aria-busy={loading}
          >
            {loading ? (
              <><span className="bdm-spinner" aria-hidden="true" /> Sending Request…</>
            ) : (
              <>Send Booking Request →</>
            )}
          </button>
        </div>

        {!otpVerified && (
          <p className="bdm-otp-required-note" role="note">
            ⚠ Mobile verification required before submitting
          </p>
        )}

        <p className="bdm-note"><Logo /> No payment now · Vendor confirms first</p>

        {/* Invisible reCAPTCHA anchor — always rendered, cleared via ref */}
        <div id="recaptcha-container" />
      </div>

      <style>{styles}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink:            #0e0c0a;
    --cream:          #f5f0e8;
    --gold:           #c9a84c;
    --gold-light:     #e8d5a3;
    --muted:          #7a7265;
    --border:         rgba(201,168,76,0.22);
    --surface:        #faf7f2;
    --white:          #ffffff;
    --danger:         #a93226;
    --danger-bg:      rgba(169,50,38,0.06);
    --danger-border:  rgba(169,50,38,0.25);
    --success:        #2d6a4f;
    --success-bg:     rgba(45,106,79,0.07);
    --success-border: rgba(45,106,79,0.25);
  }

  /* ── Overlay ── */
  .bdm-overlay {
    position: fixed; inset: 0;
    background: rgba(10,8,6,0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1500; padding: 20px;
    animation: bdmFade 0.2s ease both;
  }

  /* ── Modal ── */
  .bdm-modal {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px 36px 32px;
    width: 100%; max-width: 480px;
    position: relative;
    box-shadow:
      0 40px 100px rgba(10,8,6,0.22),
      0 0 0 1px rgba(255,255,255,0.35) inset;
    animation: bdmUp 0.32s cubic-bezier(0.34,1.2,0.64,1) both;
    max-height: 90vh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .bdm-modal::-webkit-scrollbar { width: 4px; }
  .bdm-modal::-webkit-scrollbar-track { background: transparent; }
  .bdm-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* ── Close button ── */
  .bdm-close {
    position: sticky; top: 0; float: right;
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--white); border: 1px solid var(--border);
    color: var(--muted); font-size: 14px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: border-color 0.2s, color 0.2s; z-index: 10;
    margin-bottom: -30px;
  }
  .bdm-close:hover { border-color: var(--muted); color: var(--ink); }
  .bdm-close:focus-visible {
    outline: 2px solid var(--gold); outline-offset: 2px;
  }

  /* ── Header ── */
  .bdm-header { text-align: center; margin-bottom: 24px; padding-top: 8px; }
  .bdm-icon-ring {
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05));
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
  .bdm-subtitle {
    font-size: 12.5px; color: var(--muted); margin: 0; line-height: 1.5;
  }

  /* ── Summary strip ── */
  .bdm-summary {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 14px 18px;
    margin-bottom: 24px; gap: 8px;
  }
  .bdm-sum-item { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
  .bdm-sum-label {
    font-size: 10px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted);
  }
  .bdm-sum-val { font-size: 13.5px; font-weight: 500; color: var(--ink); text-align: center; }
  .bdm-sum-gold {
    color: var(--gold);
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 600;
  }
  .bdm-sum-sep { width: 1px; height: 32px; background: var(--border); flex-shrink: 0; }

  /* ── Form ── */
  .bdm-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
  .bdm-field { display: flex; flex-direction: column; gap: 6px; }
  .bdm-label {
    font-size: 11px; letter-spacing: 0.13em; text-transform: uppercase;
    color: var(--muted); font-weight: 500;
    display: flex; align-items: center; gap: 8px;
  }
  .bdm-req { color: var(--danger); }
  .bdm-verified-badge {
    font-size: 10px; font-weight: 500; letter-spacing: 0.05em;
    padding: 2px 8px; border-radius: 20px;
    background: var(--success-bg); color: var(--success);
    border: 1px solid var(--success-border);
    text-transform: none;
  }

  /* ── Inputs ── */
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
  .bdm-input:focus-visible, .bdm-textarea:focus-visible {
    outline: none;
  }
  .bdm-input-err  {
    border-color: var(--danger-border) !important;
    background: var(--danger-bg) !important;
  }
  .bdm-input-verified {
    border-color: var(--success-border) !important;
    background: var(--success-bg) !important;
    color: var(--success) !important;
  }
  .bdm-textarea { resize: vertical; min-height: 80px; }

  /* ── Phone row ── */
  .bdm-phone-row { display: flex; gap: 8px; align-items: stretch; }
  .bdm-phone-prefix {
    display: flex; align-items: center; justify-content: center;
    padding: 0 12px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; font-size: 13.5px; color: var(--muted);
    font-weight: 500; white-space: nowrap; flex-shrink: 0;
  }
  .bdm-phone-input { flex: 1; }
  .bdm-otp-send-btn {
    padding: 0 16px;
    background: var(--ink); border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--white); cursor: pointer; white-space: nowrap; flex-shrink: 0;
    transition: background 0.22s, color 0.22s; min-width: 90px;
    display: flex; align-items: center; justify-content: center;
  }
  .bdm-otp-send-btn:hover:not(.disabled):not(.loading) {
    background: var(--gold); color: var(--ink);
  }
  .bdm-otp-send-btn.disabled { opacity: 0.55; cursor: not-allowed; }
  .bdm-otp-send-btn.loading  { pointer-events: none; }
  .bdm-otp-send-btn:focus-visible {
    outline: 2px solid var(--gold); outline-offset: 2px;
  }

  /* ── OTP section ── */
  .bdm-otp-section {
    margin-top: 10px; padding: 14px;
    background: rgba(201,168,76,0.04);
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 10px;
    animation: bdmFade 0.25s ease both;
  }
  .bdm-otp-hint {
    font-size: 11.5px; color: var(--muted); margin: 0 0 10px; line-height: 1.5;
  }
  .bdm-otp-row { display: flex; gap: 8px; align-items: stretch; }
  .bdm-otp-input {
    flex: 1; padding: 11px 14px;
    border: 1px solid var(--border); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 20px;
    font-weight: 500; letter-spacing: 0.35em;
    color: var(--ink); background: var(--white); outline: none;
    text-align: center;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .bdm-otp-input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }
  .bdm-otp-verify-btn {
    padding: 0 20px;
    background: var(--gold); border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: var(--ink); cursor: pointer; flex-shrink: 0;
    transition: background 0.22s, color 0.22s, transform 0.18s; min-width: 90px;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .bdm-otp-verify-btn:hover:not(:disabled) {
    background: var(--ink); color: var(--white); transform: translateY(-1px);
  }
  .bdm-otp-verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .bdm-otp-verify-btn.loading  { pointer-events: none; }
  .bdm-otp-verify-btn:focus-visible {
    outline: 2px solid var(--gold); outline-offset: 2px;
  }

  /* ── Messages ── */
  .bdm-err-msg {
    font-size: 11.5px; color: var(--danger);
    display: flex; align-items: center; gap: 5px; margin: 4px 0 0;
    font-family: 'DM Sans', sans-serif;
  }
  .bdm-success-msg {
    font-size: 11.5px; color: var(--success); font-weight: 500;
    display: flex; align-items: center; gap: 5px; margin: 4px 0 0;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Actions ── */
  .bdm-actions { display: flex; gap: 10px; margin-bottom: 8px; }
  .bdm-btn-cancel {
    flex: 1; padding: 13px 16px;
    background: transparent; border: 1px solid var(--border);
    border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; color: var(--muted);
    cursor: pointer; transition: border-color 0.2s, color 0.2s;
  }
  .bdm-btn-cancel:hover:not(:disabled) { border-color: var(--muted); color: var(--ink); }
  .bdm-btn-cancel:disabled { opacity: 0.55; cursor: not-allowed; }
  .bdm-btn-cancel:focus-visible {
    outline: 2px solid var(--gold); outline-offset: 2px;
  }

  .bdm-btn-confirm {
    flex: 2; padding: 13px 16px;
    background: var(--gold); border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: var(--ink); cursor: pointer;
    transition: background 0.25s, color 0.25s, transform 0.18s, box-shadow 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .bdm-btn-confirm:hover:not(:disabled) {
    background: var(--ink); color: var(--white);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(14,12,10,0.2);
  }
  .bdm-btn-confirm:disabled { opacity: 0.65; cursor: not-allowed; }
  .bdm-btn-disabled-hint { opacity: 0.75; }
  .bdm-loading { pointer-events: none; }
  .bdm-btn-confirm:focus-visible {
    outline: 2px solid var(--gold); outline-offset: 2px;
  }

  /* ── Spinner ── */
  .bdm-spinner {
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(14,12,10,0.2);
    border-top-color: currentColor;
    animation: bdmSpin 0.7s linear infinite;
    display: inline-block; flex-shrink: 0;
  }

  /* ── Footer notes ── */
  .bdm-otp-required-note {
    text-align: center; font-size: 11px; color: #c9793a;
    margin: 0 0 8px; letter-spacing: 0.03em;
    font-family: 'DM Sans', sans-serif;
  }
  .bdm-note {
    text-align: center; font-size: 11px; color: var(--muted);
    margin: 0; letter-spacing: 0.05em;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Animations ── */
  @keyframes bdmFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes bdmUp {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }
  @keyframes bdmSpin { to { transform: rotate(360deg); } }

  /* ── Mobile ── */
  @media (max-width: 520px) {
    .bdm-modal { padding: 28px 18px 24px; border-radius: 16px; }
    .bdm-summary { flex-direction: column; gap: 12px; }
    .bdm-sum-sep { width: 100%; height: 1px; }
    .bdm-actions { flex-direction: column; }
    .bdm-phone-row { flex-wrap: wrap; }
    .bdm-otp-send-btn { flex: 1; padding: 12px; }
  }
`;