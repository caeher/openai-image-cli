import { describe, expect, it } from "vitest";
import { PROMPT_TEMPLATES } from "../../src/templates/prompt-templates.js";
import { STYLE_TEMPLATES } from "../../src/templates/style-templates.js";
import { PromptEngine } from "../../src/services/prompting/engine.js";
import { ModelRegistry } from "../../src/services/models/registry.js";
import { CapabilityError } from "../../src/core/errors/errors.js";

describe("prompt engine", () => {
  const engine = new PromptEngine();
  const model = new ModelRegistry().resolve("gpt-image-2.5-flare");

  it("has 24 product templates", () => {
    expect(PROMPT_TEMPLATES).toHaveLength(24);
  });

  it("has 20 style phrases", () => {
    expect(Object.keys(STYLE_TEMPLATES)).toHaveLength(20);
  });

  it("orders sections", () => {
    const text = engine.create({ objective: "A", subject: "B" });
    expect(text.indexOf("Objetivo")).toBeLessThan(text.indexOf("Sujeto"));
  });

  it("validates length", () => {
    const validation = engine.validate("x".repeat(32_001), model);
    expect(validation.ok).toBe(false);
  });

  it("optimize without model throws capability error", async () => {
    await expect(engine.optimize("hi", "", new AbortController().signal)).rejects.toBeInstanceOf(
      CapabilityError,
    );
  });
});
