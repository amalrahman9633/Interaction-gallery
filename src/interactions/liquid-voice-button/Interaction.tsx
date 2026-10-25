import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, type MotionValue, type Transition } from "motion/react";
import { createGlass } from "./glass";
import styles from "./styles.module.css";

// Liquid Voice Button: a dark glass pill. Click it and it turns into a bright "End"
// pill while glass rings pop out around it, one after another, with color flowing
// through them as if it's listening. Click End and everything sinks back in.
//
// The button is regular DOM (text, focus, clicks). The rings and color are one WebGL
// canvas behind it, driven by the same motion values, so they stay perfectly in sync.
// Layout is designed at 560 × 400 and scaled to fit the container.

const DESIGN_W = 560;
const DESIGN_H = 400;
const BTN_H = 100;
const PAD_X = 46;
const END_MIN_W = 265; // the End pill reads wider and calmer than its content needs

// Ring offsets from the button edge, in design units.
const IDLE_RING = 20;
const ACTIVE_RINGS: [number, number, number] = [30, 72, 123];

type Props = {
  label?: string;
  endLabel?: string;
  deepColor?: string;
  midColor?: string;
  lightColor?: string;
  hangUpColor?: string;
  speed?: number;
  refraction?: number;
  popBounce?: number;
  ringStagger?: number;
  background?: string;
};

