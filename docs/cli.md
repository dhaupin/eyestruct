---
permalink: cli/
layout: default
title: CLI reference
description: The complete eyestruct command surface - every verb, its signature, what it touches in labs/.eyes, and which exit contract applies. Each command is one short process.
---

# CLI reference

Every command is one short process, never a daemon; the only state that
survives between looks is `labs/.eyes/`. Every nonzero exit carries a named
reason-code (`eyestruct[CODE]: explanation`) - see
[reason codes](/eyestruct/reasons) for the full contract.

## Commands

| command | signature | touches | notes |
|-----------|-------------|-----------|---------|
| `init` | `eyestruct init [--browser-image TAG] [--renderer resvg@V]` | writes `labs/.eyes/manifest.yml` + empty ledger | the pin + route matrix seed |
| `look` | `eyestruct look <url> [--viewport WxH] [--theme T] [--region SEL] [--browser-exec P]` | `labs/.eyes-candidates/` + ledger row | needs the pinned browser; refusals are named |
| `diff` | `eyestruct diff <url> [--against PATH]` | read-mostly; baseline via manifest routes | `--against` accepts eyes-relative or absolute paths |
| `adopt` | `eyestruct adopt <route/view> --note "why"` | ledger row (unratified proposal) | `--note` mandatory; pixels move by deliberate git action |
| `ledger` | `eyestruct ledger list [ROUTE] \| show ID` | reads `labs/.eyes/ledger.json` | append-only memory; refuses corruption loudly |
| `gate` | `eyestruct gate` | read-only over `labs/.eyes/` | the CI pass: exit 1 on unexplained drift |
| `raster` | `eyestruct raster [file...]` | render + byte sanity per artifact | strict SVG/XML parse; never fake-passes |
| `walk` | `eyestruct walk <base-url>` | `labs/.eyes-candidates/` | every route x viewport x theme in one pass |
| `ratify` | `eyestruct ratify <base-url>` | append-only ratify rows | canon cut: byte-identical slots only, in the pinned env |
| `mcp` | `eyestruct mcp` | stdio JSON-RPC | same verbs as tools; JSON-lines out |
| `lint-packs` | `eyestruct lint-packs [--deep] [--json] [--against <lib>] [dir]` | packstruct passthrough | repo's own install, never downloaded |

Synonyms worth knowing: the ledger subcommand set is `list` / `show` only;
anything else refuses `UNKNOWN_COMMAND`.

## Flags that work everywhere

| flag | meaning |
|-------|-----------|
| `--json` | machine output (one JSON blob, machine-shaped) |
| `--manifest PATH` | override the pin + route matrix location |
| `--ledger PATH` | override the memory location; an explicit missing path refuses `LEDGER_MISSING` (the default home stays tolerant for fresh trees) |

Both overrides accept the separated (`--ledger PATH`) and joined
(`--ledger=PATH`) spellings - an empty value in either shape refuses
`BAD_FLAG_VALUE`.

## The exit contract

| exit | meaning |
|-------|-----------|
| `0` | green, or a result fully explained |
| `1` | drift or refusal with a named reason-code |
| `2` | setup or capability trouble (missing manifest, missing pinned browser) |

No bare stack traces ever leave the CLI. The full code list lives at
[reason codes](/eyestruct/reasons).

## What survived between invocations

- `labs/.eyes/` - the committed canon: manifest, baselines, ledger
- `labs/.eyes-candidates/` - disposable probe artifacts (gitignored)
- nothing else - every process starts cold by design

## Where this comes from

This page mirrors `eyestruct --help` from `bin/eyestruct.js`. When the
usage text and this page disagree, the usage text wins and this page gets
a fix on the next edit - the doc gate checks links and voice, and this
page's tables stay hand-maintained.
