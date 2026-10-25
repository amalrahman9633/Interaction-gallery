---
name: new-interaction
description: Build a new interaction and add it to the Interaction Library gallery. Use when Amal asks to build, recreate, or add an interaction (from a description, a link, a video, or a screenshot), e.g. "/new-interaction a cursor that leaves ink trails" or "recreate the Linear hover effect".
---

# Add a new interaction

Input: a description, a URL, a screenshot, or a video of the interaction. If anything essential is unclear (what triggers it, what it should feel like), ask one short question first; otherwise make a sensible call and note it.

## 1. Decide the basics

- **Slug**: short kebab-case, describing the pattern, not a brand (e.g. `ink-trail-cursor`, not `linear-hover`).
- **Kind**: `original` if it's Amal's idea; `study` if it recreates someone else's work. Studies need `inspiredBy: { name, url }`.
- **Credit rule**: recreate the pattern only. No logos, brand names in the UI, or proprietary assets. Use neutral placeholder content.
- **Tool**: `motion/react` springs for DOM and gesture work; plain Canvas 2D for particles and trails; raw WebGL for shaders. Don't add a package without asking Amal.

## 2. Scaffold

```bash
npm run new -- <slug> "Title"          # original
npm run new -- <slug> "Title" --study  # study, then fill in the credit
```

This copies `src/interactions/_template` and fills in slug, title, and date.

## 3. Build it

Edit `src/interactions/<slug>/Interaction.tsx` and preview at `http://localhost:5173/playground/<slug>` (start `npm run dev` in the background if it isn't running). The playground has Full / Card / Phone sizes and live controls.

Follow the contract in CLAUDE.md. The checklist:

- [ ] Single default export; every tweakable value is a prop with a default
- [ ] Fills its parent (100% × 100%), and looks good at card size (~400×300) and full screen
- [ ] No imports from `gallery/`, other interactions, or `framer`
- [ ] rAF loops pause off-screen (IntersectionObserver) and when the tab is hidden; everything cleans up on unmount (listeners, rAF, WebGL contexts). The template shows the pattern.
- [ ] Frame-rate independent (use `dt`), so it feels the same at 60Hz and 120Hz
- [ ] `prefers-reduced-motion` shows a calm static or reduced version
- [ ] Pointer events for mouse and touch; hover-only effects have a touch fallback; `touch-action: pan-y` so cards don't trap page scrolling
- [ ] Keyboard-reachable where it makes sense
- [ ] Reads well on the dark default (black page, `#171717` card) and in light mode (or set `background` in meta for a fixed scene)

**Motion quality is the priority.** No linear or default easing. Tune springs deliberately (start around stiffness 200–400, damping 20–30, and adjust by feel). Prefer transforms and opacity over layout properties. Use `will-change` sparingly.

## 4. Fill in meta.ts

Title, `aspect` if the piece reads better tall or square than the default 3 / 2 card (e.g. `1` or `4 / 5`), note (one or two sentences on intent or what was learned), tags (reuse existing tags where possible so filters stay useful), and `controls`. Each control key must match a prop name. Expose the values that change the *feel* (spring, strength, radius, speed, colors), not every internal constant.

## 5. Verify

1. Check it in the playground at Full, Card, and Phone sizes.
2. Check it in the gallery grid and the detail view (`/i/<slug>`), including the slider panel.
3. Check reduced motion (emulate `prefers-reduced-motion: reduce`) and touch (mobile viewport).
4. Run `npm run lint` and `npm run build`. Both must pass.

## 6. Report back

Tell Amal briefly, in plain terms:
- what you built and how it works (one or two sentences)
- which props are exposed
- what needs his eye: timing, feel, colors, anything you guessed

Don't commit or push unless he asks. Pushing to `main` deploys to Vercel.
