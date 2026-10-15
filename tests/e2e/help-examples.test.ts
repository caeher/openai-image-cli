import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

const cli = path.resolve("dist/cli.js");

const commands: string[][] = [
  ["generate"],
  ["edit"],
  ["inpaint"],
  ["expand"],
  ["compose"],
  ["style"],
  ["transparent"],
  ["background", "remove"],
  ["background", "replace"],
  ["session", "create"],
  ["session", "edit"],
  ["prompt", "build"],
  ["prompt", "create"],
  ["typography"],
  ["variations"],
  ["media", "inspect"],
  ["media", "crop"],
  ["mask", "inspect"],
  ["batch", "create"],
  ["config", "set"],
  ["doctor"],
  ["gallery", "list"],
  ["restore"],
  ["enhance"],
];

function exampleLines(help: string): string[] {
  return help
    .split("\n")
    .filter((line) => line.trim().startsWith("$ oaiimage") || line.trim().startsWith("oaiimage"));
}

describe("help examples", () => {
  for (const args of commands) {
    it(`${args.join(" ")} --help has two examples`, () => {
      const result = spawnSync("node", [cli, ...args, "--help"], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Examples:");
      expect(exampleLines(result.stdout).length).toBeGreaterThanOrEqual(2);
    });
  }
});
