---
permalink: discussions/announcing-v1.0.0
layout: default
title: Announcing v1.0.0
description: v1.0.0 freezes every interface a consumer can bind to - verbs, reason codes, MCP tools, schemas, the exports map, the env names, and the machine-output shapes - held by legs, not prose.
version: 1.0.0
---

# Announcing v1.0.0

v1.0.0 is the freeze release. Everything below shipped across the 2026-10-27 and 2026-10-28 arcs and convened into one contract the day the version turned 1: the CLI spine, the adversarial campaign, the instance loop, and - the part 1.0.0 is about - a stability law that now names every surface a consumer can bind to, with each one held by a battery leg instead of a paragraph of intent. From here, inside 1.x, nothing is removed and nothing changes semantics; additions are minor bumps with their mirror page moved in the same commit, and removals ride 2.0 only.

## The frozen surfaces

- **The command spine.** Thirteen verbs - init, look, diff, adopt, ledger, gate, raster, ratify, walk, serve, spot, mcp, lint-packs - with their usage flags, held by the census (`tests/census.test.js`, deriving from the `COMMANDS` table, never copying it). The full reference is [CLI reference](/eyestruct/cli).
- **Named refusals.** 29 reason codes across the 0-1-2 exit contract (exit 0 green or fully explained, exit 1 drift or refusal by name, exit 2 setup or capability), mirrored live at [reason codes](/eyestruct/reasons). The interface-honesty additions are part of the freeze: `UNKNOWN_FLAG` (a flag that does nothing is a lie, never a silent no-op) and the flag gate's say-it-once rule.
- **The MCP surface.** Ten tools with their input schemas over newline-delimited JSON-RPC 2.0 on stdio, decoding the same verbs and the same named refusals ([MCP reference](/eyestruct/mcp)).
- **The adapter contract.** `require('eyestruct')` is a frozen importable surface (`eyestruct-adapter@1`): the browserless verb set dispatched under the CLI's own semantics, the shared `FailError` refusal type that never exits the host process, and the stores exposed as pass-through modules - never copies ([adapter API](/eyestruct/adapters)). The exports map makes the boundary enforced, not promised: `eyestruct`, the adapter mirror path, and `package.json` resolve; every other deep path refuses at the package level.
- **The stores' schemas.** The `labs/.eyes/manifest.yml` subset (pin rows and route rows, with the optional `slot:` field naming a walk candidate over the path-slug default) and the append-only `ledger.json` row schema, both held by corruption legs that drive real hand-edits to their named refusals (`MANIFEST_CORRUPT`, `LEDGER_CORRUPT`, `UNSAFE_PATH`) rather than trusting the parser's mood.
- **The machine-output shapes.** The `--json` responses of the ok-writing verbs are key-snapshotted in the battery - a field rename is a named failure in CI, never a silent break for a wrapper jq'ing the output. Refusals stay on stderr by design, so json rides success shapes only.
- **The environment names.** `EYESTRUCT_BROWSER`, `EYESTRUCT_BUNDLE_CACHE`, `EYESTRUCT_AGENT`, `EYESTRUCT_COMMIT` - the complete inventory, derived from source by the battery and mirrored at [environment reference](/eyestruct/env); a new key fails CI until its row exists.

## The adversarial posture

The eye polices itself: 35 pack verdicts across 5 packs run against the real CLI under the packstruct grammar with a committed packledger, judged from the carrier pack's own cases outward (adapters never author schema - a bridge that outruns its pack is refused by name). A second leg rides CI: 14 hostile argv batches, hostile MCP stdio frames, and hostile ledger variants - 52/52 refused, 0 exploited, seeded and deterministic. The census keeps every hand-copied count honest on audited surfaces: when a claim and a ledger disagree, the copy fails CI, not the truth.

## The instance loop

`eyestruct serve` and `eyestruct spot` make a coding agent's own checkout the thing it can point a real browser at: serve a baked tree with the committed `_headers` rules applied host-shaped, spot one capture into the candidates tree, open it with your own vision, act, re-spot. The playbook is [seeing your own work](/eyestruct/playbooks/agents-vision), and the served shapes (content types, traversal refusal, miss-path header honesty) are battery legs, not documentation claims.

## Install

```shell
npm install --save-dev eyestruct
```

Then the first cycle:

```text
npx eyestruct init
npx eyestruct gate
```

The [getting started guide](/eyestruct/start) walks init, the first look-to-gate cycle, and what each refusal means when it happens. Existing 0.x consumers: the freeze is designed so the upgrade is invisible - the adapter import path, the CLI spells, the JSON fields, and the env names you already use are the ones that just got held.

Where it goes next: the pixel-tolerance lane for photographic-texture sites (the first real consumers found where byte-exact canon-cutting meets CDP's paint nondeterminism) and the hosted-builder adapters, both additive under the freeze.