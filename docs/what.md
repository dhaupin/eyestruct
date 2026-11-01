---
permalink: what/
layout: default
title: What eyestruct is
description: One CLI - deterministic look, pixel-level diff, a committed visual memory, and a CI gate. Process-per-look, the only state that survives between looks is git state.
nav_order: 9
---

# What eyestruct is

eyestruct is a zero-runtime-dependency CLI. Every command is one short
invocation; the only state that survives between looks is git state.

## The verbs

Capture, compare, remember, gate.

```bash
# the committed memory: manifest + empty ledger
eyestruct init

# one crop + element-id map, candidate artifact
eyestruct look <url> [--region SEL]

# fresh capture vs the committed baseline
eyestruct diff <url> [--against PATH]

# CI: exit 1 on unexplained labs/.eyes/ drift
eyestruct gate
```

Plus the agent lane: `serve` (bake and serve a tree), `spot` (one capture for
your own vision), and `mcp` (the same calls as stdio tools).

## The spine

| Layer | What it is |
|---|---|
| `labs/.eyes/manifest.yml` | pin (browser image + renderer) + route x viewport x theme matrix |
| `labs/.eyes/<route-slug>/<view>/current.png` | committed baseline (canon is CI-cut) |
| `labs/.eyes/ledger.json` | append-only rows (adopt proposals + ratify canon + wave rows) |
| `eyestruct gate` | the CI job: read-only crashledger semantics over `labs/.eyes/` |

## Two lanes, one eye

The CI lane is the canon: baselines are CI-cut, and a local `adopt` is an
unratified proposal. The instance lane is sight: a coding agent serves the
baked tree, spots it, reads the pixels with its own vision, and re-spots.
Candidate-only - the canon stays CI-cut even here.

<div class="crosslinks">
<p><strong>Next:</strong>
<a href="{{ '/about/' | relative_url }}">about the project</a> ·
<a href="{{ site.url }}">the landing site</a></p>
</div>
