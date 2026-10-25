import { useEffect, useRef } from "react";
import defaultImage from "./portrait.jpg";

// Halftone Portrait: a photo rebuilt as a dot grid. On hover the dots push away
// from the cursor on little springs, pinch smaller near it, and a sparkle follows.
// The canvas is transparent; the scene color comes from whatever sits behind it.
// With adaptive color on, dots use the inherited CSS text color, so they flip with
// light and dark themes (white dots on dark, black dots on light).
//
// Dark dots grow with the photo's shadows (ink on paper). Light dots grow with its
// highlights instead (light on a dark screen), otherwise the portrait would read as
// a negative. In light-dot mode the photo's bright backdrop is cut out so it doesn't
// fill the frame with dots.

// ---------- Halftone engine (framework-free) ----------
type Opts = {
  src: string;
  dot: string;
  cols: number;
  dotScale: number;
  black: number;
  white: number;
  gamma: number;
  radius: number;
  strength: number;
  shrink: number;
  fit: "contain" | "cover";
  bottomFade: number;
  star: boolean;
  /** Light-dot mode only: brightness above this is treated as backdrop and dropped. */
  cutout: number;
};

function createHalftone(canvas: HTMLCanvasElement, initial: Opts) {
  const ctx = canvas.getContext("2d")!;
  let o = initial;
  let img: HTMLImageElement | null = null;
  let loadedSrc = "";
  let w = 0, h = 0, dpr = 1;
  let n = 0;
  let bx = new Float32Array(0), by = new Float32Array(0), br = new Float32Array(0);
  let ox = new Float32Array(0), oy = new Float32Array(0);
  let vx = new Float32Array(0), vy = new Float32Array(0);
  const m = { x: 0, y: 0, sx: 0, sy: 0, active: false, hover: 0, init: false };
  let raf = 0;
  let dead = false;
  const dotFill = () => (o.dot === "auto" ? getComputedStyle(canvas).color : o.dot);
  // Perceived lightness of any CSS color, via the canvas's own color parser.
  const isLight = (color: string) => {
    ctx.fillStyle = "#000"; ctx.fillStyle = color;
    const v = String(ctx.fillStyle);
    const hex = v.startsWith("#") ? v.slice(1) : "";
    const [r, g, b] = hex.length === 6
      ? [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
      : (v.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
  };
  // Reduced motion: keep the halftone, skip the push, pinch, and sparkle.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function build() {
    // Layout size, not getBoundingClientRect: the gallery scales cards with transforms
    // while they morph into the detail view, and the grid must use the real size.
    w = Math.max(1, canvas.clientWidth);
    h = Math.max(1, canvas.clientHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (!img || !img.naturalWidth) { draw(0); return; }
    const cell = Math.max(2.5, w / o.cols);
    const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
    const off = document.createElement("canvas");
    off.width = cols; off.height = rows;
    const oc = off.getContext("2d", { willReadFrequently: true })!;
    oc.fillStyle = "#fff"; oc.fillRect(0, 0, cols, rows);
    const ir = img.naturalWidth / img.naturalHeight;
    let rw: number, rh: number;
    if ((o.fit === "contain") === (ir > w / h)) { rw = w; rh = w / ir; } else { rh = h; rw = h * ir; }
    const rx = (w - rw) / 2, ry = (h - rh) / 2;
    oc.imageSmoothingQuality = "high";
    oc.drawImage(img, rx / cell, ry / cell, rw / cell, rh / cell);
    let data: Uint8ClampedArray;
    try { data = oc.getImageData(0, 0, cols, rows).data; } catch (e) {
      console.warn("Halftone: image is not readable (CORS).", e); draw(0); return;
    }
    const bx_: number[] = [], by_: number[] = [], br_: number[] = [];
    const fadeH = Math.max(1, rh * o.bottomFade), bottom = ry + rh;
    const light = isLight(dotFill());
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 4;
      const lum = (0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2]) / 255;
      let d: number;
      if (light) {
        d = (lum - o.black) / Math.max(0.01, o.white - o.black);
        d = Math.pow(Math.min(1, Math.max(0, d)), o.gamma);
        d *= Math.min(1, Math.max(0, (o.cutout - lum) / 0.05)); // soft edge into the cut-out backdrop
      } else {
        d = (1 - lum - o.black) / Math.max(0.01, o.white - o.black);
        d = Math.pow(Math.min(1, Math.max(0, d)), o.gamma);
      }
      const x = (i + 0.5) * cell, y = (j + 0.5) * cell;
      if (o.bottomFade > 0 && bottom <= h + 1) d *= Math.min(1, Math.max(0.12, (bottom - y) / fadeH));
      const r = cell * 0.5 * o.dotScale * Math.sqrt(d);
      if (r > 0.25) { bx_.push(x); by_.push(y); br_.push(r); }
    }
    n = bx_.length;
    bx = Float32Array.from(bx_); by = Float32Array.from(by_); br = Float32Array.from(br_);
    ox = new Float32Array(n); oy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
    draw(0); if (m.active) kick();
  }

  function setImage(src: string) {
    if (src === loadedSrc) return;
    loadedSrc = src;
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => { if (!dead && loadedSrc === src) { img = im; build(); } };
    im.src = src;
  }

  function draw(time: number) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const hv = m.hover;
    ctx.fillStyle = dotFill();
    ctx.beginPath();
    const hasPtr = m.init;
    for (let i = 0; i < n; i++) {
      let r = br[i];
      if (hasPtr) {
        const dx = bx[i] - m.sx, dy = by[i] - m.sy;
        const t = Math.sqrt(dx * dx + dy * dy) / (o.radius * w / 100);
        if (t < 1) { const f = 1 - t; r *= 1 - o.shrink * f * f * m.hover; }
      }
      if (r < 0.2) continue;
      const x = bx[i] + ox[i], y = by[i] + oy[i];
      ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832);
    }
    ctx.fill();
    if (o.star && hv > 0.01) star(time);
  }

  function star(time: number) {
    const s = 11 + Math.sin(time * 0.006) * 1.5;
    ctx.save(); ctx.translate(m.sx, m.sy); ctx.rotate(Math.sin(time * 0.002) * 0.1);
    ctx.globalAlpha = Math.min(1, m.hover * 1.5);
    ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 6;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s);
    ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s);
    ctx.fill(); ctx.restore();
  }

  // The loop only runs while something is moving: it starts on pointer input and
  // stops by itself once every dot has settled, so idle or off-screen tiles cost nothing.
  function tick(now: number) {
    raf = 0;
    // smooth pointer + hover
    const k = 0.28;
    m.sx += (m.x - m.sx) * k; m.sy += (m.y - m.sy) * k;
    m.hover += ((m.active ? 1 : 0) - m.hover) * 0.09;
    let energy = Math.abs(m.x - m.sx) + Math.abs(m.y - m.sy);
    const R = o.radius * w / 100, S = o.strength * w / 100;
    for (let i = 0; i < n; i++) {
      let tx = 0, ty = 0;
      if (m.init && m.hover > 0.01) {
        const dx = bx[i] - m.sx, dy = by[i] - m.sy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (dist < R) {
          const f = 1 - dist / R, p = f * f * (3 - 2 * f) * S * m.hover;
          tx = (dx / dist) * p; ty = (dy / dist) * p;
        }
      }
      vx[i] = (vx[i] + (tx - ox[i]) * 0.12) * 0.78;
      vy[i] = (vy[i] + (ty - oy[i]) * 0.12) * 0.78;
      ox[i] += vx[i]; oy[i] += vy[i];
      energy += Math.abs(vx[i]) + Math.abs(vy[i]) + Math.abs(ox[i]) * 0.2 + Math.abs(oy[i]) * 0.2;
    }
    draw(now);
    if (m.active || m.hover > 0.002 || energy / Math.max(1, n) > 0.002) raf = requestAnimationFrame(tick);
    else { m.hover = 0; for (let i = 0; i < n; i++) { ox[i] = oy[i] = vx[i] = vy[i] = 0; } draw(now); }
  }
  function kick() { if (!raf && !dead) raf = requestAnimationFrame(tick); }

  function pos(e: PointerEvent) {
    // Map screen pixels to canvas pixels, so the cursor lines up even mid-transform.
    const r = canvas.getBoundingClientRect();
    m.x = (e.clientX - r.left) * (w / Math.max(1, r.width));
    m.y = (e.clientY - r.top) * (h / Math.max(1, r.height));
    if (!m.init || !m.active) { m.sx = m.x; m.sy = m.y; }
    m.init = true;
  }
  const onMove = (e: PointerEvent) => { pos(e); m.active = true; kick(); };
  const onEnter = (e: PointerEvent) => { pos(e); m.active = true; kick(); };
  const onLeave = () => { m.active = false; kick(); };
  if (!reduced) {
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);
  }
  // Rebuild when the theme changes: either an attribute on <html> (a theme toggle)
  // or the OS color scheme. Only needed when dots follow the text color, since
  // flipping between light and dark dots changes how tones map to dot sizes.
  const redraw = () => { if (o.dot === "auto") build(); };
  const themeObserver = new MutationObserver(redraw);
  themeObserver.observe(document.documentElement, { attributes: true });
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", redraw);
  const ro = new ResizeObserver(() => build());
  ro.observe(canvas);
  setImage(o.src);

  return {
    update(next: Opts) {
      const srcChanged = next.src !== o.src;
      o = next;
      if (srcChanged) setImage(next.src); else build();
    },
    destroy() {
      dead = true;
      cancelAnimationFrame(raf); raf = 0; ro.disconnect();
      themeObserver.disconnect();
      scheme.removeEventListener("change", redraw);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
    },
  };
}

