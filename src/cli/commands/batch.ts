import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

export function registerBatchCommands(program: Command, ctx: ProgramContext): void {
  const batch = program.command("batch").description("Batch processing");
  batch
    .command("create <file>")
    .option("--mode <mode>", "local|openai", "local")
    .option("--model <id>")
    .action(async (file, opts) => {
      const model = opts.model ?? ctx.cli.config.getEffective().model;
      const id = await ctx.cli.batch.createFromFile(file, {
        mode: opts.mode as "local" | "openai",
        model,
      });
      printOrJson(ctx, { id }, id);
    });
  batch.command("run <id>").action(async (id) => {
    await ctx.cli.batch.run(id, new AbortController().signal);
    printOrJson(ctx, { ok: true }, `Ran ${id}`);
  });
  batch.command("status <id>").action(async (id) => {
    const status = await ctx.cli.batch.status(id);
    printOrJson(ctx, status, JSON.stringify(status, null, 2));
  });
  batch.command("retry <id>").action(async (id) => {
    await ctx.cli.batch.retry(id, new AbortController().signal);
    printOrJson(ctx, { ok: true }, `Retried ${id}`);
  });
  batch.command("export <id> <dir>").action(async (id, dir) => {
    await ctx.cli.batch.export(id, dir);
    printOrJson(ctx, { ok: true }, `Exported ${id}`);
  });
}
