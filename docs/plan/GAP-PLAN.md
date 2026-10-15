# Plan de huecos

Fecha: 2026-10-15. Este documento no cambia código. Compara el árbol y el comportamiento pedidos en [ARCHITECTURE-PLAN.md](./ARCHITECTURE-PLAN.md), [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) y [CAPABILITY-MATRIX.md](./CAPABILITY-MATRIX.md) con el código de la rama `cursor/openai-image-cli-plan-30b7`.

Regla de cierre de cada tarea: no se marca hecha si el criterio de aceptación no pasa. No se inventan parámetros de API. Lo que la matriz deja en `disabled` sigue saliendo con código 11.

## Cómo se leyó el código

- Servicios locales de media, máscara y prompt **existen** y tienen tests unitarios parciales.
- El CLI **no expone** gran parte de esos servicios.
- Varios flags de la fase 15 están declarados en Commander y **no se aplican** en el handler.
- `src/cli/options/` y `src/cli/interactive/` **no existen**.
- No hay E2E de `session edit`.

## Inventario

| ID | Hueco | Capa | Estado actual |
| --- | --- | --- | --- |
| G1 | `media crop rotate compress composite watermark metadata thumbnail contact-sheet` | CLI | Métodos en `SharpMediaProcessor`. CLI solo `inspect`, `resize`, `convert`, `compare`. |
| G2 | `prompt create`, `prompt inspect`, `prompt save` | CLI | `PromptEngine.save` y `create` existen. CLI solo `templates`, `build`, `validate`, `optimize`. |
| G3 | Operaciones de máscara en CLI | CLI | `MaskManager` cubre inspect, preview, invert, union, intersect, dilate, erode, blur, rect y polygon. Ningún comando las llama. |
| G4 | Carpeta `interactive/` y modo TTY | CLI | No hay wizard. `generate` sin prompt sale 2 también en TTY. `--json` no tiene un guardia central que prohíba preguntas. |
| G5 | Flags de `generate` a medias | CLI | `--stdin` no lee stdin. `--max-requests` no entra en el presupuesto. `--compression` solo si el string es truthy. `--save-partials` se copia al request, pero no hay E2E del bin que lo ejercite. |
| G6 | Flags de edición y referencias | CLI | `--image` y `--preserve` no son repetibles. No hay `--references path:role`. `compose` admite una sola imagen. |
| G7 | Verificación literal de 24 plantillas y 20 estilos | Tests | Los arrays tienen 24 y 20 entradas. El test no compara cada objetivo ni cada frase con el texto del plan. `--var` solo normaliza `objective` y `palette`. |
| G8 | E2E de `session edit` | Tests | El comando existe. No hay prueba de bin. |
| G9 | Ayuda con dos ejemplos | CLI | Solo algunos comandos llaman a `addHelpText`. La fase 15 lo exige en todos. |
| G10 | Prompts de archivo y stdin | CLI | `--prompt-file` vuelca el archivo entero. No distingue `.txt`/`.md` de JSON/YAML estructurado. |
| G11 | Tipografía | CLI | Faltan texto secundario, jerarquía, idioma, estilo, composición y colores. Sin `--exact` el comando sale 11 aunque el usuario solo quiera meter el texto en el prompt. |
| G12 | `expand`, `compose`, `style`, `background` | CLI | `expand` y `compose` fijan `dryRun: false`. No reenvían `--model`, `--api-mode`, `--confirm-cost`, `--force`. |
| G13 | Batch en el CLI | CLI | `run`, `status`, `retry` y `export` no reciben `--mode`. El modo openai del servicio no se selecciona desde esos subcomandos. |
| G14 | `doctor` | CLI | `secretInFiles` va fijo a `absent`. No recorre los YAML de config. `bin` va fijo a `ok`. |
| G15 | Presupuesto y spinners | CLI | `ora` y `cli-progress` están en dependencias y no se usan. `--quiet`/`--verbose` no cambian el logger. |
| G16 | `src/cli/options/` | Estructura | Los flags viven dentro de cada comando. La arquitectura pide módulos de opciones compartidos. |
| G17 | Ejemplos de la fase 16 | Docs | Faltan archivos de entrada en `examples/masks`, `references`, `typography`, `sessions` y `projects`. Varios README no dicen `OAIIMAGE_LIVE=1`. |
| G18 | Documentación de usuario | Docs | `docs/COMMANDS.md` y varios guías son un párrafo. `README.md` está en inglés. El plan pide español y la lista de códigos de salida. |
| G19 | Completions | DX | El script bash lista comandos de primer nivel y no los subcomandos de media, máscara, prompt ni los ids de modelo. |
| G20 | Declaraciones de tipos del paquete | Build | `pnpm build` usa `tsup --no-dts`. `package.json` publica `dist` sin `.d.ts`. |
| G21 | `session edit` sin imagen ni `responseId` | Servicio | Si la sesión Responses no tiene imagen previa, el comando hace `generate` y no deja constancia `fallback` en un edit. El plan pide fallback con el archivo guardado cuando falta `responseId`. |
| G22 | `config set --file` | CLI | No existe. El plan acepta JSON con las mismas claves que el YAML. |
| G23 | Galería y proyecto | CLI | `gallery inspect` no recibe ruta. `project list` no documenta el rechazo de symlinks. Falta E2E de `gallery export --html`. |
| G24 | `restore` / `enhance` | CLI | Con `--prompt` el comando no llama a edit. Sale 11 siempre que hay prompt, en lugar de un edit generativo etiquetado. |
| G25 | Variaciones | CLI | No avisa en stderr de que el resultado no es determinista y no reutiliza generate/edit con dry-run y presupuesto. |

