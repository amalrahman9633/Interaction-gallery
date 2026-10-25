import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useAnimate, useReducedMotion, type Transition } from "motion/react";
import styles from "./styles.module.css";

// Secret Folder: hover and the cover swings open on its left edge, a sheet peeking out.
// Click and the sheet slides out, comes around to the front, and flips over to show a
// note. Click again and it flips back, slides out, and tucks itself back inside.
//
// Layers, back to front: back panel, sheet, cover. When the note is out, the sheet
// jumps above the cover at the moment it's furthest to the right, so the swap is hidden.
// The folder sets one centered perspective for its layers but stays flat itself
// (no preserve-3d), which keeps z-index in charge of the stacking order.

type Props = {
  title?: string;
  subtitle?: string;
  backLabel?: string;
  note?: string;
  punchline?: string;
  backgroundColor?: string;
  folderTop?: string;
  folderBottom?: string;
  backColor?: string;
  paperColor?: string;
  inkColor?: string;
  coverAngle?: number;
  peek?: number;
  tilt?: number;
  bounce?: number;
};

type Phase = "closed" | "opening" | "open" | "closing";

export default function SecretFolder({
  title = "Confidential files",
  subtitle = "Internal use only",
  backLabel = "Do not open",
  note = "Everything in this folder is classified and meant for approved eyes only.\n\nOpening it without clearance is strongly discouraged and may have consequences.\n\nBy reading on, you agree to keep what you find here strictly to yourself.",
  punchline = "You opened it anyway, didn't you?",
  backgroundColor = "transparent",
  folderTop = "#ff7a2e",
  folderBottom = "#ee5a16",
  backColor = "#cf4d14",
  paperColor = "#fefefe",
  inkColor = "#131313",
  coverAngle = 26,
  peek = 12,
  tilt = 5,
  bounce = 0.3,
}: Props) {
  const reduced = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [phase, setPhase] = useState<Phase>("closed");
  const [front, setFront] = useState(false); // sheet stacked above the cover
  const [hover, setHover] = useState(false);
  const busy = useRef(false);

  // "Travel" is a quick ease-out (a spring's long tail would stall the layer swap);
  // "settle" and "soft" are springs, so landings have a little life.
  const travel: Transition = reduced ? { duration: 0 } : { duration: 0.26, ease: [0.25, 1, 0.5, 1] };
  const settle: Transition = reduced ? { duration: 0 } : { type: "spring", duration: 0.8, bounce };
  const soft: Transition = reduced ? { duration: 0 } : { type: "spring", duration: 0.55, bounce: 0.18 };

  const peekOn = hover && !reduced;
  const tucked = { x: peekOn ? `${peek}%` : "0%", rotate: peekOn ? tilt * 0.6 : 0 };

  // Hover peek while the folder is shut.
  useEffect(() => {
    if (phase !== "closed") return;
    animate(".sheet", tucked, soft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peekOn, phase, peek, tilt]);

  const open = async () => {
    // 1. Out to the right, still showing its blank back.
    await animate(".sheet", { x: "104%", y: "0%", rotate: tilt * 0.4 }, travel);
    setFront(true);
    // 2. Back across the folder, flipping over to the note, settling at a tilt.
    // It grows a touch as it comes forward, like it's been lifted toward you.
    await animate(".sheet", { x: "0%", y: "1%", scale: 1.04, rotateY: 180, rotate: -tilt }, settle);
  };

  const close = async () => {
    // 1. Flip back over in place.
    await animate(".sheet", { rotateY: 0, rotate: tilt * 0.8, y: "0%", x: "0%", scale: 1.04 }, soft);
    // 2. Out to the right, then behind the cover.
    await animate(".sheet", { x: "104%", rotate: tilt * 0.4, scale: 1 }, travel);
    setFront(false);
    // 3. Back into the folder (peeking if the pointer is still over it).
    await animate(".sheet", tucked, soft);
  };

  const toggle = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      if (phase === "closed") {
        setPhase("opening");
        await open();
        setPhase("open");
      } else if (phase === "open") {
        setPhase("closing");
        await close();
        setPhase("closed");
      }
    } finally {
      busy.current = false;
    }
  };

  // The cover lies flat whenever the sheet is in front of it.
  const coverRotate = !front && peekOn ? -coverAngle : 0;

  const vars = {
    "--bg": backgroundColor,
    "--top": folderTop,
    "--bottom": folderBottom,
    "--back": backColor,
    "--paper": paperColor,
    "--ink": inkColor,
  } as CSSProperties;

  return (
    <div className={styles.root} style={vars}>
      <div
        ref={scope}
        className={styles.folder}
        role="button"
        tabIndex={0}
        aria-expanded={phase === "open" || phase === "opening"}
        aria-label={phase === "open" ? `Put the note back in ${title}` : `Open ${title}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div className={styles.back} />

        <motion.div
          className={`sheet ${styles.sheet}`}
          style={{ zIndex: front ? 3 : 1 }}
          initial={false}
          data-front={front}
        >
          <div className={`${styles.face} ${styles.faceBack}`}>
            <span className={styles.backLabel}>{backLabel}</span>
          </div>
          <div className={`${styles.face} ${styles.faceNote}`} aria-hidden={phase !== "open"}>
            {note.split(/\n\s*\n/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <Doodle />
            <p>{punchline}</p>
          </div>
        </motion.div>

        <motion.div
          className={styles.cover}
          style={{ originX: 0 }}
          initial={false}
          animate={{ rotateY: coverRotate }}
          transition={soft}
        >
          <Mark />
          <div className={styles.label}>
            <span className={styles.title}>{title}</span>
            <span className={styles.subtitle}>{subtitle}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** A neutral four-point sparkle, standing in for a brand mark. */
function Mark() {
  return (
    <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 1.5c.6 5.6 2.9 9 10.5 10.5C14.9 13.5 12.6 16.9 12 22.5 11.4 16.9 9.1 13.5 1.5 12 9.1 10.5 11.4 7.1 12 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** A tiny hand-drawn face peeking over a ledge, hands gripping the edge. */
function Doodle() {
  return (
    <svg className={styles.doodle} viewBox="0 0 72 34" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 29c0-11 8-18 18-18s18 7 18 18" />
        <path d="M2 29h68" />
        <path d="M10 29c0-3 1.5-5 3.5-5s3.5 2 3.5 5M55 29c0-3 1.5-5 3.5-5s3.5 2 3.5 5" />
        <path d="M27 17.5c1.5-1.4 3.5-1.6 5-.6M40 16.9c1.5-1 3.5-.8 5 .6" />
      </g>
      <circle cx="31" cy="22.5" r="2.6" fill="currentColor" />
      <circle cx="43" cy="22.5" r="2.6" fill="currentColor" />
    </svg>
  );
}
