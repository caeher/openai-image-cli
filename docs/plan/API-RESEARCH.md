# Investigación de la API de imágenes de OpenAI

Fecha de verificación de todas las fuentes de este documento: **2026-10-15**.

Este documento es la única fuente de verdad de capacidades para el implementador. Si un dato no aparece aquí como verificado, el código debe tratarlo como desconocido y rechazarlo. No se inventan endpoints, parámetros, tarifas ni límites.

## Cómo leer el estado

| Estado | Significado en este plan |
| --- | --- |
| `active` | La página oficial del modelo existe y no hay aviso de apagado vigente o pasado. |
| `deprecated` | Sigue documentado, con fecha de apagado posterior al 2026-10-15. |
| `retired` | La fecha de apagado ya pasó el 2026-10-15. |
| `UNKNOWN` | No aparece en las fuentes citadas. El CLI no debe enviarlo. |

Cuando una guía y el esquema OpenAPI discrepan, ambas citas se conservan en el registro de conflictos. La regla que debe aplicar el CLI está en [CAPABILITY-MATRIX.md](./CAPABILITY-MATRIX.md) y [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md).

## Fuentes

| ID | URL | Qué se usó |
| --- | --- | --- |
| G-IMG | https://developers.openai.com/api/docs/guides/image-generation | Guía de generación, edición, máscaras, streaming, `n`, `partial_images`, moderación, costes, límites de tamaño de 2.5 y de modelos anteriores. |
| G-PROMPT | https://developers.openai.com/api/docs/guides/image-prompting | Parámetros por familia (2.5, 2, 1.5, 1), fidelidad de entrada, transparencia, `n` en ejemplos. |
| G-TOOL | https://developers.openai.com/api/docs/guides/tools-image-generation | Herramienta `image_generation`, `action`, `revised_prompt`, `previous_response_id`, modelos de Responses, `partial_images`. |
| G-BATCH | https://developers.openai.com/api/docs/guides/batch | Endpoints de Batch, ventana `24h`, límites de archivo y de solicitudes, estados. |
| G-PRICE | https://developers.openai.com/api/docs/pricing | Tarifas Standard y Batch por 1M de tokens. |
| G-DEP | https://developers.openai.com/api/docs/deprecations | Apagados de DALL·E y de GPT Image. |
| G-CHANGE | https://developers.openai.com/api/docs/changelog | Contexto histórico. No sustituye a la página del modelo ni a deprecations. |
| M-SUN | https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst | Modelo, snapshot, endpoints, tarifas, rate limits, inpainting. |
| M-FLARE | https://developers.openai.com/api/docs/models/gpt-image-2.5-flare | Igual que Sunburst para Flare. |
| M-2 | https://developers.openai.com/api/docs/models/gpt-image-2 | Endpoints, snapshot, rate limits, inpainting. Esta página no trae tabla de precios. |
| M-15 | https://developers.openai.com/api/docs/models/gpt-image-1.5 | Precios por imagen, endpoints, snapshot, inpainting. |
| M-1 | https://developers.openai.com/api/docs/models/gpt-image-1 | Precios, endpoints (incluye la anomalía de Responses), inpainting. |
| M-MINI | https://developers.openai.com/api/docs/models/gpt-image-1-mini | Precios y endpoints. No lista inpainting. |
| M-CHAT | https://developers.openai.com/api/docs/models/chatgpt-image-latest | Precios y endpoints. Recomienda Sunburst. |
| SDK-NODE | https://github.com/openai/openai-node/blob/v7.34.0/src/resources/images.ts y tipos generados del paquete `openai@7.34.0` | Esquema OpenAPI congelado en el tag `v7.34.0` (npm `7.34.0`, verificado 2026-10-15). Comentario del archivo: generado desde el OpenAPI spec. |
| SDK-PY | https://github.com/openai/openai-python/blob/main/src/openai/types/image_generate_params.py , `image_edit_params.py` y `src/openai/types/responses/tool_param.py` | Mismo origen OpenAPI, rama `main` leída el 2026-10-15. Se usa para cruzar la herramienta `image_generation`. El paquete que instalará el CLI es el SDK de Node, no el de Python. |

La referencia HTML `https://developers.openai.com/api/reference/resources/images/methods/generate/` apareció en el buscador con un enum de `quality` que no incluye `xhigh` ni `max` y con un ejemplo `curl` que aún muestra `response_format: url` y `style: vivid`. La descarga directa de `.../generate.md` y de `.../edit/` respondió **404** el 2026-10-15. Ese HTML no se usa como fuente: está incompleto o desactualizado respecto de G-IMG, G-PROMPT y el OpenAPI del SDK `v7.34.0`. El índice histórico `openai-openapi` `openapi.yaml` revisado sigue mostrando ejemplos `dall-e-3` y no describe 2.5; tampoco se usa como contrato.

No se encontró otra página de modelo de imagen oficial además de las listadas. No hay `gpt-image-3`, ni otro alias 2.5 distinto de `sunburst` y `flare`, en las páginas consultadas.

## Modelos

### `gpt-image-2.5-sunburst` — `active`

- Página: M-SUN. ID `gpt-image-2.5-sunburst`. Snapshot por defecto `gpt-image-2.5-sunburst-2026-09-08`. Alias y snapshot, ambos listados.
- Entrada: texto e imagen. Salida: imagen. M-SUN dice que la salida de texto no se factura porque el modelo no emite texto.
- Papel: G-IMG y G-PROMPT lo describen como el modelo base de GPT Image 2.5, para flujos en los que importa la precisión de edición. Calidad de imagen superior a GPT Image 2, según G-PROMPT.
- Endpoints en M-SUN: `v1/images/generations` supported, `v1/images/edits` supported, `v1/batch` supported. `v1/responses` figura como **not supported** en la tabla del modelo. Eso significa que este ID no es un modelo principal de `responses.create`. G-IMG y G-TOOL dicen que se pasa dentro de la herramienta `image_generation.model`.
- Feature de página: inpainting.
- Rate limits `default` en M-SUN: Build 250 000 TPM / 20 IPM; Launch 3 000 000 TPM / 150 IPM; Grow 8 000 000 TPM / 250 IPM. Tiers por encima de Grow: `UNKNOWN`.
- No hay aviso de apagado en G-DEP.

