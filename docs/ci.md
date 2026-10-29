---
permalink: ci/
layout: default
title: CI guide
description: What runs on eyestruct's own CI - the test battery, the pack campaign, the crashtest adversarial leg, the ratify canon lane, the tag-driven release ladder, and the docs deploy. Where to look when a run goes red.
---

# CI guide

eyestruct's CI is a battery of independent legs - each one honest alone,
each one deterministic. This page maps every leg to its workflow, its
gates, and where to look first when it goes red.

Instance mode runs outside this battery: the serve -> spot agent-vision
loop is a local/opt-in tooling lane ([seeing for
yourself](/eyestruct/playbooks/agents-vision/)), and only
`check:browser`'s rendered-table check borrows from it. Nothing here
requires a running eyestruct process - process-per-look holds in CI too.

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

## The release ladder (publish.yml, tag -> publish -> release -> verify)

The 1.0.0 cut proved the honest gap: a green publish step asserts the
publish act, not the published truth. From the tag on, one ladder owns the
cut end-to-end, and the tag (not a finger) starts it - `push` on
`v*` tags. Manual dispatch keeps the deliberate-cut law with two modes,
`publish` and `verify-only`.

| job | what it does | what it refuses |
|-------|---------------|-------------------|
| `publish` | OIDC trusted publishing (`npm publish --provenance`, the id-token proves the tarball came from this tree; npm >= 11.5.1 floor installed in-lane); `prepublishOnly` (npm test && npm run check) rides automatically, so a red battery cannot mint a tarball | 0.x versions (the family ship ladder keeps 0.x manual), and on a tag push, a tag that does not equal the packaged version - a tag that lies about its version never cuts |
| `release` | mints the GH release object from the pushed tag; the notes are EXTRACTED from the changelog's own `[version]` section by `scripts/release-notes.cjs` | an empty extraction (no changelog section for the packaged version) - the cut refuses rather than minting a noteless or miswired release; an existing release object is not re-minted, it carries on to verify |
| `verify` | the post-publish truth: `scripts/verify-release.cjs --npm` (registry latest == the tree's package version; the SERVED tarball's sha512 == the registry's own integrity metadata; provenance attestations present; then the full pack ladder on the served tarball) and `--gh` (the release object exists for the tag; its target == the tag's commit; the source tarball's file list is byte-identical to `git archive` of the release commit - zero drift) | every disconnect: a settled wrong dist-tag, a tampered or drifted tarball, a missing provenance stamp, a release pointing at the wrong commit, a source tar that leaks or omits files |

The pack ladder the verify job runs on the served tarball, in one line:
tar contents are scanned against the FORBIDDEN list (labs/, web/, docs/,
models/, packs/, tests/, .github/, node_modules/, source maps, .env -
smuggles are named, not summarized), the served set must equal `npm pack`
of the same tree exactly, the packaged name/version/exports map must
match the frozen rows, and the tarball is installed into a scratch tree
where `require('eyestruct')` (the adapter contract) and the installed bin
answering `--version` are driven as a real consumer.

`verify-only` dispatch mode runs the verify job alone - no publish, no
release minting - re-proving a cut (or the lane itself) against what is
already published and released, on demand.

The pack ladder does not wait for release day either:
tests/release-verify.test.js runs the same script over `npm pack` output
every push (the positive ladder, the doctored-tar case - a file under a
forbidden prefix must be refused BY NAME - and the GENERIC-CORE proof:
a synthetic foreign repo is verified with ZERO edits to the script, and
a caller-stated `--forbidden` prefix catches a smuggle the defaults
miss). The script is repo-agnostic by construction - name, version, bin
path, and registry package are read from the caller's tree, and every
repo-specific rule arrives as a flag: `--exports k1,k2,...` pins the
frozen exports keys, `--probe "<js>"` adds a consumer probe against the
installed package (eyestruct passes its adapter-contract assertion),
`--forbidden p/,q/` extends the family-default forbidden list. An
adopting repo copies one file and states its rules in its own workflow
and battery - the script itself never moves. Offline, the consumer-
install half prints a named SKIP; in CI with registry access it always
runs. The script's own exit contract (tooling, outside the frozen
reason surface): 0 verified, 1 verification failure (named), 2
capability gap.

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
| `npm run packs` | the eye pack campaign - 34 adversarial cases over the real CLI (five packs incl. eye-adapter, the adapter surface's schema carrier) | `npm run packs -- --adopt` re-baselines new refusals |
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

## The capture contract (what the canon compares)

Two properties every consumer needs before cutting canon on a real site:

- **Captures are viewport-only.** The capture is the pin's viewport; a
  `#fragment` navigation or a below-the-fold edit to the same route reads
  `SAME` by design, not oversight. Verify scroll-shifting content with
  its own route row - full-page capture is a designed affordance, not
  shipped.
- **The canon cut is byte equality, stricter than pixel vision.** A
  re-roll whose pixels are identical but whose bytes drifted reads `SAME`
  at `diff` and refuses at `ratify` - and real Chrome paint over
  photographic textures is not byte-stable: a one-pixel drifter can move
  between runs even when the app itself is frozen (receipted by the first
  consumer wiring, dhaupin/khf-wp `qa/eyes/`, on a texture-heavy
  WordPress install). For those surfaces there is now a named alternative:
  a route row may carry a per-slot `tolerance:` profile (`strict` is the
  default and means byte equality; the profile is one token naming all
  three bounds - `channel:<0-255>,pixels:<0-1>,bbox:<WxH>`, or nothing).
  A tolerant slot's `ratify` cut is a different, clearly-named pledge:
  pixel-eq at bounded span, and the ledger row carries the profile
  verbatim (grep `tolerance` in the ledger for every bounded-span pledge;
  `gate` stays browserless ledger accounting and never learns tolerance).
  The bounds are measured-then-quoted, never guessed: khf-wp's run root
  measured the three paint-noise families this lane consumes, and their
  capture-timing movers (a cover-crop alternation, a resize-settle race)
  stay OUT of any profile by design - races owe a settle-then-shoot
  contract, not bigger bounds (the exclusion ruling, T-T9). The shipped
  shape: spec and build receipts in labs/prd-eyes.md (R-C2's T-T rows);
  the ship gate on real textures stays the consumer's three consecutive
  green canon cuts in their pinned environment.

## Consumer recipes: which verbs fit where

The gate reasons over git state and the ledger alone, so it is the only
capture-adjacent verb that fits CI without an environment. Everything
that captures needs the pinned browser and a rendered target, which puts
look / diff / walk / ratify / spot environment-local on a CMS:

| Verbs | Runs | Why |
| --- | --- | --- |
| `gate` | CI, anywhere | ledger accounting over the manifest + committed artifacts, zero captures |
| `look` `diff` `walk` `ratify` `spot` | environment-local | each reads a rendered page through the pinned browser |
| `adopt` `ledger` `init` `lint-packs` | repo state | no captures, no browser |
| `serve` | local | owns a port for its lifetime, CLI-only |
| `mcp` | a chat session or host | stdio server, the same contract as the CLI |
| `raster` | cache-warm lane | rasterizes committed SVG artifacts |

For a CMS or any non-static target, the shape the first consumer wiring
settled on generalizes: CI holds the browserless `gate`; captures live
in a sandbox that can bake and serve the real site; the canon cut rides
the manual `eyes-ratify` dispatch, so a deciding dispatch and a proposing
dispatch are never the same run (the recipe is dhaupin/khf-wp `qa/eyes/`,
a mu-plugin freeze armed by the run wrapper, put -> drive -> unlink).

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
