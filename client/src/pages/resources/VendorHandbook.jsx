import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const sections = [
  {
    icon: "📋",
    title: "Getting Started",
    content: `Welcome to Evencers's vendor community. Before listing your first service, complete your profile with a professional photo, a compelling bio, and your service area. A complete profile receives 3× more inquiries than an incomplete one. Make sure your contact details are accurate — clients will reach you directly for consultations.`,
  },
  {
    icon: "🧾",
    title: "Creating Your Service Listing",
    content: `Each listing should have a clear, descriptive title (e.g. "Luxury Wedding Photography – Delhi NCR" rather than just "Photography"). Write a description that explains your unique approach, experience, and what clients can expect. Be specific about what's included. Vague listings lose bookings to more transparent competitors.`,
  },
  {
    icon: "📦",
    title: "Setting Up Packages",
    content: `Offer 2–3 tiered packages (e.g. Basic, Standard, Premium) to appeal to different budgets. Each package should clearly list what's included. Avoid pricing below market value — it signals lower quality. Your packages are your first impression; make them count. You can edit packages at any time from your dashboard.`,
  },
  {
    icon: "📸",
    title: "Photos & Portfolio",
    content: `Upload a minimum of 5 high-quality images per service. Show real work — not stock photos. Clients book what they see. Include a variety of shots: wide establishing shots, detail shots, and candid moments. Listings with 10+ images get significantly more bookings. See our Photo Guidelines for detailed specs and best practices.`,
  },
  {
    icon: "📅",
    title: "Managing Bookings",
    content: `Once a client books, you'll receive a notification. Review the request and approve or decline within 24 hours — slow response times directly impact your ranking. Keep your calendar updated. If you're unavailable for certain dates, note that clearly in your listing description. Communicate any changes immediately.`,
  },
  {
    icon: "⭐",
    title: "Reviews & Reputation",
    content: `After each completed event, clients are prompted to leave a review. Your average rating is displayed prominently on your listing. Respond professionally to all reviews — positive and negative. A polite, constructive response to a critical review can actually increase client trust. Consistently great reviews unlock a "Verified Premium" badge.`,
  },
  {
    icon: "💬",
    title: "Communication Standards",
    content: `Respond to all client messages within 4 hours during business hours. Be clear, professional, and warm. Avoid committing to anything outside the platform before booking is confirmed. Document all agreements in writing. If a dispute arises, Evencers's support team can only assist with platform-documented transactions.`,
  },
  {
    icon: "🚫",
    title: "What's Not Allowed",
    content: `Do not list services you are not qualified to deliver. Do not ask clients to pay outside the platform. Do not post misleading photos or fabricated reviews. Violations will result in suspension or permanent removal. Evencers maintains a zero-tolerance policy for misrepresentation. When in doubt, contact support before acting.`,
  },
];

