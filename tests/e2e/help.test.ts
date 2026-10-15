import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

const cli = path.resolve("dist/cli.js");

describe("e2e help", () => {
  it("prints help with exit 0", () => {
    const result = spawnSync("node", [cli, "--help"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("oaiimage");
  });
});
