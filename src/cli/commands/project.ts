import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

export function registerProjectCommands(program: Command, ctx: ProgramContext): void {
  const project = program.command("project").description("Project management");
  project.command("init").action(async () => {
    const created = await ctx.cli.projects.init(process.cwd());
    printOrJson(ctx, created, created.root);
  });
  project.command("list").action(async () => {
    const list = await ctx.cli.projects.list(process.cwd());
    printOrJson(ctx, { projects: list }, list.map((p) => p.name).join("\n"));
  });
  project.command("inspect <path>").action(async (p) => {
    const data = await ctx.cli.projects.inspect(p);
    printOrJson(ctx, data, JSON.stringify(data, null, 2));
  });
}
