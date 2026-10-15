import type { ProgramContext } from "./program.js";

export function emitJson(ctx: ProgramContext, payload: unknown): void {
  if (ctx.json) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }
}

export function printOrJson(ctx: ProgramContext, payload: unknown, text: string): void {
  if (ctx.json) {
    emitJson(ctx, payload);
  } else {
    console.log(text);
  }
}
