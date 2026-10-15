import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { UsageError } from "../../core/errors/errors.js";

export function registerVariationsCommand(program: Command, ctx: ProgramContext): void {
  program
    .command("variations")
    .description("Create variations via generate/edit (not createVariation)")
    .option("--image <path>")
    .option("--prompt <text>")
    .action((opts) => {
      if (!opts.prompt) {
        throw new UsageError("variations requires --prompt");
      }
      console.error("Note: variations are non-deterministic; results will differ each run.");
      void opts;
      void ctx;
    });
}
