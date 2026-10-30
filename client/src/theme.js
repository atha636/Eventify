import { useCallback, useEffect, useState } from "react";

// ── Evencers theme manager ───────────────────────────────────────────
// The active theme lives on <html data-theme="light|dark">. A tiny inline
// script in index.html sets it before first paint (no white flash), and this
// module keeps it in sync afterwards.
//
// Priority: the visitor's saved choice → their device setting → light.

const KEY = "evencers-theme";
const META_COLORS = { light: "#0e0c0a", dark: "#0d0b09" };

const read = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
};

const systemTheme = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

export const getTheme = () => document.documentElement.dataset.theme || read() || systemTheme();

export function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.backgroundColor = ""; // clears the pre-paint colour set by the inline script in index.html
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", META_COLORS[theme]);
}

export function setTheme(theme, { animate = true } = {}) {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (animate && !reduceMotion) {
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 380);
  }
  try { localStorage.setItem(KEY, theme); } catch { /* private mode — keep in memory only */ }
  applyTheme(theme);
  window.dispatchEvent(new Event("evencers-themechange"));
}

export function useTheme() {
  const [theme, setThemeState] = useState(getTheme);

  useEffect(() => {
    const sync = () => setThemeState(getTheme());
    window.addEventListener("evencers-themechange", sync);
    window.addEventListener("storage", sync);

    // Follow the device setting live — but only until the visitor picks one
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (!read()) { applyTheme(systemTheme()); sync(); }
    };
    mq?.addEventListener?.("change", onSystem);

    return () => {
      window.removeEventListener("evencers-themechange", sync);
      window.removeEventListener("storage", sync);
      mq?.removeEventListener?.("change", onSystem);
    };
  }, []);

  const toggle = useCallback(() => setTheme(getTheme() === "dark" ? "light" : "dark"), []);

  return { theme, isDark: theme === "dark", toggle, setTheme };
}