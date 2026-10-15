import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

export function registerConfigCommands(program: Command, ctx: ProgramContext): void {
  const config = program.command("config").description("Manage configuration");
  config
    .command("init")
    .description("Initialize configuration")
    .option("--global", "Write global config")
    .action(async (opts) => {
      const path = await ctx.cli.config.init({ global: opts.global });
      printOrJson(ctx, { ok: true, path }, `Config initialized at ${path}`);
    });
  config
    .command("set <key> <value>")
    .description("Set a configuration value")
    .option("--global", "Write global config")
    .action(async (key, value, opts) => {
      await ctx.cli.config.set(key, value, { global: opts.global });
      printOrJson(ctx, { ok: true }, `Set ${key}`);
    });
  config
    .command("get <key>")
    .description("Get a configuration value")
    .action((key) => {
      const value = ctx.cli.config.get(key);
      printOrJson(ctx, { key, value }, `${key}=${String(value)}`);
    });
  config
    .command("list")
    .description("List effective configuration")
    .action(() => {
      const value = ctx.cli.config.list();
      printOrJson(ctx, value, JSON.stringify(value, null, 2));
    });
  config
    .command("reset")
    .description("Reset configuration file")
    .option("--global", "Reset global config")
    .action(async (opts) => {
      await ctx.cli.config.reset({ global: opts.global });
      printOrJson(ctx, { ok: true }, "Config reset");
    });

  program
    .command("init")
    .description("Initialize project or global config")
    .action(async () => {
      const path = await ctx.cli.config.init();
      printOrJson(ctx, { ok: true, path }, `Initialized ${path}`);
    });
}
