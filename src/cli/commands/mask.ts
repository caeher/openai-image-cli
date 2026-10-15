import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";
import { UsageError } from "../../core/errors/errors.js";
import { helpExamples } from "../help.js";
import {
  registerMaskInspectOptions,
  registerMaskMergeOptions,
  registerMaskMorphOptions,
  registerMaskOutputOptions,
  registerMaskPolygonOptions,
  registerMaskRectOptions,
} from "../options/mask.js";

function parsePoints(raw: string): Array<{ x: number; y: number }> {
  return raw.split(";").map((pair) => {
    const [xs, ys] = pair.split(",");
    return { x: Number(xs), y: Number(ys) };
  });
}

export function registerMaskCommands(program: Command, ctx: ProgramContext): void {
  const mask = program
    .command("mask")
    .description("Local mask operations")
    .addHelpText("after", helpExamples("mask inspect mask.png --image base.png", "mask preview mask.png --image base.png --output prev.png"));

  registerMaskInspectOptions(
    mask
      .command("inspect <mask>")
      .addHelpText("after", helpExamples("mask inspect m.png --image base.png", "mask inspect m.png --image base.png --json")),
  ).action(async (maskPath, opts) => {
    if (!opts.image) {
      throw new UsageError("mask inspect requires --image");
    }
    const info = await ctx.cli.masks.inspect(maskPath, opts.image);
    printOrJson(ctx, info, JSON.stringify(info, null, 2));
  });

  registerMaskInspectOptions(
    registerMaskOutputOptions(
      mask
        .command("preview <mask>")
        .addHelpText("after", helpExamples("mask preview m.png --image base.png --output prev.png", "mask preview m.png --image base.png --output out.png")),
    ),
  ).action(async (maskPath, opts) => {
    if (!opts.image || !opts.output) {
      throw new UsageError("mask preview requires --image and --output");
    }
    await ctx.cli.masks.renderPreview(opts.image, maskPath, opts.output);
    printOrJson(ctx, { ok: true, output: opts.output }, opts.output);
  });

  registerMaskOutputOptions(
    mask
      .command("invert <mask>")
      .addHelpText("after", helpExamples("mask invert m.png --output inv.png", "mask invert in.png --output out.png")),
  ).action(async (maskPath, opts) => {
    if (!opts.output) {
      throw new UsageError("mask invert requires --output");
    }
    await ctx.cli.masks.invert(maskPath, opts.output);
    printOrJson(ctx, { ok: true }, opts.output);
  });

  registerMaskMergeOptions(
    mask
      .command("union")
      .addHelpText("after", helpExamples("mask union --mask a.png --mask b.png --output u.png", "mask union --mask x.png --mask y.png --output out.png")),
  ).action(async (opts) => {
    const masks = opts.mask as string[];
    if (masks.length < 2 || !opts.output) {
      throw new UsageError("mask union requires two --mask and --output");
    }
    await ctx.cli.masks.union(masks[0]!, masks[1]!, opts.output);
    printOrJson(ctx, { ok: true }, opts.output);
  });

  registerMaskMergeOptions(
    mask
      .command("intersect")
      .addHelpText("after", helpExamples("mask intersect --mask a.png --mask b.png --output i.png", "mask intersect --mask x.png --mask y.png --output out.png")),
  ).action(async (opts) => {
    const masks = opts.mask as string[];
    if (masks.length < 2 || !opts.output) {
      throw new UsageError("mask intersect requires two --mask and --output");
    }
    await ctx.cli.masks.intersect(masks[0]!, masks[1]!, opts.output);
    printOrJson(ctx, { ok: true }, opts.output);
  });

  registerMaskMorphOptions(
    registerMaskOutputOptions(
      mask
        .command("dilate <mask>")
        .addHelpText("after", helpExamples("mask dilate m.png --radius 1 --output out.png", "mask dilate m.png --output d.png")),
    ),
  ).action(async (maskPath, opts) => {
    if (!opts.output) {
      throw new UsageError("mask dilate requires --output");
    }
    await ctx.cli.masks.dilate(maskPath, opts.output, Number(opts.radius));
    printOrJson(ctx, { ok: true }, opts.output);
  });

  registerMaskMorphOptions(
    registerMaskOutputOptions(
      mask
        .command("erode <mask>")
        .addHelpText("after", helpExamples("mask erode m.png --radius 1 --output out.png", "mask erode m.png --output e.png")),
    ),
  ).action(async (maskPath, opts) => {
    if (!opts.output) {
      throw new UsageError("mask erode requires --output");
    }
    await ctx.cli.masks.erode(maskPath, opts.output, Number(opts.radius));
    printOrJson(ctx, { ok: true }, opts.output);
  });

  registerMaskMorphOptions(
    registerMaskOutputOptions(
      mask
        .command("blur <mask>")
        .addHelpText("after", helpExamples("mask blur m.png --radius 2 --output out.png", "mask blur m.png --output b.png")),
    ),
  ).action(async (maskPath, opts) => {
    if (!opts.output) {
      throw new UsageError("mask blur requires --output");
    }
    await ctx.cli.masks.blur(maskPath, opts.output, Number(opts.radius));
    printOrJson(ctx, { ok: true }, opts.output);
  });

  registerMaskRectOptions(
    registerMaskOutputOptions(
      mask
        .command("rect")
        .addHelpText(
          "after",
          helpExamples("mask rect --image base.png --output m.png --x 0 --y 0 --width 10 --height 10", "mask rect --image b.png --output out.png --x 1 --y 1 --width 4 --height 4"),
        )
        .option("--image <path>"),
    ),
  ).action(async (opts) => {
    if (!opts.image || !opts.output) {
      throw new UsageError("mask rect requires --image and --output");
    }
    await ctx.cli.masks.fromRect(
      opts.image,
      opts.output,
      {
        left: Number(opts.x ?? 0),
        top: Number(opts.y ?? 0),
        width: Number(opts.width ?? 1),
        height: Number(opts.height ?? 1),
      },
      Boolean(opts.invert),
    );
    printOrJson(ctx, { ok: true }, opts.output);
  });

  registerMaskPolygonOptions(
    registerMaskOutputOptions(
      mask
        .command("polygon")
        .addHelpText(
          "after",
          helpExamples("mask polygon --image base.png --points 0,0;4,0;4,4 --output m.png", "mask polygon --image b.png --points 1,1;2,1;2,2 --output out.png"),
        )
        .option("--image <path>"),
    ),
  ).action(async (opts) => {
    if (!opts.image || !opts.output || !opts.points) {
      throw new UsageError("mask polygon requires --image, --points and --output");
    }
    await ctx.cli.masks.fromPolygon(opts.image, opts.output, parsePoints(opts.points), Boolean(opts.invert));
    printOrJson(ctx, { ok: true }, opts.output);
  });
}
