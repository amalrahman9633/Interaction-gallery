import type { InteractionMeta } from "../../gallery/types";

const meta: InteractionMeta = {
  slug: "dot-matrix-save",
  title: "Dot Matrix Save",
  kind: "original",
  inspiredBy: undefined,
  note: "A save button that turns into a tiny LED grid. A rounded block of lit dots swings back and forth across it, pulsing as it goes and stepping a whole column at a time like a real dot-matrix display, then makes one last pass and melts away into a check.",
  tags: ["button", "click", "loading", "canvas"],
  added: "2026-10-26",
  controls: {
    pulseDuration: { type: "number", min: 0.5, max: 4, step: 0.1, default: 2, label: "Pulse duration", unit: "s" },
    pulses: { type: "number", min: 1, max: 5, step: 1, default: 2, label: "Back-and-forth swings" },
    pulseSize: { type: "number", min: 0, max: 0.5, step: 0.02, default: 0.18, label: "Pulse swell" },
    sweepDuration: { type: "number", min: 0.3, max: 2, step: 0.05, default: 0.8, label: "Final pass", unit: "s" },
    columns: { type: "number", min: 6, max: 28, step: 1, default: 14, label: "Grid columns" },
    fontSize: { type: "number", min: 12, max: 40, step: 1, default: 20, label: "Size", unit: "px" },
    resetDelay: { type: "number", min: 0, max: 6, step: 0.1, default: 2.2, label: "Reset after", unit: "s" },
    label: { type: "text", default: "Save changes", label: "Label" },
    doneLabel: { type: "text", default: "Saved", label: "Done label" },
    matchTheme: { type: "boolean", default: true, label: "Match theme" },
    inkColor: { type: "color", default: "#0a0a0a", label: "Ink (when not matching)" },
    dotColor: { type: "color", default: "#dcdcdc", label: "Unlit dots (when not matching)" },
    containerColor: { type: "color", default: "#f1f1f1", label: "Container (when not matching)" },
    roundness: { type: "number", min: 0, max: 1, step: 0.05, default: 1, label: "Roundness" },
    padding: { type: "number", min: 0.4, max: 2.4, step: 0.1, default: 1.2, label: "Side padding", unit: "em" },
  },
};

export default meta;
