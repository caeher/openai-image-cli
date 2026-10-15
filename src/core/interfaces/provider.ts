import type {
  ApiMode,
  Background,
  InputFidelity,
  OutputFormat,
  Quality,
} from "../entities/primitives.js";
import type { ImageReference } from "../entities/request.js";
import type { TokenUsage } from "../entities/result.js";

export interface ProviderImageBytes {
  b64: string;
  revisedPrompt?: string | null;
  partialIndex?: number;
  kind: "final" | "partial";
}

export interface ProviderImageResult {
  images: ProviderImageBytes[];
  revisedPrompt: string | null;
  responseId?: string;
  imageCallId?: string;
  usage?: TokenUsage;
}

export interface ProviderGenerateCall {
  prompt: string;
  model: string;
  size: string;
  quality: Quality;
  format: OutputFormat;
  compression?: number;
  background: Background;
  count: number;
  moderation?: "auto" | "low";
  stream: boolean;
  partialImages: number;
  responsesModel?: string;
}

export interface ProviderEditCall extends ProviderGenerateCall {
  imagePaths: string[];
  maskPath?: string;
  inputFidelity?: InputFidelity;
  action?: "auto" | "generate" | "edit";
  previousResponseId?: string;
  responsesModel?: string;
  references?: ImageReference[];
}

export interface ImageProvider {
  readonly mode: ApiMode;
  generate(request: ProviderGenerateCall, signal: AbortSignal): Promise<ProviderImageResult>;
  edit(request: ProviderEditCall, signal: AbortSignal): Promise<ProviderImageResult>;
}
