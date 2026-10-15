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

describe("edit flags e2e", () => {
  it("dry-run includes preserve text in prompt, not provider preserve key", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "edit-flags-"));
    const img = path.join(dir, "a.png");
    await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } })
      .png()
      .toFile(img);
    const result = run([
      "edit",
      "--image",
      img,
      "--preserve",
      "sky",
      "--preserve",
      "trees",
      "--prompt",
      "add snow",
      "--dry-run",
      "--json",
    ]);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { prompt?: string; providerPayload?: Record<string, unknown> };
    expect(payload.prompt).toContain("Conservar");
    expect(payload.prompt).toContain("sky");
    expect(payload.providerPayload?.preserve).toBeUndefined();
  });
});
