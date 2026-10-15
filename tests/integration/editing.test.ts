import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { createImageCli } from "../../src/index.js";
import { RecordingFakeProvider } from "../helpers/fake-provider.js";

describe("editing service", () => {
  const images = new RecordingFakeProvider("images");
  const cli = createImageCli({ imagesProvider: images, responsesProvider: images });

  it("preserve is not sent in provider body fields", async () => {
    images.calls = [];
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "edit-"));
    const img = path.join(dir, "in.png");
    await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).png().toFile(img);
    await cli.editing.edit(
      {
        prompt: "edit",
        model: "gpt-image-2",
        apiMode: "images",
        size: "1024x1024",
        quality: "low",
        format: "png",
        background: "auto",
        count: 1,
        stream: false,
        partialImages: 0,
        savePartials: false,
        directory: dir,
        dryRun: false,
        images: [{ path: img, role: "subject" }],
        preserve: ["logo"],
      },
      new AbortController().signal,
    );
    expect(JSON.stringify(images.calls[0]?.body)).not.toContain("preserve");
  });
});
