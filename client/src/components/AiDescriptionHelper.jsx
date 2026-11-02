import { useState } from "react";
import { aiDescription } from "../services/vendorAiService";

// "Write with AI" strip that sits under the Description box on the Add / Edit service forms.
// onApply(text) puts the text into the form; the previous text can be restored with Undo.
export default function AiDescriptionHelper({ serviceType, title, locations, current, onApply }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [undo, setUndo] = useState(null);     // previous text, or null

  const generate = async (improve) => {
    setBusy(true); setError("");
    try {
      const r = await aiDescription({ serviceType, title, locations, hint, existing: improve ? current : "" });
      setUndo(current || "");
      onApply(r.description);
      setOpen(false);
    } catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="aid-wrap">
      {!open ? (
        <div className="aid-row">
          <button type="button" className="aid-btn" onClick={() => { setOpen(true); setError(""); }}>
            ✨ Write with AI
          </button>
          {current.trim().length > 20 && (
            <button type="button" className="aid-btn ghost" onClick={() => generate(true)} disabled={busy}>
              {busy ? "Improving…" : "Improve my text"}
            </button>
          )}
          {undo !== null && (
            <button type="button" className="aid-link" onClick={() => { onApply(undo); setUndo(null); }}>Undo</button>
          )}
        </div>
      ) : (
        <div className="aid-box">
          <label className="aid-label" htmlFor="aid-hint">Anything to highlight? <span>(optional)</span></label>
          <input id="aid-hint" value={hint} onChange={(e) => setHint(e.target.value)} maxLength={200} autoFocus
            placeholder="e.g. 8 years experience, candid shots, drone, destination weddings"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); generate(false); } }} />
          <div className="aid-row">
            <button type="button" className="aid-btn" onClick={() => generate(false)} disabled={busy}>
              {busy ? "Writing…" : "Generate"}
            </button>
            <button type="button" className="aid-link" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
          </div>
        </div>
      )}
      {error && <p className="aid-error" role="alert">{error}</p>}
      <style>{`
        .aid-wrap { margin-top: 8px; font-family: 'DM Sans', sans-serif; }
        .aid-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .aid-box { background: var(--gold-tint); border: 1px solid var(--border); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .aid-label { font-size: 12px; color: var(--text2); }
        .aid-label span { color: var(--muted); }
        .aid-box input { font: 13px 'DM Sans', sans-serif; color: var(--ink); background: var(--white); border: 1px solid var(--border); border-radius: 8px; padding: 9px 11px; width: 100%; box-sizing: border-box; }
        .aid-box input:focus { outline: none; border-color: #c9a84c; }
        .aid-btn { font: 500 12.5px 'DM Sans', sans-serif; padding: 8px 16px; border-radius: 20px; cursor: pointer; border: 1px solid transparent; background: var(--btn-bg); color: var(--btn-fg); transition: background .15s; }
        .aid-btn:hover:not(:disabled) { background: #c9a84c; color: var(--on-gold); }
        .aid-btn.ghost { background: transparent; color: var(--ink); border-color: var(--border); }
        .aid-btn.ghost:hover:not(:disabled) { border-color: #c9a84c; background: transparent; color: var(--ink); }
        .aid-btn:disabled { opacity: .6; cursor: progress; }
        .aid-link { background: none; border: none; color: var(--c-goldtext); text-decoration: underline; cursor: pointer; font: 12.5px 'DM Sans', sans-serif; padding: 0; }
        .aid-error { margin: 6px 0 0; font-size: 12px; color: var(--c-red); }
        .aid-btn:focus-visible, .aid-link:focus-visible { outline: 2px solid #c9a84c; outline-offset: 2px; }
      `}</style>
    </div>
  );
}