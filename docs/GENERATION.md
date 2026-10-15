# Generación de imágenes

## Comando principal

```bash
oaiimage generate --prompt "descripción" [opciones]
```

## Ejemplos

```bash
# Dry-run sin clave
oaiimage generate --prompt "taza de café" --dry-run --json

# Desde archivo YAML estructurado
oaiimage generate --prompt-file examples/generation/sample.yaml --dry-run

# Stdin como prompt
printf "atardecer en la costa" | oaiimage generate --stdin --dry-run

# Varias imágenes y partials
oaiimage generate --prompt "patrón" --count 2 --save-partials --dry-run --json
```

## Presupuesto

- `--confirm-cost` en modo no interactivo cuando el coste es `unknown`.
- `--max-requests` limita peticiones (no aplica en dry-run).
- `--budget` / `--max-cost` comparan contra estimaciones numéricas.

## Modelos

Por defecto `gpt-image-2.5-flare`. Lista completa: `oaiimage models list`.

Precios: ver `docs/plan/API-RESEARCH.md` y `docs/COSTS.md`.