Lo que **sí** está y no entra como hueco de producto: registro de modelos, validador de capacidades, adaptadores Images/Responses/Batch sin `createVariation`, costes con `unknown` para Sunburst/Flare, cola local de batch, proyectos, HTML de galería, tests unitarios de máscara y media a nivel de servicio, CI de tres sistemas y workflow de publicación apagado.

## Tareas

### G1 — Comandos de media que faltan

Archivos: `src/cli/commands/media.ts`, opcional `src/cli/options/media.ts`, `tests/e2e/media-commands.test.ts`, `docs/COMMANDS.md`.

Comandos, todos locales y sin `OPENAI_API_KEY`:

- `media crop <input> <output> --left --top --width --height`
- `media rotate <input> <output> --degrees`
- `media compress <input> <output> --quality`
- `media composite --layer <path>` repetible y `--output`
- `media watermark <input> <output> --text`
- `media metadata <path>` como alias de inspect que imprime `ImageMetadata`
- `media thumbnail <input> <output> --max-edge`
- `media contact-sheet --image <path>` repetible y `--output`

Cada uno: `.description` y dos ejemplos en `addHelpText`.

Criterio: cada comando sale 0 sobre un PNG generado con Sharp en el test. `crop` cambia ancho y alto. `rotate` 90 intercambia dimensiones en un rectángulo no cuadrado. `compress` escribe JPEG y `sniff` devuelve `jpeg`. `watermark` deja un PNG cuyo tamaño es mayor que 0 y no modifica el sha256 de la entrada. `contact-sheet` con dos imágenes produce un archivo. Una ruta `../` fuera del directorio de salida sale 10.

Pruebas: `tests/e2e/media-commands.test.ts` arranca `dist/cli.js`. Un caso en `tests/unit/media.test.ts` solo si el servicio aún no cubre composite o watermark; si ya pasa, no duplicar la aserción de Sharp.

### G2 — `prompt create`, `inspect`, `save`

Archivos: `src/cli/commands/prompt.ts`, `src/cli/interactive/wizard.ts` (lo usa G4), `src/services/prompting/engine.ts` solo si `inspect` necesita listar un archivo guardado, `tests/e2e/prompt-commands.test.ts`.

- `prompt create`: sin TTY exige flags de campos o sale 2. Con TTY y sin `--json` puede preguntar. Con `--json` no pregunta.
- `prompt inspect <name>`: lee el archivo que escribió `save` e imprime el texto. Nombre desconocido sale 2.
- `prompt save <name>`: lee `--text` o stdin y delega en `PromptEngine.save`. El directorio de pruebas se inyecta; el test no escribe en el home real. Si hoy `save` usa `os.homedir()` fijo, el criterio incluye un argumento `promptsDir` en el constructor o en el método, sin cambiar el texto generado.

Criterio: `create` con `--var subject=taza` imprime una línea `Sujeto: taza`. `save` + `inspect` devuelven el mismo cuerpo. `inspect` de un nombre ausente sale 2.

