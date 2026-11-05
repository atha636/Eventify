import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { listBoards, createBoard, addToBoard, removeFromBoard } from "../services/boardService";

const EMOJIS = ["💍", "🎂", "🎉", "🪔", "🌸", "📸", "✨"];

// "Save to board" button + dialog. Only customers see it; logged-out visitors are sent to sign in.
export default function AddToBoard({ serviceId, label = "Save to board", className = "", compact = false }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [creating, setCreating] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    listBoards().then((b) => alive && setBoards(b)).catch((e) => alive && setError(String(e)));
    closeRef.current?.focus();
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", esc);
    return () => { alive = false; document.removeEventListener("keydown", esc); };
  }, [open]);

  if (token && user?.role && user.role !== "user") return null;   // vendors/admins don't use boards

  const openIt = (e) => {
    e.stopPropagation(); e.preventDefault();
    if (!token) { navigate("/login"); return; }
    setError(""); setBoards(null); setOpen(true);
  };

  const toggle = async (b) => {
    const has = b.serviceIds.includes(String(serviceId));
    setBusyId(b._id); setError("");
    try {
      if (has) await removeFromBoard(b._id, serviceId); else await addToBoard(b._id, serviceId);
      setBoards((list) => list.map((x) => x._id !== b._id ? x : {
        ...x, count: x.count + (has ? -1 : 1),
        serviceIds: has ? x.serviceIds.filter((i) => i !== String(serviceId)) : [...x.serviceIds, String(serviceId)],
      }));
    } catch (e) { setError(String(e)); } finally { setBusyId(""); }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true); setError("");
    try {
      const b = await createBoard({ name, emoji, serviceId });
      setBoards((list) => [{ ...b, serviceIds: [String(serviceId)], thumbs: [], shared: false, votes: 0 }, ...(list || [])]);
      setName("");
    } catch (er) { setError(String(er)); } finally { setCreating(false); }
  };

  const saved = (boards || []).filter((b) => b.serviceIds.includes(String(serviceId))).length;

  return (
    <>
      <button type="button" className={`atb-btn ${compact ? "compact" : ""} ${className}`} onClick={openIt}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
        {label}
      </button>
      {open && createPortal(
        <div className="atb-overlay" onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) setOpen(false); }} role="dialog" aria-modal="true" aria-label="Save to board">
          <div className="atb-modal" onClick={(e) => e.stopPropagation()}>
            <button ref={closeRef} className="atb-x" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            <h3 className="atb-title">Save to a board</h3>
            <p className="atb-sub">Group vendors by event, then share the board with family to vote.</p>

            <div className="atb-list" aria-busy={!boards}>
              {!boards && !error && <p className="atb-muted">Loading your boards…</p>}
              {boards && boards.length === 0 && <p className="atb-muted">No boards yet — create your first one below.</p>}
              {(boards || []).map((b) => {
                const has = b.serviceIds.includes(String(serviceId));
                return (
                  <label key={b._id} className={`atb-row ${has ? "on" : ""}`}>
                    <input type="checkbox" checked={has} disabled={busyId === b._id} onChange={() => toggle(b)} />
                    <span className="atb-emoji" aria-hidden="true">{b.emoji}</span>
                    <span className="atb-name">{b.name}</span>
                    <span className="atb-count">{b.count}</span>
                  </label>
                );
              })}
            </div>

            <form className="atb-new" onSubmit={create}>
              <div className="atb-emojis" role="group" aria-label="Board icon">
                {EMOJIS.map((em) => <button key={em} type="button" className={emoji === em ? "on" : ""} onClick={() => setEmoji(em)} aria-pressed={emoji === em}>{em}</button>)}
              </div>
              <div className="atb-new-row">
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="New board, e.g. Wedding decor" aria-label="New board name" />
                <button type="submit" disabled={!name.trim() || creating}>{creating ? "…" : "Create"}</button>
              </div>
            </form>

            {error && <p className="atb-error" role="alert">{error}</p>}
            <div className="atb-foot">
              <span className="atb-muted">{saved > 0 ? `Saved in ${saved} board${saved > 1 ? "s" : ""}` : ""}</span>
              <button className="atb-link" onClick={() => navigate("/boards")}>Open my boards →</button>
            </div>
          </div>
          <style>{styles}</style>
        </div>,
        document.body
      )}
      {!open && <style>{btnStyles}</style>}
    </>
  );
}

