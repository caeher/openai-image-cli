import type { StructuredPrompt } from "../../core/interfaces/prompt.js";
import { UsageError } from "../../core/errors/errors.js";

export type WizardAsk = (fields: string[]) => Promise<Record<string, string>>;

const WIZARD_FIELDS = ["subject", "description", "environment"] as const;

export async function promptWizard(options: {
  json: boolean;
  interactive: boolean;
  ask?: WizardAsk;
  initial?: StructuredPrompt;
}): Promise<StructuredPrompt> {
  if (options.json) {
    throw new UsageError("prompt create requires fields when --json is set");
  }
  if (!options.interactive) {
    throw new UsageError("prompt create requires fields in non-interactive mode");
  }
  const ask = options.ask;
  if (!ask) {
    throw new UsageError("prompt create requires fields");
  }
  const answers = await ask([...WIZARD_FIELDS]);
  return { ...options.initial, ...answers };
}
