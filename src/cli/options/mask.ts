import type { Command } from "commander";

function collect<T>(value: T, previous: T[]): T[] {
  return [...previous, value];
}

export function registerMaskOutputOptions(cmd: Command): Command {
  return cmd.option("--output <path>", "Output mask path");
}

export function registerMaskInspectOptions(cmd: Command): Command {
  return cmd.option("--image <path>", "Base image path");
}

export function registerMaskMergeOptions(cmd: Command): Command {
  return cmd
    .option("--mask <path>", "Mask path (repeatable)", collect, [])
    .option("--output <path>");
}

export function registerMaskMorphOptions(cmd: Command): Command {
  return cmd.option("--radius <n>", "Morphology radius", "1");
}

export function registerMaskRectOptions(cmd: Command): Command {
  return cmd
    .option("--x <n>")
    .option("--y <n>")
    .option("--width <n>")
    .option("--height <n>")
    .option("--invert", "Invert selection inside rect");
}

export function registerMaskPolygonOptions(cmd: Command): Command {
  return cmd
    .option("--points <list>", "Semicolon-separated x,y pairs")
    .option("--invert", "Invert polygon selection");
}
