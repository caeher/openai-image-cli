import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { emitJson } from "../context.js";
import { AuthError, UsageError } from "../../core/errors/errors.js";
import { helpExamples } from "../help.js";
import {
  buildGenerationRequest,
  registerGenerateOptions,
} from "../options/generate.js";
import { budgetFromFlags, assertRequestCountWithinBudget } from "../options/cost.js";
import { readStdinPrompt, resolvePromptText } from "../options/prompt-input.js";

export function registerGenerateCommand(program: Command, ctx: ProgramContext): void {
  registerGenerateOptions(
    program
      .command("generate")
      .description("Generate images")
      .addHelpText(
        "after",
        helpExamples(
          'generate --prompt "a red fox" --dry-run',
          "generate --prompt-file scene.yaml --json",
        ),
      ),
  ).action(async (opts) => {
    const effective = ctx.cli.config.getEffective();
    if (!opts.prompt && !opts.promptFile && !opts.stdin) {
      throw new UsageError("generate requires --prompt, --prompt-file, or --stdin");
    }
    let prompt = "";
    if (opts.stdin && !opts.prompt) {
      prompt = await readStdinPrompt();
    } else {
      prompt = resolvePromptText(opts, ctx.cli.prompts);
    }
    if (!prompt.trim() && !opts.stdin) {
      throw new UsageError("generate requires a non-empty prompt");
    }
    const request = buildGenerationRequest(opts, effective, prompt);
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
    const result = await ctx.cli.generation.generate(request, new AbortController().signal);
    if (ctx.json) {
      emitJson(ctx, { ...result, savePartials: request.savePartials });
    } else if (opts.dryRun) {
      console.log("Dry run complete");
    } else {
      console.log(result.images.map((i) => i.path).join("\n"));
    }
  });
}
