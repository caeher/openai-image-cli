import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { ModelRegistry } from "../../src/services/models/registry.js";

describe("bash completions", () => {
  it("includes model ids and mask/media subcommands", () => {
    const bash = fs.readFileSync("completions/oaiimage.bash", "utf8");
    const ids = new ModelRegistry().list().map((m) => m.id);
    for (const id of ids) {
      expect(bash).toContain(id);
    }
    expect(bash).toContain("mask");
    expect(bash).toContain("crop");
    expect(bash).toMatch(/prompt_sub=.*inspect/);
  });
});
