import { useEffect, useState } from "react";
import { downloadInvoice } from "../services/invoiceService";

// "Download invoice" button, shared by the customer's and the vendor's booking screens.
// `label` lets each screen word it its own way; `className` can add layout classes.
export default function InvoiceButton({ bookingId, label = "Invoice (PDF)", className = "" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // the error shows as a small toast so it never changes the height of the button row it sits in
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(t);
  }, [error]);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await downloadInvoice(bookingId);
    } catch (msg) {
      setError(typeof msg === "string" ? msg : "Couldn't download the invoice.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={`inv-wrap ${className}`}>
        <button type="button" className="inv-btn" onClick={handleClick} disabled={busy} aria-busy={busy}>
          {busy ? (
            <span className="inv-spinner" aria-hidden="true" />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="m7 11 5 5 5-5" />
              <path d="M5 20h14" />
            </svg>
          )}
          <span>{busy ? "Preparing PDF…" : label}</span>
        </button>
      </div>
      {error && <div className="inv-toast" role="alert">{error}</div>}
      <style>{styles}</style>
    </>
  );
}

const styles = `
  .inv-wrap { flex: 1; min-width: 150px; display: flex; }
  .inv-btn {
    width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 12px; border-radius: 8px; cursor: pointer; white-space: nowrap;
    background: transparent; color: var(--ink); border: 1px solid var(--border);
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    transition: background 0.2s, border-color 0.2s, transform 0.18s;
  }
  .inv-btn:hover:not(:disabled) { background: var(--surface); border-color: var(--gold); transform: translateY(-1px); }
  .inv-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
  .inv-btn:disabled { opacity: 0.7; cursor: progress; }
  .inv-btn svg { color: var(--c-goldtext); flex-shrink: 0; }
  .inv-toast {
    position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 10000;
    max-width: min(92vw, 420px); padding: 11px 18px; border-radius: 10px;
    background: var(--ink-surface); color: var(--on-dark);
    border: 1px solid rgba(184,92,92,0.55); box-shadow: 0 12px 32px rgba(0,0,0,0.35);
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; line-height: 1.45; text-align: center;
    animation: invToastIn 0.25s ease both;
  }
  @keyframes invToastIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
  .inv-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid var(--border); border-top-color: var(--gold);
    animation: invSpin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes invSpin { to { transform: rotate(360deg); } }
`;