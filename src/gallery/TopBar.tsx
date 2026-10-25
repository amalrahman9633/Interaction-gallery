import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import styles from "./TopBar.module.css";

type Props = { query: string; onQuery: (q: string) => void };

export default function TopBar({ query, onQuery }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // ⌘K / Ctrl+K or "/" jumps to search, like most component libraries.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest("input, textarea, select, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className={styles.bar} data-scrolled={scrolled}>
      <a
        href="/"
        className={styles.brand}
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <span className={styles.mark} aria-hidden>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="4.5" fill="currentColor" />
          </svg>
        </span>
        <span className={styles.name}>Amal Rahman</span>
      </a>

      <label className={styles.search}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search"
          aria-label="Search interactions"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onQuery("");
              e.currentTarget.blur();
            }
          }}
        />
        {!query && <kbd className={styles.kbd}>{isMac ? "⌘K" : "Ctrl K"}</kbd>}
      </label>

      <div className={styles.end}>
        <ThemeToggle />
      </div>
    </header>
  );
}
