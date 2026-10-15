import OpenAI from "openai";
import { AuthError } from "../../core/errors/errors.js";

export function createOpenAiClient(options: { apiKey?: string; timeoutMs: number }): OpenAI {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AuthError("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey, timeout: options.timeoutMs, maxRetries: 0 });
}
