import { describe, expect, it } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const cli = path.resolve("dist/cli.js");
const env = {
  ...process.env,
  HTTP_PROXY: "http://127.0.0.1:9",
  HTTPS_PROXY: "http://127.0.0.1:9",
  OPENAI_API_KEY: "sk-test",
};

function run(args: string[], extraEnv: Record<string, string> = {}) {
  return spawnSync("node", [cli, ...args], {
    encoding: "utf8",
    env: { ...env, ...extraEnv },
  });
}

describe("e2e cli", () => {
  it("generate --help exits 0", () => {
    expect(run(["generate", "--help"]).status).toBe(0);
  });

  it("dry-run json", () => {
    const result = run(["generate", "--prompt", "hi", "--dry-run", "--json"]);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { dryRun: boolean };
    expect(payload.dryRun).toBe(true);
  });

  it("generate without key exits 4", () => {
    const result = run(["generate", "--prompt", "hi"], { OPENAI_API_KEY: "" });
    expect(result.status).toBe(4);
  });

  it("capability error for xhigh on gpt-image-2", () => {
    const result = run([
      "generate",
      "--model",
      "gpt-image-2",
      "--quality",
      "xhigh",
      "--prompt",
      "hi",
      "--dry-run",
    ]);
    expect(result.status).toBe(11);
  });

  it("retired model exits 11", () => {
    const result = run(["generate", "--model", "dall-e-3", "--prompt", "hi", "--dry-run"]);
    expect(result.status).toBe(11);
  });

  it("media inspect works without key", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-media-"));
    const file = path.join(dir, "t.png");
    await sharp({ create: { width: 4, height: 4, channels: 3, background: "#000" } })
      .png()
      .toFile(file);
    const result = run(["media", "inspect", file], { OPENAI_API_KEY: "" });
    expect(result.status).toBe(0);
  });

  it("config set apiKey exits 3", () => {
    const result = run(["config", "set", "apiKey", "sk-test"]);
    expect(result.status).toBe(3);
  });

  it("json goes to stdout only", () => {
    const result = run(["doctor", "--json"]);
    expect(result.status).toBe(0);
    expect(result.stdout.trim().startsWith("{")).toBe(true);
    expect(result.stderr.trim()).toBe("");
  });

  it("duplicate output without force exits 2", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-out-"));
    const out = path.join(dir, "same.png");
    const first = run([
      "generate",
      "--prompt",
      "hi",
      "--dry-run",
      "--output",
      out,
      "--dir",
      dir,
    ]);
    expect(first.status).toBe(0);
    fs.writeFileSync(out, "x");
    const second = run([
      "generate",
      "--prompt",
      "hi",
      "--dry-run",
      "--output",
      out,
      "--dir",
      dir,
    ]);
    expect(second.status).toBe(2);
  });

  it("stdin prompt dry-run", async () => {
    const child = spawn("node", [cli, "generate", "--stdin", "--dry-run", "--json"], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    child.stdin?.write("from stdin\n");
    child.stdin?.end();
    const stdout = await new Promise<string>((resolve, reject) => {
      let data = "";
      child.stdout?.on("data", (c) => {
        data += String(c);
      });
      child.on("close", (code) => {
        if (code === 0) {
          resolve(data);
        } else {
          reject(new Error(`exit ${code}`));
        }
      });
    });
    const payload = JSON.parse(stdout) as { prompt: string };
    expect(payload.prompt).toContain("from stdin");
  });

  it("compression appears in jpeg dry-run payload", () => {
    const result = run([
      "generate",
      "--prompt",
      "hi",
      "--format",
      "jpeg",
      "--compression",
      "40",
      "--dry-run",
      "--json",
    ]);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { providerPayload: { output_compression?: number } };
    expect(payload.providerPayload.output_compression).toBe(40);
  });

  it("save-partials in dry-run json", () => {
    const result = run([
      "generate",
      "--prompt",
      "hi",
      "--save-partials",
      "--dry-run",
      "--json",
    ]);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { savePartials: boolean };
    expect(payload.savePartials).toBe(true);
  });

  it("config set --file rejects apiKey", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-file-"));
    const file = path.join(dir, "bad.json");
    fs.writeFileSync(file, JSON.stringify({ apiKey: "sk-test" }));
    const result = run(["config", "set", "--file", file]);
    expect(result.status).toBe(3);
    expect(result.stderr).not.toContain("sk-test");
  });
});
