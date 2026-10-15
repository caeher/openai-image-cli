import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type {
  BackgroundRequest,
  ExpandRequest,
  ImageEditRequest,
  StyleRequest,
} from "../../core/entities/request.js";
import type { ImageGenerationResult } from "../../core/entities/result.js";
import { UsageError } from "../../core/errors/errors.js";
import type { GenerationService } from "../generation/service.js";
import type { MaskManager } from "../../core/interfaces/services.js";
import type { PromptBuilder } from "../../core/interfaces/services.js";
import type { ReferenceManager } from "../../core/interfaces/services.js";
import type { ModelRegistry } from "../models/registry.js";
import type { CostEstimatorService } from "../costs/estimator.js";
import { validateFlexible, isFlexible } from "../models/size.js";
import { writeAtomic } from "../../media/atomic.js";
import crypto from "node:crypto";

export interface EditingDeps {
  generation: GenerationService;
  masks: MaskManager;
  prompts: PromptBuilder;
  references: ReferenceManager;
  models: ModelRegistry;
  costs: CostEstimatorService;
}

export class EditingService {
  constructor(private readonly deps: EditingDeps) {}

  private buildEditPrompt(request: ImageEditRequest): string {
    let prompt = request.prompt;
    if (request.preserve.length) {
      prompt = `${prompt}\nConservar: ${request.preserve.join("; ")}`;
    }
    if (request.images.length) {
      prompt = `${prompt}\n${this.deps.references.formatForPrompt(request.images)}`;
    }
    return prompt;
  }

  async edit(request: ImageEditRequest, signal: AbortSignal): Promise<ImageGenerationResult> {
    const editRequest = { ...request, prompt: this.buildEditPrompt(request) };
    return await this.deps.generation.generate(editRequest, signal);
  }

  async inpaint(request: ImageEditRequest, signal: AbortSignal): Promise<ImageGenerationResult> {
    const model = this.deps.models.resolve(request.model);
    if (!request.maskPath) {
      throw new UsageError("inpaint requires --mask");
    }
    await this.deps.masks.assertApplicable(request.maskPath, request.images[0]?.path ?? "", model);
    return await this.edit(request, signal);
  }

