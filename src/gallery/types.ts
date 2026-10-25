export type NumberControl = {
  type: "number";
  min: number;
  max: number;
  step?: number;
  default: number;
  label?: string;
  unit?: string;
};

export type ColorControl = { type: "color"; default: string; label?: string };
export type BooleanControl = { type: "boolean"; default: boolean; label?: string };
export type TextControl = { type: "text"; default: string; label?: string };
export type SelectControl = {
  type: "select";
  options: readonly string[];
  default: string;
  label?: string;
};

export type Control = NumberControl | ColorControl | BooleanControl | TextControl | SelectControl;
export type ControlValue = number | string | boolean;
export type ControlValues = Record<string, ControlValue>;

export type InteractionMeta = {
  /** Must match the folder name. */
  slug: string;
  title: string;
  kind: "original" | "study";
  /** Required for studies: who or what this recreates. */
  inspiredBy?: { name: string; url?: string };
  /** One or two sentences on the design intent or what was learned. */
  note: string;
  tags: string[];
  /** ISO date (YYYY-MM-DD). Newest shows first; recent ones get a "New" badge. */
  added?: string;
  /** Background behind the interaction in cards and the detail stage. Defaults to the theme surface. */
  background?: string;
  /** Card shape in the grid as width / height. Mix shapes for a livelier masonry. Defaults to 3 / 2. */
  aspect?: number;
  controls: Record<string, Control>;
};
