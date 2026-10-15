import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

const cli = path.resolve("dist/cli.js");

describe.skipIf(process.env.OAIIMAGE_LIVE !== "1")("live api", () => {
  it("generates a small png", () => {
    const result = spawnSync(
      "node",
      [
        cli,
        "generate",
        "--model",
        "gpt-image-2.5-flare",
        "--quality",
        "low",
        "--size",
        "1024x1024",
        "--prompt",
        "tiny red dot",
        "--dir",
        "./output",
      ],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(0);
  });
});
