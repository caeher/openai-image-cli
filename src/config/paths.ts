import fs from "node:fs";
import path from "node:path";

export interface PathContext {
  cwd: string;
  homeDir: string;
  xdgConfigHome?: string;
  appData?: string;
}

export function globalConfigPath(ctx: PathContext): string {
  if (process.platform === "win32" && ctx.appData) {
    return path.join(ctx.appData, "oaiimage", "config.yaml");
  }
  const base = ctx.xdgConfigHome ?? path.join(ctx.homeDir, ".config");
  return path.join(base, "oaiimage", "config.yaml");
}

export function findProjectRoot(cwd: string): string | null {
  let current = path.resolve(cwd);
  const root = path.parse(current).root;
  while (true) {
    const marker = path.join(current, ".oaiimage");
    if (fs.existsSync(marker)) {
      return current;
    }
    if (current === root) {
      return null;
    }
    current = path.dirname(current);
  }
}

export function projectConfigPath(projectRoot: string): string {
  return path.join(projectRoot, ".oaiimage", "config.yaml");
}

export function sessionsDir(projectRoot: string): string {
  return path.join(projectRoot, ".oaiimage", "sessions");
}

export function usageLedgerPath(projectRoot: string): string {
  return path.join(projectRoot, ".oaiimage", "usage.json");
}
