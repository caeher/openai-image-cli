import type {
  ImageProvider,
  ProviderEditCall,
  ProviderGenerateCall,
  ProviderImageResult,
} from "../../src/core/interfaces/provider.js";

/** Minimal valid 1×1 PNG for sharp metadata in integration tests. */
const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export class RecordingFakeProvider implements ImageProvider {
  readonly mode;
  calls: Array<{ type: "generate" | "edit"; body: ProviderGenerateCall | ProviderEditCall }> = [];

  constructor(mode: "images" | "responses" = "images") {
    this.mode = mode;
  }

  async generate(request: ProviderGenerateCall, _signal: AbortSignal): Promise<ProviderImageResult> {
    this.calls.push({ type: "generate", body: request });
    return {
      images: [{ b64: TINY_PNG_B64, kind: "final" }],
      revisedPrompt: null,
    };
  }

  async edit(request: ProviderEditCall, _signal: AbortSignal): Promise<ProviderImageResult> {
    this.calls.push({ type: "edit", body: request });
    return {
      images: [{ b64: TINY_PNG_B64, kind: "final" }],
      revisedPrompt: null,
    };
  }
}
