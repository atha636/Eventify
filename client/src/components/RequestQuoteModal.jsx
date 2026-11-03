import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createQuote } from "../services/quoteService";

const EVENT_TYPES = ["Wedding", "Engagement", "Birthday", "Anniversary", "Corporate", "Baby shower", "Other"];
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// "Request a quote" form. onDone(conversationId) is called after the request is sent.
export default function RequestQuoteModal({ service, onClose, onDone }) {
  const [f, setF] = useState({ eventType: "Wedding", date: "", guests: "", budget: "", address: "", details: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const firstRef = useRef(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    firstRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.date) { setError("Please choose your event date."); return; }
    setBusy(true); setError("");
    try {
      const r = await createQuote({
        serviceId: service._id, ...f,
        guests: Number(f.guests) || 0, budget: Number(f.budget) || 0,
      });
      onDone(r.conversationId);
    } catch (err) {
      // already have an open request → just take them to that chat
      if (err.conversationId) { onDone(err.conversationId); return; }
      setError(String(err));
    } finally { setBusy(false); }
  };

  return createPortal(
    <div className="rq-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-labelledby="rq-title">
      <form className="rq-modal" onSubmit={submit}>
        <header className="rq-head">
          <div>
            <h2 id="rq-title" className="rq-title">Request a quote</h2>
            <p className="rq-sub">Tell {service.title ? `“${service.title}”` : "the vendor"} about your event. They'll reply with a price in your chat.</p>
          </div>
          <button type="button" className="rq-x" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="rq-body">
          <div className="rq-row">
            <label className="rq-field">Event type
              <select ref={firstRef} value={f.eventType} onChange={set("eventType")}>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="rq-field">Event date *
              <input type="date" value={f.date} min={today()} onChange={set("date")} required />
            </label>
          </div>
          <div className="rq-row">
            <label className="rq-field">Guests
              <input type="number" min="0" inputMode="numeric" value={f.guests} onChange={set("guests")} placeholder="e.g. 150" />
            </label>
            <label className="rq-field">Your budget (₹)
              <input type="number" min="0" inputMode="numeric" value={f.budget} onChange={set("budget")} placeholder="e.g. 80000" />
            </label>
          </div>
          <label className="rq-field">City / venue
            <input value={f.address} onChange={set("address")} maxLength={200} placeholder="e.g. Taj Palace, Delhi" />
          </label>
          <label className="rq-field">What do you need?
            <textarea rows={4} value={f.details} onChange={set("details")} maxLength={800}
              placeholder="Hours of coverage, theme, special requests…" />
          </label>
          {error && <p className="rq-error" role="alert">{error}</p>}
        </div>

        <footer className="rq-foot">
          <button type="button" className="rq-btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="rq-btn solid" disabled={busy}>{busy ? "Sending…" : "Send request"}</button>
        </footer>
      </form>
      <style>{`
        .rq-overlay { position: fixed; inset: 0; z-index: 15000; background: rgba(8,6,4,.66); display: flex; align-items: center; justify-content: center; padding: 16px; font-family: 'DM Sans', sans-serif; }
        .rq-modal { width: 100%; max-width: 520px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; background: var(--white); color: var(--ink); border: 1px solid rgba(201,168,76,.35); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.4); }
        .rq-head { display: flex; justify-content: space-between; gap: 12px; padding: 18px 20px 12px; border-bottom: 1px solid var(--border); }
        .rq-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--ink) !important; }
        .rq-sub { margin: 4px 0 0; font-size: 12.5px; color: var(--muted); line-height: 1.5; }
        .rq-x { background: none; border: none; font-size: 16px; color: var(--muted); cursor: pointer; width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; }
        .rq-x:hover { background: var(--surface); color: var(--ink); }
        .rq-body { padding: 14px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .rq-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rq-field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--muted); min-width: 0; }
        .rq-field input, .rq-field select, .rq-field textarea { font: 13.5px 'DM Sans', sans-serif; color: var(--ink); background: var(--cream); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; width: 100%; box-sizing: border-box; resize: vertical; }
        .rq-field input:focus, .rq-field select:focus, .rq-field textarea:focus { outline: none; border-color: #c9a84c; }
        .rq-error { margin: 0; font-size: 12.5px; color: var(--c-red); }
        .rq-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--border); }
        .rq-btn { font: 500 13px 'DM Sans', sans-serif; padding: 10px 22px; border-radius: 22px; cursor: pointer; border: 1px solid transparent; }
        .rq-btn.solid { background: var(--btn-bg); color: var(--btn-fg); }
        .rq-btn.solid:hover:not(:disabled) { background: #c9a84c; color: var(--on-gold); }
        .rq-btn.ghost { background: transparent; color: var(--ink); border-color: var(--border); }
        .rq-btn:disabled { opacity: .6; cursor: progress; }
        @media (max-width: 520px) { .rq-overlay { align-items: flex-end; padding: 0; } .rq-modal { max-width: 100%; border-radius: 16px 16px 0 0; } .rq-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>,
    document.body
  );
}