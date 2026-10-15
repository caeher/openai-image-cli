import type { Command } from "commander";

function collect<T>(value: T, previous: T[]): T[] {
  return [...previous, value];
}

export function registerMediaLayerOptions(cmd: Command): Command {
  return cmd.option("--layer <path>", "Composite layer (repeatable)", collect, []);
}

export function registerMediaImageListOptions(cmd: Command): Command {
  return cmd.option("--image <path>", "Input image (repeatable)", collect, []);
}
