# eyestruct - agent knowledge

Working policies (seed; the brain grows these by working):

- Receipts rule every claim: what broke, what the rule is now. No
  receipt, no ledger row changes.
- Process-per-look: never a resident daemon. Browserless verbs
  (init/manifest/ledger/gate/adopt/raster) must never require a browser.
- Canon is CI-cut. Local captures/adopts are probes and proposals; the
  ledger row that makes a baseline official is written by the CI lane in
  the pinned image.
- Failures carry named reason-codes and the 0-1-2 exit contract. Never a
  bare stack trace, never a guessed parse (the vant inspect receipt).
- Tests: `npm test` (node:test, behavior-only, temp dirs, no network).
  Docs gates: `npm run lint:docs` - the PRD lives at labs/ UNDER ITS OWN
  VOICE (em-dash); docs/ is hyphen-voice and must stay clean.
- Where things live: `labs/` (PRD canonical, TASKS, the eye home at
  `labs/.eyes/` - the CLI default now - and the receipt hall at
  `labs/.eyes-receipt/`), `horcrux/` (the transfer stones),  `packs/public/` (4
  adversarial packs + `packs/eye-ledger.json`;
  packstruct-linted; `eye-bundle` covers the vendored browser lane), `web/` + `docs/` (the rig). THE BRAIN:
  `models/private/magpie/` left the tree 2026-10-27 - it lives in the
  vant install (`$HOME/vant/models/private/magpie/`, wholesale
  gitignored there, updated with the shipped receipts); never re-seed
  one into this repo, the npm tarball never carried it (files field).
- The battery is `.github/workflows/test.yml` (npm test + check (opens
  with the check:trifecta freshness leg) + the
  crashtest leg + the raster:gate icon leg); the docs lane is
  `docs.yml` (Jekyll + freestruct + pagefind -> Pages at
  docs.creadev.org/eyestruct); canon lane is `eyes-ratify.yml`
  (manual dispatch, the only baseline cutter). Reference docs live at
  docs/cli and docs/mcp; the reference post in docs/discussions. The
  freshness leg's history probes carry a clone-depth contract
  (eyestruct#6): a shallow checkout self-deepens once, a refused
  deepen names SHALLOW_CLONE and skips the probes - consumers never
  need fetch-depth 0 to get an honest verdict.
- Receipts to cite: 28 reason-codes (lib/reasons.js), 30 pack verdicts
  (packs/eye-ledger.json), the 52/52 hostile leg (labs/crashledger.json),
  the bundle lane receipts (lib/bundle.js; offline executor, integrity
  verified at every resolution), the two ship receipts (labs/TASKS.md
  2026-10-27 entry).
