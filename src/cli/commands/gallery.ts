import fs from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";
import { UsageError } from "../../core/errors/errors.js";
import { helpExamples } from "../help.js";

function resolveProjectRoot(dir?: string): string {
  return path.resolve(dir ?? process.cwd());
}

function assertNoSymlinkEscape(projectRoot: string, imagePath: string): void {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedImage = path.resolve(projectRoot, imagePath);
  if (!resolvedImage.startsWith(resolvedRoot)) {
    throw new UsageError("Gallery entry escapes project root");
  }
  try {
    const stat = fs.lstatSync(resolvedImage);
    if (stat.isSymbolicLink()) {
      const real = fs.realpathSync(resolvedImage);
      if (!real.startsWith(resolvedRoot)) {
        throw new UsageError("Gallery symlink escapes project root");
      }
    }
  } catch {
    // missing files are ignored at list time
  }
}

export function registerGalleryCommands(program: Command, ctx: ProgramContext): void {
  const gallery = program
    .command("gallery")
    .description("Project gallery")
    .addHelpText("after", helpExamples("gallery list", "gallery export ./out --html"));

  gallery
    .command("list")
    .addHelpText("after", helpExamples("gallery list", "gallery list --json"))
    .action(async () => {
      const root = resolveProjectRoot();
      const images = await ctx.cli.gallery.list(root);
      for (const image of images) {
        assertNoSymlinkEscape(root, image.path);
      }
      printOrJson(ctx, { images }, images.map((i) => i.path).join("\n"));
    });

  gallery
    .command("inspect [dir]")
    .addHelpText("after", helpExamples("gallery inspect", "gallery inspect . --json"))
    .action(async (dir) => {
      const root = resolveProjectRoot(dir);
      const info = await ctx.cli.gallery.inspect(root);
      printOrJson(ctx, info, JSON.stringify(info));
    });

  gallery
    .command("export <dir>")
    .addHelpText("after", helpExamples("gallery export ./out --html", "gallery export ./exports"))
    .option("--html")
    .action(async (dir, opts) => {
      const outputs = await ctx.cli.gallery.export(process.cwd(), dir, { html: opts.html });
      printOrJson(ctx, { outputs }, outputs.join("\n"));
    });
}
