import { useTheme } from "../theme";

// Sun / moon switch. Pass `className` to borrow the surrounding toolbar's
// button styling (the Navbar passes "nb-bell-btn"); pass `floating` for pages
// that have no Navbar (login, register, admin…).
export default function ThemeToggle({ className = "", floating = false, label = false }) {
  const { isDark, toggle } = useTheme();
  const text = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className={`tt-btn ${floating ? "tt-floating" : ""} ${className}`}
        aria-label={text}
        aria-pressed={isDark}
        title={text}
      >
        <svg
          className="tt-icon"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {isDark ? (
            // sun
            <>
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.55 1.55M17.55 17.55l1.55 1.55M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.55-1.55M17.55 6.45l1.55-1.55" />
            </>
          ) : (
            // moon
            <path d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8Z" />
          )}
        </svg>
        {label && <span className="tt-label">{isDark ? "Light mode" : "Dark mode"}</span>}
      </button>
      <style>{styles}</style>
    </>
  );
}

const styles = `
  .tt-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; background:none; border:none; padding:0; color:inherit; font-family:'DM Sans',sans-serif; }
  .tt-btn .tt-icon { transition: transform 0.45s cubic-bezier(0.34,1.4,0.64,1); }
  .tt-btn:hover .tt-icon { transform: rotate(18deg) scale(1.06); }
  .tt-label { font-size: 13px; }
  .tt-btn:focus-visible { outline: 2px solid var(--gold, #c9a84c); outline-offset: 2px; }

  /* standalone (pages without the Navbar) */
  .tt-floating {
    position: fixed; top: 16px; right: 16px; z-index: 900;
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--white, #fff); color: var(--ink, #0e0c0a);
    border: 1px solid var(--border, rgba(201,168,76,0.25));
    box-shadow: 0 6px 18px rgba(14,12,10,0.12);
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
  }
  .tt-floating:hover { border-color: var(--gold, #c9a84c); transform: translateY(-1px); }
`;