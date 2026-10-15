import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

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
