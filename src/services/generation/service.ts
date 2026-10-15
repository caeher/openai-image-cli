import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ImageEditRequest, ImageGenerationRequest } from "../../core/entities/request.js";
import { UsageError } from "../../core/errors/errors.js";
import type { SavedImage } from "../../core/entities/result.js";
import type { ImageGenerationResult } from "../../core/entities/result.js";
import type { ImageProvider } from "../../core/interfaces/provider.js";
import { buildGenerateBody } from "../../providers/openai/images-adapter.js";
import { buildResponsesBody } from "../../providers/openai/responses-adapter.js";
import type { CapabilityRegistry } from "../models/capabilities.js";
import type { CostEstimatorService } from "../costs/estimator.js";
import type { ModelRegistry } from "../models/registry.js";
import { FileImageRepository } from "../image-repository.js";
import { formatTimestamp, type Clock } from "../../utils/clock.js";
import { mapWithConcurrency } from "../../utils/concurrency.js";

export interface GenerationDeps {
  imagesProvider: ImageProvider;
  responsesProvider: ImageProvider;
  capabilities: CapabilityRegistry;
  models: ModelRegistry;
  costs: CostEstimatorService;
  clock: Clock;
  concurrency: number;
}

export class GenerationService {
  constructor(private readonly deps: GenerationDeps) {}

