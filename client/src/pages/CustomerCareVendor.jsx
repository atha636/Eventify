import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
        a: "Vendor support is available via email at admineventify2005@gmail.com or by calling +91 70230 17517 (Mon–Sat, 10 AM – 7 PM IST). You can also use the 'Contact Support' button in your Dashboard.",
      },
      {
        q: "Can my account be suspended? What are the reasons?",
        a: "Accounts can be temporarily suspended for repeated cancellations, low ratings below 3.0, verified fraudulent activity, or violation of our vendor terms of service.",
      },
    ],
  },
];

const CONTACT_CHANNELS = [
  {
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <polyline points="2,4 12,13 22,4" />
      </svg>
    ),
    label: "Email Support",
    value: "admineventify2005@gmail.com",
    sub: "We reply within 24 hours",
    action: () => (window.location.href = "mailto:admineventify2005@gmail.com"),
    cta: "Send Email",
    accent: "#c9a84c",
  },
  {
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3.09 4.18 2 2 0 0 1 5.09 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    label: "Phone Support",
    value: "+91 70230 17517",
    sub: "Mon – Sat · 10 AM – 7 PM IST",
    action: () => (window.location.href = "tel:+917023017517"),
    cta: "Call Now",
    accent: "#5eb89a",
  },
  {
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: "WhatsApp",
    value: "+91 70230 17517",
    sub: "Quick replies on WhatsApp",
    action: () =>
      window.open(
        "https://wa.me/917023017517?text=Hello%20Eventify%20Vendor%20Support",
        "_blank"
      ),
    cta: "Chat on WhatsApp",
    accent: "#25d366",
  },
  {
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    label: "Support Ticket",
    value: "Dashboard → Contact Support",
    sub: "Priority for Premium vendors",
    action: () => (window.location.href = "/vendor-dashboard"),
    cta: "Open Dashboard",
    accent: "#7b86c9",
  },
];

