import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Logo from "../../components/Logo";
const features = [
  {
    icon: "🏠",
    title: "Dashboard Overview",
    desc: "Your command centre. See at a glance your total services, active bookings, pending requests, and recent client activity. The overview updates in real time — refresh to see the latest.",
    steps: ["Log in and click 'Vendor Dashboard' in the navbar", "The overview panel loads by default", "Pending bookings are highlighted in amber"],
  },
  {
    icon: "➕",
    title: "Adding a New Service",
    desc: "Each service listing represents one offering (e.g. 'Wedding Photography' or 'Birthday Decor'). You can have multiple services. Each gets its own page, packages, and gallery.",
    steps: ["Click 'Add New Service' on your dashboard", "Fill in service type, title, description, and location", "Upload at least 5 images (see Photo Guidelines)", "Add 2–3 packages with prices and features", "Click 'Publish' — your listing goes live immediately"],
  },
  {
    icon: "✏️",
    title: "Editing a Service",
    desc: "Update any listing at any time — change prices, add new photos, update your description, or add a package. Changes are reflected live within seconds.",
    steps: ["From your dashboard, find the service to edit", "Click the edit (pencil) icon on the service card", "Make your changes and click 'Save Changes'", "Your listing updates immediately"],
  },
  {
    icon: "🗑️",
    title: "Deleting a Service",
    desc: "Removing a service is permanent and will cancel any pending bookings for it. Active or confirmed bookings must be resolved before deletion. We recommend suspending rather than deleting if you plan to relist.",
    steps: ["Click the delete icon on the service card", "Confirm the deletion in the dialog", "Affected clients will be notified automatically"],
  },
  {
    icon: "📬",
    title: "Managing Booking Requests",
    desc: "When a client books your service, you'll receive an email notification and see the request in your dashboard. Respond within 24 hours to maintain your response rating.",
    steps: ["Navigate to 'Bookings' in your dashboard", "Review the client name, package, and date", "Click 'Approve' or 'Decline'", "The client is notified automatically"],
  },
  {
    icon: "📊",
    title: "Viewing Your Analytics",
    desc: "Track how your listings are performing: profile views, booking conversion rate, average rating, and total revenue. Use this data to improve your listings and pricing over time.",
    steps: ["Click 'Analytics' in the dashboard sidebar", "Filter by service or date range", "Look for listings with high views but low bookings — these need improvement"],
  },
  {
    icon: "👤",
    title: "Profile & Visibility Settings",
    desc: "Your public vendor profile is what clients see when they click through from search. Keep it updated with your latest information, and ensure your profile photo is professional.",
    steps: ["Click 'Profile & Visibility' in the sidebar", "Update your name, bio, city, and profile photo", "Toggle 'Available for bookings' if you're at capacity", "Save changes"],
  },
];

