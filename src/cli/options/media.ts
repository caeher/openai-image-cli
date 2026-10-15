import type { Command } from "commander";

function collectString(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export function registerMediaLayerOptions(cmd: Command): Command {
  return cmd.option("--layer <path>", "Composite layer (repeatable)", collectString, []);
}

export function registerMediaImageListOptions(cmd: Command): Command {
  return cmd.option("--image <path>", "Input image (repeatable)", collectString, []);
}