  async expand(request: ExpandRequest, signal: AbortSignal): Promise<ImageGenerationResult> {
    const imagePath = request.images[0]?.path;
    if (!imagePath) {
      throw new UsageError("expand requires --image");
    }
    const inputBuf = await fs.promises.readFile(imagePath);
    const inputHash = crypto.createHash("sha256").update(inputBuf).digest("hex");
    const meta = await sharp(inputBuf).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    let top = 0;
    let bottom = 0;
    let left = 0;
    let right = 0;
    const pixels = request.pixels ?? 0;
    if (request.direction === "all") {
      top = bottom = left = right = pixels;
    } else if (request.direction === "top") {
      top = pixels;
    } else if (request.direction === "bottom") {
      bottom = pixels;
    } else if (request.direction === "left") {
      left = pixels;
    } else if (request.direction === "right") {
      right = pixels;
    }

    if (request.aspect) {
      const parts = request.aspect.split(":").map((n) => Number.parseInt(n, 10));
      const aw = parts[0] ?? 1;
      const ah = parts[1] ?? 1;
      const targetRatio = aw / ah;
      const currentRatio = width / height;
      let newW = width;
      let newH = height;
      if (currentRatio < targetRatio) {
        newW = Math.ceil(height * targetRatio);
      } else {
        newH = Math.ceil(width / targetRatio);
      }
      if (newW <= width && newH <= height) {
        const cropped = await sharp(inputBuf)
          .extract({
            left: Math.floor((width - newW) / 2),
            top: Math.floor((height - newH) / 2),
            width: newW,
            height: newH,
          })
          .png()
          .toBuffer();
        const outPath = request.output ?? path.join(request.directory, "expand-crop.png");
        await writeAtomic(outPath, cropped);
        return {
          ok: true,
          dryRun: request.dryRun,
          apiMode: request.apiMode,
          model: request.model,
          images: [],
          partials: [],
          revisedPrompt: null,
          revisedPromptAvailability: "not-run",
          cost: this.deps.costs.estimate(request),
          experimental: false,
          warnings: ["source: local-crop"],
        };
      }
      left = Math.max(0, Math.floor((newW - width) / 2));
      right = newW - width - left;
      top = Math.max(0, Math.floor((newH - height) / 2));
      bottom = newH - height - top;
    }

    const newWidth = width + left + right;
    const newHeight = height + top + bottom;
    const sizeStr = `${newWidth}x${newHeight}`;
    if (request.dryRun) {
      return await this.edit(
        {
          ...request,
          images: [{ path: imagePath, role: "subject" }],
          size: sizeStr,
          dryRun: true,
        },
        signal,
      );
    }
    if (isFlexible(request.model)) {
      validateFlexible(newWidth, newHeight);
    }

    const tmpDir = path.join(request.directory, ".expand-tmp");
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const canvasPath = path.join(tmpDir, "canvas.png");
    const maskPath = path.join(tmpDir, "mask.png");

    await sharp({
      create: {
        width: newWidth,
        height: newHeight,
        channels: 3,
        background: "#808080",
      },
    })
      .composite([{ input: inputBuf, left, top }])
      .png()
      .toFile(canvasPath);

    const maskRaw = Buffer.alloc(newWidth * newHeight * 4, 255);
    for (let y = top; y < top + height; y++) {
      for (let x = left; x < left + width; x++) {
        const idx = (y * newWidth + x) * 4;
        maskRaw[idx + 3] = 255;
      }
    }
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const inOriginal = x >= left && x < left + width && y >= top && y < top + height;
        if (!inOriginal) {
          const idx = (y * newWidth + x) * 4;
          maskRaw[idx + 3] = 0;
        }
      }
    }
    await sharp(maskRaw, { raw: { width: newWidth, height: newHeight, channels: 4 } })
      .png()
      .toFile(maskPath);

    const afterHash = crypto.createHash("sha256").update(await fs.promises.readFile(imagePath)).digest("hex");
    if (afterHash !== inputHash) {
      throw new UsageError("Input image was modified during expand preparation");
    }

    const expandRequest: ImageEditRequest = {
      ...request,
      images: [{ path: canvasPath, role: "subject" }],
      maskPath,
      size: sizeStr,
      prompt: request.prompt,
    };
    return await this.edit(expandRequest, signal);
  }

  async compose(request: ImageEditRequest, signal: AbortSignal): Promise<ImageGenerationResult> {
    return await this.edit(request, signal);
  }

  async applyStyle(request: StyleRequest, signal: AbortSignal): Promise<ImageGenerationResult> {
    const stylePhrase = this.deps.prompts.build({ styleId: request.styleId, fields: {} }).text;
    const prompt = `${stylePhrase}\n${request.prompt ?? ""}`.trim();
    if (request.imagePath) {
      return await this.edit(
        {
          prompt,
          model: request.model,
          apiMode: request.apiMode,
          ...(request.responsesModel ? { responsesModel: request.responsesModel } : {}),
          size: request.size,
          quality: request.quality,
          format: request.format,
          background: request.background,
          count: request.count,
          stream: request.stream,
          partialImages: request.partialImages,
          savePartials: request.savePartials,
          directory: request.directory,
          dryRun: request.dryRun,
          images: [{ path: request.imagePath, role: "style" }],
          preserve: [],
        },
        signal,
      );
    }
    return await this.deps.generation.generate(
      {
        prompt,
        model: request.model,
        apiMode: request.apiMode,
        ...(request.responsesModel ? { responsesModel: request.responsesModel } : {}),
        size: request.size,
        quality: request.quality,
        format: request.format,
        background: request.background,
        count: request.count,
        stream: request.stream,
        partialImages: request.partialImages,
        savePartials: request.savePartials,
        directory: request.directory,
        dryRun: request.dryRun,
        ...(request.output ? { output: request.output } : {}),
      } as import("../../core/entities/request.js").ImageGenerationRequest,
      signal,
    );
  }

  async transparent(request: BackgroundRequest, signal: AbortSignal): Promise<ImageGenerationResult> {
    return await this.backgroundOp({ ...request, transparent: true }, signal);
  }

  async replaceBackground(request: BackgroundRequest, signal: AbortSignal): Promise<ImageGenerationResult> {
    const prompt = `${request.prompt ?? ""} Fondo: ${request.backgroundDescription ?? ""}. El recorte exacto no está garantizado.`.trim();
    return await this.backgroundOp({ ...request, prompt, transparent: false }, signal);
  }

  async removeBackground(request: BackgroundRequest, signal: AbortSignal): Promise<ImageGenerationResult> {
    if (!request.imagePath) {
      return await this.transparent({ ...request, format: "png" }, signal);
    }
    const prompt =
      request.prompt ??
      "Aislar el sujeto principal y eliminar el fondo de forma generativa. El recorte exacto no está garantizado.";
    return await this.edit(
      {
        prompt,
        model: request.model,
        apiMode: request.apiMode,
        ...(request.responsesModel ? { responsesModel: request.responsesModel } : {}),
        size: request.size,
        quality: request.quality,
        format: request.format,
        background: "auto",
        count: 1,
        stream: request.stream,
        partialImages: request.partialImages,
        savePartials: request.savePartials,
        directory: request.directory,
        dryRun: request.dryRun,
        images: [{ path: request.imagePath, role: "subject" }],
        preserve: [],
      } as import("../../core/entities/request.js").ImageEditRequest,
      signal,
    );
  }

  private async backgroundOp(
    request: BackgroundRequest & { transparent?: boolean; prompt?: string },
    signal: AbortSignal,
  ): Promise<ImageGenerationResult> {
    const format = request.transparent ? "png" : request.format;
    const background = request.transparent ? "transparent" : "auto";
    if (request.imagePath) {
      return await this.edit(
        {
          prompt: request.prompt ?? "Edit image",
          model: request.model,
          apiMode: request.apiMode,
          ...(request.responsesModel ? { responsesModel: request.responsesModel } : {}),
          size: request.size,
          quality: request.quality,
          format,
          background,
          count: 1,
          stream: request.stream,
          partialImages: request.partialImages,
          savePartials: request.savePartials,
          directory: request.directory,
          dryRun: request.dryRun,
          images: [{ path: request.imagePath, role: "subject" }],
          preserve: [],
        } as import("../../core/entities/request.js").ImageEditRequest,
        signal,
      );
    }
    return await this.deps.generation.generate(
      {
        prompt: request.prompt ?? "Generate image",
        model: request.model,
        apiMode: request.apiMode,
        ...(request.responsesModel ? { responsesModel: request.responsesModel } : {}),
        size: request.size,
        quality: request.quality,
        format,
        background,
        count: 1,
        stream: request.stream,
        partialImages: request.partialImages,
        savePartials: request.savePartials,
        directory: request.directory,
        dryRun: request.dryRun,
        ...(request.output ? { output: request.output } : {}),
      } as import("../../core/entities/request.js").ImageGenerationRequest,
      signal,
    );
  }
}
