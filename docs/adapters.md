---
permalink: adapters/
layout: default
title: Adapter API
description: The programmatic eyestruct surface - the same library modules the CLI dispatches, behind one frozen contract (eyestruct-adapter@1). Platform adapters import the truth instead of re-deriving it.
---

# Adapter API

eyestruct's contract is the CLI: one call, one process, named refusals,
everything else is git state. `lib/index.js` is the **programmatic
decoding** of that same contract - the second adapter after the
[MCP server](/eyestruct/mcp). A platform consumer (an agent brain, a hosted
builder, a pipeline runner) imports it instead of shelling the CLI, and a
consumer that shells the CLI still gets identical behavior: the module
functions ARE what `bin/eyestruct.js` dispatches.

```js
const eyes = require('eyestruct/lib/index.js')

// dispatch = the CLI dispatch, minus the shell: returns the exit code,
// throws eyestruct[CODE] FailError on any refusal, never process.exits.
eyes.dispatch('gate', eyes.ctxOf(repoRoot, ['--json'], true))
```

## The contract: eyestruct-adapter@1

The surface is frozen across 1.x under the same law as the 13 CLI verbs
and the 10 MCP tools: additions are minor bumps with this page updated in
the same commit; removals and semantic changes ride 2.0.

| part | what an adapter gets |
|------|----------------------|
| `ADAPTER_CONTRACT` | `'eyestruct-adapter@1'` - the marker your integration pins |
| `version` | the package version the process loaded |
| `FailError` / `reasonCodes` | the shared refusal contract: catch one, read `.code`, print `.message` (`eyestruct[CODE]: explanation`) |
| `manifest` / `ledger` | the two stores, the exact modules the verbs use - one writer of truth per store, never a private copy |
| `bundle` / `engine` / `serveDist` | the vendored-chrome lane, the capture engine, and the shared static server - what CI borrows |
| `verbs` / `dispatch` / `ctxOf` | the browserless verb set (`init`, `gate`, `adopt`, `ledger`, `raster`, `lint-packs`) dispatched under the CLI's own argv semantics |

## What stays true at every altitude

- **Same failures.** A refusal in the adapter surface is the same
  `eyestruct[CODE]` the shell gets - `MISSING_MANIFEST`,
  `ADOPT_NOTE_REQUIRED`, `UNSAFE_PATH`. Adapters never re-derive an exit
  table; they catch and forward.
- **Same state law.** Nothing here keeps process state; persistence is
  git state. The only surviving artifacts are `labs/.eyes/` and the
  committed ledger.
- **Canon is CI-cut from the adapter side too.** A local adopt through
  the API is an unratified proposal (`ratified:false`), exactly like the
  CLI and MCP surfaces. There is no API path that cuts canon - the
  pinned-image lane is the only writer of official baselines.
- **Browserless by default.** The dispatched verbs are the browserless
  set; captures stay in the CI lanes (the pinned-image lane, the opt-in
  chromium lane) and the verbs that do require chrome (`look`, `diff`,
  `walk`) run through the CLI or MCP surfaces.

## Who adapts

- **MCP sessions** - the stdio server ([reference](/eyestruct/mcp)) is the
  first adapter; the agents-vision loop rides it end to end.
- **Pipelines and runners** - the CI job (`gate`), the pack campaign
  (`lint-packs`), and the stores are importable inside your own Node
  battery, which is how the family rigs (packstruct, crashtest) called
  the real CLI before and the module now.
- **Platform adapters (designed, in flight)** - agent brains (a
  Vant-shaped one) and hosted builder environments consume this contract
  for their own ci-mode and status islands. Nothing needs to fork or
  re-parse: the CLI reference, the MCP schemas, and this page decode the
  one contract from three angles.

## Where this comes from

This page mirrors `lib/index.js` (the export list) and the verbs it
dispatches mirror `bin/eyestruct.js`. When a symbol and this page
disagree, the source wins - the same rule the
[CLI reference](/eyestruct/cli) and [MCP reference](/eyestruct/mcp)
carry. The battery pins the contract's shape in
`tests/adapter-api.test.js`.

## The 1.0.0 stability contract

`eyestruct-adapter@1` freezes with the CLI verb lock and the MCP tool
lock at 1.0.0. Within 1.x: no export is removed or semantically changed;
additions land as minor bumps with this page updated in the same commit.
The refusal contract (`FailError` + `reasonCodes`) is part of the frozen
surface - new codes are additive; their count claims stay census-locked.
