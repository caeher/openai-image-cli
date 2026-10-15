# Máscaras

Operaciones **locales** (sin `OPENAI_API_KEY`):

```bash
oaiimage mask inspect mascara.png --image base.png
oaiimage mask preview mascara.png --image base.png --output preview.png
oaiimage mask dilate mascara.png --radius 1 --output dilatada.png
oaiimage mask union --mask a.png --mask b.png --output union.png
oaiimage mask rect --image base.png --output m.png --x 0 --y 0 --width 32 --height 32
```

Reglas:

- Solo PNG con canal alfa.
- Dimensiones iguales a la imagen base.
- JPEG como máscara → error de uso.

Para inpaint en red:

```bash
oaiimage inpaint --image base.png --mask mascara.png --prompt "rellenar" --dry-run
```

Ejemplos en `examples/masks/`. Red real: `OAIIMAGE_LIVE=1`.
