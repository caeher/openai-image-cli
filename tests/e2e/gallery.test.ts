import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const cli = path.resolve("dist/cli.js");
const env = { ...process.env, OPENAI_API_KEY: "" };

describe("gallery e2e", () => {
  it("export html without forbidden strings", () => {
    const manifestDir = path.join(process.cwd(), ".oaiimage");
    fs.mkdirSync(manifestDir, { recursive: true });
    fs.writeFileSync(
      path.join(manifestDir, "manifest.json"),
      JSON.stringify({ images: [{ path: "output/sample.png", sha256: "abc", format: "png", width: 1, height: 1, bytes: 1, hasAlpha: false, source: "local" }] }),
    );
    const outDir = path.join(process.cwd(), "output", "gallery-html-test");
    fs.mkdirSync(outDir, { recursive: true });
    const result = spawnSync("node", [cli, "gallery", "export", outDir, "--html"], {
      encoding: "utf8",
      env,
    });
    expect(result.status).toBe(0);
    const html = fs.readFileSync(path.join(outDir, "gallery.html"), "utf8");
    expect(html.includes("http://")).toBe(false);
    expect(html.includes("OPENAI")).toBe(false);
  });
});