// ---------- React component ----------
type Props = {
  image?: string;
  adaptiveColor?: boolean;
  dotColor?: string;
  backdropCutoff?: number;
  columns?: number;
  dotScale?: number;
  blackPoint?: number;
  whitePoint?: number;
  gamma?: number;
  pushRadius?: number;
  pushStrength?: number;
  shrink?: number;
  fit?: "contain" | "cover";
  bottomFade?: number;
  showStar?: boolean;
};

export default function HalftonePortrait({
  image = defaultImage,
  adaptiveColor = true,
  dotColor = "#000000",
  backdropCutoff = 0.9,
  columns = 143,
  dotScale = 1.1,
  blackPoint = 0.12,
  whitePoint = 0.85,
  gamma = 1.6,
  pushRadius = 21,
  pushStrength = 2.5,
  shrink = 0.55,
  fit = "contain",
  bottomFade = 0.1,
  showStar = true,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof createHalftone> | null>(null);
  const opts: Opts = {
    src: image || defaultImage,
    dot: adaptiveColor ? "auto" : dotColor,
    cols: columns, dotScale,
    black: blackPoint, white: whitePoint, gamma,
    radius: pushRadius, strength: pushStrength, shrink,
    fit, bottomFade,
    star: showStar,
    cutout: backdropCutoff,
  };
  const optsKey = JSON.stringify(opts);
  const latest = useRef(opts);
  latest.current = opts;

  useEffect(() => {
    if (!ref.current) return;
    engine.current = createHalftone(ref.current, latest.current);
    return () => {
      engine.current?.destroy();
      engine.current = null;
    };
  }, []);

  // Rebuild the dot grid whenever a value changes (cheap: it samples a tiny offscreen canvas).
  useEffect(() => {
    engine.current?.update(JSON.parse(optsKey));
  }, [optsKey]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "transparent" }}>
      <canvas
        ref={ref}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", touchAction: "pan-y" }}
      />
    </div>
  );
}
