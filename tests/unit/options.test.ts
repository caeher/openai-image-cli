import { describe, expect, it } from "vitest";
import { PRODUCT_DEFAULTS } from "../../src/config/defaults.js";
import { buildGenerationRequest } from "../../src/cli/options/generate.js";
import { buildEditRequest, collectImageReferences } from "../../src/cli/options/edit.js";
import { budgetFromFlags, assertRequestCountWithinBudget } from "../../src/cli/options/cost.js";
import { BudgetError } from "../../src/core/errors/errors.js";

const effective = { ...PRODUCT_DEFAULTS, sources: {} as Record<string, "default"> };

describe("cli options", () => {
  it("builds generation request without unknown provider keys", () => {
    const request = buildGenerationRequest(
      {
        prompt: "hi",
        compression: "40",
        format: "jpeg",
        savePartials: true,
        count: "2",
      },
      effective,
      "hi",
    );
    expect(request.compression).toBe(40);
    expect(request.savePartials).toBe(true);
    expect(request.count).toBe(2);
    expect(Object.keys(request)).not.toContain("stdin");
    expect(Object.keys(request)).not.toContain("maxRequests");
  });

  it("omits compression for png", () => {
    const request = buildGenerationRequest(
      { compression: "40", format: "png" },
      effective,
      "x",
    );
    expect(request.compression).toBeUndefined();
  });

  it("collects preserve and images for edit", () => {
    const request = buildEditRequest(
      {
        preserve: ["a", "b"],
        image: ["one.png", "two.png"],
        references: ["ref.png:background"],
      },
      effective,
      "edit me",
    );
    expect(request.preserve).toEqual(["a", "b"]);
    expect(request.images).toHaveLength(3);
    expect(collectImageReferences({ references: ["x.png:lighting"] })[0]?.role).toBe("lighting");
  });

  it("budgetFromFlags maps max-requests", () => {
    const policy = budgetFromFlags({
      interactive: false,
      maxRequests: "1",
      confirmCost: false,
    });
    expect(policy.maxRequests).toBe(1);
    expect(() => assertRequestCountWithinBudget(3, policy, false)).toThrow(BudgetError);
    expect(() => assertRequestCountWithinBudget(3, policy, true)).not.toThrow();
  });
});
