# Máscaras de ejemplo

Crea una máscara PNG 64×64 con un rectángulo editable (alfa 0) usando Sharp en un script local o el test e2e `mask-commands`.

Operaciones locales:

```bash
oaiimage mask inspect ./mask.png --image ./base.png
oaiimage mask dilate ./mask.png --radius 1 --output ./mask-dilatada.png
```

Inpaint en red requiere máscara PNG con alfa y dimensiones iguales a la imagen base. Para llamadas reales: `OAIIMAGE_LIVE=1`. La CI no ejecuta red.
