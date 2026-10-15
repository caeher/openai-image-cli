import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const cli = path.resolve("dist/cli.js");
const env = { ...process.env, OPENAI_API_KEY: "" };

function run(args: string[]) {
  return spawnSync("node", [cli, ...args], { encoding: "utf8", env });
}

describe("typography e2e", () => {
  it("exact overlay writes output png", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "typo-"));
    const img = path.join(dir, "base.png");
    const out = path.join(dir, "out.png");
    await sharp({ create: { width: 32, height: 32, channels: 3, background: "#eee" } }).png().toFile(img);
    const result = run([
      "typography",
      "--exact",
      "--image",
      img,
      "--primary",
      "Hola",
      "--secondary",
      "Mundo",
      "--output",
      out,
    ]);
    expect(result.status).toBe(0);
    expect(fs.existsSync(out)).toBe(true);
  });
});