export default function LiquidVoiceButton({
  label = "Talk to me",
  endLabel = "End",
  deepColor = "#1f3f75",
  midColor = "#5f86c4",
  lightColor = "#dbe6f5",
  hangUpColor = "#d9452b",
  speed = 1,
  refraction = 0.6,
  popBounce = 0.35,
  ringStagger = 0.07,
  background = "#050505",
}: Props) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idleMeasure = useRef<HTMLSpanElement>(null);
  const endMeasure = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);
  const [listening, setListening] = useState(false);
  const [widths, setWidths] = useState({ idle: 380, end: 260 });

  // Everything the shader reads, as motion values so springs can drive them.
  const btnW = useMotionValue(380);
  const d1 = useMotionValue(IDLE_RING);
  const d2 = useMotionValue(IDLE_RING);
  const d3 = useMotionValue(IDLE_RING);
  const a2 = useMotionValue(0);
  const a3 = useMotionValue(0);
  const amount = useMotionValue(0);
  const mvs = useRef<MotionValue<number>[]>([btnW, d1, d2, d3, a2, a3, amount]);
  const loop = useRef<{ kick: () => void } | null>(null);

  // Fit the 560 × 400 layout into whatever size the container is.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fit = () => setScale(Math.min(root.clientWidth / DESIGN_W, root.clientHeight / DESIGN_H) * 0.96);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  // Button width follows its content: measure both labels (again once fonts load).
  useLayoutEffect(() => {
    const measure = () => {
      const idle = (idleMeasure.current?.offsetWidth ?? 280) + PAD_X * 2;
      const end = Math.max(END_MIN_W, (endMeasure.current?.offsetWidth ?? 170) + PAD_X * 2);
      setWidths({ idle, end });
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [label, endLabel]);

  // Snap to the measured width on first layout; spring to it after (e.g. a label edit).
  const measured = useRef(false);
  useEffect(() => {
    const target = listening ? widths.end : widths.idle;
    if (!measured.current || reduced) btnW.jump(target);
    else animate(btnW, target, { type: "spring", duration: 0.55, bounce: 0.2 });
    measured.current = true;
    loop.current?.kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widths]);

  // ---- Render loop: only runs while visible, and only while something is moving.
  const listeningRef = useRef(listening);
  listeningRef.current = listening;
  const style = useRef({ speed, refraction, colors: { deep: deepColor, mid: midColor, light: lightColor } });
  style.current = { speed, refraction, colors: { deep: deepColor, mid: midColor, light: lightColor } };

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const glass = createGlass(canvas);
    if (!glass) return;

    let raf = 0;
    let visible = true;
    let t = 0;
    let last = performance.now();
    let lastStyle = "";

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = style.current;
      const key = JSON.stringify(s);
      if (key !== lastStyle) {
        glass.setStyle(s.colors, s.refraction);
        lastStyle = key;
      }
      if (!reduced) t += dt * s.speed;
      // Simulated voice: a few detuned waves, so it rises and falls like speech.
      const amp = reduced
        ? 0.3
        : Math.max(0, 0.5 + 0.28 * Math.sin(t * 5.3) * Math.sin(t * 1.7 + 1) + 0.18 * Math.sin(t * 11.1) * Math.sin(t * 0.9));
      const breathe = amount.get() * amp * 3; // rings swell a few units with the voice
      glass.draw({
        time: t,
        btnHalf: [btnW.get() / 2, BTN_H / 2],
        offsets: [d1.get() + breathe * 0.4, d2.get() + breathe * 0.7, d3.get() + breathe],
        alphas: [1, a2.get(), a3.get()],
        amount: amount.get(),
        amp,
      });
      const moving = mvs.current.some((mv) => mv.isAnimating());
      if (visible && !document.hidden && (moving || listeningRef.current)) raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    loop.current = { kick };

    const resize = () => {
      glass.resize(DESIGN_W, DESIGN_H, Math.max(0.1, Math.min(root.clientWidth / DESIGN_W, root.clientHeight / DESIGN_H) * 0.96));
      kick();
      if (!raf) frame(performance.now());
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(root);
    const onVis = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      loop.current = null;
      glass.destroy();
    };
  }, [reduced, btnW, d1, d2, d3, a2, a3, amount]);

  // Redraw when a style prop changes while idle.
  useEffect(() => loop.current?.kick(), [speed, refraction, deepColor, midColor, lightColor]);

  const toggle = () => {
    const next = !listening;
    setListening(next);
    const pop: Transition = reduced ? { duration: 0 } : { type: "spring", duration: 0.7, bounce: popBounce };
    const morph: Transition = reduced ? { duration: 0 } : { type: "spring", duration: 0.55, bounce: 0.2 };
    const fade: Transition = { duration: reduced ? 0.2 : 0.6, ease: [0.16, 1, 0.3, 1] };
    const sink: Transition = reduced ? { duration: 0 } : { type: "spring", duration: 0.5, bounce: 0 };
    const st = reduced ? 0 : ringStagger;

    animate(btnW, next ? widths.end : widths.idle, morph);
    if (next) {
      // Rings pop out from the inside, each a beat after the last.
      animate(d1, ACTIVE_RINGS[0], { ...pop, delay: 0 });
      animate(d2, ACTIVE_RINGS[1], { ...pop, delay: st });
      animate(d3, ACTIVE_RINGS[2], { ...pop, delay: st * 2 });
      animate(a2, 1, { duration: 0.25, delay: st });
      animate(a3, 1, { duration: 0.25, delay: st * 2 });
      animate(amount, 1, { ...fade, delay: st });
    } else {
      // Sink back in, outer ring first.
      animate(amount, 0, { ...fade, duration: reduced ? 0.2 : 0.35 });
      animate(d3, IDLE_RING, { ...sink, delay: 0 });
      animate(d2, IDLE_RING, { ...sink, delay: st });
      animate(d1, IDLE_RING, { ...sink, delay: st * 2 });
      animate(a3, 0, { duration: 0.3, delay: 0.15 });
      animate(a2, 0, { duration: 0.3, delay: 0.15 + st });
    }
    loop.current?.kick();
  };

  const contentTransition: Transition = reduced ? { duration: 0.15 } : { type: "spring", duration: 0.45, bounce: 0.15 };

  return (
    <div ref={rootRef} className={styles.root} style={{ background }}>
      <div className={styles.stage} style={{ width: DESIGN_W, height: DESIGN_H, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <canvas ref={canvasRef} className={styles.canvas} />

        <motion.button
          className={styles.button}
          style={{ width: btnW, height: BTN_H }}
          data-listening={listening}
          aria-pressed={listening}
          aria-label={listening ? `${endLabel} listening` : label}
          onClick={toggle}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", duration: 0.3, bounce: 0.3 }}
        >
          {/* Two backgrounds that crossfade: dark glass and bright glass. */}
          <motion.span className={`${styles.face} ${styles.faceDark}`} initial={false} animate={{ opacity: listening ? 0 : 1 }} transition={contentTransition} />
          <motion.span className={`${styles.face} ${styles.faceLight}`} initial={false} animate={{ opacity: listening ? 1 : 0 }} transition={contentTransition} />

          <motion.span
            className={styles.content}
            initial={false}
            animate={listening ? { opacity: 0, y: -14, filter: "blur(4px)" } : { opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={contentTransition}
          >
            <MicIcon />
            {label}
          </motion.span>
          <motion.span
            className={`${styles.content} ${styles.contentEnd}`}
            initial={false}
            animate={listening ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 14, filter: "blur(4px)" }}
            transition={contentTransition}
          >
            <PhoneIcon color={hangUpColor} />
            {endLabel}
          </motion.span>
        </motion.button>

        {/* Invisible copies used only to measure label widths. */}
        <span ref={idleMeasure} className={`${styles.content} ${styles.measure}`} aria-hidden>
          <MicIcon />
          {label}
        </span>
        <span ref={endMeasure} className={`${styles.content} ${styles.measure}`} aria-hidden>
          <PhoneIcon color={hangUpColor} />
          {endLabel}
        </span>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon({ color }: { color: string }) {
  return (
    <svg className={`${styles.icon} ${styles.phone}`} viewBox="2 6 20 12" aria-hidden>
      <path
        d="M12 8.5c-3.6 0-6.9 1.2-9.2 3.3-.5.4-.6 1.1-.3 1.6l1.5 2.2c.4.5 1 .7 1.6.5l2.9-1.1c.5-.2.8-.7.8-1.2v-1.6c1-.4 1.9-.5 2.7-.5s1.7.1 2.7.5v1.6c0 .5.3 1 .8 1.2l2.9 1.1c.6.2 1.2 0 1.6-.5l1.5-2.2c.3-.5.2-1.2-.3-1.6C18.9 9.7 15.6 8.5 12 8.5Z"
        fill={color}
      />
    </svg>
  );
}
