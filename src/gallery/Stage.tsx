import { Component, Suspense, type ReactNode } from "react";
import type { Entry } from "./registry";
import type { ControlValues } from "./types";
import styles from "./Stage.module.css";

type Props = {
  entry: Entry;
  values?: ControlValues;
  className?: string;
};

/** Renders one interaction inside a sized box, with loading and error states. */
export default function Stage({ entry, values, className }: Props) {
  const { Component: Interaction, meta } = entry;
  return (
    <div className={`${styles.stage} ${className ?? ""}`} style={meta.background ? { background: meta.background } : undefined}>
      <ErrorBoundary title={meta.title}>
        <Suspense fallback={<div className={styles.loading} />}>
          <Interaction {...values} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

class ErrorBoundary extends Component<{ title: string; children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error(`[gallery] "${this.props.title}" crashed`, error);
  }
  render() {
    if (this.state.error) {
      return (
        <div className={styles.error}>
          <strong>{this.props.title} crashed</strong>
          <span>{this.state.error.message}</span>
        </div>
      );
    }
    return this.props.children;
  }
}
