import type { OutputFormat } from "../entities/primitives.js";

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

export interface CropOptions {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CompositeLayer {
  input: string;
  left?: number;
  top?: number;
  opacity?: number;
}

export interface TypographySpec {
  primaryText: string;
  secondaryText?: string;
  hierarchy?: string;
  language?: string;
  style?: string;
  composition?: string;
  colors?: string;
}

export interface OutputTarget {
  path: string;
  format: OutputFormat;
  partialIndex?: number;
  kind: "final" | "partial";
}
