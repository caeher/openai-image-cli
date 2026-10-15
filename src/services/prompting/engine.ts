import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { ImageModelConfig } from "../../core/entities/model.js";
import type {
  BuiltPrompt,
  PromptBuildInput,
  PromptTemplate,
  PromptValidation,
  StructuredPrompt,
  TextOptimizer,
} from "../../core/interfaces/prompt.js";
import { CapabilityError, UsageError } from "../../core/errors/errors.js";
import { PROMPT_TEMPLATES } from "../../templates/prompt-templates.js";
import { STYLE_TEMPLATES } from "../../templates/style-templates.js";

const SECTIONS: Array<{ key: keyof StructuredPrompt; label: string }> = [
  { key: "objective", label: "Objetivo" },
  { key: "subject", label: "Sujeto" },
  { key: "description", label: "Descripción" },
  { key: "environment", label: "Entorno" },
  { key: "composition", label: "Composición" },
  { key: "cameraAngle", label: "Ángulo de cámara" },
  { key: "framing", label: "Encuadre" },
  { key: "perspective", label: "Perspectiva" },
  { key: "lighting", label: "Iluminación" },
  { key: "palette", label: "Paleta" },
  { key: "materials", label: "Materiales" },
  { key: "textures", label: "Texturas" },
  { key: "style", label: "Estilo" },
  { key: "mood", label: "Ánimo" },
  { key: "background", label: "Fondo" },
  { key: "detail", label: "Detalle" },
  { key: "textToRender", label: "Texto a renderizar" },
  { key: "references", label: "Referencias" },
  { key: "preserve", label: "Conservar" },
  { key: "modify", label: "Modificar" },
  { key: "avoid", label: "Evitar" },
  { key: "constraints", label: "Restricciones" },
];

function normalizeVarKey(key: string): keyof StructuredPrompt | null {
  const normalized = key.replace(/-/g, "").toLowerCase();
  const map: Record<string, keyof StructuredPrompt> = {
    objective: "objective",
    objetivo: "objective",
    palette: "palette",
    colorpalette: "palette",
  };
  return map[normalized] ?? (SECTIONS.find((s) => s.key === key)?.key ?? null);
}

export class PromptEngine {
  constructor(private readonly optimizer?: TextOptimizer) {}

  create(fields: StructuredPrompt): string {
    const lines: string[] = [];
    for (const section of SECTIONS) {
      const value = fields[section.key];
      if (value && value.trim()) {
        lines.push(`${section.label}: ${value.trim()}`);
      }
    }
    return lines.join("\n");
  }

  build(input: PromptBuildInput): BuiltPrompt {
    const fields = { ...input.fields };
    if (input.templateId) {
      const template = PROMPT_TEMPLATES.find((t) => t.id === input.templateId);
      if (!template) {
        throw new UsageError(`Unknown prompt template: ${input.templateId}`);
      }
      fields.objective = fields.objective ?? template.defaultObjective;
    }
    if (input.styleId) {
      const phrase = STYLE_TEMPLATES[input.styleId];
      if (!phrase) {
        throw new UsageError(`Unknown style template: ${input.styleId}`);
      }
      fields.style = phrase;
    }
    if (input.vars) {
      for (const [key, value] of Object.entries(input.vars)) {
        const fieldKey = normalizeVarKey(key);
        if (!fieldKey) {
          throw new UsageError(`Unknown template variable: ${key}`);
        }
        fields[fieldKey] = value;
      }
    }
    const text = this.create(fields);
    return { text, sections: text.split("\n") };
  }

  validate(prompt: string, model: ImageModelConfig): PromptValidation {
    void model;
    const errors: string[] = [];
    if (!prompt.trim()) {
      errors.push("Prompt is empty");
    }
    if (prompt.length > 32_000) {
      errors.push("Prompt exceeds 32000 characters");
    }
    return { ok: errors.length === 0, errors, length: prompt.length };
  }

  async optimize(
    prompt: string,
    model: string,
    signal: AbortSignal,
  ): Promise<{ original: string; optimized: string }> {
    if (!model) {
      throw new CapabilityError("optimize requires a model name");
    }
    if (!this.optimizer) {
      throw new CapabilityError("Text optimizer is not configured");
    }
    const optimized = await this.optimizer.optimize(prompt, model, signal);
    return { original: prompt, optimized };
  }

  listTemplates(): readonly PromptTemplate[] {
    return PROMPT_TEMPLATES;
  }

  async save(name: string, body: string): Promise<string> {
    const dir = path.join(os.homedir(), ".config", "oaiimage", "prompts");
    await fs.promises.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${name}.txt`);
    await fs.promises.writeFile(file, body, "utf8");
    return file;
  }
}
