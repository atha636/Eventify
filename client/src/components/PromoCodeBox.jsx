import { useState } from "react";
import { validateCode } from "../services/promoService";

const inr = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

// "Have a vendor code?" on the booking panel. `applied` = { code, percent } or null.
export default function PromoCodeBox({ serviceId, packageName, price, applied, onApply, onNeedLogin, loggedIn }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const code = value.trim();
    if (!code || busy) return;
    if (!loggedIn) { onNeedLogin?.(); return; }
    setBusy(true); setError("");
    try {
      const r = await validateCode(serviceId, code, packageName);
      if (r.valid) { onApply({ code: r.code, percent: r.percent, vendorName: r.vendorName }); setValue(""); setOpen(false); }
      else setError(r.error || "That code isn't valid.");
    } catch (er) { setError(String(er)); } finally { setBusy(false); }
  };

  if (applied) {
    return (
      <div className="pcb-applied" role="status">
        <span className="pcb-tick" aria-hidden="true">✓</span>
        <div className="pcb-applied-txt">
          <strong>Code {applied.code} applied</strong>
          <span>Extra {applied.percent}% off{price ? ` — you save ${inr(price * applied.percent / 100)}` : ""}</span>
        </div>
        <button type="button" className="pcb-link" onClick={() => onApply(null)}>Remove</button>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="pcb-root">
      {!open ? (
        <button type="button" className="pcb-toggle" onClick={() => setOpen(true)}>
          <span aria-hidden="true">🎟</span> Have a vendor code? Get an extra 5% off
        </button>
      ) : (
        <form onSubmit={submit} className="pcb-form">
          <label htmlFor="pcb-input" className="pcb-label">Vendor code</label>
          <div className="pcb-row">
            <input id="pcb-input" autoFocus value={value} onChange={(e) => { setValue(e.target.value.toUpperCase()); setError(""); }}
              maxLength={12} placeholder="e.g. AT8273" autoComplete="off" spellCheck={false}
              aria-invalid={!!error} aria-describedby={error ? "pcb-err" : undefined} />
            <button type="submit" disabled={!value.trim() || busy}>{busy ? "Checking…" : "Apply"}</button>
          </div>
          {error && <p id="pcb-err" className="pcb-error" role="alert">{error}</p>}
          <button type="button" className="pcb-link" onClick={() => { setOpen(false); setError(""); setValue(""); }}>Cancel</button>
        </form>
      )}
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .pcb-root { margin-top: 14px; }
  .pcb-toggle { width: 100%; text-align: left; background: transparent; border: 1px dashed rgba(201,168,76,.55); color: var(--c-goldtext); border-radius: 12px; padding: 11px 14px; font: 500 13px 'DM Sans', sans-serif; cursor: pointer; transition: background .15s, border-color .15s; }
  .pcb-toggle:hover { background: var(--gold-tint); border-color: #c9a84c; }
  .pcb-form { border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; background: var(--surface, var(--cream)); }
  .pcb-label { display: block; font: 600 11px 'DM Sans', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
  .pcb-row { display: flex; gap: 8px; }
  .pcb-row input { flex: 1; min-width: 0; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--white); color: var(--ink); font: 600 14px 'DM Sans', sans-serif; letter-spacing: .12em; text-transform: uppercase; }
  .pcb-row input[aria-invalid="true"] { border-color: #d97b7b; }
  .pcb-row input:focus-visible { outline: 2px solid #c9a84c; outline-offset: 1px; }
  .pcb-row button { padding: 10px 18px; border-radius: 10px; border: 1px solid var(--btn-bg); background: var(--btn-bg); color: var(--btn-fg); font: 500 13px 'DM Sans', sans-serif; cursor: pointer; white-space: nowrap; }
  .pcb-row button:disabled { opacity: .5; cursor: default; }
  .pcb-error { margin: 8px 0 0; color: #d97b7b; font-size: 12.5px; line-height: 1.45; }
  .pcb-link { background: none; border: none; padding: 0; margin-top: 8px; color: var(--c-goldtext); font: 500 12.5px 'DM Sans', sans-serif; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
  .pcb-applied { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(76,175,130,.55); background: rgba(76,175,130,.1); }
  .pcb-applied .pcb-link { margin-top: 0; }
  .pcb-tick { width: 26px; height: 26px; border-radius: 50%; background: #4caf82; color: #06371b; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; flex: none; }
  .pcb-applied-txt { flex: 1; display: flex; flex-direction: column; font-size: 13px; color: var(--ink); line-height: 1.35; min-width: 0; }
  .pcb-applied-txt span { color: var(--text2); font-size: 12.5px; }
  .pcb-toggle:focus-visible, .pcb-link:focus-visible, .pcb-row button:focus-visible { outline: 2px solid #c9a84c; outline-offset: 2px; }
`;