### `gpt-image-2.5-flare` — `active`

- Página: M-FLARE. ID `gpt-image-2.5-flare`. Snapshot `gpt-image-2.5-flare-2026-09-08`.
- Misma tabla de endpoints, modalidades, inpainting y rate limits que Sunburst.
- G-PROMPT: modelo pequeño, prioriza velocidad, calidad de imagen comparable a GPT Image 2. Para un flujo nuevo, empezar por Flare si la prioridad es la latencia, o por Sunburst si la prioridad es calidad exigente.
- Tarifas de token idénticas a Sunburst (M-FLARE y G-PRICE). G-PROMPT advierte que la misma tarifa no implica el mismo coste por imagen: el consumo de tokens puede diferir.
- No hay aviso de apagado en G-DEP.

### `gpt-image-2` — `active`

- Página: M-2. ID `gpt-image-2`. Snapshot por defecto `gpt-image-2-2026-04-21`.
- La lista de snapshots de M-2 solo nombra `gpt-image-2-2026-04-21`. El SDK-NODE y SDK-PY aceptan también el alias `gpt-image-2` y el snapshot fechado. El CLI debe aceptar ambos y tratarlos como la misma familia de capacidades.
- Entrada texto e imagen. Salida imagen.
- Endpoints: generaciones, ediciones y batch supported. `v1/responses` not supported como modelo principal. G-TOOL lo incluye como modelo de la herramienta.
- Inpainting: sí (M-2).
- Rate limits: la misma tabla Build / Launch / Grow que 2.5.
- G-PROMPT lo deja como referencia para integraciones existentes. Transparencia en **preview**. `quality` solo hasta `high`. No hay aviso de apagado en G-DEP el 2026-10-15.
- M-2 no publica precios. Los precios están en G-PRICE y la tabla por imagen de tres tamaños está en G-IMG.

### `gpt-image-1.5` — `deprecated`

- Página: M-15. ID `gpt-image-1.5`. Snapshot por defecto `gpt-image-1.5-2025-12-16`. La lista de snapshots de la página solo muestra esa fecha; el ID corto está en el encabezado y en SDK-NODE.
- G-PROMPT y G-DEP: apagado el **1 de diciembre de 2026**. Sustitutos recomendados: `gpt-image-2.5-sunburst` o `gpt-image-2.5-flare`.
- Salida de la página: imagen y texto. Por eso G-PRICE sí tiene tarifa de texto de salida.
- Endpoints: generaciones, ediciones y batch supported. `v1/responses` not supported como modelo principal. G-TOOL sí lo lista como modelo de la herramienta. Inpainting: sí.
- Rate limits: misma tabla de tres tiers.

### `gpt-image-1` — `deprecated`

- Página: M-1. ID y snapshot `gpt-image-1`.
- G-DEP, tabla “2026-04-22: Legacy GPT model snapshots”: apagado el **23 de octubre de 2026**. Sustitutos: Sunburst o Flare. G-PROMPT repite esa fecha.
- El 2026-10-15 el apagado todavía no ha ocurrido. El CLI debe avisarlo en cada uso y en `models list`.
- Endpoints: generaciones, ediciones y batch supported. **Anomalía:** M-1 marca `v1/responses` como supported, a diferencia del resto de modelos de imagen. G-TOOL no lo lista como modelo principal de Responses; lo lista como modelo de la herramienta. El CLI no debe enviar `gpt-image-1` en el campo `model` de `responses.create`. Ver conflicto C1.
- Inpainting: sí (M-1). G-PROMPT documenta máscaras y referencias.
- Rate limits: misma tabla.

### `gpt-image-1-mini` — `deprecated`

- Página: M-MINI. ID `gpt-image-1-mini`.
- G-DEP: apagado el **1 de diciembre de 2026**. Sustitutos: Sunburst o Flare.
- Entrada texto e imagen. Salida imagen. No hay tarifa de texto de salida en G-PRICE (celda `-`).
- Endpoints: generaciones, ediciones y batch supported. `v1/responses` not supported como modelo principal. G-TOOL sí lo incluye como modelo de herramienta.
- La página **no** lista “inpainting” en supported features. G-PROMPT no tiene una tabla de parámetros propia para mini. `input_fidelity`: SDK-PY dice que mini solo admite `low`.
- Rate limits: misma tabla, columnas invertidas en la página (IPM, TPM) pero los números coinciden.

### `chatgpt-image-latest` — `deprecated`

- Página: M-CHAT. ID `chatgpt-image-latest`. “Previous image model used in ChatGPT.” La propia página recomienda Sunburst para uso de API.
- G-DEP: apagado el **1 de diciembre de 2026**.
- Salida imagen y texto. Precios por imagen publicados, iguales a los de 1.5.
- Endpoints: generaciones, ediciones y batch supported. `v1/responses` not supported como modelo principal. SDK-PY lo incluye como valor de `image_generation.model`. G-TOOL, en el párrafo de modelos de la herramienta, nombra sunburst, flare, 2, 1.5, 1 y 1-mini, y **no** nombra `chatgpt-image-latest`. El esquema OpenAPI sí lo incluye. Conflicto C2.
- Inpainting: sí (M-CHAT).
- No hay tabla de parámetros en G-PROMPT. Tamaños y calidades se infieren solo donde G-PRICE y M-CHAT publican celdas `low`/`medium`/`high` en `1024x1024`, `1024x1536` y `1536x1024`. `auto`, formatos, transparencia y `xhigh`/`max`: ver matriz. `xhigh` y `max` no están en ninguna tabla de este modelo.

### `dall-e-2` y `dall-e-3` — `retired`

- G-DEP, aviso 2025-11-14: apagado el **12 de mayo de 2026**. Esa fecha ya pasó.
- G-CHANGE repite que se eliminaron de la API en esa fecha.
- SDK-NODE `createVariation`: el método sigue en el cliente con la anotación de que el endpoint está retired. El comentario remite a editar con un modelo GPT Image y un prompt. El CLI no debe llamar a `images.createVariation` ni a `POST /v1/images/variations`.
- `quality` `hd` y `standard`, `style` `vivid`/`natural`, `response_format` `url`/`b64_json` y los tamaños `256x256`, `512x512`, `1792x1024`, `1024x1792` permanecen en el esquema como contrato legado. SDK-PY dice que `response_format` y `style` no están soportados en los modelos GPT Image, que siempre devuelven base64. El CLI no debe exponerlos.

