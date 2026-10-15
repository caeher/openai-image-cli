import crypto from "node:crypto";
import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";
import { AuthError, UsageError } from "../../core/errors/errors.js";
import type { ImageEditRequest } from "../../core/entities/request.js";

export function registerSessionCommands(program: Command, ctx: ProgramContext): void {
  const session = program.command("session").description("Creative sessions");
  session
    .command("create")
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
      "\nExamples:\n  $ oaiimage session edit abc --prompt \"add rain\"\n  $ oaiimage session edit abc --prompt \"wider frame\" --dry-run",
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
      if (!dryRun && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }

      const apiMode = existing.apiMode;
      const imagePath = opts.image ?? last?.outputPaths[0];
      const previousResponseId =
        apiMode === "responses" && last?.responseId ? last.responseId : undefined;

      let result;
      if (imagePath || previousResponseId) {
        if (!imagePath) {
          throw new UsageError("session edit requires --image or a prior iteration output path");
        }
        const editRequest: ImageEditRequest = {
          prompt: opts.prompt,
          model: existing.imageModel,
          apiMode,
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
          images: [{ path: imagePath, role: "subject" }],
          preserve: [],
          ...(previousResponseId ? { previousResponseId } : {}),
        };
        const cost = ctx.cli.costs.estimate(editRequest);
        if (!dryRun) {
          ctx.cli.costs.assertWithinBudget(cost, {
            interactive: Boolean(process.stdin.isTTY),
            confirmCost: Boolean(opts.confirmCost),
          });
        }
        result = await ctx.cli.editing.edit(editRequest, new AbortController().signal);
      } else {
        const genRequest = {
          prompt: opts.prompt,
          model: existing.imageModel,
          apiMode,
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
          ctx.cli.costs.assertWithinBudget(cost, {
            interactive: Boolean(process.stdin.isTTY),
            confirmCost: Boolean(opts.confirmCost),
          });
        }
        result = await ctx.cli.generation.generate(genRequest, new AbortController().signal);
      }

      if (!dryRun) {
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
          source: previousResponseId ? "api" : "fallback",
          ...(result.responseId ? { responseId: result.responseId } : {}),
          ...(result.imageCallId ? { imageCallId: result.imageCallId } : {}),
        });
      }
      printOrJson(ctx, result, dryRun ? "Dry run" : `Session ${id} updated`);
    });

  session.command("history <id>").action(async (id) => {
    const s = await ctx.cli.sessions.get(id);
    printOrJson(ctx, s, JSON.stringify(s, null, 2));
  });
  session.command("inspect <id>").action(async (id) => {
    const s = await ctx.cli.sessions.get(id);
    printOrJson(ctx, s, JSON.stringify(s, null, 2));
  });
  session.command("export <id> <path>").action(async (id, out) => {
    await ctx.cli.sessions.exportSession(id, out);
    printOrJson(ctx, { ok: true }, `Exported ${id}`);
  });
  session.command("delete <id>").action(async (id) => {
    await ctx.cli.sessions.delete(id);
    printOrJson(ctx, { ok: true }, `Deleted ${id}`);
  });
}
