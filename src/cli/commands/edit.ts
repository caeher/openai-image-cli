import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { emitJson } from "../context.js";

function baseEditOptions(cmd: Command): Command {
  return cmd
    .option("--image <path>")
    .option("--prompt <text>")
    .option("--model <id>")
    .option("--quality <quality>")
    .option("--size <size>")
    .option("--format <format>")
    .option("--output <path>")
    .option("--preserve <text>")
    .option("--dry-run");
}

export function registerEditCommands(program: Command, ctx: ProgramContext): void {
  baseEditOptions(program.command("edit").description("Edit images")).action(async (opts) => {
    const effective = ctx.cli.config.getEffective();
    const result = await ctx.cli.editing.edit(
      {
        prompt: opts.prompt ?? "",
        model: opts.model ?? effective.model,
        apiMode: effective.apiMode,
        responsesModel: effective.responsesModel,
        size: opts.size ?? effective.size,
        quality: opts.quality ?? effective.quality,
        format: opts.format ?? effective.format,
        background: effective.background,
        count: 1,
        stream: false,
        partialImages: 0,
        savePartials: false,
        directory: effective.outputDir,
        dryRun: Boolean(opts.dryRun),
        images: opts.image ? [{ path: opts.image, role: "subject" }] : [],
        preserve: opts.preserve ? [opts.preserve] : [],
        ...(opts.output ? { output: opts.output } : {}),
      },
      new AbortController().signal,
    );
    if (ctx.json) {
      emitJson(ctx, result);
    }
  });

  baseEditOptions(program.command("inpaint").description("Inpaint with mask"))
    .option("--mask <path>")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const result = await ctx.cli.editing.inpaint(
        {
          prompt: opts.prompt ?? "",
          model: opts.model ?? effective.model,
          apiMode: effective.apiMode,
          responsesModel: effective.responsesModel,
          size: opts.size ?? effective.size,
          quality: opts.quality ?? effective.quality,
          format: opts.format ?? effective.format,
          background: effective.background,
          count: 1,
          stream: false,
          partialImages: 0,
          savePartials: false,
          directory: effective.outputDir,
          dryRun: Boolean(opts.dryRun),
          images: opts.image ? [{ path: opts.image, role: "subject" }] : [],
          preserve: [],
          maskPath: opts.mask,
        },
        new AbortController().signal,
      );
      if (ctx.json) {
        emitJson(ctx, result);
      }
    });

  program
    .command("expand")
    .description("Expand canvas and edit")
    .option("--image <path>")
    .option("--prompt <text>")
    .option("--direction <dir>")
    .option("--pixels <n>")
    .option("--aspect <ratio>")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const result = await ctx.cli.editing.expand(
        {
          prompt: opts.prompt ?? "",
          model: opts.model ?? effective.model,
          apiMode: effective.apiMode,
          responsesModel: effective.responsesModel,
          size: opts.size ?? effective.size,
          quality: opts.quality ?? effective.quality,
          format: opts.format ?? effective.format,
          background: effective.background,
          count: 1,
          stream: false,
          partialImages: 0,
          savePartials: false,
          directory: effective.outputDir,
          dryRun: false,
          images: opts.image ? [{ path: opts.image, role: "subject" }] : [],
          preserve: [],
          direction: opts.direction ?? "top",
          pixels: opts.pixels ? Number(opts.pixels) : 0,
          ...(opts.aspect ? { aspect: opts.aspect } : {}),
        },
        new AbortController().signal,
      );
      if (ctx.json) {
        emitJson(ctx, result);
      }
    });

  program
    .command("compose")
    .description("Compose multiple references")
    .option("--image <path>")
    .option("--role <role>")
    .option("--prompt <text>")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const result = await ctx.cli.editing.compose(
        {
          prompt: opts.prompt ?? "",
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
          dryRun: false,
          images: opts.image ? [{ path: opts.image, role: opts.role ?? "subject" }] : [],
          preserve: [],
        },
        new AbortController().signal,
      );
      if (ctx.json) {
        emitJson(ctx, result);
      }
    });
}
