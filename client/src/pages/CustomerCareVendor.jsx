import { useState } from "react";
import { useNavigate } from "react-router-dom";  // ✅ ADD THIS
import Navbar from "../components/Navbar";

const vendorFAQs = [
  {
    category: "Getting Started",
    icon: "🚀",
    questions: [
      {
        q: "How do I list my services on Eventify?",
        a: "Register with the 'I'm a Vendor' option, then head to your Vendor Dashboard and click 'Add New Service'. Fill in your details, upload portfolio photos, and set your packages. Your listing will be reviewed within 24 hours.",
      },
      {
        q: "Is there a fee to list on Eventify?",
        a: "Creating a vendor profile is free. Eventify charges a small service fee (8–12%) only when you receive a confirmed booking — no upfront or monthly charges.",
      },
      {
        q: "How long does profile verification take?",
        a: "Profile verification typically takes 24–48 hours. You'll receive an email once your profile is live and accepting bookings.",
      },
      {
        q: "Can I list multiple service types?",
        a: "Yes! You can add multiple services under one account. For example, a photography studio can list 'Wedding Photography', 'Corporate Photography', and 'Portrait Sessions' separately.",
      },
    ],
  },
  {
    category: "Managing Bookings",
    icon: "📅",
    questions: [
      {
        q: "How will I know when I receive a booking?",
        a: "You'll receive an instant email notification with booking details — client name, date, package, and contact information. You can also view all bookings in your Vendor Dashboard.",
      },
      {
        q: "Can I decline a booking?",
        a: "Yes, you can decline within 24 hours if you're unavailable. We recommend keeping your calendar updated to avoid frequent cancellations, which may affect your profile ranking.",
      },
      {
        q: "How do I mark my dates as unavailable?",
        a: "In your Vendor Dashboard, go to 'Availability Calendar' and block out dates you cannot accept bookings. This prevents double-bookings automatically.",
      },
      {
        q: "What happens if I need to cancel a confirmed booking?",
        a: "Vendor cancellations must be done with at least 72 hours notice. Repeated cancellations can result in reduced visibility or account review. The client receives a full refund.",
      },
    ],
  },
  {
    category: "Payments & Earnings",
    icon: "💰",
    questions: [
      {
        q: "When do I receive payment for a booking?",
        a: "Payments are released to your bank account within 3–5 business days after the event date. You can track all pending and completed payouts in your Vendor Dashboard under 'Earnings'.",
      },
      {
        q: "What payment methods can clients pay me with?",
        a: "Clients can pay via cards, UPI, and net banking through Eventify's secure payment gateway. You don't need to handle any payment collection yourself.",
      },
      {
        q: "How much commission does Eventify charge?",
        a: "Eventify's platform fee ranges from 8–12% depending on your vendor tier. This covers payment processing, marketing, and platform support. The fee is deducted before payout.",
      },
      {
        q: "Are there any tax implications I should know about?",
        a: "Eventify provides a detailed earnings statement for each financial year. If your annual revenue exceeds the GST threshold, you'll need to register for GST separately. Consult a tax advisor for guidance.",
      },
    ],
  },
  {
    category: "Profile & Visibility",
    icon: "⭐",
    questions: [
      {
        q: "How can I improve my ranking in search results?",
        a: "Complete your profile 100%, add high-quality photos, respond quickly to bookings, maintain high ratings, and collect more verified reviews. Active and responsive vendors rank higher.",
      },
      {
        q: "How do client reviews work?",
        a: "After a completed booking, clients receive an automated email inviting them to leave a review. Only verified clients who booked through Eventify can leave reviews — no fake reviews.",
      },
      {
        q: "Can I edit my packages and pricing at any time?",
        a: "Yes — you can update packages, pricing, and descriptions at any time from your Dashboard. Changes apply to new bookings only and won't affect already confirmed bookings.",
      },
      {
        q: "How many photos can I upload to my profile?",
        a: "You can upload up to 20 portfolio images per service listing. We recommend using high-resolution images (1200px+ wide) to make your profile stand out.",
      },
    ],
  },
  {
    category: "Disputes & Support",
    icon: "🛡",
    questions: [
      {
        q: "What if a client raises a false complaint against me?",
        a: "We take all disputes seriously and investigate both sides fairly. You'll be notified immediately and given 48 hours to provide your response and any supporting evidence.",
      },
      {
        q: "How do I contact Eventify vendor support?",
        a: "Vendor support is available via email at vendors@eventify.in or through your Dashboard's 'Contact Support' button. Priority support is available for Premium vendors.",
      },
      {
        q: "Can my account be suspended? What are the reasons?",
        a: "Accounts can be temporarily suspended for repeated cancellations, low ratings below 3.0, verified fraudulent activity, or violation of our vendor terms of service.",
      },
    ],
  },
];

