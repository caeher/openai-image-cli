import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ImageMetadata } from "../core/entities/model.js";
import type { OutputTarget } from "../core/interfaces/media-options.js";
import type { SavedImage } from "../core/entities/result.js";
import type { ImageRepository } from "../core/interfaces/services.js";
import { UsageError } from "../core/errors/errors.js";
import { writeAtomic } from "../media/atomic.js";
import { assertInside } from "../media/path-security.js";
import sharp from "sharp";

export class FileImageRepository implements ImageRepository {
  constructor(
    private readonly outputRoot: string,
    private readonly options: { force?: boolean; interactive?: boolean } = {},
  ) {}

  async saveGenerated(bytes: Buffer, target: OutputTarget): Promise<SavedImage> {
    const dir = path.dirname(target.path);
    assertInside(this.outputRoot, dir);
    if (fs.existsSync(target.path) && !this.options.force) {
      if (!this.options.interactive) {
        throw new UsageError(`Output file exists: ${target.path}. Use --force to overwrite.`);
      }
    }
    await writeAtomic(target.path, bytes);
    const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    const meta = await sharp(bytes).metadata();
    return {
      path: target.path,
      sha256,
      bytes: bytes.length,
      width: meta.width,
      height: meta.height,
      format: target.format,
      kind: target.kind,
      ...(target.partialIndex !== undefined ? { partialIndex: target.partialIndex } : {}),
    };
  }

  async readMetadata(filePath: string): Promise<ImageMetadata> {
    const buf = await fs.promises.readFile(filePath);
    const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
    const meta = await sharp(buf).metadata();
    return {
      path: filePath,
      sha256,
      format: meta.format ?? "unknown",
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      bytes: buf.length,
      hasAlpha: meta.hasAlpha ?? false,
      source: "local",
    };
  }
}
