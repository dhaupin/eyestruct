---
permalink: playbooks/
layout: default
title: Playbooks
description: The workflows eyestruct agents run daily - first look, shipping a visual change, triaging a red gate or a red pack campaign, pin bumps, answering browserless, extending the matrix.
---

# Playbooks

Each playbook is the short series of commands an agent runs, with the
receipts at every step. All of them stay inside the contract: named
reason-codes, append-only ledger, canon cut by CI.

| # | playbook | the job |
|---|------------|-----------|
| 1 | [First look](/eyestruct/playbooks/first-look/) | seed a page's baseline - init, one route, one committed proof |
| 2 | [Shipping a visual change](/eyestruct/playbooks/ship-visual-change/) | edit, look, mask-invariant diff, explained adopt, gate |
| 3 | [Red-gate triage](/eyestruct/playbooks/red-gate-triage/) | a failed eye gate: the drift codes and their moves |
| 4 | [Pin bumps](/eyestruct/playbooks/pin-bump/) | a new browser image is one edit and two dispatches |
| 5 | [Answering from memory](/eyestruct/playbooks/answer-from-memory/) | a visual question answered browserless, from the committed state |
| 6 | [Adding a route](/eyestruct/playbooks/add-a-route/) | extend the matrix by hand, then `walk` it |
| 7 | [Red pack campaign](/eyestruct/playbooks/pack-campaign-red/) | `npm run packs` came back red: NEW / REGRESSION / RETIRED, and the adopt dance |

Recipes are single-file by design: moving text without moving intent, each
one letter-accurate against the workflow it documents. The CI-guide companion
([CI guide](/eyestruct/ci)) documents the lanes themselves; playbooks are
what an agent runs through those lanes.
