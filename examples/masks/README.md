# Mask examples

Generate a mask preview locally (no API key):

```bash
oaiimage media inspect ./mask.png
```

Live inpaint requires a valid PNG mask with alpha and matching dimensions. Use `OAIIMAGE_LIVE=1` for network calls.
