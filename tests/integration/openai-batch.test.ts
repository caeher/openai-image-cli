import { describe, expect, it } from "vitest";
import { OpenAiBatchService } from "../../src/services/batch/openai-batch.js";
import { OpenAiBatchAdapter, type BatchApiClient } from "../../src/providers/openai/batch-adapter.js";
import { BatchManifestStore } from "../../src/services/batch/manifest.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("openai batch jsonl", () => {
  it("builds generations jsonl without stream", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "batch-"));
    const store = new BatchManifestStore(dir);
    const client: BatchApiClient = {
      files: { create: async () => ({ id: "f" }) },
      batches: {
        create: async () => ({ id: "b" }),
        retrieve: async () => ({}),
        cancel: async () => ({}),
      },
    };
    const service = new OpenAiBatchService(new OpenAiBatchAdapter(client), store);
    const jsonl = service.buildJsonl([
      {
        prompt: "hi",
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
        directory: "./output",
        dryRun: false,
      },
    ]);
    expect(jsonl).toContain("custom_id");
    expect(jsonl).toContain("/v1/images/generations");
    expect(jsonl).not.toContain("stream");
  });
});
