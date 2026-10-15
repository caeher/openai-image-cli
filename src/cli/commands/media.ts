import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

export function registerMediaCommands(program: Command, ctx: ProgramContext): void {
  const media = program.command("media").description("Local media operations");
  media.command("inspect <path>").action(async (filePath) => {
    const meta = await ctx.cli.media.inspect(filePath);
    printOrJson(ctx, meta, JSON.stringify(meta, null, 2));
  });
  media
    .command("resize <input> <output>")
    .option("--width <n>")
    .option("--height <n>")
    .action(async (input, output, opts) => {
      const resizeOptions: import("../../core/interfaces/media-options.js").ResizeOptions = {};
      if (opts.width) {
        resizeOptions.width = Number(opts.width);
      }
      if (opts.height) {
        resizeOptions.height = Number(opts.height);
      }
      const meta = await ctx.cli.media.resize(input, output, resizeOptions);
      printOrJson(ctx, meta, output);
    });
  media.command("convert <input> <output> <format>").action(async (input, output, format) => {
    const meta = await ctx.cli.media.convert(input, output, format as "png");
    printOrJson(ctx, meta, output);
  });
  media.command("compare <left> <right> <output>").action(async (left, right, output) => {
    const meta = await ctx.cli.media.compare(left, right, output);
    printOrJson(ctx, meta, output);
  });
}
