import { loadConfigManager } from "./config/load.js";
import { PRODUCT_DEFAULTS } from "./config/defaults.js";
import type { ImageCli } from "./core/interfaces/services.js";
import type { ImageProvider } from "./core/interfaces/provider.js";
import { CapabilityRegistry } from "./services/models/capabilities.js";
import { ModelRegistry } from "./services/models/registry.js";
import { CostEstimatorService } from "./services/costs/estimator.js";
import { GenerationService } from "./services/generation/service.js";
import { EditingService } from "./services/editing/service.js";
import { PromptEngine } from "./services/prompting/engine.js";
import { ReferenceManagerService } from "./services/references/manager.js";
import { MaskManagerService } from "./services/masking/manager.js";
import { SharpMediaProcessor } from "./media/processor.js";
import { StreamingServiceImpl } from "./services/streaming/service.js";
import { BatchManifestStore } from "./services/batch/manifest.js";
import { LocalBatchQueue } from "./services/batch/local-queue.js";
import { OpenAiBatchService } from "./services/batch/openai-batch.js";
import { BatchProcessorService } from "./services/batch/index.js";
import { InMemoryJobManager } from "./services/jobs/manager.js";
import { FileSessionStore } from "./services/sessions/store.js";
import { ProjectManagerService } from "./services/projects/manager.js";
import { GalleryManagerService } from "./services/gallery/manager.js";
import { OpenAiImagesAdapter } from "./providers/openai/images-adapter.js";
import { OpenAiResponsesAdapter } from "./providers/openai/responses-adapter.js";
import { createOpenAiClient } from "./providers/openai/client.js";
import { OpenAiBatchAdapter } from "./providers/openai/batch-adapter.js";
import { OpenAiTextOptimizer } from "./providers/openai/text-adapter.js";
import { systemClock } from "./utils/clock.js";
import path from "node:path";
import { findProjectRoot } from "./config/paths.js";

export interface CreateImageCliDeps {
  provider?: ImageProvider;
  imagesProvider?: ImageProvider;
  responsesProvider?: ImageProvider;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export function createImageCli(deps: CreateImageCliDeps = {}): ImageCli {
  const cwd = deps.cwd ?? process.cwd();
  const env = deps.env ?? process.env;
  const config = loadConfigManager({ cwd, env });
  const effective = config.getEffective();

  const models = new ModelRegistry();
  const capabilities = new CapabilityRegistry(models);
  const costs = new CostEstimatorService(models);

  const timeoutMs = effective.timeoutMs ?? PRODUCT_DEFAULTS.timeoutMs;
  const client = env.OPENAI_API_KEY ? createOpenAiClient({ timeoutMs }) : null;
  const imagesProvider =
    deps.imagesProvider ??
    deps.provider ??
    (client
      ? new OpenAiImagesAdapter(
          client as unknown as import("./providers/openai/images-adapter.js").ImagesApiClient,
        )
      : new OpenAiImagesAdapter({ images: { generate: async () => ({}), edit: async () => ({}) } }));
  const responsesProvider =
    deps.responsesProvider ??
    (client
      ? new OpenAiResponsesAdapter(
          client as unknown as import("./providers/openai/responses-adapter.js").ResponsesApiClient,
        )
      : new OpenAiResponsesAdapter({ responses: { create: async () => ({}) } }));

  const generation = new GenerationService({
    imagesProvider,
    responsesProvider,
    capabilities,
    models,
    costs,
    clock: systemClock,
    concurrency: effective.concurrency ?? PRODUCT_DEFAULTS.concurrency,
  });

  const prompts = new PromptEngine(
    client && effective.prompt?.optimizeModel
      ? new OpenAiTextOptimizer(client)
      : undefined,
  );
  const references = new ReferenceManagerService();
  const masks = new MaskManagerService();
  const media = new SharpMediaProcessor(cwd);

  const editing = new EditingService({
    generation,
    masks,
    prompts,
    references,
    models,
    costs,
  });

  const streaming = new StreamingServiceImpl(generation);
  const projectRoot = findProjectRoot(cwd) ?? cwd;
  const batchStore = new BatchManifestStore(path.join(projectRoot, ".oaiimage", "batches"));
  const localBatch = new LocalBatchQueue(batchStore, generation);
  const openAiBatch = client
    ? new OpenAiBatchService(
        new OpenAiBatchAdapter(
          client as unknown as import("./providers/openai/batch-adapter.js").BatchApiClient,
        ),
        batchStore,
      )
    : null;
  const batch = new BatchProcessorService(batchStore, localBatch, openAiBatch, models);

  const jobs = new InMemoryJobManager();
  const sessions = new FileSessionStore(path.join(projectRoot, ".oaiimage", "sessions"));
  const projects = new ProjectManagerService();
  const gallery = new GalleryManagerService(media);

  return {
    config,
    models,
    capabilities,
    generation,
    editing,
    prompts,
    references,
    masks,
    media,
    streaming,
    batch,
    jobs,
    costs,
    sessions,
    projects,
    gallery,
  };
}

export type { ImageCli };
