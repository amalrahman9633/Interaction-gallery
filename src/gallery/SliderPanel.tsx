import { useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import type { Control, ControlValue, ControlValues } from "./types";
import { uiSpring } from "./motion";
import styles from "./SliderPanel.module.css";

type Props = {
  controls: Record<string, Control>;
  values: ControlValues;
  onChange: (key: string, value: ControlValue) => void;
  onReset: () => void;
};

const humanize = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const decimals = (step = 1) => (String(step).split(".")[1] ?? "").length;

export default function SliderPanel({ controls, values, onChange, onReset }: Props) {
  const [copied, setCopied] = useState(false);

  const isDirty = Object.entries(controls).some(([k, c]) => values[k] !== c.default);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(values, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <section className={styles.panel} aria-label="Controls">
      <div className={styles.head}>
        <span>Controls</span>
        <div className={styles.actions}>
          <button className={styles.link} onClick={copy}>
            {copied ? "Copied" : "Copy values"}
          </button>
          <button className={styles.link} onClick={onReset} disabled={!isDirty}>
            Reset
          </button>
        </div>
      </div>

      {Object.entries(controls).map(([key, control]) => (
        <Row
          key={key}
          id={key}
          control={control}
          value={values[key] ?? control.default}
          onChange={(v) => onChange(key, v)}
        />
      ))}
    </section>
  );
}

function Row({
  id,
  control,
  value,
  onChange,
}: {
  id: string;
  control: Control;
  value: ControlValue;
  onChange: (v: ControlValue) => void;
}) {
  const label = control.label ?? humanize(id);
  const inputId = `control-${id}`;
  // Double-click a label to reset just that control.
  const resetOne = () => onChange(control.default);

  switch (control.type) {
    case "number": {
      const v = value as number;
      const pct = ((v - control.min) / (control.max - control.min)) * 100;
      return (
        <div className={styles.row}>
          <div className={styles.rowHead}>
            <label htmlFor={inputId} onDoubleClick={resetOne}>
              {label}
            </label>
            <output htmlFor={inputId} className={styles.value}>
              {v.toFixed(decimals(control.step))}
              {control.unit ?? ""}
            </output>
          </div>
          <input
            id={inputId}
            type="range"
            className={styles.range}
            min={control.min}
            max={control.max}
            step={control.step ?? 1}
            value={v}
            style={{ "--p": `${pct}%` } as CSSProperties}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      );
    }

    case "color":
      return (
        <div className={`${styles.row} ${styles.inline}`}>
          <label htmlFor={inputId} onDoubleClick={resetOne}>
            {label}
          </label>
          <span className={styles.color}>
            <span className={styles.hex}>{String(value).toUpperCase()}</span>
            <span className={styles.swatch} style={{ background: String(value) }}>
              <input id={inputId} type="color" value={String(value)} onChange={(e) => onChange(e.target.value)} />
            </span>
          </span>
        </div>
      );

    case "boolean": {
      const on = Boolean(value);
      return (
        <div className={`${styles.row} ${styles.inline}`}>
          <label htmlFor={inputId} onDoubleClick={resetOne}>
            {label}
          </label>
          <button
            id={inputId}
            role="switch"
            aria-checked={on}
            className={styles.switch}
            data-on={on}
            onClick={() => onChange(!on)}
          >
            <motion.span className={styles.knob} animate={{ x: on ? 16 : 0 }} transition={uiSpring} />
          </button>
        </div>
      );
    }

    case "select":
      return (
        <div className={styles.row}>
          <label htmlFor={inputId} onDoubleClick={resetOne}>
            {label}
          </label>
          {control.options.length <= 4 ? (
            <div className={styles.segment} role="radiogroup" id={inputId}>
              {control.options.map((o) => (
                <button
                  key={o}
                  role="radio"
                  aria-checked={value === o}
                  data-active={value === o}
                  onClick={() => onChange(o)}
                >
                  {value === o && <motion.span layoutId={`seg-${id}`} className={styles.segPill} transition={uiSpring} />}
                  <span>{o}</span>
                </button>
              ))}
            </div>
          ) : (
            <select id={inputId} className={styles.select} value={String(value)} onChange={(e) => onChange(e.target.value)}>
              {control.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          )}
        </div>
      );

    case "text":
      return (
        <div className={styles.row}>
          <label htmlFor={inputId} onDoubleClick={resetOne}>
            {label}
          </label>
          <input id={inputId} className={styles.text} value={String(value)} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
  }
}
