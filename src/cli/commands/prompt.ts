import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

export function registerPromptCommands(program: Command, ctx: ProgramContext): void {
  const prompt = program.command("prompt").description("Prompt tools");
  prompt.command("templates").action(() => {
    const templates = ctx.cli.prompts.listTemplates();
    printOrJson(ctx, { templates }, templates.map((t) => t.id).join("\n"));
  });
  prompt
    .command("build")
    .option("--template <id>")
    .option("--style <id>")
    .option("--var <pair>", "key=value", (v, prev: string[]) => [...prev, v], [])
    .action((opts) => {
      const vars: Record<string, string> = {};
      for (const pair of opts.var ?? []) {
        const [k, ...rest] = pair.split("=");
        vars[k] = rest.join("=");
      }
      const built = ctx.cli.prompts.build({
        templateId: opts.template,
        styleId: opts.style,
        fields: {},
        vars,
      });
      printOrJson(ctx, built, built.text);
    });
  prompt
    .command("validate <text>")
    .action((text) => {
      const model = ctx.cli.models.resolve(ctx.cli.config.getEffective().model);
      const validation = ctx.cli.prompts.validate(text, model);
      printOrJson(ctx, validation, JSON.stringify(validation));
    });
  prompt
    .command("optimize <text>")
    .option("--model <id>")
    .action(async (text, opts) => {
      const result = await ctx.cli.prompts.optimize(
        text,
        opts.model ?? "",
        new AbortController().signal,
      );
      printOrJson(ctx, result, result.optimized);
    });
}
