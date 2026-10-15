import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";
import { AuthError } from "../../core/errors/errors.js";
import { helpExamples } from "../help.js";
import { parseBatchMode, registerBatchModeOption } from "../options/batch.js";
import { SingleBar } from "cli-progress";

function withMode(cmd: import("commander").Command): import("commander").Command {
  return registerBatchModeOption(cmd);
}

export function registerBatchCommands(program: Command, ctx: ProgramContext): void {
  const batch = program
    .command("batch")
    .description("Batch processing")
    .addHelpText("after", helpExamples("batch create jobs.jsonl", "batch status <id>"));

  withMode(
    batch
      .command("create <file>")
      .addHelpText("after", helpExamples("batch create jobs.jsonl --mode local", "batch create jobs.jsonl --mode openai")),
  ).option("--model <id>").action(async (file, opts) => {
    const mode = parseBatchMode(opts.mode);
    if (mode === "openai" && !process.env.OPENAI_API_KEY) {
      throw new AuthError("OPENAI_API_KEY is not set");
    }
    const model = opts.model ?? ctx.cli.config.getEffective().model;
    const id = await ctx.cli.batch.createFromFile(file, { mode, model });
    printOrJson(ctx, { id, mode }, id);
  });

  withMode(batch.command("run <id>").addHelpText("after", helpExamples("batch run <id>", "batch run <id> --mode local"))).action(
    async (id, opts) => {
      const mode = parseBatchMode(opts.mode);
      if (mode === "openai" && !process.env.OPENAI_API_KEY) {
        throw new AuthError("OPENAI_API_KEY is not set");
      }
      const bar = !ctx.json && process.stderr.isTTY ? new SingleBar({}) : null;
      if (bar) {
        bar.start(100, 0);
      }
      try {
        await ctx.cli.batch.run(id, new AbortController().signal, { mode });
      } finally {
        if (bar) {
          bar.update(100);
          bar.stop();
        }
      }
      printOrJson(ctx, { ok: true }, `Ran ${id}`);
    },
  );

  withMode(batch.command("status <id>").addHelpText("after", helpExamples("batch status <id>", "batch status <id> --json"))).action(
    async (id, opts) => {
      const status = await ctx.cli.batch.status(id, { mode: parseBatchMode(opts.mode) });
      printOrJson(ctx, status, JSON.stringify(status, null, 2));
    },
  );

  withMode(batch.command("retry <id>").addHelpText("after", helpExamples("batch retry <id>", "batch retry <id> --mode local"))).action(
    async (id, opts) => {
      await ctx.cli.batch.retry(id, new AbortController().signal, { mode: parseBatchMode(opts.mode) });
      printOrJson(ctx, { ok: true }, `Retried ${id}`);
    },
  );

  withMode(
    batch.command("export <id> <dir>").addHelpText("after", helpExamples("batch export <id> ./out", "batch export <id> ./exports")),
  ).action(async (id, dir, opts) => {
    await ctx.cli.batch.export(id, dir, { mode: parseBatchMode(opts.mode) });
    printOrJson(ctx, { ok: true }, `Exported ${id}`);
  });
}