## Endpoints que sí existen

| Método y ruta | Uso | Fuente |
| --- | --- | --- |
| `POST /v1/images/generations` | Generación. SDK Node: `client.images.generate`. | G-IMG, SDK-NODE |
| `POST /v1/images/edits` | Edición, referencias y máscara. Multipart. SDK Node: `client.images.edit`. | G-IMG, SDK-NODE |
| `POST /v1/responses` | Conversación. La imagen va en `tools[].type = "image_generation"`. SDK Node: `client.responses.create`. | G-IMG, G-TOOL |
| `POST /v1/files` con `purpose: "batch"` | Subir el JSONL del Batch. | G-BATCH |
| `POST /v1/batches` | Crear batch. `completion_window` solo `24h`. | G-BATCH |
| `GET /v1/batches/{id}` | Estado. | G-BATCH |
| `POST /v1/batches/{id}/cancel` | Cancelar. | G-BATCH |
| `GET /v1/files/{id}/content` | Descargar salida o error del batch. | G-BATCH |
| Files API | G-IMG: en Responses, una imagen de entrada puede ser un file id creado con la Files API. | G-IMG |

El cuerpo de cada línea JSONL de Batch usa los mismos parámetros que el endpoint de destino. G-BATCH lista como destinos permitidos, entre otros, `/v1/images/generations` y `/v1/images/edits`. Un archivo de batch solo puede contener solicitudes de un mismo modelo. G-BATCH, sección “Model availability”, dice de forma explícita que GPT Image 2.5 admite generación y edición en batch con Flare y Sunburst, incluidos los snapshots `2026-09-08`. Las páginas de modelo marcan además `v1/batch` supported para `gpt-image-2`, `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini` y `chatgpt-image-latest`.

### Endpoints que no deben usarse

| Ruta | Motivo |
| --- | --- |
| `POST /v1/images/variations` | Retired. SDK-NODE lo marca deprecated. |
| `v1/chat/completions`, realtime, assistants, embeddings, speech, transcription, moderation, fine-tuning, completions legacy, videos, live | Las páginas de modelo de imagen los marcan not supported. No son rutas de este CLI. |
| Cualquier parámetro `style` enviado a un modelo GPT Image | SDK-PY: no soportado; el estilo se describe en el prompt. |

## Parámetros de `POST /v1/images/generations`

Contrato tomado de SDK-PY `ImageGenerateParams` y cruzado con SDK-NODE `v7.34.0` y con las guías. Todos verificados el 2026-10-15.

| Parámetro | Valores verificados | Notas |
| --- | --- | --- |
| `prompt` | string, obligatorio | Máximo **32 000** caracteres en el esquema. G-IMG no repite el número. |
| `model` | IDs listados en la sección de modelos, más los snapshots fechados que el esquema nombra | El esquema ya no presenta `dall-e-2` ni `dall-e-3` como modelos a especificar en el texto de `model` de generación. Hay que pasar el modelo siempre. El default histórico `dall-e-2` del HTML de referencia no se usa. |
| `quality` | Enum del esquema de generación: `low`, `medium`, `high`, `xhigh`, `max`, `auto`, `standard`, `hd` | `auto` es el default del esquema. `low`/`medium`/`high` valen para los GPT Image. `xhigh` y `max` solo para Sunburst y Flare, incluidos snapshots `2026-09-08` (SDK-PY, G-IMG, G-PROMPT, G-TOOL). `standard` y `hd` son legado DALL·E. El CLI los rechaza. |
| `size` | `auto`, `1024x1024`, `1536x1024`, `1024x1536`, y `WIDTHxHEIGHT` solo en las familias que lo documentan | Ver sección de tamaños. También quedan en el enum legado `256x256`, `512x512`, `1792x1024`, `1024x1792`: el CLI no los ofrece. |
| `background` | `transparent`, `opaque`, `auto` | `auto` es el default. Con `transparent`, formato `png` o `webp`. |
| `output_format` | `png`, `jpeg`, `webp` | Default `png` (G-IMG y esquema de edit; generate lo describe como uno de esos tres). |
| `output_compression` | entero 0–100 | Solo `jpeg` o `webp`. Default del esquema: 100. G-PROMPT: no usarlo con PNG. |
| `n` | entero **1–10** | G-IMG: existe y por defecto la API devuelve una imagen, pero la guía no publica el máximo. El máximo 1–10 está en el OpenAPI del SDK. |
| `stream` | `true` / `false` | Default `false`. Solo modelos GPT Image, según el comentario del esquema. |
| `partial_images` | entero **0–3** | Ver streaming. |
| `moderation` | `auto` (default), `low` | G-IMG. Está en generate. **No** está en `ImageEditParams` del OpenAPI leído. |
| `user` | string | Identificador de abuso. El CLI no lo pide en la spec de producto; no hace falta exponerlo en la primera versión. Si se añade, no debe contener secretos. |
| `response_format` | `url`, `b64_json` | Legado. No soportado en GPT Image. No exponer. |
| `style` | `vivid`, `natural` | Legado. No soportado en GPT Image. No exponer. |
| `input_fidelity` | no está en generate | Solo en edit y en la herramienta. Omitirlo en generación. |

La respuesta `ImagesResponse` (SDK-NODE) incluye `created`, `data[]`, y de forma opcional `background` (`transparent`|`opaque`), `output_format`, `quality` (`low`|`medium`|`high`|`xhigh`|`max`, sin `auto`: el servidor ya resolvió el valor), `size` y `usage`. Cada `Image` tiene `b64_json`. El comentario de `revised_prompt` en `Image` dice: **no lo devuelven los modelos GPT Image**. `url` tampoco. El `revised_prompt` documentado vive en la llamada de la herramienta de Responses, no en Images API.

