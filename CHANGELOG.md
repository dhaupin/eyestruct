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
- Web: the landing wears the real brand + its theme token pair, and
  `/packs` + `/status` ship as standalone routes reading the same committed
  ledgers a fresh session reads.

### Changed (2026-10-27)
- The web + docs shell re-skinned off the template periwinkle, through
  petrol-night/pale-sea (spec cross-filed to flowforge#18) to the shipped
  pair, jade on graphite: warm graphite dark (#121011) + parchment light
  (#f6f1e7), jade iris accent (dark #45cf83 / light #197a4c AA), with
  sage-olive success and coral error deliberately kept distinct from jade
  (the verdict-table ruling) - receipts: commit `e4a73ac`, live curls of
  both sites carrying the token values, dark/light frames captured via
  the repo's own `look` engine. Palette specs + a switchable-paint-scheme
  request ride the family template (flowforge#19/#20/#21).
- The brand mark re-wears the accent: icon set + docs tile regenerated
  through `make-icons.mjs`, whose art path now points at
  `web/public/brand/eyestruct-logo.jpg` (it had regressed to the repo
  root after the packs move - caught while re-running the trace), and
  `og-image.mjs` constants + card follow the palette.
- Docs fix: the light token block now defines `--accent-deep`, so Rouge
  number/scalar tokens stop silently inheriting the dark-theme value on
  white pages.
- The round-2 trifecta walk became a battery leg: `npm run check:trifecta`
  opens the `check` chain and refuses (named STALE rows) when README's
  usage fence departs from the real bin dispatch, a cited workflow lane,
  npm script, or docs page doesn't exist, AGENTS receipt counts disagree
  with the tree, or CHANGELOG's Unreleased block cites paths/commits not
  on disk - while historical release sections stay honest as receipts of
  their era (the 0.9.0-era verbs page was real then, folded into cli.md
  later; the leg audits what is claimed true NOW, not honest history).
  Behavior coverage rides `npm test` (temp-dir fixtures, no network). Docs visual verification also unblocked locally: the sandbox
  runs the docs Jekyll build end to end (pinned user-dir Ruby 3.4.12,
  scratch Bundler path - no repo artifacts), so dark/light docs frames
  are now captured via the repo's own `look` engine beside the landing
  site's.

### Hardened (2026-10-27, the adversarial walk)
- The first repo-wide adversarial sweep landed its fixes: the MCP stdio
  transport no longer dies on a `null` frame (-32600 by name, server keeps
  answering) or a `tools/call` without a params object (-32602); `lib/adopt.js`
  lost the duplicated, divergent shadow helpers that hoisted over its real
  argument parser; the capture engine keeps chrome's own sandbox for non-root
  agents (root keeps `--no-sandbox`, with one named retry for containers
  without namespaces - `engine.launchAttempts` is the testable policy); and
  ledger artifact paths are eyes-relative by contract - a new reason-code
  `UNSAFE_PATH` (now 26 codes) refuses absolute or `..`-escaping targets at
  the adopt/wave write surface AND every ledger/gate read surface, so a
  hand-edited row cannot aim gate or diff outside the eyes home; the ledger
  temp-file write is created under `wx` with an unguessable suffix, closing
  the preplaced-symlink redirect edge. Receipts: the sweep in
  `labs/crashledger.json` stays 52/52 REFUSED (0 new, 0 regressed), pack
  campaign 26/26, and 5 new behavior legs in `tests/smoke.test.js`
  (temp dirs, no network).

  (temp dirs, no network).
- Round two of the walk swept the seams round one did not: a stated
  raster input that does not exist or is unreadable now refuses with the
  named code `MISSING_INPUT` (27 codes, exit 2 - the `LEDGER_MISSING`
  shape for artifact inputs) instead of falling out as the generic
  internal-error fallback; the two ported docs linters stop wearing
  crashtest's labels, and the link checker's doubled-site-prefix rule is
  now real for this repo (`/eyestruct/eyestruct/...` refused by name)
  and runs before the broad permalink check. Two new behavior legs
  (missing file, directory-as-input), 39 tests / 31 pass / 0 fail.

  (missing file, directory-as-input), 39 tests / 31 pass / 0 fail.
- Round three cleared the docket: a flag can no longer occupy another
  flag's value slot (`init --browser-image --renderer r:1` used to write
  the pin as "--renderer" - BAD_FLAG_VALUE now, nothing written); a flag
  in the `--note` slot refuses as ADOPT_NOTE_REQUIRED instead of landing
  "--wave" inside the note; `ledger show` splits its misses honestly -
  no id is UNKNOWN_COMMAND, a wrong id is the new `ROW_MISSING` code (28
  codes, exit 1) instead of borrowing DANGLING_ROW's name; the bin's
  dead posArg is gone; and the docs search overlay's innerHTML sink
  escapes the user query (self-XSS class, the q-interpolation catch).
  Receipts: 42 tests / 34 pass / 0 fail, battery + docs gates + hostile
  leg 52/52 all green.

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
