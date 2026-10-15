import { z } from "zod";
import { PRODUCT_DEFAULTS, type ProductDefaults } from "./defaults.js";

// ConfigFile mirrors ProductDefaults fields allowed in YAML.

const secretKeys = new Set(["apiKey", "openai_api_key", "OPENAI_API_KEY"]);

const qualitySchema = z.enum(["auto", "low", "medium", "high", "xhigh", "max"]);
const formatSchema = z.enum(["png", "jpeg", "webp"]);
const backgroundSchema = z.enum(["auto", "opaque", "transparent"]);
const apiModeSchema = z.enum(["images", "responses"]);

export const configFileSchema = z
  .object({
    model: z.string().optional(),
    size: z.string().optional(),
    quality: qualitySchema.optional(),
    format: formatSchema.optional(),
    background: backgroundSchema.optional(),
    compression: z.number().int().min(0).max(100).optional(),
    count: z.number().int().min(1).max(10).optional(),
    concurrency: z.number().int().min(1).max(20).optional(),
    budgetUsd: z.number().positive().optional(),
    retries: z.number().int().min(0).max(10).optional(),
    timeoutMs: z.number().int().positive().optional(),
    apiMode: apiModeSchema.optional(),
    responsesModel: z.string().optional(),
    outputDir: z.string().optional(),
    prompt: z
      .object({
        optimizeModel: z.string().optional(),
      })
      .optional(),
    typography: z
      .object({
        reviewModel: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export type ConfigFile = Partial<ProductDefaults>;

export interface EffectiveConfig extends ProductDefaults {
  sources: Record<string, "flag" | "env" | "project" | "global" | "default">;
}

export function parseConfigYamlObject(raw: Record<string, unknown>): ConfigFile {
  for (const key of Object.keys(raw)) {
    if (secretKeys.has(key)) {
      throw new Error(`Secret key "${key}" is not allowed in config files`);
    }
  }
  return configFileSchema.parse(raw) as Partial<import("./defaults.js").ProductDefaults>;
}

export function parseConfigJsonObject(raw: Record<string, unknown>): ConfigFile {
  return parseConfigYamlObject(raw);
}

export function mergeConfig(
  layers: Array<{ data: Partial<ProductDefaults>; source: EffectiveConfig["sources"][string] }>,
): EffectiveConfig {
  const sources: EffectiveConfig["sources"] = {};
  const merged: ProductDefaults = { ...PRODUCT_DEFAULTS };

  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer.data)) {
      if (value !== undefined) {
        (merged as unknown as Record<string, unknown>)[key] = value;
        sources[key] = layer.source;
      }
    }
  }

  return { ...merged, sources };
}
