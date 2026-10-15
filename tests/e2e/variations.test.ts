import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

const cli = path.resolve("dist/cli.js");
const env = {
  ...process.env,
  HTTP_PROXY: "http://127.0.0.1:9",
  HTTPS_PROXY: "http://127.0.0.1:9",
  OPENAI_API_KEY: "sk-test",
};

describe("variations e2e", () => {
  it("requires prompt", () => {
    expect(spawnSync("node", [cli, "variations"], { encoding: "utf8", env }).status).toBe(2);
  });

  it("dry-run with prompt exits 0", () => {
    const result = spawnSync("node", [cli, "variations", "--prompt", "warmer", "--dry-run", "--json"], {
      encoding: "utf8",
      env,
    });
    expect(result.status).toBe(0);
  });
});
