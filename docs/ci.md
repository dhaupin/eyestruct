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
| `npm test` | node:test spine (behavior-only, temp dirs, no network) + the count census | every hand-copied count-claim on the audited surfaces equals the live ledgers (eyestruct#10) |
| `npm run check` | four sub-gates: docs lint, pack campaign, `lint:packs`, conformance audit | see below |
| `npx crashtest run` | adversarial leg over the real CLI | committed `labs/crashledger.json` baseline |
| `floors-node18` (second job, same push) | node 18 receives `npm ci` + `npm test` only | the consumer `engines >=18` claim keeps a continuous CI receipt (see the floors table) |

### Runtime floors (receipts, not vibes)

Two floors, both receipt-backed - do not blur them:

- **Consumer runtime floor: node `>=18`** (the `engines` field). Receipt:
  the whole `npm test` spine ran green on `v18.20.8` - the smoke legs drive
  the real bin, so the runtime surface (dispatch, ledger, gate, raster +
  honest skips) is proven there, once and continuously re-provable by the
  node-test leg on any machine.
- **Battery floor: node `>=20.19`** for the dev gate that loads ESM
  conformance fixtures through `require(esm)`. Below that, the fixture
  entry refuses to load and the loader exits 2 - the `conform:packs` audit
  names the disagreement (`AUDIT clean [audit-accept]: loader exit 2`) and
  the gate refuses rather than fake-passes (receipt: `v18.20.8`, 2026-10-28).
  CI pins `node-version: 20`, which floats to latest 20.x and satisfies
  the floor; a pinned 20.0 would not, so keep the floor phrase in any
  future matrix pin.

## Runtime receipts by node line (2026-10-28)

| node | `npm test` | `npm run check` | notes |
|-------|-------|-------|---------|
| `v18.20.8` | 63 pass / 8 skips / 0 fail | refuses at `conform:packs` (see floors above) | consumer CLI surface proven; no fixtures loader |
| node 20 (CI, run #58) | green | green | the battery floor line CI defends |
| `v24.21.0` / `v26.3.1` | green | green | the Termux publish machine's line |

The `floors-node18` job re-runs the v18 row on every push, so the 18 line
stays a standing receipt instead of a one-mortem (eyestruct#10 item 4).

### Inside `npm run check`

| gate | what it polices | adopt flow |
|-------|-------------------|--------------|
| `lint:docs` | 5 gates: frontmatter, links, style (hyphen-only voice), fiction signatures, jekyll filters | fix the page |
| `npm run packs` | the eye pack campaign - 30 adversarial cases over the real CLI | `npm run packs -- --adopt` re-baselines new refusals |
| `npm run lint:packs` | packstruct `--deep` grammar over `packs/` | fix the pack |
| `npm run conform:packs` | packstruct audit-conformance with the loader | loader stays the ground truth |

`lint:packs` rides the CLI verb (not a raw script): it runs packstruct over
the repo's own install, never downloads one, and refuses `PACKSTRUCT_MISSING`
exit 2 when the devDep is absent.

### Inside `npm test`, two wallet-split hardening legs

The count census (above, eyestruct#10) plus the served-contract leg
(`tests/dist-server.test.js`): the committed `_headers` clauses for
`/status.json` always run, and a localhost serve of `web/dist` with a real
HTTP client runs whenever a build exists - served output must equal the
committed ledgers' generator output, so a lagging dist fails the leg, not
a browser finding it later. On CI the served half honest-skips (the web
build belongs to the web lane); run it locally with
`npm run build --prefix web` first.

The rendered-table spot check is opt-in tooling, never battery:
`npm run check:browser` loads the served dist in headless chromium
(`EYESTRUCT_BROWSER=/path/to/chrome`, the same env the capture lane
honors; never downloaded or vendored by the script) and renders all four
dialect states - PASS row, RED degradation, the clean 404 wording, and
the schema-2 refusal. No chromium names `MISSING_PINNED_BROWSER` exit 2.

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

## Browser bundle (offline CI mode)

A runner that cannot fetch chrome on demand can carry the capture stack
inside a checksummed tarball instead:

```sh
# produce the bundle from any chrome tree (the puppeteer cache, or an
# unpacked chrome-for-testing release): keep the top dir intact
tar -czf eyestruct-browser.tgz chrome-linux64

# consume it in the repo: seed the state with the bundle recorded
eyestruct init --browser-image chrome@<pinned-version> --renderer resvg@2.6.2 \
  --browser-bundle eyestruct-browser.tgz
```

`init` hashes the tarball (sha256), unpacks it once into
`~/.cache/eyestruct/bundles/<sha-prefix>/`, marks the install with an
integrity file, and records `bundle@<sha-prefix>` in the manifest pin.
The hash and the extract run through one open file description (the
fd pin): a tarball swapped between the two operations cannot feed the
unpack different bytes, and an in-place tamper during the unpack is
refused by name instead of stamped into the marker.
The re-seed is idempotent: re-running the same `init --browser-bundle`
line (or adding the bundle flag to a living manifest) preserves the pin
and the route matrix byte-for-byte outside the bundle row, and reuses
the installed cache dir (`reused` in the receipt).
`look`, `diff`, `walk`, and `ratify` then resolve that exec BEFORE the
puppeteer cache and the refusal - the capture runs offline inside the
pin, and init stays browserless either way (one tar call, one hash).

Executor resolution order, and what each trust step costs:

| step | resolved from | trust |
|--------|-----------------|---------|
| 1 | `--browser-exec` / `EYESTRUCT_BROWSER` | the operator, by hand |
| 2 | `pin.browser-exec` | the manifest pin |
| 3 | `pin.browser-bundle` (this lane) | sha256 in the manifest + the cache's integrity marker, verified on every resolution |
| 4 | the puppeteer cache | the machine's own install history |
| 5 | nothing | `MISSING_PINNED_BROWSER`, named - never a guessed exec |

A cache that disagrees with its manifest recording (tamper, partial
unpack, a moved install) refuses with the same code - re-run
`init --browser-bundle` to re-anchor. The tarball itself is never
executed until unpack; the exec is chmod +x at install so the
resolution is launchable without a resident daemon.
