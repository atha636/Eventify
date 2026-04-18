import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const strategies = [
  {
    num: "01",
    title: "Research Your Market",
    content: `Before setting any price, spend an hour browsing competitors in your category and city on Evencers. Note their package names, price points, and inclusions. You're not setting a price in a vacuum — you're setting a price relative to alternatives your client will also consider. Price too low and you signal poor quality; too high without justification and you lose the click.`,
  },
  {
    num: "02",
    title: "The Three-Tier Package Structure",
    content: `The most effective approach is three packages: a lean entry package (to capture budget-conscious clients), a mid-tier package (your most profitable, designed to be the obvious choice), and a premium package (which makes the mid-tier feel like value by comparison). Most bookings will land on the mid-tier. Price your packages so the jump from entry to mid feels small, but the jump from mid to premium feels justified.`,
  },
  {
    num: "03",
    title: "Calculate Your True Costs",
    content: `Your price must cover: time spent on the event, travel, equipment or material costs, editing or post-production time, communication time, admin, and a healthy profit margin. Many vendors underprice because they only count the hours at the event — not the hours before and after. Factor in everything. A useful rule: multiply your direct hourly cost by 3 to get a sustainable client-facing rate.`,
  },
  {
    num: "04",
    title: "Anchor Pricing Effectively",
    content: `List your highest-value package first. This is called price anchoring — it sets a reference point that makes everything below it feel more affordable. When clients scan packages from top to bottom, the first number they see shapes how they interpret every subsequent number. A ₹60,000 premium package makes a ₹35,000 standard package feel like a deal.`,
  },
  {
    num: "05",
    title: "When to Raise Your Prices",
    content: `If you're booking more than 80% of the clients who enquire, your prices are too low — increase by 10–20% and test. If you're consistently booked 3+ months in advance, raise prices. If you've added new skills, equipment, or experience, raise prices. Vendors who haven't adjusted pricing in 12+ months are almost certainly undercharging. Your reputation is worth more than yesterday's rate.`,
  },
  {
    num: "06",
    title: "Seasonal Pricing",
    content: `Events cluster around certain seasons — wedding season, festival periods, year-end corporate events. Consider surge pricing for peak periods (typically October–February in India) and introductory pricing during off-peak months to attract new clients and reviews. Being explicit about seasonal rates in your listing builds trust rather than surprise.`,
  },
];