Pruebas: `tests/e2e/prompt-commands.test.ts` con `HOME` o `XDG_CONFIG_HOME` apuntando a un temporal.

### G3 — Máscaras en el CLI

Archivos: `src/cli/commands/mask.ts` (nuevo), registro en `src/cli/program.ts`, `completions/oaiimage.bash`, `completions/oaiimage.zsh`, `tests/e2e/mask-commands.test.ts`, `examples/masks/README.md` y un PNG de máscara generado en el test, no hace falta binario grande en git.

Subcomandos: `mask inspect`, `mask preview`, `mask invert`, `mask union`, `mask intersect`, `mask dilate`, `mask erode`, `mask blur`, `mask rect`, `mask polygon`.

Flags mínimos: `--image` para la base en inspect y preview, `--mask` repetible en union e intersect, `--radius` en dilate, erode y blur, `--output`, `--x --y --width --height` en rect, `--points x,y;x,y` en polygon, `--invert` solo como paso explícito en rect y polygon.

Criterio: JPEG de máscara sale 2. PNG sin alfa sale 2. Dimensiones distintas a la base salen 2. Un PNG 2×2 con un píxel transparente, tras `dilate --radius 1`, deja editables los cuatro píxeles (alfa 0). `preview` escribe otro archivo y no sustituye la máscara de entrada. Ningún comando llama a la red: el test borra `OPENAI_API_KEY`.

Pruebas: `tests/e2e/mask-commands.test.ts`. Los tests de `tests/unit/mask.test.ts` se quedan como contrato del servicio.

### G4 — `interactive/` y modo interactivo

Archivos: `src/cli/interactive/confirm.ts`, `src/cli/interactive/wizard.ts`, `src/cli/main.ts` o `program.ts` para el guardia de `--json`, `tests/unit/interactive.test.ts`.

Contrato:

- `confirmCost(report, { interactive, json, confirmCost })` no llama a `@inquirer/prompts` si `json` es true o si no hay TTY.
- Sin TTY, sin `--confirm-cost` y con coste `unknown`, el llamador sigue saliendo 7. Eso ya está en el estimador; el módulo nuevo solo decide si preguntar.
- `promptWizard` devuelve un `StructuredPrompt` con las secciones que el usuario rellena. En tests se inyecta un `ask` falso, sin TTY real.
- `generate` sin prompt, sin archivo y sin `--stdin`: si no hay TTY, sale 2. Si hay TTY y no hay `--json`, puede delegar en el wizard. El E2E actual no tiene TTY, así que sigue esperando 2 y no se rompe.

Criterio: un test unitario con `ask` que devuelve `{ subject: "mesa" }` produce `Sujeto: mesa`. Un test con `json: true` no invoca `ask` y lanza `UsageError` si faltan campos.

Pruebas: `tests/unit/interactive.test.ts`. No hace falta E2E de TTY.

### G5 — Flags de `generate` que no hacen efecto

Archivos: `src/cli/commands/generate.ts`, `src/cli/options/generate.ts`, `tests/e2e/cli.test.ts`.

- `--stdin` lee `process.stdin` hasta EOF y ese texto es el prompt. Un test puede usar `spawn` con `input`, no `spawnSync` vacío.
- `--max-requests` pasa a `BudgetPolicy.maxRequests`. Un valor menor que `count` sale 7 antes de red. En dry-run no llama al provider; el test puede afirmar el código 7 si el presupuesto se evalúa también en dry-run, o 0 si el plan mantiene dry-run exento. Decisión fija para esta tarea: dry-run no aplica el tope de peticiones, igual que no aplica el tope de dólares hoy. El test de no-dry-run usa el fake solo si se añade un bin de test; si no, un test de integración del handler no es obligatorio y basta un unit del objeto `BudgetPolicy` construido por una función pura `budgetFromFlags`.
- `--compression 40` con `--format jpeg` aparece en el payload de dry-run. Con png no se envía `output_compression`.
- `--save-partials` sigue en el request. El E2E de streaming puede seguir en el servicio; aquí se añade un dry-run JSON que muestra `savePartials: true`.

Criterio: los cuatro casos anteriores salen con el código indicado y el JSON de dry-run contiene el campo.

Pruebas: ampliar `tests/e2e/cli.test.ts`.

### G6 — Edición, preserve y roles

