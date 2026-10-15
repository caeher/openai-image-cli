export type CostLineKind = "amount" | "range" | "unknown";

export interface CostLineAmount {
  kind: "amount";
  usd: string;
  label?: string;
  estimate?: boolean;
}

export interface CostLineRange {
  kind: "range";
  minUsd: string;
  maxUsd: string;
  label?: string;
}

export interface CostLineUnknown {
  kind: "unknown";
  reason: string;
  label?: string;
}

export type CostLine = CostLineAmount | CostLineRange | CostLineUnknown;

export type CostReportKind = "quote" | "actual" | "mixed" | "unknown";

export interface CostReport {
  kind: CostReportKind;
  currency: "USD";
  lines: CostLine[];
  total?: CostLine;
}

export interface BudgetPolicy {
  maxCostUsd?: number;
  maxRequests?: number;
  budgetUsd?: number;
  sessionBudgetUsd?: number;
  projectBudgetUsd?: number;
  interactive: boolean;
  confirmCost: boolean;
}

export interface CostContext {
  model: string;
  apiMode: "images" | "responses";
  responsesModel?: string;
  processing: "standard" | "batch";
}