export default function PricingStrategy() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="ps-root">
        <Navbar />

        <div className="ps-hero">
          <div className="ps-hero-bg">
            <div className="ps-orb ps-orb1" />
            <div className="ps-orb ps-orb2" />
          </div>
          <div className="ps-hero-inner">
            <button className="ps-back" onClick={() => navigate(-1)}>← Back</button>
            <span className="ps-eyebrow">✦ Vendor Resources</span>
            <div className="ps-icon-wrap">💡</div>
            <h1 className="ps-title">Pricing Strategy</h1>
            <p className="ps-subtitle">
              How to price your packages competitively, sustainably, and confidently.
            </p>
            <div className="ps-meta">
              <span>6 strategies</span>
              <span className="ps-dot">·</span>
              <span>~9 min read</span>
              <span className="ps-dot">·</span>
              <span>Last updated April 2025</span>
            </div>
          </div>
        </div>

        <div className="ps-body">

          <div className="ps-callout">
            <span className="ps-callout-icon">💬</span>
            <p>
              <strong>The most common vendor mistake:</strong> undercharging out of fear, not strategy.
              Clients associate price with quality. Being the cheapest option is rarely a competitive advantage — being the best value is.
            </p>
          </div>

          <div className="ps-steps">
            {strategies.map((s, i) => (
              <div key={i} className="ps-step">
                <div className="ps-step-left">
                  <span className="ps-step-num">{s.num}</span>
                  <div className="ps-step-line" />
                </div>
                <div className="ps-step-right">
                  <h3 className="ps-step-title">{s.title}</h3>
                  <p className="ps-step-text">{s.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="ps-example">
            <p className="ps-example-label">✦ Example Package Structure</p>
            <div className="ps-packages">
              {[
                { name: "Essential", price: "₹15,000", tag: "", items: ["4 hours coverage", "100 edited photos", "Online gallery", "1 photographer"] },
                { name: "Standard", price: "₹28,000", tag: "Most Popular", items: ["8 hours coverage", "300 edited photos", "Online gallery + USB", "2 photographers", "Highlight reel"] },
                { name: "Premium", price: "₹55,000", tag: "", items: ["Full day coverage", "500+ edited photos", "Cinematic video", "3-person team", "Album + prints", "Priority delivery"] },
              ].map((pkg, i) => (
                <div key={i} className={`ps-pkg ${pkg.tag ? "ps-pkg-featured" : ""}`}>
                  {pkg.tag && <span className="ps-pkg-tag">{pkg.tag}</span>}
                  <p className="ps-pkg-name">{pkg.name}</p>
                  <p className="ps-pkg-price">{pkg.price}</p>
                  <ul className="ps-pkg-list">
                    {pkg.items.map((item, j) => (
                      <li key={j}><span>✓</span> {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c;
    --gold-light: #e8d5a3; --muted: #7a7265;
    --border: rgba(201,168,76,0.2); --surface: #faf7f2; --white: #ffffff;
  }
  .ps-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }

  .ps-hero { position: relative; background: var(--ink); overflow: hidden; padding: 80px 32px 64px; text-align: center; }
  .ps-hero-bg { position: absolute; inset: 0; pointer-events: none; }
  .ps-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; }
  .ps-orb1 { width: 400px; height: 400px; background: var(--gold); top: -80px; right: -80px; }
  .ps-orb2 { width: 300px; height: 300px; background: #5ea77b; bottom: -60px; left: -60px; }
  .ps-hero-inner { position: relative; z-index: 2; max-width: 640px; margin: 0 auto; }
  .ps-back { background: none; border: 1px solid rgba(201,168,76,0.25); color: var(--gold-light); font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 6px 14px; border-radius: 20px; cursor: pointer; margin-bottom: 24px; transition: all 0.2s; display: inline-block; }
  .ps-back:hover { background: rgba(201,168,76,0.1); }
  .ps-eyebrow { display: block; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; }
  .ps-icon-wrap { font-size: 3rem; margin-bottom: 16px; display: block; }
  .ps-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.2rem, 5vw, 3.2rem); font-weight: 300; color: var(--white); margin-bottom: 16px; }
  .ps-subtitle { font-size: 15px; color: rgba(245,240,232,0.6); line-height: 1.7; margin-bottom: 20px; }
  .ps-meta { display: flex; gap: 8px; align-items: center; justify-content: center; font-size: 12px; color: var(--muted); }
  .ps-dot { color: rgba(201,168,76,0.4); }

  .ps-body { max-width: 860px; margin: 0 auto; padding: 60px 32px; }

  .ps-callout { background: rgba(201,168,76,0.07); border: 1px solid var(--border); border-left: 3px solid var(--gold); border-radius: 10px; padding: 20px 24px; margin-bottom: 48px; display: flex; gap: 14px; align-items: flex-start; font-size: 14px; color: var(--muted); line-height: 1.7; }
  .ps-callout-icon { font-size: 1.4rem; flex-shrink: 0; }
  .ps-callout strong { color: var(--ink); }

  .ps-steps { display: flex; flex-direction: column; gap: 0; margin-bottom: 60px; }
  .ps-step { display: flex; gap: 28px; }
  .ps-step-left { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
  .ps-step-num { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; color: var(--gold); font-weight: 600; line-height: 1; padding: 8px 0; }
  .ps-step-line { width: 1px; flex: 1; background: var(--border); margin: 4px 0; min-height: 20px; }
  .ps-step:last-child .ps-step-line { display: none; }
  .ps-step-right { padding-bottom: 36px; }
  .ps-step-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
  .ps-step-text { font-size: 14px; color: var(--muted); line-height: 1.8; }

  .ps-example { background: var(--white); border: 1px solid var(--border); border-radius: 16px; padding: 40px 32px; }
  .ps-example-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 28px; display: block; }
  .ps-packages { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  @media (max-width: 700px) { .ps-packages { grid-template-columns: 1fr; } }
  .ps-pkg { border: 1px solid var(--border); border-radius: 12px; padding: 28px 22px; position: relative; }
  .ps-pkg-featured { background: var(--ink); border-color: var(--gold); }
  .ps-pkg-tag { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--gold); color: var(--ink); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 12px; border-radius: 20px; white-space: nowrap; }
  .ps-pkg-name { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .ps-pkg-featured .ps-pkg-name { color: rgba(245,240,232,0.5); }
  .ps-pkg-price { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: var(--ink); margin-bottom: 20px; }
  .ps-pkg-featured .ps-pkg-price { color: var(--gold); }
  .ps-pkg-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .ps-pkg-list li { display: flex; gap: 8px; font-size: 13px; color: var(--muted); }
  .ps-pkg-featured .ps-pkg-list li { color: var(--gold-light); }
  .ps-pkg-list li span { color: var(--gold); flex-shrink: 0; }
`;