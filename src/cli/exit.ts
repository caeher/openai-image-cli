import { exitCodeForError } from "../core/errors/errors.js";

export function resolveExitCode(error: unknown): number {
  return exitCodeForError(error);
}
