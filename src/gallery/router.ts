import { useSyncExternalStore } from "react";

// A tiny history-based router. Enough for three routes, no dependency needed.

export type Route =
  | { name: "gallery"; slug?: string }
  | { name: "playground"; slug?: string };

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener("popstate", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("popstate", fn);
  };
};

export function navigate(path: string, { replace = false } = {}) {
  if (path === window.location.pathname) return;
  if (replace) window.history.replaceState(null, "", path);
  else window.history.pushState({ inApp: true }, "", path);
  listeners.forEach((fn) => fn());
}

export function parse(pathname: string): Route {
  const parts = pathname.split("/").filter(Boolean);
  if (import.meta.env.DEV && parts[0] === "playground") return { name: "playground", slug: parts[1] };
  if (parts[0] === "i" && parts[1]) return { name: "gallery", slug: parts[1] };
  return { name: "gallery" };
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}
