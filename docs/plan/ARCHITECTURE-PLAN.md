# Arquitectura de OpenAI Image CLI

Producto: comando `oaiimage`, paquete npm `openai-image-cli`. Esta fase no contiene código de aplicación. El implementador crea los archivos que aquí se nombran, con estas interfaces, sin ampliar el alcance.

La investigación de API está cerrada en [API-RESEARCH.md](./API-RESEARCH.md). La matriz está en [CAPABILITY-MATRIX.md](./CAPABILITY-MATRIX.md). El orden de construcción está en [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md).

## Decisiones fijas

- Node actual LTS el 2026-10-15: **24.22.0** (nombre de LTS Krypton). `engines.node` es `>=24.22.0`. El CI usa Node 24.
- Módulo ESM. `"type": "module"`. TypeScript `NodeNext`.
- El paquete publica una API de biblioteca en `src/index.ts` que no importa Commander. Los comandos son un adaptador fino sobre esa API.
- Dominio y SDK no comparten tipos. El adaptador `providers/openai` es el único directorio que importa `openai`.
- Dos modos de API, nunca mezclados en un mismo cuerpo: `images` y `responses`.
- Lo que la matriz marca `disabled` o `UNKNOWN` falla con un error de capacidad. No hay un resultado falso de éxito.
- No se publica el paquete en npm en esta entrega ni en el CI por defecto.

## Árbol

```
openai-image-cli/
  package.json
  pnpm-lock.yaml
  tsconfig.json
  tsup.config.ts
  vitest.config.ts
  eslint.config.js
  .prettierrc.json
  .gitignore
  .env.example
  src/
    index.ts
    cli/
      main.ts
      program.ts
      exit.ts
      options/
        global.ts
        generate.ts
        edit.ts
        mask.ts
        batch.ts
        cost.ts
      interactive/
        confirm.ts
        wizard.ts
      commands/
        config.ts
        doctor.ts
        models.ts
        capabilities.ts
        generate.ts
        edit.ts
        inpaint.ts
        expand.ts
        compose.ts
        style.ts
        background.ts
        session.ts
        prompt.ts
        typography.ts
        variations.ts
        media.ts
        transform.ts
        batch.ts
        cost.ts
        project.ts
        gallery.ts
    core/
      entities/
        model.ts
        request.ts
        result.ts
        job.ts
        project.ts
        session.ts
        cost.ts
      interfaces/
        provider.ts
        services.ts
      errors/
        errors.ts
        codes.ts
      types/
        json.ts
        ids.ts
    providers/
      openai/
        client.ts
        images-adapter.ts
        responses-adapter.ts
        batch-adapter.ts
        text-adapter.ts
        map-error.ts
        redact.ts
    services/
      models/registry.ts
      models/capabilities.ts
      models/data.ts
      models/size.ts
      generation/service.ts
      editing/service.ts
      prompting/engine.ts
      prompting/templates.ts
      references/manager.ts
      masking/manager.ts
      masking/morphology.ts
      streaming/service.ts
      batch/local-queue.ts
      batch/openai-batch.ts
      batch/manifest.ts
      projects/manager.ts
      gallery/manager.ts
      gallery/html.ts
      costs/estimator.ts
      costs/ledger.ts
      costs/prices.ts
      sessions/store.ts
      jobs/manager.ts
    media/
      processor.ts
      sniff.ts
      atomic.ts
    config/
      schema.ts
      load.ts
      paths.ts
      defaults.ts
    utils/
      signal.ts
      retry.ts
      concurrency.ts
      clock.ts
    templates/
      prompt-templates.ts
      style-templates.ts
  tests/
    unit/
    integration/
    e2e/
    fixtures/
  examples/
    generation/
    editing/
    masks/
    references/
    typography/
    sessions/
    batch/
    projects/
  docs/
    plan/
    architecture/
    commands/
    prompting/
    configuration/
    models/
    costs/
    README.md
    ARCHITECTURE.md
    COMMANDS.md
    GENERATION.md
    EDITING.md
    MASKING.md
    REFERENCES.md
    PROMPTING.md
    MODELS.md
    COSTS.md
    SECURITY.md
    CONTRIBUTING.md
    CHANGELOG.md
  .github/workflows/
    ci.yml
    publish.yml
```

`transform.ts` agrupa `upscale`, `restore` y `enhance`. No se crea un tercer paquete.

