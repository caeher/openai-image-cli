import type { ImageModelConfig } from "../../core/entities/model.js";
import type { ImageEditRequest, ImageGenerationRequest } from "../../core/entities/request.js";
import { CapabilityError, UsageError } from "../../core/errors/errors.js";
import { isExperimental, isFlexible, parseSize, validateFlexible } from "./size.js";
import { ModelRegistry } from "./registry.js";

function isSunburstOrFlare(modelId: string): boolean {
  return (
    modelId.includes("sunburst") ||
    modelId.includes("flare") ||
    modelId === "gpt-image-2.5-sunburst" ||
    modelId === "gpt-image-2.5-flare"
  );
}

export class CapabilityRegistry {
  constructor(private readonly models: ModelRegistry = new ModelRegistry()) {}

  getCapabilities(modelId: string) {
    return this.models.resolve(modelId).capabilities;
  }

  assertCompatible(model: ImageModelConfig, request: ImageGenerationRequest | ImageEditRequest): void {
    const caps = model.capabilities;
    if (model.status === "retired" || !caps.generate) {
      throw new CapabilityError(`Model ${model.id} is retired or not available`, { model: model.id });
    }

    if (request.quality === "xhigh" || request.quality === "max") {
      if (!isSunburstOrFlare(model.id)) {
        throw new CapabilityError(`Quality ${request.quality} is not supported for ${model.id}`, {
          model: model.id,
          field: "quality",
        });
      }
    }

    if (!caps.qualities.includes(request.quality)) {
      throw new CapabilityError(`Quality ${request.quality} is not supported for ${model.id}`, {
        model: model.id,
        field: "quality",
      });
    }

    if (request.count < 1 || request.count > 10) {
      throw new UsageError("count must be between 1 and 10");
    }

    if (request.stream && request.count > 1) {
      throw new CapabilityError("stream cannot be used with count > 1", { model: model.id, field: "stream" });
    }

    if (request.partialImages < 0 || request.partialImages > caps.partialImages.max) {
      throw new UsageError(`partialImages must be between 0 and ${caps.partialImages.max}`);
    }

    if (request.stream && !caps.stream) {
      throw new CapabilityError("Streaming is not supported for this model", { model: model.id, field: "stream" });
    }

    const size = request.size;
    if (size !== "auto") {
      const inFixed = caps.fixedSizes.includes(size);
      if (!inFixed) {
        if (isFlexible(model.id)) {
          const { width, height } = parseSize(size);
          validateFlexible(width, height);
        } else {
          throw new CapabilityError(`Size ${size} is not supported for ${model.id}`, {
            model: model.id,
            field: "size",
          });
        }
      }
    }

    if (request.background === "transparent") {
      if (caps.transparentBackground === "unsupported") {
        throw new CapabilityError("Transparent background is not supported", {
          model: model.id,
          field: "background",
        });
      }
      if (request.format === "jpeg") {
        throw new UsageError("JPEG format cannot be used with transparent background");
      }
    }

    if ("inputFidelity" in request && request.inputFidelity) {
      if (caps.inputFidelity === "omit") {
        throw new CapabilityError("input_fidelity is not supported for this model", {
          model: model.id,
          field: "inputFidelity",
        });
      }
      if (caps.inputFidelity === "low-only" && request.inputFidelity === "high") {
        throw new CapabilityError("input_fidelity high is not supported for this model", {
          model: model.id,
          field: "inputFidelity",
        });
      }
    }

    if ("maskPath" in request && request.maskPath && !caps.mask) {
      throw new CapabilityError("Mask/inpainting is not supported for this model", {
        model: model.id,
        field: "mask",
      });
    }

    if (request.apiMode === "responses" && request.count > 1) {
      // allowed — multiple calls
    }
  }

  isExperimentalSize(modelId: string, size: string): boolean {
    if (size === "auto") {
      return false;
    }
    const { width, height } = parseSize(size);
    return isFlexible(modelId) && isExperimental(width, height);
  }
}
