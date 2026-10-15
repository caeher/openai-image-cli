import type { BudgetPolicy, CostContext, CostReport } from "../entities/cost.js";
import type { ImageMetadata } from "../entities/model.js";
import type {
  BackgroundRequest,
  ExpandRequest,
  ImageEditRequest,
  ImageGenerationRequest,
  StyleRequest,
} from "../entities/request.js";
import type { ImageGenerationResult, SavedImage, TokenUsage } from "../entities/result.js";
import type { ImageCapabilities, ImageModelConfig } from "../entities/model.js";
import type {
  BuiltPrompt,
  PromptBuildInput,
  PromptTemplate,
  PromptValidation,
  StructuredPrompt,
} from "./prompt.js";
import type {
  CompositeLayer,
  CropOptions,
  OutputTarget,
  ResizeOptions,
  TypographySpec,
} from "./media-options.js";
import type { ImageJob } from "../entities/job.js";
import type { ImageSession, SessionIteration } from "../entities/session.js";
import type { ImageProject } from "../entities/project.js";

export interface ConfigurationManager {
  getEffective(): import("../../config/schema.js").EffectiveConfig;
  init(options?: { global?: boolean }): Promise<string>;
  set(key: string, value: string, options?: { global?: boolean }): Promise<void>;
  setFromFile(filePath: string, options?: { global?: boolean }): Promise<void>;
  get(key: string): unknown;
  list(): Record<string, unknown>;
  reset(options?: { global?: boolean }): Promise<void>;
}

export interface ModelRegistry {
  list(): ImageModelConfig[];
  get(id: string): ImageModelConfig | undefined;
  resolve(id: string): ImageModelConfig;
}

export interface CapabilityRegistry {
  assertCompatible(
    model: ImageModelConfig,
    request: ImageGenerationRequest | ImageEditRequest,
  ): void;
  getCapabilities(modelId: string): ImageCapabilities;
}

export interface ImageGenerator {
  generate(request: ImageGenerationRequest, signal: AbortSignal): Promise<ImageGenerationResult>;
}

export interface ImageEditor {
  edit(request: ImageEditRequest, signal: AbortSignal): Promise<ImageGenerationResult>;
  inpaint(request: ImageEditRequest, signal: AbortSignal): Promise<ImageGenerationResult>;
  expand(request: ExpandRequest, signal: AbortSignal): Promise<ImageGenerationResult>;
  compose(request: ImageEditRequest, signal: AbortSignal): Promise<ImageGenerationResult>;
  applyStyle(request: StyleRequest, signal: AbortSignal): Promise<ImageGenerationResult>;
  transparent(request: BackgroundRequest, signal: AbortSignal): Promise<ImageGenerationResult>;
  replaceBackground(request: BackgroundRequest, signal: AbortSignal): Promise<ImageGenerationResult>;
  removeBackground(request: BackgroundRequest, signal: AbortSignal): Promise<ImageGenerationResult>;
}

export interface PromptBuilder {
  create(fields: StructuredPrompt): string;
  build(input: PromptBuildInput): BuiltPrompt;
  validate(prompt: string, model: ImageModelConfig): PromptValidation;
  optimize(
    prompt: string,
    model: string,
    signal: AbortSignal,
  ): Promise<{ original: string; optimized: string }>;
  listTemplates(): readonly PromptTemplate[];
  save(name: string, body: string, promptsDir?: string): Promise<string>;
  loadSaved(name: string): string;
}

export interface ReferenceManager {
  validate(paths: string[], roles: string[], model: ImageModelConfig): Promise<import("../entities/request.js").ImageReference[]>;
  formatForPrompt(refs: import("../entities/request.js").ImageReference[]): string;
}

export interface ImageMask {
  path: string;
  width: number;
  height: number;
  editablePixelCount: number;
  opaquePixelCount: number;
}

export interface MaskManager {
  inspect(maskPath: string, baseImagePath: string): Promise<ImageMask>;
  renderPreview(baseImagePath: string, maskPath: string, outputPath: string): Promise<void>;
  invert(maskPath: string, outputPath: string): Promise<void>;
  union(maskA: string, maskB: string, outputPath: string): Promise<void>;
  intersect(maskA: string, maskB: string, outputPath: string): Promise<void>;
  dilate(maskPath: string, outputPath: string, radius: number): Promise<void>;
  erode(maskPath: string, outputPath: string, radius: number): Promise<void>;
  blur(maskPath: string, outputPath: string, radius: number): Promise<void>;
  fromRect(
    baseImagePath: string,
    outputPath: string,
    rect: { left: number; top: number; width: number; height: number },
    invert?: boolean,
  ): Promise<void>;
  fromPolygon(
    baseImagePath: string,
    outputPath: string,
    points: Array<{ x: number; y: number }>,
    invert?: boolean,
  ): Promise<void>;
  assertApplicable(maskPath: string, baseImagePath: string, model: ImageModelConfig): Promise<ImageMask>;
}

