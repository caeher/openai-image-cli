import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ProjectManagerService } from "../../src/services/projects/manager.js";

describe("project manager", () => {
  it("init creates manifest and lists project", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "proj-"));
    const child = path.join(root, "child");
    fs.mkdirSync(child);
    const pm = new ProjectManagerService();
    await pm.init(child, "demo");
    const listed = await pm.list(root);
    expect(listed.some((p) => p.name === "demo")).toBe(true);
    const inspected = await pm.inspect(child);
    expect(inspected.root).toBe(child);
  });
});