`usage` en el comentario de SDK-NODE dice “For `gpt-image-1` only”. G-IMG, en costes de 2.5, dice que hay que usar el `usage` de la respuesta para medir el consumo. Conflicto C3. El CLI lee `usage` cuando viene y, si no viene, no inventa tokens.

Campos de `usage` verificados en SDK-NODE:

- `input_tokens`
- `input_tokens_details.image_tokens`
- `input_tokens_details.text_tokens`
- `output_tokens`
- `output_tokens_details.image_tokens` (opcional el objeto)
- `output_tokens_details.text_tokens`
- `total_tokens`

## Parámetros de `POST /v1/images/edits`

| Parámetro | Valores verificados | Notas |
| --- | --- | --- |
| `image` | archivo o array | PNG, WEBP o JPG, cada uno **menor de 50 MB**. Hasta **16** imágenes. Lista de modelos del esquema: 1, 1-mini, 1.5, 2, `gpt-image-2-2026-04-21`, Sunburst, snapshot Sunburst, Flare, snapshot Flare, `chatgpt-image-latest`. |
| `prompt` | string, obligatorio | Máximo 32 000 caracteres para GPT Image. |
| `mask` | PNG | Ver máscaras. |
| `model` | mismos IDs que `image` | Pasarlo siempre. |
| `quality` | `low`, `medium`, `high`, `xhigh`, `max`, `auto`, `standard` | El enum de edit incluye `standard` y no incluye `hd`. Misma regla de producto: rechazar `standard`/`hd`. `xhigh`/`max` solo 2.5. Default del esquema: `auto`. |
| `size` | igual que generación para las familias flexibles | El comentario de edit repite las reglas de `WIDTHxHEIGHT` para 2 y 2.5. Default `auto`. |
| `background`, `output_format`, `output_compression`, `n`, `stream`, `partial_images`, `user` | iguales que generación | `n` también es 1–10 en edit. |
| `input_fidelity` | `high` o `low` | SDK-PY: `high` y `low` en `gpt-image-1` y `gpt-image-1.5`. `gpt-image-1-mini` solo `low`. En `gpt-image-2`, **omitir** el parámetro. Default `low` en los modelos que lo soportan. Sunburst, Flare y `chatgpt-image-latest` no se nombran: para ellos el CLI omite el campo. G-PROMPT confirma lo mismo para 2, 1.5 y 1. |
| `moderation` | ausente del esquema de edit | No enviarlo en edit. |
| `response_format` | legado | No enviarlo. |

G-IMG: el endpoint de edición sirve para editar una imagen, para generar una imagen nueva usando otras como referencia, y para editar una zona con máscara.

## Tamaños

### Sunburst y Flare

G-IMG, “Size and quality options”, y G-PROMPT:

- Recomendados: `1024x1024`, `1536x1024`, `1024x1536`.
- También `auto` y resolución custom `WIDTHxHEIGHT`.
- Ejemplos citados como habituales: `2048x2048`, `2048x1152`, `3840x2160`, `2160x3840`.
- Ancho y alto múltiplos de 16.
- Relación de aspecto entre 1:3 y 3:1.
- Ningún lado mayor de **3840** px (redacción de G-IMG).
- Píxeles totales entre **655 360** y **8 294 400**.
- Resoluciones por encima de `2560x1440` son **experimentales**.
- El esquema añade: “the maximum supported resolution is `3840x2160`” y “the requested size must also satisfy the model's current pixel and edge limits”. `3840x2160` son exactamente 8 294 400 píxeles. Un cuadrado `2880x2880` también suma 8 294 400 y ningún lado pasa de 3840. El CLI aplica las cuatro restricciones numéricas de G-IMG y advierte, sin rechazar, cuando `width * height > 2560 * 1440`.

### `gpt-image-2`

G-IMG, sección “Earlier GPT Image models”, publica la misma tabla de restricciones (lados ≤ 3840 y múltiplos de 16, relación ≤ 3:1, píxeles entre 655 360 y 8 294 400) y las calidades `low`, `medium`, `high`, `auto`. Tamaños populares: los tres clásicos, `2048x2048`, `2048x1152`, `3840x2160`, `2160x3840`, `auto`. El esquema agrupa a `gpt-image-2` con 2.5 para `WIDTHxHEIGHT`. Por encima de `2560x1440`, experimental, igual que el párrafo del esquema.

### Anteriores a `gpt-image-2`

G-PROMPT, tablas de 1.5 y de 1: `1024x1024`, `1024x1536`, `1536x1024` o `auto`. No hay `WIDTHxHEIGHT`. No hay `xhigh` ni `max`.

`chatgpt-image-latest` y `gpt-image-1-mini` no tienen esa tabla. M-CHAT y M-MINI solo publican precios para esos tres tamaños y para `low`/`medium`/`high`. El esquema dice que los tamaños estándar los soportan “the GPT image models” y que `auto` existe “for models that allow automatic sizing”, sin nombrar a estos dos. Decisión de producto, justificada en la matriz: solo los tres tamaños publicados en su tabla de precios, más `auto` porque el esquema lo declara para los GPT Image que permiten sizing automático y estos IDs están en la lista de modelos GPT Image del esquema. Cualquier `WIDTHxHEIGHT` se rechaza. Si una llamada real demostrara lo contrario, se actualiza la investigación; no se habilita por intuición.

## Calidades

| Familia | Valores que el CLI acepta | Fuente |
| --- | --- | --- |
| Sunburst, Flare y sus snapshots `2026-09-08` | `auto`, `low`, `medium`, `high`, `xhigh`, `max` | G-IMG, G-PROMPT, G-TOOL, M-SUN, M-FLARE, SDK-PY |
| `gpt-image-2` y snapshot | `auto`, `low`, `medium`, `high` | G-PROMPT, G-IMG. El esquema no les atribuye `xhigh`/`max`. |
| `gpt-image-1.5`, `gpt-image-1` | `auto`, `low`, `medium`, `high` | G-PROMPT |
| `gpt-image-1-mini`, `chatgpt-image-latest` | `auto`, `low`, `medium`, `high` | Precios publicados solo en low/medium/high. `xhigh`/`max` no aparecen. `auto` es el default de los GPT Image en el esquema y en G-IMG (“earlier GPT Image models support quality settings up to `high`”). |
| DALL·E | no seleccionables | Retired. |

