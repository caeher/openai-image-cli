import type { ModelRegistry } from "../models/registry.js";

export function getPerImageUsd(
  models: ModelRegistry,
  modelId: string,
  quality: string,
  size: string,
): string | null {
  const model = models.get(modelId);
  const table = model?.pricing.perImageUsd;
  if (!table) {
    return null;
  }
  const q = quality === "auto" ? null : table[quality];
  if (!q) {
    return null;
  }
  if (size === "auto") {
    const values = Object.values(q);
    return values.length ? (values[0] ?? null) : null;
  }
  return q[size] ?? null;
}

export function listQualitiesForModel(models: ModelRegistry, modelId: string, size: string): string[] {
  const model = models.get(modelId);
  const table = model?.pricing.perImageUsd;
  if (!table) {
    return [];
  }
  if (size === "auto") {
    return Object.keys(table);
  }
  return Object.keys(table).filter((q) => table[q]?.[size] !== undefined);
}

export function sunburstOutputTokenRateUsd(): string {
  return "30";
}
