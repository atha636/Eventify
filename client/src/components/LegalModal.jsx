import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LEGAL_DOCS } from "../data/legalDocs";

// The popup itself. Rendered in a portal so it always sits above whatever page or modal opened it.
export function LegalModal({ doc, onClose }) {
  const data = LEGAL_DOCS[doc];
  const closeRef = useRef(null);

  useEffect(() => {
    const prevFocus = document.activeElement;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onClose]);

  if (!data) return null;
  return createPortal(
    <div className="lgl-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true" aria-labelledby="lgl-title">
      <div className="lgl-modal">
        <header className="lgl-head">
          <span className="lgl-icon" aria-hidden="true">{data.icon}</span>
          <div>
            <h2 id="lgl-title" className="lgl-title">{data.title}</h2>
            {data.updated && <p className="lgl-sub">{data.updated}</p>}
          </div>
          <button type="button" className="lgl-x" ref={closeRef} onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="lgl-body">
          {data.sections.map((s, i) => (
            <section key={s.title} className="lgl-sec">
              <h3>{i + 1}. {s.title}</h3>
              <p>{s.text}</p>
            </section>
          ))}
        </div>
        <footer className="lgl-foot">
          <button type="button" className="lgl-done" onClick={onClose}>Got it</button>
        </footer>
      </div>
      <style>{styles}</style>
    </div>,
    document.body
  );
}

// A link-looking button that opens one document. Drop it anywhere a policy is mentioned:
//   <LegalLink doc="vendorTerms" className="as-link">Vendor Terms</LegalLink>
export default function LegalLink({ doc, className = "", style, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`lgl-link ${className}`} style={style} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && <LegalModal doc={doc} onClose={() => setOpen(false)} />}
    </>
  );
}

const styles = `
  .lgl-overlay { position: fixed; inset: 0; z-index: 20000; background: rgba(8,6,4,.66); display: flex; align-items: center; justify-content: center; padding: 16px; animation: lglFade .18s ease both; }
  @keyframes lglFade { from { opacity: 0; } to { opacity: 1; } }
  .lgl-modal { width: 100%; max-width: 620px; max-height: min(86vh, 720px); display: flex; flex-direction: column; overflow: hidden;
    background: var(--white, #fff); color: var(--ink, #0e0c0a); border: 1px solid rgba(201,168,76,.35); border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0,0,0,.4); font-family: 'DM Sans', sans-serif; animation: lglIn .22s ease both; }
  @keyframes lglIn { from { opacity: 0; transform: translateY(12px) scale(.985); } to { opacity: 1; transform: none; } }
  .lgl-head { display: flex; align-items: center; gap: 14px; padding: 18px 20px; border-bottom: 1px solid var(--border, #e5e4e7); }
  .lgl-icon { font-size: 26px; flex-shrink: 0; }
  .lgl-head > div { flex: 1; min-width: 0; }
  .lgl-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--ink, #0e0c0a) !important; }
  .lgl-sub { margin: 2px 0 0; font-size: 12px; color: var(--muted, #6b6375); }
  .lgl-x { background: none; border: none; font-size: 16px; color: var(--muted, #6b6375); cursor: pointer; width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; }
  .lgl-x:hover { background: var(--surface, #f4f3ec); color: var(--ink, #0e0c0a); }
  .lgl-body { padding: 8px 20px 12px; overflow-y: auto; }
  .lgl-sec { padding: 12px 0; border-bottom: 1px solid var(--line, #ede8e0); }
  .lgl-sec:last-child { border-bottom: none; }
  .lgl-sec h3 { margin: 0 0 4px; font-size: 13.5px; font-weight: 600; color: var(--ink, #0e0c0a); }
  .lgl-sec p { margin: 0; font-size: 13px; line-height: 1.65; color: var(--text2, #5a5249); }
  .lgl-foot { padding: 12px 20px; border-top: 1px solid var(--border, #e5e4e7); display: flex; justify-content: flex-end; }
  .lgl-done { font: 500 13px 'DM Sans', sans-serif; padding: 9px 24px; border-radius: 22px; border: none; cursor: pointer; background: var(--btn-bg, #0e0c0a); color: var(--btn-fg, #fff); }
  .lgl-done:hover { background: #c9a84c; color: var(--on-gold, #0e0c0a); }
  .lgl-x:focus-visible, .lgl-done:focus-visible, .lgl-link:focus-visible { outline: 2px solid #c9a84c; outline-offset: 2px; }
  @media (max-width: 520px) { .lgl-overlay { align-items: flex-end; padding: 0; } .lgl-modal { max-width: 100%; max-height: 90vh; border-radius: 16px 16px 0 0; } }
`;

// reset so a <button> looks like the text link it replaces (page CSS still sets colour / weight)
if (typeof document !== "undefined" && !document.getElementById("lgl-link-reset")) {
  const el = document.createElement("style");
  el.id = "lgl-link-reset";
  el.textContent = `.lgl-link { background: none; border: none; padding: 0; margin: 0; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(201,168,76,.45); } .lgl-link:hover { text-decoration-color: currentColor; }`;
  document.head.appendChild(el);
}