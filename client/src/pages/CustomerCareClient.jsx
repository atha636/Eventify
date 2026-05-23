import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";

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
    icon: "🌟",
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

// ── AI CHAT DATA ─────────────────────────────────────────────────────────────
const QUICK_CHIPS = [
  "How do I book?",
  "Cancel my booking",
  "Payment methods",
  "Change booking date",
  "Track my booking",
  "Vendor rejected me",
];

const BOT_RESPONSES = [
  {
    match: [
      "how do i book",
      "how to book",
      "book a vendor",
      "book",
      "reserve",
      "booking",
    ],
    reply: `Booking on Evencers is super easy! Here's how:\n\n1️⃣ Go to **Explore Vendors** and browse services\n2️⃣ Click on any vendor to see their packages\n3️⃣ Choose a package, pick your event date & address\n4️⃣ Click **Reserve Now** to send a booking request\n\nThe vendor will review and confirm within 24–48 hours. You'll get notified once it's approved! 🎉`,
  },
  {
    match: [
      "cancel my booking",
      "cancel",
      "cancellation",
      "undo",
      "delete booking",
    ],
    reply: `You can cancel a **Pending** booking anytime:\n\n1️⃣ Go to **My Bookings**\n2️⃣ Find the booking you want to cancel\n3️⃣ Click the **Cancel** button\n\n⚠️ **Note:** Once a booking is Approved, cancellation may not be available. Refunds for eligible cancellations are processed within 5–7 business days.`,
  },
  {
    match: [
      "payment methods",
      "pay",
      "payment",
      "upi",
      "card",
      "razorpay",
      "how to pay",
    ],
    reply: `Payments on Evencers are 100% secure! 💳\n\n✅ After a vendor **approves** your booking, a **Pay Now** button appears on your dashboard\n✅ We accept: Credit/Debit cards, UPI (GPay, PhonePe, Paytm), Net Banking\n✅ Payment is encrypted and PCI-compliant\n\nYou'll get a GST invoice by email automatically after payment.`,
  },
  {
    match: [
      "change booking date",
      "change date",
      "reschedule",
      "change address",
      "modify",
      "edit booking",
    ],
    reply: `Want to reschedule or change your address? Here's how:\n\n1️⃣ Open **My Bookings**\n2️⃣ Click **📅 Change Date / Address** on your booking\n3️⃣ Enter your new preferred date or address\n4️⃣ Add a reason (optional) and submit\n\nThe vendor will review your request and accept or decline. You'll be notified! ✅`,
  },
  {
    match: [
      "track my booking",
      "track",
      "status",
      "where is",
      "check booking",
      "booking status",
    ],
    reply: `To track your booking status:\n\n📋 Go to **My Bookings** from your dashboard\n\nYou'll see one of these statuses:\n• **Pending** — Waiting for vendor approval\n• **Confirmed** — Vendor approved, payment needed\n• **Declined** — Vendor couldn't accept\n\nYou can also filter by status using the tabs at the top! 🔍`,
  },
  {
    match: [
      "vendor rejected me",
      "reject",
      "rejected",
      "declined",
      "vendor declined",
      "vendor rejected",
    ],
    reply: `If a vendor declines your booking:\n\n• The booking will show as **Declined** in your dashboard\n• You're free to browse and book another vendor for the same date\n• No payment is charged for declined bookings\n\n💡 Tip: Try booking 2–3 vendors early to compare options before confirming!`,
  },
  {
    match: ["refund", "money back", "refund time"],
    reply: `Refund timelines depend on the situation:\n\n• **Cancellation within 48hrs:** Full refund in 5–7 business days\n• **Vendor cancels your booking:** Full refund within 48 hours automatically\n• **Dispute resolution:** Refund after our team reviews (within 72 hrs)\n\nRefunds go back to your original payment method. 💰`,
  },
  {
    match: ["password", "forgot password", "reset", "login issue"],
    reply: `Forgot your password? No worries!\n\n1️⃣ Go to the **Login** page\n2️⃣ Click **Forgot Password**\n3️⃣ Enter your registered email\n4️⃣ You'll receive a 6-digit OTP\n5️⃣ Enter the OTP and set a new password\n\nIf you're still having trouble, email us at **admineventify2005@gmail.com** 📧`,
  },
  {
    match: ["vendor", "find vendor", "browse", "explore", "search vendor"],
    reply: `Finding the perfect vendor is easy!\n\n🔍 Click **Explore Vendors** in the navigation\n🎯 Filter by service type, location, and budget\n⭐ Check ratings and reviews from real clients\n📸 Browse portfolios before booking\n\nAll vendors are verified by our team before listing! ✅`,
  },
  {
    match: ["invoice", "receipt", "bill", "gst"],
    reply: `Yes, you get a GST-compliant invoice for every booking! 📄\n\n✅ It's emailed to you automatically after payment\n✅ You can also download it anytime from **My Bookings → View Details**\n\nFor any invoice issues, contact us at **admineventify2005@gmail.com**`,
  },
  {
    match: ["hello", "hi", "hey", "hii", "namaste"],
    reply: `Hello! 👋 I'm **Aria**, your Evencers support assistant.\n\nI'm here to help you with:\n📅 Bookings & scheduling\n💳 Payments & refunds\n🔄 Cancellations & changes\n🌟 Finding the right vendor\n\nWhat can I help you with today?`,
  },
  {
    match: ["thank", "thanks", "thankyou", "great", "awesome", "perfect"],
    reply: `You're welcome! 😊 Happy to help.\n\nIf you have any more questions, just ask. Have a wonderful event ahead! 🎉\n\nYou can also reach our team at **admineventify2005@gmail.com** or call **+91 70230 17517** for urgent help.`,
  },
  {
    match: ["contact", "email", "phone", "call", "reach", "support team"],
    reply: `Here's how to reach our support team:\n\n📧 **Email:** admineventify2005@gmail.com\n📞 **Phone:** +91 70230 17517\n🕐 **Hours:** Mon–Sat, 10 AM – 7 PM IST\n\nFor fastest response, email us with your booking ID and we'll get back within 24 hours! 💬`,
  },
  {
    match: ["help"],
    reply: `Hello! 👋 I'm **Aria**, your Evencers support assistant.\n\nI'm here to help you with:\n📅 Bookings & scheduling\n💳 Payments & refunds\n🔄 Cancellations & changes\n🌟 Finding the right vendor\n\nWhat can I help you with today?`,
  },
];

