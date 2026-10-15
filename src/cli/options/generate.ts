import type { EffectiveConfig } from "../../config/schema.js";
import type { ImageGenerationRequest } from "../../core/entities/request.js";

export interface GenerateCommandOptions {
  prompt?: string;
  promptFile?: string;
  model?: string;
  size?: string;
  quality?: string;
  format?: string;
  compression?: string;
  background?: string;
  count?: string;
  output?: string;
  dir?: string;
  stream?: boolean;
  partials?: string;
  savePartials?: boolean;
  dryRun?: boolean;
  apiMode?: string;
  responsesModel?: string;
  force?: boolean;
}

export function buildGenerationRequest(
  opts: GenerateCommandOptions,
  effective: EffectiveConfig,
  prompt: string,
): ImageGenerationRequest {
  const format = (opts.format ?? effective.format) as ImageGenerationRequest["format"];
  const request: ImageGenerationRequest = {
    prompt,
    model: opts.model ?? effective.model,
    apiMode: (opts.apiMode ?? effective.apiMode) as ImageGenerationRequest["apiMode"],
    responsesModel: opts.responsesModel ?? effective.responsesModel,
    size: opts.size ?? effective.size,
    quality: (opts.quality ?? effective.quality) as ImageGenerationRequest["quality"],
    format,
    background: (opts.background ?? effective.background) as ImageGenerationRequest["background"],
    count: Number(opts.count ?? effective.count),
    stream: Boolean(opts.stream),
    partialImages: Number(opts.partials ?? 0),
    savePartials: Boolean(opts.savePartials),
    directory: opts.dir ?? effective.outputDir,
    dryRun: Boolean(opts.dryRun),
    ...(opts.output ? { output: opts.output } : {}),
    ...(opts.force ? { force: true } : {}),
  };
  if (opts.compression !== undefined && opts.compression !== "") {
    const n = Number(opts.compression);
    if (format === "jpeg" || format === "webp") {
      request.compression = n;
    }
  }
  return request;
}

export function registerGenerateOptions(cmd: import("commander").Command): import("commander").Command {
  return cmd
    .option("--prompt <text>")
    .option("--prompt-file <path>")
    .option("--model <id>")
    .option("--size <size>")
    .option("--quality <quality>")
    .option("--format <format>")
    .option("--compression <n>")
    .option("--background <mode>")
    .option("--count <n>")
    .option("--output <path>")
    .option("--dir <path>")
    .option("--stream")
    .option("--partials <n>")
    .option("--save-partials")
    .option("--dry-run")
    .option("--stdin")
    .option("--max-cost <usd>")
    .option("--confirm-cost")
    .option("--budget <usd>")
    .option("--max-requests <n>")
    .option("--api-mode <mode>")
    .option("--responses-model <id>")
    .option("--force");
}
