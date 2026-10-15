import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

export function registerCapabilitiesCommand(program: Command, ctx: ProgramContext): void {
  program
    .command("capabilities [model]")
    .description("Show model capabilities")
    .action((modelId?: string) => {
      const id = modelId ?? ctx.cli.config.getEffective().model;
      const caps = ctx.cli.capabilities.getCapabilities(id);
      printOrJson(ctx, caps, JSON.stringify(caps, null, 2));
    });
}
