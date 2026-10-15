import type { ImageEditRequest, ImageGenerationRequest } from "./request.js";
import type { ImageGenerationResult } from "./result.js";

export interface ImageJob {
  id: string;
  projectId?: string;
  state: "pending" | "running" | "succeeded" | "failed" | "cancelled" | "skipped";
  request: ImageGenerationRequest | ImageEditRequest;
  result?: ImageGenerationResult;
  errorCode?: number;
  createdAt: string;
  updatedAt: string;
}
