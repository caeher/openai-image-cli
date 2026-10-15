import type { BudgetPolicy, CostContext, CostReport } from "../../core/entities/cost.js";
import type { ImageEditRequest, ImageGenerationRequest } from "../../core/entities/request.js";
import type { TokenUsage } from "../../core/entities/result.js";
import { BudgetError } from "../../core/errors/errors.js";
import type { ModelRegistry } from "../models/registry.js";
import { getPerImageUsd, listQualitiesForModel, sunburstOutputTokenRateUsd } from "./prices.js";
import { parseSize } from "../models/size.js";

function unknownLine(reason: string, label?: string) {
  return label
    ? { kind: "unknown" as const, reason, label }
    : { kind: "unknown" as const, reason };
}

function amountLine(usd: string, label?: string, estimate?: boolean) {
  return {
    kind: "amount" as const,
    usd,
    ...(label ? { label } : {}),
    ...(estimate ? { estimate } : {}),
  };
}

function rangeLine(minUsd: string, maxUsd: string, label?: string) {
  return label
    ? { kind: "range" as const, minUsd, maxUsd, label }
    : { kind: "range" as const, minUsd, maxUsd };
}

export class CostEstimatorService {
  constructor(private readonly models: ModelRegistry) {}

  estimate(request: ImageGenerationRequest | ImageEditRequest): CostReport {
    const lines = [];
    const model = this.models.get(request.model);
    const perImageTable = model?.pricing.perImageUsd;

    if (!perImageTable) {
      lines.push(
        unknownLine("no-per-image-price-published", "imageOutput"),
        unknownLine("input-tokens-depend-on-prompt-and-images", "imageInput"),
      );
      if (request.apiMode === "responses") {
        lines.push(unknownLine("responses-model-rate-not-loaded", "responsesModel"));
      }
      return { kind: "unknown", currency: "USD", lines, total: unknownLine("no-per-image-price-published") };
    }

    const size = request.size;
    let outputLine;
    if (request.quality === "auto") {
      const qualities = listQualitiesForModel(this.models, request.model, size);
      const amounts: number[] = [];
      for (const q of qualities) {
        const cell =
          size === "auto"
            ? Object.values(perImageTable[q] ?? {})[0]
            : perImageTable[q]?.[size];
        if (cell) {
          amounts.push(Number.parseFloat(cell));
        }
      }
      if (amounts.length) {
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);
        outputLine = rangeLine((min * request.count).toFixed(6), (max * request.count).toFixed(6), "imageOutput");
      } else {
        outputLine = unknownLine("no-price-for-quality-auto", "imageOutput");
      }
    } else {
      const unit = getPerImageUsd(this.models, request.model, request.quality, size);
      outputLine = unit
        ? amountLine((Number.parseFloat(unit) * request.count).toFixed(6), "imageOutput")
        : unknownLine("no-price-cell", "imageOutput");
    }

    lines.push(outputLine);
    lines.push(unknownLine("input-tokens-depend-on-prompt-and-images", "imageInput"));

    if (request.partialImages > 0) {
      const rate = Number.parseFloat(sunburstOutputTokenRateUsd()) / 1_000_000;
      const tokens = request.partialImages * 100;
      lines.push(
        amountLine((rate * tokens).toFixed(6), "partials", true),
      );
    }

    if (request.apiMode === "responses") {
      lines.push(unknownLine("responses-model-rate-not-loaded", "responsesModel"));
    }

    return {
      kind: "quote",
      currency: "USD",
      lines,
      total: outputLine,
    };
  }

  fromUsage(usage: TokenUsage, context: CostContext): CostReport {
    const model = this.models.get(context.model);
    const rates = model?.pricing.tokenRates?.[context.processing === "batch" ? "batch" : "standard"];
    const imageOutRate = rates?.image?.output;
    const lines = [];
    if (imageOutRate && usage.outputImageTokens !== undefined) {
      const usd = (Number.parseFloat(imageOutRate) / 1_000_000) * usage.outputImageTokens;
      lines.push(amountLine(usd.toFixed(6), "imageOutput"));
    } else if (usage.outputTokens) {
      const rate = sunburstOutputTokenRateUsd();
      const usd = (Number.parseFloat(rate) / 1_000_000) * usage.outputTokens;
      lines.push(amountLine(usd.toFixed(6), "imageOutput"));
    }
    return { kind: "actual", currency: "USD", lines };
  }

  assertWithinBudget(report: CostReport, budget: BudgetPolicy): void {
    if (!budget.interactive && !budget.confirmCost) {
      const hasUnknown = report.lines.some((l) => l.kind === "unknown");
      if (hasUnknown || report.kind === "unknown") {
        throw new BudgetError("Cost is unknown; use --confirm-cost in non-interactive mode");
      }
    }
    const max = budget.maxCostUsd ?? budget.budgetUsd;
    if (max === undefined) {
      return;
    }
    for (const line of report.lines) {
      if (line.kind === "amount" && Number.parseFloat(line.usd) > max) {
        throw new BudgetError(`Estimated cost ${line.usd} exceeds budget ${max}`);
      }
      if (line.kind === "range" && Number.parseFloat(line.maxUsd) > max) {
        throw new BudgetError(`Estimated cost up to ${line.maxUsd} exceeds budget ${max}`);
      }
    }
  }
}

export function isExperimentalCostNote(_modelId: string, size: string): boolean {
  if (size === "auto") {
    return false;
  }
  const { width, height } = parseSize(size);
  return width * height > 2560 * 1440;
}
