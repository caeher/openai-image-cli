import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { CapabilityError, AuthError } from "../../core/errors/errors.js";
import { printOrJson } from "../context.js";
import { helpExamples } from "../help.js";

export function registerTypographyCommand(program: Command, ctx: ProgramContext): void {
  program
    .command("typography")
    .description("Typography overlay or generative layout")
    .addHelpText(
      "after",
      helpExamples(
        'typography --exact --image base.png --primary "Hola" --output out.png',
        'typography --primary "Título" --secondary "Sub" --dry-run --prompt "poster"',
      ),
    )
    .option("--image <path>")
    .option("--output <path>")
    .option("--primary <text>")
    .option("--secondary <text>")
    .option("--hierarchy <text>")
    .option("--language <code>")
    .option("--style <text>")
    .option("--composition <text>")
    .option("--colors <text>")
    .option("--prompt <text>")
    .option("--review")
    .option("--exact")
    .option("--dry-run")
    .option("--model <id>")
    .action(async (opts) => {
      if (opts.review) {
        const reviewModel = ctx.cli.config.getEffective().typography?.reviewModel;
        if (!reviewModel) {
          throw new CapabilityError("typography review requires typography.reviewModel in config");
        }
      }
      const spec = {
        primaryText: opts.primary ?? "",
        secondaryText: opts.secondary,
        hierarchy: opts.hierarchy,
        language: opts.language,
        style: opts.style,
        composition: opts.composition,
        colors: opts.colors,
      };
      if (opts.exact) {
        if (!opts.image || !opts.primary) {
          throw new CapabilityError("typography --exact requires --image and --primary");
        }
        const out = opts.output ?? `${ctx.cli.config.getEffective().outputDir}/typography.png`;
        const meta = await ctx.cli.media.overlaySvgText(opts.image, out, spec);
        printOrJson(ctx, meta, out);
        return;
      }
      const effective = ctx.cli.config.getEffective();
      const promptParts = [
        opts.prompt ?? "",
        spec.primaryText ? `Texto principal: ${spec.primaryText}` : "",
        spec.secondaryText ? `Texto secundario: ${spec.secondaryText}` : "",
        spec.hierarchy ? `Jerarquía: ${spec.hierarchy}` : "",
        spec.language ? `Idioma: ${spec.language}` : "",
        spec.style ? `Estilo tipográfico: ${spec.style}` : "",
        spec.composition ? `Composición: ${spec.composition}` : "",
        spec.colors ? `Colores: ${spec.colors}` : "",
      ].filter(Boolean);
      const prompt = promptParts.join("\n");
      const dryRun = Boolean(opts.dryRun);
      if (!dryRun && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }
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
            ...(opts.output ? { output: opts.output } : {}),
          },
          new AbortController().signal,
        );
        printOrJson(ctx, result, dryRun ? "Dry run" : opts.output ?? "done");
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
          ...(opts.output ? { output: opts.output } : {}),
        },
        new AbortController().signal,
      );
      printOrJson(ctx, result, dryRun ? "Dry run" : opts.output ?? "done");
    });
}
