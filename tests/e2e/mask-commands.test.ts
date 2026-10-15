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

describe("mask commands e2e", () => {
  it("dilate makes 2x2 single transparent pixel fully editable", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mask-e2e-"));
    const base = path.join(dir, "base.png");
    const mask = path.join(dir, "mask.png");
    const out = path.join(dir, "out.png");
    await sharp({
      create: { width: 2, height: 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toFile(base);
    const rgba = Buffer.from([
      255, 255, 255, 255, 255, 255, 255, 255,
      255, 255, 255, 255, 255, 255, 255, 0,
    ]);
    await sharp(rgba, { raw: { width: 2, height: 2, channels: 4 } }).png().toFile(mask);
    expect(run(["mask", "dilate", mask, "--radius", "1", "--output", out]).status).toBe(0);
    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let editable = 0;
    for (let i = 0; i < (info.width ?? 0) * (info.height ?? 0); i++) {
      if ((data[i * 4 + 3] ?? 255) === 0) {
        editable += 1;
      }
    }
    expect(editable).toBe(4);
  });

  it("preview writes separate file", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mask-prev-"));
    const base = path.join(dir, "base.png");
    const mask = path.join(dir, "mask.png");
    const preview = path.join(dir, "preview.png");
    await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).png().toFile(base);
    await sharp({ create: { width: 4, height: 4, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .png()
      .toFile(mask);
    const before = fs.readFileSync(mask);
    expect(run(["mask", "preview", mask, "--image", base, "--output", preview]).status).toBe(0);
    expect(fs.readFileSync(mask).equals(before)).toBe(true);
    expect(fs.existsSync(preview)).toBe(true);
  });
});