## API interna

`src/index.ts` exporta `createImageCli(deps?)` y los tipos de dominio. Devuelve un objeto `ImageCli` con los servicios ya construidos. Los tests de integración sustituyen `deps.provider` por un fake. El CLI real construye el provider de OpenAI solo cuando el comando va a llamar a la red.

```ts
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
```

Ninguno de estos métodos analiza `process.argv`.

## Tipos de dominio

Viven en `src/core`. No contienen `Uploadable`, `APIPromise` ni clases del SDK.

```ts
export type ApiMode = "images" | "responses";

export type ModelStatus = "active" | "deprecated" | "retired";

export type Quality = "auto" | "low" | "medium" | "high" | "xhigh" | "max";

export type OutputFormat = "png" | "jpeg" | "webp";

export type Background = "auto" | "opaque" | "transparent";

export type InputFidelity = "low" | "high";

export type ReferenceRole =
  | "subject"
  | "face"
  | "clothing"
  | "object"
  | "background"
  | "composition"
  | "color-palette"
  | "lighting"
  | "style"
  | "material"
  | "texture";

export interface ImageReference {
  path: string;
  role: ReferenceRole;
  note?: string;
}

export interface ImageMask {
  path: string;
  width: number;
  height: number;
  editablePixelCount: number;
  opaquePixelCount: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  model: string;
  apiMode: ApiMode;
  responsesModel?: string;
  size: string;
  quality: Quality;
  format: OutputFormat;
  compression?: number;
  background: Background;
  count: number;
  moderation?: "auto" | "low";
  stream: boolean;
  partialImages: number;
  savePartials: boolean;
  output?: string;
  directory: string;
  dryRun: boolean;
}

export interface ImageEditRequest extends ImageGenerationRequest {
  images: ImageReference[];
  maskPath?: string;
  inputFidelity?: InputFidelity;
  preserve: string[];
  action?: "auto" | "generate" | "edit";
  previousResponseId?: string;
}

export interface ImageGenerationResult {
  ok: true;
  dryRun: boolean;
  apiMode: ApiMode;
  model: string;
  responsesModel?: string;
  images: SavedImage[];
  partials: SavedImage[];
  revisedPrompt: string | null;
  revisedPromptAvailability: "returned" | "not-provided-by-images-api" | "not-run";
  responseId?: string;
  imageCallId?: string;
  usage?: TokenUsage;
  cost: CostReport;
  experimental: boolean;
  warnings: string[];
}

export interface SavedImage {
  path: string;
  sha256: string;
  bytes: number;
  width?: number;
  height?: number;
  format: OutputFormat;
  partialIndex?: number;
  kind: "final" | "partial";
}

export interface TokenUsage {
  inputTokens: number;
  inputImageTokens?: number;
  inputTextTokens?: number;
  outputTokens: number;
  outputImageTokens?: number;
  outputTextTokens?: number;
  totalTokens: number;
  source: "provider" | "estimate";
}

export interface ImageCapabilities {
  modelId: string;
  status: ModelStatus;
  shutdownDate?: string;
  generate: boolean;
  edit: boolean;
  toolModel: boolean;
  batchImages: boolean;
  qualities: readonly Quality[];
  fixedSizes: readonly string[];
  customSize: boolean | "experimental-above-2560x1440";
  transparentBackground: "supported" | "preview" | "unsupported";
  mask: boolean;
  maxReferences: number;
  maxN: number;
  stream: boolean;
  partialImages: { min: 0; max: 3 };
  inputFidelity: "omit" | "low-or-high" | "low-only";
  moderationOnGenerate: boolean;
  moderationOnEdit: false;
  revisedPromptOnImages: false;
  revisedPromptOnResponses: true;
}

export interface ImageModelConfig {
  id: string;
  displayName: string;
  status: ModelStatus;
  snapshotIds: readonly string[];
  capabilities: ImageCapabilities;
  pricing: ModelPricing;
  rateLimit: {
    tiers: readonly { tier: string; tpm: number; ipm: number }[];
    aboveGrow: "unknown";
  };
  sourceUrls: readonly string[];
  verifiedOn: "2026-10-15";
}

export interface ImageProject {
  id: string;
  name: string;
  root: string;
  createdAt: string;
  defaults: Partial<ProductDefaults>;
}

export interface ImageJob {
  id: string;
  projectId?: string;
  state: "pending" | "running" | "succeeded" | "failed" | "cancelled" | "skipped";
  request: ImageGenerationRequest | ImageEditRequest;
  result?: ImageGenerationResult;
  errorCode?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImageMetadata {
  path: string;
  sha256: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  hasAlpha: boolean;
  createdAt?: string;
  source: "generated" | "edited" | "local" | "imported";
  model?: string;
  prompt?: string;
  revisedPrompt?: string | null;
  parameters?: Record<string, string | number | boolean | null>;
  cost?: CostReport;
}
```

