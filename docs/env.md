---
permalink: env
layout: default
title: Environment reference
description: The env-var surface of eyestruct - the keys the CLI and the adapter read, what they change, and the precedence each one rides. An addition is a minor bump; a name is stated once here and pinned by the battery's env leg.
---

# Environment reference

The env-var keys are a frozen surface: a new key lands as a minor bump
with this page updated in the same commit, and the battery's env leg
derives the live inventory from the source so a key cannot appear in
code unannounced. No other `EYESTRUCT_*` names are read - a name that is
not here is dead code by definition.

## The keys

| key | reads | default | notes |
|-----|-------|---------|-------|
| `EYESTRUCT_BROWSER` | the capture engine (`lib/engine.js`), the chromium lane (`scripts/check-browser.mjs`) | - | absolute path or home-relative path to a chrome exec; precedence 2 of 3 between `--browser-exec` and `pin.browser-exec` |
| `EYESTRUCT_BUNDLE_CACHE` | the bundle lane (`lib/bundle.js`) | `~/.cache/eyestruct/bundles` | root for the checksummed browser-bundle cache; the checksummed marker rides the same dir so a redirect cannot swap integrity for convenience |
| `EYESTRUCT_AGENT` | the ledger writer (`lib/identity.js`) | `local-agent` | the `agent` stamp on every ledger row the process writes |
| `EYESTRUCT_COMMIT` | the ledger writer (`lib/identity.js`) | `uncommitted` | the `commit` stamp on every ledger row; CI lanes set it so a row names its own SHA |

## Precedence, stated once

- **Browser exec:** `--browser-exec` > `EYESTRUCT_BROWSER` > `pin.browser-exec` > the
  puppeteer cache probe. A missing exec at any chosen layer refuses
  `MISSING_PINNED_BROWSER` naming the path it tried - never a silent
  fallback to another layer.
- **Bundle cache:** `EYESTRUCT_BUNDLE_CACHE` > `~/.cache/eyestruct/bundles`.
- **Identity:** `EYESTRUCT_AGENT` / `EYESTRUCT_COMMIT` > the neutral
  defaults. Absent values degrade rather than refuse, so tests and
  one-off runs stay deterministic.

## The stability law for this table

Additive-first within 1.x: a new key is a minor bump with a row here
and the env-leg inventory updated in the same commit; a removal or a
semantic change rides 2.0. The battery derives the live inventory from
the source (`tests/contract.test.js`), so the stale-name drift class
cannot re-form here either.
