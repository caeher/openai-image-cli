# openai-image-cli (oaiimage)

CLI en español para generar y editar imágenes con la API de OpenAI. **Este repositorio no publica el paquete en npm**; instálalo desde el código fuente.

## Requisitos

- Node.js >= 22.12.0
- `pnpm` (recomendado)

## Instalación local

```bash
pnpm install
pnpm build
node dist/cli.js --help
```

## Ejemplos (sin clave: dry-run)

```bash
node dist/cli.js generate --prompt "taza de cerámica sobre fondo blanco" --dry-run --json
node dist/cli.js edit --image ./foto.png --prompt "añadir luz de mañana" --dry-run
node dist/cli.js generate --prompt "retrato de estudio" --model gpt-image-2.5-flare --dry-run
```

Para llamadas reales define `OPENAI_API_KEY`. Las pruebas en vivo del repositorio usan `OAIIMAGE_LIVE=1`; la CI no las ejecuta por defecto.

## Códigos de salida

| Código | Significado |
| --- | --- |
| 0 | Éxito |
| 1 | Error de aplicación |
| 2 | Uso incorrecto |
| 3 | Configuración inválida o secreto en YAML |
| 4 | Autenticación (`OPENAI_API_KEY` ausente) |
| 5 | Error de API |
| 6 | Moderación |
| 7 | Presupuesto / coste desconocido sin `--confirm-cost` |
| 8 | Cancelado |
| 9 | Éxito parcial |
| 10 | Ruta fuera del directorio permitido |
| 11 | Capacidad no soportada |

## Documentación

- `docs/COMMANDS.md` — referencia de comandos con ejemplos
- `docs/GENERATION.md`, `docs/EDITING.md`, `docs/MASKING.md`, `docs/PROMPTING.md` — guías por operación
- `docs/plan/API-RESEARCH.md` — investigación de API (no duplicar tablas de precios aquí)

## Desarrollo

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

No ejecutes `npm publish`. Ver `CONTRIBUTING.md`.