`ProductDefaults` es el objeto de configuración de la sección siguiente. `ModelPricing` copia las tablas de la investigación, con `perImageUsd` ausente en Sunburst y Flare. Un importe ausente se representa como `{ kind: "unknown" }`, nunca como `0`.

`CostReport` tiene `kind: "quote" | "actual" | "mixed" | "unknown"`, partidas (`imageOutput`, `imageInput`, `textInput`, `textOutput`, `partials`, `responsesModel`, `cache`) y `currency: "USD"`. Cada partida es `{ kind: "amount"; usd: string } | { kind: "range"; minUsd: string; maxUsd: string } | { kind: "unknown"; reason: string }`. Los USD van en string decimal, no en `number`.

## Interfaces

```ts
export interface ImageProvider {
  readonly mode: ApiMode;
  generate(request: ProviderGenerateCall, signal: AbortSignal): Promise<ProviderImageResult>;
  edit(request: ProviderEditCall, signal: AbortSignal): Promise<ProviderImageResult>;
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
}

export interface PromptBuilder {
  create(fields: StructuredPrompt): string;
  build(input: PromptBuildInput): BuiltPrompt;
  validate(prompt: string, model: ImageModelConfig): PromptValidation;
  optimize(prompt: string, model: string, signal: AbortSignal): Promise<{ original: string; optimized: string }>;
  listTemplates(): readonly PromptTemplate[];
  save(name: string, body: string): Promise<string>;
}

export interface MediaProcessor {
  inspect(path: string): Promise<ImageMetadata>;
  resize(input: string, output: string, options: ResizeOptions): Promise<ImageMetadata>;
  crop(input: string, output: string, options: CropOptions): Promise<ImageMetadata>;
  rotate(input: string, output: string, degrees: number): Promise<ImageMetadata>;
  convert(input: string, output: string, format: OutputFormat, compression?: number): Promise<ImageMetadata>;
  compress(input: string, output: string, quality: number): Promise<ImageMetadata>;
  composite(layers: CompositeLayer[], output: string): Promise<ImageMetadata>;
  watermark(input: string, output: string, text: string): Promise<ImageMetadata>;
  thumbnail(input: string, output: string, maxEdge: number): Promise<ImageMetadata>;
  contactSheet(inputs: readonly string[], output: string): Promise<ImageMetadata>;
  compare(left: string, right: string, output: string): Promise<ImageMetadata>;
  interpolate(input: string, output: string, scale: number): Promise<ImageMetadata>;
  overlaySvgText(input: string, output: string, spec: TypographySpec): Promise<ImageMetadata>;
}

export interface JobStore {
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

export interface ImageRepository {
  saveGenerated(bytes: Buffer, target: OutputTarget): Promise<SavedImage>;
  readMetadata(path: string): Promise<ImageMetadata>;
}
```

`ProviderGenerateCall` y `ProviderEditCall` son los cuerpos ya validados, todavía en tipos de dominio. El adaptador los traduce. `ExpandRequest`, `StyleRequest`, `BackgroundRequest`, `StructuredPrompt`, `ResizeOptions`, `CropOptions`, `CompositeLayer`, `TypographySpec`, `OutputTarget`, `BudgetPolicy` y `CostContext` se definen al lado de estas interfaces, con los campos que los comandos de la spec ya nombran, y sin campos extra “por si acaso”.

`MaskManager` no está en la lista de interfaces de la spec; se añade porque el módulo Mask Manager existe. Métodos: `inspect`, `renderPreview`, `invert`, `union`, `intersect`, `dilate`, `erode`, `blur`, `fromRect`, `fromPolygon`, `assertApplicable`. Todos locales. `assertApplicable` aplica las reglas de la máscara de la investigación y lanza `CapabilityError` o `UsageError`.