Archivos: `src/cli/commands/edit.ts`, `src/cli/options/edit.ts`, `src/services/references/manager.ts` si el parser de `path:role` no vive en el CLI, `tests/e2e/edit-flags.test.ts`, `tests/integration/editing.test.ts` si el cuerpo aún no se espía desde el bin.

- `--image` repetible en `edit`, `inpaint` y `compose`.
- `--preserve` repetible. Cada valor entra en `preserve[]` y el servicio lo pone en la sección Conservar del prompt, no en el cuerpo del provider.
- `--references` con sintaxis `path:role` y, en paralelo, `--image` + `--role` cuando hay una sola imagen. Rol desconocido sale 2.
- `compose` con dos `--image` y roles distintos arma dos `ImageReference` en orden.

Criterio: dry-run JSON de `edit` con dos `--preserve` incluye ambos textos en el prompt y el payload no tiene clave `preserve`. Diecisiete referencias salen 11 por el máximo del modelo. Un JPEG llamado máscara sigue fuera de este comando.

Pruebas: `tests/e2e/edit-flags.test.ts` con dry-run para no usar red. El test de integración existente de `preserve` se mantiene.

### G7 — Plantillas y estilos verificados

Archivos: `src/services/prompting/engine.ts` (`normalizeVarKey`), `tests/unit/prompt.test.ts`. No se cambian los textos de `src/templates/prompt-templates.ts` ni `style-templates.ts` si ya coinciden con el plan.

El test debe:

- Listar los 24 ids en el orden del plan y comparar `defaultObjective` carácter a carácter.
- Comparar las 20 frases de estilo carácter a carácter, incluidos `oil-painting`, `3d-render` y `technical-illustration`.
- Recorrer las 22 secciones con un campo cada una y afirmar el orden de las etiquetas.
- Aceptar `--var` / `vars` para cada clave de sección, con alias `color-palette` → Paleta y `camera-angle` → Ángulo de cámara. Clave `no-existe` lanza `UsageError`.

Criterio: `pnpm test tests/unit/prompt.test.ts` pasa y falla si alguien edita una frase.

Pruebas: solo `tests/unit/prompt.test.ts`.

### G8 — E2E de `session edit`

Archivos: `tests/e2e/session-edit.test.ts`, y `src/cli/commands/session.ts` solo si el fallback no cumple G21.

Flujo, sin red:

1. `session create` con el config por defecto. El id sale en stdout o en `--json`.
2. Sembrar en el almacén una iteración con `outputPaths` y sin `responseId`, o usar el JSON de la sesión en el directorio temporal si `create` no acepta semilla. El test puede escribir el JSON que `FileSessionStore` lee, bajo `XDG` o bajo `.oaiimage/sessions` del cwd temporal.
3. `session edit <id> --prompt "más luz" --dry-run --json` sale 0, `dryRun: true`, y no abre sockets. El prompt del resultado contiene el texto nuevo.
4. Segunda pasada con un `responseId` sembrado: el dry-run del modo `responses` incluye `previous_response_id` en el payload y no marca la corrida como si hubiera inventado el id.
5. Sin `--prompt` sale 2.

Criterio: el test no define `OAIIMAGE_LIVE`. El proxy `127.0.0.1:9` sigue puesto, como en `tests/e2e/cli.test.ts`.

Pruebas: `tests/e2e/session-edit.test.ts`.

### G9 — Dos ejemplos de ayuda

Archivos: todos los `src/cli/commands/*.ts`.

Criterio: un test lee `node dist/cli.js <comando> --help` para la lista de la fase 15 y exige que el texto contenga `Examples:` y al menos dos líneas que empiecen por `oaiimage` o `$ oaiimage`. Comandos agrupados (`media`, `mask`, `session`, `batch`, `config`) se comprueban en el subcomando, no solo en el padre.

Pruebas: `tests/e2e/help-examples.test.ts`.

### G10 — Archivos de prompt

Archivos: `src/cli/commands/generate.ts`, un lector `src/cli/options/prompt-input.ts`, `tests/e2e/prompt-file.test.ts`.

- `.txt` y `.md`: el fichero es el prompt entero.
- `.json` y `.yaml`: objeto de prompt estructurado que pasa por `PromptEngine.create` o `build`.
- `--prompt` y `--prompt-file` juntos: gana `--prompt` y stderr contiene un aviso.
- `--stdin` gana solo si no hay `--prompt`.

