import type { InteractionMeta } from "../../gallery/types";

const meta: InteractionMeta = {
  slug: "halftone-portrait",
  title: "Halftone Portrait",
  kind: "original",
  inspiredBy: undefined,
  note: "A photo rebuilt as a dot grid, where each dot's size comes from the tone beneath it. Dots follow the theme: ink-dark dots on light, and light dots on dark that grow with the highlights so it never reads as a negative. Hover and the dots part around the cursor on soft springs, pinch smaller near it, and a sparkle follows along.",
  tags: ["cursor", "physics", "canvas", "image"],
  added: "2026-10-25",
  aspect: 1,
  controls: {
    columns: { type: "number", min: 40, max: 300, step: 1, default: 143, label: "Dot columns" },
    dotScale: { type: "number", min: 0.5, max: 1.5, step: 0.02, default: 1.1, label: "Dot size" },
    pushRadius: { type: "number", min: 5, max: 50, step: 1, default: 21, label: "Push radius", unit: "%" },
    pushStrength: { type: "number", min: 0, max: 8, step: 0.1, default: 2.5, label: "Push force" },
    shrink: { type: "number", min: 0, max: 1, step: 0.05, default: 0.55, label: "Pinch" },
    blackPoint: { type: "number", min: 0, max: 0.5, step: 0.01, default: 0.12, label: "Black point" },
    whitePoint: { type: "number", min: 0.5, max: 1, step: 0.01, default: 0.85, label: "White point" },
    gamma: { type: "number", min: 0.6, max: 2.5, step: 0.05, default: 1.6, label: "Gamma" },
    bottomFade: { type: "number", min: 0, max: 0.4, step: 0.01, default: 0.1, label: "Bottom fade" },
    fit: { type: "select", options: ["contain", "cover"], default: "contain", label: "Fit" },
    showStar: { type: "boolean", default: true, label: "Sparkle" },
    backdropCutoff: { type: "number", min: 0.7, max: 1, step: 0.01, default: 0.9, label: "Backdrop cutoff (light dots)" },
    adaptiveColor: { type: "boolean", default: true, label: "Match theme" },
    dotColor: { type: "color", default: "#000000", label: "Dots (when not matching)" },
  },
};

export default meta;
