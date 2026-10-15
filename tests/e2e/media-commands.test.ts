import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const cli = path.resolve("dist/cli.js");
const env = { ...process.env, OPENAI_API_KEY: "" };

function run(args: string[], spawnCwd = process.cwd()) {
  return spawnSync("node", [cli, ...args], { encoding: "utf8", env, cwd: spawnCwd });
}

describe("media commands e2e", () => {
  it("crop rotate compress watermark contact-sheet", async () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "output", "media-e2e-"));
    const input = path.join(dir, "in.png");
    await sharp({ create: { width: 40, height: 20, channels: 3, background: "#336699" } })
      .png()
      .toFile(input);
    const inputHash = crypto.createHash("sha256").update(fs.readFileSync(input)).digest("hex");

    const cropOut = path.join(dir, "crop.png");
    expect(run(["media", "crop", input, cropOut, "--left", "0", "--top", "0", "--width", "20", "--height", "20"]).status).toBe(0);
    const cropMeta = await sharp(cropOut).metadata();
    expect(cropMeta.width).toBe(20);
    expect(cropMeta.height).toBe(20);

    const rotOut = path.join(dir, "rot.png");
    expect(run(["media", "rotate", cropOut, rotOut, "--degrees", "90"]).status).toBe(0);
    const rotMeta = await sharp(rotOut).metadata();
    expect(rotMeta.width).toBe(20);
    expect(rotMeta.height).toBe(20);

    const jpg = path.join(dir, "out.jpg");
    expect(run(["media", "compress", input, jpg, "--quality", "80"]).status).toBe(0);
    const buf = fs.readFileSync(jpg);
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);

    const wm = path.join(dir, "wm.png");
    expect(run(["media", "watermark", input, wm, "--text", "tag"]).status).toBe(0);
    expect(fs.statSync(wm).size).toBeGreaterThan(0);
    expect(crypto.createHash("sha256").update(fs.readFileSync(input)).digest("hex")).toBe(inputHash);

    const b = path.join(dir, "b.png");
    await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } }).png().toFile(b);
    const sheet = path.join(dir, "sheet.png");
    expect(run(["media", "contact-sheet", "--image", input, "--image", b, "--output", sheet]).status).toBe(0);
    expect(fs.existsSync(sheet)).toBe(true);
  });

  it("rejects path outside output root", async () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "output", "media-sec-"));
    const input = path.join(dir, "in.png");
    await sharp({ create: { width: 4, height: 4, channels: 3, background: "#000" } }).png().toFile(input);
    const result = run([
      "media",
      "crop",
      input,
      "../forbidden/out.png",
      "--left",
      "0",
      "--top",
      "0",
      "--width",
      "2",
      "--height",
      "2",
    ]);
    expect(result.status).toBe(10);
  });
});
