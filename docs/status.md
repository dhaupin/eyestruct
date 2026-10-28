---
permalink: status
layout: default
title: Family status dialect
description: The four-repo status contract - one schema served at /status.json on every family site, generated from each repo's committed ledgers, read by every member's status page. What a consumer (human or agent) can count on.
---

# Family status dialect

Four repos in the struct family - eyestruct, crashtest, poststruct,
packstruct - each carry adversarial legs whose verdicts live in
**committed ledger files**, reconciled by CI on every push (the what and
the why are in the [CI guide](/eyestruct/ci)). This page is the contract
that makes those ledger files readable *across* the family, without a
server, without a dashboard product, without any trust beyond "the
committing repo's own CI ran its own battery":

1. every member serves a machine-readable status file at the fixed path
   `/status.json` on its site;
2. that file is **generated, never hand-edited**, by the member's own
   web build, straight from the committed ledgers;
3. every member's status page reads the others' files and renders their
   numbers (or their absence) honestly.

Humans read `/status` (crashtest's page lives at `/dashboard`, and its
`status.json` names that truth instead of pretending); agents and
machines read `/status.json`. Both get the same numbers, because both
read the same generated file.

## The dialect: `family-status@1`

One JSON object per repo. Schema is 1, contract is the string
`family-status@1` - a reader that sees either field missing or renamed
refuses and shows "not serving the dialect", never a guessed row.

| field | shape | meaning |
|--------|---------|-------------|
| `schema` | `1` | the dialect's schema pin, additive-first |
| `contract` | `"family-status@1"` | the contract name a reader matches |
| `repo` | string | the GitHub repo the file describes |
| `site` | URL | the member's own status page (where a human reads it) |
| `docs` | URL | the doc page explaining the member's legs |
| `asOf` | short sha | the commit the generator last saw (`worktree` when no git context - never a fake sha) |
| `legs` | array | one row per adversarial leg, below |
| `packs` | array | one row per committed pack, below |

A leg row:

| field | shape | meaning |
|--------|---------|-------------|
| `leg` | string | the leg's slug (`packs`, `crashtest` in eyestruct's file) |
| `verdict` | `"PASS"` or `"RED"` | derived from the ledger rows: every case REFUSED, PASSED, or BOUNDED is a pass; anything else (an EXPLOITED, a FAILED, a verdict the dialect never met) degrades the leg to RED |
| `cases` | integer | ledger row count for that leg |
| `counts` | object | verdict-tallied row counts, straight from the rows |
| `ledger` | path | the committed ledger file the numbers came from, repo-relative |

A pack row:

| field | shape | meaning |
|--------|---------|-------------|
| `name` | string | the pack slug (packstruct SPEC v1: kebab-case, equals the directory) |
| `spec` | `"packstruct@1"` | the grammar every family pack loads under |
| `manifest` | path | the pack's `pack.json`, repo-relative |
| `cases` | integer | this pack's ledger row count |

That last table is the "understand each other's packs" clause: because
every family pack lives at `packs/public/<name>/pack.json` under the
packstruct@1 grammar with ids namespaced by pack slug, a member's
`packs` array is directly readable by any other member with no bespoke
understanding - the same normalization packstruct itself enforces.

## The refusal rules (what a reader may assume)

- The file carries no prose, no marketing, no history - only the ledger
  rows the repo's CI reconciles against on every push.
- `asOf` is a truth: `worktree` means no git context existed at
  generation; a sha means the generator read that commit's ledgers.
- A missing sibling row means "not serving the dialect yet" - a reader
  renders the absence, never invents a PASS.
- Numbers are only as fresh as the member's last web deploy, which is
  bounded by their docs lane running `web build` on every push to main.
  The receipt-grade freshness always lives in the git ledger files
  themselves - the dialect tells you where to look, the ledgers are
  the truth.

## How a member serves it (worked example: this repo)

- the generator: `web/scripts/build-status.mjs` (zero deps) reads
  `packs/eye-ledger.json` + `labs/crashledger.json` + every
  `packs/public/*/pack.json`, refuses the intersection cases loudly
  (a manifest with zero ledger rows, a ledger row for an unknown pack),
  and writes `web/public/status.json`;
- the wiring: `web build` runs the generator first (before prerender and
  the 404 repair); the generated file is gitignored - committing it
  would recreate the stale-copy drift class this whole family exists to
  prevent;
- the page: the [live status](https://eyestruct.creadev.org/status)
  page renders its own gate from the committed ledgers and the family
  rows from the four served files;
- the battery: `tests/status.test.js` pins the emitter's behavior with
  temp-dir fixtures (verdict derivation, refusal cases) and re-checks
  the real tree's emitted counts against the live ledgers, so the
  dialect itself is under CI the same way every count here is.

## Adding a member

Quiet mechanics, no ceremony: pick the two fixed paths, write a
generator that reads your committed ledgers, emit the dialect fields
above, gitignore the output, render it (yourselves and each other via
the same fetch), and tell the family in a cross-file issue with your
commit receipt. Schema moves: additive-first; a removal rides a major
bump of the `contract` string, exactly like every other family surface.

## Where this comes from

This page mirrors `web/scripts/build-status.mjs` and
`web/src/components/FamilyStatusIsland.jsx`. When the generator and this
page disagree, the generator wins and this page gets a fix on the next
edit - the same rule the [CLI reference](/eyestruct/cli) and
[MCP reference](/eyestruct/mcp) pages carry.
