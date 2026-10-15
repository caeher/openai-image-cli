import crypto from "node:crypto";
import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";
import { AuthError, UsageError } from "../../core/errors/errors.js";
import type { ImageEditRequest } from "../../core/entities/request.js";
import { helpExamples } from "../help.js";
import { nextSessionCall } from "../../services/sessions/plan.js";
import { budgetFromFlags } from "../options/cost.js";

export function registerSessionCommands(program: Command, ctx: ProgramContext): void {
  const session = program
    .command("session")
    .description("Creative sessions")
    .addHelpText("after", helpExamples("session create", "session history <id>"));
  session
    .command("create")
    .addHelpText("after", helpExamples("session create", "session create --json"))
    .action(async () => {
      const effective = ctx.cli.config.getEffective();
      const created = await ctx.cli.sessions.create({
        apiMode: effective.apiMode,
        imageModel: effective.model,
        responsesModel: effective.responsesModel,
      });
      printOrJson(ctx, created, created.id);
    });
  session
    .command("edit <id>")
    .description("Continue a session with a new prompt")
    .addHelpText(
      "after",
      helpExamples('session edit abc --prompt "add rain"', 'session edit abc --prompt "wider frame" --dry-run'),
    )
    .requiredOption("--prompt <text>")
    .option("--image <path>")
    .option("--dry-run")
    .option("--confirm-cost")
    .action(async (id, opts) => {
      const existing = await ctx.cli.sessions.get(id);
      if (!existing) {
        throw new UsageError(`Session not found: ${id}`);
      }
      const effective = ctx.cli.config.getEffective();
      const last = existing.iterations.at(-1);
      const dryRun = Boolean(opts.dryRun);
      const plan = nextSessionCall({
        apiMode: existing.apiMode,
        prompt: opts.prompt,
        ...(last ? { parent: last } : {}),
        ...(opts.image ? { imagePath: opts.image } : {}),
      });
      if (plan.kind === "generate" && !opts.prompt) {
        throw new UsageError("session edit requires --prompt");
      }
      if (plan.kind === "generate" && !opts.image && !last?.outputPaths[0] && !last?.responseId) {
        throw new UsageError("session edit requires --image or a prior iteration output path");
      }

      const budget = budgetFromFlags({
        interactive: Boolean(process.stdin.isTTY),
        confirmCost: Boolean(opts.confirmCost),
      });

      let result;
      if (plan.kind === "edit") {
        const editRequest: ImageEditRequest = {
          prompt: opts.prompt,
          model: existing.imageModel,
          apiMode: existing.apiMode,
          responsesModel: existing.responsesModel ?? effective.responsesModel,
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
          images: [{ path: plan.imagePath, role: "subject" }],
          preserve: [],
          ...(plan.previousResponseId ? { previousResponseId: plan.previousResponseId } : {}),
        };
        const cost = ctx.cli.costs.estimate(editRequest);
        if (!dryRun) {
          if (!process.env.OPENAI_API_KEY) {
            throw new AuthError("OPENAI_API_KEY is not set");
          }
          ctx.cli.costs.assertWithinBudget(cost, budget);
        }
        result = await ctx.cli.editing.edit(editRequest, new AbortController().signal);
      } else {
        const genRequest = {
          prompt: opts.prompt,
          model: existing.imageModel,
          apiMode: existing.apiMode,
          responsesModel: existing.responsesModel ?? effective.responsesModel,
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
        };
        const cost = ctx.cli.costs.estimate(genRequest);
        if (!dryRun) {
          if (!process.env.OPENAI_API_KEY) {
            throw new AuthError("OPENAI_API_KEY is not set");
          }
          ctx.cli.costs.assertWithinBudget(cost, budget);
        }
        result = await ctx.cli.generation.generate(genRequest, new AbortController().signal);
      }

      if (!dryRun) {
        const source = plan.kind === "edit" ? plan.source : "fallback";
        await ctx.cli.sessions.addIteration(id, {
          id: crypto.randomBytes(6).toString("hex"),
          ...(last?.id ? { parentId: last.id } : {}),
          createdAt: new Date().toISOString(),
          prompt: opts.prompt,
          revisedPrompt: result.revisedPrompt,
          model: result.model,
          parameters: {},
          cost: result.cost,
          outputPaths: result.images.map((img) => img.path),
          source,
          ...(result.responseId ? { responseId: result.responseId } : {}),
          ...(result.imageCallId ? { imageCallId: result.imageCallId } : {}),
        });
      }
      printOrJson(ctx, result, dryRun ? "Dry run" : `Session ${id} updated`);
    });

  session
    .command("history <id>")
    .addHelpText("after", helpExamples("session history <id>", "session history <id> --json"))
    .action(async (id) => {
      const s = await ctx.cli.sessions.get(id);
      printOrJson(ctx, s, JSON.stringify(s, null, 2));
    });
  session
    .command("inspect <id>")
    .addHelpText("after", helpExamples("session inspect <id>", "session inspect <id> --json"))
    .action(async (id) => {
      const s = await ctx.cli.sessions.get(id);
      printOrJson(ctx, s, JSON.stringify(s, null, 2));
    });
  session
    .command("export <id> <path>")
    .addHelpText("after", helpExamples("session export <id> ./backup.json", "session export <id> out.json --json"))
    .action(async (id, out) => {
      await ctx.cli.sessions.exportSession(id, out);
      printOrJson(ctx, { ok: true }, `Exported ${id}`);
    });
  session
    .command("delete <id>")
    .addHelpText("after", helpExamples("session delete <id>", "session delete <id> --json"))
    .action(async (id) => {
      await ctx.cli.sessions.delete(id);
      printOrJson(ctx, { ok: true }, `Deleted ${id}`);
    });
}
