import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { StructuredPrompt } from "../../core/interfaces/prompt.js";
import type { PromptBuildInput } from "../../core/interfaces/prompt.js";

export interface PromptTextResolver {
  create(fields: StructuredPrompt): string;
  build(input: PromptBuildInput): { text: string };
}

export async function readStdinPrompt(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function resolvePromptText(
  opts: { prompt?: string; promptFile?: string; stdin?: boolean },
  engine: PromptTextResolver,
): string {
  if (opts.prompt) {
    if (opts.promptFile) {
      console.error("Warning: --prompt overrides --prompt-file");
    }
    return opts.prompt;
  }
  if (opts.promptFile) {
    const ext = path.extname(opts.promptFile).toLowerCase();
    const raw = fs.readFileSync(opts.promptFile, "utf8");
    if (ext === ".json") {
      const parsed = JSON.parse(raw) as StructuredPrompt | { fields?: StructuredPrompt };
      const fields = "fields" in parsed && parsed.fields ? parsed.fields : (parsed as StructuredPrompt);
      return engine.create(fields);
    }
    if (ext === ".yaml" || ext === ".yml") {
      const parsed = YAML.parse(raw) as StructuredPrompt | { fields?: StructuredPrompt };
      const fields = parsed && typeof parsed === "object" && "fields" in parsed && parsed.fields
        ? parsed.fields
        : (parsed as StructuredPrompt);
      return engine.create(fields ?? {});
    }
    return raw;
  }
  return "";
}
