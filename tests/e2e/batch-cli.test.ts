import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cli = path.resolve("dist/cli.js");
const env = { ...process.env, OPENAI_API_KEY: "" };

describe("batch cli e2e", () => {
  it("create local batch manifest", () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "output", "batch-e2e-"));
    const jsonl = path.join(dir, "jobs.jsonl");
    fs.writeFileSync(
      jsonl,
      `${JSON.stringify({ id: "row-1", prompt: "a red fox", size: "1024x1024", quality: "auto", format: "png" })}\n`,
    );
    const result = spawnSync("node", [cli, "batch", "create", jsonl, "--mode", "local"], {
      encoding: "utf8",
      env,
    });
    expect(result.status).toBe(0);
    const id = result.stdout.trim();
    const manifestPath = path.join(process.cwd(), ".oaiimage", "batches", `${id}.json`);
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { mode: string };
    expect(manifest.mode).toBe("local");
  });

  it("openai mode without key exits 4", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "batch-auth-"));
    const jsonl = path.join(dir, "jobs.jsonl");
    fs.writeFileSync(jsonl, `${JSON.stringify({ prompt: "hi" })}\n`);
    const result = spawnSync("node", [cli, "batch", "create", jsonl, "--mode", "openai"], {
      encoding: "utf8",
      env: { ...env, OPENAI_API_KEY: "" },
    });
    expect(result.status).toBe(4);
  });
});
