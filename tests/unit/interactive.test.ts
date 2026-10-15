import { describe, expect, it, vi } from "vitest";
import { confirmCost } from "../../src/cli/interactive/confirm.js";
import { promptWizard } from "../../src/cli/interactive/wizard.js";
import { PromptEngine } from "../../src/services/prompting/engine.js";
import { UsageError } from "../../src/core/errors/errors.js";

describe("interactive helpers", () => {
  it("confirmCost skips ask when json", async () => {
    const ask = vi.fn();
    await confirmCost(
      { kind: "unknown", currency: "USD", lines: [{ kind: "unknown", reason: "x" }] },
      { interactive: true, json: true, confirmCost: false },
      ask,
    );
    expect(ask).not.toHaveBeenCalled();
  });

  it("promptWizard with injected ask builds subject line", async () => {
    const fields = await promptWizard({
      json: false,
      interactive: true,
      ask: async () => ({ subject: "mesa" }),
    });
    const text = new PromptEngine().create(fields);
    expect(text).toContain("Sujeto: mesa");
  });

  it("promptWizard with json throws usage error", async () => {
    await expect(
      promptWizard({ json: true, interactive: true, ask: async () => ({}) }),
    ).rejects.toBeInstanceOf(UsageError);
  });
});