export interface MediaProcessor {
  inspect(path: string, root?: string): Promise<ImageMetadata>;
  resize(input: string, output: string, options: ResizeOptions, root?: string): Promise<ImageMetadata>;
  crop(input: string, output: string, options: CropOptions, root?: string): Promise<ImageMetadata>;
  rotate(input: string, output: string, degrees: number, root?: string): Promise<ImageMetadata>;
  convert(
    input: string,
    output: string,
    format: import("../entities/primitives.js").OutputFormat,
    compression?: number,
    root?: string,
  ): Promise<ImageMetadata>;
  compress(input: string, output: string, quality: number, root?: string): Promise<ImageMetadata>;
  composite(layers: CompositeLayer[], output: string, root?: string): Promise<ImageMetadata>;
  watermark(input: string, output: string, text: string, root?: string): Promise<ImageMetadata>;
  thumbnail(input: string, output: string, maxEdge: number, root?: string): Promise<ImageMetadata>;
  contactSheet(inputs: readonly string[], output: string, root?: string): Promise<ImageMetadata>;
  compare(left: string, right: string, output: string, root?: string): Promise<ImageMetadata>;
  interpolate(input: string, output: string, scale: number, root?: string): Promise<ImageMetadata>;
  overlaySvgText(
    input: string,
    output: string,
    spec: TypographySpec,
    root?: string,
  ): Promise<ImageMetadata>;
}

export interface StreamingService {
  generateWithStreaming(
    request: ImageGenerationRequest,
    signal: AbortSignal,
    onPartial?: (index: number) => void,
  ): Promise<ImageGenerationResult>;
}

export interface BatchProcessor {
  createFromFile(path: string, options: { mode: "local" | "openai"; model: string }): Promise<string>;
  run(batchId: string, signal: AbortSignal, options?: { retry?: boolean }): Promise<void>;
  status(batchId: string): Promise<import("../../services/batch/manifest.js").BatchManifest>;
  retry(batchId: string, signal: AbortSignal): Promise<void>;
  export(batchId: string, outputDir: string): Promise<void>;
}

export interface JobManager {
  create(job: ImageJob): Promise<ImageJob>;
  update(id: string, patch: Partial<ImageJob>): Promise<ImageJob>;
  get(id: string): Promise<ImageJob | null>;
  list(projectId?: string): Promise<ImageJob[]>;
}

export interface CostEstimator {
  estimate(request: ImageGenerationRequest | ImageEditRequest): CostReport;
  fromUsage(usage: TokenUsage, context: CostContext): CostReport;
  assertWithinBudget(report: CostReport, budget: BudgetPolicy): void;
}

export interface SessionStore {
  create(options: {
    apiMode: import("../entities/primitives.js").ApiMode;
    imageModel: string;
    responsesModel?: string;
  }): Promise<ImageSession>;
  get(id: string): Promise<ImageSession | null>;
  addIteration(sessionId: string, iteration: SessionIteration): Promise<ImageSession>;
  list(): Promise<ImageSession[]>;
  delete(id: string): Promise<void>;
  exportSession(id: string, outputPath: string): Promise<void>;
}

export interface ProjectManager {
  init(cwd: string, name?: string): Promise<ImageProject>;
  list(cwd: string): Promise<ImageProject[]>;
  inspect(projectRoot: string): Promise<ImageProject>;
}

export interface GalleryManager {
  list(projectRoot: string): Promise<ImageMetadata[]>;
  inspect(projectRoot: string): Promise<{ count: number; manifestPath: string }>;
  export(projectRoot: string, outputDir: string, options?: { html?: boolean }): Promise<string[]>;
}

export interface ImageRepository {
  saveGenerated(bytes: Buffer, target: OutputTarget): Promise<SavedImage>;
  readMetadata(path: string): Promise<ImageMetadata>;
}

export interface ImageCli {
  config: ConfigurationManager;
  models: ModelRegistry;
  capabilities: CapabilityRegistry;
  generation: ImageGenerator;
  editing: ImageEditor;
  prompts: PromptBuilder;
  references: ReferenceManager;
  masks: MaskManager;
  media: MediaProcessor;
  streaming: StreamingService;
  batch: BatchProcessor;
  jobs: JobManager;
  costs: CostEstimator;
  sessions: SessionStore;
  projects: ProjectManager;
  gallery: GalleryManager;
}
