import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cli = path.resolve("dist/cli.js");
const env = {
  ...process.env,
  HTTP_PROXY: "http://127.0.0.1:9",
  HTTPS_PROXY: "http://127.0.0.1:9",
  OPENAI_API_KEY: "sk-test",
};

function run(args: string[]) {
  return spawnSync("node", [cli, ...args], { encoding: "utf8", env });
}

describe("prompt file e2e", () => {
  it("yaml subject becomes Sujeto line in dry-run", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "prompt-file-"));
    const yaml = path.join(dir, "p.yaml");
    fs.writeFileSync(yaml, "subject: taza\n");
    const result = run(["generate", "--prompt-file", yaml, "--dry-run", "--json"]);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { prompt: string };
    expect(payload.prompt).toContain("Sujeto: taza");
  });

  it("txt preserves multiline content", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "prompt-file-"));
    const txt = path.join(dir, "p.txt");
    fs.writeFileSync(txt, "line one\nline two\n");
    const result = run(["generate", "--prompt-file", txt, "--dry-run", "--json"]);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { prompt: string };
    expect(payload.prompt).toContain("line one");
    expect(payload.prompt).toContain("line two");
  });
});
