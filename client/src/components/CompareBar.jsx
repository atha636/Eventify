import { useNavigate } from "react-router-dom";
import { useCompare, MAX_COMPARE } from "../utils/compare";

// Floating shortlist bar on the Vendors page. `names` maps vendor id → title for the chips.
export default function CompareBar({ names = {} }) {
  const { ids, remove, clear } = useCompare();
  const navigate = useNavigate();
  if (ids.length === 0) return null;

  return (
    <div className="cb-bar" role="region" aria-label="Vendors selected for comparison">
      <div className="cb-chips">
        {ids.map((id) => (
          <span key={id} className="cb-chip">
            <span className="cb-chip-name">{names[id] || "Vendor"}</span>
            <button type="button" onClick={() => remove(id)} aria-label={`Remove ${names[id] || "vendor"} from comparison`}>✕</button>
          </span>
        ))}
        <span className="cb-count">{ids.length}/{MAX_COMPARE}</span>
      </div>
      <div className="cb-actions">
        <button type="button" className="cb-clear" onClick={clear}>Clear</button>
        <button type="button" className="cb-go" disabled={ids.length < 2} onClick={() => navigate("/compare")}
          title={ids.length < 2 ? "Pick at least 2 vendors" : ""}>
          {ids.length < 2 ? "Pick 1 more to compare" : `Compare ${ids.length} vendors →`}
        </button>
      </div>
      <style>{`
        .cb-bar { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 7000; width: min(720px, calc(100vw - 24px));
          display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; box-sizing: border-box;
          background: var(--ink-surface); color: var(--on-dark); border: 1px solid rgba(201,168,76,.5); border-radius: 16px;
          box-shadow: 0 14px 40px rgba(0,0,0,.4); font-family: 'DM Sans', sans-serif; animation: cbIn .22s ease both; }
        @keyframes cbIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .cb-chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; }
        .cb-chip { display: inline-flex; align-items: center; gap: 4px; max-width: 170px; background: rgba(255,255,255,.08); border: 1px solid rgba(201,168,76,.3); border-radius: 14px; padding: 4px 6px 4px 11px; font-size: 12px; }
        .cb-chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cb-chip button { background: none; border: none; color: inherit; opacity: .7; cursor: pointer; font-size: 11px; width: 20px; height: 20px; border-radius: 50%; }
        .cb-chip button:hover { opacity: 1; background: rgba(255,255,255,.12); }
        .cb-count { font-size: 11.5px; color: #c9a84c; margin-left: 2px; }
        .cb-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .cb-clear { background: none; border: none; color: inherit; opacity: .75; cursor: pointer; font: 12.5px 'DM Sans', sans-serif; text-decoration: underline; }
        .cb-go { font: 500 13px 'DM Sans', sans-serif; padding: 9px 18px; border-radius: 20px; border: none; cursor: pointer; background: #c9a84c; color: #0e0c0a; white-space: nowrap; }
        .cb-go:disabled { background: rgba(255,255,255,.14); color: rgba(255,255,255,.65); cursor: not-allowed; }
        .cb-go:focus-visible, .cb-clear:focus-visible, .cb-chip button:focus-visible { outline: 2px solid #c9a84c; outline-offset: 2px; }
        @media (max-width: 560px) { .cb-bar { flex-direction: column; align-items: stretch; bottom: 12px; } .cb-actions { justify-content: space-between; } .cb-go { flex: 1; } }
      `}</style>
    </div>
  );
}