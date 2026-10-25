import type { InteractionMeta } from "../../gallery/types";

const meta: InteractionMeta = {
  slug: "liquid-voice-button",
  title: "Liquid Voice Button",
  kind: "original",
  inspiredBy: undefined,
  note: "A dark glass pill that starts a listening session. Rings of glass pop out around it one after another, and color drifts through them like liquid, bending at each ring's edge as if through a lens. The rings swell gently with a simulated voice until you hit End.",
  tags: ["button", "click", "shader", "glass"],
  added: "2026-10-25",
  aspect: 4 / 3,
  controls: {
    speed: { type: "number", min: 0, max: 3, step: 0.05, default: 1, label: "Flow speed" },
    refraction: { type: "number", min: 0, max: 1.5, step: 0.05, default: 0.6, label: "Refraction" },
    popBounce: { type: "number", min: 0, max: 0.6, step: 0.02, default: 0.35, label: "Pop bounce" },
    ringStagger: { type: "number", min: 0, max: 0.2, step: 0.01, default: 0.07, label: "Ring stagger", unit: "s" },
    label: { type: "text", default: "Talk to me", label: "Label" },
    endLabel: { type: "text", default: "End", label: "End label" },
    deepColor: { type: "color", default: "#1f3f75", label: "Deep color" },
    midColor: { type: "color", default: "#5f86c4", label: "Mid color" },
    lightColor: { type: "color", default: "#dbe6f5", label: "Highlight" },
    hangUpColor: { type: "color", default: "#d9452b", label: "Hang-up icon" },
    background: { type: "color", default: "#050505", label: "Background" },
  },
};

export default meta;
