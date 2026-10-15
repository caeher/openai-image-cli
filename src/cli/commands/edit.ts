import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { emitJson } from "../context.js";
import { AuthError } from "../../core/errors/errors.js";
import { helpExamples } from "../help.js";
import {
  buildEditRequest,
  registerBaseEditOptions,
  type EditCommandOptions,
} from "../options/edit.js";
import { budgetFromFlags, assertRequestCountWithinBudget } from "../options/cost.js";
import { resolvePromptText } from "../options/prompt-input.js";
import type { ExpandRequest, ImageEditRequest } from "../../core/entities/request.js";

async function runEdit(
  ctx: ProgramContext,
  opts: EditCommandOptions,
  runner: (request: ImageEditRequest, signal: AbortSignal) => Promise<unknown>,
): Promise<void> {
  const effective = ctx.cli.config.getEffective();
  const prompt = opts.prompt ?? resolvePromptText(opts, ctx.cli.prompts);
  const request = buildEditRequest({ ...opts, prompt }, effective, prompt);
  const budget = budgetFromFlags({
    interactive: Boolean(process.stdin.isTTY),
    confirmCost: Boolean(opts.confirmCost),
    ...(opts.maxCost ? { maxCost: opts.maxCost } : {}),
    ...(opts.budget ? { budget: opts.budget } : {}),
    ...(opts.maxRequests ? { maxRequests: opts.maxRequests } : {}),
  });
  assertRequestCountWithinBudget(request.count, budget, request.dryRun);
  if (!request.dryRun && !process.env.OPENAI_API_KEY) {
    throw new AuthError("OPENAI_API_KEY is not set");
  }
  const cost = ctx.cli.costs.estimate(request);
  if (!request.dryRun) {
    ctx.cli.costs.assertWithinBudget(cost, budget);
  }
  const result = await runner(request, new AbortController().signal);
  if (ctx.json) {
    emitJson(ctx, result);
  }
}

export function registerEditCommands(program: Command, ctx: ProgramContext): void {
  registerBaseEditOptions(
    program
      .command("edit")
      .description("Edit images")
      .addHelpText(
        "after",
        helpExamples(
          "edit --image photo.png --prompt \"add snow\" --dry-run",
          "edit --image a.png --image b.png --preserve \"sky\" --dry-run --json",
        ),
      ),
  ).action(async (opts) => {
    await runEdit(ctx, opts, (request, signal) => ctx.cli.editing.edit(request, signal));
  });

  registerBaseEditOptions(
    program
      .command("inpaint")
      .description("Inpaint with mask")
      .addHelpText(
        "after",
        helpExamples(
          "inpaint --image photo.png --mask mask.png --prompt \"blue door\" --dry-run",
          "inpaint --image a.png --mask m.png --prompt fix --json",
        ),
      )
      .option("--mask <path>"),
  ).action(async (opts) => {
    await runEdit(ctx, opts, (request, signal) => ctx.cli.editing.inpaint(request, signal));
  });

  program
    .command("expand")
    .description("Expand canvas and edit")
    .addHelpText(
      "after",
      helpExamples(
        "expand --image photo.png --prompt \"wider sky\" --pixels 128 --dry-run",
        "expand --image a.png --direction left --dry-run --json",
      ),
    )
    .option("--image <path>")
    .option("--prompt <text>")
    .option("--direction <dir>")
    .option("--pixels <n>")
    .option("--aspect <ratio>")
    .option("--dry-run")
    .option("--model <id>")
    .option("--format <format>")
    .option("--confirm-cost")
    .option("--force")
    .option("--api-mode <mode>")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const base = buildEditRequest(
        { ...opts, image: opts.image, dryRun: Boolean(opts.dryRun) },
        effective,
        opts.prompt ?? "",
      );
      const request: ExpandRequest = {
        ...base,
        direction: (opts.direction ?? "top") as ExpandRequest["direction"],
        pixels: opts.pixels ? Number(opts.pixels) : 0,
        ...(opts.aspect ? { aspect: opts.aspect } : {}),
        dryRun: Boolean(opts.dryRun),
        ...(opts.force ? { force: true } : {}),
      };
      if (!request.dryRun && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }
      const result = await ctx.cli.editing.expand(request, new AbortController().signal);
      if (ctx.json) {
        emitJson(ctx, result);
      }
    });

  const collectString = (value: string, previous: string[]) => [...previous, value];

  program
    .command("compose")
    .description("Compose multiple references")
    .addHelpText(
      "after",
      helpExamples(
        "compose --image a.png --role subject --image b.png --role background --prompt blend --dry-run",
        "compose --references ref.png:style --prompt scene --dry-run --json",
      ),
    )
    .option("--image <path>", "Input image (repeatable)", collectString, [])
    .option("--role <role>")
    .option("--references <path:role>", "Reference path:role", collectString, [])
    .option("--prompt <text>")
    .option("--dry-run")
    .option("--model <id>")
    .option("--api-mode <mode>")
    .option("--confirm-cost")
    .option("--force")
    .action(async (opts) => {
      const effective = ctx.cli.config.getEffective();
      const request = buildEditRequest(
        { ...opts, dryRun: Boolean(opts.dryRun) },
        effective,
        opts.prompt ?? "",
      );
      if (!request.dryRun && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }
      const result = await ctx.cli.editing.compose(request, new AbortController().signal);
      if (ctx.json) {
        emitJson(ctx, result);
      }
    });
}
