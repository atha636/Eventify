import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { askAssistant } from "../services/assistantService";
import { createPlan } from "../services/planService";

const inr = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const HIDDEN_ON = ["/login", "/register", "/forgot-password", "/messages", "/admin", "/payment-success"];
const GREETING = "Hi! Tell me about your event — type, guests, budget, city and date — and I'll draft a budget and checklist you can edit.";
const QUICK = [
  "Wedding, 200 guests, ₹8 lakh",
  "Birthday party for 40 people, 50k",
  "Corporate launch, 150 guests, ₹6 lakh",
];

const readUser = () => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } };

export default function EventAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [, bump] = useState(0);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(null);       // index of the message being turned into a plan
  const [chat, setChat] = useState([{ from: "bot", text: GREETING }]);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Re-check who is logged in whenever the page changes or another tab logs in/out
  useEffect(() => {
    const onStorage = () => bump((n) => n + 1);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const token = localStorage.getItem("token");
  const user = readUser();
  const isCustomer = !!token && user?.role === "user";
  const hidden = HIDDEN_ON.some((p) => location.pathname.startsWith(p));

  // forget the conversation when a different account signs in
  const uid = user?._id || user?.id || "";
  const lastUid = useRef(uid);
  useEffect(() => {
    if (lastUid.current !== uid) {
      lastUid.current = uid;
      setChat([{ from: "bot", text: GREETING }]); setOpen(false);
    }
  }, [uid]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [chat, busy, open]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 150); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isCustomer || hidden) return null;

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    const history = [...chat.filter((m) => m.from === "me").map((m) => ({ text: m.text })), { text: msg }];
    setChat((c) => [...c, { from: "me", text: msg }]);
    setInput(""); setBusy(true);
    try {
      const r = await askAssistant(history);
      setChat((c) => [...c, { from: "bot", text: r.reply, plan: r.plan, tips: r.tips, source: r.source }]);
    } catch (e) {
      setChat((c) => [...c, { from: "bot", text: String(e), error: true }]);
    } finally { setBusy(false); }
  };

  const make = async (idx) => {
    const m = chat[idx];
    if (!m?.plan || creating !== null) return;
    setCreating(idx);
    try {
      const created = await createPlan({ ...m.plan, template: false });
      try { sessionStorage.setItem("ep-active", created._id); } catch { /* private mode */ }
      window.dispatchEvent(new CustomEvent("plans-changed", { detail: { id: created._id } }));
      setChat((c) => c.map((x, i) => (i === idx ? { ...x, plan: null, done: true } : x)));
      setOpen(false);
      navigate("/event-planner");
    } catch (e) {
      setChat((c) => [...c, { from: "bot", text: String(e), error: true }]);
    } finally { setCreating(null); }
  };

  return (
    <>
      {!open && (
        <button className="ea-fab" onClick={() => setOpen(true)} aria-label="Open AI event planner assistant">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
            <path d="M18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" />
          </svg>
          <span className="ea-fab-tip">Plan with AI</span>
        </button>
      )}

      {open && (
        <section className="ea-panel" role="dialog" aria-label="AI event planner assistant">
          <header className="ea-head">
            <div>
              <div className="ea-head-title">Event Planner AI</div>
              <div className="ea-head-sub">Free budget &amp; checklist helper</div>
            </div>
            <button className="ea-close" onClick={() => setOpen(false)} aria-label="Close assistant">✕</button>
          </header>

          <div className="ea-body" aria-live="polite">
            {chat.map((m, i) => (
              <div key={i} className={`ea-msg ${m.from} ${m.error ? "err" : ""}`}>
                <div className="ea-bubble">{m.text}</div>

                {m.plan && (
                  <div className="ea-plan">
                    <div className="ea-plan-title">{m.plan.title}</div>
                    <div className="ea-plan-meta">
                      {m.plan.eventType}
                      {m.plan.guests > 0 && ` · ${m.plan.guests} guests`}
                      {m.plan.date && ` · ${new Date(m.plan.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`}
                    </div>
                    <div className="ea-plan-total"><span>Total budget</span><strong>{inr(m.plan.totalBudget)}</strong></div>
                    <ul className="ea-plan-items">
                      {m.plan.items.map((it, k) => (
                        <li key={k}><span>{it.name}</span><span>{inr(it.estimated)}</span></li>
                      ))}
                    </ul>
                    <div className="ea-plan-tasks">{m.plan.tasks.length} checklist tasks included</div>
                    {m.tips?.length > 0 && (
                      <ul className="ea-tips">{m.tips.map((t, k) => <li key={k}>{t}</li>)}</ul>
                    )}
                    <button className="ea-create" onClick={() => make(i)} disabled={creating !== null}>
                      {creating === i ? "Creating…" : "Create this plan"}
                    </button>
                    <div className="ea-plan-hint">Not right? Just tell me what to change, like “make it 3 lakh”.</div>
                  </div>
                )}
                {m.done && <div className="ea-done">✓ Plan created — find it in your Event Planner.</div>}
              </div>
            ))}
            {busy && <div className="ea-msg bot"><div className="ea-bubble ea-typing" aria-label="Thinking"><i /><i /><i /></div></div>}
            <div ref={endRef} />
          </div>

          {chat.length === 1 && (
            <div className="ea-quick">
              {QUICK.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}
            </div>
          )}

          <form className="ea-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} maxLength={500}
              placeholder="Describe your event…" aria-label="Message to the assistant" />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send">➤</button>
          </form>
        </section>
      )}
      <style>{styles}</style>
    </>
  );
}

