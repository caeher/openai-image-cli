import fs from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";
import { helpExamples } from "../help.js";
import { globalConfigPath, projectConfigPath, findProjectRoot } from "../../config/paths.js";

function scanSecretsInYaml(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const text = fs.readFileSync(filePath, "utf8");
  return /\b(apiKey|openai_api_key|OPENAI_API_KEY)\s*:/.test(text);
}

export function registerDoctorCommand(program: Command, ctx: ProgramContext): void {
  program
    .command("doctor")
    .description("Check local environment and configuration")
    .addHelpText("after", helpExamples("doctor", "doctor --json"))
    .action(() => {
      const cliPath = path.resolve(process.cwd(), "dist/cli.js");
      const binOk = fs.existsSync(cliPath) ? "ok" : "missing";
      const pathCtx = {
        cwd: process.cwd(),
        homeDir: process.env.HOME ?? "/tmp",
        ...(process.env.XDG_CONFIG_HOME ? { xdgConfigHome: process.env.XDG_CONFIG_HOME } : {}),
      };
      const globalPath = globalConfigPath(pathCtx);
      const projectRoot = findProjectRoot(process.cwd());
      const projectPath = projectRoot ? projectConfigPath(projectRoot) : null;
      const secretInFiles =
        scanSecretsInYaml(globalPath) || (projectPath ? scanSecretsInYaml(projectPath) : false)
          ? "present"
          : "absent";
      const report = {
        node: process.version,
        bin: binOk,
        config: ctx.cli.config.getEffective(),
        secretInFiles,
        openaiApiKey: process.env.OPENAI_API_KEY ? "present" : "missing",
        organization: "not-checked",
      };
      if (secretInFiles === "present") {
        process.exitCode = 3;
      }
      printOrJson(ctx, report, JSON.stringify(report, null, 2));
    });
}