const btnStyles = `
  .atb-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; font:500 13.5px 'DM Sans',sans-serif; padding:10px 18px; border-radius:999px; border:1px solid var(--border); background:transparent; color:var(--ink); cursor:pointer; transition:border-color .15s, background .15s; }
  .atb-btn:hover { border-color:#c9a84c; background:var(--gold-tint); }
  .atb-btn.compact { padding:8px 14px; font-size:12.5px; }
  .atb-btn:focus-visible { outline:2px solid #c9a84c; outline-offset:2px; }
`;
const styles = btnStyles + `
  .atb-overlay { position:fixed; inset:0; z-index:7200; background:rgba(14,12,10,.65); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:16px; }
  .atb-modal { position:relative; width:min(440px,100%); max-height:calc(100vh - 32px); overflow:auto; background:var(--white); color:var(--ink); border:1px solid var(--border); border-radius:20px; padding:26px 24px 20px; box-shadow:0 30px 80px rgba(0,0,0,.4); font-family:'DM Sans',sans-serif; text-align:left; }
  .atb-x { position:absolute; top:12px; right:12px; width:32px; height:32px; border-radius:50%; border:1px solid var(--border); background:transparent; color:var(--ink); cursor:pointer; }
  .atb-title { font-family:'Cormorant Garamond',serif; font-size:1.6rem; font-weight:600; margin:0 0 4px; color:var(--ink)!important; }
  .atb-sub { margin:0 0 14px; font-size:13px; color:var(--text2); line-height:1.5; }
  .atb-muted { font-size:13px; color:var(--muted); margin:0; }
  .atb-list { display:flex; flex-direction:column; gap:8px; max-height:240px; overflow:auto; margin-bottom:14px; }
  .atb-row { display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid var(--border); border-radius:12px; cursor:pointer; background:var(--surface,var(--cream)); }
  .atb-row.on { border-color:#c9a84c; background:var(--gold-tint); }
  .atb-row input { width:16px; height:16px; accent-color:#c9a84c; margin:0; }
  .atb-emoji { font-size:18px; } .atb-name { flex:1; font-size:14px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .atb-count { font-size:12px; color:var(--muted); }
  .atb-new { border-top:1px solid var(--border); padding-top:14px; }
  .atb-emojis { display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap; }
  .atb-emojis button { width:34px; height:34px; border-radius:10px; border:1px solid var(--border); background:transparent; font-size:16px; cursor:pointer; }
  .atb-emojis button.on { border-color:#c9a84c; background:var(--gold-tint); }
  .atb-new-row { display:flex; gap:8px; }
  .atb-new-row input { flex:1; min-width:0; padding:10px 14px; border-radius:999px; border:1px solid var(--border); background:var(--white); color:var(--ink); font:14px 'DM Sans',sans-serif; }
  .atb-new-row input:focus-visible { outline:2px solid #c9a84c; outline-offset:1px; }
  .atb-new-row button { padding:10px 18px; border-radius:999px; border:1px solid var(--btn-bg); background:var(--btn-bg); color:var(--btn-fg); font:500 13.5px 'DM Sans',sans-serif; cursor:pointer; }
  .atb-new-row button:disabled { opacity:.5; cursor:default; }
  .atb-error { color:#d97b7b; font-size:13px; margin:10px 0 0; }
  .atb-foot { display:flex; justify-content:space-between; align-items:center; margin-top:14px; gap:10px; }
  .atb-link { background:none; border:none; color:var(--c-goldtext); font:500 13px 'DM Sans',sans-serif; cursor:pointer; text-decoration:underline; text-underline-offset:3px; }
`;