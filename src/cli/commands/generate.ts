import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { emitJson } from "../context.js";
import { AuthError, UsageError } from "../../core/errors/errors.js";
import type { ImageGenerationRequest } from "../../core/entities/request.js";

export function registerGenerateCommand(program: Command, ctx: ProgramContext): void {
  program
    .command("generate")
    .description("Generate images")
    .addHelpText("after", "\nExamples:\n  $ oaiimage generate --prompt \"a red fox\" --dry-run\n  $ oaiimage generate --prompt-file scene.yaml")
    .option("--prompt <text>")
    .option("--prompt-file <path>")
    .option("--model <id>")
    .option("--size <size>")
    .option("--quality <quality>")
    .option("--format <format>")
    .option("--compression <n>")
    .option("--background <mode>")
    .option("--count <n>")
    .option("--output <path>")
    .option("--dir <path>")
    .option("--stream")
    .option("--partials <n>")
    .option("--save-partials")
    .option("--dry-run")
    .option("--stdin")
    .option("--max-cost <usd>")
    .option("--confirm-cost")
    .option("--budget <usd>")
    .option("--max-requests <n>")
    .option("--api-mode <mode>")
    .option("--responses-model <id>")
    .option("--force")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      if (!opts.prompt && !opts.promptFile && !opts.stdin) {
        throw new UsageError("generate requires --prompt, --prompt-file, or --stdin");
      }
      let prompt = opts.prompt ?? "";
      if (opts.promptFile) {
        const fs = await import("node:fs");
        prompt = fs.readFileSync(opts.promptFile, "utf8");
        if (opts.prompt) {
          console.error("Warning: --prompt overrides --prompt-file");
        }
      }
      const request: ImageGenerationRequest = {
        prompt,
        model: opts.model ?? effective.model,
        apiMode: opts.apiMode ?? effective.apiMode,
        responsesModel: opts.responsesModel ?? effective.responsesModel,
        size: opts.size ?? effective.size,
        quality: opts.quality ?? effective.quality,
        format: opts.format ?? effective.format,
        background: opts.background ?? effective.background,
        count: Number(opts.count ?? effective.count),
        stream: Boolean(opts.stream),
        partialImages: Number(opts.partials ?? 0),
        savePartials: Boolean(opts.savePartials),
        directory: opts.dir ?? effective.outputDir,
        dryRun: Boolean(opts.dryRun),
        ...(opts.output ? { output: opts.output } : {}),
        ...(opts.compression ? { compression: Number(opts.compression) } : {}),
        ...(opts.force ? { force: true } : {}),
      };
      if (!request.dryRun && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }
      const cost = ctx.cli.costs.estimate(request);
      if (!request.dryRun) {
        ctx.cli.costs.assertWithinBudget(cost, {
          interactive: Boolean(process.stdin.isTTY),
          confirmCost: Boolean(opts.confirmCost),
          ...(opts.maxCost ? { maxCostUsd: Number(opts.maxCost) } : {}),
          ...(opts.budget ? { budgetUsd: Number(opts.budget) } : {}),
        });
      }
      const result = await ctx.cli.generation.generate(request, new AbortController().signal);
      if (ctx.json) {
        emitJson(ctx, result);
      } else if (opts.dryRun) {
        console.log("Dry run complete");
      } else {
        console.log(result.images.map((i) => i.path).join("\n"));
      }
    });
}
