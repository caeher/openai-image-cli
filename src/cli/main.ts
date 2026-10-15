import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProgram } from "./program.js";
import { resolveExitCode } from "./exit.js";
import { createAbortControllerFromProcess } from "../utils/signal.js";

function resolvePackageJson(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const relative of ["../package.json", "../../package.json"]) {
    const candidate = path.resolve(here, relative);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error("package.json not found");
}

const pkg = JSON.parse(readFileSync(resolvePackageJson(), "utf8")) as { version: string };

async function main(): Promise<void> {
  const program = buildProgram();
  program.version(pkg.version);
  createAbortControllerFromProcess();
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    const code = resolveExitCode(error);
    const json = process.argv.includes("--json");
    if (json) {
      const message = error instanceof Error ? error.message : String(error);
      process.stdout.write(`${JSON.stringify({ ok: false, code, error: message })}\n`);
    } else if (error instanceof Error) {
      console.error(error.message);
    }
    process.exitCode = code;
  }
}

await main();
