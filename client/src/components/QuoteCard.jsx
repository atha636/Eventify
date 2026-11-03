import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getQuote, sendOffer, acceptQuote, declineQuote } from "../services/quoteService";

const inr = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const PLANS = [
  { v: "100", label: "Pay in full (5% discount)" },
  { v: "75",  label: "75% now · 25% after the event" },
  { v: "25",  label: "25% now · 50% before · 25% after" },
];
const STATUS = {
  requested: ["Waiting for offer", "wait"], offered: ["Offer received", "go"], accepted: ["Booked", "ok"],
  declined: ["Declined", "no"], cancelled: ["Cancelled", "no"], expired: ["Offer expired", "no"],
};

// The interactive quote inside a chat thread. `latest` = this is the newest message about this quote,
// older ones collapse to a one-line note so the thread stays tidy.
export default function QuoteCard({ quoteId, latest, text, refreshKey, onChanged }) {
  const [q, setQ] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ price: "", packageName: "", inclusions: "", note: "", validDays: "7" });
  const [plan, setPlan] = useState("100");
  const [revising, setRevising] = useState(false);

  const load = useCallback(async () => {
    try { setQ(await getQuote(quoteId)); } catch (e) { setError(String(e)); }
  }, [quoteId]);
  useEffect(() => { if (latest) load(); }, [latest, load, refreshKey]);

  if (!latest) return <div className="qc-note">{text}</div>;
  if (!q) return <div className="qc-card">{error ? <p className="qc-error">{error}</p> : <p className="qc-muted">Loading quote…</p>}</div>;

  const act = async (fn, after) => {
    setBusy(true); setError("");
    try { const r = await fn(); await load(); onChanged?.(); after?.(r); }
    catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  };

  const isVendor = q.side === "vendor";
  const [statusLabel, tone] = STATUS[q.status] || [q.status, "wait"];
  const r = q.request;
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const offerBody = () => ({
    price: Number(form.price), packageName: form.packageName, validDays: Number(form.validDays) || 7, note: form.note,
    inclusions: form.inclusions.split("\n").map((s) => s.trim()).filter(Boolean),
  });

  const offerForm = (
    <form className="qc-form" onSubmit={(e) => { e.preventDefault(); act(() => sendOffer(q._id, offerBody()), () => setRevising(false)); }}>
      <div className="qc-row">
        <label>Your price (₹) *<input type="number" min="1" inputMode="numeric" required value={form.price} onChange={set("price")} placeholder={r.budget ? String(r.budget) : "e.g. 75000"} /></label>
        <label>Package name<input value={form.packageName} onChange={set("packageName")} maxLength={80} placeholder="Custom offer" /></label>
      </div>
      <label>What's included <small>(one per line)</small>
        <textarea rows={3} value={form.inclusions} onChange={set("inclusions")} placeholder={"2 photographers\n8 hours coverage\nEdited album"} />
      </label>
      <div className="qc-row">
        <label>Note to customer<input value={form.note} onChange={set("note")} maxLength={600} placeholder="Optional" /></label>
        <label>Offer valid for
          <select value={form.validDays} onChange={set("validDays")}>
            {[1, 3, 7, 14, 30].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
          </select>
        </label>
      </div>
      <div className="qc-actions">
        <button className="qc-btn solid" type="submit" disabled={busy}>{busy ? "Sending…" : revising || q.status === "offered" ? "Send revised offer" : "Send offer"}</button>
        {revising && <button type="button" className="qc-btn ghost" onClick={() => setRevising(false)}>Cancel</button>}
      </div>
    </form>
  );

  return (
    <div className="qc-card" role="group" aria-label="Quote request">
      <div className="qc-head">
        <strong>{isVendor ? `Quote request from ${q.customer.name}` : `Quote for ${q.service.title}`}</strong>
        <span className={`qc-pill ${tone}`}>{statusLabel}</span>
      </div>

      <dl className="qc-facts">
        <div><dt>Date</dt><dd>{fmt(r.date)}</dd></div>
        {r.eventType && <div><dt>Event</dt><dd>{r.eventType}</dd></div>}
        {r.guests > 0 && <div><dt>Guests</dt><dd>{r.guests}</dd></div>}
        {r.budget > 0 && <div><dt>Budget</dt><dd>{inr(r.budget)}</dd></div>}
        {r.address && <div className="wide"><dt>Where</dt><dd>{r.address}</dd></div>}
        {r.details && <div className="wide"><dt>Details</dt><dd>{r.details}</dd></div>}
      </dl>

      {q.offer?.price > 0 && ["offered", "accepted", "expired"].includes(q.status) && (
        <div className="qc-offer">
          <div className="qc-offer-top"><span>{q.offer.packageName}</span><strong>{inr(q.offer.price)}</strong></div>
          {q.offer.inclusions?.length > 0 && <ul>{q.offer.inclusions.map((i) => <li key={i}>{i}</li>)}</ul>}
          {q.offer.note && <p className="qc-muted">“{q.offer.note}”</p>}
          {q.status === "offered" && q.offer.validUntil && <p className="qc-muted">Valid until {fmt(q.offer.validUntil)}</p>}
        </div>
      )}
      {q.declineNote && ["declined", "cancelled"].includes(q.status) && <p className="qc-muted">“{q.declineNote}”</p>}

      {/* ── actions ── */}
      {isVendor && (q.status === "requested" || ((q.status === "offered" || q.status === "expired") && revising)) && offerForm}
      {isVendor && (q.status === "offered" || q.status === "expired") && !revising && (
        <div className="qc-actions">
          <button className="qc-btn ghost" onClick={() => { setForm({ price: String(q.offer.price), packageName: q.offer.packageName, inclusions: (q.offer.inclusions || []).join("\n"), note: q.offer.note || "", validDays: "7" }); setRevising(true); }}>
            {q.status === "expired" ? "Send a new offer" : "Revise offer"}
          </button>
          {q.status === "offered" && <button className="qc-btn danger" disabled={busy} onClick={() => act(() => declineQuote(q._id, ""))}>Withdraw</button>}
        </div>
      )}
      {isVendor && q.status === "requested" && (
        <div className="qc-actions"><button className="qc-btn danger" disabled={busy}
          onClick={() => { const n = window.prompt("Optional note to the customer (e.g. already booked that day):", ""); if (n !== null) act(() => declineQuote(q._id, n)); }}>
          Decline request</button></div>
      )}

      {!isVendor && q.status === "offered" && (
        <>
          <label className="qc-plan">Payment plan
            <select value={plan} onChange={(e) => setPlan(e.target.value)}>{PLANS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}</select>
          </label>
          <div className="qc-actions">
            <button className="qc-btn solid" disabled={busy} onClick={() => act(() => acceptQuote(q._id, { paymentPlan: plan }))}>
              {busy ? "Booking…" : `Accept ${inr(q.offer.price)} & book`}
            </button>
            <button className="qc-btn ghost" disabled={busy} onClick={() => act(() => declineQuote(q._id, ""))}>Decline</button>
          </div>
        </>
      )}
      {!isVendor && q.status === "requested" && (
        <div className="qc-actions"><button className="qc-btn ghost" disabled={busy} onClick={() => act(() => declineQuote(q._id, ""))}>Cancel request</button></div>
      )}
      {!isVendor && q.status === "expired" && <p className="qc-muted">This offer has expired. Ask the vendor to send a new one.</p>}

      {q.status === "accepted" && (
        <div className="qc-actions">
          <Link className="qc-btn solid" to={isVendor ? "/vendor-dashboard" : "/my-bookings"}>{isVendor ? "Open in dashboard" : "View booking & pay"}</Link>
        </div>
      )}
      {error && <p className="qc-error" role="alert">{error}</p>}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .qc-note { align-self: center; font-size: 12px; color: var(--muted); background: var(--surface); border-radius: 12px; padding: 5px 12px; margin: 4px 0; text-align: center; }
  .qc-card { align-self: center; width: min(100%, 460px); box-sizing: border-box; background: var(--white); color: var(--ink); border: 1px solid rgba(201,168,76,.4); border-radius: 14px; padding: 14px 16px; margin: 6px 0; font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; gap: 10px; }
  .qc-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 14px; }
  .qc-pill { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 12px; white-space: nowrap; background: var(--gold-tint); color: var(--c-goldtext); border: 1px solid var(--border); }
  .qc-pill.ok, .qc-pill.go { color: var(--c-green); } .qc-pill.no { color: var(--c-red); }
  .qc-facts { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
  .qc-facts div { min-width: 0; } .qc-facts .wide { grid-column: 1 / -1; }
  .qc-facts dt { font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--faint); }
  .qc-facts dd { margin: 1px 0 0; font-size: 13px; overflow-wrap: anywhere; }
  .qc-offer { background: var(--gold-tint); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
  .qc-offer-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 13px; }
  .qc-offer-top strong { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; }
  .qc-offer ul { margin: 6px 0 0; padding-left: 18px; font-size: 12.5px; color: var(--text2); }
  .qc-muted { margin: 4px 0 0; font-size: 12px; color: var(--muted); }
  .qc-error { margin: 0; font-size: 12.5px; color: var(--c-red); }
  .qc-form { display: flex; flex-direction: column; gap: 8px; border-top: 1px dashed var(--border); padding-top: 10px; }
  .qc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .qc-form label, .qc-plan { display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: var(--muted); min-width: 0; }
  .qc-form small { color: var(--faint); }
  .qc-form input, .qc-form textarea, .qc-form select, .qc-plan select { font: 13px 'DM Sans', sans-serif; color: var(--ink); background: var(--cream); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; width: 100%; box-sizing: border-box; }
  .qc-form input:focus, .qc-form textarea:focus, .qc-form select:focus, .qc-plan select:focus { outline: none; border-color: #c9a84c; }
  .qc-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .qc-btn { font: 500 12.5px 'DM Sans', sans-serif; padding: 9px 18px; border-radius: 20px; cursor: pointer; border: 1px solid transparent; text-decoration: none; display: inline-block; }
  .qc-btn.solid { background: var(--btn-bg); color: var(--btn-fg); }
  .qc-btn.solid:hover:not(:disabled) { background: #c9a84c; color: var(--on-gold); }
  .qc-btn.ghost { background: transparent; color: var(--ink); border-color: var(--border); }
  .qc-btn.ghost:hover:not(:disabled) { border-color: #c9a84c; }
  .qc-btn.danger { background: transparent; color: var(--c-red); border-color: var(--border); }
  .qc-btn:disabled { opacity: .6; cursor: progress; }
  @media (max-width: 480px) { .qc-row, .qc-facts { grid-template-columns: 1fr; } }
`;