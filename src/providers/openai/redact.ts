export function redactSecrets(value: unknown, secrets: string[]): unknown {
  if (secrets.length === 0) {
    return value;
  }
  if (typeof value === "string") {
    let out = value;
    for (const secret of secrets) {
      if (secret) {
        out = out.split(secret).join("[redacted]");
      }
    }
    out = out.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item, secrets));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = redactSecrets(val, secrets);
    }
    return result;
  }
  return value;
}
