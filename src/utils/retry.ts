import { throwIfAborted } from "./signal.js";

export interface RetryOptions {
  attempts: number;
  signal: AbortSignal;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

function isRetryable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "retryable" in error &&
    (error as { retryable: boolean }).retryable === true
  );
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("aborted"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("aborted"));
      },
      { once: true },
    );
  });
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const base = options.baseDelayMs ?? 500;
  const max = options.maxDelayMs ?? 8000;
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === options.attempts) {
        throw error;
      }
      throwIfAborted(options.signal);
      const jitter = Math.random() * 0.25 + 0.75;
      const wait = Math.min(base * 2 ** (attempt - 1) * jitter, max);
      try {
        await delay(wait, options.signal);
      } catch {
        throw error;
      }
    }
  }
  throw lastError;
}
