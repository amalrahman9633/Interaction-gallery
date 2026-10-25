import { motion } from "motion/react";
import { uiSpring } from "./motion";
import styles from "./Filters.module.css";

export type KindFilter = "all" | "original" | "study";

type Props = {
  kind: KindFilter;
  onKind: (k: KindFilter) => void;
  counts: Record<KindFilter, number>;
  tags: string[];
  tag: string | null;
  onTag: (t: string | null) => void;
};

const kinds: { id: KindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "original", label: "Originals" },
  { id: "study", label: "Studies" },
];

export default function Filters({ kind, onKind, counts, tags, tag, onTag }: Props) {
  return (
    <nav className={styles.bar} aria-label="Filter interactions">
      <div className={styles.segment} role="radiogroup" aria-label="Kind">
        {kinds.map((k) => (
          <button
            key={k.id}
            role="radio"
            aria-checked={kind === k.id}
            className={styles.segmentItem}
            data-active={kind === k.id}
            onClick={() => onKind(k.id)}
          >
            {kind === k.id && (
              <motion.span layoutId="kind-pill" className={styles.pill} transition={uiSpring} />
            )}
            <span className={styles.label}>
              {k.label}
              <span className={styles.count}>{counts[k.id]}</span>
            </span>
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map((t) => {
            const active = tag === t;
            return (
              <motion.button
                key={t}
                className={styles.tag}
                data-active={active}
                aria-pressed={active}
                onClick={() => onTag(active ? null : t)}
                whileTap={{ scale: 0.94 }}
                transition={uiSpring}
              >
                {t}
              </motion.button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
