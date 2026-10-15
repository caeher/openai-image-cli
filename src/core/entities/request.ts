import type {
  ApiMode,
  Background,
  InputFidelity,
  OutputFormat,
  Quality,
  ReferenceRole,
} from "./primitives.js";

export type { ReferenceRole };

export interface ImageReference {
  path: string;
  role: ReferenceRole;
  note?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  model: string;
  apiMode: ApiMode;
  responsesModel?: string;
  size: string;
  quality: Quality;
  format: OutputFormat;
  compression?: number;
  background: Background;
  count: number;
  moderation?: "auto" | "low";
  stream: boolean;
  partialImages: number;
  savePartials: boolean;
  output?: string;
  directory: string;
  dryRun: boolean;
  force?: boolean;
}

export interface ImageEditRequest extends ImageGenerationRequest {
  images: ImageReference[];
  maskPath?: string;
  inputFidelity?: InputFidelity;
  preserve: string[];
  action?: "auto" | "generate" | "edit";
  previousResponseId?: string;
}

export interface ExpandRequest extends ImageEditRequest {
  direction: "top" | "bottom" | "left" | "right" | "all";
  pixels?: number;
  aspect?: string;
}

export interface StyleRequest {
  prompt?: string;
  styleId: string;
  imagePath?: string;
  model: string;
  apiMode: ApiMode;
  responsesModel?: string;
  size: string;
  quality: Quality;
  format: OutputFormat;
  background: Background;
  directory: string;
  output?: string;
  dryRun: boolean;
  stream: boolean;
  partialImages: number;
  savePartials: boolean;
  count: number;
}

export interface BackgroundRequest {
  prompt?: string;
  imagePath?: string;
  backgroundDescription?: string;
  model: string;
  apiMode: ApiMode;
  responsesModel?: string;
  size: string;
  quality: Quality;
  format: OutputFormat;
  directory: string;
  output?: string;
  dryRun: boolean;
  stream: boolean;
  partialImages: number;
  savePartials: boolean;
}