export default function DashboardGuide() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="dg-root">
        <Navbar />

        <div className="dg-hero">
          <div className="dg-hero-bg">
            <div className="dg-orb dg-orb1" />
            <div className="dg-orb dg-orb2" />
          </div>
          <div className="dg-hero-inner">
            <button className="dg-back" onClick={() => navigate(-1)}>← Back</button>
            <span className="dg-eyebrow"> Vendor Resources</span>
            <div className="dg-icon-wrap">📊</div>
            <h1 className="dg-title">Dashboard Guide</h1>
            <p className="dg-subtitle">
              A complete walk-through of every feature in your vendor dashboard.
            </p>
            <div className="dg-meta">
              <span>7 features</span>
              <span className="dg-dot">·</span>
              <span>~8 min read</span>
              <span className="dg-dot">·</span>
              <span>Last updated April 2025</span>
            </div>
          </div>
        </div>

        <div className="dg-body">
          {features.map((f, i) => (
            <div key={i} className="dg-feature">
              <div className="dg-feature-header">
                <span className="dg-feature-icon">{f.icon}</span>
                <div>
                  <h2 className="dg-feature-title">{f.title}</h2>
                  <p className="dg-feature-desc">{f.desc}</p>
                </div>
              </div>
              <div className="dg-steps">
                <p className="dg-steps-label">How to do it:</p>
                <ol className="dg-steps-list">
                  {f.steps.map((step, j) => (
                    <li key={j} className="dg-step-item">
                      <span className="dg-step-num">{j + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}

          <div className="dg-support">
            <div className="dg-support-header">
  <Logo className="dg-support-logo" />
  <span>Need help?</span>
</div>
            <h3 className="dg-support-title">Can't find what you're looking for?</h3>
            <p className="dg-support-text">Our support team is available 7 days a week via the Help button on your dashboard.</p>
            <button className="dg-support-btn" onClick={() => navigate("/customer-care/vendor")}>
              Contact Support →
            </button>
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
  .dg-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }

  .dg-hero { position: relative; background: var(--ink); overflow: hidden; padding: 80px 32px 64px; text-align: center; }
  .dg-hero-bg { position: absolute; inset: 0; pointer-events: none; }
  .dg-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; }
  .dg-orb1 { width: 400px; height: 400px; background: #5ea7a7; top: -100px; right: -80px; }
  .dg-orb2 { width: 300px; height: 300px; background: var(--gold); bottom: -60px; left: -60px; }
  .dg-hero-inner { position: relative; z-index: 2; max-width: 640px; margin: 0 auto; }
  .dg-back { background: none; border: 1px solid rgba(201,168,76,0.25); color: var(--gold-light); font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 6px 14px; border-radius: 20px; cursor: pointer; margin-bottom: 24px; transition: all 0.2s; display: inline-block; }
  .dg-back:hover { background: rgba(201,168,76,0.1); }
  .dg-eyebrow { display: block; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; }
  .dg-icon-wrap { font-size: 3rem; margin-bottom: 16px; display: block; }
  .dg-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.2rem, 5vw, 3.2rem); font-weight: 300; color: var(--white); margin-bottom: 16px; }
  .dg-subtitle { font-size: 15px; color: rgba(245,240,232,0.6); line-height: 1.7; margin-bottom: 20px; }
  .dg-meta { display: flex; gap: 8px; align-items: center; justify-content: center; font-size: 12px; color: var(--muted); }
  .dg-dot { color: rgba(201,168,76,0.4); }

  .dg-body { max-width: 820px; margin: 0 auto; padding: 60px 32px; display: flex; flex-direction: column; gap: 24px; }

  .dg-feature { background: var(--white); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .dg-feature-header { padding: 28px 28px 0; display: flex; gap: 18px; align-items: flex-start; }
  .dg-feature-icon { font-size: 2rem; flex-shrink: 0; }
  .dg-feature-title { font-family: 'Cormorant Garamond', serif; font-size: 1.35rem; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .dg-feature-desc { font-size: 13.5px; color: var(--muted); line-height: 1.75; }
  .dg-steps { background: var(--surface); border-top: 1px solid var(--border); padding: 20px 28px; margin-top: 20px; }
  .dg-steps-label { font-size: 10.5px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
  .dg-steps-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .dg-step-item { display: flex; gap: 12px; align-items: flex-start; font-size: 13px; color: var(--muted); }
  .dg-step-num { width: 22px; height: 22px; background: var(--ink); color: var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; flex-shrink: 0; }

  .dg-support { background: var(--ink); border-radius: 16px; padding: 48px 36px; text-align: center; }
  .dg-support-eyebrow { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; display: block; }
  .dg-support-title { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 300; color: var(--white); margin-bottom: 10px; }
  .dg-support-text { font-size: 14px; color: var(--muted); margin-bottom: 28px; }
  .dg-support-btn { padding: 13px 28px; background: var(--gold); color: var(--ink); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.25s; }
  .dg-support-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.35); }
  .dg-support-header {
  display: flex;
  align-items: center;
  justify-content: center; /* centers everything */
  gap: 10px;
  margin-bottom: 12px;

  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
}

.dg-support-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
`;