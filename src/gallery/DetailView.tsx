import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { defaultValues, isNew, type Entry } from "./registry";
import { navigate } from "./router";
import Stage from "./Stage";
import SliderPanel from "./SliderPanel";
import { easeOut, layoutSpring } from "./motion";
import styles from "./DetailView.module.css";

// If we got here from the grid, step back in history so back/forward stays natural.
// On a direct link there's nothing to go back to, so push the grid instead.
const close = () => (window.history.state?.inApp ? window.history.back() : navigate("/"));

export default function DetailView({ entry }: { entry: Entry }) {
  const { meta } = entry;
  const [values, setValues] = useState(() => defaultValues(meta));
  const [run, setRun] = useState(0); // bump to remount (replay) the interaction
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus({ preventScroll: true });
    };
  }, []);

  const hasControls = Object.keys(meta.controls).length > 0;

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={meta.title}>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={easeOut}
        onClick={close}
      />

      <div className={styles.layout}>
        <motion.div
          layoutId={`stage-${meta.slug}`}
          className={styles.stage}
          style={{ borderRadius: 18 }}
          transition={layoutSpring}
        >
          <Stage key={run} entry={entry} values={values} />
        </motion.div>

        <motion.aside
          className={styles.panel}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0, transition: { ...easeOut, delay: 0.08 } }}
          exit={{ opacity: 0, x: 16, transition: { duration: 0.18 } }}
        >
          <div className={styles.top}>
            <button ref={closeRef} className={styles.iconButton} onClick={close} aria-label="Back to gallery">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className={styles.textButton} onClick={() => setRun((r) => r + 1)}>
              Replay
            </button>
          </div>

          <header className={styles.head}>
            <div className={styles.badges}>
              <span className={styles.badge}>{meta.kind === "study" ? "Study" : "Original"}</span>
              {isNew(meta) && <span className={`${styles.badge} ${styles.badgeNew}`}>New</span>}
            </div>
            <h2>{meta.title}</h2>
            {meta.kind === "study" && meta.inspiredBy && (
              <p className={styles.credit}>
                Inspired by{" "}
                {meta.inspiredBy.url ? (
                  <a href={meta.inspiredBy.url} target="_blank" rel="noreferrer">
                    {meta.inspiredBy.name}
                  </a>
                ) : (
                  meta.inspiredBy.name
                )}
              </p>
            )}
          </header>

          <p className={styles.note}>{meta.note}</p>

          {hasControls && (
            <SliderPanel
              controls={meta.controls}
              values={values}
              onChange={(key, v) => setValues((prev) => ({ ...prev, [key]: v }))}
              onReset={() => setValues(defaultValues(meta))}
            />
          )}

          {meta.tags.length > 0 && (
            <ul className={styles.tags}>
              {meta.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </motion.aside>
      </div>
    </div>
  );
}
