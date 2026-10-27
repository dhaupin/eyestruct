---
permalink: start/
layout: default
title: Getting started
description: Install eyestruct from a clone, seed the eye home with init, run your first look-to-gate cycle, and wire the CI battery. Node 20, no daemons.
---

# Getting started

eyestruct gives a software agent a deterministic look, a pixel-level change
comparison (`diff`), and a committed visual memory (`labs/.eyes/`) that CI
can gate. Process-per-look: every command is one short invocation, and the
only state that survives between looks is git state.

## Install

The supported install will be npm (this is a Node 20 CLI), arriving with
the 0.9.0 release:

```bash
npm install --save-dev eyestruct
```

Staging note: the package is not published yet - 0.9.0 is staging-stamped -
so the working install today is the source path, a clone plus a hermetic
dependency restore:

```bash
git clone https://github.com/dhaupin/eyestruct.git
cd eyestruct
npm ci --no-audit --no-fund
```

Once the package lands, the clone path remains valid for contributing, but
the npm path is the one every consumer should expect this page to lead
with (same devdeps, same pins, from the lockfile instead of source).

What `npm ci` installs and why:

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

## Where to go next

- [CLI reference](/eyestruct/cli) - every command and flag
- [Reason codes](/eyestruct/reasons) - what every named refusal means
- [Playbooks](/eyestruct/playbooks) - the workflows the family runs daily
- The PRD for the design rulings: it lives at `labs/prd-eyes.md` in the repo
  (agent-voice surface), not on this site
