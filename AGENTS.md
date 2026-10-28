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
  crashtest leg + the raster:gate icon leg + the floors-node18 leg (the
  >=18 claim re-receipted on every push)); the registry cut lane is
  `publish.yml` (manual dispatch, OIDC trusted publishing, 0.x refusal
  at the gate, battery riding prepublishOnly); the docs lane is
  `docs.yml` (Jekyll + freestruct + pagefind -> Pages at
  docs.creadev.org/eyestruct); canon lane is `eyes-ratify.yml`
  (manual dispatch, the only baseline cutter). Reference docs live at
  docs/cli and docs/mcp; the reference post in docs/discussions. The
  freshness leg's history probes carry a clone-depth contract
  (eyestruct#6): a shallow checkout self-deepens once, a refused
  deepen names SHALLOW_CLONE and skips the probes - consumers never
  need fetch-depth 0 to get an honest verdict.
- The 1.0.0 stability law (eyestruct#10): within 1.x, no removal or
  semantic change on the public surfaces - the 13 COMMANDS verbs + usage
  flags (bin/eyestruct.js; serve + spot joined 2026-10-28 as the minor
  bump the law prescribes, with docs/cli.md moved in the same commit),
  the 28 reason codes + the 0-1-2 exit
  contract (lib/reasons.js), the 10 TOOLS + inputSchemas (lib/mcp.js;
  spot joined 2026-10-28 as the same-class minor bump, docs/mcp.md in
  the same change),
  the labs/.eyes/ manifest-pin schema, and the packstruct@1 grammar
  pin. Additions are minor bumps, always with the mirrored docs page
  updated in the same commit; removals and semantic changes ride 2.0
  only.
- The product story, three altitudes (README "The three altitudes" is
  the canonical statement): CI for devs/enterprise (shipping), adapters
  for agent platforms/cloud builders (designed next; MCP stdio is the
  first adapter), and real-time eyes inside the chat session via
  bridges/connectors (the designed pinnacle, NOT shipped - never claim
  it works today).
- The instance loop is native: `eyestruct serve [dir]` serves a baked
  tree with the committed _headers rules host-shaped (the ONE
  implementation, lib/serve-dist.js, shared with the battery leg + the
  chromium lane; a starter like mcp), and `eyestruct spot <url>` saves
  one capture to labs/.eyes-candidates/spot-*.png for the coding agent
  to read with its own vision. The loop: serve -> spot -> read -> act ->
  re-spot. Playbook: docs/playbooks/agents-vision.md.
- The count census (tests/census.test.js): count-claims on the audited
  docs/meta surfaces must equal the live ledgers and source tables;
  change a count and its claims in the same commit or CI fails the
  copy. Never hand-copy a number the census can derive.
- Receipts to cite: 28 reason-codes (lib/reasons.js), 30 pack verdicts
  (packs/eye-ledger.json), the 52/52 hostile leg (labs/crashledger.json),
  the bundle lane receipts (lib/bundle.js; offline executor, integrity
  verified at every resolution), the two ship receipts (labs/TASKS.md
  2026-10-27 entry).
- The family status dialect (family-status@1, docs/status.md): the
  served `web/public/status.json` (fixed path `/status.json` on the
  site) is GENERATED on every web build by web/scripts/build-status.mjs
  from the committed ledgers - never hand-edit it, never commit it
  (gitignored). The /status page reads the four family sites' files
  (FamilyStatusIsland); behavior pinned by tests/status.test.js. The
  served-contract leg (tests/dist-server.test.js + lib/serve-dist.js)
  serves web/dist locally with a real HTTP client when a build exists
  (honest skip on CI without one); the rendered-table spot check is
  opt-in tooling, never battery: `npm run check:browser` (needs
  EYESTRUCT_BROWSER, the same env the capture lane honors).
