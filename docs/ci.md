---
permalink: ci/
layout: default
title: CI guide
description: What runs on eyestruct's own CI - the test battery, the pack campaign, the crashtest adversarial leg, the ratify canon lane, and the docs deploy. Where to look when a run goes red.
---

# CI guide

eyestruct's CI is a battery of independent legs - each one honest alone,
each one deterministic. This page maps every leg to its workflow, its
tweed, and where to look first when it goes red.

## The battery (test.yml, every push and PR to main)

| step | leg | gates |
|-------|-------|---------|
| `npm ci` | hermetic install | exact-pinned devdeps only; the lockfile is law |
| `npm test` | node:test spine | behavior-only, temp dirs, no network, no browser |
| `npm run check` | four sub-gates: docs lint, pack campaign, `lint:packs`, conformance audit | see below |
| `npx crashtest run` | adversarial leg over the real CLI | committed `labs/crashledger.json` baseline |

### Inside `npm run check`

| gate | what it polices | adopt flow |
|-------|-------------------|--------------|
| `lint:docs` | 5 gates: frontmatter, links, style (hyphen-only voice), fiction signatures, jekyll filters | fix the page |
| `npm run packs` | the eye pack campaign - 26 adversarial cases over the real CLI | `npm run packs -- --adopt` re-baselines new refusals |
| `npm run lint:packs` | packstruct `--deep` grammar over `packs/` | fix the pack |
| `npm run conform:packs` | packstruct audit-conformance with the loader | loader stays the ground truth |

`lint:packs` rides the CLI verb (not a raw script): it runs packstruct over
the repo's own install, never downloads one, and refuses `PACKSTRUCT_MISSING`
exit 2 when the devDep is absent.

### The crashtest leg

`crashtest run` attacks the CLI as subprocesses: 14 hostile argv batches,
hostile MCP stdio frames (garbage, proto-pollution, oversized, null
methods), and 6 hostile ledger file variants - a fixed batch list and seed
(`0xE1E5`), so the same commit always fires the same attacks. It bears a
committed baseline (`labs/crashledger.json` + `labs/hardening.md`) and
fails only on a NEW EXPLOITED finding or a REFUSED -> EXPLOITED
regression - refusals that improve never re-alarm. Rows adopted exactly
like the pack campaign: rerun changes, read them, then adopt on purpose.

## The canon lane (eyes-ratify.yml, manual dispatch)

The pixel canon is CI-cut, never agent-cut:

```text
workflow_dispatch -> pinned chromium (version straight out of the manifest's pin)
                  -> web landing bake + static serve
                  -> eyestruct ratify across every manifest route
                  -> byte-identical slots ride append-only ratify rows
```

On drift the lane does the one honest bootstrap thing: it promotes the
pinned-env captures as proposals (`ratified:false`), commits them, and the
NEXT dispatch is the independent witness that cuts canon. Self-certification
is impossible by construction - the deciding dispatch is never the one that
proposed.

## The docs lane (docs.yml, docs/ paths)

```text
Jekyll build (Jekyll 4.3, kramdown + rouge)
  -> freestruct strict run (SEO layer over docs/_site)
  -> pinned pagefind (search index)
  -> GitHub Pages deploy
```

Red runs in this lane so far have been: a wrong source-root link, the
strict link-checker's `basePath` blind spot (tracked upstream as
freestruct#32), and YAML quoting. The deploy target is
`docs.creadev.org/eyestruct` - account-level domain mapping, assigned when
Pages was enabled.

## When a run is red, look here first

| failing leg | first place to look |
|---------------|-----------------------|
| `npm test` | run the suite locally; failures are named, temp-dir isolated |
| `npm run check` (docs) | the exact gate line names the file and the field |
| `npm run check` (packs) | the campaign output names the case id + got/expected |
| `npm run check` (packstruct) | `lint --deep` output names the pack + the rule |
| `npx crashtest run` | `labs/hardening.md` is the human-first report; the ledger row names the attack |
| eyes-ratify | a drift row means the baseline moved; re-dispatch is the witness, not a fix |

Every leg is independent: a red pixel-canon dispatch does not hold the test
lane, and a red docs deploy does not hold the battery.
