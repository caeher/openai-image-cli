import type { ModelStatus, Quality } from "./primitives.js";
import type { ModelPricing } from "./model-pricing.js";

export interface ImageCapabilities {
  modelId: string;
  status: ModelStatus;
  shutdownDate?: string;
  generate: boolean;
  edit: boolean;
  toolModel: boolean;
  batchImages: boolean;
  qualities: readonly Quality[];
  fixedSizes: readonly string[];
  customSize: boolean | "experimental-above-2560x1440";
  transparentBackground: "supported" | "preview" | "unsupported";
  mask: boolean;
  maxReferences: number;
  maxN: number;
  stream: boolean;
  partialImages: { min: 0; max: 3 };
  inputFidelity: "omit" | "low-or-high" | "low-only";
  moderationOnGenerate: boolean;
  moderationOnEdit: boolean;
  revisedPromptOnImages: boolean;
  revisedPromptOnResponses: boolean;
}

export interface ImageModelConfig {
  id: string;
  displayName: string;
  status: ModelStatus;
  snapshotIds: readonly string[];
  capabilities: ImageCapabilities;
  pricing: ModelPricing;
  rateLimit: {
    tiers: readonly { tier: string; tpm: number; ipm: number }[];
    aboveGrow: "unknown";
  };
  sourceUrls: readonly string[];
  verifiedOn: "2026-10-15";
}

export interface ImageMetadata {
  path: string;
  sha256: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  hasAlpha: boolean;
  createdAt?: string;
  source: "generated" | "edited" | "local" | "imported";
  model?: string;
  prompt?: string;
  revisedPrompt?: string | null;
  parameters?: Record<string, string | number | boolean | null>;
  cost?: import("./cost.js").CostReport;
}
