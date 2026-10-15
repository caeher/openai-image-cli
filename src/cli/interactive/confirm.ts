import type { CostReport } from "../../core/entities/cost.js";

export interface ConfirmCostOptions {
  interactive: boolean;
  json: boolean;
  confirmCost: boolean;
}

export type CostPrompt = (message: string) => Promise<boolean>;

export async function confirmCost(
  report: CostReport,
  options: ConfirmCostOptions,
  ask?: CostPrompt,
): Promise<void> {
  if (options.json || !options.interactive) {
    return;
  }
  const hasUnknown = report.lines.some((line) => line.kind === "unknown") || report.kind === "unknown";
  if (!hasUnknown || options.confirmCost) {
    return;
  }
  if (!ask) {
    return;
  }
  const ok = await ask("Estimated cost is unknown. Continue?");
  if (!ok) {
    throw new Error("Cost confirmation declined");
  }
}
