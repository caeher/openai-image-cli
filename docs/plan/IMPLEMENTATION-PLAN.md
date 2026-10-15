# Plan de implementación

Este plan lo ejecuta otro implementador, en orden, sin saltarse el criterio de aceptación de una fase. No publica el paquete. No llama a la API real en CI. No marca como hecho nada que la matriz deje en `disabled`.

## De dónde sale el orden

El encargo pide seguir la sección 32 de la especificación. El texto entregado es un resumen fiel y **no incluye una sección numerada 32** ni en el repositorio ni en el mensaje. No se inventa esa numeración. El orden de abajo es el orden de dependencias de los módulos que el resumen sí exige: cimientos, contrato de la API investigada, servicios locales, servicios de red, comandos, pruebas y CI. Son **16 fases**. Se ejecutan de la 1 a la 16.

Regla de cada fase: al terminarla, los comandos de su criterio de aceptación pasan. Una fase no deja tests fallando a propósito. Los archivos que aún no existen no se importan.

## Versiones congeladas el 2026-10-15

Se instalan exactamente estas versiones. No se usan rangos `^` ni `latest`.

Runtime y paquete:

| Paquete | Versión | Rol |
| --- | --- | --- |
| node | 24.22.0 LTS Krypton | `engines.node`: `>=24.22.0` |
| pnpm | 12.11.2 | `"packageManager": "pnpm@12.11.2"` |
| openai | 7.34.0 | SDK oficial. `engines` declara `node >= 22`. |
| commander | 15.0.0 | CLI |
| zod | 4.6.7 | El SDK acepta `zod ^3.25 \|\| ^4.0`. Se usa la API de Zod 4. |
| @inquirer/prompts | 8.7.3 | Preguntas en TTY |
| sharp | 0.35.5 | Imagen local. `engines.node >= 20.9.0` |
| pino | 10.4.0 | Logs a stderr |
| yaml | 2.9.1 | Config y prompts |
| ora | 9.4.1 | Spinners |
| cli-progress | 3.12.0 | Barras. Si no trae tipos, declaración mínima local. |
| picocolors | 1.1.1 | Color. Se apaga si `NO_COLOR` está o stdout no es TTY. |

Desarrollo:

| Paquete | Versión |
| --- | --- |
| typescript | 7.0.2 |
| @types/node | 24.19.2 |
| tsup | 9.0.0 |
| vitest | 5.0.4 |
| eslint | 10.12.0 |
| @typescript-eslint/parser | 8.71.2 |
| @typescript-eslint/eslint-plugin | 8.71.2 |
| prettier | 3.9.10 |
| eslint-config-prettier | 10.1.8 |

Vitest 5 exige Node `^22.12.0 || ^24.0.0 || >=26`. El CI se queda en Node 24, dentro de ese rango.

Acciones de GitHub, tags verificados el 2026-10-15: `actions/checkout@v7.0.1`, `actions/setup-node@v7.1.0`, `pnpm/action-setup@v6.1.0`.

Si `tsc` 7.0.2 rechaza un flag de `tsconfig` descrito aquí, se quita ese flag, se anota en el mensaje de commit y se mantiene `"strict": true`. No se baja de versión de TypeScript.

## Fase 1 — Esqueleto

Archivos: `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json`, `.gitignore`, `.env.example`, `src/cli/main.ts`, `src/index.ts`.

`package.json`:

- `"name": "openai-image-cli"`, `"version": "0.0.0"`, `"type": "module"`, `"private": false`.
- `"bin": { "oaiimage": "./dist/cli.js" }`.
- `"files": ["dist", "completions", "README.md"]`.
- `"publishConfig": { "access": "public" }` puede existir. Ningún script llama a `npm publish`.
- Scripts exactos:
  - `"dev": "node --experimental-strip-types src/cli/main.ts"`
  - `"build": "tsup"`
  - `"lint": "eslint ."`
  - `"typecheck": "tsc --noEmit"`
  - `"test": "vitest run"`
  - `"test:e2e": "vitest run --config vitest.e2e.config.ts"`
- Si Node 24.22 ya no acepta `--experimental-strip-types`, `dev` pasa a `node src/cli/main.ts` y el commit lo dice. Se comprueba con `node --help`.

`tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `module` y `moduleResolution` en `NodeNext`, `target` `ES2023`, `rootDir` `src`, `outDir` `dist`, `types` incluye `node`. Incluir `src` y `tests`.

`tsup.config.ts`: entrada `src/cli/main.ts` y `src/index.ts`, formato `esm`, `dts: true`, `clean: true`, `sourcemap: true`, `target` `node24`, banner con `#!/usr/bin/env node` solo en el bundle del CLI.

`src/cli/main.ts` registra Commander con `oaiimage` y `--version` leyendo `package.json`. Sin subcomandos todavía, `--help` sale 0.

`.gitignore`: `node_modules`, `dist`, `coverage`, `.env`, `output`, `.oaiimage/sessions` no se ignora dentro de examples si son fixtures; sí se ignora `output/`.

`.env.example` contiene solo `OPENAI_API_KEY=` y una línea que dice que no se commitea el valor.

