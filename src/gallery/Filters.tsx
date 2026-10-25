import type { ReactNode } from "react";
import { motion } from "motion/react";
import { uiSpring } from "./motion";
import styles from "./Filters.module.css";

export type KindFilter = "all" | "original" | "study";

type Props = {
  kind: KindFilter;
  onKind: (k: KindFilter) => void;
  tags: string[];
  tag: string | null;
  onTag: (t: string | null) => void;
};

const kinds: { id: KindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "original", label: "Originals" },
  { id: "study", label: "Studies" },
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Filters({ kind, onKind, tags, tag, onTag }: Props) {
  return (
    <nav className={styles.row} aria-label="Filter interactions">
      <div className={styles.group} role="radiogroup" aria-label="Kind">
        {kinds.map((k) => (
          <Chip key={k.id} active={kind === k.id} pillId="kind-pill" role="radio" onClick={() => onKind(k.id)}>
            {k.label}
          </Chip>
        ))}
      </div>

      {tags.length > 0 && <span className={styles.divider} aria-hidden />}

      <div className={styles.group}>
        {tags.map((t) => (
          <Chip key={t} active={tag === t} pillId="tag-pill" onClick={() => onTag(tag === t ? null : t)}>
            {capitalize(t)}
          </Chip>
        ))}
      </div>
    </nav>
  );
}

function Chip({
  active,
  pillId,
  role,
  onClick,
  children,
}: {
  active: boolean;
  pillId: string;
  role?: "radio";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      className={styles.chip}
      data-active={active}
      role={role}
      aria-checked={role ? active : undefined}
      aria-pressed={role ? undefined : active}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={uiSpring}
    >
      {/* One pill per group slides between chips instead of each chip snapping on. */}
      {active && <motion.span layoutId={pillId} className={styles.pill} transition={uiSpring} />}
      <span className={styles.label}>{children}</span>
    </motion.button>
  );
}
