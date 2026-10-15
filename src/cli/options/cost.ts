import type { BudgetPolicy } from "../../core/entities/cost.js";
import { BudgetError } from "../../core/errors/errors.js";

export interface CostFlagInput {
  maxCost?: string;
  budget?: string;
  maxRequests?: string;
  confirmCost?: boolean;
  interactive: boolean;
}

export function budgetFromFlags(input: CostFlagInput): BudgetPolicy {
  const policy: BudgetPolicy = {
    interactive: input.interactive,
    confirmCost: Boolean(input.confirmCost),
  };
  if (input.maxCost !== undefined && input.maxCost !== "") {
    policy.maxCostUsd = Number(input.maxCost);
  }
  if (input.budget !== undefined && input.budget !== "") {
    policy.budgetUsd = Number(input.budget);
  }
  if (input.maxRequests !== undefined && input.maxRequests !== "") {
    policy.maxRequests = Number(input.maxRequests);
  }
  return policy;
}

export function assertRequestCountWithinBudget(
  count: number,
  policy: BudgetPolicy,
  dryRun: boolean,
): void {
  if (dryRun) {
    return;
  }
  if (policy.maxRequests !== undefined && count > policy.maxRequests) {
    throw new BudgetError(
      `Request count ${count} exceeds --max-requests limit ${policy.maxRequests}`,
    );
  }
}
