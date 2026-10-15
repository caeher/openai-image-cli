# Batch examples

```bash
oaiimage batch create --mode local --file ./jobs.jsonl
oaiimage batch run --mode local
```

OpenAI batch mode uploads JSONL to `/v1/images/generations`. Requires API key and compatible model.
