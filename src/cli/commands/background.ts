import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { emitJson } from "../context.js";
import { CapabilityError } from "../../core/errors/errors.js";

export function registerBackgroundCommands(program: Command, ctx: ProgramContext): void {
  program
    .command("transparent")
    .description("Generate or edit with transparent background")
    .option("--image <path>")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const result = await ctx.cli.editing.transparent(
        {
          imagePath: opts.image,
          model: effective.model,
          apiMode: effective.apiMode,
          responsesModel: effective.responsesModel,
          size: effective.size,
          quality: effective.quality,
          format: "png",
          directory: effective.outputDir,
          dryRun: false,
          stream: false,
          partialImages: 0,
          savePartials: false,
        },
        new AbortController().signal,
      );
      if (ctx.json) {
        emitJson(ctx, result);
      }
    });

  const bg = program.command("background").description("Background operations");
  bg.command("remove")
    .option("--image <path>")
    .option("--method <name>")
    .action(async (opts) => {
      if (opts.method === "local") {
        throw new CapabilityError("Local background removal is disabled");
      }
      const effective = ctx.cli.config.getEffective();
      const result = await ctx.cli.editing.removeBackground(
        {
          imagePath: opts.image,
          model: effective.model,
          apiMode: effective.apiMode,
          responsesModel: effective.responsesModel,
          size: effective.size,
          quality: effective.quality,
          format: effective.format,
          directory: effective.outputDir,
          dryRun: false,
          stream: false,
          partialImages: 0,
          savePartials: false,
        },
        new AbortController().signal,
      );
      if (ctx.json) {
        emitJson(ctx, result);
      }
    });
  bg.command("replace")
    .option("--image <path>")
    .option("--prompt <text>")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const result = await ctx.cli.editing.replaceBackground(
        {
          imagePath: opts.image,
          prompt: opts.prompt,
          backgroundDescription: opts.prompt,
          model: effective.model,
          apiMode: effective.apiMode,
          responsesModel: effective.responsesModel,
          size: effective.size,
          quality: effective.quality,
          format: effective.format,
          directory: effective.outputDir,
          dryRun: false,
          stream: false,
          partialImages: 0,
          savePartials: false,
        },
        new AbortController().signal,
      );
      if (ctx.json) {
        emitJson(ctx, result);
      }
    });
}
