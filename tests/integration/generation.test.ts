import { describe, expect, it } from "vitest";
import { createImageCli } from "../../src/index.js";
import { RecordingFakeProvider } from "../helpers/fake-provider.js";

describe("generation service", () => {
  const images = new RecordingFakeProvider("images");
  const responses = new RecordingFakeProvider("responses");
  const cli = createImageCli({ imagesProvider: images, responsesProvider: responses });

  const base = {
    prompt: "fox",
    model: "gpt-image-2",
    size: "1024x1024",
    quality: "low" as const,
    format: "png" as const,
    background: "auto" as const,
    stream: false,
    partialImages: 0,
    savePartials: false,
    directory: "./output",
    dryRun: false,
  };

  it("images mode sets n from count", async () => {
    images.calls = [];
    await cli.generation.generate({ ...base, apiMode: "images", count: 3 }, new AbortController().signal);
    expect(images.calls[0]?.body.count).toBe(3);
  });

  it("responses mode makes multiple calls without n", async () => {
    responses.calls = [];
    await cli.generation.generate({ ...base, apiMode: "responses", count: 2 }, new AbortController().signal);
    expect(responses.calls).toHaveLength(2);
    expect(responses.calls[0]?.body).not.toHaveProperty("n");
  });

  it("dry-run does not call provider", async () => {
    images.calls = [];
    const result = await cli.generation.generate(
      { ...base, apiMode: "images", dryRun: true, count: 1 },
      new AbortController().signal,
    );
    expect(result.dryRun).toBe(true);
    expect(images.calls).toHaveLength(0);
  });
});
