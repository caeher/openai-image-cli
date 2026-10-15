import { describe, expect, it } from "vitest";
import { CostEstimatorService } from "../../src/services/costs/estimator.js";
import { ModelRegistry } from "../../src/services/models/registry.js";
import { BudgetError } from "../../src/core/errors/errors.js";

describe("cost estimator", () => {
  const models = new ModelRegistry();
  const estimator = new CostEstimatorService(models);

  const base = {
    prompt: "hi",
    apiMode: "images" as const,
    format: "png" as const,
    background: "auto" as const,
    count: 1,
    stream: false,
    partialImages: 0,
    savePartials: false,
    directory: "./output",
    dryRun: true,
  };

  it("1.5 low 1024 has output 0.009 and unknown input", () => {
    const report = estimator.estimate({
      ...base,
      model: "gpt-image-1.5",
      size: "1024x1024",
      quality: "low",
    });
    const out = report.lines.find((l) => l.label === "imageOutput");
    expect(out?.kind).toBe("amount");
    if (out?.kind === "amount") {
      expect(out.usd).toBe("0.009000");
    }
    expect(report.lines.some((l) => l.kind === "unknown" && l.label === "imageInput")).toBe(true);
  });

  it("1.5 quality auto fixed size uses three qualities range", () => {
    const report = estimator.estimate({
      ...base,
      model: "gpt-image-1.5",
      size: "1024x1024",
      quality: "auto",
    });
    const out = report.lines.find((l) => l.label === "imageOutput");
    expect(out?.kind).toBe("range");
  });

  it("sunburst has no per-image amount", () => {
    const report = estimator.estimate({
      ...base,
      model: "gpt-image-2.5-flare",
      size: "1024x1024",
      quality: "low",
    });
    expect(report.kind).toBe("unknown");
  });

  it("token output estimate for 100 tokens", () => {
    const report = estimator.fromUsage(
      { inputTokens: 0, outputTokens: 100, totalTokens: 100, source: "provider", outputImageTokens: 100 },
      { model: "gpt-image-2.5-flare", apiMode: "images", processing: "standard" },
    );
    const line = report.lines[0];
    expect(line?.kind).toBe("amount");
    if (line?.kind === "amount") {
      expect(line.usd).toBe("0.003000");
    }
  });

  it("unknown requires confirm in non-interactive", () => {
    const report = estimator.estimate({
      ...base,
      model: "gpt-image-2.5-flare",
      size: "auto",
      quality: "auto",
    });
    expect(() =>
      estimator.assertWithinBudget(report, { interactive: false, confirmCost: false }),
    ).toThrow(BudgetError);
  });
});
