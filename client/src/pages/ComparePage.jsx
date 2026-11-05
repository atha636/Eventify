import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AddToBoard from "../components/AddToBoard";
import RequestQuoteModal from "../components/RequestQuoteModal";
import API from "../services/api";
import { useCompare } from "../utils/compare";

const inr = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const ICON = { decor: "🎨", photography: "📸", catering: "🍽", music: "🎵", florals: "💐", venues: "🏛" };
const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const startPrice = (v) => {
  const prices = (v.packages || []).map((p) => p.price).filter((p) => p > 0);
  if (prices.length) return Math.min(...prices);
  return v.price > 0 ? v.price : 0;
};
const placesOf = (v) => [...new Set([...(v.locations || []), v.location].filter(Boolean))];

// one table row: sticky label + one cell per vendor (defined outside the page so open <details> don't reset on re-render)
function Row({ label, cols, children }) {
  return (
    <div className="cp-row" role="row">
      <div className="cp-label" role="rowheader">{label}</div>
      <div className="cp-cells" style={cols}>{children}</div>
    </div>
  );
}

export default function ComparePage() {
  const navigate = useNavigate();
  const { ids, remove, clear } = useCompare();
  const [vendors, setVendors] = useState({});          // id → vendor doc
  const [tried, setTried] = useState({});            // ids we already attempted to load
  const [date, setDate] = useState("");
  const [avail, setAvail] = useState(null);             // { date, ids:Set } — result for one date
  const [quoteFor, setQuoteFor] = useState(null);

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { /* ignore */ }
  const isCustomer = !!localStorage.getItem("token") && user?.role === "user";

  // load any vendor we haven't fetched yet; drop ones that no longer exist
  useEffect(() => {
    const missing = ids.filter((id) => !vendors[id] && !tried[id]);
    if (!missing.length) return;
    let alive = true;
    Promise.allSettled(missing.map((id) => API.get(`/vendors/single/${id}`).then((r) => r.data))).then((res) => {
      if (!alive) return;
      const next = {};
      res.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value?._id) next[missing[i]] = r.value;
        else if (r.reason?.response?.status === 404) remove(missing[i]);
      });
      setVendors((p) => ({ ...p, ...next }));
      setTried((p) => ({ ...p, ...Object.fromEntries(missing.map((id) => [id, true])) }));
    });
    return () => { alive = false; };
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps

  // availability for the chosen date
  useEffect(() => {
    if (!date) return;
    let alive = true;
    API.get(`/vendors/available?date=${date}`)
      .then((r) => alive && setAvail({ date, ids: new Set((Array.isArray(r.data) ? r.data : []).map((v) => String(v._id))) }))
      .catch(() => alive && setAvail({ date, ids: null }));
    return () => { alive = false; };
  }, [date]);

  const loading = ids.some((id) => !vendors[id] && !tried[id]);
  const availNow = date && avail?.date === date ? avail.ids : null;   // ignore results for an older date
  const availBusy = !!date && avail?.date !== date;
  const list = ids.map((id) => vendors[id]).filter(Boolean);

  // which column "wins" a row
  const best = useMemo(() => {
    if (list.length < 2) return {};
    const prices = list.map(startPrice).filter((p) => p > 0);
    const rated = list.filter((v) => (v.reviewCount || 0) > 0).map((v) => v.rating || 0);
    return {
      price: prices.length > 1 && Math.min(...prices) !== Math.max(...prices) ? Math.min(...prices) : null,
      rating: rated.length > 1 && Math.max(...rated) !== Math.min(...rated) ? Math.max(...rated) : null,
      packages: Math.max(...list.map((v) => (v.packages || []).length)),
    };
  }, [list]);

  const cols = { gridTemplateColumns: `repeat(${Math.max(list.length, 1)}, minmax(220px, 1fr))`, "--n": list.length };

  return (
    <div className="cp-root">
      <Navbar />
      <div className="cp-shell">
        <div className="cp-top">
          <div>
            <h1 className="cp-title">Compare vendors</h1>
            <p className="cp-sub">Packages, price, rating, locations and availability side by side.</p>
          </div>
          <div className="cp-top-actions">
            <Link to="/vendors" className="cp-btn ghost">← Back to vendors</Link>
            {ids.length > 0 && <button className="cp-btn ghost" onClick={clear}>Clear all</button>}
          </div>
        </div>

        {ids.length < 2 && !loading && (
          <div className="cp-empty">
            <h2>Pick at least two vendors</h2>
            <p>Tick “Compare” on 2 or 3 vendor cards on the Vendors page, then come back here.</p>
            <button className="cp-btn solid" onClick={() => navigate("/vendors")}>Browse vendors</button>
          </div>
        )}

        {loading && ids.length > 0 && <div className="cp-state">Loading vendors…</div>}

        {list.length >= 2 && (
          <>
            <div className="cp-datebar">
              <label htmlFor="cp-date">Check availability on</label>
              <input id="cp-date" type="date" value={date} min={todayStr()} onChange={(e) => setDate(e.target.value)} />
              {date && <button className="cp-link" onClick={() => setDate("")}>Clear date</button>}
              {availBusy && <span className="cp-muted">Checking…</span>}
            </div>

            <div className="cp-table" role="table" aria-label="Vendor comparison">
              {/* header */}
              <div className="cp-row cp-headrow" role="row">
                <div className="cp-label" />
                <div className="cp-cells" style={cols}>
                  {list.map((v) => (
                    <div key={v._id} className="cp-cell cp-head" role="columnheader">
                      <button className="cp-x" onClick={() => remove(v._id)} aria-label={`Remove ${v.title}`}>✕</button>
                      <div className="cp-img">
                        {v.images?.[0] ? <img src={v.images[0]} alt={v.title} loading="lazy" /> : <span>{ICON[v.serviceType] || "✦"}</span>}
                      </div>
                      <Link to={`/vendor/${v._id}`} className="cp-name">{v.title}</Link>
                      <span className="cp-by">{v.vendorId?.name || v.vendorName || ""}{v.vendorId?.isVendorVerified && <b className="cp-verified" title="Verified vendor"> ✓ Verified</b>}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Row cols={cols} label="Category">
                {list.map((v) => <div key={v._id} className="cp-cell" style={{ textTransform: "capitalize" }}>{v.serviceType || "—"}</div>)}
              </Row>

              <Row cols={cols} label="Starting price">
                {list.map((v) => {
                  const p = startPrice(v);
                  return (
                    <div key={v._id} className={`cp-cell ${best.price && p === best.price ? "win" : ""}`}>
                      <strong className="cp-big">{p ? inr(p) : "On request"}</strong>
                      {best.price && p === best.price && <span className="cp-tag">Lowest price</span>}
                    </div>
                  );
                })}
              </Row>

              <Row cols={cols} label="Rating">
                {list.map((v) => (
                  <div key={v._id} className={`cp-cell ${best.rating && (v.rating || 0) === best.rating && v.reviewCount ? "win" : ""}`}>
                    {v.reviewCount > 0
                      ? <><strong className="cp-big">★ {Number(v.rating).toFixed(1)}</strong><span className="cp-muted"> ({v.reviewCount} review{v.reviewCount > 1 ? "s" : ""})</span></>
                      : <span className="cp-muted">No reviews yet</span>}
                    {best.rating && (v.rating || 0) === best.rating && v.reviewCount > 0 && <span className="cp-tag">Top rated</span>}
                  </div>
                ))}
              </Row>

              <Row cols={cols} label="Locations">
                {list.map((v) => {
                  const p = placesOf(v);
                  return <div key={v._id} className="cp-cell">{p.length ? p.join(", ") : "—"}</div>;
                })}
              </Row>

              <Row cols={cols} label={date ? `Available on ${new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "Availability"}>
                {list.map((v) => {
                  let text = "Pick a date above", cls = "";
                  if (date && availNow) { const ok = availNow.has(String(v._id)); text = ok ? "✓ Available" : "✕ Not available"; cls = ok ? "yes" : "no"; }
                  else if (date) text = "Checking…";
                  return <div key={v._id} className={`cp-cell cp-avail ${cls}`}>{text}</div>;
                })}
              </Row>

              <Row cols={cols} label="Packages">
                {list.map((v) => (
                  <div key={v._id} className="cp-cell cp-pkgs">
                    {(v.packages || []).length === 0 && <span className="cp-muted">{v.serviceType === "decor" ? "Fixed-price decor service" : "No packages listed"}</span>}
                    {(v.packages || []).map((p, i) => (
                      <details key={i} className="cp-pkg">
                        <summary><span>{p.name}</span><strong>{inr(p.price)}</strong></summary>
                        {(p.features || []).filter(Boolean).length > 0
                          ? <ul>{p.features.filter(Boolean).map((f, k) => <li key={k}>{f}</li>)}</ul>
                          : <p className="cp-muted">No details listed.</p>}
                      </details>
                    ))}
                  </div>
                ))}
              </Row>

              {list.some((v) => v.timeSlots?.length) && (
                <Row cols={cols} label="Time slots">
                  {list.map((v) => <div key={v._id} className="cp-cell">{v.timeSlots?.length ? v.timeSlots.join(" · ") : "—"}</div>)}
                </Row>
              )}

              <Row cols={cols} label="">
                {list.map((v) => (
                  <div key={v._id} className="cp-cell cp-cta">
                    <Link to={`/vendor/${v._id}`} className="cp-btn solid">View &amp; book</Link>
                    {isCustomer && <button className="cp-btn ghost" onClick={() => setQuoteFor(v)}>Request quote</button>}
                    {isCustomer && <AddToBoard serviceId={v._id} label="Save to board" compact />}
                  </div>
                ))}
              </Row>
            </div>
          </>
        )}
      </div>

      {quoteFor && (
        <RequestQuoteModal service={quoteFor} onClose={() => setQuoteFor(null)}
          onDone={(cid) => { setQuoteFor(null); navigate(`/messages?c=${cid}`); }} />
      )}
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .cp-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }
  .cp-shell { max-width: 1180px; margin: 0 auto; padding: 96px 20px 60px; }
  .cp-top { display: flex; justify-content: space-between; align-items: flex-end; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
  .cp-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; margin: 0; color: var(--ink) !important; }
  .cp-sub { margin: 4px 0 0; font-size: 13px; color: var(--muted); }
  .cp-top-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .cp-btn { font: 500 12.5px 'DM Sans', sans-serif; padding: 9px 18px; border-radius: 20px; cursor: pointer; border: 1px solid transparent; text-decoration: none; display: inline-block; text-align: center; transition: background .15s, border-color .15s; }
  .cp-btn.solid { background: var(--btn-bg); color: var(--btn-fg); }
  .cp-btn.solid:hover { background: #c9a84c; color: var(--on-gold); }
  .cp-btn.ghost { background: transparent; color: var(--ink); border-color: var(--border); }
  .cp-btn.ghost:hover { border-color: #c9a84c; }
  .cp-btn:focus-visible, .cp-link:focus-visible, .cp-x:focus-visible, .cp-name:focus-visible { outline: 2px solid #c9a84c; outline-offset: 2px; }
  .cp-state { text-align: center; color: var(--muted); padding: 40px 0; font-size: 13.5px; }
  .cp-empty { background: var(--white); border: 1px solid rgba(201,168,76,.22); border-radius: 16px; padding: 44px 24px; text-align: center; max-width: 520px; margin: 24px auto; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .cp-empty h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; margin: 0; color: var(--ink) !important; }
  .cp-empty p { margin: 0 0 6px; color: var(--muted); font-size: 13.5px; line-height: 1.6; }
  .cp-datebar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; font-size: 13px; }
  .cp-datebar input { font: 13px 'DM Sans', sans-serif; color: var(--ink); background: var(--white); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; }
  .cp-datebar input:focus { outline: none; border-color: #c9a84c; }
  .cp-link { background: none; border: none; color: var(--c-goldtext); text-decoration: underline; cursor: pointer; font: inherit; padding: 0; }
  .cp-muted { color: var(--muted); font-size: 12px; }

  .cp-table { background: var(--white); border: 1px solid rgba(201,168,76,.22); border-radius: 14px; overflow-x: auto; }
  .cp-row { display: grid; grid-template-columns: 140px 1fr; border-top: 1px solid var(--line); min-width: max-content; width: 100%; box-sizing: border-box; }
  .cp-headrow { border-top: none; }
  .cp-label { position: sticky; left: 0; z-index: 2; background: var(--white); padding: 14px 14px; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--c-goldtext); display: flex; align-items: flex-start; }
  .cp-cells { display: grid; }
  .cp-cell { padding: 14px 16px; font-size: 13.5px; line-height: 1.5; border-left: 1px solid var(--line); min-width: 0; overflow-wrap: anywhere; }
  .cp-cell.win { background: var(--gold-tint); }
  .cp-big { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 700; }
  .cp-tag { display: inline-block; margin-left: 8px; font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: var(--c-green); color: var(--white); vertical-align: middle; }
  .cp-head { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
  .cp-x { position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--border); background: var(--white); color: var(--muted); cursor: pointer; font-size: 11px; z-index: 1; }
  .cp-x:hover { color: var(--c-red); border-color: var(--c-red); }
  .cp-img { width: 100%; aspect-ratio: 16 / 10; border-radius: 10px; overflow: hidden; background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 34px; }
  .cp-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cp-name { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 700; color: var(--ink); text-decoration: none; line-height: 1.2; }
  .cp-name:hover { color: var(--c-goldtext); }
  .cp-by { font-size: 12px; color: var(--muted); }
  .cp-verified { color: var(--c-green); font-weight: 600; }
  .cp-avail.yes { color: var(--c-green); font-weight: 600; background: var(--success-bg, transparent); }
  .cp-avail.no { color: var(--c-red); font-weight: 600; }
  .cp-pkgs { display: flex; flex-direction: column; gap: 6px; }
  .cp-pkg { border: 1px solid var(--border); border-radius: 8px; background: var(--cream); }
  .cp-pkg summary { cursor: pointer; display: flex; justify-content: space-between; gap: 10px; padding: 8px 10px; font-size: 13px; list-style: none; }
  .cp-pkg summary::-webkit-details-marker { display: none; }
  .cp-pkg summary::after { content: "＋"; color: var(--muted); font-size: 12px; }
  .cp-pkg[open] summary::after { content: "－"; }
  .cp-pkg summary span { flex: 1; }
  .cp-pkg ul { margin: 0; padding: 0 12px 10px 28px; font-size: 12.5px; color: var(--text2); }
  .cp-pkg p { margin: 0; padding: 0 10px 10px; }
  .cp-cta { display: flex; flex-direction: column; gap: 8px; }
  @media (max-width: 700px) { .cp-shell { padding: 84px 14px 48px; } .cp-row { grid-template-columns: 96px 1fr; } .cp-label { padding: 12px 8px; font-size: 10px; } .cp-cells { grid-template-columns: repeat(var(--n, 2), 78vw) !important; } }
`;