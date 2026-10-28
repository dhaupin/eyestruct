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
| `init` | `eyestruct init [--browser-image TAG] [--renderer resvg@V] [--browser-bundle TARBALL]` | writes `labs/.eyes/manifest.yml` + empty ledger | the pin + route matrix seed (the bundle flag adds the offline executor lane, see [ci](ci)) |
| `look` | `eyestruct look <url> [--viewport WxH] [--theme T] [--region SEL] [--browser-exec P]` | `labs/.eyes-candidates/` + ledger row | needs the pinned browser; refusals are named |
| `diff` | `eyestruct diff <url> [--against PATH]` | read-mostly; baseline via manifest routes | `--against` accepts eyes-relative or absolute paths |
| `adopt` | `eyestruct adopt <path> [path...] [--wave] --note "why"` | ledger row(s) (unratified proposal) | `--note` mandatory; `--wave` collapses N targets into one wave row (one note explains N image changes in the same commit) |
| `ledger` | `eyestruct ledger list [ROUTE] \| show ID` | reads `labs/.eyes/ledger.json` | append-only memory; refuses corruption loudly |
| `gate` | `eyestruct gate` | read-only over `labs/.eyes/` | the CI pass: exit 1 on unexplained drift |
| `raster` | `eyestruct raster [file...]` | render + byte sanity per artifact | strict SVG/XML parse; never fake-passes |
| `walk` | `eyestruct walk <base-url>` | `labs/.eyes-candidates/` | every route x viewport x theme in one pass |
| `ratify` | `eyestruct ratify <base-url>` | append-only ratify rows | canon cut: byte-identical slots only, in the pinned env |
| `serve` | `eyestruct serve [dir] [--port N] [--headers FILE]` | serves a directory | the instance primitive: a starter verb (lives until stopped); defaults to `web/dist` beside `web/public/_headers`; host-shaped headers incl the miss path |
| `spot` | `eyestruct spot <url> [--viewport WxH] [--theme T] [--region SEL] [--browser-exec P]` | `labs/.eyes-candidates/spot-*.png` | one capture to read with your own vision - the agent-eyes loop (serve -> spot -> read -> act -> re-spot); candidate-only, ledger untouched |
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
| `--version` | print the version and exit 0 (leading global: `eyestruct --version`; the truth is package.json, the same source usage() and the MCP SERVER_INFO read) |

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

## The canon and coverage pair

`ratify` and `walk` are the two manifest-wide verbs, and they are not
interchangeable:

- `walk <base-url>` runs every route x viewport x theme in one pass and
  drops candidates - it is the coverage verb, for extending or auditing
  the matrix.
- `ratify <base-url>` re-captures every manifest route **in the pinned
  environment** and cuts byte-identical slots as append-only ratify rows -
  it is the canon verb, and it belongs to the pinned-image lane, never to
  a local browser.

## Mask-invariant drift

The ledger gates look for **mask-invariant drift**: text edges are masked
so a typo never hides a real visual change, and a policy re-render never
invents one. A diff verdict is about pixels under the mask, not glyph
budgets - that is why `diff` compares captures, not string counts.

## What survived between invocations

- `labs/.eyes/` - the committed canon: manifest, baselines, ledger
- `labs/.eyes-candidates/` - disposable probe artifacts (gitignored)
- nothing else - every process starts cold by design

## Where this comes from

This page mirrors `eyestruct --help` from `bin/eyestruct.js`. When the
usage text and this page disagree, the usage text wins and this page gets
a fix on the next edit - the doc gate checks links and voice, and this
page's tables stay hand-maintained.

## The 1.0.0 stability contract

At 1.0.0 this surface freezes until 2.x, and then it holds the semver way.
Within 1.x:

- **The verbs are locked.** The 13 `COMMANDS` entries in
  `bin/eyestruct.js` (init, look, diff, adopt, ledger, gate, raster,
  ratify, walk, serve, spot, mcp, lint-packs) never lose a verb, a usage flag, or a
  semantic. Removals and behavior changes ride a major bump only; serve
  and spot join the lock as the 2026-10-28 minor bump.
- **Additions are minors, loudly.** A new verb or flag lands as a minor
  bump with this page updated in the same commit; silence is never a
  release.
- **The exit contract rides the same law.** The 0-1-2 contract and the 29
  named reason codes ([reason codes](/eyestruct/reasons), mirror of
  `lib/reasons.js`) are additive-first within 1.x; a removal can only ride
  2.0. The flag gate on this page is part of the honesty: unknown flags
  refuse by name (`UNKNOWN_FLAG`) and a flag is stated once, never
  restated - the 2026-10-28 interface-honesty counted change.
- **Counts cannot drift.** The battery's count census (`tests/census.test.js`,
  eyestruct#10 item 3) compares every hand-copied count-claim on the
  audited docs/meta surfaces against the live ledgers and the source
  tables, so the stale-26 drift class fails CI instead of waiting for a
  walk to catch it.
