import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, type Transition } from "motion/react";
import styles from "./styles.module.css";

// Dot Matrix Save: a text button that turns into a little LED grid when clicked.
// A rounded block of lit dots sweeps across it like a progress head, leaving a
// short fading trail, then the grid melts away into "✓ Saved".
//
// The grid is drawn on a canvas (100 dots that change color every frame), while the
// labels stay as DOM text. The button's width springs between the three sizes.

type Props = {
  label?: string;
  doneLabel?: string;
  fontSize?: number;
  columns?: number;
  sweepDuration?: number;
  trail?: number;
  resetDelay?: number;
  matchTheme?: boolean;
  inkColor?: string;
  dotColor?: string;
};

type Phase = "idle" | "saving" | "saved";

const ROWS = 5;
const HEAD = [3, 5, 5, 3]; // lit dots per column of the head, rounded at both ends
const FILL_IN = 0.34; // seconds for the grid to pop in
const FILL_OUT = 0.3; // seconds for it to melt away

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

export default function DotMatrixSave({
  label = "Save changes",
  doneLabel = "Saved",
  fontSize = 20,
  columns = 20,
  sweepDuration = 1.4,
  trail = 3,
  resetDelay = 2.2,
  matchTheme = true,
  inkColor = "#0a0a0a",
  dotColor = "#dcdcdc",
}: Props) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef<HTMLSpanElement>(null);
  const width = useMotionValue(0);
  const [measured, setMeasured] = useState({ idle: 0, done: 0 });

  // Grid geometry follows the type size, so one prop scales the whole button.
  const pitch = fontSize * 0.36;
  const radius = pitch * 0.36;
  const gridW = columns * pitch;
  const gridH = ROWS * pitch;

  // Measure both labels (again once the font has loaded).
  useLayoutEffect(() => {
    const measure = () =>
      setMeasured({ idle: labelRef.current?.offsetWidth ?? 0, done: doneRef.current?.offsetWidth ?? 0 });
    measure();
    document.fonts?.ready.then(measure);
  }, [label, doneLabel, fontSize]);

  const targetWidth = phase === "idle" ? measured.idle : phase === "saving" ? gridW : measured.done;
  const first = useRef(true);
  // Layout effect, so the first measured width lands before the first paint.
  useLayoutEffect(() => {
    if (!targetWidth) return;
    if (first.current || reduced) width.jump(targetWidth);
    else animate(width, targetWidth, { type: "spring", duration: 0.5, bounce: 0.15 });
    first.current = false;
  }, [targetWidth, reduced, width]);

  // ---- Timeline, driven by one rAF loop that only runs while saving.
  const props = useRef({ columns, sweepDuration, trail, matchTheme, inkColor, dotColor, pitch, radius, reduced });
  props.current = { columns, sweepDuration, trail, matchTheme, inkColor, dotColor, pitch, radius, reduced };

  useEffect(() => {
    if (phase !== "saving") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const p = props.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(p.columns * p.pitch * dpr);
    canvas.height = Math.round(ROWS * p.pitch * dpr);

    // Resolve colors once per run. Matching the theme uses the inherited text color,
    // with unlit dots as a faint tint of it.
    const parse = (c: string): [number, number, number, number] => {
      ctx.fillStyle = "#000";
      ctx.fillStyle = c;
      const v = String(ctx.fillStyle);
      if (v.startsWith("#")) return [0, 2, 4].map((i) => parseInt(v.slice(1 + i, 3 + i), 16)).concat(1) as [number, number, number, number];
      const m = v.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
      return [m[0], m[1], m[2], m[3] ?? 1];
    };
    const ink = parse(p.matchTheme ? getComputedStyle(canvas).color : p.inkColor);
    const off: [number, number, number, number] = p.matchTheme ? [ink[0], ink[1], ink[2], 0.15] : parse(p.dotColor);
    const mix = (t: number) =>
      `rgba(${Math.round(off[0] + (ink[0] - off[0]) * t)},${Math.round(off[1] + (ink[1] - off[1]) * t)},${Math.round(off[2] + (ink[2] - off[2]) * t)},${(off[3] + (ink[3] - off[3]) * t).toFixed(3)})`;

    const cols = p.columns;
    const mid = (cols - 1) / 2;
    const start = performance.now();
    const sweepStart = p.reduced ? 0 : FILL_IN * 0.6;
    const sweepEnd = sweepStart + p.sweepDuration;
    const outStart = sweepEnd + 0.12;
    let raf = 0;
    let done = false;

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cols * p.pitch, ROWS * p.pitch);

      // Head position snaps to whole columns, so it moves like a real LED display.
      const k = easeInOutCubic(clamp01((t - sweepStart) / p.sweepDuration));
      const head = Math.floor(k * (cols - HEAD.length) + 0.5);

      for (let c = 0; c < cols; c++) {
        const fromMid = Math.abs(c - mid) / mid;
        for (let r = 0; r < ROWS; r++) {
          // Pop in from the middle out; melt away from the head's end back to the start.
          const inDelay = fromMid * 0.16 + Math.abs(r - 2) * 0.012;
          const sIn = p.reduced ? 1 : easeOutBack(clamp01((t - inDelay) / (FILL_IN - 0.12)));
          const outDelay = ((cols - 1 - c) / cols) * 0.16;
          const sOut = 1 - clamp01((t - outStart - outDelay) / (FILL_OUT - 0.14));
          const scale = Math.max(0, Math.min(sIn, sOut));
          if (scale <= 0.01) continue;

          // Lit if inside the head's rounded shape; dimmer in the trail behind it.
          let lit = 0;
          const local = c - head;
          if (!p.reduced && t >= sweepStart - 0.05) {
            if (local >= 0 && local < HEAD.length) {
              const h = HEAD[local];
              if (Math.abs(r - 2) <= (h - 1) / 2) lit = 1;
            } else if (local < 0 && -local <= p.trail && k < 1) {
              const h = HEAD[0];
              if (Math.abs(r - 2) <= (h - 1) / 2) lit = 0.5 * (1 - -local / (p.trail + 1));
            }
          }

          ctx.fillStyle = mix(lit);
          ctx.beginPath();
          ctx.arc((c + 0.5) * p.pitch, (r + 0.5) * p.pitch, p.radius * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Hand over to "Saved" once the grid has melted, which also ends this loop.
      if (t >= outStart + FILL_OUT && !done) {
        done = true;
        setPhase("saved");
        return;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Back to the start after a pause, so it can be replayed (set resetDelay to 0 to stay saved).
  useEffect(() => {
    if (phase !== "saved" || resetDelay <= 0) return;
    const id = setTimeout(() => setPhase("idle"), resetDelay * 1000);
    return () => clearTimeout(id);
  }, [phase, resetDelay]);

  const onClick = () => {
    if (phase === "idle") setPhase("saving");
    else if (phase === "saved") setPhase("idle");
  };

  const swap: Transition = reduced ? { duration: 0.15 } : { type: "spring", duration: 0.4, bounce: 0.1 };
  const enter = reduced ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(4px)" };
  const shown = { opacity: 1, y: 0, filter: "blur(0px)" };
  const leave = reduced ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(4px)" };

  return (
    <div className={styles.root}>
      <motion.button
        className={styles.button}
        style={{ width, height: fontSize * 2, fontSize }}
        onClick={onClick}
        disabled={phase === "saving"}
        aria-label={phase === "saving" ? "Saving" : phase === "saved" ? doneLabel : label}
        whileTap={phase === "idle" ? { scale: 0.97 } : undefined}
        transition={{ type: "spring", duration: 0.3, bounce: 0.3 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {phase === "idle" && (
            <motion.span key="idle" className={styles.label} initial={enter} animate={shown} exit={leave} transition={swap}>
              {label}
            </motion.span>
          )}
          {phase === "saving" && (
            <motion.span key="saving" className={styles.label} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
              <canvas ref={canvasRef} className={styles.canvas} style={{ width: gridW, height: gridH }} />
            </motion.span>
          )}
          {phase === "saved" && (
            <motion.span key="saved" className={styles.label} initial={enter} animate={shown} exit={leave} transition={swap}>
              <Check size={fontSize} reduced={!!reduced} />
              {doneLabel}
            </motion.span>
          )}
        </AnimatePresence>

        <span role="status" className={styles.srOnly}>
          {phase === "saving" ? "Saving" : phase === "saved" ? doneLabel : ""}
        </span>
      </motion.button>

      {/* Hidden copies, only for measuring widths. */}
      <span ref={labelRef} className={`${styles.label} ${styles.measure}`} style={{ fontSize }} aria-hidden>
        {label}
      </span>
      <span ref={doneRef} className={`${styles.label} ${styles.measure}`} style={{ fontSize }} aria-hidden>
        <Check size={fontSize} reduced />
        {doneLabel}
      </span>
    </div>
  );
}

function Check({ size, reduced }: { size: number; reduced: boolean }) {
  return (
    <svg className={styles.check} width={size * 1.05} height={size * 1.05} viewBox="0 0 24 24" fill="none" aria-hidden>
      <motion.path
        d="M4.5 12.5 9.5 17.5 19.5 6.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduced ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.06, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  );
}
