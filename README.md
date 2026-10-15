# openai-image-cli

Command-line tool `oaiimage` for OpenAI image generation and editing. **Not published to npm** in this repository state.

## Local install

```bash
pnpm install
pnpm build
node dist/cli.js --help
```

## Examples

```bash
node dist/cli.js generate --prompt "a ceramic mug on white" --dry-run --json
node dist/cli.js edit --image ./photo.png --prompt "add soft morning light"
node dist/cli.js generate --prompt "studio portrait" --model gpt-image-2.5-flare --dry-run
```

Set `OPENAI_API_KEY` for live API calls. Live smoke tests use `OAIIMAGE_LIVE=1`.

See `docs/` for architecture, commands, and security notes.
