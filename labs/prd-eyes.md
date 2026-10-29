# magpie (working name) — eyes for production agents

PRD draft. Stage-1 planning stone, same shape as `prd-crashtest.md` was at launch: this file is the seed a NEW repo and its own brain will open from. AMENDED 2026-10-27 — the seed sprouted: the repo exists (dhaupin/eyestruct), the CLI spine ships, and "nothing here is implemented" is true no more — see **State of build (2026-10-27)** near the end for the shipped/remaining ledger; the original sections below read as the plan that got it there. Owned by rook; every claim below is either a lived receipt from working in this fleet or sourced at first use.

STANDING AMENDED 2026-10-27 (late) — the repo is standalone. eyestruct left the gistory staging ecosystem: the factory era is over, the gistory-era sections below (first-client plans, tar-ferry provenance, workspace receipts) are history to be cited, not a leash still held. No repo — gistory or any other — is awaited before a next step; fleet wiring happens repo by repo through the filed family issues, and horcrux snapshots are cut by us when we want one. The next factory — a system built on monoforge and flowforge — replaces the gistory role when it exists; until then this repo ships on its own battery.

## The name

Magpies are among the very few non-mammal species ever documented passing the mirror test — a bird that understands what it is looking at IS itself. The project that gives agents sight, named for the animal that first taught science a non-human eye could be self-aware. (Also a magpie collects → so does the visual memory.) Working name; dhaupin confirms.

Naming split (2026-10-25, settled after the npm probe): the PRODUCT is **eyestruct** — repo `dhaupin/eyestruct`, package `eyestruct` (free on npm at probe, along with the whole struct-family lane; `birdeye`/`wrasse`/ `magpie` are squatted and birdeye collides with a screenshot-taking AI assistant to boot) — and **magpie remains the AGENT's name**, the same split as rook being the keeper while products carry struct names. Docs land at docs.creadev.org/eyestruct.

## Problem — the four real gaps

Vision capability is not the bottleneck: reading PNG/JPEG pixels is solved in every frontier model. What is broken for a working agent:

