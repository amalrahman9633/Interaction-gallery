import type { InteractionMeta } from "../../gallery/types";

const meta: InteractionMeta = {
  slug: "_template", // must match the folder name
  title: "Template",
  kind: "original", // "original" | "study"
  inspiredBy: undefined, // studies only: { name: "Who/what it recreates", url: "https://..." }
  note: "One or two sentences on the design intent or what was learned.",
  tags: ["cursor"],
  added: "2026-01-01", // YYYY-MM-DD; newest shows first, recent ones get a "New" badge
  // background: "#0b0b0c", // optional: fixed scene color instead of the theme surface
  controls: {
    // Each key must match a prop name on the component.
    // Types: number { min, max, step, unit }, color, boolean, text, select { options }
    color: { type: "color", default: "#ff5b2e", label: "Color" },
    size: { type: "number", min: 8, max: 160, step: 1, default: 48, label: "Size", unit: "px" },
    smoothing: { type: "number", min: 0.02, max: 1, step: 0.01, default: 0.12, label: "Smoothing" },
  },
};

export default meta;