G-PROMPT: una calidad más alta no garantiza un resultado mejor en todos los prompts. `xhigh` y `max` se usan solo cuando hace falta. El default de la API sigue siendo `auto`.

## Formatos, compresión y transparencia

- Salida: `png` (default), `jpeg`, `webp`. G-IMG: JPEG es más rápido que PNG.
- `output_compression` 0–100 solo con JPEG o WebP. No enviarlo con PNG.
- `background: "transparent"` exige `png` o `webp`. JPEG con transparencia se rechaza en local antes de llamar.
- Sunburst y Flare: G-IMG lo documenta como soportado, no como preview.
- `gpt-image-2`: G-PROMPT y G-TOOL dicen que la transparencia está en **preview**.
- `gpt-image-1` y `gpt-image-1.5`: G-PROMPT dice que hay que pedir `transparent` de forma explícita y usar PNG o WebP.
- `gpt-image-1-mini` y `chatgpt-image-latest`: ninguna fuente consultada les atribuye `background: transparent` por su nombre. Queda `UNKNOWN`. El CLI lo rechaza.
- G-PROMPT: un damero pintado no es transparencia. Hay que mirar el canal alfa del archivo decodificado. El modelo no garantiza un recorte exacto.
- G-IMG: la API de imágenes devuelve datos en base64. No hay URL que descargar en los modelos GPT Image.

## Máscaras

Dos descripciones oficiales, las dos del 2026-10-15:

1. G-IMG, “Mask requirements”: la imagen y la máscara deben tener el mismo formato y el mismo tamaño, y pesar menos de 50 MB. La máscara debe tener canal alfa. “Masking with GPT Image is entirely prompt-based. The model uses the mask as guidance, but may not follow its exact shape with complete precision.” Si hay varias imágenes, la máscara se aplica a la primera.
2. SDK-PY `mask`: archivo PNG válido, menos de **4 MB**, mismas dimensiones que `image`. Las zonas totalmente transparentes (alfa cero) indican dónde debe editarse la imagen.

El CLI aplica la intersección estricta, registrada como conflicto C4:

- La máscara tiene que ser PNG (OpenAPI), aunque la guía diga “el mismo formato”.
- Debe tener canal alfa.
- Mismas dimensiones en píxeles que la primera imagen.
- Tamaño de archivo menor de 4 MB (OpenAPI, más estricto que los 50 MB de la guía).
- Las imágenes de entrada siguen el límite de 50 MB y 16 archivos.
- Alfa 0 = zona editable. Alfa opaco = zona que se pide conservar. Eso orienta; no garantiza el contorno.
- En Responses la máscara no va como campo `mask` de Images. Va en `tools[].input_image_mask`, con `file_id` o `image_url` base64 (SDK-PY `ImageGenerationInputImageMask`). G-IMG muestra `input_image_mask.file_id`.

Operaciones locales de máscara (inspección, inversión, unión, intersección, dilatación, erosión, desenfoque, rectángulos, polígonos) no existen como parámetros de la API. Son preparación local y están especificadas en el plan de implementación. No se presentan como una capacidad del modelo.

## Referencias

- Edit: hasta **16** imágenes, PNG/WEBP/JPG, cada una < 50 MB (OpenAPI).
- G-IMG ilustra 4 referencias en el ejemplo de la cesta. Ese 4 es un ejemplo, no el máximo.
- G-PROMPT: hay que numerar cada referencia y asignarle un papel en lenguaje natural (sujeto, estilo, ropa, fondo). No existe un parámetro `role`.
- Responses acepta la imagen de tres maneras (G-IMG): URL absoluta, data URL base64, o file id.
- Images edit recibe bytes multipart, no una URL. G-IMG presenta los file id y las URL como una diferencia de Responses frente a Image API.
- No hay un parámetro oficial de “compose”. Componer es `images.edit` o la herramienta con varias imágenes y un prompt.

## `n`, streaming y `partial_images`

- G-IMG: `n` genera varias imágenes en una sola solicitud. Default: una.
- OpenAPI: `n` de 1 a 10 en generate y en edit.
- La herramienta `ImageGeneration` de SDK-PY **no tiene campo `n`**. En modo Responses, `--count` mayor que 1 son llamadas distintas, cada una con su `response.id`. No se envía `n` dentro de `tools[]`.
- G-IMG: Images API y Responses pueden hacer streaming. `partial_images` de 0 a 3. Con 0 solo llega la imagen final. Con un valor mayor, puede que no lleguen todos los parciales si la imagen final termina antes.
- G-TOOL dice “1-3”. El OpenAPI y G-IMG dicen 0-3. Manda 0-3 (conflicto C5). 0 es válido y significa solo la final.
- Eventos Images API en SDK-NODE: `image_generation.partial_image`, `image_generation.completed`, `image_edit.partial_image`, `image_edit.completed`. El parcial trae `b64_json`, `partial_image_index` (base 0), `background`, `output_format`, `quality`, `size`, `created_at`.
- Responses, en los ejemplos de G-IMG y G-TOOL: evento de parcial con `partial_image_b64` y `partial_image_index`, y la final en `image_generation_call.result` al completar. El nombre de tipo que muestra el ejemplo Ruby de G-TOOL es `ResponseImageGenCallPartialImageEvent`. El implementador debe enlazar los tipos exportados por `openai@7.34.0`, no inventar otro nombre si el paquete ya lo exporta.
- Combinar `stream: true` con `n > 1` no está descrito en las guías leídas. Queda `UNKNOWN`. El CLI lo rechaza.
- G-IMG, coste: cada imagen parcial añade **100 tokens de salida de imagen**.
- Los parciales no sustituyen al archivo final. El coste se contabiliza. No se fabrican parciales en local.

## Responses API

Separación obligatoria:

