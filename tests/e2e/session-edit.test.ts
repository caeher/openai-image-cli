import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const cli = path.resolve("dist/cli.js");
const env = {
  ...process.env,
  HTTP_PROXY: "http://127.0.0.1:9",
  HTTPS_PROXY: "http://127.0.0.1:9",
  OPENAI_API_KEY: "sk-test",
};

function run(args: string[], extraEnv: Record<string, string> = {}) {
  return spawnSync("node", [cli, ...args], { encoding: "utf8", env: { ...env, ...extraEnv } });
}

describe("session edit e2e", () => {
  it("dry-run edit with fallback iteration and responses id", () => {
    const storeDir = path.join(process.cwd(), ".oaiimage", "sessions");
    fs.mkdirSync(storeDir, { recursive: true });
    const sessionId = `e2e-${Date.now()}`;
    const img = path.join(process.cwd(), "output", `${sessionId}.png`);
    fs.mkdirSync(path.dirname(img), { recursive: true });
    fs.writeFileSync(img, "png");
    fs.writeFileSync(
      path.join(storeDir, `${sessionId}.json`),
      JSON.stringify({
        id: sessionId,
        apiMode: "responses",
        imageModel: "gpt-image-2.5-flare",
        responsesModel: "gpt-4.1-mini",
        createdAt: new Date().toISOString(),
        iterations: [
          {
            id: "i1",
            createdAt: new Date().toISOString(),
            prompt: "first",
            revisedPrompt: null,
            model: "gpt-image-2.5-flare",
            parameters: {},
            cost: { kind: "unknown", currency: "USD", lines: [] },
            outputPaths: [img],
            source: "fallback",
          },
        ],
      }),
    );

    const first = run(["session", "edit", sessionId, "--prompt", "más luz", "--dry-run", "--json"]);
    expect(first.status).toBe(0);
    const payload = JSON.parse(first.stdout) as { dryRun: boolean; prompt?: string };
    expect(payload.dryRun).toBe(true);
    expect(payload.prompt).toContain("más luz");

    fs.writeFileSync(
      path.join(storeDir, `${sessionId}.json`),
      JSON.stringify({
        id: sessionId,
        apiMode: "responses",
        imageModel: "gpt-image-2.5-flare",
        responsesModel: "gpt-4.1-mini",
        createdAt: new Date().toISOString(),
        iterations: [
          {
            id: "i1",
            createdAt: new Date().toISOString(),
            prompt: "first",
            revisedPrompt: null,
            model: "gpt-image-2.5-flare",
            parameters: {},
            cost: { kind: "unknown", currency: "USD", lines: [] },
            outputPaths: [img],
            responseId: "resp_123",
            source: "api",
          },
        ],
      }),
    );

    const second = run(["session", "edit", sessionId, "--prompt", "wider", "--dry-run", "--json"]);
    expect(second.status).toBe(0);
    const payload2 = JSON.parse(second.stdout) as { providerPayload?: Record<string, unknown> };
    expect(JSON.stringify(payload2.providerPayload ?? {})).toContain("resp_123");

    const noPrompt = run(["session", "edit", sessionId]);
    expect(noPrompt.status).not.toBe(0);
  });
});
