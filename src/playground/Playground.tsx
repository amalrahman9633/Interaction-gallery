import { useState } from "react";
import { defaultValues, findInteraction, interactions } from "../gallery/registry";
import Stage from "../gallery/Stage";
import SliderPanel from "../gallery/SliderPanel";
import styles from "./Playground.module.css";

// Dev-only workbench: /playground/<slug> renders one interaction with its controls.
// Switch between "Full" and "Card" to check it at both sizes.

type Size = "full" | "card" | "phone";

export default function Playground({ slug }: { slug?: string }) {
  const entry = slug ? findInteraction(slug) : undefined;

  if (!entry) {
    return (
      <div className={styles.index}>
        <h1>Playground</h1>
        {slug && <p className={styles.missing}>No interaction called “{slug}”. Check the folder name and meta.slug.</p>}
        <ul>
          {interactions.map((e) => (
            <li key={e.meta.slug}>
              <a href={`/playground/${e.meta.slug}`}>{e.meta.title}</a>
              <code>{e.meta.slug}</code>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <Bench key={entry.meta.slug} entry={entry} />;
}

function Bench({ entry }: { entry: NonNullable<ReturnType<typeof findInteraction>> }) {
  const { meta } = entry;
  const [values, setValues] = useState(() => defaultValues(meta));
  const [size, setSize] = useState<Size>("full");
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className={styles.bench} data-size={size}>
      <div className={styles.frame}>
        <Stage entry={entry} values={values} />
      </div>

      <div className={styles.toolbar}>
        <a href="/playground">←</a>
        <strong>{meta.title}</strong>
        {(["full", "card", "phone"] as Size[]).map((s) => (
          <button key={s} data-active={size === s} onClick={() => setSize(s)}>
            {s}
          </button>
        ))}
        <button data-active={panelOpen} onClick={() => setPanelOpen((o) => !o)}>
          controls
        </button>
      </div>

      {panelOpen && Object.keys(meta.controls).length > 0 && (
        <div className={styles.panel}>
          <SliderPanel
            controls={meta.controls}
            values={values}
            onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))}
            onReset={() => setValues(defaultValues(meta))}
          />
        </div>
      )}
    </div>
  );
}
