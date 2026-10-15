import type { SessionIteration } from "../../core/entities/session.js";

export type SessionEditPlan =
  | { kind: "edit"; source: "fallback" | "api"; imagePath: string; previousResponseId?: string }
  | { kind: "generate" };

export function nextSessionCall(input: {
  apiMode: "images" | "responses";
  parent?: SessionIteration;
  prompt: string;
  imagePath?: string;
}): SessionEditPlan {
  void input.prompt;
  const parent = input.parent;
  const imagePath = input.imagePath ?? parent?.outputPaths[0];
  const previousResponseId =
    input.apiMode === "responses" && parent?.responseId ? parent.responseId : undefined;

  if (imagePath || previousResponseId) {
    if (!imagePath) {
      return { kind: "generate" };
    }
    return {
      kind: "edit",
      source: previousResponseId ? "api" : "fallback",
      imagePath,
      ...(previousResponseId ? { previousResponseId } : {}),
    };
  }
  return { kind: "generate" };
}
