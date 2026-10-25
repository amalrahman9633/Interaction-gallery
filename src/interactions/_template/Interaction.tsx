import { useEffect, useRef } from "react";
import styles from "./styles.module.css";

// Starter for a new interaction. Copy this folder to src/interactions/<slug>.
//
// The contract (see CLAUDE.md):
// - One default export. Every tweakable value is a prop with a default.
// - Fill the parent (100% × 100%). Never assume a viewport size.
// - Self-contained: no imports from gallery/, other interactions, or "framer".
// - Pause loops when off-screen or the tab is hidden. Clean up on unmount.
// - Respect prefers-reduced-motion. Support mouse and touch via pointer events.
//
// This example runs a rAF loop that follows the pointer with critically damped
// smoothing, and shows the pause/cleanup pattern. Delete what you don't need.
// For spring-driven DOM work, prefer `motion/react` (useSpring, useMotionValue).

type Props = {
  color?: string;
  size?: number;
  smoothing?: number;
};

export default function Template({ color = "#ff5b2e", size = 48, smoothing = 0.12 }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // Keep latest props in a ref so the loop reads them without restarting.
  const props = useRef({ smoothing });
  props.current = { smoothing };

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    if (!root || !dot) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pos = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let raf = 0;
    let visible = true;
    let last = performance.now();

    const center = () => {
      target.x = root.clientWidth / 2;
      target.y = root.clientHeight / 2;
    };
    center();
    pos.x = target.x;
    pos.y = target.y;

    const tick = (now: number) => {
      // Frame-rate independent easing: same feel at 60Hz and 120Hz.
      const dt = Math.min(64, now - last) / 16.667;
      last = now;
      const k = reduced ? 1 : 1 - Math.pow(1 - props.current.smoothing, dt);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(root);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", center);

    const ro = new ResizeObserver(center);
    ro.observe(root);

    start();
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", center);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.root}>
      <div ref={dotRef} className={styles.dot} style={{ width: size, height: size, background: color }} />
    </div>
  );
}
