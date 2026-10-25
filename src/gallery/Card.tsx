import { forwardRef, useRef, type PointerEvent } from "react";
import { motion, useInView } from "motion/react";
import { isNew, type Entry } from "./registry";
import { navigate } from "./router";
import Stage from "./Stage";
import { easeOut, layoutSpring } from "./motion";
import styles from "./Card.module.css";

type Props = { entry: Entry; isOpen: boolean };

const Card = forwardRef<HTMLElement, Props>(function Card({ entry, isOpen }, ref) {
  const { meta } = entry;
  const frameRef = useRef<HTMLDivElement>(null);
  // Live only while near the viewport. Unmounting off-screen tiles keeps a big grid
  // smooth and frees WebGL contexts (browsers cap them at ~16).
  const inView = useInView(frameRef, { margin: "200px 0px" });

  // Treat it as a click only if the pointer barely moved, so dragging inside an
  // interaction doesn't accidentally open the detail view.
  const down = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: PointerEvent) => (down.current = { x: e.clientX, y: e.clientY });
  const onPointerUp = (e: PointerEvent) => {
    const d = down.current;
    down.current = null;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) open();
  };
  const open = () => navigate(`/i/${meta.slug}`);

  return (
    <motion.article
      ref={ref}
      layout
      className={styles.card}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ ...layoutSpring, opacity: easeOut }}
    >
      <div
        ref={frameRef}
        className={styles.frame}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {isOpen ? (
          <div className={styles.placeholder} />
        ) : (
          <motion.div layoutId={`stage-${meta.slug}`} className={styles.stage} style={{ borderRadius: 18 }} transition={layoutSpring}>
            {inView && <Stage entry={entry} />}
          </motion.div>
        )}
        <span className={styles.expand} aria-hidden>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 1.5h4v4M5.5 12.5h-4v-4M12.5 1.5 8 6M1.5 12.5 6 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <div className={styles.info}>
        <a
          href={`/i/${meta.slug}`}
          className={styles.title}
          onClick={(e) => {
            e.preventDefault();
            open();
          }}
        >
          {meta.title}
        </a>
        <span className={styles.kind}>
          {isNew(meta) && <span className={styles.new}>New</span>}
          {meta.kind === "study" ? "Study" : "Original"}
        </span>
      </div>
      {meta.kind === "study" && meta.inspiredBy && (
        <p className={styles.credit}>after {meta.inspiredBy.name}</p>
      )}
    </motion.article>
  );
});

export default Card;
