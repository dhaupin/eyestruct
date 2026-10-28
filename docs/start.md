---
permalink: start/
layout: default
title: Getting started
description: Install eyestruct from npm, seed the eye home with init, run your first look-to-gate cycle, and wire the CI battery. Node 20, no daemons.
---

# Getting started

eyestruct gives a software agent a deterministic look, a pixel-level change
comparison (`diff`), and a committed visual memory (`labs/.eyes/`) that CI
can gate. Process-per-look: every command is one short invocation, and the
only state that survives between looks is git state.

## Install

```bash
npm install --save-dev eyestruct
```
The [npm package page](https://www.npmjs.com/package/eyestruct) carries the
same install with versions and registry metadata.

Added as a devDependency, the CLI runs through npm scripts or `npx`
(`npx eyestruct gate`). Working from the source on a fix instead? The
clone path is identical install for contributors:

```bash
git clone https://github.com/dhaupin/eyestruct.git
cd eyestruct
npm ci --no-audit --no-fund
```

What the install brings and why:

| piece | pinned as | needed for |
|---------|-------------|--------------|
| packstruct | exact `1.0.0` | the pack campaign lint + conformance audit |
| crashtest | `^1.1.0` | the adversarial CI leg (`crashtest run`) |
| freestruct | `^1.1.0` | the docs post-build layer (CI, not the CLI) |

Two optional pieces make the eye verbs work for real captures - both refused
honestly (named reason-code, exit 2) when missing, never fake-passed:

```bash
npx --yes @puppeteer/browsers install "chrome@<pinned-version>" --path "$HOME/.cache/puppeteer"
npm i -D @resvg/resvg-js
```

The browser version to install comes from the manifest's
`pin.browser-image` (see `eyestruct init` below) - the manifest is the
single source of truth for what this repo's eyes shoot.

## Seed the eye home

```text
eyestruct init [--browser-image TAG] [--renderer resvg@V]
```

`init` writes `labs/.eyes/manifest.yml` (the browser pin + the route x
viewport x theme matrix) and an empty ledger. The state ends up beside the
PRD in `labs/` - the gistory shape - and `--manifest`/`--ledger` re-point
it for hosts that keep their eye home elsewhere.

## Your first look-to-gate cycle

```text
eyestruct look file:///path/to/page.html --viewport 1280x800 --theme dark
eyestruct adopt home/desktop-1280-dark/current.png --note "first committed baseline from the local page"
eyestruct gate
eyestruct ledger list
```

Three rules to know before your first cycle:

1. A `look` writes a CANDIDATE into `labs/.eyes-candidates/` (gitignored,
   disposable) - it does not touch the baselines.
2. `adopt` is required to promote a candidate, and it demands `--note`
   explaining the change (`ADOPT_NOTE_REQUIRED` otherwise). A local adopt
   is an **unratified proposal**; canon baselines are cut by CI.
3. `gate` is the pass every agent runs after touching anything: unexplained
   drift in `labs/.eyes/` exits 1 with the offending artifact named.

## Wire the CI battery

The repo ships its own battery - copy the composition from
[CI guide](/eyestruct/ci) or steal `.github/workflows/test.yml` directly.
In one job it runs: hermetic install, the node test spine, the docs gates +
pack campaign + conformance audit, and the crashtest adversarial leg.

## See while you build (the instance lane)

The CI cycle above courts regression; a second lane gives live sight while
you work. `serve` serves a baked tree with the same host-shaped headers the
deployment carries, and `spot` hands back one capture - a file path your
coding agent can open with its own vision:

```text
eyestruct serve web/dist --port 4173 &
eyestruct spot http://127.0.0.1:4173/status
# read labs/.eyes-candidates/spot-*.png with your own vision, fix, re-spot
```

The loop: serve -> spot -> read -> act -> re-spot. A spot is a candidate -
it never writes the ledger, and the canon stays CI-cut. Full recipe:
[seeing for yourself](/eyestruct/playbooks/agents-vision/).

## Where to go next

- [CLI reference](/eyestruct/cli) - every command and flag
- [Adapter API](/eyestruct/adapters) - the programmatic surface if you are integrating, not shelling
- [Reason codes](/eyestruct/reasons) - what every named refusal means
- [Playbooks](/eyestruct/playbooks) - the workflows the family runs daily
- The PRD for the design rulings: it lives at `labs/prd-eyes.md` in the repo
  (agent-voice surface), not on this site
