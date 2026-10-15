import type {
  ImageProvider,
  ProviderEditCall,
  ProviderGenerateCall,
  ProviderImageResult,
} from "../../core/interfaces/provider.js";
import { mapOpenAiError } from "./map-error.js";

export interface ResponsesApiClient {
  responses: {
    create: (body: Record<string, unknown>) => Promise<unknown>;
  };
}

function buildResponsesBody(request: ProviderEditCall | ProviderGenerateCall): Record<string, unknown> {
  const tool: Record<string, unknown> = {
    type: "image_generation",
    model: request.model,
    prompt: request.prompt,
    size: request.size,
    quality: request.quality,
    output_format: request.format,
    background: request.background,
  };
  if (request.compression !== undefined && (request.format === "jpeg" || request.format === "webp")) {
    tool.output_compression = request.compression;
  }
  if (request.moderation) {
    tool.moderation = request.moderation;
  }
  if (request.stream) {
    tool.partial_images = request.partialImages;
  }
  if ("action" in request && request.action) {
    tool.action = request.action;
  }
  const responsesModel =
    "responsesModel" in request && request.responsesModel ? request.responsesModel : "gpt-5.5";
  const body: Record<string, unknown> = {
    model: responsesModel,
    input: request.prompt,
    tool_choice: { type: "image_generation" },
    tools: [tool],
  };
  if (request.stream) {
    body.stream = true;
  }
  if ("previousResponseId" in request && request.previousResponseId) {
    body.previous_response_id = request.previousResponseId;
  }
  return body;
}

function parseResponsesResult(data: unknown): ProviderImageResult {
  const response = data as {
    id?: string;
    output?: Array<{
      type?: string;
      id?: string;
      revised_prompt?: string;
      result?: string;
    }>;
  };
  const call = response.output?.find((o) => o.type === "image_generation_call");
  const b64 = call?.result ?? "";
  return {
    images: b64 ? [{ b64, kind: "final" }] : [],
    revisedPrompt: call?.revised_prompt ?? null,
    ...(response.id ? { responseId: response.id } : {}),
    ...(call?.id ? { imageCallId: call.id } : {}),
  };
}

export class OpenAiResponsesAdapter implements ImageProvider {
  readonly mode = "responses" as const;

  constructor(private readonly client: ResponsesApiClient) {}

  async generate(request: ProviderGenerateCall, _signal: AbortSignal): Promise<ProviderImageResult> {
    try {
      const body = buildResponsesBody(request);
      const result = await this.client.responses.create(body);
      return parseResponsesResult(result);
    } catch (error) {
      throw mapOpenAiError(error);
    }
  }

  async edit(request: ProviderEditCall, _signal: AbortSignal): Promise<ProviderImageResult> {
    try {
      const body = buildResponsesBody({ ...request, action: request.action ?? "edit" });
      const result = await this.client.responses.create(body);
      return parseResponsesResult(result);
    } catch (error) {
      throw mapOpenAiError(error);
    }
  }
}

export { buildResponsesBody };
