import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { cli: "src/cli/main.ts" },
    format: ["esm"],
    dts: false,
    clean: true,
    sourcemap: true,
    target: "node24",
    banner: { js: "#!/usr/bin/env node" },
    outExtension() {
      return { js: ".js" };
    },
  },
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: false,
    sourcemap: true,
    target: "node24",
    outExtension() {
      return { js: ".js" };
    },
  },
]);