const styles = `
  .ea-fab { position: fixed; left: 24px; bottom: 24px; z-index: 8000; width: 58px; height: 58px; border-radius: 50%;
    border: 1px solid rgba(201,168,76,.55); background: var(--ink-surface); color: #c9a84c; cursor: pointer;
    display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 28px rgba(0,0,0,.35);
    transition: transform .18s, border-color .18s; }
  .ea-fab:hover { transform: translateY(-2px); border-color: #c9a84c; }
  .ea-fab:focus-visible, .ea-close:focus-visible, .ea-form button:focus-visible { outline: 2px solid #c9a84c; outline-offset: 2px; }
  .ea-fab-tip { position: absolute; left: 68px; white-space: nowrap; background: var(--ink-surface); color: var(--on-dark);
    border: 1px solid rgba(201,168,76,.4); font: 500 12px 'DM Sans', sans-serif; padding: 6px 12px; border-radius: 14px;
    opacity: 0; pointer-events: none; transform: translateX(-4px); transition: opacity .18s, transform .18s; }
  .ea-fab:hover .ea-fab-tip, .ea-fab:focus-visible .ea-fab-tip { opacity: 1; transform: none; }

  .ea-panel { position: fixed; left: 24px; bottom: 24px; z-index: 8500; width: 392px; max-width: calc(100vw - 32px);
    height: min(640px, calc(100vh - 48px)); display: flex; flex-direction: column; overflow: hidden;
    background: var(--white); color: var(--ink); border: 1px solid rgba(201,168,76,.35); border-radius: 18px;
    box-shadow: 0 24px 60px rgba(0,0,0,.4); font-family: 'DM Sans', sans-serif; animation: eaIn .22s ease both; }
  @keyframes eaIn { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
  .ea-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: var(--ink-surface); color: var(--on-dark); }
  .ea-head-title { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 700; color: var(--on-dark); }
  .ea-head-sub { font-size: 11.5px; color: #c9a84c; }
  .ea-close { background: none; border: none; color: var(--on-dark); font-size: 16px; cursor: pointer; width: 32px; height: 32px; border-radius: 8px; }
  .ea-close:hover { background: rgba(255,255,255,.1); }

  .ea-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; background: var(--cream); }
  .ea-msg { display: flex; flex-direction: column; gap: 8px; max-width: 94%; }
  .ea-msg.me { align-self: flex-end; align-items: flex-end; }
  .ea-bubble { padding: 10px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; overflow-wrap: anywhere; }
  .ea-msg.bot .ea-bubble { background: var(--white); border: 1px solid var(--border); border-top-left-radius: 4px; }
  .ea-msg.me .ea-bubble { background: var(--btn-bg); color: var(--btn-fg); border-top-right-radius: 4px; }
  .ea-msg.err .ea-bubble { color: var(--c-red); }
  .ea-typing { display: flex; gap: 5px; padding: 14px; }
  .ea-typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--faint); animation: eaDot 1s infinite ease-in-out; }
  .ea-typing i:nth-child(2) { animation-delay: .15s; } .ea-typing i:nth-child(3) { animation-delay: .3s; }
  @keyframes eaDot { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

  .ea-plan { background: var(--white); border: 1px solid rgba(201,168,76,.3); border-radius: 14px; padding: 14px; width: 100%; box-sizing: border-box; }
  .ea-plan-title { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 700; }
  .ea-plan-meta { font-size: 12px; color: var(--muted); margin: 2px 0 10px; }
  .ea-plan-total { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
  .ea-plan-total strong { font-family: 'Cormorant Garamond', serif; font-size: 1.35rem; color: var(--ink); }
  .ea-plan-items, .ea-tips { list-style: none; margin: 8px 0 0; padding: 0; }
  .ea-plan-items li { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; padding: 4px 0; }
  .ea-plan-items li span:last-child { color: var(--text2); white-space: nowrap; }
  .ea-plan-tasks { font-size: 12px; color: var(--c-goldtext); margin-top: 8px; }
  .ea-tips { background: var(--gold-tint); border-radius: 10px; padding: 8px 10px; }
  .ea-tips li { font-size: 12px; color: var(--text2); line-height: 1.45; padding: 3px 0; }
  .ea-create { width: 100%; margin-top: 12px; padding: 11px; border-radius: 22px; border: none; cursor: pointer; background: var(--btn-bg); color: var(--btn-fg); font: 500 13px 'DM Sans', sans-serif; transition: background .15s; }
  .ea-create:hover:not(:disabled) { background: #c9a84c; color: var(--on-gold); }
  .ea-create:disabled { opacity: .6; cursor: progress; }
  .ea-plan-hint { font-size: 11.5px; color: var(--muted); margin-top: 8px; text-align: center; }
  .ea-done { font-size: 12.5px; color: var(--c-green); }

  .ea-quick { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px; background: var(--cream); }
  .ea-quick button { font: 12px 'DM Sans', sans-serif; padding: 7px 12px; border-radius: 16px; cursor: pointer; background: var(--white); color: var(--text2); border: 1px solid var(--border); }
  .ea-quick button:hover { border-color: #c9a84c; color: var(--ink); }

  .ea-form { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--border); background: var(--white); }
  .ea-form input { flex: 1; min-width: 0; font: 13.5px 'DM Sans', sans-serif; color: var(--ink); background: var(--cream); border: 1px solid var(--border); border-radius: 20px; padding: 10px 14px; }
  .ea-form input:focus { outline: none; border-color: #c9a84c; }
  .ea-form button { width: 42px; height: 42px; border-radius: 50%; border: none; cursor: pointer; background: var(--btn-bg); color: var(--btn-fg); font-size: 15px; flex-shrink: 0; }
  .ea-form button:disabled { opacity: .45; cursor: default; }

  @media (max-width: 520px) {
    .ea-fab { left: 16px; bottom: 16px; width: 54px; height: 54px; }
    .ea-fab-tip { display: none; }
    .ea-panel { left: 0; right: 0; bottom: 0; width: 100%; max-width: 100%; height: min(86vh, 640px); border-radius: 18px 18px 0 0; }
  }
`;