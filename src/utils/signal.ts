import { CancelledError } from "../core/errors/errors.js";

export function createAbortControllerFromProcess(): AbortController {
  const controller = new AbortController();
  const onSignal = () => {
    controller.abort();
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  return controller;
}

export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new CancelledError();
  }
}