export default function CustomerCareVendor() {
  const [openItem, setOpenItem] = useState(null);
  const navigate = useNavigate();  
  const [openCategory, setOpenCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const toggle = (key) => setOpenItem(openItem === key ? null : key);

  const filteredFAQs = searchQuery.trim()
    ? vendorFAQs.map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (item) =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((cat) => cat.questions.length > 0)
    : vendorFAQs;

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="vc-root">
        {/* HERO */}
        <div className="vc-hero">
          <div className="vc-hero-orb vc-orb1" />
          <div className="vc-hero-orb vc-orb2" />
          <div className="vc-hero-inner">
            <span className="vc-eyebrow">✦ Vendor Support</span>
            <h1 className="vc-hero-title">Partner<br /><em>Help Centre</em></h1>
            <p className="vc-hero-sub">Resources and answers for Eventify vendor partners. Grow your business with confidence.</p>

            <div className="vc-search-wrap">
              <span className="vc-search-icon">⌕</span>
              <input
                className="vc-search-input"
                placeholder="Search vendor questions…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setOpenItem(null); }}
              />
              {searchQuery && (
                <button className="vc-search-clear" onClick={() => setSearchQuery("")}>✕</button>
              )}
            </div>
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="vc-stats-strip">
          {[
            { num: "850+", label: "Active Vendors" },
            { num: "₹2.4Cr+", label: "Paid to Vendors" },
            { num: "24h", label: "Avg. Support Reply" },
            { num: "4.8★", label: "Vendor Satisfaction" },
          ].map((s, i) => (
            <div key={i} className="vc-stat">
              <span className="vc-stat-num">{s.num}</span>
              <span className="vc-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* FAQ SECTION */}
        <div className="vc-faq-section">
          <div className="vc-faq-header">
            <p className="vc-eyebrow-dark">✦ Vendor FAQ</p>
            <h2 className="vc-faq-title">Partner Questions</h2>
          </div>

          {filteredFAQs.length === 0 ? (
            <div className="vc-no-results">
              <span>🔍</span>
              <p>No results for "<strong>{searchQuery}</strong>"</p>
              <button className="vc-clear-btn" onClick={() => setSearchQuery("")}>Clear search</button>
            </div>
          ) : (
            <div className="vc-faq-layout">
              {!searchQuery && (
                <div className="vc-cat-tabs">
                  {vendorFAQs.map((cat, i) => (
                    <button
                      key={i}
                      className={`vc-cat-tab ${openCategory === i ? "active" : ""}`}
                      onClick={() => { setOpenCategory(i); setOpenItem(null); }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.category}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="vc-questions">
                {(searchQuery ? filteredFAQs : [filteredFAQs[openCategory]]).map((cat, catI) => (
                  <div key={catI}>
                    {searchQuery && (
                      <p className="vc-cat-label">{cat.icon} {cat.category}</p>
                    )}
                    {cat.questions.map((item, qI) => {
                      const key = `${catI}-${qI}`;
                      const isOpen = openItem === key;
                      return (
                        <div key={qI} className={`vc-faq-item ${isOpen ? "open" : ""}`}>
                          <button className="vc-faq-q" onClick={() => toggle(key)}>
                            <span>{item.q}</span>
                            <span className={`vc-faq-arrow ${isOpen ? "up" : ""}`}>›</span>
                          </button>
                          <div className={`vc-faq-a-wrap ${isOpen ? "open" : ""}`}>
                            <p className="vc-faq-a">{item.a}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RESOURCES */}
        <div className="vc-resources">
          <div className="vc-res-header">
            <p className="vc-eyebrow-dark">✦ Vendor Resources</p>
            <h2 className="vc-faq-title">Helpful Links</h2>
          </div>
          <div className="vc-res-grid">
            {[
  {
    icon: "📖",
    title: "Vendor Handbook",
    desc: "Everything you need to know about selling on Eventify.",
    link: "/resources/vendor-handbook",
  },
  {
    icon: "📸",
    title: "Photo Guidelines",
    desc: "Tips to make your portfolio stand out to clients.",
    link: "/resources/photo-guidelines",
  },
  {
    icon: "💡",
    title: "Pricing Strategy",
    desc: "How to price your packages competitively.",
    link: "/resources/pricing-strategy",
  },
  {
    icon: "📊",
    title: "Dashboard Guide",
    desc: "Walk-through of all your vendor dashboard features.",
    link: "/resources/dashboard-guide",
  },
].map((r, i) => (
              <div
  key={i}
  className="vc-res-card"
  onClick={() => navigate(r.link)}   // ✅ ADD THIS
>
                <span className="vc-res-icon">{r.icon}</span>
                <h4 className="vc-res-title">{r.title}</h4>
                <p className="vc-res-desc">{r.desc}</p>
                <span
  className="vc-res-link"
  onClick={() => navigate(r.link)}   // ✅ ADD THIS
>
  Read more →
</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="vc-cta">
          <p className="vc-eyebrow-gold">✦ Dedicated Vendor Support</p>
          <h3 className="vc-cta-title">Still have questions?</h3>
          <p className="vc-cta-sub">Our dedicated vendor success team is here to help you grow. Reach out anytime.</p>
          <div className="vc-cta-btns">
            <button className="vc-cta-primary" onClick={() => window.location.href = "mailto:vendors@eventify.in"}>
              Email Vendor Support
            </button>
            <a href="/vendor-dashboard" className="vc-cta-secondary">Go to Dashboard →</a>
          </div>
        </div>

        <footer className="vc-footer">
          <div className="vc-footer-logo">✦ Eventify</div>
          <p className="vc-footer-copy">© 2025 Eventify. Crafted with care in India.</p>
        </footer>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c;
    --gold-light: #e8d5a3; --muted: #7a7265;
    --border: rgba(201,168,76,0.2); --surface: #faf7f2; --white: #ffffff;
  }
  .vc-root { font-family:'DM Sans',sans-serif; background:var(--cream); min-height:100vh; color:var(--ink); }

  .vc-hero { position:relative; overflow:hidden; background:var(--ink); padding:120px 32px 80px; display:flex; align-items:center; justify-content:center; }
  .vc-hero-orb { position:absolute; border-radius:50%; filter:blur(100px); opacity:0.15; pointer-events:none; }
  .vc-orb1 { width:400px; height:400px; background:var(--gold); top:-80px; right:-60px; }
  .vc-orb2 { width:350px; height:350px; background:#5e7ab8; bottom:-60px; left:-40px; }
  .vc-hero-inner { position:relative; z-index:2; text-align:center; max-width:600px; animation:fadeUp 0.6s ease both; }

  .vc-eyebrow { display:inline-block; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); margin-bottom:16px; border:1px solid rgba(201,168,76,0.3); padding:5px 14px; border-radius:20px; background:rgba(201,168,76,0.08); }
  .vc-eyebrow-dark { display:block; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }
  .vc-eyebrow-gold { display:block; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }

  .vc-hero-title { font-family:'Cormorant Garamond',serif; font-size:clamp(2.4rem,5vw,3.4rem); font-weight:300; color:var(--white); line-height:1.12; margin-bottom:16px; }
  .vc-hero-title em { font-style:italic; color:var(--gold-light); }
  .vc-hero-sub { font-size:14px; color:rgba(245,240,232,0.6); line-height:1.7; margin-bottom:32px; }

  .vc-search-wrap { display:flex; align-items:center; background:var(--white); border-radius:10px; padding:6px 6px 6px 16px; gap:10px; max-width:500px; margin:0 auto; box-shadow:0 8px 40px rgba(0,0,0,0.25); }
  .vc-search-icon { font-size:18px; color:var(--muted); flex-shrink:0; }
  .vc-search-input { flex:1; border:none; outline:none; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--ink); background:transparent; }
  .vc-search-input::placeholder { color:#bbb4a8; }
  .vc-search-clear { background:none; border:none; font-size:13px; color:var(--muted); cursor:pointer; padding:8px; border-radius:50%; transition:all 0.2s; }
  .vc-search-clear:hover { background:var(--surface); color:var(--ink); }

  /* STATS */
  .vc-stats-strip { display:grid; grid-template-columns:repeat(4,1fr); background:var(--surface); border-bottom:1px solid var(--border); }
  @media (max-width:700px) { .vc-stats-strip { grid-template-columns:repeat(2,1fr); } }
  .vc-stat { display:flex; flex-direction:column; gap:4px; padding:24px 28px; border-right:1px solid var(--border); text-align:center; }
  .vc-stat:last-child { border-right:none; }
  .vc-stat-num { font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:600; color:var(--gold); }
  .vc-stat-label { font-size:11px; color:var(--muted); letter-spacing:0.07em; }

  /* FAQ */
  .vc-faq-section { max-width:1000px; margin:0 auto; padding:72px 32px; }
  .vc-faq-header { text-align:center; margin-bottom:48px; }
  .vc-faq-title { font-family:'Cormorant Garamond',serif; font-size:clamp(1.8rem,3vw,2.4rem); font-weight:300; color:var(--ink); }

  .vc-faq-layout { display:grid; grid-template-columns:220px 1fr; gap:40px; }
  @media (max-width:700px) { .vc-faq-layout { grid-template-columns:1fr; } }

  .vc-cat-tabs { display:flex; flex-direction:column; gap:6px; }
  .vc-cat-tab { display:flex; align-items:center; gap:10px; padding:12px 16px; background:none; border:1px solid transparent; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; color:var(--muted); cursor:pointer; text-align:left; transition:all 0.2s; }
  .vc-cat-tab:hover { background:var(--white); border-color:var(--border); color:var(--ink); }
  .vc-cat-tab.active { background:var(--white); border-color:var(--gold); color:var(--ink); font-weight:500; box-shadow:0 2px 12px rgba(201,168,76,0.12); }

  .vc-questions { display:flex; flex-direction:column; gap:10px; }
  .vc-cat-label { font-size:11px; font-weight:500; letter-spacing:0.15em; text-transform:uppercase; color:var(--gold); margin-bottom:12px; margin-top:8px; }

  .vc-faq-item { background:var(--white); border:1px solid var(--border); border-radius:10px; overflow:hidden; transition:border-color 0.2s,box-shadow 0.2s; }
  .vc-faq-item.open { border-color:var(--gold); box-shadow:0 4px 20px rgba(201,168,76,0.1); }
  .vc-faq-q { width:100%; display:flex; justify-content:space-between; align-items:center; gap:16px; padding:18px 22px; background:none; border:none; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; color:var(--ink); cursor:pointer; text-align:left; transition:background 0.2s; }
  .vc-faq-q:hover { background:var(--surface); }
  .vc-faq-arrow { font-size:20px; color:var(--gold); flex-shrink:0; transition:transform 0.25s ease; line-height:1; }
  .vc-faq-arrow.up { transform:rotate(90deg); }
  .vc-faq-a-wrap { max-height:0; overflow:hidden; transition:max-height 0.35s ease; }
  .vc-faq-a-wrap.open { max-height:300px; }
  .vc-faq-a { font-size:13.5px; color:var(--muted); line-height:1.75; padding:0 22px 20px; }

  .vc-no-results { text-align:center; padding:60px 20px; }
  .vc-no-results span { font-size:2.5rem; display:block; margin-bottom:16px; }
  .vc-no-results p { font-size:14px; color:var(--muted); margin-bottom:20px; }
  .vc-no-results strong { color:var(--ink); }
  .vc-clear-btn { padding:10px 24px; background:var(--ink); color:var(--white); border:none; border-radius:6px; font-family:'DM Sans',sans-serif; font-size:13px; cursor:pointer; transition:background 0.2s; }
  .vc-clear-btn:hover { background:var(--gold); color:var(--ink); }

  /* RESOURCES */
  .vc-resources { max-width:1000px; margin:0 auto; padding:0 32px 72px; }
  .vc-res-header { text-align:center; margin-bottom:36px; }
  .vc-res-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  @media (max-width:800px) { .vc-res-grid { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:500px) { .vc-res-grid { grid-template-columns:1fr; } }
  .vc-res-card { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:24px 20px; transition:all 0.25s; cursor:pointer; }
  .vc-res-card:hover { border-color:var(--gold); transform:translateY(-3px); box-shadow:0 8px 28px rgba(201,168,76,0.12); }
  .vc-res-icon { font-size:1.6rem; display:block; margin-bottom:12px; }
  .vc-res-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:var(--ink); margin-bottom:6px; }
  .vc-res-desc { font-size:12.5px; color:var(--muted); line-height:1.6; margin-bottom:12px; }
  .vc-res-link { font-size:12px; color:var(--gold); font-weight:500; }

  /* CTA */
  .vc-cta { background:var(--ink); text-align:center; padding:80px 32px; }
  .vc-cta-title { font-family:'Cormorant Garamond',serif; font-size:clamp(1.8rem,3vw,2.4rem); font-weight:300; color:var(--cream); margin:10px 0 12px; }
  .vc-cta-sub { font-size:14px; color:var(--muted); margin-bottom:28px; max-width:480px; margin-left:auto; margin-right:auto; line-height:1.7; }
  .vc-cta-btns { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
  .vc-cta-primary { padding:14px 32px; background:var(--gold); color:var(--ink); border:none; border-radius:7px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:all 0.25s; }
  .vc-cta-primary:hover { background:var(--cream); transform:translateY(-2px); }
  .vc-cta-secondary { padding:14px 32px; background:transparent; color:var(--cream); border:1px solid rgba(245,240,232,0.25); border-radius:7px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; text-decoration:none; display:inline-flex; align-items:center; transition:all 0.25s; }
  .vc-cta-secondary:hover { border-color:var(--gold); color:var(--gold); }

  .vc-footer { background:var(--ink); padding:28px 32px; text-align:center; border-top:1px solid rgba(201,168,76,0.1); display:flex; flex-direction:column; gap:8px; align-items:center; }
  .vc-footer-logo { font-family:'Cormorant Garamond',serif; font-size:1.1rem; font-weight:600; color:var(--gold); letter-spacing:0.18em; text-transform:uppercase; }
  .vc-footer-copy { font-size:12px; color:var(--muted); }

  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
`;


