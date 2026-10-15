import type { ImageGenerationRequest } from "../../core/entities/request.js";
import type { ImageGenerationResult } from "../../core/entities/result.js";
import type { StreamingService } from "../../core/interfaces/services.js";
import type { GenerationService } from "../generation/service.js";

export class StreamingServiceImpl implements StreamingService {
  constructor(private readonly generation: GenerationService) {}

  async generateWithStreaming(
    request: ImageGenerationRequest,
    signal: AbortSignal,
    onPartial?: (index: number) => void,
  ): Promise<ImageGenerationResult> {
    const result = await this.generation.generate({ ...request, stream: true }, signal);
    for (const partial of result.partials) {
      onPartial?.(partial.partialIndex ?? 0);
    }
    if (request.partialImages > 0 && result.partials.length < request.partialImages) {
      result.warnings.push(
        `Expected up to ${request.partialImages} partial images but received ${result.partials.length}`,
      );
    }
    return result;
  }
}
