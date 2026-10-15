import type { BatchManifest, BatchManifestStore } from "./manifest.js";
import type { GenerationService } from "../generation/service.js";
import type { ImageGenerationRequest } from "../../core/entities/request.js";

export class LocalBatchQueue {
  constructor(
    private readonly store: BatchManifestStore,
    private readonly generation: GenerationService,
  ) {}

  async run(batchId: string, signal: AbortSignal, retry = false): Promise<BatchManifest> {
    let manifest = this.store.read(batchId);
    manifest = this.store.resetRunningToPending(manifest);
    for (const item of manifest.items) {
      if (item.state === "succeeded") {
        continue;
      }
      if (!retry && item.state === "failed") {
        continue;
      }
      if (retry && item.state !== "pending" && item.state !== "failed") {
        continue;
      }
      item.state = "running";
      this.store.write(manifest);
      try {
        const request = item.request as unknown as ImageGenerationRequest;
        const result = await this.generation.generate({ ...request, dryRun: false }, signal);
        item.outputPaths = result.images.map((i) => i.path);
        item.state = "succeeded";
      } catch (error) {
        item.state = "failed";
        item.error = error instanceof Error ? error.message : String(error);
      }
      this.store.write(manifest);
    }
    return manifest;
  }
}
