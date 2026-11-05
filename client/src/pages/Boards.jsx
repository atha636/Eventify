import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { listBoards, createBoard, deleteBoard } from "../services/boardService";

const EMOJIS = ["💍", "🎂", "🎉", "🪔", "🌸", "📸", "✨"];

export default function Boards() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
  const ok = !!token && user?.role === "user";

  const [boards, setBoards] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (user?.role !== "user") { navigate("/"); return; }
    let alive = true;
    listBoards().then((b) => alive && setBoards(b)).catch((e) => alive && setError(String(e)));
    return () => { alive = false; };
  }, [token, user?.role, navigate]);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const b = await createBoard({ name, emoji });
      navigate(`/boards/${b._id}`);
    } catch (er) { setError(String(er)); setBusy(false); }
  };

  const remove = async (b) => {
    try { await deleteBoard(b._id); setBoards((l) => l.filter((x) => x._id !== b._id)); setConfirmDel(null); }
    catch (er) { setError(String(er)); }
  };

  if (!ok) return null;

  return (
    <div className="bd-root">
      <Navbar />
      <style>{styles}</style>
      <main className="bd-shell">
        <div className="bd-top">
          <div>
            <h1 className="bd-title">My boards</h1>
            <p className="bd-sub">Shortlist vendors for each event, then share a link so family can vote.</p>
          </div>
          <Link to="/favourites" className="bd-btn ghost">♡ My favourites</Link>
        </div>

        <form className="bd-new" onSubmit={create}>
          <div className="bd-emojis" role="group" aria-label="Board icon">
            {EMOJIS.map((em) => <button key={em} type="button" className={emoji === em ? "on" : ""} onClick={() => setEmoji(em)} aria-pressed={emoji === em}>{em}</button>)}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Name a new board, e.g. Sangeet ideas" aria-label="New board name" />
          <button type="submit" className="bd-btn solid" disabled={!name.trim() || busy}>{busy ? "Creating…" : "Create board"}</button>
        </form>

        {error && <p className="bd-error" role="alert">{error}</p>}

        {!boards && !error && <div className="bd-grid">{[0, 1, 2].map((i) => <div key={i} className="bd-card bd-skel" />)}</div>}

        {boards && boards.length === 0 && (
          <div className="bd-empty">
            <div className="bd-empty-ico">🔖</div>
            <h2>No boards yet</h2>
            <p>Create one above, then tap “Save to board” on any vendor you like.</p>
            <Link to="/vendors" className="bd-btn solid">Browse vendors</Link>
          </div>
        )}

        {boards && boards.length > 0 && (
          <div className="bd-grid">
            {boards.map((b) => (
              <div key={b._id} className="bd-card">
                <Link to={`/boards/${b._id}`} className="bd-card-link" aria-label={`Open ${b.name}`}>
                  <div className={`bd-mosaic n${Math.min(b.thumbs.length, 3)}`}>
                    {b.thumbs.length === 0 ? <span className="bd-mosaic-emoji">{b.emoji}</span> : b.thumbs.map((t, i) => <img key={i} src={t} alt="" loading="lazy" />)}
                  </div>
                  <div className="bd-card-body">
                    <h3><span aria-hidden="true">{b.emoji}</span> {b.name}</h3>
                    <p>{b.count} vendor{b.count !== 1 ? "s" : ""}{b.shared ? " · Shared" : ""}{b.votes ? ` · ${b.votes} vote${b.votes !== 1 ? "s" : ""}` : ""}</p>
                  </div>
                </Link>
                {confirmDel === b._id ? (
                  <div className="bd-del-row">
                    <span>Delete this board?</span>
                    <button className="bd-link" onClick={() => setConfirmDel(null)}>Keep</button>
                    <button className="bd-link danger" onClick={() => remove(b)}>Delete</button>
                  </div>
                ) : (
                  <button className="bd-del" onClick={() => setConfirmDel(b._id)} aria-label={`Delete ${b.name}`}>Delete</button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = `
  .bd-root { font-family:'DM Sans',sans-serif; background:var(--cream); min-height:100vh; color:var(--ink); }
  .bd-shell { max-width:1100px; margin:0 auto; padding:96px 20px 60px; }
  .bd-top { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap; margin-bottom:20px; }
  .bd-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; margin:0; color:var(--ink)!important; }
  .bd-sub { margin:4px 0 0; color:var(--text2); font-size:14px; }
  .bd-btn { font:500 13.5px 'DM Sans',sans-serif; padding:10px 18px; border-radius:999px; cursor:pointer; text-decoration:none; border:1px solid var(--border); display:inline-flex; align-items:center; justify-content:center; transition:.15s; }
  .bd-btn.ghost { background:transparent; color:var(--ink); } .bd-btn.ghost:hover { border-color:#c9a84c; }
  .bd-btn.solid { background:var(--btn-bg); color:var(--btn-fg); border-color:var(--btn-bg); } .bd-btn:disabled { opacity:.5; cursor:default; }
  .bd-btn:focus-visible, .bd-emojis button:focus-visible, .bd-new input:focus-visible, .bd-link:focus-visible, .bd-del:focus-visible, .bd-card-link:focus-visible { outline:2px solid #c9a84c; outline-offset:2px; }
  .bd-new { display:flex; gap:10px; align-items:center; flex-wrap:wrap; background:var(--white); border:1px solid var(--border); border-radius:18px; padding:14px 16px; margin-bottom:22px; }
  .bd-emojis { display:flex; gap:6px; }
  .bd-emojis button { width:36px; height:36px; border-radius:10px; border:1px solid var(--border); background:transparent; font-size:17px; cursor:pointer; }
  .bd-emojis button.on { border-color:#c9a84c; background:var(--gold-tint); }
  .bd-new input { flex:1; min-width:200px; padding:11px 16px; border-radius:999px; border:1px solid var(--border); background:var(--surface,var(--cream)); color:var(--ink); font:14px 'DM Sans',sans-serif; }
  .bd-error { color:#d97b7b; font-size:14px; }
  .bd-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  .bd-card { position:relative; background:var(--white); border:1px solid var(--border); border-radius:18px; overflow:hidden; transition:border-color .15s, transform .15s; }
  .bd-card:hover { border-color:#c9a84c; transform:translateY(-2px); }
  .bd-skel { height:230px; background:linear-gradient(90deg,var(--track) 25%,var(--surface,var(--cream)) 50%,var(--track) 75%); background-size:200% 100%; animation:shimmer 1.5s ease infinite; }
  .bd-card-link { display:block; text-decoration:none; color:inherit; }
  .bd-mosaic { height:150px; display:grid; gap:2px; background:var(--surface,var(--cream)); }
  .bd-mosaic.n0 { place-items:center; } .bd-mosaic-emoji { font-size:44px; }
  .bd-mosaic.n1 { grid-template-columns:1fr; } .bd-mosaic.n2 { grid-template-columns:1fr 1fr; }
  .bd-mosaic.n3 { grid-template-columns:2fr 1fr; grid-template-rows:1fr 1fr; } .bd-mosaic.n3 img:first-child { grid-row:span 2; }
  .bd-mosaic img { width:100%; height:100%; object-fit:cover; display:block; }
  .bd-card-body { padding:14px 16px 8px; }
  .bd-card-body h3 { font-family:'Cormorant Garamond',serif; font-size:1.25rem; font-weight:600; margin:0 0 2px; color:var(--ink)!important; }
  .bd-card-body p { margin:0; font-size:13px; color:var(--muted); }
  .bd-del { background:none; border:none; color:var(--muted); font:12.5px 'DM Sans',sans-serif; padding:6px 16px 14px; cursor:pointer; text-decoration:underline; text-underline-offset:3px; }
  .bd-del-row { display:flex; gap:12px; align-items:center; padding:6px 16px 14px; font-size:13px; }
  .bd-link { background:none; border:none; color:var(--c-goldtext); font:500 13px 'DM Sans',sans-serif; cursor:pointer; padding:0; text-decoration:underline; text-underline-offset:3px; } .bd-link.danger { color:#d97b7b; }
  .bd-empty { text-align:center; background:var(--white); border:1px solid var(--border); border-radius:18px; padding:48px 20px; }
  .bd-empty-ico { font-size:40px; } .bd-empty h2 { font-family:'Cormorant Garamond',serif; margin:8px 0 6px; color:var(--ink)!important; } .bd-empty p { color:var(--text2); margin:0 0 18px; }
  @media (max-width:900px) { .bd-grid { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:560px) { .bd-grid { grid-template-columns:1fr; } .bd-shell { padding:84px 16px 48px; } .bd-new { padding:12px; } }
`;