import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BatchManifestStore } from "../../src/services/batch/manifest.js";

describe("batch manifest", () => {
  it("retry skips succeeded and resets running", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "batch-"));
    const store = new BatchManifestStore(dir);
    const manifest = store.createLocal("gpt-image-2.5-flare", [
      { id: "a", state: "succeeded", request: {}, outputPaths: [] },
      { id: "b", state: "running", request: {}, outputPaths: [] },
    ]);
    const reset = store.resetRunningToPending(manifest);
    expect(reset.items.find((i) => i.id === "b")?.state).toBe("pending");
    expect(reset.items.find((i) => i.id === "a")?.state).toBe("succeeded");
  });
});