| Campo | Dónde va | Qué es |
| --- | --- | --- |
| `model` de `responses.create` | cuerpo de la respuesta | Modelo de lenguaje que puede llamar a la herramienta. |
| `tools[].model` | herramienta `image_generation` | Modelo de imagen. |
| `previous_response_id` | cuerpo de la respuesta | Continúa la conversación. No es un parámetro de Images API. |
| `stream` | cuerpo de la respuesta | No va dentro de la herramienta. |
| `action`, `partial_images`, `quality`, `size`, `background`, `output_format`, `output_compression`, `moderation`, `input_image_mask` | herramienta | No se mezclan con los campos de Images API en el mismo objeto. |

`action` (G-IMG, G-TOOL, SDK-PY): `auto` (default), `generate`, `edit`. Si se fuerza `edit` sin una imagen en el contexto, la llamada devuelve error. `tool_choice: {"type":"image_generation"}` fuerza el uso de la herramienta (G-TOOL).

`revised_prompt`: lo produce el modelo principal (G-IMG pone como ejemplo `gpt-5.5`). Se lee en el objeto `image_generation_call` (`id`, `type`, `status`, `revised_prompt`, `result`). En Images API el comentario del SDK dice que los GPT Image no devuelven `revised_prompt`. El CLI guarda `null` y lo etiqueta como no disponible en ese modo. No lo copia del prompt del usuario.

Modelos principales que G-TOOL lista como capaces de usar la herramienta:

`gpt-5.5`, `gpt-5.4-mini`, `gpt-5.4-nano`, `gpt-5.2`, `gpt-5`, `gpt-5-nano`, `o3`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `gpt-4o`, `gpt-4o-mini`.

G-IMG, más reciente en el tono: “When using image generation in the Responses API, `gpt-5` and newer models should support the image generation tool. Check the model detail page.” Los ejemplos de código de G-IMG y G-TOOL usan `gpt-6-astra` como modelo principal. `gpt-6-astra` **no** está en la lista de G-TOOL. Conflicto C6. El default del CLI es `gpt-5.5` porque está en la lista y es el ejemplo del texto de `revised_prompt`. `gpt-6-astra` queda seleccionable solo si el usuario lo escribe, con advertencia de que la lista de G-TOOL no lo incluye.

El default de `image_generation.model` en el esquema es `gpt-image-1`. Ese default no se hereda: el CLI siempre envía el modelo de imagen configurado. `gpt-image-1` se apaga el 2026-10-23.

No hay campo `n` en la herramienta. No hay parámetro `preserve`. No hay parámetro de roles semánticos.

## Batch API

Verificado en G-BATCH el 2026-10-15:

- Destinos que nos importan: `/v1/images/generations` y `/v1/images/edits`. También existe `/v1/responses`, así que un batch de Responses es un destino documentado distinto. El CLI de imágenes usa los dos destinos de Images API para el modo nativo. No se envía la herramienta de imagen dentro de un batch de `/v1/responses` en la primera versión: la guía no muestra un ejemplo de `image_generation` dentro de un JSONL de batch. Eso queda `UNKNOWN` y deshabilitado.
- Línea: `{"custom_id","method":"POST","url","body"}`. `custom_id` único.
- Un archivo, un solo modelo.
- Subida con Files `purpose: "batch"`.
- Crear con `input_file_id`, `endpoint`, `completion_window: "24h"`. `metadata` opcional.
- Estados: `validating`, `failed`, `in_progress`, `finalizing`, `completed`, `expired`, `cancelling`, `cancelled`.
- La salida no conserva el orden de entrada. Hay que casar por `custom_id`. Los fallos van al `error_file_id`. El archivo de salida se borra a los 30 días.
- Límites: 50 000 solicitudes por batch, archivo de entrada hasta 200 MB, hasta 2 000 batches por hora. El límite de tokens en cola depende del modelo y está en la página de Platform Settings de cada cuenta: el número concreto por cuenta es `UNKNOWN`.
- Descuento documentado: 50 % respecto de la API síncrona. Las tablas de G-PRICE cuadran con esa mitad en los modelos de imagen.
- Al expirar, las solicitudes no terminadas se cancelan. Se cobra lo que sí se completó. El error de ejemplo usa `code: "batch_expired"`.
- G-BATCH dice que el worker de batch rechaza `stream=true` en el párrafo de moderación. No hay una frase equivalente en el párrafo de imágenes. El CLI no envía `stream` ni `partial_images` en un cuerpo de batch. Es una regla de producto para no pedir streaming en un trabajo de 24 h, no una cita de que Images-batch lo rechace. Esa cita concreta queda `UNKNOWN`.

La cola local reanudable no es una API de OpenAI. Existe porque el producto la pide cuando el batch nativo no aplica o cuando el usuario quiere ejecución inmediata.

## Límites y seguridad de la API

- Prompt: 32 000 caracteres (OpenAPI).
- Imágenes de edit: 16, PNG/WEBP/JPG, < 50 MB cada una.
- Máscara: PNG, < 4 MB, mismas dimensiones, con alfa.
- `n`: 1–10.
- `partial_images`: 0–3.
- Latencia: G-IMG dice que un prompt complejo puede tardar hasta 2 minutos. No publica un timeout HTTP. El timeout del cliente es una decisión del CLI (180 000 ms por defecto) para no cortar ese caso.
- Rate limits de las páginas de modelo: solo Build, Launch y Grow, en TPM e IPM. No hay un número de concurrencia. La concurrencia del CLI es local.
- Verificación de organización: G-IMG dice que puede hacer falta completar API Organization Verification en la consola de desarrollador antes de usar los modelos GPT Image. `doctor` lo menciona. No puede comprobarlo sin una llamada real.
- Moderación (G-IMG): `moderation` `auto` o `low` en generación y en la herramienta. Todos los prompts y las imágenes generadas se filtran. Errores de usuario con `error.type = "image_generation_user_error"`. El discriminador estable es `error.code`. `moderation_blocked` puede traer `moderation_details.moderation_stage` (`input`, `output`, `unknown`) y `moderation_details.categories` (ejemplos de la guía: `harassment`, `self-harm`, `sexual`, `violence`). No reintentar estos errores ni los de cuota. Sí reintentar con backoff los rate limit y los fallos de servidor transitorios. Guardar el request id. No mostrar al usuario final las categorías en bruto si la guía pide un mensaje genérico; sí guardarlas en el log de depuración, sin secretos.

