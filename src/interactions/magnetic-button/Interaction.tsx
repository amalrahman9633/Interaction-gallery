import { useRef, useState, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import styles from "./styles.module.css";

type Props = {
  label?: string;
  strength?: number;
  radius?: number;
  stiffness?: number;
  damping?: number;
  labelLag?: number;
  color?: string;
  fillColor?: string;
  textColor?: string;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function MagneticButton({
  label = "Get in touch",
  strength = 0.4,
  radius = 140,
  stiffness = 220,
  damping = 16,
  labelLag = 0.45,
  color = "#ff5b2e",
  fillColor = "#ffd60a",
  textColor = "#141414",
}: Props) {
  const reduced = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Raw targets, smoothed by springs. The label rides a second, softer layer
  // so it trails the button a little and feels like it has weight.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness, damping, mass: 0.6 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  const lx = useTransform(sx, (v) => v * labelLag);
  const ly = useTransform(sy, (v) => v * labelLag);

  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 100 });

  const pull = (clientX: number, clientY: number) => {
    const el = buttonRef.current;
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    // Field strength fades out from the button's edge to `radius` beyond it,
    // so the pull eases off smoothly instead of snapping at a hard boundary.
    const edge = Math.max(r.width, r.height) / 2;
    const falloff = clamp01(1 - (Math.hypot(dx, dy) - edge) / radius);
    const eased = falloff * falloff * (3 - 2 * falloff); // smoothstep
    x.set(dx * strength * eased);
    y.set(dy * strength * eased);
  };

  const release = () => {
    x.set(0);
    y.set(0);
  };

  // Where the pointer crossed the button edge, so the fill grows from there.
  const setOriginFrom = (e: PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  return (
    <div
      className={styles.root}
      onPointerMove={(e) => pull(e.clientX, e.clientY)}
      onPointerLeave={release}
      onPointerCancel={release}
    >
      <motion.button
        ref={buttonRef}
        className={styles.button}
        style={{ x: sx, y: sy, background: color, color: textColor }}
        onPointerEnter={(e) => {
          setOriginFrom(e);
          setHover(true);
        }}
        onPointerLeave={(e) => {
          setOriginFrom(e);
          setHover(false);
        }}
        onPointerUp={(e) => e.pointerType === "touch" && (setHover(false), release())}
        onFocus={() => {
          setOrigin({ x: 50, y: 50 });
          setHover(true);
        }}
        onBlur={() => setHover(false)}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <motion.span
          className={styles.fill}
          style={{ background: fillColor, left: `${origin.x}%`, top: `${origin.y}%` }}
          initial={false}
          animate={{ scale: hover ? 1 : 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", duration: hover ? 0.6 : 0.45, bounce: 0 }
          }
        />
        <motion.span className={styles.label} style={{ x: lx, y: ly }}>
          {label}
        </motion.span>
      </motion.button>
    </div>
  );
}
