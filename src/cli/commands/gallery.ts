import type { Command } from "commander";
import type { ProgramContext } from "../program.js";
import { printOrJson } from "../context.js";

export function registerGalleryCommands(program: Command, ctx: ProgramContext): void {
  const gallery = program.command("gallery").description("Project gallery");
  gallery.command("list").action(async () => {
    const images = await ctx.cli.gallery.list(process.cwd());
    printOrJson(ctx, { images }, images.map((i) => i.path).join("\n"));
  });
  gallery.command("inspect").action(async () => {
    const info = await ctx.cli.gallery.inspect(process.cwd());
    printOrJson(ctx, info, JSON.stringify(info));
  });
  gallery
    .command("export <dir>")
    .option("--html")
    .action(async (dir, opts) => {
      const outputs = await ctx.cli.gallery.export(process.cwd(), dir, { html: opts.html });
      printOrJson(ctx, { outputs }, outputs.join("\n"));
    });
}
