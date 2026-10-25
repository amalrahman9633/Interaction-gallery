import type { Transition } from "motion/react";

// Shared timing for the gallery chrome, so every transition feels like one system.

/** Card ↔ detail morph and grid reflow. Low bounce, quick settle. */
export const layoutSpring: Transition = { type: "spring", duration: 0.55, bounce: 0.12 };

/** Small UI: chips, pills, toggles. Snappier. */
export const uiSpring: Transition = { type: "spring", duration: 0.4, bounce: 0.18 };

/** Fades and slides. Expo-out, matches --ease-out in theme.css. */
export const easeOut: Transition = { duration: 0.45, ease: [0.16, 1, 0.3, 1] };
