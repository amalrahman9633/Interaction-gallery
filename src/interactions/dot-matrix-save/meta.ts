import type { InteractionMeta } from "../../gallery/types";

const meta: InteractionMeta = {
  slug: "dot-matrix-save",
  title: "Dot Matrix Save",
  kind: "original",
  inspiredBy: undefined,
  note: "A save button that turns into a tiny LED grid. A rounded block of lit dots sweeps across it, stepping a whole column at a time like a real dot-matrix display, then the grid melts away into a check.",
  tags: ["button", "click", "loading", "canvas"],
  added: "2026-10-26",
  controls: {
    sweepDuration: { type: "number", min: 0.4, max: 4, step: 0.1, default: 1.4, label: "Sweep duration", unit: "s" },
    trail: { type: "number", min: 0, max: 8, step: 1, default: 3, label: "Trail length" },
    columns: { type: "number", min: 10, max: 32, step: 1, default: 20, label: "Grid columns" },
    fontSize: { type: "number", min: 12, max: 40, step: 1, default: 20, label: "Size", unit: "px" },
    resetDelay: { type: "number", min: 0, max: 6, step: 0.1, default: 2.2, label: "Reset after", unit: "s" },
    label: { type: "text", default: "Save changes", label: "Label" },
    doneLabel: { type: "text", default: "Saved", label: "Done label" },
    matchTheme: { type: "boolean", default: true, label: "Match theme" },
    inkColor: { type: "color", default: "#0a0a0a", label: "Ink (when not matching)" },
    dotColor: { type: "color", default: "#dcdcdc", label: "Unlit dots (when not matching)" },
  },
};

export default meta;
