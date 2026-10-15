import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sniff } from "../../src/media/sniff.js";
import { assertInside } from "../../src/media/path-security.js";
import { redactSecrets } from "../../src/providers/openai/redact.js";
import { writeAtomic } from "../../src/media/atomic.js";
import { retry } from "../../src/utils/retry.js";
import { ApiError } from "../../src/core/errors/errors.js";

describe("security utilities", () => {
  it("sniffs png jpeg webp and rejects gif", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(sniff(png)).toBe("png");
    expect(sniff(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe("jpeg");
    const webp = Buffer.alloc(12);
    webp.write("RIFF", 0);
    webp.write("WEBP", 8);
    expect(sniff(webp)).toBe("webp");
    expect(() => sniff(Buffer.from("GIF89a"))).toThrow();
  });

  it("rejects path traversal", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "oai-"));
    expect(() => assertInside(root, path.join(root, "..", "etc", "passwd"))).toThrow();
  });

  it("redacts secrets", () => {
    const out = redactSecrets({ msg: "hello sk-secret-world" }, ["secret"]);
    expect(JSON.stringify(out)).not.toContain("secret");
  });

  it("writeAtomic leaves final file", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oai-"));
    const target = path.join(dir, "out.bin");
    await writeAtomic(target, Buffer.from("ok"));
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readdirSync(dir).some((f) => f.endsWith(".tmp"))).toBe(false);
  });

  it("retry respects retryable flag and abort", async () => {
    let calls = 0;
    await expect(
      retry(
        async () => {
          calls += 1;
          throw new ApiError("fail", { retryable: false });
        },
        { attempts: 3, signal: new AbortController().signal },
      ),
    ).rejects.toThrow();
    expect(calls).toBe(1);

    calls = 0;
    await expect(
      retry(
        async () => {
          calls += 1;
          throw new ApiError("fail", { retryable: true });
        },
        { attempts: 3, signal: new AbortController().signal },
      ),
    ).rejects.toThrow();
    expect(calls).toBe(3);

    const controller = new AbortController();
    controller.abort();
    calls = 0;
    await expect(
      retry(
        async () => {
          calls += 1;
          throw new ApiError("fail", { retryable: true });
        },
        { attempts: 3, signal: controller.signal },
      ),
    ).rejects.toThrow();
    expect(calls).toBe(1);
  });
});
