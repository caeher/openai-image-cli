import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { SharpMediaProcessor } from "../../src/media/processor.js";
import { sniff } from "../../src/media/sniff.js";
import { PathSecurityError } from "../../src/core/errors/errors.js";

describe("media processor", () => {
  it("resize preserves original hash", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oai-media-"));
    const input = path.join(dir, "in.png");
    const output = path.join(dir, "out.png");
    await sharp({ create: { width: 32, height: 32, channels: 3, background: "#ff0000" } }).png().toFile(input);
    const before = crypto.createHash("sha256").update(fs.readFileSync(input)).digest("hex");
    const media = new SharpMediaProcessor(dir);
    await media.resize(input, output, { width: 16, height: 16 });
    const after = crypto.createHash("sha256").update(fs.readFileSync(input)).digest("hex");
    expect(after).toBe(before);
  });

  it("convert and sniff", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oai-media-"));
    const input = path.join(dir, "in.png");
    const output = path.join(dir, "out.webp");
    await sharp({ create: { width: 8, height: 8, channels: 3, background: "#00ff00" } }).png().toFile(input);
    const media = new SharpMediaProcessor(dir);
    await media.convert(input, output, "webp");
    expect(sniff(fs.readFileSync(output).slice(0, 12))).toBe("webp");
  });

  it("overlay svg text contains escaped tree", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oai-media-"));
    const input = path.join(dir, "in.png");
    const output = path.join(dir, "out.png");
    await sharp({ create: { width: 64, height: 64, channels: 3, background: "#fff" } }).png().toFile(input);
    const media = new SharpMediaProcessor(dir);
    await media.overlaySvgText(input, output, { primaryText: "Árbol" });
    expect(fs.existsSync(output)).toBe(true);
  });

  it("rejects paths outside root", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "oai-media-"));
    const media = new SharpMediaProcessor(root);
    await expect(media.inspect("/etc/passwd", root)).rejects.toBeInstanceOf(PathSecurityError);
  });
});
