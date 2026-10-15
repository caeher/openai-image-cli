import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { buildGenerateBody } from "../../src/providers/openai/images-adapter.js";
import { buildResponsesBody } from "../../src/providers/openai/responses-adapter.js";
import { mapOpenAiError } from "../../src/providers/openai/map-error.js";
import { ModerationError, ApiError } from "../../src/core/errors/errors.js";
import { OpenAiImagesAdapter } from "../../src/providers/openai/images-adapter.js";
import { RecordingFakeProvider } from "../helpers/fake-provider.js";

describe("adapters", () => {
  it("sunburst body includes max quality", () => {
    const body = buildGenerateBody({
      prompt: "hi",
      model: "gpt-image-2.5-sunburst",
      size: "1024x1024",
      quality: "max",
      format: "png",
      background: "auto",
      count: 1,
      stream: false,
      partialImages: 0,
    });
    expect(body.quality).toBe("max");
    expect(body).not.toHaveProperty("style");
    expect(body).not.toHaveProperty("response_format");
  });

  it("gpt-image-2 omits input_fidelity in body", () => {
    const body = buildGenerateBody({
      prompt: "hi",
      model: "gpt-image-2",
      size: "1024x1024",
      quality: "low",
      format: "png",
      background: "auto",
      count: 1,
      stream: false,
      partialImages: 0,
    });
    expect(body).not.toHaveProperty("input_fidelity");
  });

  it("responses body has no n and separates models", () => {
    const body = buildResponsesBody({
      prompt: "hi",
      model: "gpt-image-2.5-flare",
      responsesModel: "gpt-5.5",
      size: "auto",
      quality: "low",
      format: "png",
      background: "auto",
      count: 1,
      stream: false,
      partialImages: 0,
    });
    expect(body).not.toHaveProperty("n");
    expect(body.model).toBe("gpt-5.5");
    expect((body.tools as Array<{ model: string }>)[0]?.model).toBe("gpt-image-2.5-flare");
  });

  it("maps moderation and 429 errors", () => {
    const mod = mapOpenAiError({ code: "moderation_blocked", message: "blocked" });
    expect(mod).toBeInstanceOf(ModerationError);
    const rate = mapOpenAiError({ status: 429, message: "rate" });
    expect(rate).toBeInstanceOf(ApiError);
    expect((rate as ApiError).retryable).toBe(true);
  });

  it("does not include createVariation in provider sources", () => {
    const files = ["images-adapter.ts", "responses-adapter.ts", "batch-adapter.ts", "client.ts"];
    for (const file of files) {
      const text = fs.readFileSync(new URL(`../../src/providers/openai/${file}`, import.meta.url), "utf8");
      expect(text).not.toContain("createVariation");
    }
  });

  it("records generate calls on fake", async () => {
    const fake = new RecordingFakeProvider();
    const adapter = new OpenAiImagesAdapter({
      images: {
        generate: async (body) => {
          await fake.generate(body as never, new AbortController().signal);
          return { data: [{ b64_json: Buffer.from("x").toString("base64") }] };
        },
        edit: async () => ({}),
      },
    });
    await adapter.generate(
      {
        prompt: "p",
        model: "gpt-image-2",
        size: "1024x1024",
        quality: "low",
        format: "png",
        background: "auto",
        count: 2,
        stream: false,
        partialImages: 0,
      },
      new AbortController().signal,
    );
    expect((fake.calls[0]?.body as { n?: number }).n).toBe(2);
  });
});
