import fs from "node:fs";
import { UsageError } from "../../core/errors/errors.js";
import { buildGenerationBatchBody } from "../../providers/openai/batch-adapter.js";
import type { OpenAiBatchAdapter } from "../../providers/openai/batch-adapter.js";
import type { BatchManifestStore } from "./manifest.js";
import type { ImageGenerationRequest } from "../../core/entities/request.js";

const MAX_LINES = 50_000;
const MAX_BYTES = 200 * 1024 * 1024;

export class OpenAiBatchService {
  constructor(
    private readonly adapter: OpenAiBatchAdapter,
    private readonly store: BatchManifestStore,
  ) {}

  buildJsonl(requests: ImageGenerationRequest[]): string {
    if (requests.length > MAX_LINES) {
      throw new UsageError("Batch exceeds 50000 lines");
    }
    const model = requests[0]?.model;
    if (!model) {
      throw new UsageError("Batch requires at least one item");
    }
    for (const req of requests) {
      if (req.model !== model) {
        throw new UsageError("All batch items must share the same model");
      }
    }
    let jsonl = "";
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      if (!req) {
        continue;
      }
      const body = buildGenerationBatchBody({
        prompt: req.prompt,
        model: req.model,
        size: req.size,
        quality: req.quality,
        format: req.format,
        background: req.background,
        count: 1,
        stream: false,
        partialImages: 0,
      });
      jsonl += `${JSON.stringify({
        custom_id: `row-${i + 1}`,
        method: "POST",
        url: "/v1/images/generations",
        body,
      })}\n`;
    }
    if (Buffer.byteLength(jsonl) > MAX_BYTES) {
      throw new UsageError("Batch JSONL exceeds 200 MB");
    }
    return jsonl;
  }

  async submit(manifestId: string, jsonl: string): Promise<string> {
    const fileId = await this.adapter.uploadJsonl(jsonl);
    const batchId = await this.adapter.createBatch(fileId, "/v1/images/generations");
    const manifest = this.store.read(manifestId);
    manifest.openAiBatchId = batchId;
    this.store.write(manifest);
    return batchId;
  }

  async exportOutputs(
    _batchId: string,
    outputContent: string,
    errorContent: string,
    manifestId: string,
  ): Promise<void> {
    const manifest = this.store.read(manifestId);
    const lines = outputContent.split("\n").filter(Boolean);
    const errors = errorContent.split("\n").filter(Boolean);
    const byId = new Map<string, { outputPaths: string[] }>();
    for (const line of lines) {
      const row = JSON.parse(line) as { custom_id: string; response?: { body?: { data?: Array<{ b64_json?: string }> } } };
      byId.set(row.custom_id, { outputPaths: [] });
    }
    for (const line of errors) {
      const row = JSON.parse(line) as { custom_id: string };
      const item = manifest.items.find((i) => i.id === row.custom_id);
      if (item) {
        item.state = "failed";
      }
    }
    for (const item of manifest.items) {
      if (byId.has(item.id) && item.state !== "failed") {
        item.state = "succeeded";
      }
    }
    this.store.write(manifest);
    fs.mkdirSync("output", { recursive: true });
  }
}
