import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

describe("built bin", () => {
  it("has shebang and package bin points to dist/cli.js", () => {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")) as { bin: { oaiimage: string } };
    expect(pkg.bin.oaiimage).toBe("./dist/cli.js");
    const head = fs.readFileSync("dist/cli.js", "utf8").slice(0, 30);
    expect(head).toContain("#!/usr/bin/env node");
  });

  it("runs --help", () => {
    const result = spawnSync("node", [path.resolve("dist/cli.js"), "--help"], { encoding: "utf8" });
    expect(result.status).toBe(0);
  });

  it("ships index declarations", () => {
    const dts = fs.readFileSync("dist/index.d.ts", "utf8");
    expect(dts).toContain("createImageCli");
  });
});
