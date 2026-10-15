import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { ConfigError } from "../core/errors/errors.js";
import { PRODUCT_DEFAULTS, type ProductDefaults } from "./defaults.js";
import {
  findProjectRoot,
  globalConfigPath,
  projectConfigPath,
  type PathContext,
} from "./paths.js";
import {
  mergeConfig,
  parseConfigYamlObject,
  type EffectiveConfig,
} from "./schema.js";

function buildPathContext(cwd: string, env: NodeJS.ProcessEnv): PathContext {
  const ctx: PathContext = { cwd, homeDir: env.HOME ?? "/tmp" };
  if (env.XDG_CONFIG_HOME) {
    ctx.xdgConfigHome = env.XDG_CONFIG_HOME;
  }
  if (env.APPDATA) {
    ctx.appData = env.APPDATA;
  }
  return ctx;
}

const ENV_MAP: Record<string, keyof ProductDefaults> = {
  OAIIMAGE_MODEL: "model",
  OAIIMAGE_SIZE: "size",
  OAIIMAGE_QUALITY: "quality",
  OAIIMAGE_FORMAT: "format",
  OAIIMAGE_BACKGROUND: "background",
  OAIIMAGE_OUTPUT_DIR: "outputDir",
  OAIIMAGE_COUNT: "count",
  OAIIMAGE_CONCURRENCY: "concurrency",
  OAIIMAGE_BUDGET_USD: "budgetUsd",
  OAIIMAGE_RETRIES: "retries",
  OAIIMAGE_TIMEOUT_MS: "timeoutMs",
  OAIIMAGE_API_MODE: "apiMode",
  OAIIMAGE_RESPONSES_MODEL: "responsesModel",
};

function readYamlFile(filePath: string): Partial<ProductDefaults> {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const text = fs.readFileSync(filePath, "utf8");
  const parsed = YAML.parse(text);
  if (!parsed || typeof parsed !== "object") {
    throw new ConfigError(`Config file is not a YAML object: ${filePath}`);
  }
  try {
    return parseConfigYamlObject(parsed as Record<string, unknown>);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Secret key")) {
      throw new ConfigError(message);
    }
    throw new ConfigError(`Invalid config at ${filePath}: ${message}`);
  }
}

function envLayer(env: NodeJS.ProcessEnv): Partial<ProductDefaults> {
  const data: Partial<ProductDefaults> = {};
  for (const [envKey, configKey] of Object.entries(ENV_MAP)) {
    const value = env[envKey];
    if (value === undefined || value === "") {
      continue;
    }
    if (configKey === "count" || configKey === "concurrency" || configKey === "retries") {
      (data as Record<string, number>)[configKey] = Number.parseInt(value, 10);
    } else if (configKey === "budgetUsd") {
      data.budgetUsd = Number.parseFloat(value);
    } else if (configKey === "timeoutMs") {
      data.timeoutMs = Number.parseInt(value, 10);
    } else {
      (data as Record<string, string>)[configKey] = value;
    }
  }
  return data;
}

export interface LoadConfigOptions {
  cwd: string;
  env: NodeJS.ProcessEnv;
  flags?: Partial<ProductDefaults>;
  platform?: PathContext;
}

export function loadEffectiveConfig(options: LoadConfigOptions): EffectiveConfig {
  const pathCtx: PathContext =
    options.platform ?? buildPathContext(options.cwd, options.env);

  const globalPath = globalConfigPath(pathCtx);
  const projectRoot = findProjectRoot(options.cwd);
  const projectPath = projectRoot ? projectConfigPath(projectRoot) : null;

  const layers = [
    { data: PRODUCT_DEFAULTS, source: "default" as const },
    { data: readYamlFile(globalPath), source: "global" as const },
    ...(projectPath ? [{ data: readYamlFile(projectPath), source: "project" as const }] : []),
    { data: envLayer(options.env), source: "env" as const },
    ...(options.flags ? [{ data: options.flags, source: "flag" as const }] : []),
  ];

  return mergeConfig(layers);
}

export function loadConfigManager(options: LoadConfigOptions) {
  let effective = loadEffectiveConfig(options);
  const pathCtx: PathContext =
    options.platform ?? buildPathContext(options.cwd, options.env);

  return {
    getEffective: () => effective,
    async init(initOptions?: { global?: boolean }) {
      const target = initOptions?.global
        ? globalConfigPath(pathCtx)
        : projectConfigPath(findProjectRoot(options.cwd) ?? options.cwd);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (!fs.existsSync(target)) {
        fs.writeFileSync(
          target,
          YAML.stringify({
            model: PRODUCT_DEFAULTS.model,
            size: PRODUCT_DEFAULTS.size,
            quality: PRODUCT_DEFAULTS.quality,
            format: PRODUCT_DEFAULTS.format,
            outputDir: PRODUCT_DEFAULTS.outputDir,
          }),
        );
      }
      return target;
    },
    async set(key: string, value: string, setOptions?: { global?: boolean }) {
      if (secretKeys.has(key) || key === "apiKey") {
        throw new ConfigError(`Cannot set secret key "${key}" in config`);
      }
      const projectRoot = findProjectRoot(options.cwd);
      const target =
        setOptions?.global || !projectRoot
          ? globalConfigPath(pathCtx)
          : projectConfigPath(projectRoot);
      const current = readYamlFile(target);
      (current as Record<string, string>)[key] = value;
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, YAML.stringify(current));
      effective = loadEffectiveConfig(options);
    },
    get(key: string) {
      return (effective as unknown as Record<string, unknown>)[key];
    },
    list() {
      return { ...effective };
    },
    async reset(resetOptions?: { global?: boolean }) {
      const projectRoot = findProjectRoot(options.cwd);
      const target =
        resetOptions?.global || !projectRoot
          ? globalConfigPath(pathCtx)
          : projectConfigPath(projectRoot);
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
      }
      effective = loadEffectiveConfig(options);
    },
  };
}

const secretKeys = new Set(["apiKey", "openai_api_key", "OPENAI_API_KEY"]);
