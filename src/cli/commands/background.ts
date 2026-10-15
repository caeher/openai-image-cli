import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { emitJson } from "../context.js";
import { CapabilityError, AuthError } from "../../core/errors/errors.js";
import { helpExamples } from "../help.js";

export function registerBackgroundCommands(program: Command, ctx: ProgramContext): void {
  program
    .command("transparent")
    .description("Generate or edit with transparent background")
    .addHelpText(
      "after",
      helpExamples(
        "transparent --image photo.png --dry-run",
        "transparent --format jpeg --dry-run",
      ),
    )
    .option("--image <path>")
    .option("--dry-run")
    .option("--format <format>")
    .option("--model <id>")
    .option("--confirm-cost")
    .option("--force")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const format = (opts.format ?? "png") as "png" | "jpeg" | "webp";
      if (format === "jpeg") {
        throw new CapabilityError("transparent with jpeg format is not supported");
      }
      const dryRun = Boolean(opts.dryRun);
      if (!dryRun && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }
      const result = await ctx.cli.editing.transparent(
        {
          imagePath: opts.image,
          model: opts.model ?? effective.model,
          apiMode: effective.apiMode,
          responsesModel: effective.responsesModel,
          size: effective.size,
          quality: effective.quality,
          format,
          directory: effective.outputDir,
          dryRun,
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
    .addHelpText(
      "after",
      helpExamples(
        "background remove --image photo.png --dry-run",
        "background remove --method local",
      ),
    )
    .option("--image <path>")
    .option("--method <name>")
    .option("--dry-run")
    .action(async (opts) => {
      if (opts.method === "local") {
        throw new CapabilityError("Local background removal is disabled");
      }
      const effective = ctx.cli.config.getEffective();
      const dryRun = Boolean(opts.dryRun);
      if (!dryRun && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }
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
          dryRun,
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
    .addHelpText(
      "after",
      helpExamples(
        "background replace --image photo.png --prompt \"sunset beach\" --dry-run",
        "background replace --image a.png --prompt sky --json",
      ),
    )
    .option("--image <path>")
    .option("--prompt <text>")
    .option("--dry-run")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const dryRun = Boolean(opts.dryRun);
      if (!dryRun && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }
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
          dryRun,
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
