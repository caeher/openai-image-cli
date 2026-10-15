import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";
import { helpExamples } from "../help.js";
import { registerMediaImageListOptions, registerMediaLayerOptions } from "../options/media.js";

export function registerMediaCommands(program: Command, ctx: ProgramContext): void {
  const media = program
    .command("media")
    .description("Local media operations")
    .addHelpText("after", helpExamples("media inspect photo.png", "media resize in.png out.png --width 512"));

  media
    .command("inspect <path>")
    .addHelpText("after", helpExamples("media inspect photo.png", "media inspect ./out.png --json"))
    .action(async (filePath) => {
      const meta = await ctx.cli.media.inspect(filePath);
      printOrJson(ctx, meta, JSON.stringify(meta, null, 2));
    });

  media
    .command("metadata <path>")
    .description("Alias of inspect")
    .addHelpText("after", helpExamples("media metadata photo.png", "media metadata a.png --json"))
    .action(async (filePath) => {
      const meta = await ctx.cli.media.inspect(filePath);
      printOrJson(ctx, meta, JSON.stringify(meta, null, 2));
    });

  media
    .command("resize <input> <output>")
    .addHelpText(
      "after",
      helpExamples("media resize in.png out.png --width 512", "media resize in.png out.png --height 256"),
    )
    .option("--width <n>")
    .option("--height <n>")
    .action(async (input, output, opts) => {
      const resizeOptions: import("../../core/interfaces/media-options.js").ResizeOptions = {};
      if (opts.width) {
        resizeOptions.width = Number(opts.width);
      }
      if (opts.height) {
        resizeOptions.height = Number(opts.height);
      }
      const meta = await ctx.cli.media.resize(input, output, resizeOptions);
      printOrJson(ctx, meta, output);
    });

  media
    .command("convert <input> <output> <format>")
    .addHelpText("after", helpExamples("media convert in.png out.webp webp", "media convert a.png b.jpeg jpeg"))
    .action(async (input, output, format) => {
      const meta = await ctx.cli.media.convert(input, output, format as "png");
      printOrJson(ctx, meta, output);
    });

  media
    .command("compare <left> <right> <output>")
    .addHelpText("after", helpExamples("media compare a.png b.png diff.png", "media compare old.png new.png out.png"))
    .action(async (left, right, output) => {
      const meta = await ctx.cli.media.compare(left, right, output);
      printOrJson(ctx, meta, output);
    });

  media
    .command("crop <input> <output>")
    .addHelpText(
      "after",
      helpExamples("media crop in.png out.png --left 0 --top 0 --width 100 --height 100", "media crop a.png b.png --left 10 --top 10 --width 50 --height 50"),
    )
    .option("--left <n>")
    .option("--top <n>")
    .option("--width <n>")
    .option("--height <n>")
    .action(async (input, output, opts) => {
      const meta = await ctx.cli.media.crop(input, output, {
        left: Number(opts.left ?? 0),
        top: Number(opts.top ?? 0),
        width: Number(opts.width ?? 1),
        height: Number(opts.height ?? 1),
      });
      printOrJson(ctx, meta, output);
    });

  media
    .command("rotate <input> <output>")
    .addHelpText("after", helpExamples("media rotate in.png out.png --degrees 90", "media rotate a.png b.png --degrees 180"))
    .option("--degrees <n>", "Rotation degrees", "90")
    .action(async (input, output, opts) => {
      const meta = await ctx.cli.media.rotate(input, output, Number(opts.degrees));
      printOrJson(ctx, meta, output);
    });

  media
    .command("compress <input> <output>")
    .addHelpText("after", helpExamples("media compress in.png out.jpg --quality 80", "media compress photo.png out.jpg --quality 60"))
    .option("--quality <n>", "JPEG quality", "80")
    .action(async (input, output, opts) => {
      const meta = await ctx.cli.media.compress(input, output, Number(opts.quality));
      printOrJson(ctx, meta, output);
    });

  registerMediaLayerOptions(
    media
      .command("composite")
      .addHelpText(
        "after",
        helpExamples(
          "media composite --layer base.png --layer top.png --output out.png",
          "media composite --layer a.png --output merged.png",
        ),
      )
      .option("--output <path>", "Output path", "output/composite.png"),
  ).action(async (opts) => {
    const layers = (opts.layer as string[] | undefined) ?? [];
    if (!layers.length) {
      throw new Error("composite requires at least one --layer");
    }
    const compositeLayers = layers.map((input) => ({ input }));
    const meta = await ctx.cli.media.composite(compositeLayers, opts.output);
    printOrJson(ctx, meta, opts.output);
  });

  media
    .command("watermark <input> <output>")
    .addHelpText("after", helpExamples('media watermark in.png out.png --text "sample"', 'media watermark a.png b.png --text "© me"'))
    .option("--text <text>", "Watermark text", "WATERMARK")
    .action(async (input, output, opts) => {
      const meta = await ctx.cli.media.watermark(input, output, opts.text);
      printOrJson(ctx, meta, output);
    });

  media
    .command("thumbnail <input> <output>")
    .addHelpText("after", helpExamples("media thumbnail big.png small.png --max-edge 256", "media thumbnail in.png thumb.png --max-edge 128"))
    .option("--max-edge <n>", "Max edge in pixels", "256")
    .action(async (input, output, opts) => {
      const meta = await ctx.cli.media.thumbnail(input, output, Number(opts.maxEdge));
      printOrJson(ctx, meta, output);
    });

  const sheet = media
    .command("contact-sheet")
    .addHelpText(
      "after",
      helpExamples("media contact-sheet --image a.png --image b.png --output sheet.png", "media contact-sheet --image one.png --output grid.png"),
    )
    .option("--output <path>", "Output path", "output/contact-sheet.png");
  registerMediaImageListOptions(sheet).action(async (opts) => {
    const images = (opts.image as string[] | undefined) ?? [];
    const meta = await ctx.cli.media.contactSheet(images, opts.output);
    printOrJson(ctx, meta, opts.output);
  });
}
