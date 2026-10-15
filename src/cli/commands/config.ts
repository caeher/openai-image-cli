import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";
import { helpExamples } from "../help.js";

export function registerConfigCommands(program: Command, ctx: ProgramContext): void {
  const config = program
    .command("config")
    .description("Manage configuration")
    .addHelpText(
      "after",
      helpExamples("config list", "config set model gpt-image-2.5-flare"),
    );
  config
    .command("init")
    .description("Initialize configuration")
    .option("--global", "Write global config")
    .action(async (opts) => {
      const path = await ctx.cli.config.init({ global: opts.global });
      printOrJson(ctx, { ok: true, path }, `Config initialized at ${path}`);
    });
  config
    .command("set [key] [value]")
    .description("Set a configuration value or merge a file with --file")
    .option("--global", "Write global config")
    .option("--file <path>", "JSON or YAML config object")
    .addHelpText(
      "after",
      helpExamples("config set model gpt-image-2.5-flare", "config set --file ./cfg.json"),
    )
    .action(async (key, value, opts) => {
      if (opts.file) {
        await ctx.cli.config.setFromFile(opts.file, { global: opts.global });
        printOrJson(ctx, { ok: true }, `Merged config from ${opts.file}`);
        return;
      }
      if (value === undefined) {
        throw new Error("config set requires a value or --file");
      }
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
