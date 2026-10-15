# Matriz de capacidades

Fecha de la investigación que sostiene esta matriz: **2026-10-15**. Las citas están en [API-RESEARCH.md](./API-RESEARCH.md). Si esta matriz y la investigación chocan, manda la investigación y hay que corregir la matriz antes de codificar.

Leyenda de origen:

| Origen | Significado |
| --- | --- |
| `native` | La API oficial lo hace y el CLI puede llamarlo. |
| `local` | Lo hace el proceso con Sharp u otro código local. No llama a OpenAI y no pide `OPENAI_API_KEY`. |
| `pipeline` | Varios pasos reales. Cada paso se etiqueta. El conjunto no es un parámetro de la API. |
| `experimental` | La documentación lo ofrece y lo marca como preview o como resolución experimental. El CLI lo ejecuta y lo etiqueta. No promete estabilidad. |
| `disabled` | El comando existe o el flag se reconoce, y termina con código de salida 11 y un motivo. No simula un resultado correcto. |

## Modelos que el registro conoce

| ID | Estado el 2026-10-15 | Seleccionable por defecto | Aviso al usarlo |
| --- | --- | --- | --- |
| `gpt-image-2.5-flare` | active | Sí. Es el default del producto. | Ninguno de apagado. |
| `gpt-image-2.5-sunburst` | active | Sí | Ninguno de apagado. Preferir este ID cuando el usuario pida precisión de edición. |
| `gpt-image-2.5-flare-2026-09-08` | active, snapshot | Sí | Mismas capacidades que el alias. |
| `gpt-image-2.5-sunburst-2026-09-08` | active, snapshot | Sí | Mismas capacidades que el alias. |
| `gpt-image-2` | active | Sí | Transparencia en preview. |
| `gpt-image-2-2026-04-21` | active, snapshot | Sí | Igual que el alias. |
| `gpt-image-1.5` | deprecated, apagado 2026-12-01 | Sí, con aviso | Aviso en stderr. |
| `chatgpt-image-latest` | deprecated, apagado 2026-12-01 | Sí, con aviso | Aviso. Transparencia deshabilitada. La prosa de la guía de herramienta no lo nombra; el esquema sí. |
| `gpt-image-1-mini` | deprecated, apagado 2026-12-01 | Sí, con aviso | Aviso. Máscara y transparencia deshabilitadas. |
| `gpt-image-1` | deprecated, apagado 2026-10-23 | Sí, con aviso fuerte | Aviso de apagado inminente respecto del 2026-10-15. |
| `dall-e-2`, `dall-e-3` | retired desde 2026-05-12 | No | `models inspect` explica el retiro. Cualquier comando que los pida sale 11. |

El default de modelo de imagen es `gpt-image-2.5-flare` porque la guía de prompting dice que un flujo nuevo empiece por Flare cuando la prioridad es la velocidad. No es un default de la API. El default de la herramienta en el esquema sigue siendo `gpt-image-1` y el CLI no lo hereda: siempre manda el modelo configurado.

El default del modelo de Responses es `gpt-5.5`. No es un modelo de imagen.

## Tabla comparativa

`Y` = native habilitado. `P` = experimental o preview, habilitado y etiquetado. `L` = solo local. `D` = disabled. `U` = la fuente no lo verifica y por eso está disabled.

