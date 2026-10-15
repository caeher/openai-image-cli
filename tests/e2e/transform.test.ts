import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const cli = path.resolve("dist/cli.js");
const env = {
  ...process.env,
  HTTP_PROXY: "http://127.0.0.1:9",
  HTTPS_PROXY: "http://127.0.0.1:9",
  OPENAI_API_KEY: "sk-test",
};

describe("transform e2e", () => {
  it("restore without prompt exits 11", async () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "output", "transform-"));
    const img = path.join(dir, "in.png");
    await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).png().toFile(img);
    expect(spawnSync("node", [cli, "restore", "--image", img], { encoding: "utf8", env }).status).toBe(11);
  });

  it("restore dry-run keeps input sha256", async () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "output", "transform-"));
    const img = path.join(dir, "in.png");
    await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).png().toFile(img);
    const before = crypto.createHash("sha256").update(fs.readFileSync(img)).digest("hex");
    const result = spawnSync(
      "node",
      [cli, "restore", "--image", img, "--prompt", "sharpen", "--dry-run", "--json"],
      { encoding: "utf8", env },
    );
    expect(result.status).toBe(0);
    const after = crypto.createHash("sha256").update(fs.readFileSync(img)).digest("hex");
    expect(after).toBe(before);
  });
});
