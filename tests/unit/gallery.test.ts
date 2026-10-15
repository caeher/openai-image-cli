import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ProjectManagerService } from "../../src/services/projects/manager.js";
import { GalleryManagerService } from "../../src/services/gallery/manager.js";
import { SharpMediaProcessor } from "../../src/media/processor.js";

describe("gallery", () => {
  it("html export has no remote scripts or OPENAI", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "gal-"));
    const projects = new ProjectManagerService();
    await projects.init(root);
    const manifestPath = path.join(root, ".oaiimage", "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { images: unknown[] };
    manifest.images = [{ path: "./img.png", sha256: "x", format: "png", width: 1, height: 1, bytes: 1, hasAlpha: false, source: "local" }];
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    const gallery = new GalleryManagerService(new SharpMediaProcessor(root));
    const outDir = path.join(root, "out");
    await gallery.export(root, outDir, { html: true });
    const html = fs.readFileSync(path.join(outDir, "gallery.html"), "utf8");
    expect(html).not.toContain("OPENAI");
    expect(html).not.toMatch(/http:\/\//);
  });
});