Criterio: un YAML con `subject: taza` produce un prompt que contiene `Sujeto: taza` en el dry-run. Un `.txt` con dos líneas se conserva.

Pruebas: `tests/e2e/prompt-file.test.ts`.

### G11 — Tipografía completa

Archivos: `src/cli/commands/typography.ts`, `src/core/interfaces/media-options.ts` si faltan campos en `TypographySpec`, `src/media/processor.ts` (`overlaySvgText`), `tests/e2e/typography.test.ts`.

Flags: `--primary`, `--secondary`, `--hierarchy`, `--language`, `--style`, `--composition`, `--colors`, `--review`, `--exact`, `--image`, `--output`.

- `--exact` compone SVG con el texto principal y, si viene, el secundario escapado. No llama a la API.
- Sin `--exact` y sin `--review`, el comando construye un prompt y hace `generate` o `edit` en dry-run si `--dry-run` está. No sale 11 por falta de modelo de revisión.
- `--review` sin `typography.reviewModel` sale 11.

Criterio: `--exact` sobre un PNG pequeño escribe otro PNG y el SVG intermedio, si el procesador lo expone en test unitario, contiene el texto. El E2E puede limitarse a exit 0 y a que el archivo de salida exista.

Pruebas: `tests/e2e/typography.test.ts` y el unitario de overlay ya existente si hace falta afirmar el secundario.

### G12 — `expand`, `compose`, `style`, `background`

Archivos: `src/cli/commands/edit.ts`, `style.ts`, `background.ts`, `tests/e2e/pipeline-flags.test.ts`.

- `--dry-run` en `expand` y `compose` se respeta. Hoy está forzado a false.
- `--model`, `--format`, `--confirm-cost`, `--force` se reenvían igual que en `generate`.
- `style --style photorealistic --dry-run` sale 0 y el prompt contiene la frase de esa plantilla.
- `style --style no-such` sale 2.
- `transparent --format jpeg` sale 11.
- `background remove --method local` sale 11.

Criterio: dry-run no incrementa llamadas. El test de bin usa `--dry-run --json` y un PNG temporal cuando el comando exige `--image`.

Pruebas: `tests/e2e/pipeline-flags.test.ts`.

### G13 — Modo de batch en todos los subcomandos

Archivos: `src/cli/commands/batch.ts`, `src/services/batch/index.ts` si el CLI no puede elegir la implementación openai, `tests/e2e/batch-cli.test.ts`.

`create`, `run`, `status`, `retry` y `export` aceptan `--mode local|openai`. El default sigue `local`. `openai` sin clave sale 4. Un modelo con `batchImages: false` sale 11 antes de subir. El JSONL de un dry-run local no contiene `stream`.

Criterio: `batch create` de un JSONL de una línea en un temporal sale 0 en modo local y escribe el manifiesto con `mode: local`. `retry` no vuelve a poner en `pending` un ítem `succeeded`. Ese último caso puede seguir cubierto por `tests/unit/batch-manifest.test.ts`; el E2E comprueba el código de salida del CLI.

Pruebas: `tests/e2e/batch-cli.test.ts`.

### G14 — `doctor` de verdad

Archivos: `src/cli/commands/doctor.ts`, `tests/e2e/cli.test.ts`.

El informe incluye versión de Node, una comprobación real de que `dist/cli.js` existe cuando se ejecuta el bin construido, la config efectiva, `secretInFiles` calculado leyendo el YAML del proyecto y el global de test, `openaiApiKey` como `present` o `missing` sin caracteres de la clave, y `organization: not-checked`.

Criterio: un YAML de proyecto con `apiKey` hace que `doctor` salga 3, igual que la carga de config, o que el informe marque el secreto y salga 3. No imprime `sk-test`. El test actual de `--json` en stdout se mantiene.

Pruebas: ampliar `tests/e2e/cli.test.ts`.

### G15 — Presupuesto visible y logs

Archivos: `src/cli/interactive/confirm.ts`, `src/utils/logger.ts`, `src/cli/main.ts`, `src/cli/commands/batch.ts`, `tests/unit/interactive.test.ts`.