## Tarifas y facturación

Precios por 1 000 000 de tokens. G-PRICE, tablas Standard y Batch de “Image generation models”, 2026-10-15. La celda `-` se copia tal cual: esa modalidad no tiene precio publicado.

### Standard

| Modelo | Modalidad | Input | Cached input | Output |
| --- | --- | --- | --- | --- |
| gpt-image-2.5-sunburst | Image | 8.00 USD | 2.00 USD | 30.00 USD |
| gpt-image-2.5-sunburst | Text | 5.00 USD | 1.25 USD | — |
| gpt-image-2.5-flare | Image | 8.00 USD | 2.00 USD | 30.00 USD |
| gpt-image-2.5-flare | Text | 5.00 USD | 1.25 USD | — |
| gpt-image-2 | Image | 8.00 USD | 2.00 USD | 30.00 USD |
| gpt-image-2 | Text | 5.00 USD | 1.25 USD | — |
| gpt-image-1.5 | Image | 8.00 USD | 2.00 USD | 32.00 USD |
| gpt-image-1.5 | Text | 5.00 USD | 1.25 USD | 10.00 USD |
| gpt-image-1-mini | Image | 2.50 USD | 0.25 USD | 8.00 USD |
| gpt-image-1-mini | Text | 2.00 USD | 0.20 USD | — |
| gpt-image-1 | Image | 10.00 USD | 2.50 USD | 40.00 USD |
| gpt-image-1 | Text | 5.00 USD | 1.25 USD | — |
| chatgpt-image-latest | Image | 8.00 USD | 2.00 USD | 32.00 USD |
| chatgpt-image-latest | Text | 5.00 USD | 1.25 USD | 10.00 USD |

M-SUN y M-FLARE repiten las tarifas de imagen y de texto de entrada, y añaden: la salida de imagen cuesta 30 USD / 1M en Standard o 15 USD / 1M en Batch. Dicen que la calculadora de GPT Image 2 **no** estima el consumo de tokens de GPT Image 2.5.

### Batch (50 %)

| Modelo | Modalidad | Input | Cached input | Output |
| --- | --- | --- | --- | --- |
| gpt-image-2 | Image | 4.00 USD | 1.00 USD | 15.00 USD |
| gpt-image-2 | Text | 2.50 USD | 0.625 USD | — |
| gpt-image-2.5-sunburst | Image | 4.00 USD | 1.00 USD | 15.00 USD |
| gpt-image-2.5-sunburst | Text | 2.50 USD | 0.625 USD | — |
| gpt-image-2.5-flare | Image | 4.00 USD | 1.00 USD | 15.00 USD |
| gpt-image-2.5-flare | Text | 2.50 USD | 0.625 USD | — |
| gpt-image-1.5 | Image | 4.00 USD | 1.00 USD | 16.00 USD |
| gpt-image-1.5 | Text | 2.50 USD | 0.63 USD | 5.00 USD |
| gpt-image-1-mini | Image | 1.25 USD | 0.13 USD | 4.00 USD |
| gpt-image-1-mini | Text | 1.00 USD | 0.10 USD | — |
| gpt-image-1 | Image | 5.00 USD | 1.25 USD | 20.00 USD |
| gpt-image-1 | Text | 2.50 USD | 0.63 USD | — |
| chatgpt-image-latest | Image | 4.00 USD | 1.00 USD | 16.00 USD |
| chatgpt-image-latest | Text | 2.50 USD | 0.63 USD | 5.00 USD |

G-PRICE bajo ambas tablas: “Cached input rates for GPT Image 2 and GPT Image 2.5 only apply to images generated with the Responses API.” G-IMG precisa que el precio cacheado de GPT Image 2 y 2.5 solo aplica a la herramienta de Responses, no a Images API, incluidos `/v1/images/edits`. Los aciertos de caché se reflejan en la factura, pero sus tokens cacheados no vienen en el `usage` de Responses. El CLI no puede verificar el descuento de caché con la respuesta.

G-IMG: una petición Responses suma el uso del modelo principal y el coste de la imagen. Hay que estimar las dos partes por separado. La tarifa del modelo principal depende del modelo elegido; no se copia aquí una tarifa de `gpt-5.5` como si fuera coste de imagen. Quien implemente el estimador lee la fila de ese modelo en G-PRICE en el momento de codificar la tabla y cita la misma fecha, o marca el modelo de texto como “tarifa no cargada” hasta que la tabla local la incluya. La tabla de imagen de este documento es la que hay que copiar.

Nota global de G-PRICE, no específica de imagen: los endpoints de residencia regional cobran un 10 % más en modelos publicados el 5 de marzo de 2026 o después, y FedRAMP también un 10 %. No hay una frase que diga que los modelos de imagen entren en ese recargo. El estimador lo menciona como posible recargo `UNKNOWN` para imagen, no lo suma por defecto.

### Precios por imagen ya publicados

Son precios de salida orientativos. G-IMG dice que además hay que sumar tokens de texto de entrada y, en ediciones, tokens de imagen de entrada. No sustituyen a `usage`.

Modelos anteriores a `gpt-image-2`, tokens de salida (G-IMG):

| Quality | 1024×1024 | 1024×1536 | 1536×1024 |
| --- | --- | --- | --- |
| Low | 272 | 408 | 400 |
| Medium | 1056 | 1584 | 1568 |
| High | 4160 | 6240 | 6208 |

USD por imagen de salida, mismas tres columnas, G-IMG “Calculating costs”. La cabecera de la tabla llegó desordenada en la extracción markdown; el orden de columnas se confirma porque las filas de GPT Image 1.5 coinciden con M-15 (`1024x1024`, `1024x1536`, `1536x1024`):