`SessionStore` persiste `ImageSession`:

```ts
export interface ImageSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  apiMode: ApiMode;
  imageModel: string;
  responsesModel?: string;
  iterations: SessionIteration[];
}

export interface SessionIteration {
  id: string;
  parentId?: string;
  createdAt: string;
  prompt: string;
  revisedPrompt: string | null;
  responseId?: string;
  imageCallId?: string;
  model: string;
  parameters: Record<string, string | number | boolean | null>;
  cost: CostReport;
  outputPaths: string[];
  source: "api" | "fallback";
}
```

## Adaptadores OpenAI

`providers/openai/client.ts` crea `new OpenAI({ apiKey, timeout, maxRetries: 0 })`. Los reintentos los hace `utils/retry.ts`, no el SDK, para no reintentar moderación. La clave sale solo de `process.env.OPENAI_API_KEY`. Si falta en un comando de red, `AuthError`.

`images-adapter.ts`:

- `generate` llama `client.images.generate`.
- `edit` llama `client.images.edit` con `fs.createReadStream` de rutas ya validadas.
- Si `stream` es true, usa el overload de streaming y lee `image_generation.partial_image` / `image_generation.completed` o los equivalentes de edit.
- Traduce `usage` solo con los campos presentes.
- No envía `style`, `response_format`, `hd`, `standard`, ni `input_fidelity` cuando la capacidad dice omitir.
- No llama `images.createVariation`.

`responses-adapter.ts`:

- `client.responses.create({ model: responsesModel, input, previous_response_id, stream, tools: [{ type: "image_generation", model, action, ... }] })`.
- `tool_choice` se fija a `{ type: "image_generation" }` para que el modo imagen no dependa de que el modelo decida no llamar a la herramienta. Si la API lo rechaza, el error se propaga; no se reintenta sin la herramienta y se da el texto por imagen.
- El prompt revisado sale de `revised_prompt` del `image_generation_call`. Si no está, queda `null` con availability `not-provided-by-images-api` solo cuando el modo es `images`. En Responses, si falta, availability es `not-run` o se deja `null` y un warning `revised_prompt ausente en la respuesta`. No se rellena con el prompt original.
- Varias imágenes: un bucle con el límite de concurrencia. Cada una guarda su `response.id`.

`batch-adapter.ts` usa `files.create` (`purpose: "batch"`), `batches.create`, `batches.retrieve`, `batches.cancel` y `files.content`. El endpoint es `/v1/images/generations` o `/v1/images/edits`. El cuerpo de cada línea es el mismo objeto que el adaptador de Images habría enviado, sin `stream`.

`map-error.ts` clasifica:

- 401 → `AuthError`
- 429 y 5xx → `ApiError` reintentable
- `error.code === "moderation_blocked"` o `error.type === "image_generation_user_error"` → `ModerationError` o `UsageError`, no reintentable
- cuota → `ApiError` no reintentable
- el request id se guarda en el error y en el log

`redact.ts` sustituye cualquier cadena que coincida con el valor de `OPENAI_API_KEY` por `[redacted]` antes de loguear. También enmascara `sk-` seguido de caracteres. Los logs no imprimen cuerpos base64 completos en nivel info; en debug imprimen longitud y sha256.

## Configuración

Archivos:

- Global: `$XDG_CONFIG_HOME/oaiimage/config.yaml` o, si `XDG_CONFIG_HOME` no está, `~/.config/oaiimage/config.yaml`. En Windows, `%APPDATA%/oaiimage/config.yaml`.
- Proyecto: `<root>/.oaiimage/config.yaml`, donde `root` es el directorio que contiene `.oaiimage/` al caminar desde `cwd` hacia arriba, como máximo hasta el filesystem root. `project init` crea esa carpeta.
- No se lee la clave desde esos archivos.

Precedencia, de mayor a menor:

1. Flags del comando.
2. Variables `OAIIMAGE_*` y, para la clave, `OPENAI_API_KEY`.
3. Config del proyecto.
4. Config global.
5. Defaults de `config/defaults.ts`.

