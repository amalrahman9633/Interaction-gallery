# Interaction Library

A microsite gallery of interaction designs by Amal Rahman (product designer). It mixes original interactions with credited recreations of well-known web interactions. Each interaction is a self-contained React component that shows up automatically in the gallery.

## Stack

- React 18 + TypeScript + Vite
- `motion` (Framer Motion) for springs and gestures; plain Canvas/WebGL for shaders and particle work
- Plain CSS modules, no UI framework
- Deployed on Vercel, which auto-deploys on push to `main`

Keep dependencies minimal. Ask before adding a new package.

## Commands

- `npm run dev` starts the dev server
- `npm run build` creates a production build (run this before saying a task is done)
- `npm run lint` lints the code
- `npm run new -- <slug> "Title" [--study]` copies the template into a new interaction folder

## Project structure

```
src/
  gallery/            gallery shell: grid, card, detail view, slider panel
  playground/         dev-only route (/playground/<slug>): one interaction with Full/Card/Phone sizes and live controls
  interactions/
    _template/        copy this to start a new interaction
    <slug>/
      Interaction.tsx the component (default export)
      meta.ts         metadata and slider controls
```

The gallery discovers interactions with `import.meta.glob("../interactions/*/meta.ts")`. Folders starting with `_` are ignored. Never hard-code interactions into the gallery.

## The interaction contract

Every interaction must follow these rules so it works in the gallery and can later be pasted into Framer as a code component.

1. **Component shape.** `Interaction.tsx` has a single default export: a React component that accepts its tweakable values as props, each with a sensible default.
2. **Fill the container.** The component fills its parent with `width: 100%` and `height: 100%`. It never assumes a fixed viewport size, because it must work both as a small card and full screen.
3. **Self-contained.** The component cannot import from `gallery/`, other interactions, or global state. Styles live in the folder. Assets are inlined or stored in the folder.
4. **No `framer` imports.** Keep props as plain values (numbers, strings, booleans, colors). Amal adds `addPropertyControls` when porting to Framer.
5. **Performance.**
   - Pause animation loops when the component is off-screen (IntersectionObserver) or when the tab is hidden.
   - Clean up listeners, rAF loops, and WebGL contexts on unmount.
   - A grid of 20 live tiles has to stay smooth.
6. **Accessibility.** Respect `prefers-reduced-motion` by showing a calm static or reduced version. Interactive elements must be keyboard-reachable where it makes sense.
7. **Input.** Support both mouse and touch (pointer events). Hover-only effects need a sensible touch fallback.

## meta.ts shape

```ts
import type { InteractionMeta } from "../../gallery/types";

const meta: InteractionMeta = {
  slug: "magnetic-button",
  title: "Magnetic Button",
  kind: "original",              // "original" | "study"
  inspiredBy: undefined,          // studies only, e.g. { name: "Apple Dynamic Island", url: "..." }
  note: "One or two sentences on the design intent or what was learned.",
  tags: ["cursor", "physics"],
  added: "2026-10-25",           // optional; newest first, "New" badge for 21 days
  background: undefined,          // optional fixed scene color; defaults to the theme surface
  controls: {
    strength: { type: "number", min: 0, max: 1, step: 0.05, default: 0.4, label: "Pull strength" },
    stiffness: { type: "number", min: 50, max: 600, step: 10, default: 220, label: "Spring stiffness" },
  },
};
export default meta;
```

Each key in `controls` must match a prop name on the component. The detail view generates sliders from these controls. Control types: `number` (min, max, step, unit), `color`, `boolean`, `text`, `select` (options). Types live in `src/gallery/types.ts`.

## Credit rule

Any interaction recreated from someone else's work must have `kind: "study"` and an `inspiredBy` credit. Recreate the interaction pattern only. Never copy brand logos, trademarked names in the UI, or proprietary assets. Use neutral placeholder content instead.

## Gallery design

- Clean, minimal, and generous whitespace; the interactions are the hero, not the chrome
- Grid of cards; each card plays its interaction on hover (or on scroll into view on touch devices)
- Clicking a card opens a full-screen detail view with the live interaction, a slider panel, the note, tags, and credit
- Filter chips by tag; "Originals" and "Studies" filters
- Support both light and dark mode

## Workflow: adding a new interaction

The full checklist lives in the `/new-interaction` skill (`.claude/skills/new-interaction/SKILL.md`).

1. Run `npm run new -- <slug> "Title"` (add `--study` for studies), which copies `src/interactions/_template`.
2. Build it at `/playground/<slug>`.
3. Fill in `meta.ts`.
4. Check it as a small card and full screen, with reduced motion turned on, and on touch.
5. Run `npm run build`.

When Amal asks for a new interaction, follow these steps and report what you built, which props are exposed, and anything that needs his eye (timing, feel, colors).

## First session: bootstrap

If `src/` doesn't exist yet, scaffold the project:

1. Set up Vite + React + TS and install `motion`.
2. Build the gallery shell: grid, card, detail view, slider panel, and tag filters.
3. Add auto-discovery and the playground route.
4. Create the `_template` interaction.
5. Add `magnetic-button` as the first working example.
6. Confirm `npm run build` passes.

## Working style

- Amal is a designer who is comfortable with Figma, Framer, and Rive. Explain code decisions briefly and in plain terms.
- Prefer small, focused changes. Don't refactor unrelated files.
- Motion quality matters most. Tune easing and springs carefully, and avoid linear or default-feeling timing.
