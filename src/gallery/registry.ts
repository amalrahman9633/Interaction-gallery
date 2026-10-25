import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { ControlValues, InteractionMeta } from "./types";

// Auto-discovery: every folder in src/interactions with a meta.ts shows up.
// Folders that start with "_" (like _template) are skipped.
const metaModules = import.meta.glob<InteractionMeta>(
  ["../interactions/*/meta.ts", "!../interactions/_*/meta.ts"],
  { eager: true, import: "default" },
);

// Components load lazily, so the gallery only downloads what's on screen.
const componentModules = import.meta.glob<{ default: ComponentType<ControlValues> }>([
  "../interactions/*/Interaction.tsx",
  "!../interactions/_*/Interaction.tsx",
]);

export type Entry = {
  meta: InteractionMeta;
  Component: LazyExoticComponent<ComponentType<ControlValues>>;
};

const folderOf = (path: string) => path.split("/").slice(-2, -1)[0];

const entries: Entry[] = Object.entries(metaModules)
  .map(([path, meta]) => {
    const folder = folderOf(path);
    const loader = componentModules[`../interactions/${folder}/Interaction.tsx`];
    if (import.meta.env.DEV) {
      if (meta.slug !== folder) console.warn(`[gallery] meta.slug "${meta.slug}" should match folder "${folder}"`);
      if (meta.kind === "study" && !meta.inspiredBy) console.warn(`[gallery] study "${folder}" needs an inspiredBy credit`);
      if (!loader) console.warn(`[gallery] "${folder}" has meta.ts but no Interaction.tsx`);
    }
    if (!loader) return null;
    return { meta: { ...meta, slug: folder }, Component: lazy(loader) };
  })
  .filter((e): e is Entry => e !== null)
  .sort((a, b) => (b.meta.added ?? "").localeCompare(a.meta.added ?? "") || a.meta.title.localeCompare(b.meta.title));

export const interactions = entries;
export const findInteraction = (slug: string) => entries.find((e) => e.meta.slug === slug);

export const allTags = [...new Set(entries.flatMap((e) => e.meta.tags))].sort();

export const defaultValues = (meta: InteractionMeta): ControlValues =>
  Object.fromEntries(Object.entries(meta.controls).map(([k, c]) => [k, c.default]));

const NEW_WINDOW_DAYS = 21;
export const isNew = (meta: InteractionMeta) => {
  if (!meta.added) return false;
  // Parse as local midnight; a bare "YYYY-MM-DD" would be UTC and look like the future
  // to anyone east of UTC early in the day.
  const age = (Date.now() - new Date(`${meta.added}T00:00:00`).getTime()) / 86_400_000;
  return age >= 0 && age <= NEW_WINDOW_DAYS;
};
