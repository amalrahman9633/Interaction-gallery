import { forwardRef, useRef, type PointerEvent } from "react";
import { motion, useInView } from "motion/react";
import { isNew, type Entry } from "./registry";
import { navigate } from "./router";
import Stage from "./Stage";
import { easeOut, layoutSpring } from "./motion";
import styles from "./Card.module.css";

type Props = { entry: Entry; isOpen: boolean };

export const DEFAULT_ASPECT = 3 / 2;

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
      layoutId={`card-${meta.slug}`}
      className={styles.card}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      transition={{ ...layoutSpring, opacity: easeOut }}
    >
      <div
        ref={frameRef}
        className={styles.frame}
        style={{ aspectRatio: meta.aspect ?? DEFAULT_ASPECT }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {isOpen ? (
          <div className={styles.placeholder} />
        ) : (
          <motion.div layoutId={`stage-${meta.slug}`} className={styles.stage} style={{ borderRadius: 28 }} transition={layoutSpring}>
            {inView && <Stage entry={entry} />}
          </motion.div>
        )}

        <div className={styles.badges}>
          {isNew(meta) && <span className={`${styles.badge} ${styles.badgeNew}`}>New</span>}
          {meta.kind === "study" && <span className={styles.badge}>Study</span>}
        </div>

        <div className={styles.label}>
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
          {meta.kind === "study" && meta.inspiredBy && (
            <span className={styles.credit}>after {meta.inspiredBy.name}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
});

export default Card;
