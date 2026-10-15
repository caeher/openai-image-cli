import { describe, expect, it } from "vitest";
import {
  ApiError,
  AppError,
  AuthError,
  BudgetError,
  CancelledError,
  CapabilityError,
  ConfigError,
  ModerationError,
  PartialFailureError,
  PathSecurityError,
  UsageError,
  exitCodeForError,
} from "../../src/core/errors/errors.js";

describe("errors", () => {
  it("maps exit codes", () => {
    expect(exitCodeForError(new AppError("x"))).toBe(1);
    expect(exitCodeForError(new UsageError("x"))).toBe(2);
    expect(exitCodeForError(new ConfigError("x"))).toBe(3);
    expect(exitCodeForError(new AuthError("x"))).toBe(4);
    expect(exitCodeForError(new ApiError("x", { retryable: false }))).toBe(5);
    expect(exitCodeForError(new ModerationError("x"))).toBe(6);
    expect(exitCodeForError(new BudgetError("x"))).toBe(7);
    expect(exitCodeForError(new CancelledError())).toBe(8);
    expect(exitCodeForError(new PartialFailureError("x", [], []))).toBe(9);
    expect(exitCodeForError(new PathSecurityError("x"))).toBe(10);
    expect(exitCodeForError(new CapabilityError("x"))).toBe(11);
  });
});
