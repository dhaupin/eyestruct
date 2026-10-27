# eyestruct - rolling work log

- **Freshness pass (2026-10-27, late) - the round-2 trifecta walk became a
  battery leg, and the docs visual gap closed locally.** (1) The walk is
  now `npm run check:trifecta`, opening the `check` chain: README's usage
  fence is matched against the real COMMANDS dispatch and bin `usage()`
  (no phantom verbs/flags - the round-1 catches), cited workflow lanes,
  npm scripts and docs pages must exist on disk, AGENTS receipt counts
  must agree with the tree LIVE (25 reason-codes / 26 pack verdicts /
  52/52 findings / 3 packs, whitespace-normalized because line wraps are
  cosmetic), and CHANGELOG's Unreleased block must cite only artifacts on
  disk and hashes in history. Ruling learned on the leg's own first run:
  historical release sections stay out of scope - they are receipts of
  their era (`docs/verbs.md` was real at 0.9.0; folded into `cli.md`
  later). Behavior coverage in `tests/trifecta.test.js` (temp-dir
  fixtures; the checker refused my OWN test fixture first - baseFixture
  forgot CHANGELOG.md and the leg said so by name). (2) The honest round-2
  gap - docs tokens verified only after push - closed: the sandbox now
  runs the docs Jekyll build end to end (pinned user-dir Ruby 3.4.12 from
  the official ruby/setup-ruby prebuilt toolchain, bundled libs via
  LD_LIBRARY_PATH, binstubs shimmed through the interpreter because they
  bake /opt/hostedtoolcache shebangs, Bundler path pointed OUTSIDE the
  repo so no lockfile/.bundle ever lands in-tree; scratch copy under
  /tmp so even the build products stay out). jekyll build: 0.416s, green;
  both halves captured through the repo's own `look` engine at 1280x800
  with the localStorage launcher trick - graphite + jade dark frame,
  parchment + deep-jade light frame, element map riding as designed
  (labels overlaying the ids), all verified first-person.

- **Finishing pass 3 (2026-10-27) - mcp ref, raster leg, wave rows, and BOTH ship receipts, first-person.** (1) `docs/mcp.md`
  landed (18 pages, nav Reference row): the stdio surface described from
  `lib/mcp.js` itself - nine tools, JSON-RPC framing, the core law at the
  tool boundary (pixels only when `include_image`), error mapping, host
  wiring. (2) MVP-5 rides CI: `raster:gate` re-pointed at the art that
  ships (`docs/icon.svg` + `web/public/icon.svg` - the old `horcrux/*.svg`
  glob died in the stone removal) and a `npm run raster:gate` leg in
  `test.yml`; both icons rasterize 1630B opaque. (3) Churn-wave rows
  shipped for real: type 'wave' rows carry `artifacts: [...]` (one note
  explains N image changes), `eyestruct adopt <path...> --wave` writes ONE row
  over N changed slots, gate explains every referenced artifact and
  dangles louder on a wave ghost (`row-id (path)` in the refusal),
  `ledger list` prints wave rows as `a.png + b.png` and routes-filter
  honors wave members; two new smoke legs + the two legacy ones still
  green. (4) The two first-person receipts, both SEEN not narrated:
  - **Receipt A (the founding catch, reproduced).** Live demo surface
    at `labs/.eyes-receipt/page.html` (ids: hero-title, hero-sub,
    card-title, field-name, field-email), its own eye home via
    `--manifest/--ledger` (pin chromium@153.0.8010.0, the lambda
    chromium build run through `EYESTRUCT_BROWSER` + bundled libs -
    system apt is locked down here; `~/.cache/puppeteer` chrome fetched
    but refused at libnspr4, correctly reported as CAPTURE_BLOCKED and
    removed so the default battery stays browser-skip). Baseline look:
    21018B, 5 ids mapped + overlay labels - BUFFY LOOKED AT THE PIXELS
    (title visible, card, inputs). Then the break: ONE CSS line flips
    `.hero h1` color to the band's own bg; the DOM diff of the edit is
    EMPTY (same nodes, same ids - every selector still resolves), while
    `eyestruct diff` returns DIFFERS (baseline 21018B vs fresh 19241B)
    and exit 1 - NAMED, not silent. The caught pair rides the tree:
    `labs/.eyes-receipt/receipt-caught.png` (Settings gone, page id-boxes
    unchanged) and `receipt-region.png` (#hero-title crop: element still
    queryable, text invisible). Ledger trail: row-0001 baseline adopt +
    row-0002 the wave (one note over both evidence frames) - the
    churn-wave row's first real use.
  - **Receipt B (the memory receipt).** The fresh-session half ran
    with no browser at all: `ledger list` + `ledger show` answered what
    the demo surface looks like from the committed memory (dark 1280x800,
    Settings leading, profile card with name/email inputs, annotated
    id-boxes) without a single capture or DOM walk - the ledger + the
    committed current.png were the whole interface.
  - Both receipts are PROPOSALS (ratified:false) per the law - canon
    cut happens when CI ratify reproduces them in the pinned image; the
    demo home is a separate eye home, so the landing's committed
    labs/.eyes/ canon is untouched.
