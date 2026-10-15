import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { FileSessionStore } from "../../src/services/sessions/store.js";
import { nextSessionCall } from "../../src/services/sessions/plan.js";

describe("nextSessionCall", () => {
  it("chooses edit fallback without response id", () => {
    expect(
      nextSessionCall({
        apiMode: "responses",
        prompt: "x",
        parent: {
          id: "i1",
          createdAt: "",
          prompt: "",
          revisedPrompt: null,
          model: "gpt-image-2.5-flare",
          parameters: {},
          cost: { kind: "unknown", currency: "USD", lines: [] },
          outputPaths: ["a.png"],
          source: "fallback",
        },
      }),
    ).toEqual({ kind: "edit", source: "fallback", imagePath: "a.png" });
  });

  it("uses previous response id when present", () => {
    expect(
      nextSessionCall({
        apiMode: "responses",
        prompt: "x",
        parent: {
          id: "i1",
          createdAt: "",
          prompt: "",
          revisedPrompt: null,
          model: "gpt-image-2.5-flare",
          parameters: {},
          cost: { kind: "unknown", currency: "USD", lines: [] },
          outputPaths: ["a.png"],
          responseId: "resp_1",
          source: "api",
        },
      }),
    ).toEqual({
      kind: "edit",
      source: "api",
      imagePath: "a.png",
      previousResponseId: "resp_1",
    });
  });
});

describe("session store", () => {
  it("stores iterations and keeps history", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sess-"));
    const store = new FileSessionStore(dir);
    const session = await store.create({ apiMode: "responses", imageModel: "gpt-image-2.5-flare" });
    await store.addIteration(session.id, {
      id: "i1",
      createdAt: new Date().toISOString(),
      prompt: "first",
      revisedPrompt: null,
      model: "gpt-image-2.5-flare",
      parameters: {},
      cost: { kind: "unknown", currency: "USD", lines: [] },
      outputPaths: ["a.png"],
      source: "fallback",
    });
    const loaded = await store.get(session.id);
    expect(loaded?.iterations).toHaveLength(1);
    expect(loaded?.iterations[0]?.source).toBe("fallback");
  });
});
