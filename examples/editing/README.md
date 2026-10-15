# Editing examples

Dry-run locally without a key. Live runs need `OPENAI_API_KEY` and `OAIIMAGE_LIVE=1` (not used in CI).

```bash
oaiimage edit --image ./input.yaml --prompt "soft studio light" --dry-run --json
```

`input.yaml` describes a structured prompt; replace with your PNG path for real edits.
