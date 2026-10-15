import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { MaskManagerService } from "../../src/services/masking/manager.js";
import { ModelRegistry } from "../../src/services/models/registry.js";

describe("mask manager", () => {
  const masks = new MaskManagerService();
  const model = new ModelRegistry().resolve("gpt-image-2");

  it("rejects jpeg mask", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mask-"));
    const base = path.join(dir, "base.png");
    const mask = path.join(dir, "mask.jpg");
    await sharp({ create: { width: 2, height: 2, channels: 3, background: "#000" } }).png().toFile(base);
    await sharp({ create: { width: 2, height: 2, channels: 3, background: "#fff" } }).jpeg().toFile(mask);
    await expect(masks.assertApplicable(mask, base, model)).rejects.toThrow();
  });

  it("dilate and erode 2x2 mask", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mask-"));
    const base = path.join(dir, "base.png");
    const mask = path.join(dir, "mask.png");
    const outD = path.join(dir, "d.png");
    const outE = path.join(dir, "e.png");
    await sharp({ create: { width: 2, height: 2, channels: 3, background: "#000" } }).png().toFile(base);
    const rgba = Buffer.from([
      255, 255, 255, 255, 255, 255, 255, 255,
      255, 255, 255, 255, 255, 255, 255, 0,
    ]);
    await sharp(rgba, { raw: { width: 2, height: 2, channels: 4 } }).png().toFile(mask);
    await masks.dilate(mask, outD, 1);
    await masks.erode(mask, outE, 1);
    expect(fs.existsSync(outD)).toBe(true);
    expect(fs.existsSync(outE)).toBe(true);
  });
});