  async generate(
    request: ImageGenerationRequest | ImageEditRequest,
    signal: AbortSignal,
  ): Promise<ImageGenerationResult> {
    const modelConfig = this.deps.models.resolve(request.model);
    this.deps.capabilities.assertCompatible(modelConfig, request);

    if (request.output && fs.existsSync(request.output) && !request.force) {
      throw new UsageError(`Output file exists: ${request.output}. Use --force to overwrite.`);
    }

    const cost = this.deps.costs.estimate(request);
    const experimental = this.deps.capabilities.isExperimentalSize(request.model, request.size);

    if (request.dryRun) {
      const providerPayload =
        request.apiMode === "images"
          ? buildGenerateBody({
              prompt: request.prompt,
              model: request.model,
              size: request.size,
              quality: request.quality,
              format: request.format,
              background: request.background,
              count: request.count,
              stream: request.stream,
              partialImages: request.partialImages,
              ...(request.compression !== undefined ? { compression: request.compression } : {}),
              ...(request.moderation ? { moderation: request.moderation } : {}),
            })
          : buildResponsesBody({
              prompt: request.prompt,
              model: request.model,
              size: request.size,
              quality: request.quality,
              format: request.format,
              background: request.background,
              count: request.count,
              stream: request.stream,
              partialImages: request.partialImages,
              ...(request.responsesModel ? { responsesModel: request.responsesModel } : {}),
            });
      return {
        ok: true,
        dryRun: true,
        apiMode: request.apiMode,
        model: request.model,
        ...(request.responsesModel ? { responsesModel: request.responsesModel } : {}),
        images: [],
        partials: [],
        revisedPrompt: null,
        revisedPromptAvailability: "not-run",
        cost,
        experimental,
        warnings: [],
        providerPayload,
        savePartials: request.savePartials,
        prompt: request.prompt,
      };
    }

    fs.mkdirSync(request.directory, { recursive: true });
    const repo = new FileImageRepository(request.directory, { force: false, interactive: false });
    const provider =
      request.apiMode === "images" ? this.deps.imagesProvider : this.deps.responsesProvider;

    const warnings: string[] = [];
    const images = [];
    const partials: SavedImage[] = [];

    const callPayload = {
      prompt: request.prompt,
      model: request.model,
      size: request.size,
      quality: request.quality,
      format: request.format,
      background: request.background,
      count: request.count,
      stream: request.stream,
      partialImages: request.partialImages,
      ...(request.compression !== undefined ? { compression: request.compression } : {}),
      ...(request.moderation ? { moderation: request.moderation } : {}),
      ...("responsesModel" in request && request.responsesModel
        ? { responsesModel: request.responsesModel }
        : {}),
    };

    const callProvider = async () => {
      if ("images" in request && request.images.length > 0) {
        return await provider.edit(
          {
            ...callPayload,
            imagePaths: request.images.map((i) => i.path),
            ...(request.maskPath ? { maskPath: request.maskPath } : {}),
            ...(request.inputFidelity ? { inputFidelity: request.inputFidelity } : {}),
            ...(request.previousResponseId ? { previousResponseId: request.previousResponseId } : {}),
            ...(request.action ? { action: request.action } : {}),
          },
          signal,
        );
      }
      return await provider.generate(callPayload, signal);
    };

    if (request.apiMode === "responses" && request.count > 1) {
      const results = await mapWithConcurrency(
        Array.from({ length: request.count }),
        this.deps.concurrency,
        async () => callProvider(),
        signal,
      );
      for (let variantIndex = 0; variantIndex < results.length; variantIndex++) {
        const result = results[variantIndex];
        if (!result) {
          continue;
        }
        for (const img of result.images) {
          const targetPath =
            request.count > 1
              ? this.variantOutputPath(request, variantIndex)
              : (request.output ?? this.autoOutputPath(request));
          const saved = await repo.saveGenerated(Buffer.from(img.b64, "base64"), {
            path: targetPath,
            format: request.format,
            kind: "final",
          });
          images.push(saved);
        }
      }
      return {
        ok: true,
        dryRun: false,
        apiMode: request.apiMode,
        model: request.model,
        ...(request.responsesModel ? { responsesModel: request.responsesModel } : {}),
        images,
        partials,
        revisedPrompt: results[0]?.revisedPrompt ?? null,
        revisedPromptAvailability: "returned",
        cost,
        experimental,
        warnings,
      };
    }

    const result = await callProvider();
    for (const img of result.images) {
      const isPartial = img.kind === "partial";
      if (isPartial && !request.savePartials) {
        continue;
      }
      const targetPath = isPartial
        ? this.partialOutputPath(request, img.partialIndex ?? 0)
        : request.output ?? this.autoOutputPath(request);
      const saved = await repo.saveGenerated(Buffer.from(img.b64, "base64"), {
        path: targetPath,
        format: request.format,
        kind: isPartial ? "partial" : "final",
        ...(img.partialIndex !== undefined ? { partialIndex: img.partialIndex } : {}),
      });
      if (isPartial) {
        partials.push(saved);
      } else {
        images.push(saved);
      }
    }

    return {
      ok: true,
      dryRun: false,
      apiMode: request.apiMode,
      model: request.model,
      ...(request.responsesModel ? { responsesModel: request.responsesModel } : {}),
      images,
      partials,
      revisedPrompt: result.revisedPrompt,
      revisedPromptAvailability:
        request.apiMode === "images" ? "not-provided-by-images-api" : "returned",
      ...(result.responseId ? { responseId: result.responseId } : {}),
      ...(result.imageCallId ? { imageCallId: result.imageCallId } : {}),
      ...(result.usage ? { usage: result.usage } : {}),
      cost,
      experimental,
      warnings,
    };
  }

  private autoOutputPath(request: ImageGenerationRequest): string {
    const short = crypto.createHash("sha256").update(request.prompt).digest("hex").slice(0, 8);
    const ts = formatTimestamp(this.deps.clock.now());
    const name = `${ts}-${request.model}-${short}.${request.format}`;
    return path.join(request.directory, name);
  }

  private variantOutputPath(request: ImageGenerationRequest, index: number): string {
    const short = crypto.createHash("sha256").update(request.prompt).digest("hex").slice(0, 8);
    const ts = formatTimestamp(this.deps.clock.now());
    const name = `${ts}-${request.model}-${short}-${index}.${request.format}`;
    return path.join(request.directory, name);
  }

  private partialOutputPath(request: ImageGenerationRequest, index: number): string {
    const base = request.output
      ? path.basename(request.output, path.extname(request.output))
      : "image";
    const dir = request.output ? path.dirname(request.output) : request.directory;
    return path.join(dir, `${base}.partial-${index}.${request.format}`);
  }
}
