import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { emitJson } from "../context.js";

export function registerStyleCommands(program: Command, ctx: ProgramContext): void {
  program
    .command("style")
    .description("Apply a style template")
    .option("--style <id>", "Style template id")
    .option("--image <path>")
    .option("--prompt <text>")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const result = await ctx.cli.editing.applyStyle(
        {
          styleId: opts.style,
          prompt: opts.prompt,
          imagePath: opts.image,
          model: effective.model,
          apiMode: effective.apiMode,
          responsesModel: effective.responsesModel,
          size: effective.size,
          quality: effective.quality,
          format: effective.format,
          background: effective.background,
          directory: effective.outputDir,
          dryRun: false,
          stream: false,
          partialImages: 0,
          savePartials: false,
          count: 1,
        },
        new AbortController().signal,
      );
      if (ctx.json) {
        emitJson(ctx, result);
      }
    });
}