| Capacidad | sunburst / flare | gpt-image-2 | gpt-image-1.5 | gpt-image-1 | gpt-image-1-mini | chatgpt-image-latest |
| --- | --- | --- | --- | --- | --- | --- |
| `images.generate` | Y | Y | Y | Y | Y | Y |
| `images.edit` | Y | Y | Y | Y | Y | Y |
| Herramienta `image_generation` | Y | Y | Y | Y | Y | Y, con aviso C2 |
| Modelo principal de Responses | D | D | D | D | D | D |
| Batch `/v1/images/generations` y `/v1/images/edits` | Y | Y | Y | Y | Y | Y |
| Batch de Responses con la herramienta | D | D | D | D | D | D |
| `quality` auto/low/medium/high | Y | Y | Y | Y | Y | Y |
| `quality` xhigh/max | Y | D | D | D | D | D |
| `quality` hd/standard | D | D | D | D | D | D |
| `size` auto y los tres tamaños clásicos | Y | Y | Y | Y | Y | Y |
| `size` arbitrario `WIDTHxHEIGHT` | Y, y P si pasa de 2560×1440 | Y, y P si pasa de 2560×1440 | D | D | D | D |
| `background` transparent + png/webp | Y | P | Y | Y | U → D | U → D |
| `background` transparent + jpeg | D | D | D | D | D | D |
| Máscara de inpainting | Y | Y | Y | Y | U → D | Y |
| Hasta 16 referencias png/webp/jpg | Y | Y | Y | Y | Y | Y |
| `n` 1–10 en Images API | Y | Y | Y | Y | Y | Y |
| `n` en la herramienta Responses | D | D | D | D | D | D |
| `stream` y `partial_images` 0–3 | Y | Y | Y | Y | Y | Y |
| `stream` con `n` > 1 | D | D | D | D | D | D |
| `input_fidelity` | D, omitir | D, omitir | Y, low o high | Y, low o high | Y, solo low | D, omitir |
| `moderation` en generate y en la herramienta | Y | Y | Y | Y | Y | Y |
| `moderation` en edit | D | D | D | D | D | D |
| `revised_prompt` | Solo Responses | Solo Responses | Solo Responses | Solo Responses | Solo Responses | Solo Responses |
| `response_format` y `style` de API | D | D | D | D | D | D |
| Endpoint de variaciones | D | D | D | D | D | D |

## Comandos de producto

Cada fila dice qué hace el CLI. “API” es el modo `images` o `responses` que esté configurado, con las reglas de la tabla anterior.

| Comando | Origen | Comportamiento exigido |
| --- | --- | --- |
| `generate` | native | Una llamada `images.generate` con `n`, o una llamada Responses por imagen. Rechaza parámetros incompatibles con el modelo antes de la red. |
| `edit` | native | `images.edit` o Responses con `action: "edit"` y la imagen en contexto. `--preserve` no se envía a la API. |
| `inpaint` | pipeline | Preparación local de la máscara y después edit nativo con `mask` o `input_image_mask`. Si el modelo tiene la máscara en `D`, el comando sale 11 y no llama. |
| `expand` | pipeline | Lienzo y máscara locales, luego edit nativo. No hay parámetro de outpainting. |
| `compose` | pipeline | Valida referencias y escribe sus roles en el prompt. La llamada es edit nativo. Máximo 16. |
| `style` | local + native | La plantilla es texto local. La imagen la produce generate o edit. No existe `--style` de API. |
| `transparent` | native, o P en gpt-image-2 | `background: "transparent"` y png/webp. En mini y chatgpt-image-latest sale 11. |
| `background remove` | native generativo, o disabled | Sin imagen: generate con fondo transparente, si el modelo lo admite. Con imagen: edit generativo con un prompt de aislamiento. El método local de segmentación está disabled. |
| `background replace` | native generativo | Edit con un prompt que describe el fondo nuevo. No promete un recorte exacto. |
| `session *` | local + native | El almacén es JSON local. `previous_response_id` solo en modo Responses cuando hay un id guardado. Si no, el fallback adjunta el archivo guardado a un edit y lo etiqueta `fallback`. |
| `prompt *` | local | Construye texto. `optimize` solo llama a un modelo de texto si el usuario pasa `--optimize` y `prompt.optimizeModel` está configurado. Si no, sale 11. Guarda el prompt original y el optimizado. |
| `typography` | pipeline | El texto entra en el prompt (estimado). La revisión con visión es opcional, también estimada, y exige `typography.reviewModel`. La alternativa exacta compone SVG con Sharp y no llama a la API. |
| `variations` | native vía generate/edit | Prohibido `images.createVariation`. El resultado no es determinista y el comando lo dice en stderr. |
| `media *` | local | Sharp. No lee `OPENAI_API_KEY`. |
| `upscale` | local | Interpolación Sharp. Conserva la entrada. El metadato dice `interpolation`. |
| `restore`, `enhance` | disabled en local “mágico”; generativo solo si el usuario pasa un prompt | No existe un modelo de restauración. Sin prompt, salen 11. Con prompt, es un edit generativo etiquetado y no promete recuperar detalle que no está en la entrada. La entrada original no se sobrescribe. |
| `batch` modo `openai` | native | JSONL real hacia `/v1/images/generations` o `/v1/images/edits` si el modelo tiene batch en `Y`. |
| `batch` modo `local` | local | Cola reanudable. No marca un ítem como hecho si la llamada no terminó bien. No repite los que ya tienen estado `succeeded`. |
| `cost estimate` | local | Rangos o `unknown` según la sección de tarifas. No presenta un rango como si fuera el importe cobrado. |
| `cost report` / `usage summary` | local | Suma lo que devolvió `usage` y separa las estimaciones. En Responses, el uso del modelo principal y el de la imagen van en partidas distintas. La caché de 2 y 2.5 no se da por verificada con `usage`. |
| `project`, `gallery` | local | Manifiesto, hoja de contacto y HTML estático. El HTML no llama a la red. |
| `doctor` | local | Comprueba binario, versión de Node, config, ausencia de secretos en archivos, y si `OPENAI_API_KEY` está presente sin imprimirla. La verificación de organización se menciona como requisito posible de la guía; sin una llamada real el resultado de ese punto es `not-checked`. |