Variables de entorno de producto: `OAIIMAGE_MODEL`, `OAIIMAGE_SIZE`, `OAIIMAGE_QUALITY`, `OAIIMAGE_FORMAT`, `OAIIMAGE_BACKGROUND`, `OAIIMAGE_OUTPUT_DIR`, `OAIIMAGE_COUNT`, `OAIIMAGE_CONCURRENCY`, `OAIIMAGE_BUDGET_USD`, `OAIIMAGE_RETRIES`, `OAIIMAGE_TIMEOUT_MS`, `OAIIMAGE_API_MODE`, `OAIIMAGE_RESPONSES_MODEL`.

Defaults de producto:

| Clave | Valor | Motivo |
| --- | --- | --- |
| `model` | `gpt-image-2.5-flare` | Guía de prompting para un flujo nuevo orientado a latencia. |
| `size` | `auto` | Default documentado de los GPT Image que aceptan sizing automático. |
| `quality` | `auto` | Default documentado. |
| `format` | `png` | Default documentado. |
| `background` | `auto` | Default documentado. |
| `compression` | ausente | El esquema aplica 100 solo en jpeg/webp. No se envía en png. |
| `count` | `1` | Default de la API. |
| `concurrency` | `2` | Límite local. No es un parámetro de la API. El tier Build publica 20 IPM; 2 deja margen. |
| `budgetUsd` | ausente | Sin tope hasta que el usuario lo fije. |
| `retries` | `3` | Solo errores transitorios. |
| `timeoutMs` | `180000` | La guía dice que un prompt complejo puede tardar hasta 2 minutos. 180 s es margen del cliente, no un timeout publicado por OpenAI. |
| `apiMode` | `images` | La spec lo marca como modo principal. |
| `responsesModel` | `gpt-5.5` | Está en la lista de la guía de herramienta. |
| `outputDir` | `./output` | Relativo al cwd, creado al escribir. |
| `prompt.optimizeModel` | ausente | Optimize permanece disabled hasta que se configure. |
| `typography.reviewModel` | ausente | La revisión visual permanece disabled hasta que se configure. |

`config init` escribe el global si no existe, sin clave. `config set` escribe en el proyecto si existe `.oaiimage`, si no en el global, salvo `--global`. `config reset` borra el archivo elegido después de confirmación. `config get` y `config list` imprimen la configuración efectiva y, con `--json`, también de qué capa vino cada clave.

Si un archivo de config contiene `apiKey`, `OPENAI_API_KEY` o `openai_api_key`, la carga lanza `ConfigError` y no continúa. No borra el archivo sola.

Formatos aceptados al leer prompts y batches: JSON, YAML, CSV y JSONL según el comando. La config de producto es YAML. `config set --file` también acepta JSON con las mismas claves.

## Errores y códigos de salida

| Código | Clase | Cuándo |
| --- | --- | --- |
| 0 | — | Éxito, incluido un dry-run válido. |
| 1 | `AppError` no clasificado | Fallo inesperado. El mensaje no lleva stack en el modo normal. `--debug` sí. |
| 2 | `UsageError` | Argumentos, prompt vacío, `n` fuera de 1–10, formato imposible, overwrite sin `--force` en no interactivo. |
| 3 | `ConfigError` | Config ilegible o con un secreto. |
| 4 | `AuthError` | Falta `OPENAI_API_KEY` o la API responde 401. |
| 5 | `ApiError` | Error de API que no es moderación, tras agotar reintentos si eran transitorios. |
| 6 | `ModerationError` | `moderation_blocked`. Mensaje genérico en stdout/stderr de usuario. Detalle en el log de debug. |
| 7 | `BudgetError` | La estimación supera el presupuesto, falta `--confirm-cost` en no interactivo, o se alcanza `--max-requests`. |
| 8 | `CancelledError` | SIGINT o SIGTERM. Lo ya escrito se conserva. Los temporales se borran. |
| 9 | `PartialFailureError` | Un batch o un `--count` múltiple terminó con algún fallo y algún éxito. El JSON lista ambos. |
| 10 | `PathSecurityError` | Path traversal, symlink fuera de la raíz permitida, o magic bytes que no coinciden. |
| 11 | `CapabilityError` | Parámetro o comando disabled / UNKNOWN para ese modelo. |

`UsageError` de validación local de máscara (dimensiones, alfa, 4 MB) es código 2. Si el modelo no admite máscara, es código 11.

Stderr lleva el log humano. Con `--json`, stdout es un único JSON. Los errores `--json` usan stdout `{"ok":false,"code":N,"error":"..."}` y el código de proceso correspondiente. Los logs de Pino siguen en stderr.

