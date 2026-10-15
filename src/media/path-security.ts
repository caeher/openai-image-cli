import fs from "node:fs";
import path from "node:path";
import { PathSecurityError } from "../core/errors/errors.js";

export function assertInside(root: string, candidate: string): string {
  const resolvedRoot = fs.realpathSync(path.resolve(root));
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new PathSecurityError(`Path escapes allowed root: ${candidate}`);
  }
  try {
    const real = fs.realpathSync(resolvedCandidate);
    const relReal = path.relative(resolvedRoot, real);
    if (relReal.startsWith("..") || path.isAbsolute(relReal)) {
      throw new PathSecurityError(`Symlink escapes allowed root: ${candidate}`);
    }
    return real;
  } catch (error) {
    if (error instanceof PathSecurityError) {
      throw error;
    }
    return resolvedCandidate;
  }
}