| Modelo | Quality | 1024×1024 | 1024×1536 | 1536×1024 |
| --- | --- | --- | --- | --- |
| gpt-image-2 | Low | 0.006 | 0.005 | 0.005 |
| gpt-image-2 | Medium | 0.053 | 0.041 | 0.041 |
| gpt-image-2 | High | 0.211 | 0.165 | 0.165 |
| gpt-image-1.5 | Low | 0.009 | 0.013 | 0.013 |
| gpt-image-1.5 | Medium | 0.034 | 0.05 | 0.05 |
| gpt-image-1.5 | High | 0.133 | 0.2 | 0.2 |
| gpt-image-1 | Low | 0.011 | 0.016 | 0.016 |
| gpt-image-1 | Medium | 0.042 | 0.063 | 0.063 |
| gpt-image-1 | High | 0.167 | 0.25 | 0.25 |
| gpt-image-1-mini | Low | 0.005 | 0.006 | 0.006 |
| gpt-image-1-mini | Medium | 0.011 | 0.015 | 0.015 |
| gpt-image-1-mini | High | 0.036 | 0.052 | 0.052 |

M-CHAT publica para `chatgpt-image-latest` los mismos USD por imagen que 1.5 en esas nueve celdas. No hay fila equivalente dentro de la tabla “Calculating costs” de G-IMG. Se usan las celdas de M-CHAT.

Sunburst y Flare: **no hay** tabla USD por imagen. No se reutilizan las celdas de `gpt-image-2`. Con `quality` o `size` en `auto`, G-IMG dice que el consumo depende de la imagen generada: el estimador devuelve un rango o `unknown`, no un único número.

G-IMG también dice que una resolución no cuadrada más grande a veces produce menos tokens de salida que una más pequeña o cuadrada, a la misma calidad. Por eso está prohibido extrapolar tokens con una fórmula de “píxeles × constante” que no esté publicada.

Parciales: +100 tokens de salida de imagen por parcial, encima de la imagen final.

## Registro de conflictos

| ID | Hecho | Decisión del CLI |
| --- | --- | --- |
| C1 | M-1 marca `v1/responses` supported para `gpt-image-1`. El resto de páginas de imagen lo marcan not supported. G-TOOL lo trata como modelo de la herramienta. | Nunca usar un ID de imagen como `responses.create.model`. |
| C2 | G-TOOL no nombra `chatgpt-image-latest` en el párrafo de la herramienta. El OpenAPI sí lo incluye en el enum. | Permitirlo como `tools[].model` porque el esquema actual lo lista, y avisar de que la prosa de G-TOOL no lo nombra. |
| C3 | El comentario de `usage` en SDK-NODE dice que es solo de `gpt-image-1`. G-IMG manda leer `usage` en 2.5. | Leer `usage` si viene. Si no viene, el coste queda como estimación o desconocido. |
| C4 | La guía limita máscara e imagen a 50 MB y “el mismo formato”. El OpenAPI exige PNG de menos de 4 MB. | PNG, alfa, mismas dimensiones, máscara < 4 MB, imágenes < 50 MB. |
| C5 | G-TOOL dice `partial_images` 1–3. G-IMG y el OpenAPI dicen 0–3. | Aceptar 0–3. |
| C6 | Los ejemplos usan `gpt-6-astra`. La lista de G-TOOL no lo incluye. G-IMG dice que `gpt-5` y posteriores deberían soportar la herramienta. | Default `gpt-5.5`. Otro modelo principal solo si el usuario lo fija, con la advertencia. |
| C7 | El HTML de API Reference que devolvió el buscador no lista `xhigh`/`max` y sigue mostrando `style` y `response_format` en el ejemplo. Las guías y el OpenAPI de `openai@7.34.0` sí describen `xhigh`/`max` para 2.5 y declaran `style` y `response_format` como legado. | Manda la guía más el OpenAPI del SDK que el proyecto instala. |
| C8 | M-2 lista un solo snapshot fechado. El alias `gpt-image-2` es el model id y está en el esquema. | Aceptar alias y snapshot. |
| C9 | G-BATCH documenta en prosa el batch de imágenes para 2.5. Las páginas de los otros modelos marcan `v1/batch` supported y los dos paths de imagen están en la lista general de destinos. | Batch nativo habilitado para todo modelo cuya página diga `v1/batch` supported, más la frase explícita de 2.5. El cuerpo no lleva `stream`. |

## Lo que no existe o no se pudo verificar

- No existe, para los modelos GPT Image, un parámetro `style`.
- No existe un endpoint de variaciones utilizable. Está retirado.
- No existe `xhigh` ni `max` documentado para `gpt-image-2`, 1.5, 1, 1-mini ni `chatgpt-image-latest`.
- No existe campo `n` en la herramienta `image_generation`.
- No existe `revised_prompt` documentado como retorno de Images API para GPT Image. El comentario del SDK dice que no se devuelve.
- No existe un parámetro nativo `preserve`, ni roles (`subject`, `face`, …), ni `outpaint`, ni dirección `top`/`left`, ni plantilla de estilo.
- No existe una API de segmentación, de upscale fotográfico, de restauración de detalle ni de OCR de verificación.
- No se verificó transparencia para `gpt-image-1-mini` ni para `chatgpt-image-latest`.
- No se verificó inpainting para `gpt-image-1-mini` (la página no lo lista).
- No se verificó `input_fidelity` para Sunburst, Flare ni `chatgpt-image-latest`. Hay que omitirlo.
- No se verificó el precio por imagen de Sunburst ni de Flare. La calculadora de GPT Image 2 no sirve para su consumo de tokens.
- No se verificó que `stream` junto con `n > 1` funcione.
- No se verificó un ejemplo de batch cuyo `url` sea `/v1/responses` y cuyo cuerpo lleve la herramienta `image_generation`.
- No se verificó que el worker de batch rechace `stream=true` en imágenes. Solo está escrito para moderación.
- No se verificaron rate limits por encima del tier Grow, ni el cupo de tokens en cola de la cuenta.
- No se verificó un timeout de servidor. “Hasta 2 minutos” es una limitación de latencia de la guía.
- No se verificó soporte de la herramienta para `gpt-6-astra` más allá de que los ejemplos lo usan y de la frase “gpt-5 and newer should”.
- No se descargó el HTML de API Reference (404 en las rutas `.md` probadas). No se completa el contrato con ese HTML.
- No hay página de modelo, en las búsquedas del 2026-10-15, para otro generador de imágenes además de los nueve IDs de este documento (siete utilizables y dos DALL·E retirados).
