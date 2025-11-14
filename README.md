# agent-forged-ai

This repository implements the **Codex Athena** compression scheme.  The codec
builds a dictionary of frequently occurring tokens and serialises the result
into a compact binary payload starting with the `ATH1` magic header.  The
`codex_athena` package exposes two primary entry points:

- `compress(text: str) -> tuple[bytes, CompressionStats]`
- `decompress(payload: bytes) -> str`

The companion tests cover a selection of edge cases ranging from round-trip
behaviour to corruption detection.  You can run the suite with:

```bash
pytest
```

