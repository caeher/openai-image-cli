# Edición de imágenes

## edit / inpaint

```bash
oaiimage edit --image foto.png --prompt "añadir nieve" --dry-run
oaiimage edit --image a.png --preserve "cielo" --prompt "atardecer" --dry-run --json
oaiimage inpaint --image foto.png --mask mask.png --prompt "puerta roja" --dry-run
```

## expand / compose

```bash
oaiimage expand --image foto.png --prompt "ampliar cielo" --pixels 32 --dry-run
oaiimage compose --image sujeto.png --role subject --image fondo.png --role background --prompt "unificar" --dry-run
```

## Referencias

```bash
oaiimage edit --references estilo.png:style --image sujeto.png --prompt "mismo estilo" --dry-run
```

Roles válidos: `subject`, `face`, `background`, `style`, `lighting`, etc. (máximo según modelo).

## Sesiones

```bash
oaiimage session create
oaiimage session edit <id> --prompt "más luz" --dry-run
```

Si la iteración anterior no tiene `responseId` pero sí imagen guardada, el edit usa `source: fallback`.