(5) `docs/cli.md` adopt row documents `--wave`. Battery: npm test 25/25
  with the browser exported (8 formerly-skipped look/diff/ratify legs ran
  and passed), 0 new / 0 regressed / 0 accepted on the crashtest leg, npm
  run check green, lint:docs 5/5 at 18 pages.
- **Site passes (2026-10-27, evening).** (1) The mobile table guard landed
  and got filed family-wide (flowforge#13, gistory#16, crashtest#41,
  prestruct#62, packstruct#31, poststruct#14 + monoforge#7, freestruct#35
  engine ask, vant#263) - with a vant#223 incident documented honestly in
  vant#262 (agent overwrote another issue's body mid-filing; maintainer
  restored from GitHub edit history). (2) Docs UX repairs (d26fdfc): brand
  home baseurl-aware, Release posts in the nav, lean discussions index.
  (3) The landing flesh-out (e90a4a1): three-part contract cards, the
  two-dispatch pipeline, the self-policing verdict table (52/52 REFUSED),
  install block - all on existing tokens. (4) robots.txt residue caught and
  fixed (0a54997: crawlers were pointed at crashtest's sitemap); family
  sweep + flowforge#16 (the template file is the crashtest blob
  byte-identical). (5) Site P1-P3: footer Releases link, a real og-image
  card (generator committed at web/scripts/og-image.mjs; build-local
  dejavu-fonts-ttf via --no-save, lockfile untouched; numbers are the
  claim-inventory receipts), and the live gate-status island
  (GateStatusIsland, idle-mounted; fetches packs/eye-ledger.json +
  labs/crashledger.json from raw.githubusercontent at load - CSP grew one
  origin). Release-day hooks unchanged: the card's numbers, the landing
  claims, and the discussions watchlist are the same five receipts,
  re-verified together when 0.9.0 publishes.
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
- **Lint-lane pass (2026-10-27).** The packstruct lint lane became a real
  verb: `eyestruct lint-packs [--deep] [--json] [--against <lib>] [dir]`
  (mirrors crashtest's lint-packs, cli.js issue #32) - runs packstruct over
  the repo's own install (node_modules/.bin first, then PATH), never
  downloaded; missing packstruct -> PACKSTRUCT_MISSING exit 2 naming the
  fix (explicitly requested lane = broken config, not a skip); exit codes
  pass through verbatim; the packs ROOT is the default dir (the
  packs/public footgun from gistory's first wiring is receipt-documented).
  npm run lint:packs routes through the verb now. Both paths receipted:
  green 3/3 packs + loud refusal with the install restored byte-identical.
- **Docs scaffold pass (2026-10-27).** The docs tree grew from identity
  pages to the family scaffold: start (install + init + first look-to-gate
  cycle), cli (full verb surface + exit contract), reasons (complete
  named-refusal table mirrored from lib/reasons.js), ci (four battery legs
  + cannon lane + docs lane + when-red triage map), playbooks (six
  recipes), and the labs/prd-eyes proxy (the nav item that pointed at a
  nonexistent page now explains why the PRD lives in labs/ under its own
  voice). Nav rewired on one source (docs/_data/nav.yml). Style gate
  caught one banned cliche in the draft ("unlock"), fixed. lint:docs 5/5
  at 10 pages, npm run check green (fa97161, live + CI-verified). The
  same gap-fill inventory was filed family-wide: poststruct#13 /
  monoforge#6 (whole tree), crashtest#40 (CI leg), gistory#15
  (playbooks + CI), freestruct#34 (playbooks), prestruct#61
  (CI + playbooks).
- **Docs cruise (2026-10-27) - the scaffold filled out.** three legs from
  the survey: (1) verbs.md retired into cli.md - the canon/coverage pair
  (walk = coverage, ratify = canon, pinned-image lane only) and the
  mask-invariant drift rule now live in the CLI reference; the old page's
  "look writes labs/.eyes" prose was pre-harness drift, gone with it; (2)
  playbooks split to one-recipe-per-page (7 pages now, the index a table)
  with a seventh recipe written straight from run-packs.cjs receipts:
  red pack campaign triage - NEW / REGRESSION / RETIRED row classes, the
  --adopt wholesale-rewrite contract, and the ledger diff as the review
  artifact; (3) the discussions index stays release-post-shaped (one post
  per release, fiction-by-promotion rule intact) but gains a first-post
  watchlist: five claims already receipted on the dev tree (reason codes,
  pack campaign, crashtest leg, two-dispatch canon, the lint-packs
  wrapper), to be re-verified against the published tarball before the
  first post exists. lint:docs 5/5 at 16 pages, check green.
- **Docs pass 2 (2026-10-27) - install leads with npm.** start.md opens
  install with `npm install --save-dev eyestruct` outright (the package
  page treats npm as the consumer path; the clone stays as the
  contributing path). The staging hedging was dropped per direction.
  Reality stamp, held in ink here until the corner lands: the package is
  not yet published - start.md currently promises npm before npm is
  true. Flip this row to history when the publish lands. Gates green,
  pushed, docs CI + battery success, live page serving the new copy
  (b648eed).
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
