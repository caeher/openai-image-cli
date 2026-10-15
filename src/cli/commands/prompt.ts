import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";
import { UsageError } from "../../core/errors/errors.js";
import { helpExamples } from "../help.js";
import { readStdinPrompt } from "../options/prompt-input.js";
import { promptWizard } from "../interactive/wizard.js";

function parseVars(pairs: string[]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const pair of pairs) {
    const [k, ...rest] = pair.split("=");
    if (!k) {
      continue;
    }
    vars[k] = rest.join("=");
  }
  return vars;
}

export function registerPromptCommands(program: Command, ctx: ProgramContext): void {
  const prompt = program
    .command("prompt")
    .description("Prompt tools")
    .addHelpText("after", helpExamples("prompt templates", "prompt build --template product --var subject=mug"));

  prompt
    .command("templates")
    .addHelpText("after", helpExamples("prompt templates", "prompt templates --json"))
    .action(() => {
      const templates = ctx.cli.prompts.listTemplates();
      printOrJson(ctx, { templates }, templates.map((t) => t.id).join("\n"));
    });

  prompt
    .command("build")
    .addHelpText("after", helpExamples("prompt build --template product --var subject=mug", "prompt build --style photorealistic"))
    .option("--template <id>")
    .option("--style <id>")
    .option("--var <pair>", "key=value", (v, prev: string[]) => [...prev, v], [])
    .action((opts) => {
      const built = ctx.cli.prompts.build({
        templateId: opts.template,
        styleId: opts.style,
        fields: {},
        vars: parseVars(opts.var ?? []),
      });
      printOrJson(ctx, built, built.text);
    });

  prompt
    .command("create")
    .addHelpText(
      "after",
      helpExamples("prompt create --var subject=taza", "prompt create --template product --var subject=cup"),
    )
    .option("--template <id>")
    .option("--style <id>")
    .option("--var <pair>", "key=value", (v, prev: string[]) => [...prev, v], [])
    .action(async (opts) => {
      const vars = parseVars(opts.var ?? []);
      let fields = {};
      if (Object.keys(vars).length === 0) {
        fields = await promptWizard({
          json: ctx.json,
          interactive: Boolean(process.stdin.isTTY),
        });
      }
      const built = ctx.cli.prompts.build({
        templateId: opts.template,
        styleId: opts.style,
        fields,
        vars,
      });
      printOrJson(ctx, built, built.text);
    });

  prompt
    .command("inspect <name>")
    .addHelpText("after", helpExamples("prompt inspect my-scene", "prompt inspect saved-name --json"))
    .action((name) => {
      const body = ctx.cli.prompts.loadSaved(name);
      printOrJson(ctx, { name, body }, body);
    });

  prompt
    .command("save <name>")
    .addHelpText("after", helpExamples('prompt save scene --text "line one"', "prompt save scene < scene.txt"))
    .option("--text <body>")
    .action(async (name, opts) => {
      let body = opts.text ?? "";
      if (!body && !process.stdin.isTTY) {
        body = await readStdinPrompt();
      }
      if (!body.trim()) {
        throw new UsageError("prompt save requires --text or stdin");
      }
      const file = await ctx.cli.prompts.save(name, body);
      printOrJson(ctx, { ok: true, file }, file);
    });

  prompt
    .command("validate <text>")
    .addHelpText("after", helpExamples('prompt validate "hello world"', "prompt validate long-text --json"))
    .action((text) => {
      const model = ctx.cli.models.resolve(ctx.cli.config.getEffective().model);
      const validation = ctx.cli.prompts.validate(text, model);
      printOrJson(ctx, validation, JSON.stringify(validation));
    });

  prompt
    .command("optimize <text>")
    .addHelpText("after", helpExamples('prompt optimize "short prompt"', "prompt optimize text --model gpt-4.1-mini"))
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
