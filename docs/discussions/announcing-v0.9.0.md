---
permalink: discussions/announcing-v0.9.0
layout: default
title: Announcing v0.9.0
description: v0.9.0 ships the eye spine - named refusals across the 0-1-2 exit contract, the adversarial pack campaign and crashtest leg, CI-cut canon, and the npm consumer path.
version: 0.9.0
---

# Announcing v0.9.0

eyestruct gives production agents eyes: deterministic looks, a committed
`labs/.eyes/` visual memory, and CI gates that refuse unexplained drift.
Every refusal carries a named reason-code - never a bare stack trace, and
never a guessed parse. v0.9.0 is the release where the whole spine runs
under gates, on npm like every other dev dependency.

## What ships

- **Named refusals, not stack traces.** 25 reason-codes across the 0-1-2
  exit contract: exit 1 means explained-drift trouble, exit 2 means
  capability trouble, and every nonzero exit names itself
  (`eyestruct[CODE]: explanation`). The full contract lives at
  [reason codes](/eyestruct/reasons).
- **The eye polices itself.** 26 adversarial pack verdicts run against the
  real CLI, judged under the packstruct grammar with a committed
  packledger: refusals for unexplained drift, dangling rows, corrupt
  ledgers and manifests, note-less adopts, unsafe text - plus the
  self-leg, where the committed canon has to pass its own gate. The
  campaign is documented at [packs](/eyestruct/packs).
- **A crashtest leg rides CI.** Hostile argv batches, hostile MCP stdio
  frames, and hostile ledger variants attack the contract end to end:
  52/52 refused, 0 exploited, seeded and deterministic - hostile input
  never improvises a pass.
- **CI-cut canon.** Canonical baselines are ratified by a
  two-dispatch workflow (proposal, then witness), never self-certified by
  an agent's local adopt. The setup is described in the
  [CI guide](/eyestruct/ci).
- **`lint-packs` is a verb.** `eyestruct lint-packs` runs packstruct over
  your own install - never a download - and passes failures through with
  their exit codes intact.
- **Honest seams.** `look`, `diff`, and `walk` declare their engine seam:
  until the pinned browser image is present they refuse with a named
  reason-code rather than fake anything.

## Install

```shell
npm install --save-dev eyestruct
```

Then the first cycle:

```text
npx eyestruct init
npx eyestruct gate
```

The [getting started guide](/eyestruct/start) walks init, the first
look-to-gate cycle, and what each refusal means when it happens.

## The receipts

Every number in this post is checked against the shipped tree before it
lands: the pack campaign and crashtest leg run in CI on every push, the
reason-code table is mirrored from `lib/reasons.js`, and the docs tree
passes the five-check `lint:docs` battery. If a claim ever goes stale,
the battery goes red before the docs can lie.
