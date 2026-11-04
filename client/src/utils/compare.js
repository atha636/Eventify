import { useEffect, useState, useCallback } from "react";

// The "compare vendors" shortlist. Stored in localStorage so it survives navigation and refresh,
// and shared between components through a small custom event.
export const MAX_COMPARE = 3;
const KEY = "evencers-compare";
const EVT = "compare-changed";

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX_COMPARE) : [];
  } catch { return []; }
};
const write = (ids) => {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* private mode: selection just won't persist */ }
  window.dispatchEvent(new Event(EVT));
};

export function useCompare() {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);

  // returns false when the shortlist is full
  const toggle = useCallback((id) => {
    const cur = read();
    if (cur.includes(id)) { write(cur.filter((x) => x !== id)); return true; }
    if (cur.length >= MAX_COMPARE) return false;
    write([...cur, id]);
    return true;
  }, []);
  const remove = useCallback((id) => write(read().filter((x) => x !== id)), []);
  const clear  = useCallback(() => write([]), []);

  return { ids, toggle, remove, clear, full: ids.length >= MAX_COMPARE };
}