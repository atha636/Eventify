import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import PaymentModal from "./PaymentModal";

// ── All notification types that exist in your Notification model ──
const TYPE_META = {
  booking_received:      { icon: "📋", color: "#c9a84c", bg: "rgba(201,168,76,0.08)"  },
  booking_approved:      { icon: "✓",  color: "#3a8a62", bg: "rgba(58,138,98,0.08)"   },
  booking_rejected:      { icon: "✕",  color: "#b85c5c", bg: "rgba(184,92,92,0.08)"   },
  payment_pending:       { icon: "💳", color: "#c9a84c", bg: "rgba(201,168,76,0.08)"  },
  payment_done:          { icon: "₹",  color: "#3a8a62", bg: "rgba(58,138,98,0.08)"   },
  service_updated:       { icon: "🔧", color: "#7a7265", bg: "rgba(122,114,101,0.08)" },
  service_live_soon:     { icon: "🚀", color: "#c9a84c", bg: "rgba(201,168,76,0.08)"  },
  profile_rejected:      { icon: "⚠",  color: "#b85c5c", bg: "rgba(184,92,92,0.08)"   },
  date_change_requested: { icon: "📅", color: "#c9a84c", bg: "rgba(201,168,76,0.08)"  },
  date_change_approved:  { icon: "✓",  color: "#3a8a62", bg: "rgba(58,138,98,0.08)"   },
  date_change_rejected:  { icon: "✕",  color: "#b85c5c", bg: "rgba(184,92,92,0.08)"   },
  vendor_verified:       { icon: "🏅", color: "#3a8a62", bg: "rgba(58,138,98,0.08)"   },
  vendor_unverified:     { icon: "⚠",  color: "#b85c5c", bg: "rgba(184,92,92,0.08)"   },
};

