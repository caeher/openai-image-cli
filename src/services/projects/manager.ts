import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import YAML from "yaml";
import type { ImageProject } from "../../core/entities/project.js";
import type { ProjectManager } from "../../core/interfaces/services.js";
import { PRODUCT_DEFAULTS } from "../../config/defaults.js";

export class ProjectManagerService implements ProjectManager {
  async init(cwd: string, name?: string): Promise<ImageProject> {
    const root = path.resolve(cwd);
    const oaiDir = path.join(root, ".oaiimage");
    await fs.promises.mkdir(path.join(oaiDir, "sessions"), { recursive: true });
    const configPath = path.join(oaiDir, "config.yaml");
    if (!fs.existsSync(configPath)) {
      await fs.promises.writeFile(configPath, YAML.stringify({ model: PRODUCT_DEFAULTS.model }));
    }
    const project: ImageProject = {
      id: crypto.randomBytes(6).toString("hex"),
      name: name ?? path.basename(root),
      root,
      createdAt: new Date().toISOString(),
      defaults: {},
    };
    await fs.promises.writeFile(
      path.join(oaiDir, "manifest.json"),
      JSON.stringify({ project, images: [] }, null, 2),
    );
    return project;
  }

  async list(cwd: string): Promise<ImageProject[]> {
    const projects: ImageProject[] = [];
    const entries = await fs.promises.readdir(cwd, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const manifestPath = path.join(cwd, entry.name, ".oaiimage", "manifest.json");
      if (fs.existsSync(manifestPath)) {
        const data = JSON.parse(await fs.promises.readFile(manifestPath, "utf8")) as {
          project: ImageProject;
        };
        projects.push(data.project);
      }
    }
    return projects;
  }

  async inspect(projectRoot: string): Promise<ImageProject> {
    const manifestPath = path.join(projectRoot, ".oaiimage", "manifest.json");
    const data = JSON.parse(await fs.promises.readFile(manifestPath, "utf8")) as { project: ImageProject };
    return data.project;
  }
}
