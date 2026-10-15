import { UsageError } from "../../core/errors/errors.js";

export interface ParsedSize {
  width: number;
  height: number;
}

export function parseSize(size: string): ParsedSize {
  if (size === "auto") {
    return { width: 1024, height: 1024 };
  }
  const match = /^(\d+)x(\d+)$/.exec(size);
  if (!match) {
    throw new UsageError(`Invalid size format: ${size}`);
  }
  const width = match[1];
  const height = match[2];
  if (!width || !height) {
    throw new UsageError(`Invalid size format: ${size}`);
  }
  return { width: Number.parseInt(width, 10), height: Number.parseInt(height, 10) };
}

const FLEXIBLE_MODEL_PREFIXES = [
  "gpt-image-2.5-sunburst",
  "gpt-image-2.5-flare",
  "gpt-image-2",
];

export function isFlexible(modelId: string): boolean {
  if (modelId.startsWith("dall-e")) {
    return false;
  }
  return FLEXIBLE_MODEL_PREFIXES.some(
    (prefix) => modelId === prefix || modelId.startsWith(`${prefix}-`),
  );
}

export function validateFlexible(width: number, height: number): void {
  if (width % 16 !== 0 || height % 16 !== 0) {
    throw new UsageError("Flexible size dimensions must be multiples of 16");
  }
  const ratio = width / height;
  if (ratio < 1 / 3 || ratio > 3) {
    throw new UsageError("Flexible size aspect ratio must be between 1:3 and 3:1");
  }
  if (width > 3840 || height > 3840) {
    throw new UsageError("Flexible size sides must be at most 3840");
  }
  const pixels = width * height;
  if (pixels < 655_360 || pixels > 8_294_400) {
    throw new UsageError("Flexible size pixel count must be between 655360 and 8294400");
  }
}

export function isExperimental(width: number, height: number): boolean {
  return width * height > 2560 * 1440;
}
