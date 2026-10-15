import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { emitJson } from "../context.js";
import { UsageError, AuthError } from "../../core/errors/errors.js";
import { helpExamples } from "../help.js";

export function registerVariationsCommand(program: Command, ctx: ProgramContext): void {
  program
    .command("variations")
    .description("Create variations via generate/edit (not createVariation)")
    .addHelpText(
      "after",
      helpExamples(
        'variations --prompt "alternate palette" --image photo.png --dry-run',
        'variations --prompt "softer light" --dry-run --json',
      ),
    )
    .option("--image <path>")
    .option("--prompt <text>")
    .option("--dry-run")
    .option("--model <id>")
    .action(async (opts) => {
      if (!opts.prompt) {
        throw new UsageError("variations requires --prompt");
      }
      if (!ctx.json) {
        console.error(
          "Note: OpenAI has no /images/variations endpoint in this CLI; results are non-deterministic.",
        );
      }
      const effective = ctx.cli.config.getEffective();
      const dryRun = Boolean(opts.dryRun);
      if (!dryRun && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }
      const prompt = `${opts.prompt}\nVariación no determinista.`;
      if (opts.image) {
        const result = await ctx.cli.editing.edit(
          {
            prompt,
            model: opts.model ?? effective.model,
            apiMode: effective.apiMode,
            responsesModel: effective.responsesModel,
            size: effective.size,
            quality: effective.quality,
            format: effective.format,
            background: effective.background,
            count: 1,
            stream: false,
            partialImages: 0,
            savePartials: false,
            directory: effective.outputDir,
            dryRun,
            images: [{ path: opts.image, role: "subject" }],
            preserve: [],
          },
          new AbortController().signal,
        );
        if (ctx.json) {
          emitJson(ctx, result);
        }
        return;
      }
      const result = await ctx.cli.generation.generate(
        {
          prompt,
          model: opts.model ?? effective.model,
          apiMode: effective.apiMode,
          responsesModel: effective.responsesModel,
          size: effective.size,
          quality: effective.quality,
          format: effective.format,
          background: effective.background,
          count: 1,
          stream: false,
          partialImages: 0,
          savePartials: false,
          directory: effective.outputDir,
          dryRun,
        },
        new AbortController().signal,
      );
      if (ctx.json) {
        emitJson(ctx, result);
      }
    });
}
