import {
  ApiError,
  AuthError,
  ModerationError,
  UsageError,
} from "../../core/errors/errors.js";

interface SdkLikeError {
  status?: number;
  code?: string;
  type?: string;
  message?: string;
  requestID?: string;
}

export function mapOpenAiError(error: unknown): Error {
  const e = error as SdkLikeError;
  const status = e.status;
  const code = e.code;
  const type = e.type;
  const requestId = e.requestID;
  const message = e.message ?? "OpenAI API error";

  if (status === 401) {
    return new AuthError(message);
  }
  if (code === "moderation_blocked" || type === "image_generation_user_error") {
    return new ModerationError(message);
  }
  if (status === 429 || (status !== undefined && status >= 500)) {
    return new ApiError(message, {
      retryable: true,
      ...(requestId !== undefined ? { requestId } : {}),
    });
  }
  if (code === "insufficient_quota") {
    return new ApiError(message, {
      retryable: false,
      ...(requestId !== undefined ? { requestId } : {}),
    });
  }
  if (status === 400 || status === 403) {
    return new UsageError(message);
  }
  return new ApiError(message, {
    retryable: false,
    ...(requestId !== undefined ? { requestId } : {}),
  });
}
