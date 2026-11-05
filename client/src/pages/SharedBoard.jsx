import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getBoard, updateBoard, setNote, removeFromBoard, setSharing, shareUrl } from "../services/boardService";
import { listPlans } from "../services/planService";

const inr = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
  const ok = !!token && user?.role === "user";

  const [board, setBoard] = useState(null);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [byVotes, setByVotes] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);

  const flash = useCallback((m) => { setToast(m); setTimeout(() => setToast(""), 2800); }, []);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (user?.role !== "user") { navigate("/"); return; }
    let alive = true;
    getBoard(id).then((b) => alive && setBoard(b)).catch((e) => alive && setError(String(e)));
    listPlans().then((p) => alive && setPlans(Array.isArray(p) ? p : [])).catch(() => {});
    return () => { alive = false; };
  }, [id, token, user?.role, navigate]);

  const items = useMemo(() => {
    const list = board?.items || [];
    return byVotes ? [...list].sort((a, b) => (b.up - b.down) - (a.up - a.down)) : list;
  }, [board, byVotes]);

  if (!ok) return null;

  const patch = (fn) => setBoard((b) => ({ ...b, ...fn(b) }));
  const url = board?.share?.enabled && board.share.token ? shareUrl(board.share.token) : "";

  const rename = async () => {
    const n = nameDraft.trim();
    setRenaming(false);
    if (!n || n === board.name) return;
    try { await updateBoard(id, { name: n }); patch(() => ({ name: n })); } catch (e) { flash(String(e)); }
  };
  const linkPlan = async (planId) => {
    try { await updateBoard(id, { planId: planId || null }); patch(() => ({ planId: planId || null })); flash(planId ? "Event details will show on the shared page." : "Event details hidden from the shared page."); }
    catch (e) { flash(String(e)); }
  };
  const saveNote = async (sid, note, prev) => {
    if (note === prev) return;
    try { await setNote(id, sid, note); patch((b) => ({ items: b.items.map((i) => (i.service._id === sid ? { ...i, note } : i)) })); }
    catch (e) { flash(String(e)); }
  };
  const remove = async (sid) => {
    try { await removeFromBoard(id, sid); patch((b) => ({ items: b.items.filter((i) => i.service._id !== sid) })); }
    catch (e) { flash(String(e)); }
  };
  const toggleShare = async () => {
    try {
      const r = await setSharing(id, !board.share.enabled);
      patch(() => ({ share: { enabled: r.enabled, token: r.token } }));
      flash(r.enabled ? "Link is on — anyone with it can view and vote." : "Sharing turned off. The link no longer works.");
    } catch (e) { flash(String(e)); }
  };
  const reset = async () => {
    try {
      const r = await setSharing(id, true, true);
      patch((b) => ({ share: { enabled: r.enabled, token: r.token }, items: b.items.map((i) => ({ ...i, up: 0, down: 0, voters: [] })), totalVotes: 0 }));
      setConfirmReset(false); flash("New link created and votes cleared.");
    } catch (e) { flash(String(e)); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { flash("Couldn't copy — select the link and copy it."); }
  };
  const wa = url ? `https://wa.me/?text=${encodeURIComponent(`Help me pick vendors for "${board.name}" on Evencers — vote here: ${url}`)}` : "";

  return (
    <div className="bx-root">
      <Navbar />
      <style>{styles}</style>
      <main className="bx-shell">
        <Link to="/boards" className="bx-back">← All boards</Link>
        {error && <p className="bx-error" role="alert">{error}</p>}
        {!board && !error && <p className="bx-muted">Loading…</p>}

        {board && (
          <>
            <div className="bx-head">
              <span className="bx-emoji" aria-hidden="true">{board.emoji}</span>
              {renaming ? (
                <input className="bx-name-input" autoFocus value={nameDraft} maxLength={40} onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={rename} onKeyDown={(e) => { if (e.key === "Enter") rename(); if (e.key === "Escape") setRenaming(false); }} aria-label="Board name" />
              ) : (
                <h1 className="bx-title">{board.name}</h1>
              )}
              {!renaming && <button className="bx-link" onClick={() => { setNameDraft(board.name); setRenaming(true); }}>Rename</button>}
            </div>

            <div className="bx-layout">
              <section aria-label="Vendors on this board">
                <div className="bx-bar">
                  <span className="bx-muted">{items.length} vendor{items.length !== 1 ? "s" : ""}</span>
                  {board.totalVotes > 0 && <label className="bx-check"><input type="checkbox" checked={byVotes} onChange={(e) => setByVotes(e.target.checked)} /> Sort by votes</label>}
                </div>

                {items.length === 0 && (
                  <div className="bx-empty">
                    <p>This board is empty. Tap “Save to board” on a vendor you like.</p>
                    <div className="bx-empty-links"><Link to="/vendors" className="bx-btn solid">Browse vendors</Link><Link to="/favourites" className="bx-btn ghost">My favourites</Link></div>
                  </div>
                )}

                <div className="bx-list">
                  {items.map((it) => {
                    const s = it.service;
                    return (
                      <article key={s._id} className="bx-item">
                        <Link to={`/vendor/${s._id}`} className="bx-thumb" aria-label={`Open ${s.title}`}>
                          {s.image ? <img src={s.image} alt="" loading="lazy" /> : <span>📷</span>}
                        </Link>
                        <div className="bx-info">
                          <div className="bx-row1">
                            <Link to={`/vendor/${s._id}`} className="bx-vtitle">{s.title}</Link>
                            {s.rating > 0 && <span className="bx-rate">★ {s.rating}</span>}
                          </div>
                          <p className="bx-meta">{s.serviceType}{s.locations?.length ? ` · ${s.locations.join(", ")}` : ""}{s.fromPrice ? ` · from ${inr(s.fromPrice)}` : ""}</p>
                          <input className="bx-note" defaultValue={it.note} maxLength={200} placeholder="Add a note (only you see this)…" aria-label={`Note for ${s.title}`}
                            onBlur={(e) => saveNote(s._id, e.target.value.trim(), it.note)} />
                          <div className="bx-votes">
                            <span className="bx-pill up">👍 {it.up}</span>
                            <span className="bx-pill down">👎 {it.down}</span>
                            {it.voters.length > 0 && <span className="bx-voters">{it.voters.map((v) => `${v.name} ${v.value === 1 ? "👍" : "👎"}`).join(" · ")}</span>}
                          </div>
                        </div>
                        <button className="bx-x" onClick={() => remove(s._id)} aria-label={`Remove ${s.title} from board`}>✕</button>
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside className="bx-side">
                <section className="bx-card">
                  <h2>Share this board</h2>
                  <p className="bx-muted">Friends and family open a link — no account needed — and vote 👍 or 👎 on each vendor.</p>
                  <label className="bx-switch">
                    <input type="checkbox" checked={board.share.enabled} onChange={toggleShare} />
                    <span className="bx-track" aria-hidden="true" />
                    <span>{board.share.enabled ? "Link is on" : "Link is off"}</span>
                  </label>
                  {url && (
                    <>
                      <div className="bx-url"><input readOnly value={url} aria-label="Share link" onFocus={(e) => e.target.select()} /><button onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button></div>
                      <a className="bx-btn wa" href={wa} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
                      {confirmReset ? (
                        <p className="bx-confirm">This kills the old link and clears all votes. <button className="bx-link" onClick={() => setConfirmReset(false)}>Cancel</button> <button className="bx-link danger" onClick={reset}>Reset</button></p>
                      ) : (
                        <button className="bx-link" onClick={() => setConfirmReset(true)}>Reset link &amp; votes</button>
                      )}
                    </>
                  )}
                </section>

                <section className="bx-card">
                  <h2>Event details</h2>
                  <p className="bx-muted">Show your event date and guest count on the shared page. Budget and notes are never shown.</p>
                  <select className="bx-select" value={board.planId || ""} onChange={(e) => linkPlan(e.target.value)} aria-label="Event to show">
                    <option value="">Don’t show event details</option>
                    {plans.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                  {plans.length === 0 && <p className="bx-muted" style={{ marginTop: 8 }}>No plans yet — <Link to="/event-planner" className="bx-linka">create one in the planner</Link>.</p>}
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
      {toast && <div className="bx-toast" role="status">{toast}</div>}
    </div>
  );
}

const styles = `
  .bx-root { font-family:'DM Sans',sans-serif; background:var(--cream); min-height:100vh; color:var(--ink); }
  .bx-shell { max-width:1100px; margin:0 auto; padding:92px 20px 60px; }
  .bx-back { color:var(--c-goldtext); font-size:13px; text-decoration:none; } .bx-back:hover { text-decoration:underline; }
  .bx-head { display:flex; align-items:center; gap:12px; margin:10px 0 22px; flex-wrap:wrap; }
  .bx-emoji { font-size:34px; } .bx-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; margin:0; color:var(--ink)!important; }
  .bx-name-input { font:600 1.6rem 'Cormorant Garamond',serif; background:var(--white); color:var(--ink); border:1px solid #c9a84c; border-radius:12px; padding:4px 12px; min-width:220px; }
  .bx-muted { color:var(--muted); font-size:13px; line-height:1.5; margin:0; } .bx-error { color:#d97b7b; }
  .bx-link { background:none; border:none; padding:0; color:var(--c-goldtext); font:500 13px 'DM Sans',sans-serif; cursor:pointer; text-decoration:underline; text-underline-offset:3px; } .bx-link.danger { color:#d97b7b; }
  .bx-linka { color:var(--c-goldtext); }
  .bx-layout { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:22px; align-items:start; }
  .bx-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; } .bx-check { font-size:13px; color:var(--text2); display:flex; gap:6px; align-items:center; cursor:pointer; } .bx-check input { accent-color:#c9a84c; }
  .bx-list { display:flex; flex-direction:column; gap:12px; }
  .bx-item { position:relative; display:flex; gap:14px; background:var(--white); border:1px solid var(--border); border-radius:16px; padding:12px; }
  .bx-thumb { width:110px; height:96px; border-radius:12px; overflow:hidden; flex:none; background:var(--surface,var(--cream)); display:flex; align-items:center; justify-content:center; text-decoration:none; font-size:26px; }
  .bx-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
  .bx-info { flex:1; min-width:0; padding-right:36px; }
  .bx-row1 { display:flex; justify-content:space-between; gap:10px; align-items:baseline; }
  .bx-vtitle { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:var(--ink); text-decoration:none; } .bx-vtitle:hover { color:var(--c-goldtext); }
  .bx-rate { font-size:13px; color:var(--c-goldtext); white-space:nowrap; }
  .bx-meta { margin:2px 0 8px; font-size:12.5px; color:var(--muted); text-transform:capitalize; }
  .bx-note { width:100%; box-sizing:border-box; padding:8px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface,var(--cream)); color:var(--ink); font:13px 'DM Sans',sans-serif; }
  .bx-votes { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:8px; }
  .bx-pill { font-size:12px; padding:3px 10px; border-radius:999px; border:1px solid var(--border); } .bx-pill.up { background:rgba(76,175,130,.14); } .bx-pill.down { background:rgba(184,92,92,.12); }
  .bx-voters { font-size:12px; color:var(--muted); }
  .bx-x { position:absolute; top:10px; right:10px; width:28px; height:28px; border-radius:50%; border:1px solid var(--border); background:transparent; color:var(--muted); cursor:pointer; font-size:12px; } .bx-x:hover { color:#d97b7b; border-color:#d97b7b; }
  .bx-side { display:flex; flex-direction:column; gap:16px; position:sticky; top:92px; }
  .bx-card { background:var(--white); border:1px solid var(--border); border-radius:18px; padding:18px; }
  .bx-card h2 { font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:600; margin:0 0 6px; color:var(--ink)!important; }
  .bx-switch { display:flex; align-items:center; gap:10px; margin:14px 0 4px; font-size:14px; cursor:pointer; } .bx-switch input { position:absolute; opacity:0; width:1px; height:1px; }
  .bx-track { width:38px; height:22px; border-radius:999px; background:var(--border); position:relative; flex:none; transition:background .15s; }
  .bx-track::after { content:""; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:var(--white); transition:transform .15s; box-shadow:0 1px 3px rgba(0,0,0,.3); }
  .bx-switch input:checked + .bx-track { background:#c9a84c; } .bx-switch input:checked + .bx-track::after { transform:translateX(16px); }
  .bx-switch input:focus-visible + .bx-track { outline:2px solid #c9a84c; outline-offset:2px; }
  .bx-url { display:flex; gap:8px; margin:12px 0; } .bx-url input { flex:1; min-width:0; padding:9px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface,var(--cream)); color:var(--ink); font:12.5px 'DM Sans',sans-serif; }
  .bx-url button { padding:9px 14px; border-radius:10px; border:1px solid var(--btn-bg); background:var(--btn-bg); color:var(--btn-fg); font:500 13px 'DM Sans',sans-serif; cursor:pointer; }
  .bx-btn { font:500 13.5px 'DM Sans',sans-serif; padding:10px 18px; border-radius:999px; cursor:pointer; text-decoration:none; border:1px solid var(--border); display:inline-flex; align-items:center; justify-content:center; }
  .bx-btn.solid { background:var(--btn-bg); color:var(--btn-fg); border-color:var(--btn-bg); } .bx-btn.ghost { color:var(--ink); }
  .bx-btn.wa { width:100%; box-sizing:border-box; background:#25d366; color:#06371b; border-color:#25d366; margin-bottom:10px; }
  .bx-confirm { font-size:13px; color:var(--text2); margin:0; }
  .bx-select { width:100%; margin-top:10px; padding:10px 14px; border-radius:999px; border:1px solid var(--border); background:var(--surface,var(--cream)); color:var(--ink); font:13.5px 'DM Sans',sans-serif; }
  .bx-empty { text-align:center; background:var(--white); border:1px solid var(--border); border-radius:16px; padding:36px 16px; } .bx-empty p { color:var(--text2); margin:0 0 14px; } .bx-empty-links { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
  .bx-toast { position:fixed; left:50%; bottom:28px; transform:translateX(-50%); z-index:7100; background:var(--ink-surface); color:var(--on-dark); border:1px solid rgba(201,168,76,.6); border-radius:10px; padding:10px 16px; font-size:13px; max-width:calc(100vw - 32px); }
  .bx-btn:focus-visible, .bx-link:focus-visible, .bx-x:focus-visible, .bx-note:focus-visible, .bx-select:focus-visible, .bx-url button:focus-visible, .bx-thumb:focus-visible { outline:2px solid #c9a84c; outline-offset:2px; }
  @media (max-width:900px) { .bx-layout { grid-template-columns:1fr; } .bx-side { position:static; order:-1; } }
  @media (max-width:520px) { .bx-shell { padding:84px 16px 48px; } .bx-thumb { width:84px; height:84px; } .bx-item { gap:10px; } }
`;