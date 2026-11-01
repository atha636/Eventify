import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  listPlans, getPlan, createPlan, updatePlan, deletePlan,
  addItem, updateItem, deleteItem, addTask, updateTask, deleteTask,
} from "../services/planService";

const inr = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const EVENT_TYPES = ["Wedding", "Engagement", "Birthday", "Anniversary", "Corporate", "Baby shower", "Other"];
const CAT_COLORS = ["var(--c-goldtext)", "var(--c-green)", "var(--c-blue)", "var(--c-purple)", "var(--c-rose)", "var(--c-red)"];

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

function countdown(date) {
  if (!date) return null;
  const days = Math.ceil((new Date(date).setHours(23, 59, 59, 999) - Date.now()) / 86400000);
  if (days < 0) return { text: "Event done", tone: "past" };
  if (days === 0) return { text: "Today!", tone: "soon" };
  if (days === 1) return { text: "Tomorrow", tone: "soon" };
  return { text: `${days} days to go`, tone: days <= 14 ? "soon" : "ok" };
}

// ── Modal for creating / editing the plan's basic details ───────────
function PlanForm({ initial, onSubmit, onClose, busy, error }) {
  const [f, setF] = useState({
    title: initial?.title || "",
    eventType: initial?.eventType || "Wedding",
    date: toInputDate(initial?.date),
    totalBudget: initial?.totalBudget || "",
    guests: initial?.guests || "",
    template: !initial,
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <div className="ep-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="ep-modal" onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <h3 className="ep-modal-title">{initial ? "Edit event details" : "Plan a new event"}</h3>
        <label className="ep-field">Event name
          <input value={f.title} onChange={set("title")} placeholder="e.g. Riya & Arjun's wedding" maxLength={100} autoFocus required />
        </label>
        <div className="ep-row2">
          <label className="ep-field">Type
            <select value={f.eventType} onChange={set("eventType")}>
              {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="ep-field">Event date
            <input type="date" value={f.date} onChange={set("date")} />
          </label>
        </div>
        <div className="ep-row2">
          <label className="ep-field">Total budget (₹)
            <input type="number" min="0" inputMode="numeric" value={f.totalBudget} onChange={set("totalBudget")} placeholder="500000" />
          </label>
          <label className="ep-field">Guests
            <input type="number" min="0" inputMode="numeric" value={f.guests} onChange={set("guests")} placeholder="150" />
          </label>
        </div>
        {!initial && (
          <label className="ep-check">
            <input type="checkbox" checked={f.template} onChange={set("template")} />
            <span>Start with a suggested budget split and checklist <em>(you can change everything)</em></span>
          </label>
        )}
        {error && <p className="ep-error" role="alert">{error}</p>}
        <div className="ep-modal-actions">
          <button type="button" className="ep-btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="ep-btn solid" disabled={busy}>{busy ? "Saving…" : initial ? "Save" : "Create plan"}</button>
        </div>
      </form>
    </div>
  );
}

// ── One budget line (view + inline edit) ────────────────────────────
function ItemRow({ item, linkable, onSave, onDelete, onLink }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({});
  const linked = !!item.bookingId;

  const start = () => {
    setF({ name: item.name, category: item.category, estimated: item.estimated || "", actual: item.actual || "", paid: item.paid || "" });
    setEditing(true);
  };
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async () => { if (await onSave(item._id, f)) setEditing(false); };

  if (editing) {
    return (
      <div className="ep-item editing">
        <div className="ep-edit-grid">
          <input value={f.name} onChange={set("name")} placeholder="Name" aria-label="Item name" maxLength={120} />
          <input value={f.category} onChange={set("category")} placeholder="Category" aria-label="Category" list="ep-cats" maxLength={40} />
          <input type="number" min="0" value={f.estimated} onChange={set("estimated")} placeholder="Estimate ₹" aria-label="Estimate" />
          {!linked && <input type="number" min="0" value={f.actual} onChange={set("actual")} placeholder="Final cost ₹" aria-label="Final cost" />}
          {!linked && <input type="number" min="0" value={f.paid} onChange={set("paid")} placeholder="Paid ₹" aria-label="Paid so far" />}
        </div>
        {linked ? (
          <p className="ep-hint">Final cost and payments come live from your booking.
            <button type="button" className="ep-link" onClick={() => onLink(item._id, null)}>Unlink booking</button></p>
        ) : linkable.length > 0 && (
          <select className="ep-link-select" value="" onChange={(e) => e.target.value && onLink(item._id, e.target.value)} aria-label="Link a booking">
            <option value="">Link one of your bookings…</option>
            {linkable.map((b) => <option key={b._id} value={b._id}>{b.title} · {inr(b.price)}</option>)}
          </select>
        )}
        <div className="ep-edit-actions">
          <button type="button" className="ep-btn ghost sm" onClick={() => setEditing(false)}>Cancel</button>
          <button type="button" className="ep-btn solid sm" onClick={save}>Save</button>
        </div>
      </div>
    );
  }

  const over = item.actual > 0 && item.estimated > 0 && item.actual > item.estimated;
  return (
    <div className={`ep-item ${item.inactive ? "inactive" : ""}`}>
      <div className="ep-item-main">
        <div className="ep-item-name">
          {item.name}
          {linked && <span className={`ep-pill ${item.booking?.status}`}>Booked · {item.booking?.status || "linked"}</span>}
        </div>
        <div className="ep-item-sub">
          {item.category}{item.inactive ? " · booking cancelled — not counted" : ""}
        </div>
      </div>
      <div className="ep-item-nums">
        <span className="ep-num"><small>Estimate</small>{inr(item.estimated)}</span>
        <span className={`ep-num ${over ? "over" : ""}`}><small>Final</small>{item.actual > 0 ? inr(item.actual) : "—"}</span>
        <span className="ep-num"><small>Paid</small>{inr(item.paid)}</span>
      </div>
      <div className="ep-item-actions">
        <button className="ep-icon" onClick={start} aria-label={`Edit ${item.name}`} title="Edit">✎</button>
        <button className="ep-icon danger" onClick={() => onDelete(item._id)} aria-label={`Remove ${item.name}`} title="Remove">✕</button>
      </div>
    </div>
  );
}

export default function EventPlanner() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
  const isCustomer = !!token && user?.role === "user";

  const [plans, setPlans] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);           // "new" | "edit" | null
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newItem, setNewItem] = useState({ name: "", category: "", estimated: "" });
  const [newTask, setNewTask] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState("");
  const toastTimer = useRef(null);

  const say = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }, []);

  useEffect(() => {
    if (!token) navigate("/login");
    else if (user?.role !== "user") navigate("/");
  }, [token, user?.role, navigate]);

  const loadPlan = useCallback(async (id) => {
    try {
      const p = await getPlan(id);
      setPlan(p); setNotes(p.notes || "");
    } catch (e) { say(String(e)); }
  }, [say]);

  const refreshList = useCallback(async () => {
    try { setPlans(await listPlans()); } catch (e) { say(String(e)); }
  }, [say]);

  // first load
  useEffect(() => {
    if (!isCustomer) return;
    (async () => {
      try {
        const list = await listPlans();
        setPlans(list);
        if (list.length) {
          const saved = sessionStorage.getItem("ep-active");
          const id = list.some((p) => p._id === saved) ? saved : list[0]._id;
          setActiveId(id);
          await loadPlan(id);
        }
      } catch (e) { setLoadError(String(e)); }
      finally { setLoading(false); }
    })();
  }, [isCustomer, loadPlan]);

  const pick = (id) => {
    setActiveId(id); setConfirmDelete(false);
    try { sessionStorage.setItem("ep-active", id); } catch { /* private mode */ }
    loadPlan(id);
  };

  // Runs a mutation, shows errors as a toast, returns true on success
  const mutate = async (fn, { reload = false } = {}) => {
    try {
      const next = await fn();
      if (reload) await loadPlan(activeId);
      else setPlan((prev) => ({ ...next, linkableBookings: prev?.linkableBookings || [] }));
      refreshList();
      return true;
    } catch (e) { say(String(e)); return false; }
  };

  // ── plan-level actions ──
  const submitPlan = async (f) => {
    setModalBusy(true); setModalError("");
    try {
      const body = { ...f, totalBudget: Number(f.totalBudget) || 0, guests: Number(f.guests) || 0, date: f.date || null };
      if (modal === "new") {
        const created = await createPlan(body);
        setModal(null); setActiveId(created._id);
        try { sessionStorage.setItem("ep-active", created._id); } catch { /* ignore */ }
        await Promise.all([loadPlan(created._id), refreshList()]);
      } else {
        await updatePlan(activeId, body);
        setModal(null);
        await Promise.all([loadPlan(activeId), refreshList()]);
      }
    } catch (e) { setModalError(String(e)); }
    finally { setModalBusy(false); }
  };

  const removePlan = async () => {
    try {
      await deletePlan(activeId);
      const rest = plans.filter((p) => p._id !== activeId);
      setPlans(rest); setConfirmDelete(false);
      if (rest.length) pick(rest[0]._id); else { setActiveId(null); setPlan(null); }
    } catch (e) { say(String(e)); }
  };

  // ── items / tasks ──
  const submitItem = async (e) => {
    e.preventDefault();
    const ok = await mutate(() => addItem(activeId, { ...newItem, estimated: Number(newItem.estimated) || 0 }));
    if (ok) setNewItem((p) => ({ name: "", category: p.category, estimated: "" }));
  };
  const addBooking = (bookingId) => mutate(() => addItem(activeId, { bookingId }), { reload: true });
  const saveItem = (itemId, f) => mutate(() => updateItem(activeId, itemId, {
    name: f.name, category: f.category, estimated: Number(f.estimated) || 0,
    ...(f.actual !== undefined ? { actual: Number(f.actual) || 0, paid: Number(f.paid) || 0 } : {}),
  }));
  const linkItem = (itemId, bookingId) => mutate(() => updateItem(activeId, itemId, { bookingId }), { reload: true });
  const removeItem = (itemId) => mutate(() => deleteItem(activeId, itemId), { reload: true });

  const submitTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    if (await mutate(() => addTask(activeId, { text: newTask }))) setNewTask("");
  };
  const toggleTask = (t) => {
    // optimistic: tick instantly, roll back if the server says no
    setPlan((p) => ({
      ...p,
      tasks: p.tasks.map((x) => (x._id === t._id ? { ...x, done: !t.done } : x)),
      tasksDone: p.tasksDone + (t.done ? -1 : 1),
    }));
    updateTask(activeId, t._id, { done: !t.done }).then(refreshList).catch((e) => { say(String(e)); loadPlan(activeId); });
  };

  const saveNotes = () => {
    if (!plan || notes === (plan.notes || "")) return;
    mutate(() => updatePlan(activeId, { notes }));
  };

  // ── derived ──
  const s = plan?.summary;
  const pct = s && s.budget > 0 ? Math.min(100, Math.round((s.committed / s.budget) * 100)) : 0;
  const overBudget = s && s.budget > 0 && s.committed > s.budget;
  const cd = plan ? countdown(plan.date) : null;
  const catMax = plan ? Math.max(1, ...plan.categories.map((c) => Math.max(c.committed, c.estimated))) : 1;
  const allCats = plan ? [...new Set(plan.items.map((i) => i.category))] : [];
  const grouped = plan ? allCats.map((c) => ({ cat: c, items: plan.items.filter((i) => i.category === c) })) : [];
  const dueSoon = plan ? plan.tasks.filter((t) => !t.done && t.dueDate && new Date(t.dueDate) < new Date()).length : 0;

  if (!isCustomer) return null;

  return (
    <div className="ep-root">
      <Navbar />
      <div className="ep-shell">
        <div className="ep-header">
          <div>
            <h1 className="ep-title">Event Planner</h1>
            <p className="ep-subtitle">Set a budget, track every rupee, and tick off the checklist — your bookings sync in automatically.</p>
          </div>
          <button className="ep-btn solid" onClick={() => { setModalError(""); setModal("new"); }}>+ New plan</button>
        </div>

        {loading && <div className="ep-state">Loading your plans…</div>}
        {!loading && loadError && <div className="ep-state ep-error">{loadError}</div>}

        {!loading && !loadError && plans.length === 0 && (
          <div className="ep-empty">
            <div className="ep-empty-icon" aria-hidden="true">🗓</div>
            <h2>Plan your first event</h2>
            <p>Add your budget and we’ll suggest how to split it across venue, catering, décor and more. Then link the vendors you book to see what you’ve spent.</p>
            <button className="ep-btn solid" onClick={() => { setModalError(""); setModal("new"); }}>Create a plan</button>
            <Link to="/vendors" className="ep-link center">Browse vendors first →</Link>
          </div>
        )}

        {!loading && plans.length > 0 && (
          <>
            <div className="ep-tabs" role="tablist" aria-label="Your event plans">
              {plans.map((p) => (
                <button key={p._id} role="tab" aria-selected={p._id === activeId}
                  className={`ep-tab ${p._id === activeId ? "active" : ""}`} onClick={() => pick(p._id)}>
                  {p.title}
                </button>
              ))}
            </div>

            {plan && plan._id === activeId && (
              <>
                <div className="ep-plan-head">
                  <div>
                    <h2 className="ep-plan-title">{plan.title}</h2>
                    <div className="ep-meta">
                      <span>{plan.eventType}</span>
                      {plan.date && <span>{fmtDate(plan.date)}</span>}
                      {plan.guests > 0 && <span>{plan.guests} guests</span>}
                      {plan.guests > 0 && s.committed > 0 && <span>{inr(s.committed / plan.guests)} per guest</span>}
                      {cd && <span className={`ep-count ${cd.tone}`}>{cd.text}</span>}
                    </div>
                  </div>
                  <div className="ep-head-actions">
                    <button className="ep-btn ghost sm" onClick={() => { setModalError(""); setModal("edit"); }}>Edit details</button>
                    {confirmDelete ? (
                      <>
                        <button className="ep-btn danger sm" onClick={removePlan}>Yes, delete plan</button>
                        <button className="ep-btn ghost sm" onClick={() => setConfirmDelete(false)}>Keep</button>
                      </>
                    ) : (
                      <button className="ep-btn ghost sm" onClick={() => setConfirmDelete(true)}>Delete</button>
                    )}
                  </div>
                </div>

                {/* KPIs */}
                <div className="ep-kpis">
                  <div className="ep-kpi accent">
                    <span className="ep-kpi-label">Budget</span>
                    <span className="ep-kpi-value">{inr(s.budget)}</span>
                    <span className="ep-kpi-sub">{s.budget > 0 ? "Your spending limit" : "Set one via Edit details"}</span>
                  </div>
                  <div className="ep-kpi">
                    <span className="ep-kpi-label">Planned spend</span>
                    <span className="ep-kpi-value">{inr(s.committed)}</span>
                    <span className="ep-kpi-sub">Final costs, else estimates</span>
                  </div>
                  <div className="ep-kpi">
                    <span className="ep-kpi-label">Paid so far</span>
                    <span className="ep-kpi-value">{inr(s.paid)}</span>
                    <span className="ep-kpi-sub">{inr(s.toPay)} still to pay</span>
                  </div>
                  <div className={`ep-kpi ${overBudget ? "bad" : "good"}`}>
                    <span className="ep-kpi-label">{overBudget ? "Over budget by" : "Left to spend"}</span>
                    <span className="ep-kpi-value">{inr(Math.abs(s.remaining))}</span>
                    <span className="ep-kpi-sub">{s.budget > 0 ? (overBudget ? "Trim something or raise the budget" : "You’re on track") : "—"}</span>
                  </div>
                </div>

                {s.budget > 0 && (
                  <div className="ep-card">
                    <div className="ep-bar-head"><span>{pct}% of budget planned</span><span>{inr(s.committed)} / {inr(s.budget)}</span></div>
                    <div className="ep-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used">
                      <div className={`ep-bar-fill ${overBudget ? "bad" : pct >= 85 ? "warn" : ""}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                <div className="ep-grid">
                  {/* LEFT: budget */}
                  <div className="ep-col">
                    <div className="ep-card">
                      <h3 className="ep-card-title">Budget items</h3>
                      <p className="ep-card-sub">Estimate what you expect to pay, then fill in the final cost once it’s agreed.</p>

                      {plan.items.length === 0 && <div className="ep-state small">No items yet — add your first below.</div>}
                      {grouped.map((g) => (
                        <div key={g.cat} className="ep-group">
                          <div className="ep-group-head">{g.cat}</div>
                          {g.items.map((it) => (
                            <ItemRow key={it._id} item={it} linkable={plan.linkableBookings || []}
                              onSave={saveItem} onDelete={removeItem} onLink={linkItem} />
                          ))}
                        </div>
                      ))}

                      <form className="ep-add" onSubmit={submitItem}>
                        <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Add an item, e.g. Wedding cake" maxLength={120} aria-label="New item name" required />
                        <input value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} placeholder="Category" list="ep-cats" maxLength={40} aria-label="Category" />
                        <input type="number" min="0" value={newItem.estimated} onChange={(e) => setNewItem({ ...newItem, estimated: e.target.value })} placeholder="₹ estimate" aria-label="Estimate" />
                        <button className="ep-btn solid sm" type="submit">Add</button>
                      </form>
                      <datalist id="ep-cats">{allCats.map((c) => <option key={c} value={c} />)}</datalist>

                      {(plan.linkableBookings || []).length > 0 && (
                        <div className="ep-linkbox">
                          <div className="ep-linkbox-title">Your bookings</div>
                          {plan.linkableBookings.map((b) => (
                            <div key={b._id} className="ep-linkrow">
                              <div>
                                <strong>{b.title}</strong>
                                <span>{b.packageName} · {inr(b.price)}{b.date ? ` · ${fmtDate(b.date)}` : ""} · {b.status}</span>
                              </div>
                              <button className="ep-btn ghost sm" onClick={() => addBooking(b._id)}>Add to plan</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {plan.categories.length > 0 && (
                      <div className="ep-card">
                        <h3 className="ep-card-title">Where the money goes</h3>
                        <p className="ep-card-sub">
                          <span className="ep-key"><i className="solid" /> Paid</span>
                          <span className="ep-key"><i className="faded" /> Planned</span>
                        </p>
                        {plan.categories.map((c, i) => {
                          const color = CAT_COLORS[i % CAT_COLORS.length];
                          return (
                            <div key={c.category} className="ep-cat">
                              <div className="ep-cat-head"><span>{c.category}</span><span>{inr(c.committed)}</span></div>
                              <div className="ep-cat-track" style={{ "--c": color }}>
                                <div className="ep-cat-plan" style={{ width: `${(c.committed / catMax) * 100}%` }}>
                                  <div className="ep-cat-paid" style={{ width: `${c.committed > 0 ? Math.min(100, (c.paid / c.committed) * 100) : 0}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: checklist + notes */}
                  <div className="ep-col">
                    <div className="ep-card">
                      <h3 className="ep-card-title">Checklist</h3>
                      <p className="ep-card-sub">
                        {plan.tasks.length ? `${plan.tasksDone} of ${plan.tasks.length} done` : "Nothing yet"}
                        {dueSoon > 0 && <span className="ep-late"> · {dueSoon} overdue</span>}
                      </p>
                      {plan.tasks.length > 0 && (
                        <div className="ep-bar thin"><div className="ep-bar-fill" style={{ width: `${(plan.tasksDone / plan.tasks.length) * 100}%` }} /></div>
                      )}
                      <ul className="ep-tasks">
                        {plan.tasks.map((t) => {
                          const late = !t.done && t.dueDate && new Date(t.dueDate) < new Date();
                          return (
                            <li key={t._id} className={t.done ? "done" : ""}>
                              <label>
                                <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} />
                                <span className="ep-task-text">{t.text}</span>
                              </label>
                              {t.dueDate && <span className={`ep-due ${late ? "late" : ""}`}>{fmtDate(t.dueDate)}</span>}
                              <button className="ep-icon danger" onClick={() => mutate(() => deleteTask(activeId, t._id))} aria-label={`Remove task ${t.text}`}>✕</button>
                            </li>
                          );
                        })}
                      </ul>
                      <form className="ep-add one" onSubmit={submitTask}>
                        <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task…" maxLength={160} aria-label="New task" />
                        <button className="ep-btn solid sm" type="submit">Add</button>
                      </form>
                    </div>

                    <div className="ep-card">
                      <h3 className="ep-card-title">Notes</h3>
                      <textarea className="ep-notes" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes}
                        placeholder="Themes, contact numbers, ideas…" maxLength={1000} rows={5} aria-label="Plan notes" />
                    </div>

                    <div className="ep-card ep-cta">
                      <h3 className="ep-card-title">Still need vendors?</h3>
                      <p className="ep-card-sub">Book on Evencers, then add the booking here — payments update automatically.</p>
                      <Link to="/vendors" className="ep-btn solid sm link">Browse vendors</Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {modal && (
        <PlanForm initial={modal === "edit" ? plan : null} onSubmit={submitPlan} onClose={() => setModal(null)} busy={modalBusy} error={modalError} />
      )}
      {toast && <div className="ep-toast" role="alert">{toast}</div>}
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .ep-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }
  .ep-shell { max-width: 1100px; margin: 0 auto; padding: 96px 20px 56px; }
  .ep-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
  .ep-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; margin: 0; color: var(--ink) !important; }
  .ep-subtitle { margin: 4px 0 0; font-size: 13px; color: var(--muted); max-width: 560px; }

  .ep-btn { font-family: inherit; font-size: 13px; font-weight: 500; padding: 10px 20px; border-radius: 22px; cursor: pointer; border: 1px solid transparent; transition: background .15s, border-color .15s, color .15s; text-decoration: none; display: inline-block; text-align: center; }
  .ep-btn.sm { padding: 7px 14px; font-size: 12.5px; }
  .ep-btn.solid { background: var(--btn-bg); color: var(--btn-fg); }
  .ep-btn.solid:hover:not(:disabled) { background: #c9a84c; color: var(--on-gold); }
  .ep-btn.ghost { background: transparent; color: var(--ink); border-color: var(--border); }
  .ep-btn.ghost:hover { border-color: #c9a84c; }
  .ep-btn.danger { background: var(--danger); color: #fff; }
  .ep-btn:disabled { opacity: .6; cursor: progress; }
  .ep-btn:focus-visible, .ep-tab:focus-visible, .ep-icon:focus-visible { outline: 2px solid #c9a84c; outline-offset: 2px; }

  .ep-state { text-align: center; color: var(--muted); font-size: 13.5px; padding: 40px 20px; }
  .ep-state.small { padding: 14px 0 6px; }
  .ep-error { color: var(--c-red); font-size: 13px; }

  .ep-empty { background: var(--white); border: 1px solid rgba(201,168,76,.2); border-radius: 16px; padding: 48px 24px; text-align: center; max-width: 560px; margin: 24px auto; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .ep-empty-icon { font-size: 40px; }
  .ep-empty h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; margin: 0; color: var(--ink) !important; }
  .ep-empty p { color: var(--muted); font-size: 13.5px; line-height: 1.6; margin: 0 0 6px; }

  .ep-tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 16px; }
  .ep-tab { white-space: nowrap; font-family: inherit; font-size: 13px; padding: 8px 16px; border-radius: 20px; background: var(--white); border: 1px solid rgba(201,168,76,.22); color: var(--muted); cursor: pointer; max-width: 240px; overflow: hidden; text-overflow: ellipsis; }
  .ep-tab:hover { color: var(--ink); }
  .ep-tab.active { background: var(--btn-bg); color: var(--btn-fg); border-color: var(--btn-bg); }

  .ep-plan-head { display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; align-items: flex-start; margin-bottom: 14px; }
  .ep-plan-title { font-family: 'Cormorant Garamond', serif; font-size: 1.7rem; margin: 0; color: var(--ink) !important; }
  .ep-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 12.5px; color: var(--muted); margin-top: 4px; }
  .ep-meta span + span::before { content: "·"; margin-right: 14px; color: var(--faint); }
  .ep-count { font-weight: 600; color: var(--c-goldtext); }
  .ep-count.soon { color: var(--c-red); }
  .ep-count.past { color: var(--faint); font-weight: 400; }
  .ep-head-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .ep-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
  .ep-kpi { background: var(--white); border: 1px solid rgba(201,168,76,.2); border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .ep-kpi.accent { background: var(--ink-surface); border-color: var(--ink-surface); color: var(--on-dark); }
  html[data-theme="dark"] .ep-kpi.accent { background: linear-gradient(180deg, rgba(201,168,76,.13), rgba(201,168,76,.05)); border-color: rgba(201,168,76,.45); }
  .ep-kpi-label { font-size: 11px; letter-spacing: .05em; text-transform: uppercase; color: var(--faint); }
  .ep-kpi.accent .ep-kpi-label { color: #c9a84c; }
  .ep-kpi-value { font-family: 'Cormorant Garamond', serif; font-size: 1.75rem; font-weight: 600; line-height: 1.1; overflow-wrap: anywhere; }
  .ep-kpi-sub { font-size: 11.5px; color: var(--muted); }
  .ep-kpi.accent .ep-kpi-sub { color: rgba(245,240,232,.6); }
  .ep-kpi.good .ep-kpi-value { color: var(--c-green); }
  .ep-kpi.bad .ep-kpi-value { color: var(--c-red); }

  .ep-card { background: var(--white); border: 1px solid rgba(201,168,76,.2); border-radius: 14px; padding: 18px 20px; margin-bottom: 14px; min-width: 0; }
  .ep-card-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 700; margin: 0; color: var(--ink) !important; }
  .ep-card-sub { font-size: 12px; color: var(--muted); margin: 2px 0 12px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  .ep-grid { display: grid; grid-template-columns: 1.55fr 1fr; gap: 14px; align-items: start; }
  .ep-col { min-width: 0; }

  .ep-bar-head { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--muted); margin-bottom: 8px; gap: 10px; flex-wrap: wrap; }
  .ep-bar { height: 10px; background: var(--track); border-radius: 6px; overflow: hidden; }
  .ep-bar.thin { height: 6px; margin-bottom: 10px; }
  .ep-bar-fill { height: 100%; background: var(--c-green); border-radius: 6px; transition: width .35s ease; }
  .ep-bar-fill.warn { background: #c9a84c; }
  .ep-bar-fill.bad { background: var(--c-red); }

  .ep-group { margin-top: 6px; }
  .ep-group-head { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--c-goldtext); padding: 10px 0 4px; font-weight: 600; }
  .ep-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid var(--line); }
  .ep-item.inactive { opacity: .5; }
  .ep-item.editing { flex-direction: column; align-items: stretch; gap: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin: 6px 0; }
  .ep-item-main { flex: 1; min-width: 0; }
  .ep-item-name { font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; overflow-wrap: anywhere; }
  .ep-item-sub { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
  .ep-pill { font-size: 10.5px; padding: 2px 8px; border-radius: 10px; background: var(--gold-tint); color: var(--c-goldtext); border: 1px solid var(--border); font-weight: 500; text-transform: capitalize; }
  .ep-pill.approved { color: var(--c-green); }
  .ep-item-nums { display: flex; gap: 14px; }
  .ep-num { display: flex; flex-direction: column; align-items: flex-end; font-size: 13px; min-width: 66px; white-space: nowrap; }
  .ep-num small { font-size: 10px; color: var(--faint); text-transform: uppercase; letter-spacing: .04em; }
  .ep-num.over { color: var(--c-red); font-weight: 600; }
  .ep-item-actions { display: flex; gap: 2px; }
  .ep-icon { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 14px; width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; }
  .ep-icon:hover { background: var(--surface); color: var(--ink); }
  .ep-icon.danger:hover { color: var(--c-red); }

  .ep-edit-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 8px; }
  .ep-edit-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .ep-hint { font-size: 12px; color: var(--muted); margin: 0; }
  .ep-link { background: none; border: none; color: var(--c-goldtext); text-decoration: underline; cursor: pointer; font-family: inherit; font-size: inherit; margin-left: 8px; padding: 0; }
  .ep-link.center { margin: 4px 0 0; font-size: 13px; }

  .ep-root input, .ep-root select, .ep-root textarea { font-family: inherit; font-size: 13px; color: var(--ink); background: var(--white); border: 1px solid var(--border); border-radius: 8px; padding: 9px 11px; min-width: 0; width: 100%; box-sizing: border-box; }
  .ep-item.editing input, .ep-item.editing select { background: var(--cream); }
  .ep-root input:focus, .ep-root select:focus, .ep-root textarea:focus { outline: none; border-color: #c9a84c; }
  .ep-root input[type="checkbox"] { width: auto; accent-color: #c9a84c; }

  .ep-add { display: grid; grid-template-columns: 1.6fr 1fr .9fr auto; gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--border); }
  .ep-add.one { grid-template-columns: 1fr auto; }
  .ep-linkbox { margin-top: 16px; background: var(--gold-tint); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
  .ep-linkbox-title { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--c-goldtext); font-weight: 600; margin-bottom: 6px; }
  .ep-linkrow { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 8px 0; font-size: 13px; }
  .ep-linkrow + .ep-linkrow { border-top: 1px solid var(--border); }
  .ep-linkrow strong { display: block; font-weight: 500; }
  .ep-linkrow span { font-size: 11.5px; color: var(--muted); text-transform: capitalize; }

  .ep-key { display: inline-flex; align-items: center; gap: 5px; }
  .ep-key i { width: 18px; height: 8px; border-radius: 3px; display: inline-block; background: var(--c-goldtext); }
  .ep-key i.faded { opacity: .3; }
  .ep-cat { margin-bottom: 12px; }
  .ep-cat-head { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px; gap: 10px; }
  .ep-cat-track { height: 9px; background: var(--track); border-radius: 5px; overflow: hidden; }
  .ep-cat-plan { height: 100%; background: color-mix(in srgb, var(--c) 32%, transparent); border-radius: 5px; transition: width .35s ease; }
  .ep-cat-paid { height: 100%; background: var(--c); border-radius: 5px; transition: width .35s ease; }

  .ep-tasks { list-style: none; margin: 0; padding: 0; }
  .ep-tasks li { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-top: 1px solid var(--line); }
  .ep-tasks label { flex: 1; display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 13.5px; min-width: 0; }
  .ep-task-text { overflow-wrap: anywhere; }
  .ep-tasks li.done .ep-task-text { text-decoration: line-through; color: var(--faint); }
  .ep-due { font-size: 11px; color: var(--muted); white-space: nowrap; }
  .ep-due.late, .ep-late { color: var(--c-red); }
  .ep-notes { resize: vertical; line-height: 1.5; margin-top: 8px; }
  .ep-cta { text-align: left; }
  .ep-btn.link { text-decoration: none; }

  .ep-overlay { position: fixed; inset: 0; background: rgba(8,6,4,.62); z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .ep-modal { background: var(--white); border: 1px solid var(--border); border-radius: 16px; padding: 24px; width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow-lg, 0 24px 60px rgba(0,0,0,.35)); }
  .ep-modal-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; margin: 0; color: var(--ink) !important; }
  .ep-field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--muted); }
  .ep-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .ep-check { display: flex; gap: 10px; align-items: flex-start; font-size: 12.5px; color: var(--text2); cursor: pointer; line-height: 1.45; }
  .ep-check em { color: var(--muted); font-style: normal; }
  .ep-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }

  .ep-toast { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 10000; max-width: min(92vw, 420px); padding: 11px 18px; border-radius: 10px; background: var(--ink-surface); color: var(--on-dark); border: 1px solid rgba(184,92,92,.55); box-shadow: 0 12px 32px rgba(0,0,0,.35); font-size: 12.5px; line-height: 1.45; text-align: center; }

  @media (max-width: 900px) {
    .ep-kpis { grid-template-columns: repeat(2, 1fr); }
    .ep-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .ep-shell { padding: 84px 16px 40px; }
    .ep-item { flex-wrap: wrap; }
    .ep-item-main { flex-basis: 100%; }
    .ep-item-nums { flex: 1; justify-content: space-between; gap: 6px; }
    .ep-num { align-items: flex-start; min-width: 0; }
    .ep-edit-grid, .ep-row2 { grid-template-columns: 1fr; }
    .ep-add { grid-template-columns: 1fr 1fr; }
    .ep-add input:first-child { grid-column: 1 / -1; }
    .ep-add .ep-btn { grid-column: 1 / -1; }
  }
`;