## Reglas transversales

1. Un flag incompatible no se silencia ni se reescribe a otro valor. Se rechaza con código 2 o 11 y se nombra el campo, el modelo y la fuente (guía u OpenAPI).
2. `xhigh` y `max` solo pasan el validador si el ID es Sunburst, Flare o sus snapshots `2026-09-08`.
3. Resolución con más píxeles que `2560 * 1440` en las familias flexibles: se permite, se etiqueta `experimental` en el JSON y en stderr, y el dry-run también lo muestra.
4. Resolución que incumple múltiplos de 16, relación 1:3–3:1, lado mayor de 3840 o píxeles fuera de 655 360–8 294 400: se rechaza en local para Sunburst, Flare y gpt-image-2.
5. `--count` en modo `images`: un solo request con `n`, y `n` tiene que estar entre 1 y 10. No se parte en varias llamadas para saltarse el máximo.
6. `--count` en modo `responses`: no se envía `n`. Cada imagen es un `responses.create`. El máximo de producto es 10 salvo que el usuario suba `--max-requests` y el presupuesto alcance. Cada llamada tiene su propio response id.
7. `--stream` exige un modelo con streaming en `Y` y `--count 1`. `--partials` es un entero 0–3. Sin `--save-partials` los parciales no se escriben. Con el flag, el nombre es `{base}.partial-{index}.{ext}` y el final es otro archivo. Un parcial nunca se renombra al nombre final.
8. El coste de los parciales pedidos se suma como estimación de `partial_images * 100` tokens de salida de imagen, marcada como estimación porque pueden llegar menos. El coste real usa `usage` cuando existe.
9. JPEG y `background=transparent` se rechazan antes de la red.
10. `output_compression` solo se envía con jpeg o webp.
11. `input_fidelity` solo se envía en edit o en la herramienta, y solo para los modelos de la tabla que lo tienen en `Y`.
12. Nada de URL remota descargada por el CLI. El pass-through de una URL a Responses está apagado por defecto (código 11). El diseño del interruptor queda en el plan de arquitectura y no se habilita en la primera entrega.
13. Las operaciones Sharp que fallen dejan el archivo de entrada intacto.
14. Un dry-run no abre socket hacia `api.openai.com`. Su salida distingue estimación, desconocido y parámetros que se habrían enviado.
