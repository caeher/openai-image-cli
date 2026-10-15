import type { TextOptimizer } from "../../core/interfaces/prompt.js";
import { mapOpenAiError } from "./map-error.js";
import type { ResponsesApiClient } from "./responses-adapter.js";

export class OpenAiTextOptimizer implements TextOptimizer {
  constructor(private readonly client: ResponsesApiClient) {}

  async optimize(prompt: string, model: string, _signal: AbortSignal): Promise<string> {
    try {
      const result = await this.client.responses.create({
        model,
        input: `Optimize this image generation prompt for clarity and detail. Return only the optimized prompt.\n\n${prompt}`,
      });
      const response = result as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
      if (response.output_text) {
        return response.output_text;
      }
      const text = response.output?.[0]?.content?.[0]?.text;
      return text ?? prompt;
    } catch (error) {
      throw mapOpenAiError(error);
    }
  }
}
