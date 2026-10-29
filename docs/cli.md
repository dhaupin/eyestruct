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
| `look` | `eyestruct look <url> [--viewport WxH] [--theme T] [--region SEL] [--browser-exec P] [--no-overlay] [--full-page] [--format png\|webp] [--quality N]` | `labs/.eyes-candidates/` only | needs the pinned browser; refusals are named; `--viewport` defaults 1280x800, `--theme` is unset (no emulation); the ledger is never touched by look (candidates are proposals, adoption is the row writer); `--no-overlay` is the clean frame: the element-id overlay is never drawn into the pixels, while the element map still computes and returns (creadev #18); `--full-page` captures the full document height at the viewport width (creadev #19 - a review artifact, weak baseline; the in-view map lift means the full-page map covers the document, and `--full-page` + `--region` refuse rather than compose); `--format png\|webp` + `--quality N` pick the output shape (creadev #20 - png stays the default, quality is webp-only and refuses against png, and the file extension always says what actually painted the frame) |
| `diff` | `eyestruct diff <url> [--against PATH]` | read-mostly; baseline via manifest routes | `--against` accepts eyes-relative or absolute paths; a slot whose route row carries a tolerance profile is judged at the pixel level under that profile (measured maxDelta / changed px / span attached to the verdict) - strict slots stay byte-equal, stated rather than assumed |
| `adopt` | `eyestruct adopt <capture> [capture...] [--wave] --note "why"` | ledger row(s) (unratified proposal) | targets are eyes-relative capture paths (`<slot>/current.png`), never slot names - a slot is a directory the gate can never match, refused `ADOPT_TARGET_NOT_ARTIFACT` at write; `--note` mandatory; `--wave` collapses N captures into one wave row (one note explains N image changes in the same commit) |
| `ledger` | `eyestruct ledger list [ROUTE] \| show ID` | reads `labs/.eyes/ledger.json` | append-only memory; refuses corruption loudly |
| `gate` | `eyestruct gate` | read-only over `labs/.eyes/` | the CI pass: exit 1 on unexplained drift |
| `raster` | `eyestruct raster [file...]` | render + byte sanity per artifact | strict SVG/XML parse; never fake-passes |
| `walk` | `eyestruct walk <base-url>` | `labs/.eyes-candidates/` | every route x viewport x theme in one pass |
| `ratify` | `eyestruct ratify <base-url>` | append-only ratify rows | canon cut: byte-identical slots only, in the pinned env; a slot with a tolerance profile cuts canon pixel-eq at bounded span and the row carries the profile verbatim (grep `tolerance` in the ledger for every bounded-span pledge) |
| `serve` | `eyestruct serve [dir] [--port N] [--headers FILE]` | serves a directory | the instance primitive: a starter verb (lives until stopped); defaults to `web/dist` beside `web/public/_headers`; host-shaped headers incl the miss path |
| `spot` | `eyestruct spot <url> [--viewport WxH] [--theme T] [--region SEL] [--browser-exec P] [--no-overlay] [--full-page] [--format png\|webp] [--quality N]` | `labs/.eyes-candidates/spot-*.png` (or `.webp` with `--format webp`) | one capture to read with your own vision - the agent-eyes loop (serve -> spot -> read -> act -> re-spot); candidate-only, ledger untouched; `--no-overlay` gives the agent the page itself, not the annotation layer (creadev #18); `--full-page`/`--format`/`--quality` carry the same capture-output contract as `look` (creadev #19/#20) |
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

The joined spelling works everywhere a value flag exists, on one shared
reader: `--format=webp`, `--quality=82`, `--against=PATH`, `--note="x.y"`. A
stated empty value (`--theme=`, `--region=`) refuses `BAD_FLAG_VALUE` at the
owning surface - an accepted spelling never silently answers its default.
(The leading global window before a verb still wants the separated
`--ledger PATH` shape: its exact-match parser is what keeps a typo from
reordering into a verb's positional.)

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
  the matrix. Candidate names follow the slot-name rule: the route's
  path slug is the default (`/` reads `root`, `/settings` reads
  `settings`), and a manifest route row may override it with `slot:` -
  `- path: /  slot: home` makes the candidates land as `home`, so a
  canon that names its slots for the pages never needs a rename step
  between a walk and its manifest (`walk`'s `candidateName` is the only
  reader of the field). The override names PAGES, not paths: a `slot:`
  value carries word characters and dashes only - anything with path
  shapes (`/`, `..`, separators) refuses `MANIFEST_CORRUPT` at the
  manifest read, before any writer can act on it. A route row whose path
  is already absolute is captured as stated (the base URL is not joined
  onto it).
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
- **The exit contract rides the same law.** The 0-1-2 contract and the
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
- **The contract clamp (2026-10-28).** Four de-facto surfaces joined the
  freeze, each named and leg-held in one commit: the package `exports`
  map (`eyestruct`, `eyestruct/lib/index.js`, and `eyestruct/package.json`
  resolve; every other deep path refuses at the package level), the
  env-var inventory ([environment reference](/eyestruct/env), derived
  from source and pinned by the battery), the `--json` machine-output
  shapes of the ok-writing verbs (key snapshots in
  `tests/contract.test.js`: `init`, `ledger list`/`show`, `gate`,
  `adopt`, `raster`, and the `serve` starter's view - `lint-packs`
  passes `--json` through to packstruct's own shape, and a field rename
  is a named failure, never a silent consumer break), and the manifest
  + ledger schema jails
  (corruption variants refuse by name - `MANIFEST_CORRUPT`,
  `LEDGER_CORRUPT`, `UNSAFE_PATH` - so the schemas hold a test, not
  just prose).