function getBotReply(input) {
  const lower = input.toLowerCase().trim();
  for (const item of BOT_RESPONSES) {
    if (item.match.some((kw) => lower.includes(kw))) {
      return item.reply;
    }
  }
  return `I'm not sure about that specific query, but I'm happy to help! 🤔\n\nYou can:\n• Try rephrasing your question\n• Browse the FAQs below\n• Email us at **admineventify2005@gmail.com**\n• Call **+91 70230 17517** (Mon–Sat, 10–7 PM)\n\nOur team typically responds within 24 hours!`;
}

function formatMsg(text) {
  return text
    .split("\n")
    .map((line, i) => {
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
      return `<span key="${i}">${formatted}</span>`;
    })
    .join("<br/>");
}

// ── CONTACT SUPPORT MODAL ────────────────────────────────────────────────────
function ContactSupportModal({ open, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const channels = [
    {
      id: "email",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="26" height="26">
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <polyline points="2,4 12,13 22,4" />
        </svg>
      ),
      label: "Email Support",
      value: "admineventify2005@gmail.com",
      sub: "Reply within 24 hours · Mon–Sat",
      action: () => window.open("mailto:admineventify2005@gmail.com", "_blank"),
      btnLabel: "Send Email",
    },
    {
      id: "phone",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="26" height="26">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 5 5l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
      label: "Call Us",
      value: "+91 70230 17517",
      sub: "Mon – Sat · 10 AM – 7 PM IST",
      action: () => window.open("tel:+917023017517", "_blank"),
      btnLabel: "Call Now",
    },
    {
      id: "whatsapp",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      ),
      label: "WhatsApp",
      value: "+91 70230 17517",
      sub: "Quick replies · Usually within 1 hour",
      action: () => window.open("https://wa.me/917023017517?text=Hi%20Evencers%20Support%2C%20I%20need%20help%20with%20my%20booking.", "_blank"),
      btnLabel: "Open WhatsApp",
      highlight: true,
    },
  ];

  return (
    <div className="csm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="csm-modal" role="dialog" aria-modal="true" aria-label="Contact Support">
        {/* Decorative orbs */}
        <div className="csm-orb csm-orb1" />
        <div className="csm-orb csm-orb2" />

        {/* Header */}
        <div className="csm-header">
          <div className="csm-header-text">
            <p className="csm-eyebrow">We're here for you</p>
            <h2 className="csm-title">Contact Support</h2>
            <p className="csm-sub">Choose how you'd like to reach us — we typically respond within hours.</p>
          </div>
          <button className="csm-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
              <line x1="2" y1="2" x2="14" y2="14" />
              <line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          </button>
        </div>

        {/* Channel Cards */}
        <div className="csm-channels">
          {channels.map((ch) => (
            <div key={ch.id} className={`csm-channel ${ch.highlight ? "highlight" : ""}`}>
              <div className="csm-channel-left">
                <div className={`csm-channel-icon ${ch.id}`}>{ch.icon}</div>
                <div className="csm-channel-info">
                  <p className="csm-channel-label">{ch.label}</p>
                  <p className="csm-channel-value">{ch.value}</p>
                  <p className="csm-channel-sub">{ch.sub}</p>
                </div>
              </div>
              <button className={`csm-channel-btn ${ch.highlight ? "primary" : ""}`} onClick={ch.action}>
                {ch.btnLabel}
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <line x1="3" y1="8" x2="13" y2="8" />
                  <polyline points="9,4 13,8 9,12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="csm-footer-note">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13" style={{flexShrink:0}}>
            <circle cx="8" cy="8" r="6" />
            <line x1="8" y1="7" x2="8" y2="11" />
            <circle cx="8" cy="5" r="0.5" fill="currentColor" />
          </svg>
          For urgent booking issues, WhatsApp is the fastest channel. Have your Booking ID ready.
        </p>
      </div>
    </div>
  );
}

// ── AI CHAT WIDGET ───────────────────────────────────────────────────────────
function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Hello! 👋 I'm **Aria**, your Evencers support assistant.\n\nHow can I help you today? You can ask me about bookings, payments, cancellations, or anything else!`,
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");

    const userMsg = { from: "user", text: msg, time: new Date() };
    setMessages((p) => [...p, userMsg]);
    setTyping(true);

    const delay = 900 + Math.random() * 700;
    setTimeout(() => {
      const reply = getBotReply(msg);
      setTyping(false);
      setMessages((p) => [...p, { from: "bot", text: reply, time: new Date() }]);
      if (!open) setUnread((u) => u + 1);
    }, delay);
  };

  const fmt = (d) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Floating Button */}
      <button
        className={`cc-chat-fab ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat support"
      >
        {open ? (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" width="22" height="22">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="cc-chat-badge">{unread}</span>
        )}
        {!open && (
          <span className="cc-chat-fab-ring" />
        )}
      </button>

      {/* Chat Window */}
      <div className={`cc-chat-window ${open ? "show" : ""}`} role="dialog" aria-label="Chat support">
        {/* Header */}
        <div className="cc-chat-header">
          <div className="cc-chat-header-left">
            <div className="cc-chat-avatar-wrap">
              <div className="cc-chat-bot-avatar">A</div>
              <span className="cc-chat-online-dot" />
            </div>
            <div>
              <p className="cc-chat-bot-name">Aria</p>
              <p className="cc-chat-bot-status">
                <span className="cc-chat-status-dot" />
                Online · Evencers Support
              </p>
            </div>
          </div>
          <button className="cc-chat-close-btn" onClick={() => setOpen(false)} aria-label="Close chat">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <line x1="2" y1="2" x2="14" y2="14" />
              <line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="cc-chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`cc-msg-row ${m.from}`}>
              {m.from === "bot" && (
                <div className="cc-msg-bot-icon">A</div>
              )}
              <div className="cc-msg-bubble-wrap">
                <div
                  className={`cc-msg-bubble ${m.from}`}
                  dangerouslySetInnerHTML={{ __html: formatMsg(m.text) }}
                />
                <span className="cc-msg-time">{fmt(m.time)}</span>
              </div>
            </div>
          ))}

          {typing && (
            <div className="cc-msg-row bot">
              <div className="cc-msg-bot-icon">A</div>
              <div className="cc-msg-bubble bot cc-typing-bubble">
                <span className="cc-dot" /><span className="cc-dot" /><span className="cc-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Chips */}
        <div className="cc-chat-chips">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              className="cc-chip"
              onClick={() => sendMessage(chip)}
              disabled={typing}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="cc-chat-input-row">
          <input
            ref={inputRef}
            className="cc-chat-input"
            placeholder="Type your question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={typing}
          />
          <button
            className={`cc-chat-send ${input.trim() ? "active" : ""}`}
            onClick={() => sendMessage()}
            disabled={!input.trim() || typing}
            aria-label="Send message"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="2" y1="10" x2="17" y2="10" />
              <polyline points="12,5 17,10 12,15" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CustomerCareClient() {
  const [openItem, setOpenItem] = useState(null);
  const [openCategory, setOpenCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = (key) => setOpenItem(openItem === key ? null : key);

  const filteredFAQs = searchQuery.trim()
    ? clientFAQs
        .map((cat) => ({
          ...cat,
          questions: cat.questions.filter(
            (item) =>
              item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.a.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.questions.length > 0)
    : clientFAQs;

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      {/* AI CHAT WIDGET */}
      <AIChatWidget />

      {/* CONTACT SUPPORT MODAL */}
      <ContactSupportModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      <div className="cc-root">
        {/* HERO */}
        <div className="cc-hero">
          <div className="cc-hero-orb cc-orb1" />
          <div className="cc-hero-orb cc-orb2" />
          <div className="cc-hero-inner">
            <span className="cc-eyebrow">
              <Logo /> Client Support
            </span>
            <h1 className="cc-hero-title">
              How can we<br />
              <em>help you today?</em>
            </h1>
            <p className="cc-hero-sub">
              Find answers to common questions about bookings, payments, and more.
            </p>

            {/* Search */}
            <div className="cc-search-wrap">
              <span className="cc-search-icon">⌕</span>
              <input
                className="cc-search-input"
                placeholder="Search your question…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenItem(null);
                }}
              />
              {searchQuery && (
                <button
                  className="cc-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Chat CTA Banner */}
            <div className="cc-chat-cta-banner">
              <div className="cc-chat-cta-left">
                <div className="cc-chat-cta-avatar">A</div>
                <div>
                  <p className="cc-chat-cta-title">Chat with Aria</p>
                  <p className="cc-chat-cta-sub">Get instant answers · No waiting</p>
                </div>
              </div>
              <button
                className="cc-chat-cta-btn"
                onClick={() => {
                  document
                    .querySelector(".cc-chat-fab")
                    ?.click();
                }}
              >
                Start Chat →
              </button>
            </div>
          </div>
        </div>

        {/* CONTACT CARDS */}
        <div className="cc-contact-strip">
          {[
            {
              icon: "✉",
              title: "Email Support",
              desc: "admineventify2005@gmail.com",
              sub: "Reply within 24 hours",
            },
            {
              icon: "💬",
              title: "Live Chat",
              desc: "Chat with Aria instantly",
              sub: "Available now · AI-powered",
            },
            {
              icon: "📞",
              title: "Call Us",
              desc: "+91 7023017517",
              sub: "Mon – Sat, 10 AM – 7 PM",
            },
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
            <div className="cc-eyebrow-dark cc-eyebrow-wrap">
              <Logo />
              <span>Frequently Asked</span>
            </div>
            <h2 className="cc-faq-title">Common Questions</h2>
          </div>

          {filteredFAQs.length === 0 ? (
            <div className="cc-no-results">
              <span>🔍</span>
              <p>
                No results for "<strong>{searchQuery}</strong>"
              </p>
              <button
                className="cc-clear-btn"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="cc-faq-layout">
              {/* Category tabs */}
              {!searchQuery && (
                <div className="cc-cat-tabs">
                  {clientFAQs.map((cat, i) => (
                    <button
                      key={i}
                      className={`cc-cat-tab ${
                        openCategory === i ? "active" : ""
                      }`}
                      onClick={() => {
                        setOpenCategory(i);
                        setOpenItem(null);
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.category}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Questions */}
              <div className="cc-questions">
                {(searchQuery
                  ? filteredFAQs
                  : [filteredFAQs[openCategory]]
                ).map((cat, catI) => (
                  <div key={catI}>
                    {searchQuery && (
                      <p className="cc-cat-label">
                        {cat.icon} {cat.category}
                      </p>
                    )}
                    {cat.questions.map((item, qI) => {
                      const key = `${catI}-${qI}`;
                      const isOpen = openItem === key;
                      return (
                        <div
                          key={qI}
                          className={`cc-faq-item ${isOpen ? "open" : ""}`}
                        >
                          <button
                            className="cc-faq-q"
                            onClick={() => toggle(key)}
                          >
                            <span>{item.q}</span>
                            <span
                              className={`cc-faq-arrow ${isOpen ? "up" : ""}`}
                            >
                              ›
                            </span>
                          </button>
                          <div
                            className={`cc-faq-a-wrap ${isOpen ? "open" : ""}`}
                          >
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
          <div className="cc-eyebrow-dark cc-eyebrow-wrap">
            <span>Still need help?</span>
          </div>
          <h3 className="cc-cta-title">Can't find your answer?</h3>
          <p className="cc-cta-sub">
            Our support team is here for you. Send us a message and we'll get
            back to you within 24 hours.
          </p>
          {/* ── UPDATED: now opens the modal instead of mailto ── */}
          <button
            className="cc-cta-btn"
            onClick={() => setContactModalOpen(true)}
          >
            Contact Support →
          </button>
        </div>

        {/* FOOTER */}
        <footer className="cc-footer">
          <div className="cc-footer-logo">
            <Logo /> Evencers
          </div>
          <p className="cc-footer-copy">
            © 2025 Evencers. Crafted with care in India.
          </p>
        </footer>
      </div>
    </>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────
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

  /* ── HERO ── */
  .cc-hero {
    position: relative; overflow: hidden;
    background: var(--ink); padding: 120px 32px 80px;
    display: flex; align-items: center; justify-content: center;
  }
  .cc-hero-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; pointer-events: none; }
  .cc-orb1 { width: 400px; height: 400px; background: var(--gold); top: -80px; left: -60px; }
  .cc-orb2 { width: 350px; height: 350px; background: #7b5ea7; bottom: -60px; right: -40px; }
  .cc-hero-inner { position: relative; z-index: 2; text-align: center; max-width: 600px; animation: fadeUp 0.6s ease both; }

  .cc-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 16px; border: 1px solid rgba(201,168,76,0.3); padding: 5px 14px; border-radius: 20px; background: rgba(201,168,76,0.08); }
  .cc-eyebrow-dark { display: block; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }

  .cc-hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.4rem, 5vw, 3.4rem); font-weight: 300; color: var(--white); line-height: 1.12; margin-bottom: 16px; }
  .cc-hero-title em { font-style: italic; color: var(--gold-light); }
  .cc-hero-sub { font-size: 14px; color: rgba(245,240,232,0.6); line-height: 1.7; margin-bottom: 28px; }

  /* Search */
  .cc-search-wrap { display: flex; align-items: center; background: var(--white); border-radius: 10px; padding: 6px 6px 6px 16px; gap: 10px; max-width: 500px; margin: 0 auto 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.25); }
  .cc-search-icon { font-size: 18px; color: var(--muted); flex-shrink: 0; }
  .cc-search-input { flex: 1; border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); background: transparent; }
  .cc-search-input::placeholder { color: #bbb4a8; }
  .cc-search-clear { background: none; border: none; font-size: 13px; color: var(--muted); cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.2s; }
  .cc-search-clear:hover { background: var(--surface); color: var(--ink); }

  /* Chat CTA Banner */
  .cc-chat-cta-banner {
    display: flex; align-items: center; justify-content: space-between; gap: 14px;
    background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3);
    border-radius: 12px; padding: 14px 18px; max-width: 500px; margin: 0 auto;
    animation: fadeUp 0.6s 0.15s ease both;
  }
  .cc-chat-cta-left { display: flex; align-items: center; gap: 12px; }
  .cc-chat-cta-avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: var(--gold); color: var(--ink);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600;
    flex-shrink: 0;
  }
  .cc-chat-cta-title { font-size: 13px; font-weight: 500; color: var(--white); margin-bottom: 2px; }
  .cc-chat-cta-sub { font-size: 11px; color: rgba(245,240,232,0.55); }
  .cc-chat-cta-btn {
    padding: 9px 20px; background: var(--gold); color: var(--ink);
    border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500; cursor: pointer;
    white-space: nowrap; transition: all 0.22s; flex-shrink: 0;
  }
  .cc-chat-cta-btn:hover { background: var(--gold-light); transform: translateY(-1px); }

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

  .cc-cat-tabs { display: flex; flex-direction: column; gap: 6px; }
  .cc-cat-tab { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: none; border: 1px solid transparent; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted); cursor: pointer; text-align: left; transition: all 0.2s; }
  .cc-cat-tab:hover { background: var(--white); border-color: var(--border); color: var(--ink); }
  .cc-cat-tab.active { background: var(--white); border-color: var(--gold); color: var(--ink); font-weight: 500; box-shadow: 0 2px 12px rgba(201,168,76,0.12); }

  .cc-questions { display: flex; flex-direction: column; gap: 10px; }
  .cc-cat-label { font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; margin-top: 8px; }

  .cc-faq-item { background: var(--white); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }
  .cc-faq-item.open { border-color: var(--gold); box-shadow: 0 4px 20px rgba(201,168,76,0.1); }
  .cc-faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 22px; background: none; border: none; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--ink); cursor: pointer; text-align: left; transition: background 0.2s; }
  .cc-faq-q:hover { background: var(--surface); }
  .cc-faq-arrow { font-size: 20px; color: var(--gold); flex-shrink: 0; transition: transform 0.25s ease; line-height: 1; }
  .cc-faq-arrow.up { transform: rotate(90deg); }
  .cc-faq-a-wrap { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
  .cc-faq-a-wrap.open { max-height: 300px; }
  .cc-faq-a { font-size: 13.5px; color: var(--muted); line-height: 1.75; padding: 0 22px 20px; }

  .cc-no-results { text-align: center; padding: 60px 20px; }
  .cc-no-results span { font-size: 2.5rem; display: block; margin-bottom: 16px; }
  .cc-no-results p { font-size: 14px; color: var(--muted); margin-bottom: 20px; }
  .cc-no-results strong { color: var(--ink); }
  .cc-clear-btn { padding: 10px 24px; background: var(--ink); color: var(--white); border: none; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: background 0.2s; }
  .cc-clear-btn:hover { background: var(--gold); color: var(--ink); }

  /* CTA */
  .cc-cta { background: var(--ink); text-align: center; padding: 80px 32px; }
  .cc-cta-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 300; color: var(--cream); margin: 10px 0 12px; }
  .cc-cta-sub { font-size: 14px; color: var(--muted); margin-bottom: 28px; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.7; }
  .cc-cta-btn { padding: 15px 36px; background: var(--gold); color: var(--ink); border: none; border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.25s; }
  .cc-cta-btn:hover { background: var(--cream); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.3); }

  /* FOOTER */
  .cc-footer { background: var(--ink); padding: 28px 32px; text-align: center; border-top: 1px solid rgba(201,168,76,0.1); display: flex; flex-direction: column; gap: 8px; align-items: center; }
  .cc-footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--gold); letter-spacing: 0.18em; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
  .cc-footer-copy { font-size: 12px; color: var(--muted); }

  .cc-eyebrow-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
  .cc-eyebrow-wrap img, .cc-eyebrow-wrap svg { width: 26px; height: 26px; }

  /* ════════════════════════════════════════════════
     AI CHAT WIDGET
  ════════════════════════════════════════════════ */

  /* FAB Button */
  .cc-chat-fab {
    position: fixed; bottom: 28px; right: 28px; z-index: 9000;
    width: 58px; height: 58px; border-radius: 50%;
    background: var(--ink); color: var(--white);
    border: 2px solid var(--gold);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 8px 28px rgba(14,12,10,0.35);
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), background 0.25s, box-shadow 0.25s;
  }
  .cc-chat-fab:hover {
    transform: scale(1.1) translateY(-2px);
    background: var(--gold); color: var(--ink);
    box-shadow: 0 12px 36px rgba(201,168,76,0.4);
  }
  .cc-chat-fab.open {
    background: var(--ink); color: var(--white);
    transform: rotate(0deg);
    border-color: rgba(201,168,76,0.4);
  }

  .cc-chat-badge {
    position: absolute; top: -4px; right: -4px;
    width: 20px; height: 20px; border-radius: 50%;
    background: #e05555; color: white; font-size: 10px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid var(--cream);
    font-family: 'DM Sans', sans-serif;
  }

  .cc-chat-fab-ring {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 2px solid rgba(201,168,76,0.35);
    animation: fabRing 2.5s ease-in-out infinite;
  }
  @keyframes fabRing {
    0%   { transform: scale(1);   opacity: 0.7; }
    100% { transform: scale(1.55); opacity: 0;   }
  }

  .cc-chat-window {
    position: fixed;
    bottom: 100px;
    right: 28px;
    z-index: 8999;
    width: 370px;
    max-width: calc(100vw - 20px);
    max-height: 560px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: 0 24px 72px rgba(14,12,10,0.22), 0 0 0 1px rgba(201,168,76,0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: scale(0.88) translateY(20px);
    opacity: 0;
    pointer-events: none;
    transform-origin: bottom right;
    transition: transform 0.32s cubic-bezier(.34,1.26,.64,1), opacity 0.28s ease;
  }
  .cc-chat-window.show {
    transform: scale(1) translateY(0); opacity: 1; pointer-events: auto;
  }

  @media (max-width: 480px) {
    .cc-chat-window {
      right: 12px;
      bottom: 90px;
      width: calc(100vw - 24px);
      max-width: calc(100vw - 24px);
      max-height: 72vh;
      border-radius: 16px;
    }
    .cc-chat-fab { bottom: 20px; right: 16px; }
  }

  /* Chat Header */
  .cc-chat-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 18px; background: var(--ink);
    border-bottom: 1px solid rgba(201,168,76,0.15); flex-shrink: 0;
  }
  .cc-chat-header-left { display: flex; align-items: center; gap: 12px; }
  .cc-chat-avatar-wrap { position: relative; }
  .cc-chat-bot-avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: var(--gold); color: var(--ink);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; font-weight: 600;
  }
  .cc-chat-online-dot {
    position: absolute; bottom: 1px; right: 1px;
    width: 10px; height: 10px; border-radius: 50%;
    background: #3dba7a; border: 2px solid var(--ink);
  }
  .cc-chat-bot-name { font-size: 13.5px; font-weight: 500; color: var(--white); margin-bottom: 2px; }
  .cc-chat-bot-status { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(245,240,232,0.5); }
  .cc-chat-status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #3dba7a; flex-shrink: 0;
    animation: statusBlink 2.2s ease-in-out infinite;
  }
  @keyframes statusBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

  .cc-chat-close-btn {
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50%; width: 28px; height: 28px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: rgba(245,240,232,0.6); transition: all 0.2s; flex-shrink: 0;
  }
  .cc-chat-close-btn:hover { background: rgba(255,255,255,0.16); color: var(--white); }

  /* Messages */
  .cc-chat-messages {
    flex: 1; overflow-y: auto; padding: 18px 14px 10px;
    display: flex; flex-direction: column; gap: 14px;
    scroll-behavior: smooth;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }
  .cc-chat-messages::-webkit-scrollbar { width: 4px; }
  .cc-chat-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .cc-msg-row { display: flex; align-items: flex-end; gap: 8px; }
  .cc-msg-row.user { flex-direction: row-reverse; }

  .cc-msg-bot-icon {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    background: var(--gold); color: var(--ink);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 0.9rem; font-weight: 600;
    margin-bottom: 16px;
  }

  .cc-msg-bubble-wrap { display: flex; flex-direction: column; gap: 3px; max-width: 82%; }
  .cc-msg-row.user .cc-msg-bubble-wrap { align-items: flex-end; }

  .cc-msg-bubble {
    padding: 11px 14px; border-radius: 14px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; line-height: 1.65;
    animation: msgPop 0.26s cubic-bezier(.34,1.4,.64,1) both;
    word-break: break-word;
  }
  .cc-msg-bubble.bot {
    background: var(--surface); color: var(--ink);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
  }
  .cc-msg-bubble.user {
    background: var(--ink); color: var(--white);
    border-bottom-right-radius: 4px;
  }
  .cc-msg-bubble strong { font-weight: 600; }
  .cc-msg-bubble em { font-style: italic; }

  .cc-msg-time { font-size: 10px; color: #c0b8ae; }
  .cc-msg-row.user .cc-msg-time { text-align: right; }

  @keyframes msgPop {
    from { opacity: 0; transform: scale(0.88) translateY(6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Typing dots */
  .cc-typing-bubble {
    display: flex; align-items: center; gap: 5px;
    padding: 14px 18px; width: fit-content;
  }
  .cc-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--gold); opacity: 0.55;
    animation: dotBounce 1.2s ease-in-out infinite;
    flex-shrink: 0;
  }
  .cc-dot:nth-child(2) { animation-delay: 0.18s; }
  .cc-dot:nth-child(3) { animation-delay: 0.36s; }
  @keyframes dotBounce {
    0%,80%,100% { transform: translateY(0); opacity: 0.55; }
    40%         { transform: translateY(-6px); opacity: 1; }
  }

  /* Quick chips */
  .cc-chat-chips {
    display: flex; gap: 6px; padding: 8px 14px;
    overflow-x: auto; flex-shrink: 0;
    border-top: 1px solid var(--border);
    scrollbar-width: none;
  }
  .cc-chat-chips::-webkit-scrollbar { display: none; }
  .cc-chip {
    display: inline-flex; align-items: center; white-space: nowrap;
    padding: 6px 13px; border-radius: 20px;
    background: var(--surface); border: 1px solid var(--border);
    font-family: 'DM Sans', sans-serif; font-size: 11.5px; color: var(--muted);
    cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  }
  .cc-chip:hover:not(:disabled) { background: rgba(201,168,76,0.08); border-color: var(--gold); color: var(--ink); }
  .cc-chip:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Input row */
  .cc-chat-input-row {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 14px; border-top: 1px solid var(--border); flex-shrink: 0;
    background: var(--white);
  }
  .cc-chat-input {
    flex: 1; border: 1px solid var(--border); border-radius: 8px;
    padding: 10px 13px; font-family: 'DM Sans', sans-serif; font-size: 13px;
    color: var(--ink); background: var(--surface); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .cc-chat-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .cc-chat-input::placeholder { color: #c0b8ae; }
  .cc-chat-input:disabled { opacity: 0.6; }

  .cc-chat-send {
    width: 38px; height: 38px; border-radius: 8px; flex-shrink: 0;
    background: var(--surface); border: 1px solid var(--border);
    color: var(--muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.22s;
  }
  .cc-chat-send.active { background: var(--ink); color: var(--white); border-color: var(--ink); }
  .cc-chat-send.active:hover { background: var(--gold); color: var(--ink); border-color: var(--gold); transform: scale(1.05); }
  .cc-chat-send:disabled { opacity: 0.45; cursor: not-allowed; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }


  /* ════════════════════════════════════════════════
     CONTACT SUPPORT MODAL
  ════════════════════════════════════════════════ */

  .csm-overlay {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(14,12,10,0.72);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: csmOverlayIn 0.25s ease both;
  }
  @keyframes csmOverlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .csm-modal {
    position: relative; overflow: hidden;
    background: var(--ink);
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 20px;
    width: 100%; max-width: 500px;
    box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08);
    animation: csmModalIn 0.32s cubic-bezier(.34,1.2,.64,1) both;
    padding: 36px 32px 28px;
  }
  @keyframes csmModalIn {
    from { opacity: 0; transform: scale(0.92) translateY(24px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Decorative orbs inside modal */
  .csm-orb {
    position: absolute; border-radius: 50%;
    filter: blur(80px); opacity: 0.12; pointer-events: none;
  }
  .csm-orb1 { width: 260px; height: 260px; background: var(--gold); top: -80px; right: -60px; }
  .csm-orb2 { width: 200px; height: 200px; background: #4a3f7a; bottom: -60px; left: -40px; }

  /* Header */
  .csm-header {
    position: relative; z-index: 1;
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; margin-bottom: 28px;
  }
  .csm-eyebrow {
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 8px; display: block;
  }
  .csm-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 300; color: var(--white); line-height: 1.1;
    margin-bottom: 8px;
  }
  .csm-sub {
    font-size: 13px; color: rgba(245,240,232,0.5); line-height: 1.65;
  }
  .csm-close {
    flex-shrink: 0; margin-top: 4px;
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(245,240,232,0.55); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .csm-close:hover { background: rgba(255,255,255,0.14); color: var(--white); }

  /* Channel cards */
  .csm-channels {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; gap: 10px;
    margin-bottom: 20px;
  }

  .csm-channel {
    display: flex; align-items: center; justify-content: space-between; gap: 14px;
    padding: 16px 18px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(201,168,76,0.14);
    border-radius: 12px;
    transition: background 0.22s, border-color 0.22s, transform 0.22s;
  }
  .csm-channel:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(201,168,76,0.3);
    transform: translateX(3px);
  }
  .csm-channel.highlight {
    background: rgba(37,211,102,0.07);
    border-color: rgba(37,211,102,0.25);
  }
  .csm-channel.highlight:hover {
    background: rgba(37,211,102,0.12);
    border-color: rgba(37,211,102,0.45);
  }

  .csm-channel-left { display: flex; align-items: center; gap: 14px; min-width: 0; }

  .csm-channel-icon {
    width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(201,168,76,0.12); color: var(--gold);
    border: 1px solid rgba(201,168,76,0.18);
    transition: background 0.2s;
  }
  .csm-channel-icon.whatsapp {
    background: rgba(37,211,102,0.1); color: #25d366;
    border-color: rgba(37,211,102,0.2);
  }
  .csm-channel-icon.phone {
    background: rgba(99,179,237,0.1); color: #63b3ed;
    border-color: rgba(99,179,237,0.2);
  }

  .csm-channel-info { min-width: 0; }
  .csm-channel-label {
    font-size: 13px; font-weight: 500; color: var(--white);
    margin-bottom: 2px;
  }
  .csm-channel-value {
    font-size: 12.5px; color: var(--gold);
    margin-bottom: 2px; font-weight: 400;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .csm-channel.highlight .csm-channel-value { color: #25d366; }
  .csm-channel.phone .csm-channel-value,
  .csm-channel-icon.phone ~ .csm-channel-info .csm-channel-value { color: #63b3ed; }
  .csm-channel-sub { font-size: 11px; color: rgba(245,240,232,0.38); }

  .csm-channel-btn {
    flex-shrink: 0;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    background: rgba(201,168,76,0.12); color: var(--gold);
    border: 1px solid rgba(201,168,76,0.25);
    cursor: pointer; white-space: nowrap;
    transition: all 0.22s;
  }
  .csm-channel-btn:hover {
    background: var(--gold); color: var(--ink);
    border-color: var(--gold); transform: translateY(-1px);
  }
  .csm-channel-btn.primary {
    background: rgba(37,211,102,0.12); color: #25d366;
    border-color: rgba(37,211,102,0.3);
  }
  .csm-channel-btn.primary:hover {
    background: #25d366; color: #0e0c0a;
    border-color: #25d366;
  }

  /* Footer note */
  .csm-footer-note {
    position: relative; z-index: 1;
    display: flex; align-items: flex-start; gap: 7px;
    font-size: 11.5px; color: rgba(245,240,232,0.35);
    line-height: 1.6;
    padding-top: 16px;
    border-top: 1px solid rgba(201,168,76,0.1);
  }

  @media (max-width: 540px) {
    .csm-modal { padding: 28px 20px 22px; border-radius: 16px; }
    .csm-channel { flex-direction: column; align-items: flex-start; }
    .csm-channel-btn { width: 100%; justify-content: center; }
    .csm-title { font-size: 1.6rem; }
  }
`;