import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type BatchItemState = "pending" | "running" | "succeeded" | "failed" | "cancelled";

export interface BatchManifestItem {
  id: string;
  state: BatchItemState;
  request: Record<string, unknown>;
  outputPaths: string[];
  attempts?: number;
  error?: string;
}

export interface BatchManifest {
  id: string;
  mode: "local" | "openai";
  model: string;
  openAiBatchId?: string;
  items: BatchManifestItem[];
}

export class BatchManifestStore {
  constructor(private readonly baseDir: string) {}

  private pathFor(id: string): string {
    return path.join(this.baseDir, `${id}.json`);
  }

  read(id: string): BatchManifest {
    const file = this.pathFor(id);
    return JSON.parse(fs.readFileSync(file, "utf8")) as BatchManifest;
  }

  write(manifest: BatchManifest): void {
    fs.mkdirSync(this.baseDir, { recursive: true });
    fs.writeFileSync(this.pathFor(manifest.id), JSON.stringify(manifest, null, 2));
  }

  createLocal(model: string, items: BatchManifestItem[]): BatchManifest {
    const manifest: BatchManifest = {
      id: `batch_${crypto.randomBytes(4).toString("hex")}`,
      mode: "local",
      model,
      items,
    };
    this.write(manifest);
    return manifest;
  }

  resetRunningToPending(manifest: BatchManifest): BatchManifest {
    for (const item of manifest.items) {
      if (item.state === "running") {
        item.state = "pending";
        item.attempts = (item.attempts ?? 0) + 1;
      }
    }
    return manifest;
  }
}
