---
permalink: playbooks/agents-vision/
layout: default
title: Seeing for yourself
description: The agent vision playbook - how a coding agent runs its own eyes during a build - serve, spot, read the pixels with its own vision, act, and re-spot. Receipts over vibes, verified end to end in a browserless VM.
---

# Seeing for yourself (the instance loop)

A coding agent can watch its own work the way a human reviewer does: render
the thing it built, open the pixels, read them, and act. This playbook is the
mechanical recipe - verified end to end in a browserless CI VM, which is the
hardest place to see anything.

The loop, one line:

```sh
eyestruct serve web/dist &   # or any URL - the agent's choice of host
eyestruct spot http://127.0.0.1:<port>/status
# then READ the printed PNG path with your own vision and act on what you see
```

Result of one round: `spot: labs/.eyes-candidates/spot-127.0.0.1__status_<ts>.png`
plus the element map - static, named, and still a candidate (the ledger and
the canon are governed by `adopt` and the CI lane, never by a spot).

## Two verbs make it native

| verb | what it does |
|--------|-----------------|
| `serve [dir]` | the instance primitive: serves a baked tree with the committed `_headers` rules host-shaped (exact paths, `*` prefixes, the miss path included); starter semantics, Ctrl-C stops |
| `spot <url>` | one absolute capture saved to `labs/.eyes-candidates/spot-*.png` + the element map; candidate-only, canon stays CI-cut |

Both refuse by name (the serve tree does not exist, the spot URL is absent,
the pinned browser is unresolvable) - never a bare stack trace, always the
0-1-2 contract.

A capture is viewport-only and never scrolls, so a `loading="lazy"` image
below the fold comes back blank at any extent. Add `--settle` when you are
looking at something that lazy-loads (a footer map, a long gallery): the
capture walks the document to the bottom, waits for the images to load,
returns to the top, then shoots. A settled look that still finds unloaded
images prints a NOTICE, so a blank plate is never mistaken for evidence
(issue #27).

## The receipts behind the page

The loop is not aspirational; the following were machine-run receipts from
2026-10-28 (see `labs/TASKS.md`):

- a browserless VM planted `chrome-headless-shell` root-free and ran the
  rendered-table check to a full 4-state PASS;
- the served-contract battery leg caught two stale dists before any
  browser could (served output lagging the generator's truth);
- a `spot`-style capture of this repo's own `/status` page was read by the
  coding agent with its own vision and generated a fix in the same round.

## The five loop rules (the feature, formalized)

1. **render what you ship, not what you hope** - `serve` points at the
   same tree the web lane deploys; never at a private preview of it.
2. **read pixels or the map, never prose claiming pixels** - the spot
   prints the file path; the agent opens it with its own vision or the
   mapped element ids. A number with no ledger is a claim, not a receipt.
3. **candidate is candidate** - spot never writes the ledger; the canon
   stays CI-cut (the two-dispatch rule). Local spot captures are evidence,
   not truth.
4. **act on findings, re-spot to verify** - the round is finished when the
   re-spot reads clean, not when the fix is written.
5. **counts come from files, never hand-copies** - the count census in the
   battery keeps any claim typed in the prose equal to the ledgers.

## Getting the browser (refusals are the map)

`spot` needs the capture engine's browser. The resolution order the whole
surface shares: `--browser-exec` > `EYESTRUCT_BROWSER` env > the manifest
pin > the puppeteer cache. Refusal `MISSING_PINNED_BROWSER` names what is
missing and the fix (the same env the capture and lanes honor; opt-in
install, never a vendored download). No manifest in the repo? Finish the
[first-look playbook](/eyestruct/playbooks/first-look/) first - `init` is
browserless.

## Where this comes from

`serve` is `lib/serve.js` over the shared `lib/serve-dist.js`; `spot` is
`runSpot` beside `runLook` in `lib/look.js` (and the `spot` MCP tool in
`lib/mcp.js` is the same loop for a session). When a verb and this page
disagree, the source wins - same rule the
[CLI reference](/eyestruct/cli) carries. Loop receipts live in `labs/TASKS.md`;
the site carries the feature page at eyestruct.creadev.org/agents.
