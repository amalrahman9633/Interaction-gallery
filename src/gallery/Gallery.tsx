import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { allTags, findInteraction, interactions, type Entry } from "./registry";
import { navigate } from "./router";
import Card, { DEFAULT_ASPECT } from "./Card";
import DetailView from "./DetailView";
import Filters, { type KindFilter } from "./Filters";
import TopBar from "./TopBar";
import { easeOut, uiSpring } from "./motion";
import styles from "./Gallery.module.css";

export default function Gallery({ openSlug }: { openSlug?: string }) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const open = openSlug ? findInteraction(openSlug) : undefined;

  // Unknown slug in the URL: quietly go back to the grid.
  useEffect(() => {
    if (openSlug && !open) navigate("/", { replace: true });
  }, [openSlug, open]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return interactions.filter((e) => {
      if (kind !== "all" && e.meta.kind !== kind) return false;
      if (tag && !e.meta.tags.includes(tag)) return false;
      if (!q) return true;
      const haystack = [e.meta.title, e.meta.note, e.meta.inspiredBy?.name ?? "", ...e.meta.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [kind, tag, query]);

  const columns = useColumnCount();
  const layout = useMemo(() => toColumns(visible, columns), [visible, columns]);

  const latest = interactions[0];

  return (
    <LayoutGroup>
      <TopBar query={query} onQuery={setQuery} />

      <div className={styles.page}>
        <motion.section
          className={styles.hero}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut}
        >
          <span className={styles.badge}>
            {interactions.length} interaction{interactions.length === 1 ? "" : "s"}
            {latest?.meta.added && <> · Updated {formatDate(latest.meta.added)}</>}
          </span>
          <h1>Interaction Library</h1>
          <p>
            A growing collection of <em>original interactions</em> and <em>credited studies</em>,
            designed by Amal Rahman and built with AI.
          </p>
          {latest && (
            <motion.button
              className={styles.cta}
              onClick={() => navigate(`/i/${latest.meta.slug}`)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={uiSpring}
            >
              See the latest
            </motion.button>
          )}
        </motion.section>

        <Filters kind={kind} onKind={setKind} tags={allTags} tag={tag} onTag={setTag} />

        <main className={styles.wall} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {layout.map((col, i) => (
            <div key={i} className={styles.col}>
              <AnimatePresence initial={false}>
                {col.map((entry) => (
                  <Card key={entry.meta.slug} entry={entry} isOpen={open?.meta.slug === entry.meta.slug} />
                ))}
              </AnimatePresence>
            </div>
          ))}
        </main>

        {visible.length === 0 && (
          <p className={styles.empty}>
            {interactions.length === 0
              ? "No interactions yet. Run npm run new to start one."
              : "Nothing matches. Try another filter or search."}
          </p>
        )}

        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} Amal Rahman</span>
          <span>Studies recreate patterns only and credit the original.</span>
        </footer>
      </div>

      <AnimatePresence>{open && <DetailView key={open.meta.slug} entry={open} />}</AnimatePresence>
    </LayoutGroup>
  );
}

// Masonry: place each card in whichever column is currently shortest, so columns
// stay balanced while the reading order stays roughly newest-first, left to right.
function toColumns(entries: Entry[], count: number): Entry[][] {
  const cols: Entry[][] = Array.from({ length: count }, () => []);
  const heights = new Array(count).fill(0);
  for (const e of entries) {
    const i = heights.indexOf(Math.min(...heights));
    cols[i].push(e);
    heights[i] += 1 / (e.meta.aspect ?? DEFAULT_ASPECT) + 0.02; // + gap, in card-width units
  }
  return cols;
}

const breakpoints = [
  { query: "(min-width: 1100px)", columns: 3 },
  { query: "(min-width: 700px)", columns: 2 },
];

function getColumnCount() {
  return breakpoints.find((b) => window.matchMedia(b.query).matches)?.columns ?? 1;
}

function subscribeColumns(fn: () => void) {
  const mqs = breakpoints.map((b) => window.matchMedia(b.query));
  mqs.forEach((mq) => mq.addEventListener("change", fn));
  return () => mqs.forEach((mq) => mq.removeEventListener("change", fn));
}

function useColumnCount() {
  return useSyncExternalStore(subscribeColumns, getColumnCount);
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
}