- Con TTY, sin `--json`, una estimación `unknown` pregunta antes de red. En test, el preguntador es un doble.
- Sin TTY y sin `--confirm-cost`, sale 7. Ya cubierto en coste; el CLI de `generate` sin dry-run debe usar esa función. Hoy `generate` sin clave sale 4 antes del presupuesto. Orden fijo: validar capacidad, estimar, y si no es dry-run exigir clave y luego presupuesto. Un test con clave falsa y proxy cerrado puede recibir 5 o 7 según el orden. El criterio de esta tarea es: coste `unknown`, no TTY, sin `--confirm-cost`, con clave presente, sale 7 **sin** abrir red. Para lograrlo el presupuesto se evalúa antes de construir el cliente. Si el código actual llama al provider igual, esta tarea lo corrige.
- `--quiet` no escribe info. `--verbose` sube el nivel. Los logs siguen en stderr.
- La barra de `cli-progress` solo en `batch run` local, y no se dibuja con `--json`.

Criterio: un generate no dry-run con clave y sin `--confirm-cost` sale 7 y el test de integración del servicio no cuenta llamadas al fake. El E2E puede usar el bin si el cliente no se construye antes del presupuesto.

Pruebas: `tests/e2e/budget.test.ts` y el unitario de G4.

### G16 — Módulos `options/`

Archivos nuevos: `src/cli/options/global.ts`, `generate.ts`, `edit.ts`, `mask.ts`, `batch.ts`, `cost.ts`. Los comandos importan esas funciones y dejan de repetir el objeto de request.

Criterio: `generate` y `edit` construyen el request con la misma función que usa el test unitario `tests/unit/options.test.ts`. Un flag desconocido no se añade al cuerpo del provider.

Pruebas: `tests/unit/options.test.ts` para el mapeo de flags. No cambia el contrato de la API.

### G17 — Ejemplos

Archivos bajo `examples/`:

- `masks/`: README de hasta diez líneas y un script `make-mask.ts` o instrucciones para generar el PNG en el test, más un YAML que describa el rectángulo. No commitear un binario grande.
- `references/sample.yaml` con dos entradas `path` y `role`.
- `typography/sample.yaml` con texto principal y secundario.
- `sessions/sample.json` de una sesión sin clave.
- `projects/config.sample.yaml` sin secretos.

Cada README dice que la ejecución real exige `OAIIMAGE_LIVE=1` y que CI no la lanza.

Criterio: `git grep -n sk- examples` no encuentra una clave. Cada carpeta de la fase 16 tiene README y un archivo de entrada.

Pruebas: no hace falta un test de runtime. Un test opcional `tests/unit/examples.test.ts` lista los directorios y falla si falta el README.

### G18 — Documentación de usuario en español

Archivos: `README.md`, `docs/ARCHITECTURE.md`, `docs/COMMANDS.md`, `docs/GENERATION.md`, `docs/EDITING.md`, `docs/MASKING.md`, `docs/REFERENCES.md`, `docs/PROMPTING.md`, `docs/MODELS.md`, `docs/COSTS.md`, `docs/SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`.

`docs/COMMANDS.md` lista cada comando de la fase 15, incluidos los de G1 y G3, y la tabla de códigos 0–11. El resto enlaza `docs/plan/API-RESEARCH.md` y no copia las tablas de precios enteras. `README.md` mantiene instalación local, el aviso de que no está en npm, y tres ejemplos: generate, edit y dry-run.

Criterio: un revisor puede ejecutar los tres ejemplos de dry-run del README sin clave. `CONTRIBUTING.md` sigue prohibiendo `npm publish`.

Pruebas: ninguna automática. La revisión es lectura contra este plan.

### G19 — Completions

Archivos: `completions/oaiimage.bash`, `completions/oaiimage.zsh`, opcional `src/cli/completions.ts` si se generan en el build.

Incluir subcomandos de `media`, `mask`, `prompt`, `session`, `batch`, `config`, `project`, `gallery` y los ids de `models list`.

Criterio: cada id que imprime `models list` aparece en el script. `mask` aparece después de G3.

Pruebas: `tests/unit/completions.test.ts` lee el bash y compara con `ModelRegistry.list()`.

### G20 — Tipos publicados

Archivos: `tsup.config.ts`, `package.json` script `build`.

Quitar `--no-dts` cuando `tsc` 7 y tsup puedan emitir `.d.ts`. Si el emisor sigue roto, el criterio alternativo es un `tsc --emitDeclarationOnly` aparte cuyo `outDir` sea `dist`, documentado en el mensaje de commit. No bajar de TypeScript.

