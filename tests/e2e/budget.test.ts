import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

const cli = path.resolve("dist/cli.js");

describe("budget e2e", () => {
  it("unknown cost without confirm-cost exits 7 before network", () => {
    const result = spawnSync(
      "node",
      [cli, "generate", "--prompt", "test scene", "--model", "gpt-image-2.5-flare"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          OPENAI_API_KEY: "sk-test",
          HTTP_PROXY: "http://127.0.0.1:9",
          HTTPS_PROXY: "http://127.0.0.1:9",
        },
      },
    );
    expect(result.status).toBe(7);
  });
});
