import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

export function registerCostCommands(program: Command, ctx: ProgramContext): void {
  const cost = program.command("cost").description("Cost estimation");
  cost
    .command("estimate")
    .option("--prompt <text>")
    .action((opts) => {
      const effective = ctx.cli.config.getEffective();
      const report = ctx.cli.costs.estimate({
        prompt: opts.prompt ?? "",
        model: effective.model,
        apiMode: effective.apiMode,
        size: effective.size,
        quality: effective.quality,
        format: effective.format,
        background: effective.background,
        count: effective.count,
        stream: false,
        partialImages: 0,
        savePartials: false,
        directory: effective.outputDir,
        dryRun: true,
      });
      printOrJson(ctx, report, JSON.stringify(report, null, 2));
    });
  cost.command("report").action(() => {
    printOrJson(ctx, { note: "Use usage summary for ledger totals" }, "No session report");
  });
  program.command("usage").command("summary").action(() => {
    printOrJson(ctx, { totalUsd: "0", count: 0 }, "usage: 0");
  });
}
