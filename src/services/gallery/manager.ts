import fs from "node:fs";
import path from "node:path";
import type { ImageMetadata } from "../../core/entities/model.js";
import type { GalleryManager } from "../../core/interfaces/services.js";
import type { MediaProcessor } from "../../core/interfaces/services.js";
import { renderGalleryHtml } from "./html.js";

export class GalleryManagerService implements GalleryManager {
  constructor(private readonly media: MediaProcessor) {}

  private readManifest(projectRoot: string): { images: ImageMetadata[] } {
    const manifestPath = path.join(projectRoot, ".oaiimage", "manifest.json");
    const data = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { images: ImageMetadata[] };
    return data;
  }

  async list(projectRoot: string): Promise<ImageMetadata[]> {
    return this.readManifest(projectRoot).images;
  }

  async inspect(projectRoot: string): Promise<{ count: number; manifestPath: string }> {
    const manifestPath = path.join(projectRoot, ".oaiimage", "manifest.json");
    const images = this.readManifest(projectRoot).images;
    return { count: images.length, manifestPath };
  }

  async export(projectRoot: string, outputDir: string, options?: { html?: boolean }): Promise<string[]> {
    fs.mkdirSync(outputDir, { recursive: true });
    const images = await this.list(projectRoot);
    const outputs: string[] = [];
    if (options?.html) {
      const htmlPath = path.join(outputDir, "gallery.html");
      fs.writeFileSync(htmlPath, renderGalleryHtml(images));
      outputs.push(htmlPath);
      return outputs;
    }
    const sheet = path.join(outputDir, "contact-sheet.png");
    const paths = images.map((i) => i.path).filter((p) => fs.existsSync(p));
    if (paths.length) {
      await this.media.contactSheet(paths, sheet, projectRoot);
      outputs.push(sheet);
    }
    return outputs;
  }
}
