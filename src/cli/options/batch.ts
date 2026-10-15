import type { Command } from "commander";

export type BatchMode = "local" | "openai";

export function registerBatchModeOption(cmd: Command): Command {
  return cmd.option("--mode <mode>", "local|openai", "local");
}

export function parseBatchMode(value: string): BatchMode {
  if (value === "local" || value === "openai") {
    return value;
  }
  return "local";
}
