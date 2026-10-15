import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { emitJson } from "../context.js";
import { AuthError } from "../../core/errors/errors.js";
import { helpExamples } from "../help.js";

export function registerStyleCommands(program: Command, ctx: ProgramContext): void {
  program
    .command("style")
    .description("Apply a style template")
    .addHelpText(
      "after",
      helpExamples(
        "style --style photorealistic --prompt \"city\" --dry-run",
        "style --style no-such --dry-run",
      ),
    )
    .option("--style <id>", "Style template id")
    .option("--image <path>")
    .option("--prompt <text>")
    .option("--dry-run")
    .option("--model <id>")
    .option("--format <format>")
    .option("--confirm-cost")
    .option("--force")
    .option("--api-mode <mode>")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const dryRun = Boolean(opts.dryRun);
      if (!dryRun && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }
      const result = await ctx.cli.editing.applyStyle(
        {
          styleId: opts.style,
          prompt: opts.prompt,
          imagePath: opts.image,
          model: opts.model ?? effective.model,
          apiMode: (opts.apiMode ?? effective.apiMode) as "images" | "responses",
          responsesModel: effective.responsesModel,
          size: effective.size,
          quality: effective.quality,
          format: (opts.format ?? effective.format) as "png" | "jpeg" | "webp",
          background: effective.background,
          directory: effective.outputDir,
          dryRun,
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
