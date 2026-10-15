# Prompts

## Plantillas y estilos

```bash
oaiimage prompt templates
oaiimage prompt build --template product --var subject=taza
oaiimage prompt build --style watercolor --var subject=paisaje
```

24 plantillas de producto y 20 estilos verificados en tests unitarios.

## Crear, guardar e inspeccionar

```bash
oaiimage prompt create --var subject=mesa
oaiimage prompt save mi-escena --text "línea uno"
oaiimage prompt inspect mi-escena
```

En TTY, `prompt create` puede abrir un asistente (no con `--json`).

## Archivos de prompt

| Extensión | Contenido |
| --- | --- |
| `.txt`, `.md` | Texto literal |
| `.yaml`, `.json` | Campos estructurados (`subject`, `palette`, …) |

```bash
oaiimage generate --prompt-file escena.yaml --dry-run
```

Si pasas `--prompt` y `--prompt-file`, gana `--prompt` (aviso en stderr).