export default function VendorHandbook() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="res-root">
        <Navbar />

        {/* Hero */}
        <div className="res-hero">
          <div className="res-hero-bg">
            <div className="res-orb res-orb1" />
            <div className="res-orb res-orb2" />
          </div>
          <div className="res-hero-inner">
            <button className="res-back" onClick={() => navigate(-1)}>← Back</button>
            <span className="res-eyebrow">✦ Vendor Resources</span>
            <div className="res-icon-wrap">📖</div>
            <h1 className="res-title">Vendor Handbook</h1>
            <p className="res-subtitle">
              Everything you need to know about listing, managing, and growing your business on Evencers.
            </p>
            <div className="res-meta">
              <span>8 sections</span>
              <span className="res-dot">·</span>
              <span>~10 min read</span>
              <span className="res-dot">·</span>
              <span>Last updated April 2025</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="res-body">
          <div className="res-toc">
            <p className="res-toc-label">Contents</p>
            {sections.map((s, i) => (
              <a key={i} href={`#section-${i}`} className="res-toc-link">
                <span className="res-toc-num">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </a>
            ))}
          </div>

          <div className="res-sections">
            {sections.map((s, i) => (
              <div key={i} id={`section-${i}`} className="res-section">
                <div className="res-section-icon">{s.icon}</div>
                <div className="res-section-body">
                  <h2 className="res-section-title">{s.title}</h2>
                  <p className="res-section-text">{s.content}</p>
                </div>
              </div>
            ))}

            <div className="res-cta-card">
              <p className="res-cta-label">✦ Ready to list?</p>
              <h3 className="res-cta-title">Start building your profile today.</h3>
              <button className="res-cta-btn" onClick={() => navigate("/vendor-dashboard")}>
                Go to Dashboard →
              </button>
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
  .res-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }

  .res-hero { position: relative; background: var(--ink); overflow: hidden; padding: 80px 32px 64px; text-align: center; }
  .res-hero-bg { position: absolute; inset: 0; pointer-events: none; }
  .res-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; }
  .res-orb1 { width: 400px; height: 400px; background: var(--gold); top: -100px; left: -80px; }
  .res-orb2 { width: 300px; height: 300px; background: #7b5ea7; bottom: -60px; right: -60px; }
  .res-hero-inner { position: relative; z-index: 2; max-width: 640px; margin: 0 auto; }
  .res-back { background: none; border: 1px solid rgba(201,168,76,0.25); color: var(--gold-light); font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 6px 14px; border-radius: 20px; cursor: pointer; margin-bottom: 24px; transition: all 0.2s; display: inline-block; }
  .res-back:hover { background: rgba(201,168,76,0.1); }
  .res-eyebrow { display: block; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; }
  .res-icon-wrap { font-size: 3rem; margin-bottom: 16px; display: block; }
  .res-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.2rem, 5vw, 3.2rem); font-weight: 300; color: var(--white); margin-bottom: 16px; }
  .res-subtitle { font-size: 15px; color: rgba(245,240,232,0.6); line-height: 1.7; margin-bottom: 20px; }
  .res-meta { display: flex; gap: 8px; align-items: center; justify-content: center; font-size: 12px; color: var(--muted); }
  .res-dot { color: rgba(201,168,76,0.4); }

  .res-body { max-width: 1060px; margin: 0 auto; padding: 60px 32px; display: grid; grid-template-columns: 220px 1fr; gap: 48px; align-items: start; }
  @media (max-width: 760px) { .res-body { grid-template-columns: 1fr; } .res-toc { display: none; } }

  .res-toc { position: sticky; top: 24px; background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 24px 20px; }
  .res-toc-label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; font-weight: 500; }
  .res-toc-link { display: flex; gap: 10px; align-items: baseline; font-size: 12.5px; color: var(--muted); text-decoration: none; padding: 6px 0; border-bottom: 1px solid var(--border); transition: color 0.2s; }
  .res-toc-link:last-child { border-bottom: none; }
  .res-toc-link:hover { color: var(--gold); }
  .res-toc-num { font-family: 'Cormorant Garamond', serif; font-size: 0.85rem; color: rgba(201,168,76,0.5); flex-shrink: 0; }

  .res-sections { display: flex; flex-direction: column; gap: 32px; }
  .res-section { background: var(--white); border: 1px solid var(--border); border-radius: 14px; padding: 32px 28px; display: flex; gap: 20px; transition: box-shadow 0.25s; }
  .res-section:hover { box-shadow: 0 8px 32px rgba(201,168,76,0.1); }
  .res-section-icon { font-size: 1.8rem; flex-shrink: 0; margin-top: 2px; }
  .res-section-title { font-family: 'Cormorant Garamond', serif; font-size: 1.35rem; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
  .res-section-text { font-size: 14px; color: var(--muted); line-height: 1.8; }

  .res-cta-card { background: var(--ink); border-radius: 14px; padding: 40px 32px; text-align: center; }
  .res-cta-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; display: block; }
  .res-cta-title { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 300; color: var(--white); margin-bottom: 24px; }
  .res-cta-btn { padding: 13px 28px; background: var(--gold); color: var(--ink); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.25s; }
  .res-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.35); }
`;