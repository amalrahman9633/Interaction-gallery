import type { InteractionMeta } from "../../gallery/types";

const meta: InteractionMeta = {
  slug: "magnetic-button",
  title: "Magnetic Button",
  kind: "original",
  inspiredBy: undefined,
  note: "The button leans toward the cursor through a soft field that fades out with distance, so it never snaps. The label rides a second, lighter layer, and the fill grows from wherever you crossed the edge.",
  tags: ["cursor", "physics", "button"],
  added: "2026-10-25",
  controls: {
    strength: { type: "number", min: 0, max: 1, step: 0.05, default: 0.4, label: "Pull strength" },
    radius: { type: "number", min: 20, max: 400, step: 10, default: 140, label: "Field radius", unit: "px" },
    stiffness: { type: "number", min: 50, max: 600, step: 10, default: 220, label: "Spring stiffness" },
    damping: { type: "number", min: 4, max: 60, step: 1, default: 16, label: "Spring damping" },
    labelLag: { type: "number", min: 0, max: 1, step: 0.05, default: 0.45, label: "Label parallax" },
    label: { type: "text", default: "Get in touch", label: "Label" },
    color: { type: "color", default: "#ff5b2e", label: "Button" },
    fillColor: { type: "color", default: "#ffd60a", label: "Hover fill" },
    textColor: { type: "color", default: "#141414", label: "Text" },
  },
};

export default meta;
