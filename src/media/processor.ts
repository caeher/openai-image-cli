import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { ImageMetadata } from "../core/entities/model.js";
import type { OutputFormat } from "../core/entities/primitives.js";
import type {
  CompositeLayer,
  CropOptions,
  ResizeOptions,
  TypographySpec,
} from "../core/interfaces/media-options.js";
import type { MediaProcessor } from "../core/interfaces/services.js";
import { assertInside } from "./path-security.js";
import { sniff } from "./sniff.js";

export class SharpMediaProcessor implements MediaProcessor {
  constructor(private readonly defaultRoot: string = process.cwd()) {}

  private resolve(input: string, root?: string): string {
    const resolved = path.resolve(input);
    const base =
      root ?? (path.isAbsolute(resolved) ? path.parse(resolved).root : this.defaultRoot);
    return assertInside(base, resolved);
  }

  async inspect(filePath: string, root?: string): Promise<ImageMetadata> {
    const resolved = this.resolve(filePath, root);
    const buf = await fs.promises.readFile(resolved);
    sniff(buf.slice(0, 12));
    const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
    const meta = await sharp(buf).metadata();
    return {
      path: resolved,
      sha256,
      format: meta.format ?? "unknown",
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      bytes: buf.length,
      hasAlpha: meta.hasAlpha ?? false,
      source: "local",
    };
  }

  async resize(input: string, output: string, options: ResizeOptions, root?: string): Promise<ImageMetadata> {
    this.resolve(input, root);
    assertInside(root ?? this.defaultRoot, path.resolve(output));
    await sharp(input)
      .resize(options.width, options.height, { fit: options.fit ?? "inside" })
      .toFile(output);
    return await this.inspect(output, root);
  }

  async crop(input: string, output: string, options: CropOptions, root?: string): Promise<ImageMetadata> {
    this.resolve(input, root);
    assertInside(root ?? this.defaultRoot, path.resolve(output));
    await sharp(input).extract(options).toFile(output);
    return await this.inspect(output, root);
  }

  async rotate(input: string, output: string, degrees: number, root?: string): Promise<ImageMetadata> {
    this.resolve(input, root);
    assertInside(root ?? this.defaultRoot, path.resolve(output));
    await sharp(input).rotate(degrees).toFile(output);
    return await this.inspect(output, root);
  }

  async convert(
    input: string,
    output: string,
    format: OutputFormat,
    compression?: number,
    root?: string,
  ): Promise<ImageMetadata> {
    this.resolve(input, root);
    assertInside(root ?? this.defaultRoot, path.resolve(output));
    let pipeline = sharp(input);
    if (format === "jpeg") {
      pipeline = pipeline.jpeg({ quality: compression ?? 80 });
    } else if (format === "webp") {
      pipeline = pipeline.webp({ quality: compression ?? 80 });
    } else {
      pipeline = pipeline.png();
    }
    await pipeline.toFile(output);
    return await this.inspect(output, root);
  }

  async compress(input: string, output: string, quality: number, root?: string): Promise<ImageMetadata> {
    return await this.convert(input, output, "jpeg", quality, root);
  }

  async composite(layers: CompositeLayer[], output: string, root?: string): Promise<ImageMetadata> {
    assertInside(root ?? this.defaultRoot, path.resolve(output));
    const base = layers[0]?.input;
    if (!base) {
      throw new Error("composite requires at least one layer");
    }
    const composites = layers.slice(1).map((layer) => ({
      input: layer.input,
      left: layer.left ?? 0,
      top: layer.top ?? 0,
      opacity: layer.opacity,
    }));
    await sharp(base).composite(composites).toFile(output);
    return await this.inspect(output, root);
  }

  async watermark(input: string, output: string, text: string, root?: string): Promise<ImageMetadata> {
    this.resolve(input, root);
    const svg = `<svg width="400" height="100"><text x="10" y="50" font-size="24" fill="white">${escapeXml(text)}</text></svg>`;
    await sharp(input).composite([{ input: Buffer.from(svg), gravity: "southeast" }]).toFile(output);
    return await this.inspect(output, root);
  }

  async thumbnail(input: string, output: string, maxEdge: number, root?: string): Promise<ImageMetadata> {
    return await this.resize(input, output, { width: maxEdge, height: maxEdge, fit: "inside" }, root);
  }

  async contactSheet(inputs: readonly string[], output: string, root?: string): Promise<ImageMetadata> {
    const cols = Math.ceil(Math.sqrt(inputs.length));
    const tile = 256;
    const rows = Math.ceil(inputs.length / cols);
    const canvas = sharp({
      create: {
        width: cols * tile,
        height: rows * tile,
        channels: 3,
        background: "#111111",
      },
    });
    const composites = [];
    for (let i = 0; i < inputs.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const resized = await sharp(inputs[i]).resize(tile, tile, { fit: "contain" }).png().toBuffer();
      composites.push({ input: resized, left: col * tile, top: row * tile });
    }
    await canvas.composite(composites).png().toFile(output);
    return await this.inspect(output, root);
  }

  async compare(left: string, right: string, output: string, root?: string): Promise<ImageMetadata> {
    const leftMeta = await sharp(left).metadata();
    const height = leftMeta.height ?? 512;
    const leftBuf = await sharp(left).resize({ height, fit: "contain" }).png().toBuffer();
    const rightBuf = await sharp(right).resize({ height, fit: "contain" }).png().toBuffer();
    const leftW = (await sharp(leftBuf).metadata()).width ?? 0;
    const rightW = (await sharp(rightBuf).metadata()).width ?? 0;
    await sharp({
      create: { width: leftW + rightW, height, channels: 3, background: "#000" },
    })
      .composite([{ input: leftBuf, left: 0, top: 0 }, { input: rightBuf, left: leftW, top: 0 }])
      .png()
      .toFile(output);
    const meta = await this.inspect(output, root);
    meta.parameters = { method: "contain-side-by-side", scaled: true };
    return meta;
  }

  async interpolate(input: string, output: string, scale: number, root?: string): Promise<ImageMetadata> {
    this.resolve(input, root);
    const meta = await sharp(input).metadata();
    const width = Math.round((meta.width ?? 0) * scale);
    const height = Math.round((meta.height ?? 0) * scale);
    await sharp(input).resize(width, height, { kernel: sharp.kernel.lanczos3 }).toFile(output);
    const result = await this.inspect(output, root);
    result.parameters = { method: "lanczos3-interpolation", scale };
    return result;
  }

  async overlaySvgText(
    input: string,
    output: string,
    spec: TypographySpec,
    root?: string,
  ): Promise<ImageMetadata> {
    this.resolve(input, root);
    const meta = await sharp(input).metadata();
    const width = meta.width ?? 1;
    const height = meta.height ?? 1;
    const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.2));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="4" y="${Math.round(fontSize)}" font-size="${fontSize}">${escapeXml(spec.primaryText)}</text>${spec.secondaryText ? `<text x="4" y="${Math.round(fontSize * 1.6)}" font-size="${Math.round(fontSize * 0.5)}">${escapeXml(spec.secondaryText)}</text>` : ""}</svg>`;
    await sharp(input).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toFile(output);
    return await this.inspect(output, root);
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
