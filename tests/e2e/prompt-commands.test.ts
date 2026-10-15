import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cli = path.resolve("dist/cli.js");

describe("prompt commands e2e", () => {
  it("create save inspect roundtrip", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "prompt-home-"));
    const env = {
      ...process.env,
      HOME: home,
      XDG_CONFIG_HOME: path.join(home, ".config"),
      OPENAI_API_KEY: "",
    };
    const create = spawnSync("node", [cli, "prompt", "create", "--var", "subject=taza"], {
      encoding: "utf8",
      env,
    });
    expect(create.status).toBe(0);
    expect(create.stdout).toContain("Sujeto: taza");

    const save = spawnSync("node", [cli, "prompt", "save", "scene", "--text", "hola\nmundo"], {
      encoding: "utf8",
      env,
    });
    expect(save.status).toBe(0);

    const inspect = spawnSync("node", [cli, "prompt", "inspect", "scene"], { encoding: "utf8", env });
    expect(inspect.status).toBe(0);
    expect(inspect.stdout.trim()).toBe("hola\nmundo");

    const missing = spawnSync("node", [cli, "prompt", "inspect", "missing"], { encoding: "utf8", env });
    expect(missing.status).toBe(2);
  });
});
