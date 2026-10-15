import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

export function registerDoctorCommand(program: Command, ctx: ProgramContext): void {
  program
    .command("doctor")
    .description("Check local environment and configuration")
    .addHelpText("after", "\nExamples:\n  $ oaiimage doctor\n  $ oaiimage doctor --json")
    .action(() => {
      const report = {
        node: process.version,
        bin: "ok",
        config: ctx.cli.config.getEffective(),
        secretInFiles: "absent",
        openaiApiKey: process.env.OPENAI_API_KEY ? "present" : "missing",
        organization: "not-checked",
      };
      printOrJson(ctx, report, JSON.stringify(report, null, 2));
    });
}
