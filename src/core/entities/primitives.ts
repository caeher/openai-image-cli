export type ApiMode = "images" | "responses";

export type ModelStatus = "active" | "deprecated" | "retired";

export type Quality = "auto" | "low" | "medium" | "high" | "xhigh" | "max";

export type OutputFormat = "png" | "jpeg" | "webp";

export type Background = "auto" | "opaque" | "transparent";

export type InputFidelity = "low" | "high";

export type ReferenceRole =
  | "subject"
  | "face"
  | "clothing"
  | "object"
  | "background"
  | "composition"
  | "color-palette"
  | "lighting"
  | "style"
  | "material"
  | "texture";
