# Changelog

All notable changes to eyestruct will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (2026-10-27)
- The capture seam is live: `lib/engine.js` drives the PINNED chrome through
  puppeteer-core (`--browser-exec` / `EYESTRUCT_BROWSER` / manifest pin /
  puppeteer-cache discovery, in that order) - `look`, `diff`, `walk`, and
  `ratify` capture for real; `MISSING_PINNED_BROWSER` names all four paths.
- Both PRD ship receipts ran first-person (the founding og-image-class catch:
  a pixels-broken/DOM-clean edit returns `DIFFERS` + exit 1, named; and the
  memory receipt: a surface described from `labs/.eyes/` with no browser).
  Evidence follicles + ledger trail live at `labs/.eyes-receipt/`, the run
  log in `labs/TASKS.md`.
- `adopt --wave`: the churn-wave ruling ships - N changed slots collapse into
  ONE wave row (`artifacts: [...]`, one note explains N image changes), with
  gate/list handling, the `eyestruct[UNRECORDED]`/`DANGLING_ROW` refusals
  carrying the wave shape, and smoke coverage (25/25 with a browser exported).
- `lint-packs` verb: the packstruct lint lane as a discoverable CLI verb
  (`--deep/--json/--against`), running over the repo's own install.
- MCP stdio surface is live (no longer a post-MVP stub): nine tools decoding
  the CLI verbs (look, diff, adopt, ratify, ledger_list, ledger_show, gate,
  raster, walk) with structured errors - probed via `tools/list`.
- Raster gate rides CI: `npm run raster:gate` over `docs/icon.svg` +
  `web/public/icon.svg` (re-pointed after the horcrux stones left the tree).
- The three-pack campaign ships complete: `eye-shapes`, `eye-ci-gate`,
  `eye-text-leg`, 26 committed verdicts in `packs/eye-ledger.json`.
- The crashtest adversarial leg rides CI: 52 hostile attacks
  (argv batches, MCP stdio frames, 6 ledger variants, seed 0xE1E5), 52/52
  REFUSED, 0 exploited.
- Docs grew the full scaffold: start / cli / mcp / reasons / packs / ci /
  playbooks (7 recipes) / discussions (release-post system + the
  announcing-v0.9.0 post) - 18 lint-gated pages, with `cli.md` and
  `mcp.md` mirroring the real dispatch and the tools registry.
- Web: the landing wears the real brand + periwinkle theme token pair, and
  `/packs` + `/status` ship as standalone routes reading the same committed
  ledgers a fresh session reads.

### Planned
- CI ratify cuts the receipt-baseline proposals canon in the pinned image
  (dispatch `eyes-ratify`); the proposals ride `ratified:false` until then.
- The 0.9.0 bootstrap publish: manual publish from a dev machine behind the
  full battery, then trusted publishing from the 1.0.0 tag onward.

## [0.9.0] - 2026-10-26

The first cut, grown in the gistory staging ecosystem end to end
(eyestruct-staging mount, its own nested git history, tar-ferry
provenance). Receipts: `labs/TASKS.md` in-repo; the vaulted PRD rides
the family horcrux.

### Added
- CLI spine per the PRD (`labs/prd-eyes.md`): `bin/eyestruct.js` dispatch
  over `lib/` with the exit contract 0-1-2 and a named code on every
  refusal - diagnostics carry reasons, never bare crashes ("NO
  bare/errors").
- `manifest`: pin + route matrix via the strict hand-editable subset
  parser; `ledger`: append-only and atomic, corruption refuses loudly;
  `gate`: crashledger semantics (unexplained drift exits 1, capability
  trouble exits 2).
- `adopt`: note required at write time; a local adopt is an unratified
  proposal - canon is CI-cut.
- `look`, `diff`, `walk`: engine seam declared; refuses honestly until
  the pinned browser image exists (never fake-passes).
- `raster`: strict parse + render + byte sanity.
- `mcp`: post-MVP surface; honest refusal until it lands.
- 13/13 smoke tests; `lint:docs` 5/5 gates.
- Web landing rebrand (12 fields: ssr identity block, Home copy + CTAs,
  nav brand/links/badge, footer, manifest, theme key both ends, package
  name) - `prestruct build` green with zero flowforge strings in dist,
  `inject-brand` populating the eyestruct identity.
- Own CI: `.github/workflows/test.yml` (node 20, `npm ci` hermetic,
  `npm test` + `npm run check`) - the first standalone push after the
  move is gated by this repo's own battery.
- docs/ on the family Jekyll + Freestruct rig: identity pages in hyphen
  voice (the PRD keeps em-dash voice at `labs/`), `docs/verbs.md` usage
  lines matching bin dispatch exactly, plus the frontmatter/style/language
  gates.
- `package.json` + `package-lock.json` agree on the eyestruct name; the
  lock landed byte-exact (origin blob 3518984fe... == disk).

### Notes
- 0.9.x is the manual release ladder at move time; the family publish
  workflow refuses 0.x tags, and 1.0.0 flips trusted publishing.
- docs voice law survived the write: locations and surfaces state facts
  in one voice per surface (em-dash PRD, hyphen docs).
