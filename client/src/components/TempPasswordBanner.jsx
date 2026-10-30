import { useState } from "react";

// Floating banner shown when the logged-in user has `mustChangePassword`
// set (i.e. an admin created their account and emailed them a temp
// password). Doesn't push page content around — floats just under the
// navbar so it never fights with each page's own top padding.
//
// Dismissing it only hides it for this browser tab/session; it comes
// back on next login until the password is actually changed (since
// that's tracked server-side via mustChangePassword).
export default function TempPasswordBanner({ onChangePasswordClick }) {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("tempPwBannerDismissed") === "1"
  );

  if (dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem("tempPwBannerDismissed", "1");
    setDismissed(true);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="tpb-banner" role="alert">
        <span className="tpb-icon">⚠</span>
        <span className="tpb-text">
          You're signed in with a <strong>temporary password</strong>. Please change it in your profile.
        </span>
        <button className="tpb-cta" onClick={onChangePasswordClick}>Change Now</button>
        <button className="tpb-close" onClick={dismiss} aria-label="Dismiss">✕</button>
      </div>
    </>
  );
}

const styles = `
  .tpb-banner {
    position: fixed;
    top: 78px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 150;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fdf6e3;
    border: 1px solid rgba(201,168,76,0.4);
    color: var(--ink);
    border-radius: 10px;
    padding: 10px 14px;
    box-shadow: 0 10px 30px rgba(14,12,10,0.14);
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px;
    max-width: calc(100vw - 32px);
  }
  .tpb-icon { color: #b8902a; font-size: 14px; flex-shrink: 0; }
  .tpb-text { line-height: 1.4; }
  .tpb-cta {
    background: var(--btn-bg); color: var(--btn-fg); border: none; border-radius: 6px;
    padding: 6px 12px; font-size: 11.5px; font-weight: 500; cursor: pointer;
    white-space: nowrap; flex-shrink: 0;
  }
  .tpb-cta:hover { background: #c9a84c; color: var(--on-gold); }
  .tpb-close {
    background: none; border: none; color: var(--muted); cursor: pointer;
    font-size: 11px; padding: 2px; flex-shrink: 0;
  }
  @media (max-width: 560px) {
    .tpb-banner { top: 70px; flex-wrap: wrap; }
  }
`;