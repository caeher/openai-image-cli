import { describe, expect, it } from "vitest";
import { CapabilityRegistry } from "../../src/services/models/capabilities.js";
import { ModelRegistry } from "../../src/services/models/registry.js";
import { isExperimental, parseSize, validateFlexible } from "../../src/services/models/size.js";
import { UsageError } from "../../src/core/errors/errors.js";
import { CapabilityError } from "../../src/core/errors/errors.js";

const reg = new ModelRegistry();
const caps = new CapabilityRegistry(reg);

function req(overrides: Record<string, unknown> = {}) {
  return {
    prompt: "test",
    model: "gpt-image-2.5-flare",
    apiMode: "images" as const,
    size: "1024x1024",
    quality: "auto" as const,
    format: "png" as const,
    background: "auto" as const,
    count: 1,
    stream: false,
    partialImages: 0,
    savePartials: false,
    directory: "./output",
    dryRun: true,
    ...overrides,
  };
}

describe("capabilities", () => {
  it("sunburst accepts xhigh and max", () => {
    const model = reg.resolve("gpt-image-2.5-sunburst");
    caps.assertCompatible(model, req({ model: "gpt-image-2.5-sunburst", quality: "xhigh" }));
    caps.assertCompatible(model, req({ model: "gpt-image-2.5-sunburst", quality: "max" }));
  });

  it("rejects xhigh on gpt-image-2 family", () => {
    for (const id of ["gpt-image-2", "gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini", "chatgpt-image-latest"]) {
      expect(() =>
        caps.assertCompatible(reg.resolve(id), req({ model: id, quality: "xhigh" })),
      ).toThrow(CapabilityError);
    }
  });

  it("gpt-image-2 flexible sizes", () => {
    const model = reg.resolve("gpt-image-2");
    caps.assertCompatible(model, req({ model: "gpt-image-2", size: "1536x864" }));
    expect(caps.isExperimentalSize("gpt-image-2", "1536x864")).toBe(false);
    expect(() => validateFlexible(800, 800)).toThrow(UsageError);
    caps.assertCompatible(model, req({ model: "gpt-image-2", size: "1024x1024" }));
    caps.assertCompatible(model, req({ model: "gpt-image-2", size: "3840x2160" }));
    expect(caps.isExperimentalSize("gpt-image-2", "3840x2160")).toBe(true);
    expect(() => caps.assertCompatible(model, req({ model: "gpt-image-2", size: "3000x3000" }))).toThrow();
    expect(() => caps.assertCompatible(model, req({ model: "gpt-image-2", size: "1000x1000" }))).toThrow();
  });

  it("gpt-image-1.5 rejects custom size", () => {
    expect(() =>
      caps.assertCompatible(reg.resolve("gpt-image-1.5"), req({ model: "gpt-image-1.5", size: "1536x864" })),
    ).toThrow(CapabilityError);
  });

  it("mini rejects mask and transparent", () => {
    expect(() =>
      caps.assertCompatible(reg.resolve("gpt-image-1-mini"), {
        ...req({ model: "gpt-image-1-mini", background: "transparent", format: "png" }),
        images: [],
        preserve: [],
        maskPath: "m.png",
      }),
    ).toThrow(CapabilityError);
    expect(() =>
      caps.assertCompatible(reg.resolve("gpt-image-1-mini"), req({ model: "gpt-image-1-mini", background: "transparent" })),
    ).toThrow(CapabilityError);
  });

  it("chatgpt-image-latest mask yes transparent no", () => {
    caps.assertCompatible(reg.resolve("chatgpt-image-latest"), {
      ...req({ model: "chatgpt-image-latest" }),
      images: [{ path: "a.png", role: "subject" }],
      preserve: [],
      maskPath: "m.png",
    });
    expect(() =>
      caps.assertCompatible(reg.resolve("chatgpt-image-latest"), req({ model: "chatgpt-image-latest", background: "transparent" })),
    ).toThrow(CapabilityError);
  });

  it("gpt-image-2 transparency preview and jpeg rejection", () => {
    caps.assertCompatible(reg.resolve("gpt-image-2"), req({ model: "gpt-image-2", background: "transparent", format: "png" }));
    expect(() =>
      caps.assertCompatible(reg.resolve("gpt-image-2"), req({ model: "gpt-image-2", background: "transparent", format: "jpeg" })),
    ).toThrow(UsageError);
  });

  it("input fidelity rules", () => {
    caps.assertCompatible(reg.resolve("gpt-image-1.5"), {
      ...req({ model: "gpt-image-1.5" }),
      images: [],
      preserve: [],
      inputFidelity: "high",
    });
    expect(() =>
      caps.assertCompatible(reg.resolve("gpt-image-1-mini"), {
        ...req({ model: "gpt-image-1-mini" }),
        images: [],
        preserve: [],
        inputFidelity: "high",
      }),
    ).toThrow(CapabilityError);
    expect(() =>
      caps.assertCompatible(reg.resolve("gpt-image-2"), {
        ...req({ model: "gpt-image-2" }),
        images: [],
        preserve: [],
        inputFidelity: "high",
      }),
    ).toThrow(CapabilityError);
  });

  it("count bounds and stream+count", () => {
    expect(() => caps.assertCompatible(reg.resolve("gpt-image-2"), req({ count: 0 }))).toThrow(UsageError);
    expect(() => caps.assertCompatible(reg.resolve("gpt-image-2"), req({ count: 11 }))).toThrow(UsageError);
    caps.assertCompatible(reg.resolve("gpt-image-2"), req({ count: 10 }));
    expect(() => caps.assertCompatible(reg.resolve("gpt-image-2"), req({ stream: true, count: 2 }))).toThrow(
      CapabilityError,
    );
    expect(() => caps.assertCompatible(reg.resolve("gpt-image-2"), req({ partialImages: 4 }))).toThrow(UsageError);
  });

  it("dall-e-3 retired", () => {
    expect(() => caps.assertCompatible(reg.resolve("dall-e-3"), req({ model: "dall-e-3" }))).toThrow(CapabilityError);
  });

  it("parseSize and isExperimental", () => {
    const { width, height } = parseSize("1024x1024");
    expect(isExperimental(width, height)).toBe(false);
  });
});
