import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { loadEffectiveConfig } from "../../src/config/load.js";

describe("config", () => {
  it("applies precedence flag > env > project > global > default", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "oai-config-"));
    const home = path.join(root, "home");
    const project = path.join(root, "project");
    fs.mkdirSync(path.join(home, ".config", "oaiimage"), { recursive: true });
    fs.mkdirSync(path.join(project, ".oaiimage"), { recursive: true });
    fs.writeFileSync(
      path.join(home, ".config", "oaiimage", "config.yaml"),
      YAML.stringify({ model: "global-model" }),
    );
    fs.writeFileSync(
      path.join(project, ".oaiimage", "config.yaml"),
      YAML.stringify({ model: "project-model" }),
    );

    const base = {
      cwd: project,
      env: { OAIIMAGE_MODEL: "env-model" } as NodeJS.ProcessEnv,
      platform: { cwd: project, homeDir: home, xdgConfigHome: path.join(home, ".config") },
    };

    expect(loadEffectiveConfig(base).model).toBe("env-model");
    expect(loadEffectiveConfig({ ...base, flags: { model: "flag-model" } }).model).toBe("flag-model");
    expect(loadEffectiveConfig({ ...base, env: {} }).model).toBe("project-model");
  });

  it("rejects secret keys in yaml", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "oai-config-"));
    fs.mkdirSync(path.join(root, "oaiimage"), { recursive: true });
    const file = path.join(root, "oaiimage", "config.yaml");
    fs.writeFileSync(file, YAML.stringify({ apiKey: "sk-test" }));
    expect(() =>
      loadEffectiveConfig({
        cwd: root,
        env: {},
        platform: { cwd: root, homeDir: root, xdgConfigHome: root },
      }),
    ).toThrow();
  });
});