Criterio: `dist/index.d.ts` existe y exporta `createImageCli`. `pnpm pack` lo incluye si `files` contiene `dist`.

Pruebas: `tests/e2e/bin.test.ts` puede afirmar que el archivo de tipos existe después del build, o un paso del script de test que falle si falta. El shebang de `dist/cli.js` se mantiene.

### G21 — Fallback de sesión

Archivos: `src/cli/commands/session.ts`, `src/services/sessions/store.ts` si hace falta guardar la última imagen, `tests/e2e/session-edit.test.ts`.

Si `apiMode` es `responses` y la iteración padre no tiene `responseId` pero sí `outputPaths`, `session edit` llama a edit con esa imagen y la iteración nueva, cuando no es dry-run, guarda `source: "fallback"`. No escribe un `responseId` inventado. Si no hay imagen ni id, sale 2.

Criterio: el E2E de G8 cubre el dry-run. Un test unitario de una función pura `nextSessionCall({ parent, prompt })` devuelve `{ kind: "edit", source: "fallback" }` o `{ kind: "responses", previousResponseId }`.

Pruebas: `tests/unit/session.test.ts` más el E2E de G8.

### G22 — `config set --file`

Archivos: `src/cli/commands/config.ts`, `src/config/load.ts` si el parser JSON no está, `tests/unit/config.test.ts`.

`config set --file ./cfg.json` acepta el mismo esquema que el YAML. Una clave `apiKey` dentro del archivo sale 3 y el mensaje no incluye el valor.

Criterio: el test de config ya rechaza YAML con `apiKey`; se añade el mismo caso con JSON.

Pruebas: `tests/unit/config.test.ts` y un E2E corto en `tests/e2e/cli.test.ts`.

### G23 — Galería

Archivos: `src/cli/commands/gallery.ts`, `tests/e2e/gallery.test.ts`.

`gallery export <dir> --html` escribe `gallery.html` sin `http://` y sin la cadena `OPENAI`. `gallery list` no sigue un symlink que salga del cwd.

Criterio: el HTML del temporal cumple esas dos ausencias. El unitario `tests/unit/gallery.test.ts` puede seguir siendo el contrato del servicio; el E2E cubre el bin.

Pruebas: `tests/e2e/gallery.test.ts`.

### G24 — `restore` y `enhance` con prompt

Archivos: `src/cli/commands/transform.ts`, `src/services/editing/service.ts` solo si falta un método que marque el resultado, `tests/e2e/transform.test.ts`.

Sin `--prompt`, ambos salen 11. Con `--prompt` y `--image` hacen un edit generativo. El JSON incluye un aviso de que no se recupera detalle ausente en la entrada. La ruta de entrada conserva su sha256. `--dry-run` no llama al provider.

Criterio: el E2E con dry-run sale 0 y el sha256 de la entrada no cambia. Sin prompt sale 11.

Pruebas: `tests/e2e/transform.test.ts`.

### G25 — `variations`

Archivos: `src/cli/commands/variations.ts`, `tests/e2e/variations.test.ts`.

`--prompt` es obligatorio. Sin él, sale 2. Con imagen, el camino es edit. Sin imagen, generate. Stderr, cuando no hay `--json`, dice que no existe un endpoint de variaciones y que el resultado no es determinista. El código no contiene `createVariation` ni `/images/variations`.

Criterio: dry-run con prompt sale 0. Sin prompt sale 2. `rg createVariation src` sigue vacío de usos.

Pruebas: `tests/e2e/variations.test.ts`.

## Orden

1. G7 y G16, porque fijan textos y el armado de requests.
2. G5, G6, G10, G12, G22.
3. G1, G2, G3, G11.
4. G4 y G15, que cuelgan del wizard.
5. G21 y G8.
6. G13, G14, G23, G24, G25, G9.
7. G17, G18, G19.
8. G20 al final, porque el emisor de tipos puede seguir fallando con TypeScript 7 y no debe bloquear el resto.

Cada paso termina con `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` y `pnpm test:e2e`. No se publica el paquete.

## Fuera de este plan

- No se reabre la investigación de API.
- No se habilita descarga de URLs ni segmentación local.
- No se cambia el default `gpt-image-2.5-flare` ni `apiMode: images`.
- `engines.node` en `>=22.12.0` se deja como desviación ya anotada. El CI sigue en Node 24. No es un hueco de comando.
