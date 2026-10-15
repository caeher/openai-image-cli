# Comandos de oaiimage

Referencia de la CLI `oaiimage`. Todas las rutas de ejemplo asumen que ejecutas desde la raíz del proyecto tras `pnpm build`.

**Prueba sin red:** añade `--dry-run` y, si quieres JSON, `--json`. No necesitas `OPENAI_API_KEY` en dry-run.

## Códigos de salida

| Código | Cuándo |
| --- | --- |
| 0 | OK |
| 1 | Error interno |
| 2 | Argumentos inválidos |
| 3 | Configuración o secreto en archivo |
| 4 | Sin `OPENAI_API_KEY` |
| 5 | Fallo de API |
| 6 | Moderación |
| 7 | Presupuesto / coste desconocido |
| 8 | Cancelado |
| 9 | Parcial |
| 10 | Ruta fuera de raíz |
| 11 | Capacidad deshabilitada |

## Generación

```bash
oaiimage generate --prompt "zorro rojo en bosque" --dry-run
oaiimage generate --prompt-file escena.yaml --dry-run --json
oaiimage generate --stdin --dry-run   # texto por stdin
oaiimage generate --prompt "logo" --save-partials --dry-run --json
```

Flags útiles: `--model`, `--size`, `--quality`, `--format`, `--compression` (jpeg/webp), `--max-requests`, `--confirm-cost`, `--budget`.

## Edición

```bash
oaiimage edit --image foto.png --prompt "nieve ligera" --dry-run
oaiimage edit --image a.png --preserve "cielo" --preserve "árboles" --prompt "atardecer" --dry-run --json
oaiimage inpaint --image foto.png --mask mascara.png --prompt "puerta azul" --dry-run
oaiimage expand --image foto.png --prompt "más cielo" --pixels 32 --dry-run
oaiimage compose --image sujeto.png --role subject --image fondo.png --role background --prompt "integrar" --dry-run
```

Referencias: `--references ruta.png:lighting` (hasta el máximo del modelo).

## Estilo y fondo

```bash
oaiimage style --style photorealistic --prompt "ciudad" --dry-run
oaiimage transparent --image foto.png --dry-run
oaiimage background remove --image foto.png --dry-run
oaiimage background replace --image foto.png --prompt "playa al atardecer" --dry-run
```

## Sesiones

```bash
oaiimage session create
oaiimage session edit <id> --prompt "más contraste" --dry-run --json
oaiimage session history <id>
```

## Prompts

```bash
oaiimage prompt templates
oaiimage prompt build --template product --var subject=taza
oaiimage prompt create --var subject=taza
oaiimage prompt save escena --text "línea uno"
oaiimage prompt inspect escena
oaiimage prompt validate "texto largo..."
```

Archivos: `.txt`/`.md` son texto literal; `.yaml`/`.json` son campos estructurados (`subject`, `palette`, etc.).

## Tipografía

```bash
oaiimage typography --exact --image base.png --primary "Hola" --output out.png
oaiimage typography --primary "Título" --secondary "Subtítulo" --dry-run
```

## Variaciones

```bash
oaiimage variations --prompt "variación cálida" --dry-run
oaiimage variations --image foto.png --prompt "otra versión" --dry-run --json
```

No usa el endpoint `createVariation`; el resultado no es determinista.

## Media (local, sin clave)

```bash
oaiimage media inspect foto.png
oaiimage media crop in.png out.png --left 0 --top 0 --width 100 --height 100
oaiimage media rotate in.png out.png --degrees 90
oaiimage media compress in.png out.jpg --quality 80
oaiimage media watermark in.png out.png --text "muestra"
oaiimage media contact-sheet --image a.png --image b.png --output hoja.png
```

## Máscaras (local)

```bash
oaiimage mask inspect mascara.png --image base.png
oaiimage mask preview mascara.png --image base.png --output prev.png
oaiimage mask dilate mascara.png --radius 1 --output dilatada.png
oaiimage mask rect --image base.png --output m.png --x 10 --y 10 --width 40 --height 40
```

## Transformaciones

```bash
oaiimage upscale --image in.png --output out.png --scale 2
oaiimage restore --image in.png --prompt "recuperar detalle" --dry-run
oaiimage enhance --image in.png --prompt "más nitidez" --dry-run
```

Sin `--prompt`, `restore` y `enhance` salen 11.

## Batch

```bash
oaiimage batch create jobs.jsonl --mode local
oaiimage batch run <id> --mode local
oaiimage batch status <id>
oaiimage batch retry <id>
oaiimage batch export <id> ./salida
```

Modo `openai` requiere clave y modelo con batch habilitado.

## Configuración

```bash
oaiimage config init
oaiimage config set model gpt-image-2.5-flare
oaiimage config set --file ./cfg.json
oaiimage config list
```

No guardes `apiKey` en YAML/JSON (sale 3).

## Doctor, modelos, costes

```bash
oaiimage doctor --json
oaiimage models list
oaiimage capabilities --model gpt-image-2.5-flare
oaiimage cost estimate --prompt "hola" --dry-run
```

## Proyecto y galería

```bash
oaiimage project init
oaiimage gallery list
oaiimage gallery inspect .
oaiimage gallery export ./html --html
```

## Precios

Consulta `docs/plan/API-RESEARCH.md` y la documentación oficial de OpenAI; esta guía no replica tablas de precios.
