import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const cli = path.resolve("dist/cli.js");
const env = {
  ...process.env,
  HTTP_PROXY: "http://127.0.0.1:9",
  HTTPS_PROXY: "http://127.0.0.1:9",
  OPENAI_API_KEY: "sk-test",
};

function run(args: string[]) {
  return spawnSync("node", [cli, ...args], { encoding: "utf8", env });
}

describe("pipeline flags e2e", () => {
  it("expand respects dry-run", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pipe-"));
    const img = path.join(dir, "a.png");
    await sharp({ create: { width: 816, height: 816, channels: 3, background: "#000" } })
      .png()
      .toFile(img);
    const result = run([
      "expand",
      "--image",
      img,
      "--prompt",
      "wider",
      "--pixels",
      "16",
      "--dry-run",
      "--json",
    ]);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).dryRun).toBe(true);
  });

  it("style photorealistic dry-run contains phrase", () => {
    const result = run([
      "style",
      "--style",
      "photorealistic",
      "--prompt",
      "city",
      "--dry-run",
      "--json",
    ]);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { prompt?: string };
    expect(payload.prompt).toContain("Fotografía realista");
  });

  it("style unknown exits 2", () => {
    const result = run(["style", "--style", "no-such", "--prompt", "x", "--dry-run"]);
    expect(result.status).toBe(2);
  });

  it("transparent jpeg exits 11", () => {
    const result = run(["transparent", "--format", "jpeg", "--dry-run"]);
    expect(result.status).toBe(11);
  });

  it("background remove local exits 11", () => {
    const result = run(["background", "remove", "--method", "local"]);
    expect(result.status).toBe(11);
  });
});
