# eyestruct - rolling work log

- **Scaffold pass (2026-10-25).** Repo shell staged at gistory's workspace
  from the flowforge rig @ 91e52e0 (the poststruct 0.9.0 rigging):
  web/ landing shell, docs/ on the rig layout with checker gates
  (SITE_PREFIX mirrored to /eyestruct), packs/ + LICENSE starters.
  Canonical PRD + the transfer stone + the seed brain moved in from the
  gistory staging mount. CLI spine written per the PRD: bin dispatch +
  lib reasons (exit contract 0-1-2, named code on every refusal) /
  manifest (pin + route matrix, strict hand-editable subset parser) /
  ledger (append-only, atomic, corruption refuses loudly - the vant
  inspect receipt) / gate (crashledger semantics: unexplained drift exit 1,
  capability trouble exit 2) / adopt (note required at write time;
  local adopt is an unratified proposal - canon is CI-cut) / look, diff,
  walk (engine seam declared; refuses honestly until the pinned browser
  image) / raster (strict parse + render + byte sanity; never fake-passes
  without a renderer) / mcp (post-MVP stub, honest refusal). Docs voice
  conflict caught by the rig style gate: the PRD (em-dash voice) stays at
  labs/, docs carries hyphen-voice identity pages. 13/13 smoke tests pass;
  lint:docs 5/5 gates pass.
- **Next slices.** 1) Pinned browser image + engine.capture wiring (look,
  diff, walk light up). 2) eye-shapes self pack + crashtest harness plan.
  3) packstruct lint:packs wiring. 4) MCP stdio surface over the same
  call functions. 5) The two first-person ship receipts (pixels-broken/
  DOM-clean edit gets caught; fresh session answers a visual question
  from .eyes/ with no browser).
- **Completion sprint (2026-10-26, pre-move).** 1) Web landing rebranded
  the flowforge placeholder: 12 fields (ssr identity block, Home copy + CTAs,
  nav brand/links/badge, footer, manifest, theme key both ends, package
  name) - `prestruct build` local green, dist proves zero flowforge
  strings, inject-brand populates eyestruct identity. 2) Own CI minted:
  .github/workflows/test.yml (node 20, npm ci hermetic, npm test +
  npm run check) - the tar-move plan's injected change #1, so move-day's
  first standalone push is gated by its own battery, not the borrow.
  3) docs/verbs.md added (usage lines match bin dispatch exactly; the
  frontmatter gate caught a leading-slash permalink and
  held it to the plain-path contract). Whole npm run check + npm test
  green locally before landing.
- **Harness pass (2026-10-27) - the eye polices itself, and crashtest rides CI.**
  1) Eye-shapes self-pack: the pack's battery grew a self-leg - the committed
  labs/.eyes canon must pass its own gate and ledger list read-only through
  the real CLI (PACKS version 0.2.0, adopted into packs/eye-ledger.json).
  2) Crashtest leg: crashtest@^1.1.0 devDep, crashtest.config.js root
  (packs: false, seed 0xE1E5), labs/scenarios/eye-cli-contract.js attacking
  hostile argv batches, MCP stdio frames (malformed JSON, proto-pollution,
  oversized, null method/params), and 6 hostile ledger variants - always
  subprocess, always in-process adjacency, fixed batches + seed for
  determinism. labs/crashledger.json + labs/hardening.md committed as the
  baseline; test.yml runs `npx crashtest run` after npm run check.
  3) The leg earned its keep on ride #1: three contract sharpenings, all
  RECEIPTED - empty verb `eyestruct ""` printed usage and exit 0 (now
  UNKNOWN_COMMAND, exit 1); joined `--ledger=` silently fell back to the
  default home (now BAD_FLAG_VALUE, both flag spellings); explicit
  `--ledger <missing-path>` improvised [] with exit 0 (now LEDGER_MISSING,
  exit 2 - the default home stays tolerant for fresh trees, gate catches
  it via UNRECORDED). One harness lesson went into the attack itself:
  oversized argv must stay under Linux MAX_ARG_STRLEN or exec never
  delivers it (E2BIG, raw OS stderr) - the first run mislabeled that as
  an exploit. Final state: packs 26 cases honest; crashtest 52/52
  REFUSED, 0 exploited, exit 0; npm test 15/0.
- **Landing pass (2026-10-26, evening) - the lock was the last drift.**
  The web rebrand rode main, but package-lock.json (58.7KB) never
  survived a text-lane carry: one transcription casualty on main (a
  partial `eyestruct-site` with a placeholder blob), reverted runner-side
  by a one-shot (which also taught fetch-depth: 0 - a shallow checkout
  cannot `git checkout <parent> -- path`). Final shape: the lock rode a
  gzip+base64 payload through a runner-side repair+emit one-shot that
  sha-gated f47974f87e152364 and JSON-checked root name `eyestruct-site`
  before writing, then removed its payload; the three one-shot workflows
  (web-lock-restore/emit/repair) were retired through the commit lane
  (commit 59dae63). The repair pass fixed one two-row scramble in its own
  payload near row 117 ("EMNEWAKhs" rode as "EMNEWSAKh" plus a stray
  join), caught by blob-id before any dispatch; and it learned the two
  hard GITHUB_TOKEN rules the hard way: a run cannot hold the
  "workflows" permission scope (the API refuses to even parse the
  workflows key), and a run's push may not patch files under
  .github/workflows - so both workflow cleanups rode the commit lane
  instead. Origin blob == disk blob (3518984fec0d90796a06206a85ff2e92c1
  cf874c): package.json + package-lock.json now agree on the eyestruct
  name, and `npm ci` stays hermetic.
