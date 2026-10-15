import { describe, expect, it } from "vitest";
import { createImageCli } from "../../src/index.js";
import { RecordingFakeProvider } from "../helpers/fake-provider.js";

describe("streaming", () => {
  it("accepts partialImages 0", async () => {
    const images = new RecordingFakeProvider();
    const cli = createImageCli({ imagesProvider: images });
    const result = await cli.streaming.generateWithStreaming(
      {
        prompt: "x",
        model: "gpt-image-2",
        apiMode: "images",
        size: "1024x1024",
        quality: "low",
        format: "png",
        background: "auto",
        count: 1,
        stream: true,
        partialImages: 0,
        savePartials: false,
        directory: "./output",
        dryRun: true,
      },
      new AbortController().signal,
    );
    expect(result.partials).toHaveLength(0);
  });

  it("rejects partialImages 4", async () => {
    const cli = createImageCli();
    await expect(
      cli.generation.generate(
        {
          prompt: "x",
          model: "gpt-image-2",
          apiMode: "images",
          size: "1024x1024",
          quality: "low",
          format: "png",
          background: "auto",
          count: 1,
          stream: true,
          partialImages: 4,
          savePartials: true,
          directory: "./output",
          dryRun: true,
        },
        new AbortController().signal,
      ),
    ).rejects.toThrow();
  });
});
