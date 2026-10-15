import type { ApiMode } from "./primitives.js";
import type { CostReport } from "./cost.js";

export interface ImageSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  apiMode: ApiMode;
  imageModel: string;
  responsesModel?: string;
  iterations: SessionIteration[];
}

export interface SessionIteration {
  id: string;
  parentId?: string;
  createdAt: string;
  prompt: string;
  revisedPrompt: string | null;
  responseId?: string;
  imageCallId?: string;
  model: string;
  parameters: Record<string, string | number | boolean | null>;
  cost: CostReport;
  outputPaths: string[];
  source: "api" | "fallback";
}
