import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCalendar, setBlocked, setAutoBlock } from "../services/calendarService";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const pad = (n) => String(n).padStart(2, "0");
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;          // m is 0-based
const monthKey = (y, m) => `${y}-${pad(m + 1)}`;
const inr = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const nice = (key) => { const [y, m, d] = key.split("-").map(Number); return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`; };

export default function VendorCalendar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
  const isVendor = !!token && user?.role === "vendor";

  const now = new Date();
  const todayKey = keyOf(now.getFullYear(), now.getMonth(), now.getDate());
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [cache, setCache] = useState({});            // "YYYY-MM" -> payload
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState("");
  const [scope, setScope] = useState("all");         // "all" | serviceId
  const [selected, setSelected] = useState([]);      // day keys
  const [anchor, setAnchor] = useState(null);        // last clicked day (for range + detail)
  const [busy, setBusy] = useState(false);
  const [confirmNeeded, setConfirmNeeded] = useState(null);
  const [toast, setToast] = useState("");

  const mk = monthKey(view.y, view.m);
  const data = cache[mk];

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (user?.role !== "vendor") navigate("/");
  }, [token, user?.role, navigate]);

  useEffect(() => {
    if (!isVendor) return;
    let alive = true;
    getCalendar(mk)
      .then((d) => { if (alive) { setCache((c) => ({ ...c, [mk]: d })); setError(""); } })
      .catch((e) => { if (alive) setError(typeof e === "string" ? e : "Couldn't load your calendar."); });
    return () => { alive = false; };
  }, [mk, nonce, isVendor]);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3200); };

  const services = useMemo(() => data?.services || [], [data]);
  const scoped = useMemo(() => (scope === "all" ? services : services.filter((s) => s._id === scope)), [services, scope]);
  const scopedIds = useMemo(() => new Set(scoped.map((s) => s._id)), [scoped]);
  const svcName = useMemo(() => Object.fromEntries(services.map((s) => [s._id, s.title])), [services]);

  // per-day lookups for the visible month
  const byDay = useMemo(() => {
    const map = {};
    (data?.bookings || []).filter((b) => scopedIds.has(b.serviceId)).forEach((b) => { (map[b.date] ||= []).push(b); });
    return map;
  }, [data, scopedIds]);
  const closedCount = useMemo(() => {                  // day -> how many in-scope services are blocked
    const map = {};
    scoped.forEach((s) => s.blocked.forEach((k) => { map[k] = (map[k] || 0) + 1; }));
    return map;
  }, [scoped]);

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const lead = new Date(view.y, view.m, 1).getDay();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => keyOf(view.y, view.m, i + 1))];

  const stats = useMemo(() => {
    const all = Object.values(byDay).flat();
    return {
      confirmed: all.filter((b) => b.status === "approved").length,
      pending: all.filter((b) => b.status === "pending").length,
      blockedDays: Object.entries(closedCount).filter(([k, n]) => k.startsWith(mk) && n === scoped.length && scoped.length > 0).length,
    };
  }, [byDay, closedCount, scoped.length, mk]);

  const go = (delta) => {
    setView((v) => { const d = new Date(v.y, v.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
    setSelected([]); setConfirmNeeded(null);
  };
  const goToday = () => { setView({ y: now.getFullYear(), m: now.getMonth() }); setAnchor(todayKey); };

  const clickDay = (k, e) => {
    if (k < todayKey) return;
    setConfirmNeeded(null);
    if (e.shiftKey && anchor && anchor >= todayKey && anchor.slice(0, 7) === mk) {
      const [a, b] = anchor < k ? [anchor, k] : [k, anchor];
      setSelected(cells.filter((c) => c && c >= a && c <= b && c >= todayKey));
    } else {
      setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
    }
    setAnchor(k);
  };

  const pickWeekends = () => {
    setConfirmNeeded(null);
    setSelected(cells.filter((c) => { if (!c || c < todayKey) return false; const dow = new Date(c + "T00:00:00").getDay(); return dow === 0 || dow === 6; }));
  };
  const pickAllFuture = () => { setConfirmNeeded(null); setSelected(cells.filter((c) => c && c >= todayKey)); };

  const apply = async (blocked, force = false) => {
    if (!selected.length || !scoped.length) return;
    if (blocked && !force) {
      const hits = selected.filter((k) => (byDay[k] || []).some((b) => b.status === "approved"));
      if (hits.length) { setConfirmNeeded(hits); return; }
    }
    setBusy(true); setConfirmNeeded(null);
    try {
      const r = await setBlocked({ serviceIds: scoped.map((s) => s._id), dates: selected, blocked });
      flash(blocked ? `Blocked ${selected.length} day${selected.length > 1 ? "s" : ""}.` : `Re-opened ${selected.length} day${selected.length > 1 ? "s" : ""}.`);
      setSelected([]);
      setCache((c) => { const n = { ...c }; delete n[mk]; return n; });   // show loading state, then fresh data
      setNonce((n) => n + 1);
      return r;
    } catch (e) {
      flash(typeof e === "string" ? e : "Couldn't update the calendar.");
    } finally { setBusy(false); }
  };

  const toggleAuto = async (s) => {
    try {
      await setAutoBlock(s._id, !s.autoBlockBooked);
      setCache((c) => ({ ...c, [mk]: { ...c[mk], services: c[mk].services.map((x) => (x._id === s._id ? { ...x, autoBlockBooked: !s.autoBlockBooked } : x)) } }));
      flash(!s.autoBlockBooked ? `"${s.title}" will close a date once you approve a booking.` : `"${s.title}" can take several bookings a day again.`);
    } catch (e) { flash(typeof e === "string" ? e : "Couldn't save that setting."); }
  };

  const detailKey = anchor && anchor.slice(0, 7) === mk ? anchor : null;
  const detailBookings = detailKey ? byDay[detailKey] || [] : [];
  const detailClosed = detailKey ? scoped.filter((s) => s.blocked.includes(detailKey)) : [];
  const loading = !data && !error;

  const cellState = useCallback((k) => {
    const n = closedCount[k] || 0;
    if (!n) return "";
    return n === scoped.length ? "closed" : "partial";
  }, [closedCount, scoped.length]);

  return (
    <div className="vc-root">
      <Navbar />
      <style>{styles}</style>
      <main className="vc-shell">
        <div className="vc-top">
          <div>
            <h1 className="vc-title">Availability calendar</h1>
            <p className="vc-sub">See every booking in one place and close the dates you can't take.</p>
          </div>
          <Link to="/vendor-dashboard" className="vc-btn ghost">← Dashboard</Link>
        </div>

        {services.length > 1 && (
          <div className="vc-scope" role="group" aria-label="Choose service">
            <button className={`vc-chip ${scope === "all" ? "on" : ""}`} onClick={() => { setScope("all"); setSelected([]); }}>All services</button>
            {services.map((s) => (
              <button key={s._id} className={`vc-chip ${scope === s._id ? "on" : ""}`} onClick={() => { setScope(s._id); setSelected([]); }}>{s.title}</button>
            ))}
          </div>
        )}

        <div className="vc-stats">
          <div><b>{stats.confirmed}</b><span>Confirmed</span></div>
          <div><b>{stats.pending}</b><span>Awaiting reply</span></div>
          <div><b>{stats.blockedDays}</b><span>Days closed</span></div>
        </div>

        {error && <div className="vc-error" role="alert">{error} <button className="vc-link" onClick={() => setNonce((n) => n + 1)}>Try again</button></div>}

        {data && services.length === 0 && (
          <div className="vc-empty">
            <h2>No services yet</h2>
            <p>Add a service first, then you can manage its dates here.</p>
            <Link to="/add-service" className="vc-btn solid">Add a service</Link>
          </div>
        )}

        {(loading || services.length > 0) && (
          <div className="vc-layout">
            <section className="vc-card" aria-label="Calendar">
              <div className="vc-nav">
                <button className="vc-icon" onClick={() => go(-1)} aria-label="Previous month">‹</button>
                <h2 className="vc-month" aria-live="polite">{MONTHS[view.m]} {view.y}</h2>
                <button className="vc-icon" onClick={() => go(1)} aria-label="Next month">›</button>
                <button className="vc-link" onClick={goToday}>Today</button>
              </div>

              <div className="vc-dow" aria-hidden="true">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
              <div className={`vc-grid ${loading ? "loading" : ""}`} role="group" aria-label={`${MONTHS[view.m]} ${view.y}`}>
                {cells.map((k, i) => {
                  if (!k) return <span key={`e${i}`} className="vc-blank" />;
                  const day = Number(k.slice(8));
                  const past = k < todayKey;
                  const list = byDay[k] || [];
                  const st = cellState(k);
                  const sel = selected.includes(k);
                  const label = `${day} ${MONTHS[view.m]}${list.length ? `, ${list.length} booking${list.length > 1 ? "s" : ""}` : ""}${st === "closed" ? ", closed" : st === "partial" ? ", closed for some services" : ""}${past ? ", past" : ""}`;
                  return (
                    <button key={k} type="button" disabled={past || loading} aria-pressed={sel} aria-label={label}
                      className={`vc-day ${st} ${sel ? "sel" : ""} ${k === todayKey ? "today" : ""} ${k === detailKey ? "focus" : ""}`}
                      onClick={(e) => clickDay(k, e)}>
                      <span className="vc-num">{day}</span>
                      {st === "closed" && <span className="vc-tag">Closed</span>}
                      {st === "partial" && <span className="vc-tag part">{closedCount[k]}/{scoped.length} closed</span>}
                      {list.slice(0, 2).map((b) => (
                        <span key={b._id} className={`vc-pill ${b.status}`}>{scope === "all" && services.length > 1 ? `${b.customer}` : b.customer}</span>
                      ))}
                      {list.length > 2 && <span className="vc-more">+{list.length - 2} more</span>}
                    </button>
                  );
                })}
              </div>

              <div className="vc-legend">
                <span><i className="lg approved" /> Confirmed</span>
                <span><i className="lg pending" /> Awaiting reply</span>
                <span><i className="lg closed" /> Closed</span>
              </div>

              <div className="vc-quick">
                <span className="vc-muted">Tip: tap days to select them · Shift‑click for a range</span>
                <span className="vc-quick-btns">
                  <button className="vc-link" onClick={pickWeekends}>Select weekends</button>
                  <button className="vc-link" onClick={pickAllFuture}>Select whole month</button>
                </span>
              </div>
            </section>

            <aside className="vc-side">
              <section className="vc-card vc-panel" aria-live="polite">
                <h3>{detailKey ? nice(detailKey) : "Pick a day"}</h3>
                {!detailKey && <p className="vc-muted">Click a date to see who's booked and to close or re‑open it.</p>}
                {detailKey && detailClosed.length > 0 && (
                  <p className="vc-closed-note">Closed for: {detailClosed.map((s) => s.title).join(", ")}</p>
                )}
                {detailKey && detailBookings.length === 0 && detailClosed.length === 0 && <p className="vc-muted">Open — no bookings yet.</p>}
                {detailBookings.map((b) => (
                  <div key={b._id} className="vc-bk">
                    <div className="vc-bk-row"><strong>{b.customer}</strong><span className={`vc-st ${b.status}`}>{b.status === "approved" ? "Confirmed" : "Awaiting reply"}</span></div>
                    <div className="vc-muted">{svcName[b.serviceId]}{b.packageName ? ` · ${b.packageName}` : ""}{b.price ? ` · ${inr(b.price)}` : ""}</div>
                  </div>
                ))}
                {detailBookings.length > 0 && <Link to="/vendor-dashboard" className="vc-link">Manage bookings →</Link>}
              </section>

              <section className="vc-card vc-panel">
                <h3>Double‑booking guard</h3>
                <p className="vc-muted">Close a date automatically once you approve a booking on it. Leave it off if you can handle several events a day.</p>
                {services.map((s) => (
                  <label key={s._id} className="vc-switch">
                    <input type="checkbox" checked={s.autoBlockBooked} onChange={() => toggleAuto(s)} />
                    <span className="vc-track" aria-hidden="true" />
                    <span>{s.title}</span>
                  </label>
                ))}
              </section>
            </aside>
          </div>
        )}
      </main>

      {selected.length > 0 && (
        <div className="vc-actions" role="region" aria-label="Selected days">
          <div className="vc-actions-in">
            <div className="vc-actions-txt">
              <strong>{selected.length} day{selected.length > 1 ? "s" : ""} selected</strong>
              <span>{scope === "all" ? (services.length > 1 ? `Applies to all ${services.length} services` : services[0]?.title) : scoped[0]?.title}</span>
            </div>
            {confirmNeeded ? (
              <div className="vc-confirm">
                <span>{confirmNeeded.length === 1 ? `${nice(confirmNeeded[0])} has` : `${confirmNeeded.length} days have`} a confirmed booking. Block anyway? Existing bookings stay, but no new ones.</span>
                <button className="vc-btn ghost sm" onClick={() => setConfirmNeeded(null)}>Cancel</button>
                <button className="vc-btn solid sm" disabled={busy} onClick={() => apply(true, true)}>Block anyway</button>
              </div>
            ) : (
              <div className="vc-actions-btns">
                <button className="vc-btn ghost sm" onClick={() => setSelected([])}>Clear</button>
                <button className="vc-btn ghost sm" disabled={busy} onClick={() => apply(false)}>Re‑open</button>
                <button className="vc-btn solid sm" disabled={busy} onClick={() => apply(true)}>{busy ? "Saving…" : "Block dates"}</button>
              </div>
            )}
          </div>
        </div>
      )}
      {toast && <div className="vc-toast" role="status">{toast}</div>}
    </div>
  );
}

const styles = `
  .vc-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }
  .vc-shell { max-width: 1180px; margin: 0 auto; padding: 96px 20px 120px; }
  .vc-top { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
  .vc-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; margin: 0; color: var(--ink) !important; }
  .vc-sub { margin: 4px 0 0; color: var(--text2); font-size: 14px; }
  .vc-btn { font: 500 13.5px 'DM Sans', sans-serif; padding: 10px 18px; border-radius: 999px; cursor: pointer; text-decoration: none; border: 1px solid var(--border); transition: .15s; display: inline-flex; align-items: center; justify-content: center; }
  .vc-btn.sm { padding: 8px 16px; font-size: 13px; }
  .vc-btn.ghost { background: transparent; color: var(--ink); }
  .vc-btn.ghost:hover { border-color: #c9a84c; }
  .vc-btn.solid { background: var(--btn-bg); color: var(--btn-fg); border-color: var(--btn-bg); }
  .vc-btn.solid:hover:not(:disabled) { opacity: .88; }
  .vc-btn:disabled { opacity: .5; cursor: default; }
  .vc-btn:focus-visible, .vc-chip:focus-visible, .vc-day:focus-visible, .vc-icon:focus-visible, .vc-link:focus-visible { outline: 2px solid #c9a84c; outline-offset: 2px; }
  .vc-scope { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .vc-chip { font: 500 13px 'DM Sans', sans-serif; padding: 8px 16px; border-radius: 999px; background: var(--white); color: var(--text2); border: 1px solid var(--border); cursor: pointer; }
  .vc-chip.on { background: var(--gold-tint); color: var(--c-goldtext); border-color: #c9a84c; }
  .vc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
  .vc-stats div { background: var(--white); border: 1px solid var(--border); border-radius: 14px; padding: 14px 18px; display: flex; flex-direction: column; }
  .vc-stats b { font-family: 'Cormorant Garamond', serif; font-size: 1.9rem; font-weight: 600; line-height: 1.1; }
  .vc-stats span { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; margin-top: 2px; }
  .vc-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
  .vc-card { background: var(--white); border: 1px solid var(--border); border-radius: 18px; padding: 20px; }
  .vc-nav { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .vc-month { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; margin: 0 auto 0 4px; color: var(--ink) !important; }
  .vc-icon { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border); background: transparent; color: var(--ink); font-size: 20px; line-height: 1; cursor: pointer; }
  .vc-icon:hover { border-color: #c9a84c; }
  .vc-link { background: none; border: none; padding: 4px 2px; color: var(--c-goldtext); font: 500 13px 'DM Sans', sans-serif; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
  .vc-dow { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 6px; }
  .vc-dow span { text-align: center; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .vc-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; transition: opacity .15s; }
  .vc-grid.loading { opacity: .45; }
  .vc-blank { min-height: 92px; }
  .vc-day { min-height: 92px; min-width: 0; text-align: left; padding: 7px 7px 6px; border-radius: 12px; background: var(--surface, var(--cream)); border: 1px solid var(--border); color: var(--ink); cursor: pointer; display: flex; flex-direction: column; gap: 3px; font-family: 'DM Sans', sans-serif; transition: border-color .12s, background .12s; overflow: hidden; }
  .vc-day:hover:not(:disabled) { border-color: #c9a84c; }
  .vc-day:disabled { opacity: .38; cursor: default; }
  .vc-day.today .vc-num { background: #c9a84c; color: #1a1408; }
  .vc-day.focus { box-shadow: 0 0 0 1px #c9a84c; }
  .vc-day.sel { border-color: #c9a84c; background: var(--gold-tint); box-shadow: 0 0 0 2px rgba(201,168,76,.45); }
  .vc-day.closed { background: repeating-linear-gradient(135deg, transparent 0 6px, var(--border) 6px 7px), var(--surface, var(--cream)); }
  .vc-num { font-size: 13px; font-weight: 600; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
  .vc-tag { font-size: 10.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
  .vc-tag.part { color: var(--c-goldtext); text-transform: none; letter-spacing: 0; }
  .vc-pill { font-size: 11px; line-height: 1.25; padding: 2px 6px; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .vc-pill.approved { background: rgba(201,168,76,.28); color: var(--ink); border: 1px solid rgba(201,168,76,.6); }
  .vc-pill.pending { background: transparent; color: var(--text2); border: 1px dashed var(--muted); }
  .vc-more { font-size: 10.5px; color: var(--muted); }
  .vc-legend { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 14px; font-size: 12px; color: var(--text2); }
  .vc-legend span { display: inline-flex; align-items: center; gap: 6px; }
  .lg { width: 14px; height: 14px; border-radius: 4px; display: inline-block; }
  .lg.approved { background: rgba(201,168,76,.4); border: 1px solid rgba(201,168,76,.8); }
  .lg.pending { border: 1px dashed var(--muted); }
  .lg.closed { background: repeating-linear-gradient(135deg, transparent 0 3px, var(--muted) 3px 4px); border: 1px solid var(--border); }
  .vc-quick { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .vc-quick-btns { display: inline-flex; gap: 14px; }
  .vc-muted { color: var(--muted); font-size: 13px; line-height: 1.5; margin: 0; }
  .vc-side { display: flex; flex-direction: column; gap: 16px; }
  .vc-panel h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600; margin: 0 0 8px; color: var(--ink) !important; }
  .vc-closed-note { margin: 0 0 10px; font-size: 13px; color: var(--c-goldtext); }
  .vc-bk { padding: 10px 0; border-top: 1px solid var(--border); }
  .vc-bk-row { display: flex; justify-content: space-between; gap: 8px; align-items: center; margin-bottom: 2px; font-size: 14px; }
  .vc-st { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
  .vc-st.approved { background: rgba(76,175,130,.18); color: #3f9f78; }
  .vc-st.pending { background: rgba(201,168,76,.2); color: var(--c-goldtext); }
  .vc-switch { display: flex; align-items: center; gap: 10px; margin-top: 12px; font-size: 14px; cursor: pointer; }
  .vc-switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .vc-track { width: 38px; height: 22px; border-radius: 999px; background: var(--border); position: relative; flex: none; transition: background .15s; }
  .vc-track::after { content: ""; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--white); transition: transform .15s; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
  .vc-switch input:checked + .vc-track { background: #c9a84c; }
  .vc-switch input:checked + .vc-track::after { transform: translateX(16px); }
  .vc-switch input:focus-visible + .vc-track { outline: 2px solid #c9a84c; outline-offset: 2px; }
  .vc-empty { text-align: center; background: var(--white); border: 1px solid var(--border); border-radius: 18px; padding: 48px 20px; }
  .vc-empty h2 { font-family: 'Cormorant Garamond', serif; margin: 0 0 6px; color: var(--ink) !important; }
  .vc-empty p { color: var(--text2); margin: 0 0 18px; }
  .vc-error { background: rgba(184,92,92,.12); border: 1px solid rgba(184,92,92,.5); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; }
  .vc-actions { position: fixed; left: 0; right: 0; bottom: 0; z-index: 7000; background: var(--ink-surface); color: var(--on-dark); border-top: 1px solid rgba(201,168,76,.5); box-shadow: 0 -10px 30px rgba(0,0,0,.25); }
  .vc-actions-in { max-width: 1180px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
  .vc-actions-txt { display: flex; flex-direction: column; font-size: 13px; }
  .vc-actions-txt span { opacity: .7; font-size: 12px; }
  .vc-actions-btns, .vc-confirm { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .vc-confirm span { font-size: 13px; max-width: 460px; }
  .vc-actions .vc-btn.ghost { color: var(--on-dark); border-color: rgba(255,255,255,.3); }
  .vc-actions .vc-btn.solid { background: #c9a84c; color: #1a1408; border-color: #c9a84c; }
  .vc-toast { position: fixed; left: 50%; bottom: 92px; transform: translateX(-50%); z-index: 7100; background: var(--ink-surface); color: var(--on-dark); border: 1px solid rgba(201,168,76,.6); border-radius: 10px; padding: 10px 16px; font-size: 13px; max-width: calc(100vw - 32px); }
  @media (max-width: 960px) { .vc-layout { grid-template-columns: 1fr; } }
  @media (max-width: 640px) {
    .vc-shell { padding: 84px 16px 140px; }
    .vc-grid, .vc-dow { gap: 3px; }
    .vc-day { min-height: 64px; padding: 4px; border-radius: 8px; }
    .vc-blank { min-height: 64px; }
    .vc-pill, .vc-more, .vc-tag { display: none; }
    .vc-day.closed::after, .vc-day.partial::after { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
    .vc-day:has(.vc-pill)::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #c9a84c; order: 2; }
    .vc-card { padding: 14px; }
    .vc-month { font-size: 1.2rem; white-space: nowrap; }
    .vc-stats span { font-size: 10.5px; letter-spacing: .05em; line-height: 1.3; }
    .vc-stats div { padding: 10px 12px; }
  }
`;