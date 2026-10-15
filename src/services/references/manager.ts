import fs from "node:fs";
import path from "node:path";
import type { ImageModelConfig } from "../../core/entities/model.js";
import type { ImageReference, ReferenceRole } from "../../core/entities/request.js";
import { CapabilityError, UsageError } from "../../core/errors/errors.js";
import type { ReferenceManager } from "../../core/interfaces/services.js";
import { sniff } from "../../media/sniff.js";

const MAX_REFERENCE_BYTES = 50 * 1024 * 1024;

const VALID_ROLES: ReferenceRole[] = [
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

export class ReferenceManagerService implements ReferenceManager {
  async validate(
    paths: string[],
    roles: string[],
    model: ImageModelConfig,
  ): Promise<ImageReference[]> {
    if (paths.length > model.capabilities.maxReferences) {
      throw new CapabilityError(`Too many references (max ${model.capabilities.maxReferences})`, {
        model: model.id,
        field: "references",
      });
    }
    const refs: ImageReference[] = [];
    for (let i = 0; i < paths.length; i++) {
      const p = paths[i]!;
      if (p.startsWith("http://") || p.startsWith("https://")) {
        throw new CapabilityError("Remote image URLs are disabled", { field: "image" });
      }
      const stat = await fs.promises.stat(p);
      if (stat.size > MAX_REFERENCE_BYTES) {
        throw new UsageError(`Reference file exceeds 50 MB: ${p}`);
      }
      const buf = await fs.promises.readFile(p);
      try {
        sniff(buf.slice(0, 12));
      } catch {
        throw new UsageError(`Invalid reference image magic bytes: ${p}`);
      }
      const role = (roles[i] ?? "subject") as ReferenceRole;
      if (!VALID_ROLES.includes(role)) {
        throw new UsageError(`Unknown reference role: ${role}`);
      }
      refs.push({ path: path.resolve(p), role });
    }
    return refs;
  }

  formatForPrompt(refs: ImageReference[]): string {
    return refs
      .map((ref, index) => {
        const note = ref.note ? ` ${ref.note}` : "";
        return `Imagen ${index + 1}: papel ${ref.role}.${note}`;
      })
      .join("\n");
  }
}