/* ── Scroll-reveal hook ── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Animated counter ── */
function Counter({ target, suffix = "" }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useReveal(0.3);
  const numTarget = parseFloat(target.replace(/[^0-9.]/g, ""));
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = numTarget / 50;
    const id = setInterval(() => {
      start = Math.min(start + step, numTarget);
      setVal(start);
      if (start >= numTarget) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [visible, numTarget]);
  const display = Number.isInteger(numTarget) ? Math.round(val) : val.toFixed(1);
  return <span ref={ref}>{target.startsWith("₹") ? "₹" : ""}{display}{suffix}</span>;
}

export default function CustomerCareVendor() {
  const [openItem, setOpenItem] = useState(null);
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [statsRef, statsVisible] = useReveal(0.2);
  const [contactRef, contactVisible] = useReveal(0.1);
  const [faqRef, faqVisible] = useReveal(0.1);
  const [resRef, resVisible] = useReveal(0.1);
  const [tlRef, tlVisible] = useReveal(0.1);

  const toggle = (key) => setOpenItem(openItem === key ? null : key);

  const filteredFAQs = searchQuery.trim()
    ? vendorFAQs
        .map((cat) => ({
          ...cat,
          questions: cat.questions.filter(
            (item) =>
              item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.a.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.questions.length > 0)
    : vendorFAQs;

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 1800);
    });
  };

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="vc-root">

        {/* ── HERO ── */}
        <div className="vc-hero">
          <div className="vc-hero-orb vc-orb1" />
          <div className="vc-hero-orb vc-orb2" />
          <div className="vc-hero-orb vc-orb3" />
          <div className="vc-grid-lines" />
          <div className="vc-noise" />
          <div className="vc-hero-inner">
            <span className="vc-hero-eyebrow">
              <span className="vc-eyebrow-dot" />
              Vendor Support Centre
            </span>
            <h1 className="vc-hero-title">
              Partner<br />
              <em>Help Centre</em>
            </h1>
            <p className="vc-hero-sub">
              Everything you need to grow, manage, and succeed as an Eventify vendor partner.
              We're here every step of the way.
            </p>

            <div className="vc-search-wrap" role="search">
              <span className="vc-search-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                  <circle cx="8.5" cy="8.5" r="5.5" />
                  <line x1="12.5" y1="12.5" x2="17" y2="17" />
                </svg>
              </span>
              <input
                className="vc-search-input"
                placeholder="Search vendor questions…"
                value={searchQuery}
                aria-label="Search FAQ"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenItem(null);
                }}
              />
              {searchQuery && (
                <button
                  className="vc-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
                  </svg>
                </button>
              )}
            </div>

            <div className="vc-hero-quick-links">
              {["Getting Started", "Payments", "Bookings", "Disputes"].map((l) => (
                <span
                  key={l}
                  className="vc-quick-pill"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
                  onClick={() => {
                    const idx = vendorFAQs.findIndex((c) =>
                      c.category.toLowerCase().includes(l.toLowerCase())
                    );
                    if (idx >= 0) {
                      setOpenCategory(idx);
                      setSearchQuery("");
                      document.getElementById("vc-faq")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── STATS STRIP ── */}
        <div className={`vc-stats-strip ${statsVisible ? "revealed" : ""}`} ref={statsRef}>
          {[
            { num: "850", suffix: "+", label: "Active Vendors", prefix: "" },
            { num: "2.4", suffix: "Cr+", label: "Paid to Vendors", prefix: "₹" },
            { num: "24", suffix: "h", label: "Avg. Support Reply", prefix: "" },
            { num: "4.8", suffix: "★", label: "Vendor Satisfaction", prefix: "" },
          ].map((s, i) => (
            <div key={i} className="vc-stat" style={{ "--delay": `${i * 80}ms` }}>
              <span className="vc-stat-num">
                {s.prefix}<Counter target={`${s.num}`} suffix={s.suffix} />
              </span>
              <span className="vc-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── CONTACT CHANNELS ── */}
        <div
          className={`vc-contact-section ${contactVisible ? "revealed" : ""}`}
          ref={contactRef}
        >
          <div className="vc-contact-header">
            <p className="vc-eyebrow-dark">✦ Reach Us Directly</p>
            <h2 className="vc-section-title">Get in Touch</h2>
            <p className="vc-section-sub">Multiple ways to connect with our dedicated vendor success team</p>
          </div>
          <div className="vc-contact-grid">
            {CONTACT_CHANNELS.map((ch, i) => (
              <div
                key={i}
                className="vc-contact-card"
                style={{ "--ch-accent": ch.accent, "--delay": `${i * 90}ms` }}
                onClick={ch.action}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && ch.action()}
                aria-label={ch.label}
              >
                <div className="vc-contact-card-shine" />
                <div className="vc-contact-card-glow" />
                <div className="vc-contact-icon-wrap" style={{ color: ch.accent }}>
                  {ch.svg}
                </div>
                <div className="vc-contact-info">
                  <span className="vc-contact-label">{ch.label}</span>
                  <span className="vc-contact-value">{ch.value}</span>
                  <span className="vc-contact-sub">{ch.sub}</span>
                </div>
                <div className="vc-contact-footer">
                  <span className="vc-contact-cta">{ch.cta}</span>
                  <span className="vc-contact-arrow">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                      <line x1="2" y1="8" x2="13" y2="8" />
                      <polyline points="9,4 13,8 9,12" />
                    </svg>
                  </span>
                </div>

                {/* Copy-to-clipboard for phone/email */}
                {(i === 0 || i === 1 || i === 2) && (
                  <button
                    className={`vc-copy-btn ${copiedIndex === i ? "copied" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(i === 0 ? "admineventify2005@gmail.com" : "+917023017517", i);
                    }}
                    aria-label="Copy to clipboard"
                    title={copiedIndex === i ? "Copied!" : "Copy"}
                  >
                    {copiedIndex === i ? (
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <polyline points="2,8 6,12 14,4" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                        <rect x="5" y="5" width="8" height="9" rx="1.5" />
                        <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v7A1.5 1.5 0 0 0 3.5 12H5" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Office hours banner */}
          <div className="vc-hours-banner">
            <div className="vc-hours-dot" />
            <div className="vc-hours-content">
              <span className="vc-hours-title">Support Hours</span>
              <span className="vc-hours-text">
                Monday – Saturday &nbsp;·&nbsp; 10:00 AM – 7:00 PM IST
                &nbsp;&nbsp;|&nbsp;&nbsp;
                Sunday: Email support only
              </span>
            </div>
            <div className="vc-hours-badge">
              <span className="vc-hours-live" />
              Live Now
            </div>
          </div>
        </div>

        {/* ── FAQ SECTION ── */}
        <div
          className={`vc-faq-section ${faqVisible ? "revealed" : ""}`}
          id="vc-faq"
          ref={faqRef}
        >
          <div className="vc-faq-header">
            <p className="vc-eyebrow-dark">✦ Vendor FAQ</p>
            <h2 className="vc-section-title">Partner Questions</h2>
            <p className="vc-section-sub">Answers to the most common questions from our vendor partners</p>
          </div>

          {filteredFAQs.length === 0 ? (
            <div className="vc-no-results">
              <span>🔍</span>
              <p>
                No results for "<strong>{searchQuery}</strong>"
              </p>
              <button className="vc-clear-btn" onClick={() => setSearchQuery("")}>
                Clear search
              </button>
            </div>
          ) : (
            <div className="vc-faq-layout">
              {!searchQuery && (
                <div className="vc-cat-tabs">
                  {vendorFAQs.map((cat, i) => (
                    <button
                      key={i}
                      className={`vc-cat-tab ${openCategory === i ? "active" : ""}`}
                      onClick={() => {
                        setOpenCategory(i);
                        setOpenItem(null);
                      }}
                    >
                      <span className="vc-cat-emoji">{cat.icon}</span>
                      <span>{cat.category}</span>
                      <span className="vc-cat-count">{cat.questions.length}</span>
                    </button>
                  ))}

                  <div className="vc-sidebar-contact">
                    <p className="vc-sidebar-contact-title">Need direct help?</p>
                    <a href="mailto:admineventify2005@gmail.com" className="vc-sidebar-link">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11"><rect x="1" y="3" width="14" height="10" rx="1.5" /><polyline points="1,3 8,9 15,3" /></svg>
                      admineventify2005@gmail.com
                    </a>
                    <a href="tel:+917023017517" className="vc-sidebar-link">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11"><path d="M15 11.3v2A1.33 1.33 0 0 1 13.67 14.6 13.19 13.19 0 0 1 7.74 12.6a13 13 0 0 1-4-4 13.19 13.19 0 0 1-2-5.93A1.33 1.33 0 0 1 3.07 1.33h2A1.33 1.33 0 0 1 6.4 2.49c.085.64.24 1.27.47 1.87a1.33 1.33 0 0 1-.3 1.4l-.85.85A10.67 10.67 0 0 0 9.72 10.6l.85-.85a1.33 1.33 0 0 1 1.4-.3c.6.23 1.23.387 1.87.47A1.33 1.33 0 0 1 15 11.3z" /></svg>
                      +91 70230 17517
                    </a>
                  </div>
                </div>
              )}

              <div className="vc-questions">
                {(searchQuery
                  ? filteredFAQs
                  : [filteredFAQs[openCategory]]
                ).map((cat, catI) => (
                  <div key={catI}>
                    {searchQuery && (
                      <p className="vc-cat-label">
                        {cat.icon} {cat.category}
                      </p>
                    )}
                    {cat.questions.map((item, qI) => {
                      const key = `${catI}-${qI}`;
                      const isOpen = openItem === key;
                      return (
                        <div key={qI} className={`vc-faq-item ${isOpen ? "open" : ""}`}>
                          <button
                            className="vc-faq-q"
                            onClick={() => toggle(key)}
                            aria-expanded={isOpen}
                          >
                            <span>{item.q}</span>
                            <span className={`vc-faq-arrow ${isOpen ? "up" : ""}`} aria-hidden="true">
                              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                                <polyline points="4,6 8,10 12,6" />
                              </svg>
                            </span>
                          </button>
                          <div
                            className={`vc-faq-a-wrap ${isOpen ? "open" : ""}`}
                            role="region"
                            aria-hidden={!isOpen}
                          >
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

        {/* ── RESOURCES ── */}
        <div className={`vc-resources ${resVisible ? "revealed" : ""}`} ref={resRef}>
          <div className="vc-res-header">
            <p className="vc-eyebrow-dark">✦ Vendor Resources</p>
            <h2 className="vc-section-title">Helpful Guides</h2>
            <p className="vc-section-sub">Curated resources to help you get the most out of Eventify</p>
          </div>
          <div className="vc-res-grid">
            {[
              { icon: "📖", title: "Vendor Handbook", desc: "Everything you need to know about selling on Eventify.", link: "/resources/vendor-handbook", tag: "Essential" },
              { icon: "📸", title: "Photo Guidelines", desc: "Tips to make your portfolio stand out to clients.", link: "/resources/photo-guidelines", tag: "Popular" },
              { icon: "💡", title: "Pricing Strategy", desc: "How to price your packages competitively.", link: "/resources/pricing-strategy", tag: "Growth" },
              { icon: "📊", title: "Dashboard Guide", desc: "Walk-through of all your vendor dashboard features.", link: "/resources/dashboard-guide", tag: "New" },
            ].map((r, i) => (
              <div
                key={i}
                className="vc-res-card"
                style={{ "--delay": `${i * 80}ms` }}
                onClick={() => navigate(r.link)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(r.link)}
              >
                <span className="vc-res-tag">{r.tag}</span>
                <span className="vc-res-icon">{r.icon}</span>
                <h4 className="vc-res-title">{r.title}</h4>
                <p className="vc-res-desc">{r.desc}</p>
                <span className="vc-res-link">Read more →</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ESCALATION TIMELINE ── */}
        <div className={`vc-timeline-section ${tlVisible ? "revealed" : ""}`} ref={tlRef}>
          <div className="vc-timeline-header">
            <p className="vc-eyebrow-gold">✦ Our Support Promise</p>
            <h2 className="vc-section-title" style={{ color: "var(--cream)" }}>
              What to Expect
            </h2>
          </div>
          <div className="vc-timeline">
            {[
              { time: "Instantly", icon: "⚡", title: "Auto-Acknowledgement", desc: "Your query is logged and you receive a confirmation with a ticket number." },
              { time: "Within 4h", icon: "👁", title: "First Review", desc: "A support agent reviews your case and may request additional information." },
              { time: "Within 24h", icon: "💬", title: "Full Response", desc: "You receive a detailed resolution or escalation to the appropriate team." },
              { time: "Within 72h", icon: "✓", title: "Resolution", desc: "Complex disputes and payment queries are fully resolved within 72 hours." },
            ].map((t, i) => (
              <div key={i} className="vc-timeline-item" style={{ "--delay": `${i * 120}ms` }}>
                <div className="vc-timeline-left">
                  <span className="vc-timeline-time">{t.time}</span>
                </div>
                <div className="vc-timeline-line-wrap">
                  <div className="vc-timeline-dot">{t.icon}</div>
                  {i < 3 && <div className="vc-timeline-connector" />}
                </div>
                <div className="vc-timeline-right">
                  <h4 className="vc-timeline-title">{t.title}</h4>
                  <p className="vc-timeline-desc">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="vc-cta">
          <div className="vc-cta-orb vc-cta-orb1" />
          <div className="vc-cta-orb vc-cta-orb2" />
          <div className="vc-noise" style={{ opacity: 0.03 }} />
          <div className="vc-cta-inner">
            <p className="vc-eyebrow-gold">✦ We're Here For You</p>
            <h3 className="vc-cta-title">Still have questions?</h3>
            <p className="vc-cta-sub">
              Our dedicated vendor success team is available Mon–Sat, 10 AM – 7 PM IST.
              Reach us by email, phone, or WhatsApp — we always respond.
            </p>

            <div className="vc-cta-contact-row">
              <a href="mailto:admineventify2005@gmail.com" className="vc-cta-contact-pill">
                <span>✉</span>admineventify2005@gmail.com
              </a>
              <a href="tel:+917023017517" className="vc-cta-contact-pill">
                <span>📞</span>+91 70230 17517
              </a>
              <a
                href="https://wa.me/917023017517?text=Hello%20Eventify%20Vendor%20Support"
                target="_blank"
                rel="noreferrer"
                className="vc-cta-contact-pill vc-cta-wa-pill"
              >
                <span>💬</span>WhatsApp Us
              </a>
            </div>

            <div className="vc-cta-btns">
              <button
                className="vc-cta-primary"
                onClick={() => (window.location.href = "mailto:admineventify2005@gmail.com")}
              >
                Email Vendor Support
              </button>
              <a href="/vendor-dashboard" className="vc-cta-secondary">
                Go to Dashboard →
              </a>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="vc-footer">
          <div className="vc-footer-logo">✦ Eventify</div>
          <p className="vc-footer-copy">© 2025 Eventify. Crafted with care in India.</p>
          <div className="vc-footer-contact">
            <a href="mailto:admineventify2005@gmail.com" className="vc-footer-link">admineventify2005@gmail.com</a>
            <span className="vc-footer-sep">·</span>
            <a href="tel:+917023017517" className="vc-footer-link">+91 70230 17517</a>
          </div>
        </footer>
      </div>
    </>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────
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

  .vc-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
    overflow-x: hidden;
  }

  /* ── FOCUS VISIBLE (accessibility) ── */
  :focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 3px;
    border-radius: 4px;
  }

  /* ── NOISE TEXTURE ── */
  .vc-noise {
    position: absolute; inset: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.055;
    mix-blend-mode: overlay;
  }

  /* ── HERO ── */
  .vc-hero {
    position: relative; overflow: hidden;
    background: var(--ink);
    padding: 120px 32px 80px;
    display: flex; align-items: center; justify-content: center;
  }
  .vc-hero-orb {
    position: absolute; border-radius: 50%;
    filter: blur(100px); opacity: 0.14; pointer-events: none;
    will-change: transform;
    animation: orbFloat 9s ease-in-out infinite alternate;
  }
  .vc-orb1 { width: 420px; height: 420px; background: var(--gold); top: -80px; right: -60px; }
  .vc-orb2 { width: 350px; height: 350px; background: #5e7ab8; bottom: -60px; left: -40px; animation-delay: -3s; }
  .vc-orb3 { width: 200px; height: 200px; background: #a78bfa; top: 40%; left: 50%; opacity: 0.08; animation-delay: -6s; }
  @keyframes orbFloat {
    from { transform: scale(1) translate(0,0); }
    to   { transform: scale(1.15) translate(18px,-14px); }
  }

  .vc-grid-lines {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%);
  }

  .vc-hero-inner {
    position: relative; z-index: 2;
    text-align: center; max-width: 640px; width: 100%;
    animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) both;
  }

  .vc-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--gold); border: 1px solid rgba(201,168,76,0.3);
    padding: 6px 16px; border-radius: 24px;
    background: rgba(201,168,76,0.08); margin-bottom: 22px;
    animation: fadeUp 0.7s 0.1s cubic-bezier(.22,1,.36,1) both;
  }
  .vc-eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--gold); flex-shrink: 0;
    animation: dotBlink 2.5s ease-in-out infinite;
  }
  @keyframes dotBlink {
    0%,100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.35; transform: scale(0.6); }
  }

  .vc-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.6rem, 5.5vw, 3.8rem);
    font-weight: 300; color: var(--white);
    line-height: 1.1; margin-bottom: 18px;
    animation: fadeUp 0.7s 0.15s cubic-bezier(.22,1,.36,1) both;
  }
  .vc-hero-title em { font-style: italic; color: var(--gold-light); }

  .vc-hero-sub {
    font-size: 14px; color: rgba(245,240,232,0.58); line-height: 1.75;
    margin-bottom: 32px; max-width: 480px; margin-left: auto; margin-right: auto;
    animation: fadeUp 0.7s 0.2s cubic-bezier(.22,1,.36,1) both;
  }

  /* Search */
  .vc-search-wrap {
    display: flex; align-items: center; background: var(--white);
    border-radius: 12px; padding: 6px 6px 6px 16px; gap: 10px;
    max-width: 500px; margin: 0 auto 22px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(201,168,76,0.08);
    transition: box-shadow 0.3s, transform 0.2s;
    animation: fadeUp 0.7s 0.25s cubic-bezier(.22,1,.36,1) both;
  }
  .vc-search-wrap:focus-within {
    box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 2px var(--gold);
    transform: translateY(-1px);
  }
  .vc-search-icon { color: var(--muted); flex-shrink: 0; display: flex; align-items: center; }
  .vc-search-input {
    flex: 1; border: none; outline: none;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink);
    background: transparent;
  }
  .vc-search-input::placeholder { color: #bbb4a8; }
  .vc-search-clear {
    background: none; border: none; display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; padding: 8px;
    border-radius: 50%; transition: all 0.2s; flex-shrink: 0;
  }
  .vc-search-clear:hover { background: var(--surface); color: var(--ink); }

  .vc-hero-quick-links {
    display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
    animation: fadeUp 0.7s 0.32s cubic-bezier(.22,1,.36,1) both;
  }
  .vc-quick-pill {
    font-size: 11.5px; color: var(--gold-light);
    border: 1px solid rgba(201,168,76,0.22); border-radius: 24px;
    padding: 5px 14px; cursor: pointer; transition: all 0.22s;
    background: rgba(201,168,76,0.06); user-select: none;
  }
  .vc-quick-pill:hover {
    background: rgba(201,168,76,0.15); border-color: var(--gold);
    transform: translateY(-2px);
  }

  /* ── STATS STRIP ── */
  .vc-stats-strip {
    display: grid; grid-template-columns: repeat(4,1fr);
    background: var(--surface); border-bottom: 1px solid var(--border);
  }
  @media (max-width: 700px) { .vc-stats-strip { grid-template-columns: repeat(2,1fr); } }

  .vc-stat {
    display: flex; flex-direction: column; gap: 4px;
    padding: 24px 20px; text-align: center;
    border-right: 1px solid var(--border);
    opacity: 0; transform: translateY(14px);
    transition: opacity 0.5s var(--delay, 0ms), transform 0.5s var(--delay, 0ms);
  }
  .vc-stats-strip.revealed .vc-stat {
    opacity: 1; transform: none;
  }
  .vc-stat:last-child { border-right: none; }
  .vc-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.85rem; font-weight: 600; color: var(--gold);
    font-variant-numeric: tabular-nums;
  }
  .vc-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.07em; }

  /* ── CONTACT SECTION ── */
  .vc-contact-section { max-width: 1060px; margin: 0 auto; padding: 72px 32px 48px; }
  .vc-contact-header { text-align: center; margin-bottom: 44px; }
  .vc-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 300; color: var(--ink);
    margin-bottom: 8px;
  }
  .vc-section-sub { font-size: 13.5px; color: var(--muted); line-height: 1.6; }
  .vc-eyebrow-dark {
    display: block; font-size: 10px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 10px;
  }
  .vc-eyebrow-gold {
    display: block; font-size: 10px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 10px;
  }

  .vc-contact-grid {
    display: grid; grid-template-columns: repeat(4,1fr); gap: 16px;
    margin-bottom: 28px;
  }
  @media (max-width: 900px) { .vc-contact-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 500px) { .vc-contact-grid { grid-template-columns: 1fr; } }

  /* ── CONTACT CARD — fixed layout ── */
  .vc-contact-card {
    position: relative; overflow: hidden;
    background: var(--white); border: 1px solid var(--border);
    border-radius: 14px; padding: 24px 20px 18px;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(.22,1,.36,1), border-color 0.3s, box-shadow 0.3s;
    display: flex; flex-direction: column; gap: 0;

    /* Scroll-reveal */
    opacity: 0; transform: translateY(18px);
    transition:
      opacity 0.5s var(--delay, 0ms),
      transform 0.5s var(--delay, 0ms),
      border-color 0.3s,
      box-shadow 0.3s;
  }
  .vc-contact-section.revealed .vc-contact-card {
    opacity: 1; transform: translateY(0);
  }
  .vc-contact-card:hover {
    border-color: var(--ch-accent, var(--gold));
    transform: translateY(-5px) !important;
    box-shadow: 0 16px 44px rgba(0,0,0,0.09);
  }

  /* Shine sweep on hover */
  .vc-contact-card-shine {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%);
    transform: translateX(-100%);
    transition: transform 0.55s ease;
  }
  .vc-contact-card:hover .vc-contact-card-shine { transform: translateX(120%); }

  .vc-contact-card-glow {
    position: absolute; top: -40px; right: -40px;
    width: 120px; height: 120px; border-radius: 50%;
    background: var(--ch-accent, var(--gold));
    opacity: 0; filter: blur(36px);
    transition: opacity 0.4s; pointer-events: none;
  }
  .vc-contact-card:hover .vc-contact-card-glow { opacity: 0.18; }

  .vc-contact-icon-wrap {
    width: 46px; height: 46px; border-radius: 12px;
    background: rgba(201,168,76,0.07); border: 1px solid rgba(201,168,76,0.15);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px; flex-shrink: 0;
    transition: background 0.3s, transform 0.3s, border-color 0.3s;
  }
  .vc-contact-card:hover .vc-contact-icon-wrap {
    background: rgba(201,168,76,0.13);
    border-color: var(--ch-accent, var(--gold));
    transform: scale(1.08);
  }

  .vc-contact-info {
    display: flex; flex-direction: column; gap: 3px;
    flex: 1; margin-bottom: 14px;
  }
  .vc-contact-label {
    font-size: 9.5px; font-weight: 500; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--gold);
  }
  .vc-contact-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; font-weight: 600; color: var(--ink); line-height: 1.35;
    word-break: break-word;
  }
  .vc-contact-sub { font-size: 11.5px; color: var(--muted); line-height: 1.5; }

  .vc-contact-footer {
    display: flex; align-items: center; gap: 6px;
    padding-top: 12px; border-top: 1px solid var(--border);
  }
  .vc-contact-cta {
    font-size: 12px; font-weight: 500; color: var(--gold);
    letter-spacing: 0.04em; flex: 1;
    transition: letter-spacing 0.2s;
  }
  .vc-contact-card:hover .vc-contact-cta { letter-spacing: 0.08em; }
  .vc-contact-arrow {
    display: flex; align-items: center; color: var(--gold); opacity: 0.7;
    transform: translateX(0); transition: transform 0.25s;
  }
  .vc-contact-card:hover .vc-contact-arrow { transform: translateX(4px); opacity: 1; }

  /* Copy button */
  .vc-copy-btn {
    position: absolute; top: 12px; right: 12px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 5px 7px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); transition: all 0.2s; opacity: 0;
    pointer-events: none;
    z-index: 2;
  }
  .vc-contact-card:hover .vc-copy-btn { opacity: 1; pointer-events: auto; }
  .vc-copy-btn:hover { background: var(--ink); color: var(--white); border-color: var(--ink); }
  .vc-copy-btn.copied { background: #2d6a4f; color: #fff; border-color: #2d6a4f; opacity: 1; pointer-events: none; }

  /* Hours banner */
  .vc-hours-banner {
    display: flex; align-items: center; gap: 16px;
    background: var(--white); border: 1px solid var(--border);
    border-radius: 12px; padding: 18px 24px;
  }
  @media (max-width: 640px) { .vc-hours-banner { flex-direction: column; align-items: flex-start; } }
  .vc-hours-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--gold); flex-shrink: 0;
    box-shadow: 0 0 0 4px rgba(201,168,76,0.2);
    animation: pulseDot 2s ease-in-out infinite;
  }
  @keyframes pulseDot {
    0%,100% { box-shadow: 0 0 0 4px rgba(201,168,76,0.2); }
    50%      { box-shadow: 0 0 0 8px rgba(201,168,76,0.07); }
  }
  .vc-hours-content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .vc-hours-title { font-size: 12px; font-weight: 500; color: var(--ink); letter-spacing: 0.05em; }
  .vc-hours-text { font-size: 12.5px; color: var(--muted); }
  .vc-hours-badge {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 500; color: #2d6a4f;
    background: rgba(45,106,79,0.08); border: 1px solid rgba(45,106,79,0.2);
    padding: 5px 12px; border-radius: 20px; white-space: nowrap;
  }
  .vc-hours-live {
    width: 6px; height: 6px; border-radius: 50%;
    background: #2d6a4f;
    animation: pulseLive 1.8s ease-in-out infinite;
  }
  @keyframes pulseLive {
    0%,100% { opacity: 1; } 50% { opacity: 0.35; }
  }

  /* ── FAQ ── */
  .vc-faq-section {
    max-width: 1000px; margin: 0 auto; padding: 56px 32px 72px;
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .vc-faq-section.revealed { opacity: 1; transform: none; }
  .vc-faq-header { text-align: center; margin-bottom: 48px; }
  .vc-faq-layout { display: grid; grid-template-columns: 240px 1fr; gap: 40px; }
  @media (max-width: 720px) { .vc-faq-layout { grid-template-columns: 1fr; } }

  .vc-cat-tabs { display: flex; flex-direction: column; gap: 5px; }
  .vc-cat-tab {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; background: none;
    border: 1px solid transparent; border-radius: 9px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted);
    cursor: pointer; text-align: left; transition: all 0.2s;
  }
  .vc-cat-tab:hover { background: var(--white); border-color: var(--border); color: var(--ink); }
  .vc-cat-tab.active {
    background: var(--white); border-color: var(--gold); color: var(--ink);
    font-weight: 500; box-shadow: 0 2px 14px rgba(201,168,76,0.12);
  }
  .vc-cat-emoji { font-size: 1rem; }
  .vc-cat-count {
    margin-left: auto; font-size: 10px; font-weight: 500;
    color: var(--gold); background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.2);
    padding: 1px 7px; border-radius: 10px;
  }

  .vc-sidebar-contact {
    margin-top: 20px; padding: 18px 16px;
    background: var(--ink); border-radius: 10px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .vc-sidebar-contact-title {
    font-size: 10px; font-weight: 500; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 4px;
  }
  .vc-sidebar-link {
    font-size: 11.5px; color: rgba(245,240,232,0.55);
    text-decoration: none; transition: color 0.2s;
    word-break: break-all; display: flex; align-items: center; gap: 6px;
  }
  .vc-sidebar-link:hover { color: var(--gold); }

  .vc-questions { display: flex; flex-direction: column; gap: 10px; }
  .vc-cat-label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 12px; margin-top: 8px;
  }

  .vc-faq-item {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 11px; overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  .vc-faq-item.open {
    border-color: var(--gold); box-shadow: 0 4px 22px rgba(201,168,76,0.1);
  }
  .vc-faq-q {
    width: 100%; display: flex; justify-content: space-between; align-items: center;
    gap: 16px; padding: 18px 22px; background: none; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    color: var(--ink); cursor: pointer; text-align: left; transition: background 0.2s;
  }
  .vc-faq-q:hover { background: var(--surface); }
  .vc-faq-arrow {
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: var(--gold);
    transition: transform 0.32s cubic-bezier(.34,1.56,.64,1);
    will-change: transform;
  }
  .vc-faq-arrow.up { transform: rotate(180deg); }
  .vc-faq-a-wrap {
    display: grid; grid-template-rows: 0fr;
    transition: grid-template-rows 0.35s cubic-bezier(.22,1,.36,1);
  }
  .vc-faq-a-wrap.open { grid-template-rows: 1fr; }
  .vc-faq-a-wrap > p {
    overflow: hidden;
    font-size: 13.5px; color: var(--muted); line-height: 1.8;
    padding: 0 22px;
    border-top: 1px solid transparent;
    transition: padding 0.35s, border-color 0.2s;
  }
  .vc-faq-a-wrap.open > p {
    padding: 14px 22px 20px;
    border-top-color: var(--border);
  }

  .vc-no-results { text-align: center; padding: 60px 20px; }
  .vc-no-results span { font-size: 2.5rem; display: block; margin-bottom: 16px; }
  .vc-no-results p { font-size: 14px; color: var(--muted); margin-bottom: 20px; }
  .vc-no-results strong { color: var(--ink); }
  .vc-clear-btn {
    padding: 10px 24px; background: var(--ink); color: var(--white);
    border: none; border-radius: 6px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; cursor: pointer; transition: background 0.2s;
  }
  .vc-clear-btn:hover { background: var(--gold); color: var(--ink); }

  /* ── RESOURCES ── */
  .vc-resources {
    max-width: 1060px; margin: 0 auto; padding: 0 32px 72px;
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .vc-resources.revealed { opacity: 1; transform: none; }
  .vc-res-header { text-align: center; margin-bottom: 36px; }
  .vc-res-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
  @media (max-width: 800px) { .vc-res-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 500px) { .vc-res-grid { grid-template-columns: 1fr; } }

  .vc-res-card {
    position: relative;
    background: var(--white); border: 1px solid var(--border);
    border-radius: 12px; padding: 26px 20px 22px;
    cursor: pointer;
    overflow: hidden;
    opacity: 0; transform: translateY(14px);
    transition:
      opacity 0.5s var(--delay, 0ms),
      transform 0.5s var(--delay, 0ms),
      border-color 0.28s,
      box-shadow 0.28s;
  }
  .vc-resources.revealed .vc-res-card {
    opacity: 1; transform: none;
  }
  .vc-res-card::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.06), transparent);
    transition: left 0.5s ease;
  }
  .vc-res-card:hover::after { left: 140%; }
  .vc-res-card:hover {
    border-color: var(--gold); transform: translateY(-4px) !important;
    box-shadow: 0 12px 32px rgba(201,168,76,0.13);
  }
  .vc-res-tag {
    display: inline-block; font-size: 9px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--gold);
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2);
    padding: 2px 8px; border-radius: 20px; margin-bottom: 12px;
  }
  .vc-res-icon { font-size: 1.7rem; display: block; margin-bottom: 12px; }
  .vc-res-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.08rem; font-weight: 600; color: var(--ink); margin-bottom: 7px;
  }
  .vc-res-desc { font-size: 12.5px; color: var(--muted); line-height: 1.65; margin-bottom: 14px; }
  .vc-res-link { font-size: 12px; color: var(--gold); font-weight: 500; }
  .vc-res-card:hover .vc-res-link { text-decoration: underline; }

  /* ── TIMELINE ── */
  .vc-timeline-section {
    background: var(--ink); padding: 72px 32px;
    position: relative; overflow: hidden;
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .vc-timeline-section.revealed { opacity: 1; transform: none; }
  .vc-timeline-section::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 55%);
    pointer-events: none;
  }
  .vc-timeline-header { text-align: center; margin-bottom: 52px; position: relative; z-index: 1; }

  .vc-timeline {
    max-width: 760px; margin: 0 auto;
    display: flex; flex-direction: column; gap: 0;
    position: relative; z-index: 1;
  }
  .vc-timeline-item {
    display: grid; grid-template-columns: 100px 56px 1fr; gap: 0;
    align-items: flex-start;
    opacity: 0; transform: translateX(-14px);
    transition: opacity 0.5s var(--delay, 0ms), transform 0.5s var(--delay, 0ms);
  }
  .vc-timeline-section.revealed .vc-timeline-item { opacity: 1; transform: none; }
  @media (max-width: 600px) { .vc-timeline-item { grid-template-columns: 80px 44px 1fr; } }

  .vc-timeline-left { padding-top: 14px; text-align: right; padding-right: 16px; }
  .vc-timeline-time {
    font-size: 10.5px; font-weight: 500; letter-spacing: 0.1em;
    color: var(--gold); text-transform: uppercase;
  }
  .vc-timeline-line-wrap {
    display: flex; flex-direction: column; align-items: center; position: relative;
  }
  .vc-timeline-dot {
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; flex-shrink: 0; z-index: 1;
    transition: background 0.3s, transform 0.3s;
  }
  .vc-timeline-item:hover .vc-timeline-dot { background: rgba(201,168,76,0.24); transform: scale(1.08); }
  .vc-timeline-connector {
    width: 1px; flex: 1; min-height: 32px;
    background: rgba(201,168,76,0.18); margin: 4px 0;
  }
  .vc-timeline-right { padding: 10px 0 32px 20px; }
  .vc-timeline-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 600; color: var(--cream); margin-bottom: 5px;
  }
  .vc-timeline-desc { font-size: 13px; color: var(--muted); line-height: 1.7; }

  /* ── CTA ── */
  .vc-cta {
    position: relative; overflow: hidden;
    text-align: center; padding: 88px 32px;
    background: var(--ink);
  }
  .vc-cta-orb { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; will-change: transform; }
  .vc-cta-orb1 {
    width: 440px; height: 440px; background: var(--gold); opacity: 0.08;
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    animation: orbFloat 8s ease-in-out infinite alternate;
  }
  .vc-cta-orb2 {
    width: 240px; height: 240px; background: #5e7ab8; opacity: 0.1;
    top: 10%; right: 8%; animation: orbFloat 10s ease-in-out infinite alternate-reverse;
  }
  .vc-cta-inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
  .vc-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 300; color: var(--white);
    margin: 10px 0 14px;
  }
  .vc-cta-sub {
    font-size: 13.5px; color: rgba(245,240,232,0.5); margin-bottom: 28px;
    max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.75;
  }
  .vc-cta-contact-row {
    display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 30px;
  }
  .vc-cta-contact-pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 30px;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    text-decoration: none; transition: all 0.25s;
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.22);
    color: var(--gold-light);
  }
  .vc-cta-contact-pill:hover {
    background: rgba(201,168,76,0.18); border-color: var(--gold);
    transform: translateY(-2px); box-shadow: 0 6px 20px rgba(201,168,76,0.2);
  }
  .vc-cta-wa-pill { border-color: rgba(37,211,102,0.3); color: #7de8a8; }
  .vc-cta-wa-pill:hover { background: rgba(37,211,102,0.1); border-color: rgba(37,211,102,0.6); }

  .vc-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .vc-cta-primary {
    padding: 14px 32px; background: var(--gold); color: var(--ink);
    border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; cursor: pointer;
    transition: all 0.25s; position: relative; overflow: hidden;
  }
  .vc-cta-primary::after {
    content: ''; position: absolute; inset: 0;
    background: rgba(255,255,255,0); transition: background 0.2s;
  }
  .vc-cta-primary:hover { background: var(--cream); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(201,168,76,0.35); }
  .vc-cta-primary:active { transform: translateY(0); box-shadow: none; }
  .vc-cta-secondary {
    padding: 14px 32px; background: transparent; color: var(--cream);
    border: 1px solid rgba(245,240,232,0.22); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    text-decoration: none; display: inline-flex; align-items: center; transition: all 0.25s;
  }
  .vc-cta-secondary:hover { border-color: var(--gold); color: var(--gold); transform: translateY(-2px); }

  /* ── FOOTER ── */
  .vc-footer {
    background: #0a0806; padding: 32px;
    text-align: center; border-top: 1px solid rgba(201,168,76,0.1);
    display: flex; flex-direction: column; gap: 10px; align-items: center;
  }
  .vc-footer-logo {
    font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600;
    color: var(--gold); letter-spacing: 0.2em; text-transform: uppercase;
  }
  .vc-footer-copy { font-size: 12px; color: rgba(122,114,101,0.5); }
  .vc-footer-contact { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .vc-footer-link { font-size: 12px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .vc-footer-link:hover { color: var(--gold); }
  .vc-footer-sep { color: var(--border); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── CONTACT SECTION REVEAL ── */
  .vc-contact-section {
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .vc-contact-section.revealed { opacity: 1; transform: none; }

  @media (max-width: 480px) {
    .vc-hero { padding: 90px 20px 60px; }
    .vc-contact-section, .vc-faq-section, .vc-resources { padding-left: 20px; padding-right: 20px; }
    .vc-timeline-section { padding: 56px 20px; }
    .vc-cta { padding: 72px 20px; }
    .vc-cta-btns { flex-direction: column; align-items: center; }
    .vc-cta-primary, .vc-cta-secondary { width: 100%; max-width: 300px; justify-content: center; }
  }

  @media (prefers-reduced-motion: reduce) {
    .vc-hero-orb, .vc-eyebrow-dot, .vc-hours-dot, .vc-hours-live,
    .vc-cta-orb { animation: none !important; }
    .vc-contact-card, .vc-stat, .vc-res-card, .vc-timeline-item,
    .vc-faq-section, .vc-resources, .vc-timeline-section,
    .vc-contact-section {
      opacity: 1 !important; transform: none !important; transition: border-color 0.2s, box-shadow 0.2s !important;
    }
    .vc-stats-strip.revealed .vc-stat { opacity: 1; transform: none; }
  }
`;