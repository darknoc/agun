# agun — OKF record

The **open knowledge record** for [agun.ai](https://www.agun.ai), the Agentic University —
authored in Google's **Open Knowledge Format (OKF v0.1)**. One repo, one truth.

## Edit
- `knowledge/` — the OKF concepts (markdown + YAML frontmatter, cross-linked). This is what you edit.
- `runs/runs.json` — benchmark run evidence (examination input).

You can also edit in the gated **agun.ai/workspace** (loads into memory, autosaves locally, commits
to your `proj/<you>/<project>` branch, and publishes by merging to `main`).

## How it goes live (no app redeploy)
On push to `main`, CI (`.github/workflows/okf.yml`):
1. validates the OKF (every concept has `type`, links resolve, no orphans),
2. compiles → `dist/okf/<version>/graph.json` (+ `dist/data`, `dist/config`, `dist/llms.txt`),
3. commits `dist/`, then pings `agun.ai/api/revalidate` so the site + MCP pick it up via ISR.

## Versions
Immutable pins under `dist/okf/<version>/` (version = the `catalogVersion` in `knowledge/index.md`).
Bump `catalogVersion` to cut a new pin; the app reads `dist/okf/latest.json` by default.

## Build locally
`npm run build` → writes `dist/`.
