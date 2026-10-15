import type { ApiMode, Background, OutputFormat, Quality } from "../core/entities/primitives.js";

export interface ProductDefaults {
  model: string;
  size: string;
  quality: Quality;
  format: OutputFormat;
  background: Background;
  compression?: number;
  count: number;
  concurrency: number;
  budgetUsd?: number;
  retries: number;
  timeoutMs: number;
  apiMode: ApiMode;
  responsesModel: string;
  outputDir: string;
  prompt?: {
    optimizeModel?: string;
  };
  typography?: {
    reviewModel?: string;
  };
}

export const PRODUCT_DEFAULTS: ProductDefaults = {
  model: "gpt-image-2.5-flare",
  size: "auto",
  quality: "auto",
  format: "png",
  background: "auto",
  count: 1,
  concurrency: 2,
  retries: 3,
  timeoutMs: 180_000,
  apiMode: "images",
  responsesModel: "gpt-5.5",
  outputDir: "./output",
};
