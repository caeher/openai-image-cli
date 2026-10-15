import fs from "node:fs";
import sharp from "sharp";
import type { ImageModelConfig } from "../../core/entities/model.js";
import { CapabilityError, UsageError } from "../../core/errors/errors.js";
import type { ImageMask, MaskManager } from "../../core/interfaces/services.js";
import { sniff } from "../../media/sniff.js";
import { writeAtomic } from "../../media/atomic.js";
import {
  blurAlpha,
  dilateAlpha,
  erodeAlpha,
  intersectAlpha,
  invertAlpha,
  unionAlpha,
} from "./morphology.js";

const MAX_MASK_BYTES = 4 * 1024 * 1024;

async function readMaskAlpha(maskPath: string): Promise<{
  alpha: Uint8Array;
  width: number;
  height: number;
}> {
  const stat = await fs.promises.stat(maskPath);
  if (stat.size > MAX_MASK_BYTES) {
    throw new UsageError("Mask file exceeds 4 MB limit");
  }
  const buf = await fs.promises.readFile(maskPath);
  sniff(buf.slice(0, 12));
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (!info.hasAlpha) {
    throw new UsageError("Mask PNG must have an alpha channel");
  }
  const alpha = new Uint8Array(info.width * info.height);
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = data[i * 4 + 3] ?? 255;
  }
  return { alpha, width: info.width ?? 0, height: info.height ?? 0 };
}

async function writeMaskAlpha(
  outputPath: string,
  alpha: Uint8Array,
  width: number,
  height: number,
): Promise<void> {
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < alpha.length; i++) {
    const idx = i * 4;
    rgba[idx] = 255;
    rgba[idx + 1] = 255;
    rgba[idx + 2] = 255;
    rgba[idx + 3] = alpha[i] ?? 255;
  }
  const png = await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
  await writeAtomic(outputPath, png);
}

export class MaskManagerService implements MaskManager {
  async inspect(maskPath: string, baseImagePath: string): Promise<ImageMask> {
    const base = await sharp(baseImagePath).metadata();
    const { alpha, width, height } = await readMaskAlpha(maskPath);
    if (base.width !== width || base.height !== height) {
      throw new UsageError("Mask dimensions must match base image");
    }
    let editable = 0;
    let opaque = 0;
    for (const a of alpha) {
      if (a === 0) {
        editable += 1;
      } else {
        opaque += 1;
      }
    }
    return { path: maskPath, width, height, editablePixelCount: editable, opaquePixelCount: opaque };
  }

  async assertApplicable(maskPath: string, baseImagePath: string, model: ImageModelConfig): Promise<ImageMask> {
    if (!model.capabilities.mask) {
      throw new CapabilityError("Mask is not supported for this model", { model: model.id, field: "mask" });
    }
    const buf = await fs.promises.readFile(maskPath);
    let format: ReturnType<typeof sniff>;
    try {
      format = sniff(buf.slice(0, 12));
    } catch {
      throw new UsageError("Mask must be PNG with valid magic bytes");
    }
    if (format !== "png") {
      throw new UsageError("Mask must be PNG (JPEG and WebP are not supported)");
    }
    return await this.inspect(maskPath, baseImagePath);
  }

  async renderPreview(baseImagePath: string, maskPath: string, outputPath: string): Promise<void> {
    const { alpha, width, height } = await readMaskAlpha(maskPath);
    const overlay = Buffer.alloc(width * height * 4);
    for (let i = 0; i < alpha.length; i++) {
      const idx = i * 4;
      if (alpha[i] === 0) {
        overlay[idx] = 255;
        overlay[idx + 1] = 0;
        overlay[idx + 2] = 255;
        overlay[idx + 3] = Math.round(255 * 0.4);
      }
    }
    const overlayPng = await sharp(overlay, { raw: { width, height, channels: 4 } }).png().toBuffer();
    await sharp(baseImagePath).composite([{ input: overlayPng, blend: "over" }]).png().toFile(outputPath);
  }

  async invert(maskPath: string, outputPath: string): Promise<void> {
    const { alpha, width, height } = await readMaskAlpha(maskPath);
    await writeMaskAlpha(outputPath, invertAlpha(alpha), width, height);
  }

  async union(maskA: string, maskB: string, outputPath: string): Promise<void> {
    const a = await readMaskAlpha(maskA);
    const b = await readMaskAlpha(maskB);
    if (a.width !== b.width || a.height !== b.height) {
      throw new UsageError("Mask dimensions must match for union");
    }
    await writeMaskAlpha(outputPath, unionAlpha(a.alpha, b.alpha), a.width, a.height);
  }

  async intersect(maskA: string, maskB: string, outputPath: string): Promise<void> {
    const a = await readMaskAlpha(maskA);
    const b = await readMaskAlpha(maskB);
    if (a.width !== b.width || a.height !== b.height) {
      throw new UsageError("Mask dimensions must match for intersect");
    }
    await writeMaskAlpha(outputPath, intersectAlpha(a.alpha, b.alpha), a.width, a.height);
  }

  async dilate(maskPath: string, outputPath: string, radius: number): Promise<void> {
    const { alpha, width, height } = await readMaskAlpha(maskPath);
    await writeMaskAlpha(outputPath, dilateAlpha(alpha, width, height, radius), width, height);
  }

  async erode(maskPath: string, outputPath: string, radius: number): Promise<void> {
    const { alpha, width, height } = await readMaskAlpha(maskPath);
    await writeMaskAlpha(outputPath, erodeAlpha(alpha, width, height, radius), width, height);
  }

  async blur(maskPath: string, outputPath: string, radius: number): Promise<void> {
    const { alpha, width, height } = await readMaskAlpha(maskPath);
    await writeMaskAlpha(outputPath, blurAlpha(alpha, width, height, radius), width, height);
  }

  async fromRect(
    baseImagePath: string,
    outputPath: string,
    rect: { left: number; top: number; width: number; height: number },
    invert = false,
  ): Promise<void> {
    const meta = await sharp(baseImagePath).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const alpha = new Uint8Array(width * height).fill(255);
    for (let y = rect.top; y < rect.top + rect.height; y++) {
      for (let x = rect.left; x < rect.left + rect.width; x++) {
        if (x >= 0 && y >= 0 && x < width && y < height) {
          alpha[y * width + x] = invert ? 255 : 0;
        }
      }
    }
    if (invert) {
      for (let i = 0; i < alpha.length; i++) {
        if (alpha[i] !== 0) {
          alpha[i] = 0;
        } else {
          alpha[i] = 255;
        }
      }
    }
    await writeMaskAlpha(outputPath, alpha, width, height);
  }

  async fromPolygon(
    baseImagePath: string,
    outputPath: string,
    points: Array<{ x: number; y: number }>,
    invert = false,
  ): Promise<void> {
    const meta = await sharp(baseImagePath).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const alpha = new Uint8Array(width * height).fill(255);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (pointInPolygon(x, y, points)) {
          alpha[y * width + x] = invert ? 255 : 0;
        }
      }
    }
    await writeMaskAlpha(outputPath, alpha, width, height);
  }
}

function pointInPolygon(x: number, y: number, points: Array<{ x: number; y: number }>): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const pi = points[i];
    const pj = points[j];
    if (!pi || !pj) {
      continue;
    }
    const xi = pi.x;
    const yi = pi.y;
    const xj = pj.x;
    const yj = pj.y;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}
