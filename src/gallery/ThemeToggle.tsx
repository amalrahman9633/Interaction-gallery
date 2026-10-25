import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { uiSpring } from "./motion";
import styles from "./ThemeToggle.module.css";

type Theme = "light" | "dark";

// Dark is the default look; light is remembered once a visitor picks it.
const readTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode: theme just won't persist */
    }
  };

  return (
    <motion.button
      className={styles.toggle}
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      whileTap={{ scale: 0.9 }}
      transition={uiSpring}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.svg
          key={theme}
          width="16"
          height="16"
          viewBox="0 0 18 18"
          fill="none"
          initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
          transition={uiSpring}
        >
          {theme === "dark" ? (
            <path d="M15 10.6A6.5 6.5 0 0 1 7.4 3a6.5 6.5 0 1 0 7.6 7.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          ) : (
            <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="9" cy="9" r="3.2" />
              <path d="M9 1.5v1.6M9 14.9v1.6M1.5 9h1.6M14.9 9h1.6M3.7 3.7l1.1 1.1M13.2 13.2l1.1 1.1M3.7 14.3l1.1-1.1M13.2 4.8l1.1-1.1" />
            </g>
          )}
        </motion.svg>
      </AnimatePresence>
    </motion.button>
  );
}
