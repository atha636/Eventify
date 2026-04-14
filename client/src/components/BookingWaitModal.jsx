export default function BookingWaitModal({ vendor, onClose }) {
  return (
    <div className="bwm-overlay" onClick={onClose}>
      <div className="bwm-modal" onClick={e => e.stopPropagation()}>

        {/* Animated checkmark */}
        <div className="bwm-anim">
          <svg className="bwm-circle" viewBox="0 0 80 80">
            <circle className="bwm-track" cx="40" cy="40" r="36" />
            <circle className="bwm-progress" cx="40" cy="40" r="36" />
          </svg>
          <span className="bwm-tick">✓</span>
        </div>

        <h2 className="bwm-title">Request Sent!</h2>
        <p className="bwm-body">
          Your booking request has been sent to <strong>{vendor?.title}</strong>.
          The vendor will review and confirm soon.
        </p>

        {/* Steps */}
        <div className="bwm-steps">
          <div className="bwm-step bwm-step-done">
            <div className="bwm-step-dot bwm-dot-done">✓</div>
            <div className="bwm-step-text">
              <span className="bwm-step-label">Details Submitted</span>
              <span className="bwm-step-sub">Your info sent to vendor</span>
            </div>
          </div>
          <div className="bwm-step-line bwm-line-done" />
          <div className="bwm-step bwm-step-active">
            <div className="bwm-step-dot bwm-dot-active">◷</div>
            <div className="bwm-step-text">
              <span className="bwm-step-label">Awaiting Confirmation</span>
              <span className="bwm-step-sub">Vendor reviews your request</span>
            </div>
          </div>
          <div className="bwm-step-line" />
          <div className="bwm-step bwm-step-wait">
            <div className="bwm-step-dot bwm-dot-wait">₹</div>
            <div className="bwm-step-text">
              <span className="bwm-step-label">Payment</span>
              <span className="bwm-step-sub">Pay after vendor confirms</span>
            </div>
          </div>
        </div>

        <div className="bwm-info">
          <span className="bwm-info-icon">🔔</span>
          <p>You'll get a notification here when the vendor responds. Check the bell icon in the navbar!</p>
        </div>

        <button className="bwm-btn" onClick={onClose}>
          Got it, I'll wait →
        </button>

      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink:#0e0c0a; --gold:#c9a84c; --gold-light:#e8d5a3;
    --muted:#7a7265; --border:rgba(201,168,76,0.22);
    --surface:#faf7f2; --white:#ffffff;
    --green:#3a8a62; --green-bg:rgba(58,138,98,0.08);
  }

  .bwm-overlay {
    position:fixed; inset:0;
    background:rgba(10,8,6,0.65); backdrop-filter:blur(6px);
    display:flex; align-items:center; justify-content:center;
    z-index:1500; padding:20px;
    animation:bwmFade 0.2s ease both;
  }

  .bwm-modal {
    background:var(--white); border:1px solid var(--border);
    border-radius:20px; padding:44px 36px 36px;
    width:100%; max-width:460px; text-align:center;
    box-shadow:0 40px 100px rgba(10,8,6,0.2);
    animation:bwmUp 0.35s cubic-bezier(0.34,1.2,0.64,1) both;
    /* FIX: prevent modal from being cut off on small screens */
    max-height: 90vh;
    overflow-y: auto;
  }

  /* Custom scrollbar for modal */
  .bwm-modal::-webkit-scrollbar { width: 4px; }
  .bwm-modal::-webkit-scrollbar-track { background: transparent; }
  .bwm-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .bwm-modal::-webkit-scrollbar-thumb:hover { background: var(--gold); }

  /* Animated circle */
  .bwm-anim {
    position:relative; width:80px; height:80px;
    margin:0 auto 20px; display:flex; align-items:center; justify-content:center;
  }
  .bwm-circle { position:absolute; inset:0; transform:rotate(-90deg); }
  .bwm-track {
    fill:none; stroke:rgba(58,138,98,0.1); stroke-width:4;
  }
  .bwm-progress {
    fill:none; stroke:var(--green); stroke-width:4;
    stroke-dasharray:226; stroke-dashoffset:226;
    stroke-linecap:round;
    animation:bwmDraw 0.8s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
  }
  .bwm-tick {
    font-size:1.8rem; color:var(--green);
    animation:bwmPop 0.4s cubic-bezier(0.34,1.6,0.64,1) 0.7s both;
  }

  .bwm-title {
    font-family:'Cormorant Garamond',serif;
    font-size:1.85rem; font-weight:400; font-style:italic;
    color:var(--ink); margin:0 0 10px;
  }
  .bwm-body {
    font-size:13.5px; color:var(--muted);
    line-height:1.65; margin:0 0 28px;
  }
  .bwm-body strong { color:var(--ink); font-weight:500; }

  /* Steps */
  .bwm-steps {
    display:flex; flex-direction:column; align-items:flex-start;
    gap:0; text-align:left; margin-bottom:24px;
    background:var(--surface); border:1px solid var(--border);
    border-radius:14px; padding:16px 18px;
  }
  .bwm-step {
    display:flex; align-items:center; gap:14px;
    padding:6px 0;
  }
  .bwm-step-line {
    width:2px; height:22px; background:var(--border);
    margin-left:14px; border-radius:2px;
  }
  .bwm-line-done { background:var(--green); opacity:0.4; }

  .bwm-step-dot {
    width:30px; height:30px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:13px; font-weight:500; flex-shrink:0;
    border:1.5px solid;
  }
  .bwm-dot-done {
    background:var(--green-bg); border-color:rgba(58,138,98,0.3); color:var(--green);
  }
  .bwm-dot-active {
    background:rgba(201,168,76,0.1); border-color:rgba(201,168,76,0.4); color:var(--gold);
    animation:bwmPulse 2s ease infinite;
  }
  .bwm-dot-wait {
    background:var(--surface); border-color:var(--border); color:var(--muted);
  }

  .bwm-step-text { display:flex; flex-direction:column; gap:2px; }
  .bwm-step-label { font-size:13px; font-weight:500; color:var(--ink); }
  .bwm-step-sub { font-size:11.5px; color:var(--muted); }

  /* Info box */
  .bwm-info {
    display:flex; align-items:flex-start; gap:10px;
    background:rgba(201,168,76,0.07); border:1px solid rgba(201,168,76,0.2);
    border-radius:10px; padding:12px 14px;
    text-align:left; margin-bottom:24px;
  }
  .bwm-info-icon { font-size:1.1rem; flex-shrink:0; margin-top:1px; }
  .bwm-info p { margin:0; font-size:12.5px; color:var(--muted); line-height:1.6; }

  .bwm-btn {
    width:100%; padding:14px 20px;
    background:var(--ink); border:none; border-radius:9px;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500;
    color:var(--white); cursor:pointer;
    transition:all 0.25s;
  }
  .bwm-btn:hover {
    background:var(--gold); color:var(--ink);
    transform:translateY(-2px); box-shadow:0 8px 24px rgba(201,168,76,0.3);
  }

  @keyframes bwmFade { from{opacity:0}to{opacity:1} }
  @keyframes bwmUp {
    from{opacity:0;transform:translateY(24px) scale(0.96)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }
  @keyframes bwmDraw { to { stroke-dashoffset:0; } }
  @keyframes bwmPop {
    from{opacity:0;transform:scale(0.3)}
    to{opacity:1;transform:scale(1)}
  }
  @keyframes bwmPulse {
    0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.3)}
    50%{box-shadow:0 0 0 6px rgba(201,168,76,0)}
  }

  @media (max-width: 520px) {
    .bwm-modal { padding: 32px 18px 28px; border-radius: 16px; }
  }
`;