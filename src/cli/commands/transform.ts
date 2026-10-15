import crypto from "node:crypto";
import fs from "node:fs";
import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { CapabilityError, UsageError, AuthError } from "../../core/errors/errors.js";
import { printOrJson } from "../context.js";
import { helpExamples } from "../help.js";

export function registerTransformCommands(program: Command, ctx: ProgramContext): void {
  program
    .command("upscale")
    .description("Local upscale via interpolation")
    .addHelpText("after", helpExamples("upscale --image in.png --output out.png --scale 2", "upscale --image a.png --scale 4"))
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
      .addHelpText(
        "after",
        helpExamples(
          `${name} --image photo.png --prompt "recover detail" --dry-run`,
          `${name} --image a.png --prompt "sharpen" --dry-run --json`,
        ),
      )
      .option("--image <path>")
      .option("--prompt <text>")
      .option("--dry-run")
      .action(async (opts) => {
        if (!opts.prompt) {
          throw new CapabilityError(`${name} without --prompt is disabled`);
        }
        if (!opts.image) {
          throw new UsageError(`${name} requires --image when using generative mode`);
        }
        const before = crypto.createHash("sha256").update(fs.readFileSync(opts.image)).digest("hex");
        const effective = ctx.cli.config.getEffective();
        const dryRun = Boolean(opts.dryRun);
        if (!dryRun && !process.env.OPENAI_API_KEY) {
          throw new AuthError("OPENAI_API_KEY is not set");
        }
        const prompt = `${opts.prompt}\nAviso: no se recupera detalle que no exista en la imagen de entrada.`;
        const result = await ctx.cli.editing.edit(
          {
            prompt,
            model: effective.model,
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
        const after = crypto.createHash("sha256").update(fs.readFileSync(opts.image)).digest("hex");
        expectHashUnchanged(before, after);
        printOrJson(ctx, { ...result, inputSha256: before, warning: "detail-not-guaranteed" }, dryRun ? "Dry run" : "done");
      });
  }
}

function expectHashUnchanged(before: string, after: string): void {
  if (before !== after) {
    throw new UsageError("Input image was modified unexpectedly");
  }
}
