import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getVendorAnalytics } from "../services/analyticsService";

// ── Formatting helpers ──────────────────────────────────────────────
const inr = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

// Compact Indian-style numbers for chart axes: 1.2k · 3.4L · 1.1Cr
function compact(n) {
  const v = Math.abs(n);
  const trim = (x) => String(Math.round(x * 10) / 10).replace(/\.0$/, "");
  if (v >= 1e7) return `₹${trim(n / 1e7)}Cr`;
  if (v >= 1e5) return `₹${trim(n / 1e5)}L`;
  if (v >= 1e3) return `₹${trim(n / 1e3)}k`;
  return `₹${Math.round(n)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function bucketLabel(key, granularity) {
  if (granularity === "day") {
    const [, m, d] = key.split("-");
    return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
  }
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} '${y.slice(2)}`;
}

function niceMax(v) {
  if (v <= 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10;
  return step * pow;
}

const RANGES = [
  { id: "30",  label: "30 days" },
  { id: "90",  label: "3 months" },
  { id: "180", label: "6 months" },
  { id: "365", label: "1 year" },
  { id: "all", label: "All time" },
];

// ── Bar chart (hand-rolled SVG — no chart library needed) ───────────
// items: [{ key, segments: [{ value, color, label }] }]
function BarChart({ items, granularity, formatValue, axisFormat, emptyText }) {
  const [hover, setHover] = useState(null);

  const W = 640, H = 230;
  const pad = { l: 52, r: 10, t: 14, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const totals = items.map((it) => it.segments.reduce((t, s) => t + s.value, 0));
  const max = niceMax(Math.max(0, ...totals));
  const hasData = totals.some((t) => t > 0);

  const n = items.length || 1;
  const slot = iw / n;
  const barW = Math.min(slot * 0.62, 38);
  const labelStep = Math.ceil(n / 8);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  if (!hasData) return <div className="va-chart-empty">{emptyText}</div>;

  const hv = hover !== null ? items[hover] : null;

  return (
    <div className="va-chart-wrap">
      <div className="va-chart-hover">
        {hv ? (
          <>
            <strong>{bucketLabel(hv.key, granularity)}</strong>
            {hv.segments.map((s) => (
              <span key={s.label}>
                <i style={{ background: s.color }} />
                {s.label}: {formatValue(s.value)}
              </span>
            ))}
          </>
        ) : (
          <span className="va-chart-hint">Hover a bar for details</span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="va-svg" role="img" aria-label="Chart">
        {ticks.map((t) => {
          const y = pad.t + ih - t * ih;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} className="va-grid" />
              <text x={pad.l - 8} y={y + 3.5} textAnchor="end" className="va-axis">
                {axisFormat(max * t)}
              </text>
            </g>
          );
        })}

        {items.map((it, i) => {
          const x = pad.l + i * slot + (slot - barW) / 2;
          let yCursor = pad.t + ih;
          return (
            <g
              key={it.key}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onTouchStart={() => setHover(i)}
            >
              <rect
                x={pad.l + i * slot}
                y={pad.t}
                width={slot}
                height={ih}
                fill="transparent"
              />
              {it.segments.map((s) => {
                const h = (s.value / max) * ih;
                yCursor -= h;
                return h > 0 ? (
                  <rect
                    key={s.label}
                    x={x}
                    y={yCursor}
                    width={barW}
                    height={h}
                    rx={barW > 8 ? 3 : 1}
                    fill={s.color}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                ) : null;
              })}
              {i % labelStep === 0 && (
                <text x={x + barW / 2} y={H - 10} textAnchor="middle" className="va-axis">
                  {bucketLabel(it.key, granularity)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Delta({ value }) {
  if (value === null || value === undefined) return null;
  if (value === 0) return <span className="va-delta flat">— no change</span>;
  const up = value > 0;
  return (
    <span className={`va-delta ${up ? "up" : "down"}`}>
      {up ? "▲" : "▼"} {Math.abs(value)}% <em>vs previous period</em>
    </span>
  );
}

function Kpi({ label, value, sub, delta, accent }) {
  return (
    <div className={`va-kpi ${accent ? "va-kpi-accent" : ""}`}>
      <span className="va-kpi-label">{label}</span>
      <span className="va-kpi-value">{value}</span>
      {delta !== undefined && <Delta value={delta} />}
      {sub && <span className="va-kpi-sub">{sub}</span>}
    </div>
  );
}

export default function VendorAnalytics() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();

  const [range, setRange] = useState("180");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (user?.role !== "vendor") { navigate("/"); }
  }, [token, user?.role, navigate]);

  const load = useCallback(async (r) => {
    setLoading(true);
    setError("");
    try {
      setData(await getVendorAnalytics(r));
    } catch (err) {
      setError(typeof err === "string" ? err : "Couldn't load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token && user?.role === "vendor") load(range);
  }, [range, token, user?.role, load]);

  const s = data?.summary;
  const gran = data?.granularity || "month";

  const revenueItems = (data?.series || []).map((p) => ({
    key: p.key,
    segments: [{ label: "Collected", value: p.revenue, color: "#c9a84c" }],
  }));
  const bookingItems = (data?.series || []).map((p) => ({
    key: p.key,
    segments: [
      { label: "Approved", value: p.approved, color: "var(--ink)" },
      { label: "Other", value: Math.max(0, p.bookings - p.approved), color: "#d9cfae" },
    ],
  }));

  const sb = data?.statusBreakdown;
  const sbTotal = sb ? sb.pending + sb.approved + sb.rejected + sb.cancelled : 0;
  const STATUS = [
    { key: "approved",  label: "Approved",  color: "#2f8f5b" },
    { key: "pending",   label: "Pending",   color: "#c9a84c" },
    { key: "rejected",  label: "Rejected",  color: "var(--c-red)" },
    { key: "cancelled", label: "Cancelled", color: "var(--faint)" },
  ];

  const maxPkg = Math.max(1, ...(data?.topPackages || []).map((p) => p.bookings));
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const maxDay = Math.max(1, ...(data?.weekdays || [0]));
  const rd = data?.ratingDistribution;
  const maxRating = Math.max(1, ...(rd ? Object.values(rd) : [0]));

  return (
    <>
      <style>{styles}</style>
      <div className="va-root">
        <Navbar />
        <div className="va-shell">
          <header className="va-header">
            <div>
              <h1 className="va-title">Analytics</h1>
              <p className="va-subtitle">How your services are performing — bookings, earnings and customer feedback.</p>
            </div>
            <div className="va-ranges" role="tablist" aria-label="Date range">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  role="tab"
                  aria-selected={range === r.id}
                  className={`va-range ${range === r.id ? "active" : ""}`}
                  onClick={() => setRange(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </header>

          {error && (
            <div className="va-card va-error">
              {error} <button className="va-link-btn" onClick={() => load(range)}>Try again</button>
            </div>
          )}

          {loading && !data && <div className="va-card va-state">Loading your analytics…</div>}

          {data && data.hasServices === false && (
            <div className="va-card va-state">
              <p>You haven't listed a service yet, so there's nothing to analyse.</p>
              <Link to="/add-service" className="va-cta">Add your first service</Link>
            </div>
          )}

          {data && data.hasServices && (
            <div className={loading ? "va-dim" : ""}>
              {/* ── KPIs ── */}
              <section className="va-kpis">
                <Kpi accent label="Revenue collected" value={inr(s.revenue)} delta={s.deltas.revenue} />
                <Kpi label="Bookings received" value={s.totalBookings} delta={s.deltas.bookings} sub={`${s.approved} approved`} />
                <Kpi
                  label="Approval rate"
                  value={s.approvalRate === null ? "—" : `${s.approvalRate}%`}
                  sub="approved ÷ (approved + rejected)"
                />
                <Kpi label="Still to collect" value={inr(s.outstanding)} sub="from approved bookings" />
                <Kpi label="Avg. booking value" value={inr(s.avgBookingValue)} sub="approved bookings" />
                <Kpi
                  label="Average rating"
                  value={s.avgRating === null ? "—" : `${s.avgRating} ★`}
                  sub={s.reviewCount ? `${s.reviewCount} review${s.reviewCount === 1 ? "" : "s"}${s.replyRate !== null ? ` · ${s.replyRate}% replied` : ""}` : "No reviews yet"}
                />
              </section>

              {/* ── Charts ── */}
              <section className="va-grid-2">
                <div className="va-card">
                  <h2 className="va-card-title">Revenue collected</h2>
                  <p className="va-card-sub">Payments received {gran === "day" ? "per day" : "per month"}</p>
                  <BarChart
                    items={revenueItems}
                    granularity={gran}
                    formatValue={inr}
                    axisFormat={compact}
                    emptyText="No payments received in this period."
                  />
                </div>

                <div className="va-card">
                  <h2 className="va-card-title">Bookings</h2>
                  <p className="va-card-sub">
                    New requests {gran === "day" ? "per day" : "per month"} ·
                    <span className="va-key"><i style={{ background: "var(--btn-bg)" }} />approved</span>
                    <span className="va-key"><i style={{ background: "#d9cfae" }} />other</span>
                  </p>
                  <BarChart
                    items={bookingItems}
                    granularity={gran}
                    formatValue={(v) => String(v)}
                    axisFormat={(v) => String(Math.round(v))}
                    emptyText="No bookings in this period."
                  />
                </div>
              </section>

              {/* ── Funnel + packages ── */}
              <section className="va-grid-2">
                <div className="va-card">
                  <h2 className="va-card-title">Booking outcomes</h2>
                  <p className="va-card-sub">What happened to the requests you received</p>
                  {sbTotal === 0 ? (
                    <div className="va-chart-empty">No bookings in this period.</div>
                  ) : (
                    <>
                      <div className="va-stack" aria-hidden="true">
                        {STATUS.map((st) => sb[st.key] > 0 && (
                          <span key={st.key} style={{ width: `${(sb[st.key] / sbTotal) * 100}%`, background: st.color }} />
                        ))}
                      </div>
                      <ul className="va-legend">
                        {STATUS.map((st) => (
                          <li key={st.key}>
                            <i style={{ background: st.color }} />
                            <span>{st.label}</span>
                            <b>{sb[st.key]}</b>
                            <em>{Math.round((sb[st.key] / sbTotal) * 100)}%</em>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <div className="va-card">
                  <h2 className="va-card-title">Top packages</h2>
                  <p className="va-card-sub">Most requested in this period</p>
                  {data.topPackages.length === 0 ? (
                    <div className="va-chart-empty">No bookings in this period.</div>
                  ) : (
                    <ul className="va-bars">
                      {data.topPackages.map((p) => (
                        <li key={p.name}>
                          <div className="va-bars-head">
                            <span className="va-bars-name">{p.name}</span>
                            <span className="va-bars-meta">{p.bookings} booking{p.bookings === 1 ? "" : "s"} · {inr(p.collected)}</span>
                          </div>
                          <div className="va-bars-track"><span style={{ width: `${(p.bookings / maxPkg) * 100}%` }} /></div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* ── Services table ── */}
              <section className="va-card">
                <h2 className="va-card-title">Your services</h2>
                <p className="va-card-sub">Performance of each listing in this period</p>
                <div className="va-table-wrap">
                  <table className="va-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th className="num">Bookings</th>
                        <th className="num">Approved</th>
                        <th className="num">Collected</th>
                        <th className="num">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.services.map((sv) => (
                        <tr key={sv._id}>
                          <td>
                            <Link to={`/vendor/${sv._id}`} className="va-svc-link">{sv.title}</Link>
                            {sv.serviceType && <span className="va-svc-type">{sv.serviceType}</span>}
                          </td>
                          <td className="num">{sv.bookings}</td>
                          <td className="num">{sv.approved}</td>
                          <td className="num">{inr(sv.collected)}</td>
                          <td className="num">{sv.rating ? `${sv.rating} ★ (${sv.reviewCount})` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── Weekdays / ratings / upcoming ── */}
              <section className="va-grid-3">
                <div className="va-card">
                  <h2 className="va-card-title">Busiest event days</h2>
                  <p className="va-card-sub">Approved events by weekday</p>
                  <div className="va-cols">
                    {data.weekdays.map((c, i) => (
                      <div key={DAYS[i]} className="va-col">
                        <span className="va-col-count">{c || ""}</span>
                        <div className="va-col-track"><span style={{ height: `${(c / maxDay) * 100}%` }} /></div>
                        <span className="va-col-label">{DAYS[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="va-card">
                  <h2 className="va-card-title">Ratings</h2>
                  <p className="va-card-sub">All-time review breakdown</p>
                  {s.reviewCount === 0 ? (
                    <div className="va-chart-empty">No reviews yet.</div>
                  ) : (
                    <ul className="va-bars va-bars-tight">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <li key={star} className="va-star-row">
                          <span className="va-star-label">{star} ★</span>
                          <div className="va-bars-track"><span style={{ width: `${(rd[star] / maxRating) * 100}%` }} /></div>
                          <span className="va-star-count">{rd[star]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="va-card">
                  <h2 className="va-card-title">Upcoming events</h2>
                  <p className="va-card-sub">Next approved bookings</p>
                  {data.upcoming.length === 0 ? (
                    <div className="va-chart-empty">No upcoming events.</div>
                  ) : (
                    <ul className="va-upcoming">
                      {data.upcoming.map((u) => (
                        <li key={u._id}>
                          <div className="va-up-date">
                            <b>{new Date(u.date).toLocaleDateString("en-IN", { day: "numeric" })}</b>
                            <span>{new Date(u.date).toLocaleDateString("en-IN", { month: "short" })}</span>
                          </div>
                          <div className="va-up-main">
                            <span className="va-up-name">{u.customer}</span>
                            <span className="va-up-meta">
                              {u.packageName || "Package"} · {inr(u.totalPaid)} of {inr(u.packagePrice)} paid
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = `
  .va-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }
  .va-shell { max-width: 1100px; margin: 0 auto; padding: 96px 20px 48px; }

  .va-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
  .va-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; margin: 0; color: var(--ink) !important; }
  .va-subtitle { margin: 4px 0 0; font-size: 13px; color: var(--muted); }

  .va-ranges { display: flex; gap: 4px; background: var(--white); border: 1px solid rgba(201,168,76,0.22); border-radius: 22px; padding: 4px; flex-wrap: wrap; }
  .va-range { border: none; background: none; padding: 7px 14px; border-radius: 18px; font-family: inherit; font-size: 12.5px; color: var(--muted); cursor: pointer; transition: background 0.15s, color 0.15s; }
  .va-range:hover { color: var(--ink); }
  .va-range.active { background: var(--btn-bg); color: var(--btn-fg); }

  .va-dim { opacity: 0.55; transition: opacity 0.15s; pointer-events: none; }

  .va-card { background: var(--white); border: 1px solid rgba(201,168,76,0.2); border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; min-width: 0; }
  .va-card-title { font-family: 'Cormorant Garamond', serif; font-size: 1.35rem; font-weight: 700; margin: 0; color: var(--ink) !important; opacity: 1; }
  .va-card-sub { font-size: 12px; color: var(--muted); margin: 2px 0 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .va-key { display: inline-flex; align-items: center; gap: 5px; }
  .va-key i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
  .va-state { text-align: center; color: var(--muted); font-size: 13.5px; padding: 40px 20px; }
  .va-error { color: var(--c-red); font-size: 13px; }
  .va-link-btn { background: none; border: none; color: var(--c-goldtext); text-decoration: underline; cursor: pointer; font-family: inherit; font-size: inherit; }
  .va-cta { display: inline-block; margin-top: 8px; background: var(--btn-bg); color: var(--btn-fg); text-decoration: none; padding: 10px 20px; border-radius: 22px; font-size: 13px; font-weight: 500; }
  .va-cta:hover { background: #c9a84c; color: var(--on-gold); }

  .va-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
  .va-kpi { background: var(--white); border: 1px solid rgba(201,168,76,0.2); border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .va-kpi-accent { background: var(--ink-surface); border-color: var(--ink-surface); color: var(--on-dark); }
  html[data-theme="dark"] .va-kpi-accent { background: linear-gradient(180deg, rgba(201,168,76,0.13), rgba(201,168,76,0.05)); border-color: rgba(201,168,76,0.45); }
  .va-kpi-label { font-size: 11.5px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--faint); }
  .va-kpi-accent .va-kpi-label { color: #c9a84c; }
  .va-kpi-value { font-family: 'Cormorant Garamond', serif; font-size: 1.9rem; font-weight: 600; line-height: 1.1; }
  .va-kpi-sub { font-size: 11.5px; color: var(--muted); }
  .va-kpi-accent .va-kpi-sub { color: rgba(245,240,232,0.6); }
  .va-delta { font-size: 11.5px; font-weight: 600; }
  .va-delta em { font-weight: 400; font-style: normal; opacity: 0.7; }
  .va-delta.up { color: #2f8f5b; }
  .va-delta.down { color: var(--c-red); }
  .va-delta.flat { color: var(--faint); font-weight: 400; }
  .va-kpi-accent .va-delta.up { color: #7fd6a6; }
  .va-kpi-accent .va-delta.down { color: #f0a0a0; }

  .va-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .va-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

  .va-chart-wrap { width: 100%; }
  .va-chart-hover { min-height: 20px; display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; font-size: 12px; color: var(--ink); margin-bottom: 4px; }
  .va-chart-hover span { display: inline-flex; align-items: center; gap: 5px; }
  .va-chart-hover i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
  .va-chart-hint { color: var(--faint); }
  .va-svg { width: 100%; height: auto; display: block; }
  .va-grid { stroke: rgba(201,168,76,0.18); stroke-width: 1; }
  .va-axis { font-size: 10.5px; fill: var(--faint); font-family: 'DM Sans', sans-serif; }
  .va-chart-empty { padding: 36px 10px; text-align: center; color: var(--faint); font-size: 12.5px; }

  .va-stack { display: flex; height: 14px; border-radius: 7px; overflow: hidden; background: var(--track); margin: 6px 0 14px; }
  .va-stack span { display: block; height: 100%; }
  .va-legend { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .va-legend li { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .va-legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex-shrink: 0; }
  .va-legend span { flex: 1; color: var(--text2); }
  .va-legend em { width: 40px; text-align: right; font-style: normal; color: var(--faint); font-size: 12px; }

  .va-bars { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
  .va-bars-tight { gap: 9px; }
  .va-bars-head { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; margin-bottom: 5px; }
  .va-bars-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .va-bars-meta { color: var(--muted); font-size: 12px; flex-shrink: 0; }
  .va-bars-track { height: 8px; background: var(--track); border-radius: 4px; overflow: hidden; flex: 1; }
  .va-bars-track span { display: block; height: 100%; background: #c9a84c; border-radius: 4px; }
  .va-star-row { display: flex; align-items: center; gap: 10px; font-size: 12.5px; }
  .va-star-label { width: 28px; color: var(--text2); }
  .va-star-count { width: 22px; text-align: right; color: var(--muted); }

  .va-table-wrap { overflow-x: auto; }
  .va-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 520px; }
  .va-table th { text-align: left; font-weight: 500; font-size: 11.5px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--faint); padding: 8px 10px; border-bottom: 1px solid rgba(201,168,76,0.2); }
  .va-table td { padding: 11px 10px; border-bottom: 1px solid rgba(201,168,76,0.1); }
  .va-table tr:last-child td { border-bottom: none; }
  .va-table .num { text-align: right; white-space: nowrap; }
  .va-svc-link { color: var(--ink); font-weight: 500; text-decoration: none; }
  .va-svc-link:hover { color: var(--c-goldtext); }
  .va-svc-type { display: block; font-size: 11.5px; color: var(--faint); text-transform: capitalize; }

  .va-cols { display: flex; align-items: flex-end; justify-content: space-between; gap: 6px; height: 150px; }
  .va-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
  .va-col-count { font-size: 11px; color: var(--muted); height: 14px; }
  .va-col-track { flex: 1; width: 100%; max-width: 26px; background: var(--track); border-radius: 5px; display: flex; align-items: flex-end; overflow: hidden; }
  .va-col-track span { display: block; width: 100%; background: var(--btn-bg); border-radius: 5px; }
  .va-col-label { font-size: 11px; color: var(--faint); }

  .va-upcoming { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .va-upcoming li { display: flex; gap: 12px; align-items: center; }
  .va-up-date { width: 42px; height: 46px; border-radius: 10px; background: var(--surface); border: 1px solid rgba(201,168,76,0.25); display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
  .va-up-date b { font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; line-height: 1; }
  .va-up-date span { font-size: 10px; text-transform: uppercase; color: var(--c-goldtext); letter-spacing: 0.04em; }
  .va-up-main { display: flex; flex-direction: column; min-width: 0; }
  .va-up-name { font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .va-up-meta { font-size: 11.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  @media (max-width: 900px) {
    .va-grid-3 { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 760px) {
    .va-shell { padding: 84px 12px 32px; }
    .va-kpis { grid-template-columns: 1fr 1fr; }
    .va-grid-2, .va-grid-3 { grid-template-columns: 1fr; }
    .va-kpi-value { font-size: 1.55rem; }
  }
  @media (max-width: 420px) {
    .va-kpis { grid-template-columns: 1fr; }
  }
`;