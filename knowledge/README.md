# `knowledge/` — the agun.ai OKF bundle (university / credential layer)

This directory is an **Open Knowledge Format (OKF v0.1)** bundle. It is the *source of truth* for
agun.ai's role in the Agentic Gym University: the **registrar, examination board, and diploma
authority**. Where [agym.ai](https://agym.ai) authors the *catalog and training* (schools,
departments, courses, benchmarks, skills), agun.ai authors the *credential* side: certification
tracks, issued diplomas, degree tracks, and academic policy.

## How it works

- Every `.md` file (except this README and `index.md`/`log.md` navigation files) is an **OKF concept**.
- Each concept carries **YAML frontmatter** with at least the required `type` field.
- Concepts **link to each other with normal markdown links** (`[text](../path/to/file.md)`),
  forming a directed knowledge graph. Cross-repo references to agym.ai use full `https://` URLs
  (the compiler ignores those for graph resolution, so this bundle validates on its own).
- `index.md` files are navigation/disclosure aids (OKF reserved filename). `log.md` (optional)
  holds chronological change history.

## Build

`scripts/build-okf.mjs` validates this bundle and compiles it to a queryable graph at
`public/okf/<version>/graph.json`. `scripts/build-registrar.mjs` then freezes the issued
credentials into a hash-stamped ledger at `public/data/<version>/registrar/`. Nothing here runs
continuously — generation is an on-demand "prepare" step that freezes a version-pinned artifact.

## Concept types (agun layer)

`University` · `Certification` (credential track) · `Credential` (issued diploma) ·
`Curriculum` (degree track) · `Policy` · `Index`

Shared scoring contract with agym: composite score plus the four evaluation layers
(command correctness, situational appropriateness, anticipated impact, DOIL compliance).

See [`docs/MASTER_PLAN.md`](../docs/MASTER_PLAN.md) for the model and [`index.md`](./index.md) for the root.
