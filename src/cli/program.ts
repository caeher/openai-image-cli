import { Command } from "commander";
import { createImageCli } from "../index.js";
import { createLogger } from "../utils/logger.js";
import { registerConfigCommands } from "./commands/config.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerModelsCommands } from "./commands/models.js";
import { registerCapabilitiesCommand } from "./commands/capabilities.js";
import { registerGenerateCommand } from "./commands/generate.js";
import { registerEditCommands } from "./commands/edit.js";
import { registerSessionCommands } from "./commands/session.js";
import { registerPromptCommands } from "./commands/prompt.js";
import { registerMediaCommands } from "./commands/media.js";
import { registerMaskCommands } from "./commands/mask.js";
import { registerTransformCommands } from "./commands/transform.js";
import { registerBatchCommands } from "./commands/batch.js";
import { registerCostCommands } from "./commands/cost.js";
import { registerProjectCommands } from "./commands/project.js";
import { registerGalleryCommands } from "./commands/gallery.js";
import { registerStyleCommands } from "./commands/style.js";
import { registerBackgroundCommands } from "./commands/background.js";
import { registerTypographyCommand } from "./commands/typography.js";
import { registerVariationsCommand } from "./commands/variations.js";
import type { ImageCli } from "../core/interfaces/services.js";

export interface ProgramContext {
  cli: ImageCli;
  json: boolean;
  verbose: boolean;
}

export function buildProgram(cli?: ImageCli): Command {
  const app = createImageCli();
  const imageCli = cli ?? app;
  const ctx: ProgramContext = { cli: imageCli, json: false, verbose: false };

  const program = new Command("oaiimage");
  program
    .option("--json", "Emit JSON on stdout")
    .option("--verbose", "Verbose logging")
    .option("--debug", "Debug logging (alias of verbose)")
    .option("--quiet", "Quiet logging")
    .hook("preAction", (thisCommand) => {
      const opts = thisCommand.opts();
      ctx.json = Boolean(opts.json);
      ctx.verbose = Boolean(opts.verbose || opts.debug);
      const level = opts.quiet ? "silent" : ctx.verbose ? "debug" : "info";
      const logger = createLogger({ level });
      logger.level = level;
    });

  registerConfigCommands(program, ctx);
  registerDoctorCommand(program, ctx);
  registerModelsCommands(program, ctx);
  registerCapabilitiesCommand(program, ctx);
  registerGenerateCommand(program, ctx);
  registerEditCommands(program, ctx);
  registerStyleCommands(program, ctx);
  registerBackgroundCommands(program, ctx);
  registerSessionCommands(program, ctx);
  registerPromptCommands(program, ctx);
  registerTypographyCommand(program, ctx);
  registerVariationsCommand(program, ctx);
  registerMediaCommands(program, ctx);
  registerMaskCommands(program, ctx);
  registerTransformCommands(program, ctx);
  registerBatchCommands(program, ctx);
  registerCostCommands(program, ctx);
  registerProjectCommands(program, ctx);
  registerGalleryCommands(program, ctx);

  return program;
}
