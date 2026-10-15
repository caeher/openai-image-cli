import type { EffectiveConfig } from "../../config/schema.js";
import type { ImageEditRequest, ImageReference, ReferenceRole } from "../../core/entities/request.js";
import { UsageError } from "../../core/errors/errors.js";
import {
  buildGenerationRequest,
  registerGenerateOptions,
  type GenerateCommandOptions,
} from "./generate.js";

export interface EditCommandOptions extends GenerateCommandOptions {
  image?: string | string[];
  preserve?: string | string[];
  mask?: string;
  references?: string | string[];
  role?: string;
  inputFidelity?: string;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function parseReferenceEntry(entry: string): { path: string; role: ReferenceRole } {
  const idx = entry.lastIndexOf(":");
  if (idx <= 0) {
    return { path: entry, role: "subject" };
  }
  const path = entry.slice(0, idx);
  const role = entry.slice(idx + 1) as ReferenceRole;
  return { path, role };
}

export function collectImageReferences(opts: EditCommandOptions): ImageReference[] {
  const refs: ImageReference[] = [];
  for (const entry of asArray(opts.references)) {
    const { path, role } = parseReferenceEntry(entry);
    refs.push({ path, role });
  }
  const images = asArray(opts.image);
  if (images.length === 1 && opts.role) {
    refs.push({ path: images[0]!, role: opts.role as ReferenceRole });
  } else {
    for (const img of images) {
      refs.push({ path: img, role: "subject" });
    }
  }
  return refs;
}

export function buildEditRequest(
  opts: EditCommandOptions,
  effective: EffectiveConfig,
  prompt: string,
): ImageEditRequest {
  const base = buildGenerationRequest(opts, effective, prompt);
  const preserve = asArray(opts.preserve);
  const images = collectImageReferences(opts);
  for (const ref of images) {
    const validRoles: ReferenceRole[] = [
      "subject",
      "face",
      "clothing",
      "object",
      "background",
      "composition",
      "color-palette",
      "lighting",
      "style",
      "material",
      "texture",
    ];
    if (!validRoles.includes(ref.role)) {
      throw new UsageError(`Unknown reference role: ${ref.role}`);
    }
  }
  const edit: ImageEditRequest = {
    ...base,
    images,
    preserve,
    ...(opts.mask ? { maskPath: opts.mask } : {}),
  };
  if (opts.inputFidelity) {
    const fidelity = opts.inputFidelity as NonNullable<ImageEditRequest["inputFidelity"]>;
    edit.inputFidelity = fidelity;
  }
  return edit;
}

function collectString(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export function registerBaseEditOptions(cmd: import("commander").Command): import("commander").Command {
  return registerGenerateOptions(cmd)
    .option("--image <path>", "Input image (repeatable)", collectString, [])
    .option("--preserve <text>", "Preserve instruction (repeatable)", collectString, [])
    .option("--references <path:role>", "Reference path:role (repeatable)", collectString, [])
    .option("--role <role>", "Role when a single --image is used")
    .option("--input-fidelity <level>");
}