// Fallback for any future types not yet listed above
const DEFAULT_META = { icon: "🔔", color: "#c9a84c", bg: "rgba(201,168,76,0.08)" };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationPanel({ onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]         = useState(0);
  const [loading,       setLoading]        = useState(true);
  const [paymentTarget, setPaymentTarget]  = useState(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // ── Get current user role from localStorage ──────────────────
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const isVendor = user?.role === "vendor";

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    // Small delay so the click that opened the panel doesn't close it immediately
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  // Fetch notifications
  const fetchNotifs = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications || []);
      const count = res.data.unreadCount || 0;
      setUnread(count);
      onUnreadChange?.(count);
    } catch (err) {
      console.error("Notif fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, []);

  // Mark all read after 1.5s (so user has a moment to see the new badge)
  useEffect(() => {
    const markRead = async () => {
      try {
        await API.patch("/notifications/read-all");
        setUnread(0);
        onUnreadChange?.(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (e) {
        console.error("Mark-read error:", e);
      }
    };
    const t = setTimeout(markRead, 1500);
    return () => clearTimeout(t);
  }, []);

  // ── Notification click handler ────────────────────────────────
  const handleNotifClick = (notif) => {
    // Payment notifications: open PaymentModal directly if booking is populated
    if (notif.type === "payment_pending" && notif.bookingId?._id) {
      handlePayNow(notif);
      return;
    }
    // All other types → navigate to the right dashboard
    onClose();
    if (isVendor) {
      navigate("/vendor-dashboard");
    } else {
      navigate("/my-bookings");
    }
  };

  const handlePayNow = (notif) => {
    // bookingId is populated by the notification route
    const booking = notif.bookingId;
    const vendor  = booking?.vendorId;
    if (!booking) {
      // Fallback: just navigate
      onClose();
      navigate("/my-bookings");
      return;
    }
    setPaymentTarget({ booking, vendor });
    onClose();
  };

  const handlePaymentSuccess = () => setPaymentTarget(null);

  if (paymentTarget) {
    return (
      <PaymentModal
        booking={paymentTarget.booking}
        vendor={paymentTarget.vendor}
        onSuccess={handlePaymentSuccess}
        onClose={() => setPaymentTarget(null)}
      />
    );
  }

  return (
    <div className="np-panel" ref={panelRef} role="dialog" aria-label="Notifications">
      {/* Header */}
      <div className="np-header">
        <div className="np-header-left">
          <span className="np-title">Notifications</span>
          {unread > 0 && (
            <span className="np-unread-pill" aria-label={`${unread} unread`}>
              {unread} new
            </span>
          )}
        </div>
        <button className="np-close" onClick={onClose} aria-label="Close notifications">✕</button>
      </div>

      {/* Body */}
      <div className="np-body">
        {loading ? (
          <div className="np-loading" aria-busy="true" aria-label="Loading notifications">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="np-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="np-empty" role="status">
            <span className="np-empty-icon" aria-hidden="true">🔔</span>
            <p>No notifications yet</p>
            <span>Booking updates will appear here</span>
          </div>
        ) : (
          <div className="np-list" role="list">
            {notifications.map((notif) => {
              const meta      = TYPE_META[notif.type] || DEFAULT_META;
              const isPayment = notif.type === "payment_pending" && notif.bookingId?._id;
              const booking   = notif.bookingId;

              return (
                <div
                  key={notif._id}
                  role="listitem"
                  className={`np-item ${!notif.isRead ? "np-item-unread" : ""} np-item-clickable`}
                  onClick={() => handleNotifClick(notif)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNotifClick(notif); }}
                  aria-label={`${notif.title}. ${notif.isRead ? "" : "Unread."} ${timeAgo(notif.createdAt)}`}
                >
                  {/* Unread dot */}
                  {!notif.isRead && <span className="np-dot" aria-hidden="true" />}

                  {/* Icon */}
                  <div
                    className="np-icon"
                    style={{ background: meta.bg, color: meta.color }}
                    aria-hidden="true"
                  >
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="np-content">
                    <p className="np-notif-title">{notif.title}</p>
                    <p className="np-notif-msg">{notif.message}</p>
                    <span className="np-time">{timeAgo(notif.createdAt)}</span>

                    {/* Pay Now button — only for payment_pending with a populated booking */}
                    {isPayment && (
                      <button
                        className="np-pay-btn"
                        onClick={(e) => { e.stopPropagation(); handlePayNow(notif); }}
                        aria-label={`Pay now ₹${booking?.packagePrice?.toLocaleString() || "—"}`}
                      >
                        💳 Pay Now — ₹{booking?.packagePrice?.toLocaleString() || "—"}
                      </button>
                    )}

                    {/* Navigation hint */}
                    <span className="np-nav-hint" aria-hidden="true">
                      {isVendor ? "View in Dashboard →" : "View Booking →"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink:#0e0c0a; --gold:#c9a84c; --gold-light:#e8d5a3;
    --muted:#7a7265; --border:rgba(201,168,76,0.2);
    --surface:#faf7f2; --white:#ffffff;
  }

  .np-panel {
    position:fixed; top:72px; right:24px;
    width:360px; max-height:520px;
    background:var(--white); border:1px solid var(--border);
    border-radius:16px;
    box-shadow:0 24px 80px rgba(10,8,6,0.18), 0 0 0 1px rgba(255,255,255,0.4) inset;
    display:flex; flex-direction:column;
    z-index:500;
    animation:npSlide 0.28s cubic-bezier(0.34,1.1,0.64,1) both;
    overflow:hidden;
  }

  .np-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 18px 14px;
    border-bottom:1px solid var(--border);
    background:var(--surface);
    flex-shrink:0;
  }
  .np-header-left { display:flex; align-items:center; gap:8px; }
  .np-title {
    font-family:'Cormorant Garamond',serif;
    font-size:1.15rem; font-weight:600; color:var(--ink);
    letter-spacing:0.03em;
  }
  .np-unread-pill {
    font-size:10px; font-weight:500; letter-spacing:0.05em;
    padding:2px 8px; border-radius:20px;
    background:var(--gold); color:var(--ink);
  }
  .np-close {
    width:26px; height:26px; border-radius:50%;
    background:transparent; border:1px solid var(--border);
    color:var(--muted); font-size:12px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:all 0.2s;
  }
  .np-close:hover { border-color:var(--muted); color:var(--ink); }
  .np-close:focus-visible { outline:2px solid var(--gold); outline-offset:2px; }

  .np-body { overflow-y:auto; flex:1; }
  .np-body::-webkit-scrollbar { width:4px; }
  .np-body::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }

  /* List */
  .np-list { display:flex; flex-direction:column; }
  .np-item {
    position:relative; display:flex; gap:12px;
    padding:14px 18px;
    border-bottom:1px solid rgba(201,168,76,0.08);
    transition:background 0.2s, border-left 0.15s, padding-left 0.15s;
    cursor:pointer;
    outline:none;
  }
  .np-item:last-child { border-bottom:none; }
  .np-item:hover { background:var(--surface); }
  .np-item:focus-visible { outline:2px solid var(--gold); outline-offset:-2px; }
  .np-item-unread { background:rgba(201,168,76,0.04); }

  .np-item-clickable:hover {
    background:rgba(201,168,76,0.06);
    border-left:3px solid var(--gold);
    padding-left:15px;
  }

  .np-dot {
    position:absolute; top:18px; right:14px;
    width:7px; height:7px; border-radius:50%;
    background:var(--gold);
    box-shadow:0 0 0 2px rgba(201,168,76,0.25);
    animation:npDotPulse 2s ease infinite;
    flex-shrink:0;
  }

  .np-icon {
    width:36px; height:36px; border-radius:10px;
    display:flex; align-items:center; justify-content:center;
    font-size:1rem; flex-shrink:0; margin-top:2px;
  }

  .np-content { flex:1; min-width:0; }
  .np-notif-title {
    font-size:13px; font-weight:500; color:var(--ink);
    margin:0 0 3px; line-height:1.3;
  }
  .np-notif-msg {
    font-size:12px; color:var(--muted);
    line-height:1.5; margin:0 0 5px;
  }
  .np-time { font-size:10.5px; color:rgba(122,114,101,0.7); letter-spacing:0.03em; }

  /* Navigation hint */
  .np-nav-hint {
    display:block;
    margin-top:5px;
    font-size:10.5px;
    color:var(--gold);
    font-weight:500;
    letter-spacing:0.03em;
    opacity:0;
    transition:opacity 0.2s;
  }
  .np-item-clickable:hover .np-nav-hint { opacity:1; }

  /* Pay Now button */
  .np-pay-btn {
    display:inline-flex; align-items:center; gap:6px;
    margin-top:9px;
    padding:8px 14px;
    background:var(--gold); border:none; border-radius:7px;
    font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500;
    color:var(--ink); cursor:pointer;
    transition:all 0.22s;
    animation:npPayPulse 2.5s ease infinite;
  }
  .np-pay-btn:hover {
    background:var(--ink); color:var(--white);
    transform:translateY(-1px);
    box-shadow:0 6px 18px rgba(14,12,10,0.2);
    animation:none;
  }
  .np-pay-btn:focus-visible { outline:2px solid var(--gold); outline-offset:2px; }

  /* Empty */
  .np-empty {
    display:flex; flex-direction:column; align-items:center;
    padding:48px 20px; text-align:center; gap:8px;
  }
  .np-empty-icon { font-size:2.2rem; margin-bottom:4px; }
  .np-empty p { font-size:14px; font-weight:500; color:var(--ink); margin:0; }
  .np-empty span { font-size:12px; color:var(--muted); }

  /* Skeleton */
  .np-loading { padding:8px 0; }
  .np-skeleton {
    height:72px; margin:4px 12px;
    border-radius:10px;
    background:linear-gradient(90deg,#ede8e0 25%,#e5dfd4 50%,#ede8e0 75%);
    background-size:200% 100%;
    animation:npShimmer 1.4s ease infinite;
  }

  @keyframes npSlide {
    from { opacity:0; transform:translateY(-12px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes npDotPulse {
    0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)}
    50%{box-shadow:0 0 0 4px rgba(201,168,76,0)}
  }
  @keyframes npPayPulse {
    0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)}
    50%{box-shadow:0 0 0 5px rgba(201,168,76,0)}
  }
  @keyframes npShimmer {
    0%{background-position:200% 0}100%{background-position:-200% 0}
  }

  @media (max-width:420px) {
    .np-panel { right:12px; left:12px; width:auto; top:64px; }
  }
`;