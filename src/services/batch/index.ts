import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { CapabilityError, UsageError } from "../../core/errors/errors.js";
import type { BatchProcessor } from "../../core/interfaces/services.js";
import type { ModelRegistry } from "../models/registry.js";
import { BatchManifestStore, type BatchManifest } from "./manifest.js";
import { LocalBatchQueue } from "./local-queue.js";
import { OpenAiBatchService } from "./openai-batch.js";
export class BatchProcessorService implements BatchProcessor {
  constructor(
    private readonly store: BatchManifestStore,
    private readonly local: LocalBatchQueue,
    private readonly openai: OpenAiBatchService | null,
    private readonly models: ModelRegistry,
  ) {}

  async createFromFile(
    filePath: string,
    options: { mode: "local" | "openai"; model: string },
  ): Promise<string> {
    const ext = path.extname(filePath);
    const raw = fs.readFileSync(filePath, "utf8");
    let rows: Array<Record<string, string>> = [];
    if (ext === ".jsonl") {
      rows = raw.split("\n").filter(Boolean).map((l) => JSON.parse(l) as Record<string, string>);
    } else if (ext === ".csv") {
      const lines = raw.split("\n").filter(Boolean);
      const headerLine = lines[0];
      if (!headerLine) {
        throw new UsageError("CSV file is empty");
      }
      const header = headerLine.split(",");
      for (const col of header) {
        if (!["id", "prompt", "size", "quality", "format"].includes(col)) {
          throw new UsageError(`Unknown CSV column: ${col}`);
        }
      }
      for (const line of lines.slice(1)) {
        const parts = line.split(",");
        const row: Record<string, string> = {};
        header.forEach((h, i) => {
          row[h] = parts[i] ?? "";
        });
        rows.push(row);
      }
    } else if (ext === ".yaml" || ext === ".yml") {
      const parsed = YAML.parse(raw);
      rows = Array.isArray(parsed) ? parsed : parsed.items;
    } else {
      const parsed = JSON.parse(raw);
      rows = Array.isArray(parsed) ? parsed : parsed.items;
    }

    const model = options.model;
    const modelConfig = this.models.resolve(model);
    if (options.mode === "openai" && !modelConfig.capabilities.batchImages) {
      throw new CapabilityError("OpenAI batch is not supported for this model");
    }

    const items = rows.map((row, index) => ({
      id: row.id ?? `row-${index + 1}`,
      state: "pending" as const,
      request: {
        prompt: row.prompt ?? "",
        model,
        size: row.size ?? "auto",
        quality: row.quality ?? "auto",
        format: row.format ?? "png",
        apiMode: "images" as const,
        background: "auto" as const,
        count: 1,
        stream: false,
        partialImages: 0,
        savePartials: false,
        directory: "./output",
        dryRun: false,
      },
      outputPaths: [],
    }));

    const manifest = this.store.createLocal(model, items);
    if (options.mode === "openai" && this.openai) {
      const jsonl = this.openai.buildJsonl(items.map((i) => i.request as never));
      await this.openai.submit(manifest.id, jsonl);
    }
    return manifest.id;
  }

  async run(batchId: string, signal: AbortSignal, options?: { retry?: boolean }): Promise<void> {
    const manifest = this.store.read(batchId);
    if (manifest.mode === "openai") {
      return;
    }
    await this.local.run(batchId, signal, options?.retry ?? false);
  }

  async status(batchId: string): Promise<BatchManifest> {
    return this.store.read(batchId);
  }

  async retry(batchId: string, signal: AbortSignal): Promise<void> {
    await this.run(batchId, signal, { retry: true });
  }

  async export(batchId: string, outputDir: string): Promise<void> {
    const manifest = this.store.read(batchId);
    fs.mkdirSync(outputDir, { recursive: true });
    for (const item of manifest.items) {
      for (const p of item.outputPaths) {
        const dest = path.join(outputDir, path.basename(p));
        fs.copyFileSync(p, dest);
      }
    }
  }
}
