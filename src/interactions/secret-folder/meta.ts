import type { InteractionMeta } from "../../gallery/types";

const meta: InteractionMeta = {
  slug: "secret-folder",
  title: "Secret Folder",
  kind: "study",
  inspiredBy: { name: "@AdityaSur11", url: "https://x.com/AdityaSur11" },
  note: "Hover and the cover swings open on its left edge, a sheet peeking out. Click and the sheet slides out, comes around to the front, and flips over to reveal a note, then tucks itself back in on the next click. The sheet swaps layers at its furthest point out, so the move to the front never shows.",
  tags: ["hover", "click", "3D", "card"],
  added: "2026-10-25",
  aspect: 1,
  controls: {
    coverAngle: { type: "number", min: 0, max: 60, step: 1, default: 26, label: "Cover swing", unit: "°" },
    peek: { type: "number", min: 0, max: 40, step: 1, default: 12, label: "Sheet peek", unit: "%" },
    tilt: { type: "number", min: 0, max: 15, step: 0.5, default: 5, label: "Sheet tilt", unit: "°" },
    bounce: { type: "number", min: 0, max: 0.6, step: 0.02, default: 0.3, label: "Landing bounce" },
    title: { type: "text", default: "Confidential files", label: "Folder title" },
    subtitle: { type: "text", default: "Internal use only", label: "Folder subtitle" },
    backLabel: { type: "text", default: "Do not open", label: "Sheet label" },
    punchline: { type: "text", default: "You opened it anyway, didn't you?", label: "Punchline" },
    folderTop: { type: "color", default: "#ff7a2e", label: "Folder top" },
    folderBottom: { type: "color", default: "#ee5a16", label: "Folder bottom" },
    backColor: { type: "color", default: "#cf4d14", label: "Folder back" },
    paperColor: { type: "color", default: "#fefefe", label: "Paper" },
    inkColor: { type: "color", default: "#131313", label: "Ink" },
  },
};

export default meta;