Criterio: `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (puede no haber tests aún; Vitest debe terminar 0), `pnpm build`, `node dist/cli.js --help` sale 0 y el texto contiene `oaiimage`.

Prueba: `tests/e2e/help.test.ts` arranca el bin construido y espera código 0. `vitest.e2e.config.ts` se crea ya en esta fase, `include: ["tests/e2e/**/*.ts"]`.

## Fase 2 — Tipos, errores y códigos

Archivos: todo `src/core/**` descrito en [ARCHITECTURE-PLAN.md](./ARCHITECTURE-PLAN.md), `src/cli/exit.ts`.

`exit.ts` mapea la clase de error al código. `main.ts` envuelve `program.parseAsync` en try/catch y llama a `process.exitCode`. No uses `process.exit` en medio de un comando, para que los `finally` corran. Al final del proceso, si `exitCode` está puesto, el runtime termina con ese código.

Los tipos se copian de la sección de arquitectura. No se añaden campos que la arquitectura no nombra.

Criterio: `pnpm typecheck` pasa. Un test unitario instancia cada error y espera su código: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11.

Prueba: `tests/unit/errors.test.ts`.

## Fase 3 — Utilidades de seguridad y log

Archivos: `src/utils/signal.ts`, `src/utils/retry.ts`, `src/utils/concurrency.ts`, `src/utils/clock.ts`, `src/media/sniff.ts`, `src/media/atomic.ts`, `src/providers/openai/redact.ts`, `src/utils/logger.ts`.

Contratos:

- `sniff(buffer)` devuelve `png`, `jpeg` o `webp`, o lanza `PathSecurityError`.
- `assertInside(root, candidate)` resuelve ambas rutas y rechaza si el candidato no es `root` o un hijo. Rechaza si `realpath` sale de `root`.
- `writeAtomic(path, bytes)` escribe temporal en el mismo directorio y renombra.
- `retry(fn, { attempts: 3, signal })` solo repite si el error dice `retryable: true`. Respeta abort.
- `mapWithConcurrency(items, limit, worker, signal)` no lanza la siguiente tanda después de abortar.
- `createLogger({ level, destination })` usa Pino hacia stderr. `redactSecrets(value, secrets)` recorre objetos y sustituye la clave.

Criterio y pruebas en `tests/unit/security.test.ts`:

- Un PNG mínimo de 8 bytes con la firma correcta se acepta. `FF D8 FF` se acepta como jpeg. `RIFF....WEBP` se acepta. `GIF89a` se rechaza.
- `../` que sale de la raíz se rechaza.
- Un string que contiene el secreto no aparece en la salida de `redactSecrets`.
- `writeAtomic` deja el archivo final y no deja el temporal.
- `retry` llama 1 vez si el error no es reintentable y 3 veces si lo es.
- Al abortar, `retry` no hace otro intento.

## Fase 4 — Configuración

Archivos: `src/config/defaults.ts`, `src/config/schema.ts`, `src/config/paths.ts`, `src/config/load.ts`.

Zod 4 valida el archivo. Las claves son las de `ProductDefaults` en la arquitectura. Una clave desconocida es `ConfigError`. Una clave de secreto es `ConfigError` y el mensaje no imprime el valor.

`loadEffectiveConfig({ cwd, env, flags, platform })` aplica la precedencia. Los tests pasan un `env` y un sistema de archivos en memoria o un directorio temporal. No leen el home real: `paths.ts` recibe `homeDir` y `xdgConfigHome` por argumento. El default de producción usa `os.homedir()` y `process.env`.

Criterio: `tests/unit/config.test.ts` cubre flag > env > proyecto > global > default con un mismo campo `model`, y el rechazo de un YAML con `apiKey`.

## Fase 5 — Registros de modelo y de capacidad

Archivos: `src/core/entities/model.ts` (datos), `src/services/models/registry.ts`, `src/services/models/capabilities.ts`, `src/services/models/data.ts`.

`data.ts` transcribe la investigación. Cada registro lleva `sourceUrls` y `verifiedOn: "2026-10-15"`. No se añaden modelos. `dall-e-2` y `dall-e-3` están con `status: "retired"` y todas las capacidades en falso.

`assertCompatible(model, request)` lanza `CapabilityError` en los casos `D` y `U` de la matriz. Lanza `UsageError` si el tamaño flexible incumple las reglas numéricas.

Funciones puras de tamaño en `src/services/models/size.ts`:

- `parseSize("WIDTHxHEIGHT")`.
- `isFlexible(model)`.
- `validateFlexible(width, height)` exige múltiplos de 16, relación entre 1/3 y 3, lados ≤ 3840, píxeles entre 655360 y 8294400.
- `isExperimental(width, height)` es verdadero si `width * height > 2560 * 1440`.

Criterio: `tests/unit/capabilities.test.ts` con al menos estos casos:

- Sunburst acepta `xhigh` y `max`. `gpt-image-2`, `gpt-image-1.5`, `gpt-image-1`, mini y chatgpt-image-latest los rechazan.
- `gpt-image-2` acepta `1536x864` y lo marca experimental solo si supera el umbral. `800x800` se rechaza por pocos píxeles. `1024x1024` se acepta y no es experimental. `3840x2160` se acepta y es experimental. `3000x3000` se rechaza por pasar de 8 294 400. `1000x1000` se rechaza por no ser múltiplo de 16.
- `gpt-image-1.5` rechaza `1536x864`.
- mini rechaza máscara y `background: transparent`.
- chatgpt-image-latest rechaza transparencia y acepta máscara.
- `gpt-image-2` acepta transparencia con `png` y la marca `preview`. La rechaza con `jpeg`.
- `input_fidelity: "high"` se acepta en 1 y 1.5, se rechaza en mini, y se rechaza en 2, 2.5 y chatgpt-image-latest.
- `n` 0 y `n` 11 se rechazan. `n` 10 se acepta en Images. En Responses el validador de la herramienta no produce un campo `n`.
- `dall-e-3` es retired.
- `stream` con `count` 2 se rechaza.

## Fase 6 — Adaptadores del proveedor

Archivos: `src/providers/openai/client.ts`, `images-adapter.ts`, `responses-adapter.ts`, `batch-adapter.ts`, `map-error.ts`, `tests/helpers/fake-provider.ts`.

El adaptador de Images recibe un cliente con la forma mínima `{ images: { generate, edit } }`. El de Responses, `{ responses: { create } }`. El de batch, `{ files, batches }`. La construcción real usa `new OpenAI({ apiKey, timeout, maxRetries: 0 })` de `openai@7.34.0`. Los tests no instancian el cliente real.

Traducción obligatoria:

- Images generate envía `model`, `prompt`, `size`, `quality`, `output_format`, `background`, `n`, y `moderation` solo si el request lo trae. `output_compression` solo si el formato es jpeg o webp. `stream` y `partial_images` solo si `stream` es true.
- Edit añade `image` como streams y `mask` como stream si hay máscara. `input_fidelity` solo si la capacidad lo permite y el request lo trae.
- Responses envía el modelo de lenguaje en `model` y el de imagen dentro de `tools[0]`. No pone parámetros de imagen en la raíz. No envía `n`. Manda `tool_choice: { type: "image_generation" }`.
- `previous_response_id` va en la raíz de Responses.
- `action` va en la herramienta.
- El batch nativo escribe JSONL sin `stream` y sube el archivo. El endpoint es el de Images, no `/v1/responses`.

`map-error` cubre un objeto estilo SDK con `status`, `code`, `type` y `requestID`.

Criterio: `tests/integration/adapters.test.ts` con un fake que graba el cuerpo:

- El cuerpo de Sunburst con `quality: "max"` contiene `max` y no contiene `style` ni `response_format`.
- El cuerpo de `gpt-image-2` con fidelidad pedida no contiene `input_fidelity`.
- El cuerpo de Responses no contiene `n` y separa los dos modelos.
- Un error `moderation_blocked` sale como `ModerationError` y `retryable === false`.
- Un 429 sale `retryable === true`.
- `createVariation` no aparece en el código de `src/providers`. Un test de fuente puede leer los archivos y fallar si esa cadena existe.

## Fase 7 — Procesado local

Archivos: `src/media/processor.ts` y lo que `MediaProcessor` declara.

Sharp hace las operaciones. `interpolate` usa kernel `lanczos3` y el metadato de salida incluye `parameters.method = "lanczos3-interpolation"`. No se borra ni se sobrescribe la entrada: la salida es otra ruta. `overlaySvgText` genera un SVG con el texto escapado y lo compone. El texto del SVG es exactamente el string pedido.

`compare` pone las dos imágenes en un lienzo lado a lado, escaladas a la misma altura con contain, sin recortar el contenido de forma silenciosa: si hay que escalar, el metadato lo dice.

Criterio: `tests/unit/media.test.ts` con fixtures generados por Sharp en el propio test (no hace falta commitear binarios grandes):

- resize cambia las dimensiones y deja el original con el mismo sha256.
- convert a png/jpeg/webp y sniff coincide.
- overlay de `"Árbol"` hace que el PNG de salida exista y el SVG intermedio, si se guarda en el test, contenga `Árbol` escapado.
- una ruta fuera de la raíz falla con código 10.
- estas pruebas no leen `OPENAI_API_KEY`. Se puede borrar la variable en el test y el procesador sigue funcionando.

## Fase 8 — Motor de prompts y plantillas

Archivos: `src/services/prompting/engine.ts`, `src/services/prompting/templates.ts`, `src/templates/prompt-templates.ts`, `src/templates/style-templates.ts`.

Orden fijo de secciones, omitiendo las vacías, cada una en su línea `Etiqueta: valor`:

1. Objetivo
2. Sujeto
3. Descripción
4. Entorno
5. Composición
6. Ángulo de cámara
7. Encuadre
8. Perspectiva
9. Iluminación
10. Paleta
11. Materiales
12. Texturas
13. Estilo
14. Ánimo
15. Fondo
16. Detalle
17. Texto a renderizar
18. Referencias
19. Conservar
20. Modificar
21. Evitar
22. Restricciones

`validate` rechaza prompt vacío o de más de 32 000 caracteres.

`optimize` lanza `CapabilityError` si no recibe un nombre de modelo. Si lo recibe, llama a un puerto `TextOptimizer` con ese modelo. El adaptador real, `src/providers/openai/text-adapter.ts`, usa `client.responses.create` con el modelo de texto, sin herramienta de imagen, y devuelve el texto. Guarda siempre `{ original, optimized }`. El comando no llama a este método salvo `--optimize`.

Plantillas de producto, ids exactos y objetivo por defecto:

| id | objetivo por defecto |
| --- | --- |
| `product` | Fotografía de producto aislada, centrada, con detalle de material y sin props que tapen la pieza. |
| `advertising` | Anuncio con una sola idea visual, jerarquía clara y espacio para un eslogan. |
| `ecommerce` | Imagen de catálogo con el artículo completo visible, fondo limpio y proporción de tienda. |
| `real-estate` | Vista inmobiliaria amplia, líneas verticales rectas y luz natural creíble. |
| `interiors` | Interior habitable, escala humana y materiales distinguibles. |
| `architecture` | Exterior arquitectónico con contexto, proporción y cielo coherente. |
| `furniture` | Mueble completo, apoyado en el suelo, con sombra de contacto. |
| `portraits` | Retrato con identidad estable, mirada y luz descritas por el usuario. |
| `children` | Ilustración infantil amable, sin sustos ni texto ilegible. |
| `book-covers` | Portada con zona reservada para título y autor. |
| `signs` | Cartel señalético simple, pocas palabras, alto contraste. |
| `posters` | Póster con un foco visual y margen para tipografía. |
| `social` | Pieza para red social con zona de seguridad en los bordes. |
| `icons` | Icono único, legible en tamaño pequeño, sin detalle superfluo. |
| `concept-art` | Concept art con silueta clara y una nota de luz dominante. |
| `games` | Asset de videojuego con lectura inmediata de la forma. |
| `characters` | Personaje de cuerpo completo con rasgos repetibles. |
| `infographics` | Infografía con pocos bloques y etiquetas pedidas de forma literal. |
| `education` | Material educativo claro, con los términos que el usuario liste. |
| `diagrams` | Diagrama con cajas y relaciones descritas, sin flechas inventadas. |
| `storyboards` | Viñeta de storyboard con encuadre y acción únicos. |
| `mockups` | Mockup del objeto en contexto, sin deformar la pieza. |
| `packaging` | Envase en tres cuartos, con el panel frontal visible. |
| `brands` | Pieza de marca sobria, usando solo los colores y el nombre dados. |

Plantillas de estilo, ids exactos. Cada una es una frase que el motor inserta en la sección Estilo. No son un parámetro de API.

`photorealistic`, `cinematic`, `anime`, `manga`, `watercolor`, `oil-painting`, `pencil-sketch`, `pixel-art`, `3d-render`, `clay`, `minimalist`, `isometric`, `architectural`, `editorial`, `product-photography`, `vintage`, `cyberpunk`, `fantasy`, `technical-illustration`, `infographic`.

Frases, en este orden y con este texto:

- photorealistic: Fotografía realista, detalle óptico creíble, sin aspecto de ilustración.
- cinematic: Luz de cine, profundidad y encuadre narrativo.
- anime: Dibujo anime, línea clara y color plano controlado.
- manga: Tinta de manga, trama y contraste gráfico.
- watercolor: Acuarela sobre papel, bordes húmedos.
- oil-painting: Óleo con pincelada visible.
- pencil-sketch: Boceto a lápiz, grafito sobre papel.
- pixel-art: Pixel art con píxel cuadrado y paleta limitada.
- 3d-render: Render 3D con materiales definidos.
- clay: Modelado de arcilla o plastilina.
- minimalist: Composición mínima y mucho espacio vacío.
- isometric: Proyección isométrica coherente.
- architectural: Dibujo de arquitectura con líneas precisas.
- editorial: Fotografía editorial, estilo de revista.
- product-photography: Fotografía de producto de estudio.
- vintage: Emulsión antigua, color envejecido, sin fecha falsa impresa.
- cyberpunk: Ciudad nocturna, neón y humedad.
- fantasy: Fantasía ilustrada, un foco mágico.
- technical-illustration: Ilustración técnica, corte claro y etiquetas solo si se piden.
- infographic: Gráfico informativo, bloques ordenados.

`--var clave=valor` rellena el campo cuyo nombre normalizado coincide (`color-palette` acepta `palette`). Una clave desconocida es `UsageError`.

Criterio: `tests/unit/prompt.test.ts` comprueba las 24 plantillas, las 20 frases de estilo, el orden de secciones, el límite de 32 000 caracteres y que `optimize` sin modelo lanza código 11.

## Fase 9 — Referencias y máscaras

Archivos: `src/services/references/manager.ts`, `src/services/masking/manager.ts`, `src/services/masking/morphology.ts`.

Referencias: comprueba existencia, tamaño ≤ 50 MB, magic bytes png/jpeg/webp, y que el número no pase de `maxReferences` del modelo (16 en los GPT Image seleccionables). Asigna el rol. El texto que se añade al prompt es `Imagen {n}: papel {role}. {note}`. La numeración empieza en 1 y sigue el orden de los argumentos.

Máscara aplicable: PNG, canal alfa presente, mismas dimensiones que la primera imagen, tamaño < 4 MB. Alfa 0 cuenta como editable. El informe de `inspect` devuelve los dos recuentos.

Operaciones sobre el alfa, en un buffer en bruto, no con una librería nueva:

- invert: `alpha' = 255 - alpha`.
- union: `min(alphaA, alphaB)` (gana lo más transparente).
- intersect: `max(alphaA, alphaB)`.
- dilate de radio `r`: un píxel queda editable si en el cuadrado de radio `r` había algún editable. Editable significa alfa 0.
- erode de radio `r`: un píxel queda editable solo si todo el cuadrado era editable.
- blur: media del alfa en el cuadrado de radio `r`, sin binarizar.
- rect y polygon: pintan la zona interior con alfa 0 y el resto con alfa 255, o al revés si `--invert` ya se pidió como paso aparte. El polígono usa el algoritmo par-impar sobre el lienzo de la imagen base.

`renderPreview` compone un velo magenta al 40 % donde el alfa de la máscara es 0, encima de la imagen base, y escribe otro archivo.

Si Sharp no puede expresar un paso, se implementa con el buffer. Si un paso no queda implementado, el comando falla con código 1 y el motivo; no devuelve la máscara de entrada como si la hubiera transformado.

Criterio: `tests/unit/mask.test.ts` y `tests/unit/references.test.ts`.

- Máscara JPEG rechazada.
- Máscara PNG sin alfa rechazada.
- Dimensiones distintas rechazadas.
- Una máscara de 2×2 con un solo píxel transparente dilata y erosiona como dice la regla, comprobando los cuatro píxeles.
- 17 referencias fallan.
- Un archivo de 1 byte que se llama `.png` falla por magic bytes.

## Fase 10 — Generación y edición

Archivos: `src/services/generation/service.ts`, `src/services/editing/service.ts`, `src/services/jobs/manager.ts` puede esperar a la fase 13 si esta fase solo devuelve el resultado. El servicio de generación ya escribe archivos con `ImageRepository`.

`generate`:

- Valida con el registro.
- Si `dryRun`, no llama al provider. Devuelve el cuerpo que se habría enviado y el coste de la fase 12 cuando exista. Hasta esa fase el coste es `{ kind: "unknown", reason: "estimator-not-wired" }` y el test de la fase 12 lo sustituye.
- Modo images: una llamada con `n = count`.
- Modo responses: `count` llamadas, concurrencia de la config, sin campo `n`.
- Escribe el final con nombre automático si no hay `--output`.
- No sobrescribe sin la política de la arquitectura.

`edit` añade las referencias y, si `preserve` tiene elementos, añade la sección Conservar del motor de prompts. Ese array no sale en el cuerpo del provider. Un test de integración espía el cuerpo y falla si aparece la clave `preserve`.

`inpaint` exige máscara válida y `capabilities.mask`. Luego edit.

`expand` calcula el lienzo:

- `top`, `bottom`, `left`, `right` añaden los píxeles pedidos en ese lado.
- `all` añade los cuatro.
- `--aspect W:H` calcula el lienzo mínimo de esa relación que contiene la imagen y la centra. Si el lienzo es mayor, sigue el pipeline de máscara. Si es menor o igual en ambos ejes, hace un crop local con Sharp, no llama a la API, y el resultado dice `source: "local-crop"`.
- El lienzo nuevo se rellena con un color plano neutro (`#808080`) solo como soporte del archivo de entrada. La máscara marca esa zona con alfa 0 y la zona de la imagen original con alfa 255.
- Después llama a edit. El original no se modifica.
- Si el tamaño resultante no pasa `validateFlexible` o no está entre los tamaños fijos del modelo, falla con código 2 antes de la red.

`compose` es edit con varias referencias y el párrafo de roles.

`applyStyle` antepone la frase de estilo. Con imagen de referencia usa edit. Sin ella, generate. Rechaza un id de estilo desconocido. Rechaza un flag que pretendiera mandar `style` al provider.

`transparent` pone `background: "transparent"` y formato png o webp. `replaceBackground` es un edit cuyo prompt incluye el fondo pedido y la frase de que el recorte no está garantizado. `removeBackground` sin imagen es generate transparente. Con imagen es edit generativo. Un hipotético `--method local` sale 11.

`variations` no tiene servicio propio: el comando de la fase 15 llama a generate o edit con el prompt del usuario. Si el usuario no pasa prompt, `UsageError`, porque no hay un endpoint que varíe sin prompt.

Criterio: `tests/integration/generation.test.ts` y `editing.test.ts` con el fake provider.

- `n` del cuerpo images es igual a `count`.
- En responses hay `count` llamadas y ningún cuerpo tiene `n`.
- dry-run no incrementa el contador de llamadas del fake.
- expand hacia arriba produce una máscara cuyas filas nuevas son transparentes y las filas originales son opacas, y luego una llamada edit.
- El archivo de entrada de expand conserva su sha256.
- `preserve` está en el prompt y no en el cuerpo.
- jpeg + transparent falla antes del fake.

## Fase 11 — Streaming

Archivos: `src/services/streaming/service.ts`. El adaptador de la fase 6 ya debe poder devolver un async iterable si `stream` es true. Si no quedó así, se completa aquí sin cambiar el contrato.

Nombres:

- final: el `--output` o el nombre automático.
- parcial: mismo directorio, `{base}.partial-{index}.{ext}`, y solo si `savePartials`.

Si llega un parcial después del final, no se mueve encima del final. El índice se respeta. Si el provider entrega menos parciales que `partialImages`, el resultado lo dice en `warnings` y no fabrica los que faltan.

Criterio: `tests/integration/streaming.test.ts`.

- Dos parciales y un final producen dos archivos partial y un final distinto.
- Con `savePartials: false` solo existe el final.
- Un fake que no emite parciales no provoca archivos vacíos.
- `partialImages: 4` se rechaza. `0` se acepta y no espera parciales.

## Fase 12 — Costes y presupuestos

Archivos: `src/services/costs/estimator.ts`, `src/services/costs/ledger.ts`, `src/services/costs/prices.ts`.

`prices.ts` copia las tablas de la investigación. Sunburst y Flare no tienen `perImageUsd`.

`estimate`:

- Si hay celda USD para ese modelo, tamaño y calidad, la partida de salida es un `amount` y el informe dice que no incluye tokens de entrada. La partida de entrada es `unknown` con el motivo `input-tokens-depend-on-prompt-and-images`.
- Si calidad o tamaño es `auto`, y existen celdas para ese modelo, la salida es un `range` del mínimo al máximo de esas celdas.
- Si el modelo es Sunburst o Flare, la salida es `unknown` con el motivo `no-per-image-price-published`. Se incluyen las tarifas por millón para que el usuario las vea.
- Parciales: `unknown` o, si se quiere un número, una partida `partials` marcada `estimate` igual a `partialImages * 100` tokens por la tarifa de salida de imagen. El informe dice que pueden llegar menos.
- Responses suma una partida `responsesModel`. Si la tarifa de ese modelo de texto no está en `prices.ts`, la partida es `unknown`. No se inventa la tarifa de `gpt-5.5` en este plan: o se transcribe de https://developers.openai.com/api/docs/pricing el día en que se codifica, citando 2026-10-15 si la fila no cambió, o queda `unknown`.
- `fromUsage` multiplica los tokens devueltos por la tarifa. No añade caché. El informe dice que la caché de GPT Image 2 y 2.5 en Responses no viene en `usage`.

`assertWithinBudget` lanza `BudgetError` (código 7) cuando un amount o el máximo de un range supera el tope. Un `unknown` en no interactivo también exige `--confirm-cost`; si no está, código 7.

El ledger suma por sesión y por proyecto en `.oaiimage/usage.json`. No guarda prompts enteros si el usuario no lo pide; guarda id, modelo, USD y timestamp.

Criterio: `tests/unit/cost.test.ts`.

- 1.5, 1024×1024, low, count 1 → salida 0.009 y la entrada unknown.
- 1.5 quality auto → range que cubre las nueve celdas o, si el tamaño está fijo, las tres calidades de ese tamaño. Documentar en el test cuál de las dos reglas se implementó y no cambiarla: con tamaño fijo y calidad auto, el rango es el mínimo y el máximo de las tres calidades de ese tamaño.
- Sunburst no devuelve un amount de salida.
- 100 tokens de salida de imagen de Sunburst a tarifa standard son 0.003 USD (`30 / 1_000_000 * 100`).
- Batch usa la columna Batch.
- Un unknown sin `--confirm-cost` en un contexto `{ interactive: false }` lanza código 7.

Conectar el estimador al servicio de generación. El dry-run de la fase 10 deja de decir `estimator-not-wired`.

## Fase 13 — Trabajos, sesiones y batch

Archivos: `src/services/jobs/manager.ts`, `src/services/sessions/store.ts`, `src/services/batch/manifest.ts`, `src/services/batch/local-queue.ts`, `src/services/batch/openai-batch.ts`.

Manifiesto de batch, JSON en disco:

```json
{
  "id": "batch_local_id",
  "mode": "local",
  "model": "gpt-image-2.5-flare",
  "items": [
    { "id": "row-1", "state": "succeeded", "request": {}, "outputPaths": [] }
  ]
}
```

Estados de ítem: `pending`, `running`, `succeeded`, `failed`, `cancelled`. `run` solo toma `pending` y `failed` si el comando es `retry`. `retry` no toca `succeeded`. Un proceso que muere deja `running` ; al reanudar, `running` vuelve a `pending` y se repite, porque no hay confirmación de éxito. Eso se documenta en el JSON con `attempts`.

Entrada de `batch create`: JSON, YAML, CSV o JSONL. CSV con cabecera `id,prompt,size,quality,format`. Una columna desconocida es `UsageError`. Todos los ítems de un batch nativo comparten modelo; si no, `UsageError` antes de subir.

`openai-batch` construye el JSONL, comprueba que el archivo pese menos de 200 MB y que haya como máximo 50 000 líneas, sube y crea el batch con `completion_window: "24h"`. Guarda el `batch.id` de OpenAI en el manifiesto. `status` llama a `batches.retrieve`. `export` descarga output y error y casa por `custom_id`. No asume el orden.

Si el modelo tiene `batchImages: false`, el modo openai sale 11. En los modelos de la matriz todos los seleccionables lo tienen en true. DALL·E no.

La sesión guarda iteraciones como en la arquitectura. `session edit` en modo responses manda `previous_response_id` si la iteración padre tiene `responseId`. Si no lo tiene, hace edit con el archivo guardado y `source: "fallback"`. No finge un response id.

Criterio:

- `tests/unit/batch-manifest.test.ts`: un retry no vuelve a ejecutar un id succeeded. Un running huérfano se reintenta.
- `tests/integration/openai-batch.test.ts`: el JSONL grabado por el fake no contiene `stream`, tiene `custom_id` y el endpoint es `/v1/images/generations` o `/v1/images/edits`.
- `tests/unit/session.test.ts`: sin response id el segundo paso es fallback y el primero no se pierde.

## Fase 14 — Proyectos y galería

Archivos: `src/services/projects/manager.ts`, `src/services/gallery/manager.ts`, `src/services/gallery/html.ts`.

`project init` crea `.oaiimage/config.yaml`, `manifest.json` y `sessions/`. `list` enumera directorios hijos que tengan ese manifiesto, solo bajo el cwd, sin seguir symlinks hacia fuera. `inspect` imprime el manifiesto.

La galería lee el manifiesto. `export` sin `--html` escribe la hoja de contacto con el procesador de la fase 7. Con `--html`, escribe `gallery.html` que solo contiene las rutas relativas, sin `<script src="http...">` y sin la clave. Un test busca `OPENAI` y `http://` en ese HTML y espera que no estén. Las rutas de imagen relativas sí pueden existir.

Criterio: `tests/unit/gallery.test.ts` y `tests/unit/project.test.ts` en un directorio temporal.

## Fase 15 — Comandos

Archivos: los de `src/cli/commands/` y `src/cli/options/` y `src/cli/interactive/`. `program.ts` registra todos.

Comandos y flags que tienen que existir, con el comportamiento ya definido. No se añaden flags que cambien el contrato:

- `init` y `config set|get|list|reset`. `init` es `config init`.
- `doctor`
- `models list`, `models inspect <id>`
- `capabilities [model]`
- `generate` con `--prompt`, `--prompt-file`, `--model`, `--size`, `--quality`, `--format`, `--compression`, `--background`, `--count`, `--output`, `--dir`, `--stream`, `--partials`, `--save-partials`, `--dry-run`, `--json`, `--stdin`, `--max-cost`, `--confirm-cost`, `--budget`, `--max-requests`, `--api-mode`, `--responses-model`, `--force`, `--verbose`, `--debug`, `--quiet`.
- `edit` con `--image` repetible, `--prompt`, `--model`, `--quality`, `--size`, `--format`, `--output`, `--preserve` repetible, `--references` como `path:role` o repetido junto con `--role`.
- `inpaint` con `--image`, `--mask`, `--prompt` y los flags de edit que apliquen.
- `expand` con `--image`, `--prompt`, `--direction` (`top|bottom|left|right|all`), `--pixels`, `--aspect`.
- `compose` con `--image` repetible y `--role`.
- `style` con `--style <id>` y `--image` opcional.
- `transparent`, `background remove`, `background replace`.
- `session create|edit|history|inspect|export|delete`.
- `prompt create|build|optimize|validate|inspect|templates|save`.
- `typography` con texto principal, secundario, jerarquía, idioma, estilo, composición, colores, `--review` opcional y `--exact` para el camino SVG.
- `variations` con `--image` opcional y `--prompt` obligatorio.
- `media inspect|resize|crop|rotate|convert|compress|composite|watermark|metadata|thumbnail|contact-sheet|compare`.
- `upscale`, `restore`, `enhance`.
- `batch create|run|status|retry|export` con `--mode local|openai`.
- `cost estimate|report`, `usage summary`.
- `project init|list|inspect`.
- `gallery list|inspect|export`.

Cada comando tiene `.description` y dos ejemplos en `.addHelpText`.

Prompts de archivo: `.txt` y `.md` son el prompt entero. `.json` y `.yaml` son el objeto de prompt estructurado. `--stdin` lee stdin. Si hay `--prompt` y `--prompt-file` a la vez, gana `--prompt` y stderr avisa. Si no hay ninguno ni stdin, `UsageError`.

Interactivo: si falta `--prompt` y hay TTY y no está `--json`, `prompt create` puede preguntar los campos. `generate` sin prompt y sin TTY sale 2. No se pregunta nada cuando `--json` está puesto.

`doctor` imprime checks en texto o JSON: versión de Node, existencia del bin, config efectiva, secreto ausente de los archivos, `OPENAI_API_KEY` como `present` o `missing` sin mostrar caracteres de la clave, y organización como `not-checked`.

Completions: `completions/oaiimage.bash` y `completions/oaiimage.zsh` con los nombres de comando y los ids de modelo del registro. Un script de generación puede ser `src/cli/completions.ts` invocado por `pnpm build` o escrito a mano si la lista es estática. Tiene que coincidir con `models list`.

Criterio e2e del bin, con proxy `http://127.0.0.1:9` y `OPENAI_API_KEY=sk-test` donde haga falta:

- `--help` y `generate --help` salen 0.
- `generate --prompt hi --dry-run --json` sale 0, stdout es JSON con `dryRun: true`, y no necesita red.
- `generate --prompt hi` sin clave sale 4.
- `generate --model gpt-image-2 --quality xhigh --prompt hi --dry-run` sale 11.
- `generate --model dall-e-3 --prompt hi` sale 11.
- `media inspect` sobre un PNG fixture sale 0 sin clave.
- `config set apiKey sk-test` sale 3.
- `--json` no escribe el JSON en stderr ni logs en stdout. El test separa los dos streams.
- Un segundo generate al mismo `--output` sin `--force` y sin TTY sale 2.

## Fase 16 — Ejemplos, documentación y CI

Ejemplos en `examples/{generation,editing,masks,references,typography,sessions,batch,projects}/`. Cada carpeta tiene un `README.md` de diez líneas como máximo y un archivo de entrada (YAML o máscara generada por un script de fixture). El README dice que la ejecución real exige `OAIIMAGE_LIVE=1` y una clave, y que CI no la ejecuta. No se pega una clave.

Documentos de usuario, en español, cortos y alineados con la matriz. No copian la investigación entera; enlazan `docs/plan/API-RESEARCH.md`:

- `README.md` con instalación local (`pnpm install`, `pnpm build`, `node dist/cli.js`), la advertencia de que no está publicado en npm, y tres ejemplos de generate, edit y dry-run.
- `docs/ARCHITECTURE.md` resume el árbol y los dos modos.
- `docs/COMMANDS.md` lista comandos y códigos de salida.
- `docs/GENERATION.md`, `docs/EDITING.md`, `docs/MASKING.md`, `docs/REFERENCES.md`, `docs/PROMPTING.md`, `docs/MODELS.md`, `docs/COSTS.md`, `docs/SECURITY.md`.
- `CONTRIBUTING.md` dice que no se ejecuta `npm publish` y que las capacidades nuevas exigen actualizar la investigación con fecha y URL.
- `CHANGELOG.md` con una entrada `0.0.0` sin publicar.

CI `.github/workflows/ci.yml`:

- `on`: pull_request y push a `main`.
- matriz `ubuntu-latest`, `windows-latest`, `macos-latest`.
- Node 24, pnpm 12.11.2, `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.
- No hay step de publish ni de `npm whoami`.

`.github/workflows/publish.yml`:

- `on`: `release` publicado y `workflow_dispatch`.
- El job de publish tiene `if: vars.OAIIMAGE_PUBLISH == 'true'`.
- El step es `pnpm publish --access public --no-git-checks` y necesita `NODE_AUTH_TOKEN`.
- Mientras la variable de repositorio no exista, el job no publica. El implementador no crea esa variable ni lanza el workflow.
- Un comentario al inicio del YAML repite que la entrega deja el workflow apagado.

Prueba de paquete: después de `pnpm build`, `node dist/cli.js --help` sale 0. En el e2e de la fase 15 eso ya se exige. Aquí se añade que `package.json` `bin` apunta a `dist/cli.js` y que el archivo construido empieza por el shebang. Test: `tests/e2e/bin.test.ts`.

Pruebas reales: `tests/e2e/live.test.ts` con `describe.skipIf(process.env.OAIIMAGE_LIVE !== "1")`. CI no define esa variable. El test, si alguien lo activa a mano, hace un generate pequeño con `gpt-image-2.5-flare`, `quality: low`, `size: 1024x1024`, y comprueba magic bytes PNG. No forma parte del criterio de CI.

Criterio de cierre de la fase 16: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` y `pnpm test:e2e` pasan en local. `git grep -n "npm publish"` solo encuentra el workflow apagado y la documentación que prohíbe ejecutarlo.

## Definition of done global

- Los cuatro documentos de `docs/plan/` siguen siendo ciertos respecto del código. Si el implementador descubre que la API cambió, actualiza primero `API-RESEARCH.md` con URL y fecha, luego la matriz, y solo después el código.
- No hay llamada de red en `pnpm test` ni en `pnpm test:e2e`.
- `rg "createVariation|/images/variations" src` no devuelve usos.
- `rg "xhigh" src/services/models/data.ts` muestra `xhigh` solo en Sunburst, Flare y sus snapshots.
- El paquete no se ha publicado.
