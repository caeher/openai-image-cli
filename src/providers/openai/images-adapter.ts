import fs from "node:fs";
import type {
  ImageProvider,
  ProviderEditCall,
  ProviderGenerateCall,
  ProviderImageResult,
} from "../../core/interfaces/provider.js";
import { mapOpenAiError } from "./map-error.js";

export interface ImagesApiClient {
  images: {
    generate: (body: Record<string, unknown>) => Promise<unknown>;
    edit: (body: Record<string, unknown>) => Promise<unknown>;
  };
}

function buildGenerateBody(request: ProviderGenerateCall): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: request.model,
    prompt: request.prompt,
    size: request.size,
    quality: request.quality,
    output_format: request.format,
    background: request.background,
    n: request.count,
  };
  if (request.moderation) {
    body.moderation = request.moderation;
  }
  if (request.compression !== undefined && (request.format === "jpeg" || request.format === "webp")) {
    body.output_compression = request.compression;
  }
  if (request.stream) {
    body.stream = true;
    body.partial_images = request.partialImages;
  }
  return body;
}

function parseImageResponse(data: unknown): ProviderImageResult {
  const response = data as {
    data?: Array<{ b64_json?: string }>;
    usage?: Record<string, number>;
  };
  const images =
    response.data?.map((item, index) => ({
      b64: item.b64_json ?? "",
      kind: "final" as const,
      partialIndex: index,
    })) ?? [];
  const usage = response.usage
    ? {
        inputTokens: response.usage.input_tokens ?? 0,
        outputTokens: response.usage.output_tokens ?? 0,
        totalTokens: response.usage.total_tokens ?? 0,
        source: "provider" as const,
      }
    : undefined;
  return {
    images,
    revisedPrompt: null,
    ...(usage ? { usage } : {}),
  };
}

export class OpenAiImagesAdapter implements ImageProvider {
  readonly mode = "images" as const;

  constructor(private readonly client: ImagesApiClient) {}

  async generate(request: ProviderGenerateCall, _signal: AbortSignal): Promise<ProviderImageResult> {
    try {
      const body = buildGenerateBody(request);
      const result = await this.client.images.generate(body);
      return parseImageResponse(result);
    } catch (error) {
      throw mapOpenAiError(error);
    }
  }

  async edit(request: ProviderEditCall, _signal: AbortSignal): Promise<ProviderImageResult> {
    try {
      const body: Record<string, unknown> = {
        ...buildGenerateBody(request),
        image: request.imagePaths.map((p) => fs.createReadStream(p)),
      };
      if (request.maskPath) {
        body.mask = fs.createReadStream(request.maskPath);
      }
      if (request.inputFidelity) {
        body.input_fidelity = request.inputFidelity;
      }
      const result = await this.client.images.edit(body);
      return parseImageResponse(result);
    } catch (error) {
      throw mapOpenAiError(error);
    }
  }
}

export { buildGenerateBody };
