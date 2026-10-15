import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { CapabilityError, UsageError } from "../../core/errors/errors.js";
import { printOrJson } from "../context.js";

export function registerTransformCommands(program: Command, ctx: ProgramContext): void {
  program
    .command("upscale")
    .description("Local upscale via interpolation")
    .option("--image <path>")
    .option("--output <path>")
    .option("--scale <n>")
    .action(async (opts) => {
      const out = opts.output ?? "output/upscale.png";
      const meta = await ctx.cli.media.interpolate(opts.image, out, Number(opts.scale ?? 2));
      printOrJson(ctx, meta, out);
    });

  for (const name of ["restore", "enhance"]) {
    program
      .command(name)
      .description(`${name} image`)
      .option("--image <path>")
      .option("--prompt <text>")
      .action((opts) => {
        if (!opts.prompt) {
          throw new CapabilityError(`${name} without --prompt is disabled`);
        }
        if (!opts.image) {
          throw new UsageError(`${name} requires --image when using generative mode`);
        }
        throw new CapabilityError("Generative restore/enhance pipeline not wired in CLI");
      });
  }
}
