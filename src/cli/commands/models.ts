import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

export function registerModelsCommands(program: Command, ctx: ProgramContext): void {
  const models = program.command("models").description("Model registry");
  models
    .command("list")
    .description("List known models")
    .action(() => {
      const list = ctx.cli.models.list().map((m) => ({ id: m.id, status: m.status, displayName: m.displayName }));
      printOrJson(ctx, { models: list }, list.map((m) => m.id).join("\n"));
    });
  models
    .command("inspect <id>")
    .description("Inspect a model")
    .action((id) => {
      const model = ctx.cli.models.resolve(id);
      printOrJson(ctx, model, JSON.stringify(model, null, 2));
    });
}