## Seguridad

- Pino no recibe el objeto de entorno ni el cliente de OpenAI.
- Rutas de entrada y salida se resuelven con `path.resolve`. La salida tiene que quedar dentro del directorio de salida efectivo o de una ruta explícita que el usuario pasó y que, tras resolver, no escape mediante `..` de una raíz distinta de la que el propio flag nombró. Se rechaza un symlink cuyo realpath salga de esa raíz.
- Magic bytes: PNG `89 50 4E 47`, JPEG `FF D8 FF`, WEBP `RIFF` + `WEBP` en el offset 8. La extensión no basta. GIF y otros se rechazan.
- Límite de imagen de entrada: 50 MB. Límite de máscara: 4 MB. Se comprueba el tamaño antes de leer el archivo entero a memoria cuando sea posible (`stat`).
- Temporales en `os.tmpdir()/oaiimage-<pid>/`, borrados en `finally` y en la cancelación. La escritura final es: escribir `archivo.tmp` en el mismo directorio, `fsync`, `rename`.
- No hay fetch del CLI hacia URLs de usuario. Un argumento `http://` o `https://` en `--image` termina en código 11 con el motivo “la descarga remota está deshabilitada”.
- Backoff exponencial con jitter, base 500 ms, tope 8 s, como máximo `retries` intentos, solo en 429 y 5xx. Si la respuesta trae `retry-after` numérico, se respeta ese valor cuando es menor de 60 s. No se reintenta 400, 401, 403 ni moderación.
- `AbortSignal` del proceso se pasa al SDK. Al abortar, no se relanza el request.
- Los mensajes de moderación hacia el usuario salen genéricos. `moderation_details` solo en log debug.

## Observabilidad y DX

- Niveles: `--quiet` (warn), default info, `--verbose` debug. `--debug` es alias de verbose más stack.
- `--json` implica que el spinner y la barra no se dibujan.
- Sin `--json` y con TTY: spinner de `ora` durante la llamada y, en batch local, barra de `cli-progress`.
- Nombres automáticos: `{yyyyMMdd-HHmmss}-{model}-{shortid}.{ext}` dentro de `outputDir`. `shortid` son 8 hex del sha256 del prompt más el reloj inyectable. Los tests inyectan el reloj.
- Sobrescritura: si el destino existe, en TTY se pregunta; sin TTY falla con código 2 salvo `--force`.
- Ayuda: cada comando tiene dos ejemplos en el texto de Commander.
- Autocompletado: se genera un script estático `completions/oaiimage.bash` y `completions/oaiimage.zsh` con los nombres de comando, no un runtime de shell embebido. Si un generador no puede listar los modelos sin arrancar red, la lista sale del registro local.
- SIGINT/SIGTERM registrados una sola vez en `main.ts`.

## Presupuesto

`BudgetPolicy`: `maxCostUsd?`, `maxRequests?`, `budgetUsd?` de sesión y de proyecto. El ledger local `costs/ledger.ts` suma USD reales cuando hay `usage` y estimaciones marcadas cuando no. Antes de cada llamada de red:

- Si es dry-run, no llama y devuelve la estimación.
- Si el proceso no es TTY y no están `--confirm-cost` ni `--force` ni un `--max-cost` que cubra la estimación, sale 7. `--yes` no existe; la confirmación explícita es `--confirm-cost`.
- Si es TTY, muestra el rango y pregunta. Una estimación `unknown` también pregunta, y en no interactivo exige `--confirm-cost`.
- Si la suma del ledger más la estimación supera `budgetUsd` de la sesión o del proyecto, sale 7.

## Proyectos y galería

`project init` crea `.oaiimage/config.yaml`, `.oaiimage/manifest.json` y `.oaiimage/sessions/`. El manifiesto lista imágenes con su `ImageMetadata`. `gallery list` lee el manifiesto. `gallery export` escribe una hoja de contacto PNG con Sharp y, con `--html`, un HTML estático autónomo que referencia las imágenes por ruta relativa. Ese HTML no incluye la clave ni scripts remotos.

## Qué no entra en el diseño

- No hay servidor HTTP.
- No hay base de datos.
- No hay telemetría saliente.
- No hay login de OpenAI aparte de la variable de entorno.
- No hay publicación a npm desde los scripts `build` o `test`.
