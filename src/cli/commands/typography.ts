import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { CapabilityError } from "../../core/errors/errors.js";
import { printOrJson } from "../context.js";

export function registerTypographyCommand(program: Command, ctx: ProgramContext): void {
  program
    .command("typography")
    .description("Typography overlay or review")
    .option("--image <path>")
    .option("--primary <text>")
    .option("--exact")
    .option("--review")
    .action(async (opts) => {
      if (opts.review) {
        const reviewModel = ctx.cli.config.getEffective().typography?.reviewModel;
        if (!reviewModel) {
          throw new CapabilityError("typography review requires typography.reviewModel in config");
        }
      }
      if (opts.exact && opts.image && opts.primary) {
        const out = `${ctx.cli.config.getEffective().outputDir}/typography.png`;
        const meta = await ctx.cli.media.overlaySvgText(
          opts.image,
          out,
          { primaryText: opts.primary },
        );
        printOrJson(ctx, meta, out);
        return;
      }
      throw new CapabilityError("Typography generation without --exact requires a configured review model");
    });
}
