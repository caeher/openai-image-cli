import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ReferenceManagerService } from "../../src/services/references/manager.js";
import { ModelRegistry } from "../../src/services/models/registry.js";

describe("references", () => {
  const refs = new ReferenceManagerService();
  const model = new ModelRegistry().resolve("gpt-image-2");

  it("rejects too many references", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ref-many-"));
    const paths = Array.from({ length: 17 }, (_, i) => {
      const p = path.join(dir, `f${i}.png`);
      fs.writeFileSync(p, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      return p;
    });
    await expect(refs.validate(paths, [], model)).rejects.toThrow();
  });

  it("rejects fake png magic bytes", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ref-"));
    const fake = path.join(dir, "bad.png");
    fs.writeFileSync(fake, "x");
    await expect(refs.validate([fake], ["subject"], model)).rejects.toThrow();
  });
});
