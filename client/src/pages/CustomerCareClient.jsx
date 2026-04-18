import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const clientFAQs = [
  {
    category: "Bookings",
    icon: "📅",
    questions: [
      {
        q: "How do I book a vendor?",
        a: "Browse vendors, select your preferred package, pick a date, and click 'Reserve Now'. You'll receive a confirmation email instantly.",
      },
      {
        q: "Can I change my booking date after confirming?",
        a: "Yes! You can request a date change up to 72 hours before your event. Go to 'My Bookings', find your booking, and click 'Request Change'. The vendor will be notified.",
      },
      {
        q: "How far in advance should I book a vendor?",
        a: "We recommend booking at least 4–6 weeks in advance for regular events, and 3–6 months for weddings or large corporate events, especially during peak seasons.",
      },
      {
        q: "Can I book multiple vendors for the same event?",
        a: "Absolutely! You can book as many vendors as you need — photography, catering, decor, and more — all from your single Evencers account.",
      },
    ],
  },
  {
    category: "Cancellations & Refunds",
    icon: "💸",
    questions: [
      {
        q: "What is the cancellation policy?",
        a: "Cancellations made within 48 hours of booking are fully refunded. After 48 hours, cancellations depend on the vendor's individual policy, which is shown on their profile.",
      },
      {
        q: "How long does a refund take?",
        a: "Approved refunds are processed within 5–7 business days and returned to your original payment method.",
      },
      {
        q: "What if the vendor cancels on me?",
        a: "If a vendor cancels your confirmed booking, you receive a full refund automatically within 48 hours, plus priority support to find an alternative vendor.",
      },
    ],
  },
  {
    category: "Payments",
    icon: "💳",
    questions: [
      {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed through encrypted, PCI-compliant gateways. Evencers never stores your card details.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit/debit cards, UPI (GPay, PhonePe, Paytm), net banking, and EMI options on select cards.",
      },
      {
        q: "Will I get an invoice for my booking?",
        a: "Yes, a GST-compliant invoice is automatically emailed to you after every confirmed booking. You can also download it from 'My Bookings'.",
      },
    ],
  },
  {
    category: "Vendors & Quality",
    icon: "✦",
    questions: [
      {
        q: "How are vendors verified on Evencers?",
        a: "Every vendor goes through identity verification, portfolio review, and background checks before being listed. We also monitor ratings and reviews continuously.",
      },
      {
        q: "What if I'm not satisfied with a vendor's service?",
        a: "You can raise a dispute within 7 days of your event through 'My Bookings → Report Issue'. Our team reviews every case within 48 hours.",
      },
      {
        q: "Can I see vendor reviews before booking?",
        a: "Yes — all verified reviews from past clients are visible on each vendor's profile. We only show reviews from confirmed bookings.",
      },
    ],
  },
  {
    category: "Account & Profile",
    icon: "👤",
    questions: [
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot Password' on the login page. Enter your email and you'll receive a 6-digit OTP to securely reset your password.",
      },
      {
        q: "Can I use the same account for both client and vendor?",
        a: "No — client and vendor accounts are separate to maintain trust and transparency on the platform. You can create a separate vendor account with a different email.",
      },
      {
        q: "How do I delete my account?",
        a: "You can request account deletion from your profile settings. All your data will be permanently removed within 30 days as per our privacy policy.",
      },
    ],
  },
];

