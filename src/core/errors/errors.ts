import {
  EXIT_API,
  EXIT_APP,
  EXIT_AUTH,
  EXIT_BUDGET,
  EXIT_CANCELLED,
  EXIT_CAPABILITY,
  EXIT_CONFIG,
  EXIT_MODERATION,
  EXIT_PARTIAL,
  EXIT_PATH,
  EXIT_USAGE,
} from "./codes.js";

export class AppError extends Error {
  readonly exitCode = EXIT_APP;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AppError";
  }
}

export class UsageError extends Error {
  readonly exitCode = EXIT_USAGE;
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

export class ConfigError extends Error {
  readonly exitCode = EXIT_CONFIG;
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class AuthError extends Error {
  readonly exitCode = EXIT_AUTH;
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends Error {
  readonly exitCode = EXIT_API;
  readonly retryable: boolean;
  readonly requestId?: string;
  constructor(message: string, options: { retryable: boolean; requestId?: string }) {
    super(message);
    this.name = "ApiError";
    this.retryable = options.retryable;
    if (options.requestId !== undefined) {
      this.requestId = options.requestId;
    }
  }
}

export class ModerationError extends Error {
  readonly exitCode = EXIT_MODERATION;
  readonly moderationDetails?: unknown;
  constructor(message: string, moderationDetails?: unknown) {
    super(message);
    this.name = "ModerationError";
    this.moderationDetails = moderationDetails;
  }
}

export class BudgetError extends Error {
  readonly exitCode = EXIT_BUDGET;
  constructor(message: string) {
    super(message);
    this.name = "BudgetError";
  }
}

export class CancelledError extends Error {
  readonly exitCode = EXIT_CANCELLED;
  constructor(message = "Operation cancelled") {
    super(message);
    this.name = "CancelledError";
  }
}

export class PartialFailureError extends Error {
  readonly exitCode = EXIT_PARTIAL;
  readonly successes: unknown[];
  readonly failures: unknown[];
  constructor(message: string, successes: unknown[], failures: unknown[]) {
    super(message);
    this.name = "PartialFailureError";
    this.successes = successes;
    this.failures = failures;
  }
}

export class PathSecurityError extends Error {
  readonly exitCode = EXIT_PATH;
  constructor(message: string) {
    super(message);
    this.name = "PathSecurityError";
  }
}

export class CapabilityError extends Error {
  readonly exitCode = EXIT_CAPABILITY;
  readonly model?: string;
  readonly field?: string;
  constructor(message: string, options?: { model?: string; field?: string }) {
    super(message);
    this.name = "CapabilityError";
    if (options?.model !== undefined) {
      this.model = options.model;
    }
    if (options?.field !== undefined) {
      this.field = options.field;
    }
  }
}

export function exitCodeForError(error: unknown): number {
  if (error && typeof error === "object" && "exitCode" in error) {
    const code = (error as { exitCode: unknown }).exitCode;
    if (typeof code === "number") {
      return code;
    }
  }
  return EXIT_APP;
}
