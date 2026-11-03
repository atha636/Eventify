import { useEffect, useState } from "react";
import ServiceCard from "./ServiceCard";
import { getRecommendations } from "../services/recommendService";

// "Recommended for you" row for the Vendors page. Customers only; hides itself when there is nothing to show.
export default function RecommendedStrip({ city = "" }) {
  const [data, setData] = useState(null);

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { /* ignore */ }
  const isCustomer = !!localStorage.getItem("token") && user?.role === "user";

  useEffect(() => {
    if (!isCustomer) return;
    let alive = true;
    getRecommendations({ city, limit: 4 })
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null));
    return () => { alive = false; };
  }, [isCustomer, city]);

  if (!isCustomer || !data?.items?.length) return null;

  return (
    <section className="rs-wrap" aria-labelledby="rs-title">
      <div className="rs-head">
        <h2 id="rs-title" className="rs-title">Recommended for you</h2>
        <p className="rs-sub">
          {data.personalised
            ? "Picked from the vendors you've saved and booked"
            : city ? `Top-rated vendors in ${city}` : "Top-rated vendors on Evencers"}
        </p>
      </div>
      <div className="rs-grid">
        {data.items.map(({ vendor, reasons }) => (
          <div key={vendor._id} className="rs-item">
            <ServiceCard vendor={vendor} />
            <ul className="rs-reasons" aria-label="Why we picked this">
              {reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <style>{`
        .rs-wrap { max-width: 1200px; margin: 0 auto 36px; padding: 0 20px; font-family: 'DM Sans', sans-serif; }
        .rs-head { margin-bottom: 14px; }
        .rs-title { font-family: 'Cormorant Garamond', serif; font-size: 1.7rem; font-weight: 600; margin: 0; color: var(--ink) !important; }
        .rs-sub { margin: 2px 0 0; font-size: 13px; color: var(--muted); }
        .rs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; align-items: start; }
        .rs-item { min-width: 0; }
        .rs-reasons { list-style: none; margin: 10px 2px 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
        .rs-reasons li { font-size: 11.5px; padding: 4px 10px; border-radius: 12px; background: var(--gold-tint); color: var(--c-goldtext); border: 1px solid var(--border); }
        @media (max-width: 600px) { .rs-wrap { padding: 0 14px; } .rs-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}