1. **Eyes are not ambient.** An agent sees only when handed an image or when it deliberately runs a headless browser. The default state is blind; verification therefore drifts to DOM-metric collectors, which prove structure, not appearance. Lived receipts: - Every gistory UI pass verifies via selectors and computed metrics — no pass has ever SEEN the shipped pixels. - 2026-10-25: gistory's social card (og-image) shipped days of visible escape-soup (`{{ }}language` fragments) — found by dhaupin glancing at a screenshot, not by any gate. Every DOM/computed gate was green while the pixels were visibly wrong. This is the founding receipt, not a hypothetical.
2. **No persistent visual memory.** A look is burned into session context and evaporates. Text memory in this fleet compounds across months (brains, lessons, ledgers); sight never compounds. Next session knows nothing about what the project has ever looked like.
3. **No grounding.** With a screenshot in hand, nothing maps regions to elements/actions ("click at (742,512)" is a prayer), and nothing annotates what is being looked at.
4. **Documented blind-spot classes for everyone:** a11y trees report off-screen content as visible (microsoft/playwright#39955), snapshots flood model context as they grow (playwright-mcp#1233), SVG renders as text, video is consumed as a flipbook of frames (Anthropic's own description), terminal UIs and native apps sit outside browser tooling.

## Landscape one-breath (researched 2026-10-23)

Playwright MCP ships a11y-snaps by default plus screenshot/vision mode; Chrome DevTools MCP similar plus screencast; browser-use is configurable vision-first; Stagehand hybrid. Visual diffs: Playwright `toHaveScreenshot`, Percy/Applitools/Chromatic with MCP front-ends (license-gated). Stated visual-memory MCP projects exist (AgenticVision) but are not an adopted standard. The gap confirmed by the survey is NOT missing eyes — it is **fragmentation**: pixels, structure, baselines, desktop, video, and cross-session recall are separate unowned capabilities. Sources re-checkable via the 2026-10-23 redteam-style search log in labs/MEM.md entry.

The decisive differentiator against the human-CI tools (Percy/Applitools): they publish to a dashboard for humans to approve. Magpie's reviewer is the NEXT AGENT SESSION and the ledger is git itself — the review UI already exists and is called `git diff`. Determinism inside one pinned environment is the boundary where that model is honest.

## Receipts 2026-10-24 → 25 (gistory, the first-client repo)

Four lived receipts from the days immediately before this PRD was cut to a transfer stone. They are the evidence the gaps are real, and each one also carries a design ruling (next section) the MVP must obey.

1. **The og-image brackets bug.** Shipped social card rendered placeholders as escape-soup; all gates green; found by a human eyeball on a screenshot at phone size. The fix itself shipped blind too — it was verified only by rasterizing the regenerated PNG and LOOKING at it. One look/rasterize/ledger pass was the entire missing gate.
2. **The unrenderable transfer stone.** A horcrux stone carrying the magpie seed was committed with the art intact per its markup — and it had NEVER displayed: a literal `<` inside an XML attribute made the whole file invalid to every strict parser while reading it by hand "worked". Loads and renders are different gates; the `look` equivalent (strict parse + rasterize + byte-size sanity) caught in seconds what commits had carried for days.
3. **The lost staging dir.** Visual artifacts dropped into gitignored staging dirs evaporated at the next sync (`.ui-audit/` alike). Visible evidence must be COMMITTED to compound — the fix for gap 2 is not storage, it is git state.
4. **The loader that guesses.** A stone reader without format negotiation crashed on a valid stone of a different flavor with a raw null deref (vant `horcrux inspect`, main). Handwriting the parse worked fine. Tool surfaces must fail loudly with a NAME for the missing capability, never guess-then-crash.

### Design rulings folded in from those receipts

- **Process-per-look.** "Daemon" means a callable module + thin CLI; every look is one short-lived invocation (spawn pinned browser → capture → annotate → append → exit). No resident process: host sandboxes in this fleet run commands synchronously with hard timeouts and kill stray background jobs; a resident daemon is a portability tax AND a lifecycle bug farm. The only state surviving between looks is `.eyes/` — which is the point.
- **Baseline identity is pinned.** `.eyes/manifest.yml` records the browser image tag and the rasterizer (renderer + version) alongside the route × viewport × theme matrix. Diffs are only meaningful inside one pin; a pin change migrates via explicit adopt-by-re-run, never silently.
- **Raster gate from day one.** Any artifact committed as visual evidence (magpie's own stones and docs art included) must re-rasterize clean in CI: strict parse + render + byte-size sanity. "Loads" and "renders" are separate assertions; only the second is sight.
- **Churn waves.** One library/font/theme change can flip every surface at once. The ledger gains a wave row type: one note explaining N image changes in that commit, so truth-in-ledger does not degenerate into N identical notes.
- **Exact failure names.** Unreadable blob, unknown stone format, missing pinned browser, capture blocked — every refusal carries a specific message and exit code. (Receipt 4: no crash-as-error-path.)
- **One capture, many artifacts.** Overlay, element-id map, and a11y text all derive from the SAME capture pass — never from a second render, so the map can never drift from the pixels it annotates.

## Shape — what magpie is

An **eye daemon + MCP surface**, fleet-install shaped, whose output is committed visual memory:

- `look(url, viewport?, theme?, region?)` → annotated screenshot + a11y overlay (element ids burned into the image AND provided as a map).
- `look-diff(a, b)` → a visual change ledger entry (what changed, where, with both images).
- `walk(url)` → every route × viewport × theme in one pass; proof images, not prose claims. (The ui:audit of this repo, generalized.)
- Blind-spot columns, not exceptions: SVG→raster render, video→keyframes, TUI buffer capture; native/desktop stays out of first ship.

### The core law: smallest artifact that answers the question

Seeing is context-expensive. Therefore QoS-ordered perception, mirroring SyncQos: annotate-and-crop first (one region, one question), full frame second (one route's verdict), page walk last (one release's verdict). The cheap layer deciding when the expensive layer runs is a product invariant, not an optimization — without it agents either starve or flood, both of which read as "agents can't really see."

### The memory law: `.eyes/` is git state

Amendment - 2026-10-27 — host-decided placement. The `.eyes/` notation in this spec reads "the eye home, wherever the host keeps it"; it is not pinned to the tree root. eyestruct itself now defaults the home to `labs/.eyes/` (beside the PRD and the coming crash-harness state - the gistory shape, whose eyes live next to its crashledger), and hosts that prefer the root re-point it with `--manifest`/`--ledger`. Wherever it lives, the law is unchanged: committed, ledgered, CI-gated.

Committed directory, one entry per route × viewport × theme: current image, the diff history that led to it, and the ledger row for each change. Any agent in the chain wakes up OWNING the project's visual history the same way a fresh session owns the brain. Chain shares via the existing vant one-branch-per-agent merge-by-PR flow. A diff that ships without a ledger row explaining it fails the pass — the crashtest rule, aimed at appearance instead of attackability.

### MCP-first, no lock-in

Tools speak MCP so any image-capable model benefits (Claude/Gemini/GPT-4o class). The daemon itself is deterministic tooling (puppeteer/playwright under the hood — magpie is NOT a browser framework, it is a client of one), and images answer to the model, so quality improves with every frontier model release without a magpie change.

## Non-goals (deliberate, anti-drift)

- Not a browser-automation SDK (consume playwright; own nothing in that layer).
- Not a hosted visual-regression SaaS (Percy/Applitools exist; magpie's memory is repo-local, git-native, fleet-shared — its paid-competitor surfaces differ fundamentally).
- Not a vision model, not OCR, not screen-scraping infra.
- Not ambient desktop surveillance; computer-use belongs to the OS vendors.

## Data model (draft — settles in the target repo's brain)

`.eyes/manifest.yml` — routes × views table + column map (svg|video|tui). `.eyes/<route>/<view>/current.png` + `ledger.json` — append-only rows {ts, agent, commit, artifact, note}. Ledger mirrors crashtest's crashledger: committed baseline, CI fails on unexplained drift, adopt-by-re-run.

## CLI surface (draft — every command is one short process)

Binary `eyestruct`. All commands honor `--ledger` and `--manifest` paths (defaults under `.eyes/`), print a named reason-code on every nonzero exit, and take `--json` wherever a machine will read the output.

- `eyestruct look <url> [--viewport WxH] [--theme dark|light] [--region <css-selector>]` — capture + annotate; with `--region`, crop + element-id map (the cheap layer, one region one question).
- `eyestruct diff [--route r] [--view v]` — the look-diff verb as a command: fresh capture vs committed baseline; prints a verdict. Without `--record` the ledger is untouched.
- `eyestruct adopt <route/view | all> --note "..."` — propose a baseline change. Local adopt is a PROPOSAL: canon is CI-cut, so the row ratifies only when the CI lane reproduces it (pinned image).
- `eyestruct ledger list [route] | show <row-id>` — read the memory.
- `eyestruct gate` — the CI job itself: recompute diffs against baselines; exit 1 on any unexplained row, exit 2 on capability trouble (missing pinned browser, missing manifest).
- `eyestruct raster [file...]` — the raster gate: strict parse + render + byte-size sanity (runs on `.eyes/` artifacts and the repo's own shipped SVG stones/docs art).
- `eyestruct walk <base-url>` — every route × viewport × theme in the manifest, one pass, proof images not prose claims.
- `eyestruct mcp` — stdio MCP server wrapping the exact same call surface; the CLI is the contract, the MCP server is a decoding of it.

Exit contract: `0` green or fully explained · `1` drift/refusal with a reason-code · `2` setup/capability error. Never a bare stack trace.

## /packs layout (the packstruct ecosystem)

Gistory's precedent is the model: `packs/public/sync-relay-shapes/` ships a pack (pack.json + index.js, vocabulary injected from moduleCtx, spec-linted by packstruct at an EXACT pin, run by the crashtest plan in crashtest.config.js, baseline in a committed ledger, CI red on a new EXPLOITED or a REFUSED regression). Magpie ships the same shape — three packs, all packstruct-linted (`packstruct lint packs --deep` as the family lane):

1. **`packs/public/eye-shapes/` — self.** The daemon's own adversarial pack, run against `look`/`look-diff`/ledger on every CI: hostile seed inputs, tampered or missing ledger rows, silent pin-stale adoption, oversized crops flooding model context, map/pixel drift (overlay not from the capture pass), un-deterministic renders, screenshots without ledger rows. Same verdict taxonomy as relay work: REFUSED / EXPLOITED / BOUNDED, baseline ledger committed, fail-on-new-EXPLOITED.
2. **`packs/public/eye-ci-gate/` — crashtest spine.** Run BY the crashtest harness, inspecting whatever repo pulls the pack: does its `.eyes/` CI gate actually behave like a crashledger — unexplained drift fails, regressions re-baseline only through the documented adopt path, ledger schema intact? Reusable across every struct-leg repo (gistory can adopt this pack on day one for its own `.eyes/`).
3. **`packs/public/eye-text-leg/` — poststruct integration.** Text is the cheaper diff, so it gates first: packstruct spec/manifest/id-census over `packs/` passes before pixels are compared, ledger notes and manifest fields survive the family prose gates (language/docs), and any text-rendered surface captured in `.eyes/` has its source text linted.

## Magpie as CI (the crashtest/packstruct setup) — yes, and by design

The question "can eyestruct run as CI?" is already answered by the shape: process-per-look means a CI job is just a ledger check plus N short callbacks, no daemon lifecycle to babysit. The gate set, in order:

1. **`eyes:gate`** — recompute look-diff against the committed `.eyes/` baselines inside the pinned image; fail on unexplained drift (the crashledger semantics). Adopt-by-re-run is the ONLY re-baseline path.
2. **`eyes:packs`** — the self-pack campaign through the crashtest harness; red on a new EXPLOITED, red on a REFUSED regression (same rule as gistory's relay campaign, 62 cases, 0 exploited).
3. **`lint:packs`** — `packstruct lint packs --deep` (spec, manifests, id census), the family lane, EXACT pin.
4. **Raster gate** — every committed renderable (stones, docs art, and every current.png's provenance chain) parses strict + rasterizes + byte-size sanity. Receipt-bought rule.

One ruling makes CI trustworthy where local agents are not: **canonical baselines are CI-cut.** A local agent run is a probe — it can flag "differs from baseline" and propose an adopt, but the ledger row that makes a baseline official is written by the CI lane's own reproduction inside the pinned image. That kills the OS/GPU drift class at the root: local pixels may vary, canon cannot.

Sequencing vs MVP: `eyes:gate` IS MVP item 2 (same ledger, now enforced); the pack campaign and packstruct lane land with the gate — close behind, not someday. Gistory can wire `eye-ci-gate` the day magpie's ledger settles, the same way it adopted crashtest's pack.

## MVP cut (first receipts worth having — nothing more)

1. `look` + `look-diff` on one demo surface (gistory is the obvious first client — every UI pass becomes a watched one), process-per-look CLI, pinned-browser manifest from the first write.
2. `.eyes/` write + ledger + committed-baseline update via explicit adopt.
3. MCP tool surface (stdio; no remote surface in MVP — local trust domain, same call functions made in relay design). CLI-first: the CLI is the contract the MCP server calls; either surface works alone.
4. One blind-spot column: SVG→PNG. Defer video/TUI/native columns.
5. The raster gate, dogfooded on magpie's own repo: every committed SVG/ renderable rasterizes clean in CI before merge.

Ship receipt: an agent finishes a UI edit on gistory, magpie annotates the changed region, hands back crop + map, and appends the ledger row — the agent saw, said what changed, and the commit carries the evidence. Then a FRESH session boots and answers "what does the settings page look like" from `.eyes/` without opening a browser once.

Ship gate is two assertions, both first-person:

- A UI edit that breaks pixels but keeps DOM clean gets CAUGHT by magpie (the og-image receipt, reproduced and caught).
- A fresh session answers a visual question from `.eyes/` with no browser open (the memory receipt).

## Environment fit (verified against the current gistory workspace)

- Headless Chromium runs in these sandboxes today via on-demand download (gistory's `ui:browsers` pattern: skip in install, fetch per machine); magpie consumes the same harness style. Viewport/theme capture against the managed preview  or a served static build — both are how the existing audit already works.
- Committed artifacts survive workspace resyncs (models/, horcrux/ stones riding in repo trees, lived repeatedly). Gitignored visual state does NOT — receipt 3. Hence `.eyes/` committed, always.
- Synchronous shells with hard timeouts → process-per-look is not optional there (ruling above).
- CI: the ledger gate is a normal job (diff .eyes/, fail on unexplained rows) — same shape crashtest's ledger gate already runs in gistory CI.

## State of build (2026-10-27)

The transfer stone landed here and grew. Read this as the shipped/remaining ledger against the MVP cut; every "done" row has a receipt in-tree, and the remaining rows are ordered by what unblocks the ship receipts.

### Shipped

- **The repo is named and mounted.** Product `eyestruct` (repo `dhaupin/eyestruct`, docs `docs.creadev.org/eyestruct`, package page cited as live per dhaupin's standing call), agent magpie — the naming split above held, and the flowforge rig is the known-good baseline it rides (rig receipts in labs/TASKS.md, one entry per pass).
- **The CLI surface is past "draft":** it shipped — every verb the "CLI surface (draft)" section names is live, plus `ratify` (the canon cut) and `lint-packs` (the packstruct wrapper, never a download). The exit contract in place: a named reason-code on every nonzero exit — 28 of them in `lib/reasons.js`, mirrored on the docs reasons page, count locked by the battery census, and the crashtest leg verified the sharpenings (empty verb → `UNKNOWN_COMMAND`, joined `--ledger=` → `BAD_FLAG_VALUE`, explicit missing `--ledger` → `LEDGER_MISSING`, exit 2).
- **The engine seam is wired.** `lib/engine.js` drives the PINNED chrome through puppeteer-core — `--browser-exec / EYESTRUCT_BROWSER / manifest pin / ~/.cache/puppeteer cache` discovery in that order, and `MISSING_PINNED_BROWSER` names all four candidates when none is found. One capture pass produces annotations + a11y map from the same pixels (the "one capture, many artifacts" ruling, in code).
- **Two-dispatch canon runs as a workflow.** `.github/workflows/ eyes-ratify.yml` (manual dispatch) reads the pin out of the manifest, reproduces every route in the pinned env, cuts byte-identical canon via append-only ratify rows, and its adopt-on-drift bootstrap promotes pinned-env captures through walk → slots → adopt rows. Local pixels are proposals; CI disposes.
- **The eye polices itself, twice over.** Three self packs under `packs/public/` (`eye-shapes`, `eye-ci-gate`, `eye-text-leg`), 26 committed verdicts in `packs/eye-ledger.json`, packstruct lint + conformance riding `npm run check`; the crashtest leg in `test.yml` fires 52 hostile attacks (argv batches, MCP stdio frames, 6 hostile ledger variants, seed `0xE1E5`) — 52/52 REFUSED, 0 exploited, and a three-contract sharpening ride proves the leg earns its keep.
- **The MCP surface is real.** The stdio server answers JSON-RPC with 10 tools (look, diff, adopt, ratify, ledger_list, ledger_show, gate, raster, walk, spot) and structured errors for unknown methods — the CLI is the contract, the server is its decoding, and hostile frames are among the 52 the crashtest leg already refuses. `spot` made the agents-vision loop native on the MCP leg (2026-10-28).
- **The eye home is a host decision, kept.** `labs/.eyes/` is the default (manifest + committed ledger live there now), `--manifest/--ledger` re-pointing is wired everywhere, and the amendment to the memory law section above reflects what shipped.
- **The docs rig + the web double.** 17 lint-gated docs pages (start, cli, reasons, packs, ci, 7 playbooks, discussions with the release-post system + its first post `announcing-v0.9.0`), and the landing site with `/packs` + `/status` routes whose live numbers fetch the same committed ledgers a fresh session reads.

### Remaining (2026-10-28 refresh — the 2026-10-27 cut is obsolete)

Closed since the last cut, receipts in-tree: the raster gate rides the CI battery (`npm run raster:gate` in `test.yml`); the 0.9.0 bootstrap publish landed (0.9.0 is live on the registry); the churn-wave row type exists (`adopt --wave`, one note → N artifacts, `lib/ledger.js` type `wave` refused-loose like every other row); 10 MCP tools; 34 pack verdicts across 5 packs; the family status dialect + count census + the agents-vision loop (`serve`/`spot` on CLI, MCP, and a dedicated feature page) are all shipped.

Still remaining, ordered by what the product needs next:

1. **The two first-person ship receipts, at scale.** The loop exists and got demonstrated first-person in a browserless VM (the chromium-lane PASS, the spot-capture-with-own-vision receipt). What remains is making them routine on REAL surfaces — the poststruct/monoforge adopting lanes, not just this repo — so the receipts live on other people's commits too, not only ours.
2. **The capture-correctness pack** (the docs/packs.md queued row): a pack whose cases exercise real captures in CI with the pinned browser — lands when the Ci-mode chromium lane becomes a default runner capability rather than an opt-in.
3. **Adapters, layer two.** The contract exists (see Requirements — the adapter contract, shipped this refresh as `eyestruct-adapter@1`); what remains is the first PLATFORM consumer actually riding it (the vant install wiring ci-mode through the import instead of a subprocess, then the flowforge template's own adoption).

The PRD's invariant survives contact with the build so far: every refusal that exists now is named; the only state that survives between looks is `labs/.eyes/`; every claim above has a receipt riding the tree. The two ship receipts are the first ones worth having — everything else served them.

## Goals — the three altitudes (2026-10-28, written where the world reads)

The product serves three consumers of the same committed memory, near to far (README "The three altitudes" is the canonical statement; AGENTS.md carries the story rule):

- **G1 — CI, for devs and enterprise (shipping).** The committed visual memory plus named-code gates run in any pipeline: hermetic install, process-per-look, refusals that name their fix, regression sight at merge time.
- **G2 — adapters, for agent platforms and cloud builders (shipping in layers).** The same verbs exposed where agents already work: the MCP stdio surface is the first adapter, the programmatic surface is the second, and platform adapters (a vant-shaped brain, hosted builder environments) consume the contract without forking or re-parsing.
- **G3 — real-time, inside the chat session (the pinnacle; designed future, NOT shipped).** Eyes that see everything the agent touches, live, through bridges/connectors — the serve→spot instance loop is the seed (a pull model: the agent asks to see); the road is the push model (eyes that see without being asked). Until it ships with receipts, no surface may claim it works today — designed ≠ past tense.

## Requirements — the adapter contract (shipped this refresh)

The adapter altitude's programmatic layer, now in-tree as `lib/index.js`, marker `eyestruct-adapter@1`, mirrored at docs/adapters.md:

- **R-A1 — one contract, decodable three ways.** The CLI verbs, the MCP tool schemas, and the adapter API must decode the same behavior; the adapter surface dispatches the CLI's own verb functions with the CLI's own ctx shape, so adapter calls and CLI calls take one path and drift is impossible by construction. Battery leg: `tests/adapter-api.test.js`.
- **R-A2 — the refusal contract is shared verbatim.** Any refusal arrives as `FailError` carrying the same `eyestruct[CODE]:` text — a consumer never re-derives an exit table. The 28-code census keeps the claims equal.
- **R-A3 — never exits the caller.** `dispatch` returns the exit code; a refusal throws. A hosted builder must not lose its process to our error semantics.
- **R-A4 — one writer of truth per store, at every altitude.** The exposed `manifest`/`ledger` modules ARE the CLI's modules; a platform cannot smuggle a private store copy past the corruption refusals.
- **R-A5 — canon is CI-cut from the adapter side too.** There is no API path that cuts canon; a local adopt through the import is a proposal (`ratified:false`), same as every other surface.
- **R-A6 — the frozen-surface law.** `eyestruct-adapter@1` holds across 1.x: additions are minor bumps with docs/adapters.md mirrored in the same commit; removals/semantic changes ride 2.0.
- **R-A7 — bridges never author schema (the carrier ruling, 2026-10-28).** Adapters and connectors are strictly bridges: they move calls, events, and artifacts between surfaces and never define, author, or evolve schema. Whatever touches schema — row types, manifest fields, refusal codes, the adapter contract itself — is carried by a pack in `packs/public/` under the packstruct@1 grammar FIRST. The adapter surface names its carrier (`SCHEMA_CARRIER`) and the carrier pack (`eye-adapter`) refuses a bridge that outran its pack: the dispatch list, the refusal grammar, the never-exits law, and the proposal-only canon rule are campaign-gated, not import-gated.

## Requirements — the event-driven lane (the pinnacle; designed, not shipped)

What G3 must satisfy before any surface names it shipped:

- **R-R1 — pushes ride the same contract as pulls.** An event (workspace save, route change, deploy hook) arrives at the same capture engine and writes the same candidate artifacts + map; event-driven sight is the loop's trigger model, never a parallel pipeline with different truth semantics.
- **R-R2 — canon stays CI-cut even in real time.** Pushed captures are candidates/proposals by construction; the two-dispatch rule holds at event frequency. A push can never write a ratified row.
- **R-R3 — process budget is bounded.** Process-per-look survives: an event storm may coalesce (N events → one capture round), it may not spawn daemon processes. Resource floors are named, not vibes.
- **R-R4 — bridges/connectors are adapters.** A connector is a G2 consumer plus an event source; it rides `eyestruct-adapter@1` + the MCP surface, never a private protocol fork.
- **R-R5 — receipts before any past-tense claim.** The lane ships when its accepted loop (event → capture → read → act → re-capture) runs first-person with committed receipts; until then every surface says designed, not shipped.

## Requirements — the remaining blind-spot columns (video/TUI; designed)

The PRD's blind-spot ruling (columns, not exceptions) still stands: SVG→raster shipped first; video→keyframes and TUI→buffer capture follow the same contract — one manifest column map, one renderer pin per column, the same candidate→adopt→canon ladder, the same named refusals. A column lands when its determinism receipt can pass the battery in the CI VM, not before.

## Requirements — the capture-surface affordances (designed, not shipped)

Two affordances from the first real consumer's filings (khf-wp, eyestruct#11 + #12) hold requirements rows here so the claim has a home, not a rumor: the tolerance lane (R-C2) has since SHIPPED as the T-T1–T-T8 chain (2026-10-29, below), so only the settle-then-shoot class (T-T9's partner) still reads DESIGNED on the docs surface:

- **R-C1 — full-page capture is an opt-in column extension, never a silent default.** A manifest-level or flag-level full-page mode captures beyond the viewport; the slot receipts the mode it used (the ledger row names it), so a canon that mixed viewport and full-page slots never silently compares apples to oranges.
- **R-C2 — a pixel-tolerance lane widens the COMPARISON, never the canon cut's honesty.** Per-slot or manifest-level tolerance (an abs-diff threshold + a bbox shape/size cap) relaxes what `diff` reports; the canon side stays byte-strict or receipts a tolerance value in the row whichever the design settles. A tolerance gate MUST reopen khf-wp#11's texture receipts first: CDP paint nondeterminism means a tolerance lane shopped without those receipts would guess in production.
- **R-C3 — both land through the counted-change rules.** Each named surface change rides its own minor bump, its pack/carrier case if it touches schema (manifest mode fields would ride eye-adapter or a pack of their own), and mirrors in the same commit.

### The pixel-tolerance lane — the 1.1.0 lane (spec filed 2026-11-01; SHIPPED 2026-10-29 as the T-T8 chain: carrier @97dcb63, lib @be366c9, mirrors same-push)

The request (khf-wp, eyestruct#11, receipted on a texture-heavy WordPress install): Chrome's CDP paint is not byte-stable over photographic textures — re-rolled `ratify` passes on a frozen deterministic site flake 1–6 moving slots per run at one-pixel deltas, and the strict `Buffer.equals` canon cut rejects byte drift that is invisible at the pixel level. The first consumer's CI fell back to the browserless `gate` lane and cut canon by reviewed adopt — honest, but built on re-roll luck. The lane makes the comparison carry a named, bounded tolerance instead of leaving every consumer to ad-hoc-adopt.

The problem shape decides the design: the flake is per-slot, stochastic, and small (one pixel, ±small channel delta) — so the tolerance must be per-slot, quoted in the manifest, bounded in all three dimensions the flake lives in (channel delta, changed-pixel fraction, bbox span), and receipted in every row it touches. A tolerance that names some bounds and not others is a half-honesty, so profiles are all-or-nothing.

- **T-T1 — tolerance is a manifest-declared per-slot mode, never a flag stovepipe.** A route row MAY carry `tolerance:`: `strict` (the default, the shipped behavior — absent means strict) or a profile `channel:<0–255>,pixels:<0–1>,bbox:<px>` naming all three bounds. Slot-level only — a manifest-wide default is explicitly rejected: the run root freezes what it freezes, and the honest claim is per-route (the khf-wp drifters are photo-plate slots, not whole pages). The parser jails the shape: an unknown token, an out-of-range bound, or a profile missing any bound refuses `MANIFEST_CORRUPT` (the existing jail — no new code needed for the manifest side).
- **T-T2 — the comparison math is named once.** A pixel "changed" when any channel's abs delta exceeds `channel`; a slot PASSES tolerance when the changed-pixel fraction ≤ `pixels` AND the changed set's bbox span fits within `bbox` of a captured pixel's frame (a moved-edge drifter the size of the cap is tolerance-correct; a displaced blob is not). `diff` under a tolerant slot reports the same SAME/CHANGED verdict plus the measured numbers; under `strict` nothing changes — today's output is the strict profile's output, stated rather than assumed. Operational rule (receipted in the build round, 2026-10-29): the span khf-wp's receipts measured IS the changed set's bounding box, and the bbox pair is read ORIENTATION-FREE (pairwise-sorted extents against pairwise-sorted cap dims, one sentence in lib/tolerance.js) — a full-width text band fits a `16×1216` cap the way a tall band does, and khf-wp's excluded movers (spans 174×564 and 52%-area) exceed every quoted cap.
- **T-T3 — the canon cut stays byte-strict at the gate; tolerance relieves the capture comparison, not the gate's accounting.** `gate` remains ledger accounting over committed artifacts — it never compares pixels and never grows tolerance knowledge; that is what keeps it browserless and honest. The tolerance relief rides `ratify`/`diff` in the pinned environment: `ratify` under a tolerant slot accepts a re-capture that passes the named profile instead of byte equality, and the row it writes receipts the profile (the ledger row gains optional `tolerance:` fields — the debt-old-copies-readability release rule holds, absent fields read strict). A canon cut under tolerance is a different and clearly named pledge: pixel-eq at bounded span, not byte-eq. The row says so; consumers and auditors can grep the exact pledge class.
- **T-T4 — the counted-change surface is deliberately zero.** No new verb, no new tool, no new reason code, no env var: out-of-profile re-captures report the existing DEFERS shape in `ratify`'s unverified output with the measured numbers in the reason text ("exceeds channel cap"/"exceeds pixel fraction", same `DIFFERS` verdict, same exit 1), and the manifest side reuses `MANIFEST_CORRUPT`. If an implementation round proves a needed refusal cannot say its cause through the existing grammar, the addition rides the carrier-first lane (eye-adapter case first, census + docs/reasons.md mirrored in the same commit) — but the default ruling is the census holds at its current pins (31 codes / 13 verbs / 10 tools — 31 as of the 1.1.0 tree).
- **T-T5 — the carrier cases ride eye-shapes first.** The profile grammar is a manifest row-type shape, so its cases mount in `packs/public/eye-shapes` (the pack that already owns the manifest-corrupt and refusal-shape classes): unknown profile refused, out-of-range bound refused, half-named profile refused, strict-row-passthrough pinned. The `ratify`-row receipt shape rides the same pack's ledger classes; if an implementation round needs a new refusal, its grammar case rides eye-adapter per the `UNKNOWN_FLAG` precedent (T-T4). The lib that implements the lane refuses to land before its carrier cases are in the campaign (the bridge/carrier ruling, verbatim).
- **T-T6 — the battery pins the pure math, never the CDP flake.** The comparator is a pure function over PNG buffers; battery legs run it on synthetic plates (solid-color PNGs with a bounded few-pixel delta) pinning pass/refuse at the exact bound edges, the row receipt shape written under tolerance, and gate's unchanged accounting. The real-texture question — does CDP's one-pixel drifter fit the named profile — is environment-local by nature and stays out of the battery: it is T-T7's gate, not a CI leg.
- **T-T7 — shipping is gated on khf-wp's own receipts, in their run root.** Before the lane ships, the implementing repoint re-runs their manifest + pin against their texture site in the pinned environment and reproduces the drifters; the ship criterion is their ratify lane cutting canon green on the tolerance profile for three consecutive dispatch runs (a stochastic contract — three, not one — named in the shipped docs). A tolerance lane shopped without those receipts would guess in production; that is the requirement R-C2 already carries, and it is the last gate, not a formality.
- **T-T9 — the lane absorbs paint noise, never capture-timing races — the exclusion ruling (khf-wp#1's measured-bounds receipt, 2026-10-29).** The first consumer's prep legs landed the numbers this lane exists to consume: a 7-run roll (132 consecutive pair diffs + canon-vs-run), three paint-noise families with settled per-slot profiles (texture tiles `channel:4,pixels:1e-5,bbox:96×320`; a lone 1px drifter `channel:2,pixels:1e-5,bbox:4×4`; text antialiasing desktop `channel:16,pixels:2e-4,bbox:16×1216` / mobile `channel:16,pixels:2e-4,bbox:168×340`) — and two movers their run root deliberately EXCLUDES from any profile: a `venue-rental/desktop-1440` cover-crop alternation (Δ223, shape-quantized at 15410 px across paints — a background-cover decode/layout race) and a `workshops/mobile-390` whole-page metric-state race (Δ235 over 52% of the slot, both roll neighbors agreeing — a resize-settle race, 1-in-6). The ruling: a channel/pixels/bbox bound large enough to absorb a 52%-area alternate layout would make the gate useless, so tolerance holds ONLY the paint-noise families; the two races belong to a different class — a settle-then-shoot contract (layout/decode readiness asserted before the frame is taken), named DESIGNED here with the two movers as its named proof surfaces and the same consumer-side gate shape as T-T7 (their run root proves it; eyestruct ships nothing absent those receipts). The exclusion doubles as honest camera-work, and #22's correction sharpens it: no tolerance row eats these movers, and NO ADOPT cuts them either — a walk → adopt on a two-state race slot would canonize the race's losing state that a different run reproduces (the khf-wp#22 receipt: four back-to-back fresh diffs on `venue-rental/desktop-1440` read SAME byte-equal against the committed canon, so the canon was never stale and the Δ223 read was the race's alternate state — the race is two-state, its canon coincides with one state, and any jury read that adopts mid-flap canonizes the loser). Race slots need the settle-then-shoot contract, and the settle-then-shoot class is NOT part of the 1.1.0 lane's ship gate.
- **T-T8 — mirrors ride the count-zero ruling.** docs/cli.md (the `ratify`/`diff` bullets gain the profile half-sentence), the AGENTS.md stability-law manifest row (the route-row enumeration gains `tolerance:`), docs/ci.md's designed-not-shipped row (gains the spec pointer here), the eye-shapes pack ledger counts, and the og-image card only if its counted claim moves. The 1.1.0 bump carries the whole lane in one commit chain: carrier cases → parser + comparator + row shape → mirrors → tag.

Open decisions the implementation round owed — ALL RESOLVED with receipts (build round, 2026-10-29): (1) `walk` candidate naming stays unchanged for tolerant slots — no mode suffix; the candidate set is a capture affordance and tolerance is consumed at compare time (the decide-by-first-user receipt is ours); (2) the ledger row gains the FLAT shape: one optional `tolerance` field carrying the manifest profile VERBATIM (the packet jail reads flat rows; absent fields read strict, old copies readable); (3) `spot` gains zero machinery — one half-sentence in the red-gate-triage playbook (landed); (4) the settle-then-shoot class stays DESIGNED alongside (its receipt gate remains T-T9's named consumer-side shape; not folded into the 1.1.0 lane's gate, unchanged by the build round).

## Requirements — the release-trust lane (shipped post-1.0.0, the first cut's receipt)

What the 1.0.0 cut personally proved becomes law: a publish step can go green while the published truth is wrong, so the ladder that minted 1.0.0 grew the missing legs and they carry requirements rows now — this is the altitude-1 (CI) trust surface, and it rides `publish.yml` + `scripts/verify-release.cjs` (mirrored at docs/ci.md's release-ladder section):

- **R-U1 — a cut is publish + release + verify, driven by the tag.** Pushing `v*` starts the whole chain: npm publish (OIDC, the battery riding `prepublishOnly`, 0.x refused, a tag that disagrees with the packaged version refused) → the GH release object minted from the tag (notes extracted from the CHANGELOG's own `[version]` section; an empty extraction refuses the cut) → the verify job. No single job's green is the ship receipt; the tag is the only starter.
- **R-U2 — verify asserts the published truth, not the publish act.** Registry `latest` must equal the caller tree's version; the SERVED tarball's sha512 must equal the registry's own integrity metadata; provenance attestations must be present; then the full pack ladder runs on the served tarball — forbidden-path scan refusing smuggles BY NAME, served set == `npm pack` of the same tree exactly, package identity, the pinned exports keys, a scratch-tree consumer install, the caller's `--probe` assertions, and the installed bin answering `--version`. The `--gh` half: the release object tag-anchored, and the source tar byte-identical to `git archive` of the release commit (zero drift). A `verify-only` dispatch re-proves any cut on demand without minting — the lane tests the lane.
- **R-U3 — the pack ladder is battery-held.** The same script runs over `npm pack` output every push: the positive ladder, the doctored-tar smuggle refused by name, the generic-core proof (a synthetic foreign repo verifies with ZERO script edits), and a caller-stated `--forbidden` prefix catching a smuggle the family defaults miss. Release-day-only truth is decay, not defense.
- **R-U4 — the verifier is one file the whole family copies, zero edits.** Nothing in it names a repo: name, version, bin path, and registry package derive from the caller's tree; every repo rule rides flags (`--exports`, `--probe`, `--forbidden`). Adoption is copy + state-your-rules — an edge that protects the family from eleven divergent hand-rolled verification scripts drifting apart.
- **R-U5 — findings are never allowed to hide in their own testimony.** Any refusal that lists names lists them through JSON-safe serialization (the live catch: a bare `['']` interpolated into `[]` and the finding vanished); a false positive that defeats its visibility is the same defect class as a missed refusal.
- **R-U6 — github-context values reach run scripts through env, never inline interpolation.** The expression-injection class; `ref_name` is attacker-adjacent input however trusted the collaborators.

## Requirements — the hosted-builder adapters (designed, not shipped)

G2's third layer: a hosted builder environment (a cloud CI agent, a platform's sandbox) runs the CLI/adapter inside its own workspace — the instance altitude's edges, without the chat-session push model:

- **R-B1 — a hosted adapter consumes the frozen contracts, never forks them.** It rides `eyestruct-adapter@1` + the MCP surface + the CLI verbs; anything schema-shaping rides a carrier pack first (R-A7, verbatim).
- **R-B2 — the builder's eyes live in the builder's storage, eyestruct-shaped.** The `.eyes/` home is workspace-local git state; a hosted adapter commits candidates, never cuts canon (R-A5 holds at event frequency too).
- **R-B3 — receipts before past tense, always.** The hosted lane's claims stay designed until a first real builder runs the accepted loop with committed receipts; the docs surfaces keep the designed-not-shipped row until then.

- New repo, own brain (identity/goals/lessons/structure), horcrux at v0.
- Branch: the posse pattern — dhaupin creates repo, agent builds on agent branch, merge-by-PR.
- Release system (2026-10-25, dhaupin's decision — the gistory-sync ladder, not the install-from-repo crashtest era): bootstrap with a ONE-TIME manual publish of v0.9.0 from a dev machine behind the full gate (typecheck + lint + build + install-and-load battery), because npm Trusted Publishing cannot create a brand-new package. From then on: GitHub Actions OIDC Trusted Publisher fires on `v*` tags — no stored token, idempotent skip if the registry already has the version, and every tag's tarball is re-installed from the registry into a scratch project and loaded before it attaches to the GitHub release (a tarball that installs but does not load never ships). Version + CHANGELOG ride the same commit. House rule carried over: ledger/manifest schema keeps old copies readable — releases stay in one memory chain across versions.
- Publish gate: none until MVP proves the receipt — then the release system above starts at the 0.9.0 bootstrap.
- Working language: English; every rule in this PRD survives only if it survives contact with the first demo surface.
- Family sequencing (2026-10-25, dhaupin's call): the struct legs share a spine — deterministic artifact + append-only ledger + explicit adopt + CI gate on drift. **poststruct (text leg) ships first, magpie (eyes leg) second**, then the legs review each other's ledgers with the same rules. Order matters because text diffs are cheaper to trust than pixel diffs; magpie inherits whatever poststruct's ledger UX settles.
- Rigging (2026-10-25, dhaupin's call): magpie builds on the **flowforge rig** — the same rigging poststruct 0.9.0 shipped from (flowforge rig extracted over the repo shell per MANIFEST receipts, web/docs shell and checker gates included). Not a fresh scaffolding: the rig's landing shell, docs layout, and gate set are the fleet's known-good baseline, so magpie's first pass starts from receipts instead of a blank repo.
- This PRD rides inside `horcrux/magpie-p_mirror-eyes-2026.svg` as the `labs/prd-eyes.md` block; the stone is UNSEALED (plain base64, stone-delimited v1) and vant/axolotl runs the sealed brn:secret pass when the magpie repo opens. Re-cut rule learned the hard way: stone and disk must stay in parity — patch the decoded payload, re-encode, verify block-for-block, and rasterize the stone before calling it done.
