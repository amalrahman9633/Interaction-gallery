import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { allTags, findInteraction, interactions } from "./registry";
import { navigate } from "./router";
import Card from "./Card";
import DetailView from "./DetailView";
import Filters, { type KindFilter } from "./Filters";
import ThemeToggle from "./ThemeToggle";
import { layoutSpring } from "./motion";
import styles from "./Gallery.module.css";

export default function Gallery({ openSlug }: { openSlug?: string }) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [tag, setTag] = useState<string | null>(null);

  const open = openSlug ? findInteraction(openSlug) : undefined;

  // Unknown slug in the URL: quietly go back to the grid.
  useEffect(() => {
    if (openSlug && !open) navigate("/", { replace: true });
  }, [openSlug, open]);

  const visible = useMemo(
    () =>
      interactions.filter(
        (e) => (kind === "all" || e.meta.kind === kind) && (!tag || e.meta.tags.includes(tag)),
      ),
    [kind, tag],
  );

  const counts = useMemo(
    () => ({
      all: interactions.length,
      original: interactions.filter((e) => e.meta.kind === "original").length,
      study: interactions.filter((e) => e.meta.kind === "study").length,
    }),
    [],
  );

  return (
    <LayoutGroup>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <h1>Interaction Library</h1>
            <p>
              A living collection of interactions by Amal Rahman. Originals, plus credited studies of
              patterns from around the web, built with AI.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Filters
          kind={kind}
          onKind={setKind}
          counts={counts}
          tags={allTags}
          tag={tag}
          onTag={setTag}
        />

        <motion.main layout transition={layoutSpring} className={styles.grid}>
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((entry) => (
              <Card key={entry.meta.slug} entry={entry} isOpen={open?.meta.slug === entry.meta.slug} />
            ))}
          </AnimatePresence>
        </motion.main>

        {visible.length === 0 && (
          <p className={styles.empty}>
            {interactions.length === 0
              ? "No interactions yet. Copy src/interactions/_template to get started."
              : "Nothing matches these filters."}
          </p>
        )}

        <footer className={styles.footer}>
          <span>
            {interactions.length} interaction{interactions.length === 1 ? "" : "s"}
          </span>
          <span>Studies recreate patterns only and credit the original.</span>
        </footer>
      </div>

      <AnimatePresence>{open && <DetailView key={open.meta.slug} entry={open} />}</AnimatePresence>
    </LayoutGroup>
  );
}
