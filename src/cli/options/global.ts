import type { Command } from "commander";

export interface GlobalCliFlags {
  json?: boolean;
  verbose?: boolean;
  debug?: boolean;
  quiet?: boolean;
}

export function registerGlobalOptions(program: Command): void {
  program
    .option("--json", "Emit JSON on stdout")
    .option("--verbose", "Verbose logging")
    .option("--debug", "Debug logging (alias of verbose)")
    .option("--quiet", "Quiet logging");
}

export function readGlobalFlags(opts: GlobalCliFlags): {
  json: boolean;
  verbose: boolean;
  quiet: boolean;
} {
  return {
    json: Boolean(opts.json),
    verbose: Boolean(opts.verbose || opts.debug),
    quiet: Boolean(opts.quiet),
  };
}