export default function CustomerCareClient() {
  const [openItem, setOpenItem] = useState(null);
  const [openCategory, setOpenCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const toggle = (key) => setOpenItem(openItem === key ? null : key);

  const filteredFAQs = searchQuery.trim()
    ? clientFAQs.map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (item) =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((cat) => cat.questions.length > 0)
    : clientFAQs;

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="cc-root">
        {/* HERO */}
        <div className="cc-hero">
          <div className="cc-hero-orb cc-orb1" />
          <div className="cc-hero-orb cc-orb2" />
          <div className="cc-hero-inner">
            <span className="cc-eyebrow">✦ Client Support</span>
            <h1 className="cc-hero-title">How can we<br /><em>help you today?</em></h1>
            <p className="cc-hero-sub">Find answers to common questions about bookings, payments, and more.</p>

            {/* Search */}
            <div className="cc-search-wrap">
              <span className="cc-search-icon">⌕</span>
              <input
                className="cc-search-input"
                placeholder="Search your question…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setOpenItem(null); }}
              />
              {searchQuery && (
                <button className="cc-search-clear" onClick={() => setSearchQuery("")}>✕</button>
              )}
            </div>
          </div>
        </div>

        {/* CONTACT CARDS */}
        <div className="cc-contact-strip">
          {[
            { icon: "✉", title: "Email Support", desc: "adminevencers2005@gmail.com", sub: "Reply within 24 hours" },
            { icon: "💬", title: "Live Chat", desc: "Chat with our team", sub: "Available 9 AM – 9 PM" },
            { icon: "📞", title: "Call Us", desc: "+91 7023017517", sub: "Mon – Sat, 10 AM – 7 PM" },
          ].map((c, i) => (
            <div key={i} className="cc-contact-card">
              <span className="cc-contact-icon">{c.icon}</span>
              <div>
                <p className="cc-contact-title">{c.title}</p>
                <p className="cc-contact-desc">{c.desc}</p>
                <p className="cc-contact-sub">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ SECTION */}
        <div className="cc-faq-section">
          <div className="cc-faq-header">
            <p className="cc-eyebrow-dark">✦ Frequently Asked</p>
            <h2 className="cc-faq-title">Common Questions</h2>
          </div>

          {filteredFAQs.length === 0 ? (
            <div className="cc-no-results">
              <span>🔍</span>
              <p>No results for "<strong>{searchQuery}</strong>"</p>
              <button className="cc-clear-btn" onClick={() => setSearchQuery("")}>Clear search</button>
            </div>
          ) : (
            <div className="cc-faq-layout">
              {/* Category tabs */}
              {!searchQuery && (
                <div className="cc-cat-tabs">
                  {clientFAQs.map((cat, i) => (
                    <button
                      key={i}
                      className={`cc-cat-tab ${openCategory === i ? "active" : ""}`}
                      onClick={() => { setOpenCategory(i); setOpenItem(null); }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.category}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Questions */}
              <div className="cc-questions">
                {(searchQuery ? filteredFAQs : [filteredFAQs[openCategory]]).map((cat, catI) => (
                  <div key={catI}>
                    {searchQuery && (
                      <p className="cc-cat-label">{cat.icon} {cat.category}</p>
                    )}
                    {cat.questions.map((item, qI) => {
                      const key = `${catI}-${qI}`;
                      const isOpen = openItem === key;
                      return (
                        <div key={qI} className={`cc-faq-item ${isOpen ? "open" : ""}`}>
                          <button className="cc-faq-q" onClick={() => toggle(key)}>
                            <span>{item.q}</span>
                            <span className={`cc-faq-arrow ${isOpen ? "up" : ""}`}>›</span>
                          </button>
                          <div className={`cc-faq-a-wrap ${isOpen ? "open" : ""}`}>
                            <p className="cc-faq-a">{item.a}</p>
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

        {/* CTA */}
        <div className="cc-cta">
          <p className="cc-eyebrow-dark">✦ Still need help?</p>
          <h3 className="cc-cta-title">Can't find your answer?</h3>
          <p className="cc-cta-sub">Our support team is here for you. Send us a message and we'll get back to you within 24 hours.</p>
          <button className="cc-cta-btn" onClick={() => window.location.href = "mailto:adminevencers2005@gmail.com"}>
            Contact Support →
          </button>
        </div>

        {/* FOOTER */}
        <footer className="cc-footer">
          <div className="cc-footer-logo">✦ Evencers</div>
          <p className="cc-footer-copy">© 2025 Evencers. Crafted with care in India.</p>
        </footer>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0e0c0a;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-light: #e8d5a3;
    --muted: #7a7265;
    --border: rgba(201,168,76,0.2);
    --surface: #faf7f2;
    --white: #ffffff;
  }

  .cc-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }

  /* HERO */
  .cc-hero {
    position: relative; overflow: hidden;
    background: var(--ink);
    padding: 120px 32px 80px;
    display: flex; align-items: center; justify-content: center;
  }
  .cc-hero-orb {
    position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; pointer-events: none;
  }
  .cc-orb1 { width: 400px; height: 400px; background: var(--gold); top: -80px; left: -60px; }
  .cc-orb2 { width: 350px; height: 350px; background: #7b5ea7; bottom: -60px; right: -40px; }
  .cc-hero-inner { position: relative; z-index: 2; text-align: center; max-width: 600px; animation: fadeUp 0.6s ease both; }

  .cc-eyebrow { display: inline-block; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 16px; border: 1px solid rgba(201,168,76,0.3); padding: 5px 14px; border-radius: 20px; background: rgba(201,168,76,0.08); }
  .cc-eyebrow-dark { display: block; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }

  .cc-hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.4rem, 5vw, 3.4rem); font-weight: 300; color: var(--white); line-height: 1.12; margin-bottom: 16px; }
  .cc-hero-title em { font-style: italic; color: var(--gold-light); }
  .cc-hero-sub { font-size: 14px; color: rgba(245,240,232,0.6); line-height: 1.7; margin-bottom: 32px; }

  /* Search */
  .cc-search-wrap { display: flex; align-items: center; background: var(--white); border-radius: 10px; padding: 6px 6px 6px 16px; gap: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 8px 40px rgba(0,0,0,0.25); }
  .cc-search-icon { font-size: 18px; color: var(--muted); flex-shrink: 0; }
  .cc-search-input { flex: 1; border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); background: transparent; }
  .cc-search-input::placeholder { color: #bbb4a8; }
  .cc-search-clear { background: none; border: none; font-size: 13px; color: var(--muted); cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.2s; }
  .cc-search-clear:hover { background: var(--surface); color: var(--ink); }

  /* CONTACT STRIP */
  .cc-contact-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); border-bottom: 1px solid var(--border); }
  @media (max-width: 700px) { .cc-contact-strip { grid-template-columns: 1fr; } }
  .cc-contact-card { display: flex; align-items: center; gap: 16px; padding: 28px 32px; background: var(--white); transition: background 0.2s; cursor: default; }
  .cc-contact-card:hover { background: var(--surface); }
  .cc-contact-icon { font-size: 1.6rem; flex-shrink: 0; }
  .cc-contact-title { font-size: 13px; font-weight: 500; color: var(--ink); margin-bottom: 3px; }
  .cc-contact-desc { font-size: 13px; color: var(--gold); font-weight: 500; margin-bottom: 2px; }
  .cc-contact-sub { font-size: 11px; color: var(--muted); }

  /* FAQ SECTION */
  .cc-faq-section { max-width: 1000px; margin: 0 auto; padding: 72px 32px; }
  .cc-faq-header { text-align: center; margin-bottom: 48px; }
  .cc-faq-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 300; color: var(--ink); }

  .cc-faq-layout { display: grid; grid-template-columns: 220px 1fr; gap: 40px; }
  @media (max-width: 700px) { .cc-faq-layout { grid-template-columns: 1fr; } .cc-cat-tabs { display: flex; flex-wrap: wrap; gap: 8px; } }

  /* Category Tabs */
  .cc-cat-tabs { display: flex; flex-direction: column; gap: 6px; }
  .cc-cat-tab { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: none; border: 1px solid transparent; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer; text-align: left; transition: all 0.2s; }
  .cc-cat-tab:hover { background: var(--white); border-color: var(--border); color: var(--ink); }
  .cc-cat-tab.active { background: var(--white); border-color: var(--gold); color: var(--ink); font-weight: 500; box-shadow: 0 2px 12px rgba(201,168,76,0.12); }

  /* Questions */
  .cc-questions { display: flex; flex-direction: column; gap: 10px; }
  .cc-cat-label { font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; margin-top: 8px; }

  .cc-faq-item { background: var(--white); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }
  .cc-faq-item.open { border-color: var(--gold); box-shadow: 0 4px 20px rgba(201,168,76,0.1); }

  .cc-faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 22px; background: none; border: none; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--ink); cursor: pointer; text-align: left; transition: background 0.2s; }
  .cc-faq-q:hover { background: var(--surface); }

  .cc-faq-arrow { font-size: 20px; color: var(--gold); flex-shrink: 0; transition: transform 0.25s ease; line-height: 1; }
  .cc-faq-arrow.up { transform: rotate(90deg); }

  .cc-faq-a-wrap { max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.2s ease; }
  .cc-faq-a-wrap.open { max-height: 300px; }
  .cc-faq-a { font-size: 13.5px; color: var(--muted); line-height: 1.75; padding: 0 22px 20px; }

  /* No results */
  .cc-no-results { text-align: center; padding: 60px 20px; }
  .cc-no-results span { font-size: 2.5rem; display: block; margin-bottom: 16px; }
  .cc-no-results p { font-size: 14px; color: var(--muted); margin-bottom: 20px; }
  .cc-no-results strong { color: var(--ink); }
  .cc-clear-btn { padding: 10px 24px; background: var(--ink); color: var(--white); border: none; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: background 0.2s; }
  .cc-clear-btn:hover { background: var(--gold); color: var(--ink); }

  /* CTA */
  .cc-cta { background: var(--ink); text-align: center; padding: 80px 32px; position: relative; overflow: hidden; }
  .cc-cta-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 300; color: var(--cream); margin: 10px 0 12px; }
  .cc-cta-sub { font-size: 14px; color: var(--muted); margin-bottom: 28px; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.7; }
  .cc-cta-btn { padding: 15px 36px; background: var(--gold); color: var(--ink); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.25s; }
  .cc-cta-btn:hover { background: var(--cream); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.3); }

  /* FOOTER */
  .cc-footer { background: var(--ink); padding: 28px 32px; text-align: center; border-top: 1px solid rgba(201,168,76,0.1); display: flex; flex-direction: column; gap: 8px; align-items: center; }
  .cc-footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--gold); letter-spacing: 0.18em; text-transform: uppercase; }
  .cc-footer-copy { font-size: 12px; color: var(--muted); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
`;