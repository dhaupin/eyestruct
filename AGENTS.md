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
  `labs/.eyes-receipt/`), `models/private/magpie/` (the brain; never
  shipped), `horcrux/` (the transfer stones), `packs/public/` (3
  adversarial packs + `packs/eye-ledger.json`; packstruct-linted),
  `web/` + `docs/` (the rig).
- The battery is `.github/workflows/test.yml` (npm test + check (opens
  with the check:trifecta freshness leg) + the
  crashtest leg + the raster:gate icon leg); the docs lane is
  `docs.yml` (Jekyll + freestruct + pagefind -> Pages at
  docs.creadev.org/eyestruct); canon lane is `eyes-ratify.yml`
  (manual dispatch, the only baseline cutter). Reference docs live at
  docs/cli and docs/mcp; the reference post in docs/discussions.
- Receipts to cite: 26 reason-codes (lib/reasons.js), 26 pack verdicts
  (packs/eye-ledger.json), the 52/52 hostile leg (labs/crashledger.json),
  the two ship receipts (labs/TASKS.md 2026-10-27 entry).
