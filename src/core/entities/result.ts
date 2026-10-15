import type { ApiMode, OutputFormat } from "./primitives.js";
import type { CostReport } from "./cost.js";

export interface SavedImage {
  path: string;
  sha256: string;
  bytes: number;
  width?: number;
  height?: number;
  format: OutputFormat;
  partialIndex?: number;
  kind: "final" | "partial";
}

export interface TokenUsage {
  inputTokens: number;
  inputImageTokens?: number;
  inputTextTokens?: number;
  outputTokens: number;
  outputImageTokens?: number;
  outputTextTokens?: number;
  totalTokens: number;
  source: "provider" | "estimate";
}

export interface ImageGenerationResult {
  ok: true;
  dryRun: boolean;
  apiMode: ApiMode;
  model: string;
  responsesModel?: string;
  images: SavedImage[];
  partials: SavedImage[];
  revisedPrompt: string | null;
  revisedPromptAvailability: "returned" | "not-provided-by-images-api" | "not-run";
  responseId?: string;
  imageCallId?: string;
  usage?: TokenUsage;
  cost: CostReport;
  experimental: boolean;
  warnings: string[];
  providerPayload?: unknown;
}
