# PRD: eyestruct (eyes for production agents)

**Status:** v0.2 - current (2026-10-29) · Owner: rook · Sponsor: dhaupin
**Role:** arm - the watch arm. It owns deterministic capture, pixel-level change comparison, and the committed visual memory.
**Package:** `eyestruct` @ 1.1.0 (node >=18). npm latest is 1.0.0; 1.1.0 is committed and pending push.
**Core law:** every refusal is named, and the only state that survives between looks is git state.
**Family:** the five arms are **govstruct** (govern), **packstruct** (spec),
**crashtest** (attack), **eyestruct** (watch), **poststruct** (audit). eyestruct
owns the watch arm: it sees what the others cannot - the shipped pixels.
The forges are **monoforge** (the repo stamp) and **coreforge** (the site rig);
**railyard** is the composer that holds them. The interop law: no host imports a
sibling to check a sibling; it invokes the sibling's public CLI.

---

## 1. One-line pitch

Eyes for production agents. Deterministic capture (`look`), pixel-level change
comparison (`diff`), and a committed visual memory (`labs/.eyes/`) that CI can
gate - the crashtest ledger pattern aimed at appearance instead of attackability.
Process-per-look: every command is one short invocation; the only state that
survives between looks is git state.

## 2. Naming

The product is **eyestruct** (repo `dhaupin/eyestruct`, package `eyestruct`,
docs `docs.creadev.org/eyestruct`). **magpie is the agent's name**, not the
product's - the same split as rook being the keeper while products carry struct
names. (The whole struct-family lane was free on npm at probe; `birdeye`,
`wrasse`, and `magpie` were squatted, and `birdeye` collides with a
screenshot-taking assistant.)

## 3. Problem - the four real gaps

Vision capability is not the bottleneck: reading PNG/JPEG pixels is solved in
every frontier model. What is broken for a working agent:

1. **Eyes are not ambient.** An agent sees only when handed an image or when it
   deliberately runs a headless browser. The default state is blind;
   verification drifts to DOM-metric collectors, which prove structure, not
   appearance. The founding receipt: 2026-10-25, gistory's social card
   (og-image) shipped days of visible escape-soup fragments - found by a human
   glancing at a screenshot, not by any gate. Every DOM and computed gate was
   green while the pixels were visibly wrong.
2. **No persistent visual memory.** A look is burned into session context and
   evaporates. Text memory in this fleet compounds across months (brains,
   lessons, ledgers); sight never compounds.
3. **No grounding.** With a screenshot in hand, nothing maps regions to
   elements and actions, and nothing annotates what is being looked at.
4. **Documented blind-spot classes for everyone:** a11y trees report off-screen
   content as visible; snapshots flood model context as they grow; SVG renders
   as text; video is consumed as a flipbook of frames; terminal UIs and native
   apps sit outside browser tooling.

## 4. The landscape (researched 2026-10-23)

Playwright MCP ships a11y snaps plus screenshot/vision mode; Chrome DevTools MCP
similar plus screencast; browser-use is configurable vision-first; Stagehand
hybrid. Visual diffs: Playwright `toHaveScreenshot`, Percy/Applitools/Chromatic
with MCP front-ends (license-gated). Stated visual-memory MCP projects exist but
are not an adopted standard. The gap confirmed by the survey is not missing eyes
- it is **fragmentation**: pixels, structure, baselines, desktop, video, and
cross-session recall are separate unowned capabilities.

The decisive differentiator against the human-CI tools (Percy/Applitools): they
publish to a dashboard for humans to approve. **eyestruct's reviewer is the next
agent session, and the ledger is git itself** - the review UI already exists and
is called `git diff`. Determinism inside one pinned environment is the boundary
where that model is honest.

## 5. Shape - what eyestruct is

### 5.1 The core law: the smallest artifact that answers the question

One crop, one question. `look` produces the smallest artifact that answers "what
does this look like," and `spot` produces one capture for an agent to read with
its own vision. Nothing is captured that no one asked about.

### 5.2 The memory law: `.eyes/` is git state

`labs/.eyes/` holds the manifest plus a committed ledger. A look writes a
candidate artifact; a `diff` compares against the committed baseline; an `adopt`
proposes a baseline change; and canon is cut by CI, never locally. The only
state that survives between looks is git state.

### 5.3 Canon is CI-cut

**Canonical baselines are CI-cut.** A local agent run is a probe - it can flag
"differs from baseline" and propose an adopt, but the ledger row that makes a
baseline official is written by the CI lane's own reproduction inside the pinned
image. That kills the OS/GPU drift class at the root: local pixels may vary,
canon cannot.

### 5.4 MCP-first, no lock-in

The CLI is the contract; the MCP stdio server is a decoding of it. Every verb
is available on both surfaces with identical semantics, and the adapter API is
a third decoding of the same behavior.

## 6. The CLI surface

Binary `eyestruct`. Every command is one short process, honors `--ledger` and
`--manifest` paths (defaults under `.eyes/`), prints a named reason-code on
every nonzero exit, and takes `--json` wherever a machine reads the output.

```
eyestruct init                                       # labs/.eyes/manifest.yml + empty ledger
eyestruct look <url> [--region SEL]                  # one crop + element-id map, candidate artifact
eyestruct diff <url> [--against PATH]                # fresh capture vs committed baseline
eyestruct adopt <slot>/current.png [--wave] --note "why"  # proposal (canon is CI-cut)
eyestruct ratify                                     # the canon cut (CI lane)
eyestruct gate                                       # CI: exit 1 on unexplained labs/.eyes/ drift
eyestruct serve <dir> [--port N]                     # serve a baked tree, host-shaped headers
eyestruct spot <url> [--viewport WxH] [--theme T]    # one capture to READ WITH YOUR OWN VISION
eyestruct raster [file...]                           # the raster gate: strict parse + render + byte-size sanity
eyestruct walk <base-url>                            # every route x viewport x theme, one pass
eyestruct lint-packs                                 # the packstruct wrapper (never a download)
eyestruct mcp                                        # stdio MCP surface, same calls as tools
```

Exit contract: `0` green or fully explained, `1` drift/refusal with a
reason-code, `2` setup/capability error. Never a bare stack trace. 28 reason
codes live in `lib/reasons.js`, mirrored on the docs reasons page and locked by
the battery census.

## 7. Packs (the packstruct contract)

eyestruct is a `check`-profile host of the shared packstruct SPEC v1. Three self
packs ship under `packs/public/`:

1. **`eye-shapes` - self.** The daemon's own adversarial pack, run against
   `look`/`diff`/ledger on every CI: hostile seed inputs, tampered or missing
   ledger rows, silent pin-stale adoption, oversized crops, map/pixel drift,
   un-deterministic renders, screenshots without ledger rows. Same verdict
   taxonomy as the family: REFUSED / EXPLOITED / BOUNDED.
2. **`eye-ci-gate` - the crashtest spine.** Run BY the crashtest harness,
   inspecting whatever repo pulls the pack: does its `.eyes/` CI gate behave
   like a crashledger? Reusable across every struct-leg repo.
3. **`eye-text-leg` - the poststruct integration.** Text is the cheaper diff, so
   it gates first: packstruct spec and id-census over `packs/` pass before pixels
   are compared, and any text-rendered surface captured in `.eyes/` has its
   source text linted.

The carrier ruling (R-A7): bridges never author schema. Whatever touches schema
- row types, manifest fields, refusal codes, the adapter contract itself - is
carried by a pack in `packs/public/` under the packstruct@1 grammar first.

## 8. eyestruct as CI

The question "can eyestruct run as CI?" is already answered by the shape:
process-per-look means a CI job is just a ledger check plus N short callbacks,
no daemon lifecycle to babysit. The gate set, in order:

1. **`eyes:gate`** - recompute diffs against the committed `.eyes/` baselines
   inside the pinned image; fail on unexplained drift. Adopt-by-re-run is the
   only re-baseline path.
2. **`eyes:packs`** - the self-pack campaign through the crashtest harness; red
   on a new EXPLOITED, red on a REFUSED regression.
3. **`lint:packs`** - `packstruct lint packs --deep`, the family lane, exact pin.
4. **Raster gate** - every committed renderable parses strict plus rasterizes
   plus byte-size sanity.

## 9. The adapter contract (`eyestruct-adapter@1`, shipped)

The adapter altitude's programmatic layer, in-tree as `lib/index.js`, mirrored
at `docs/adapters.md`:

- **R-A1 - one contract, decodable three ways.** The CLI verbs, the MCP tool
  schemas, and the adapter API decode the same behavior; the adapter dispatches
  the CLI's own verb functions with the CLI's own ctx shape.
- **R-A2 - the refusal contract is shared verbatim.** Any refusal arrives as
  `FailError` carrying the same `eyestruct[CODE]:` text.
- **R-A3 - never exits the caller.** `dispatch` returns the exit code; a refusal
  throws.
- **R-A4 - one writer of truth per store, at every altitude.** The exposed
  `manifest`/`ledger` modules ARE the CLI's modules.
- **R-A5 - canon is CI-cut from the adapter side too.** No API path cuts canon;
  a local adopt is a proposal (`ratified:false`).
- **R-A6 - the frozen-surface law.** `eyestruct-adapter@1` holds across 1.x:
  additions are minor bumps with docs mirrored in the same commit.
- **R-A7 - bridges never author schema.** Adapters and connectors are strictly
  bridges; schema-shaping rides a carrier pack first.

## 10. The release-trust lane (shipped post-1.0.0)

What the 1.0.0 cut proved becomes law: a publish step can go green while the
published truth is wrong. The ladder that minted 1.0.0 grew the missing legs:

- **R-U1 - a cut is publish plus release plus verify, driven by the tag.**
  Pushing `v*` starts the whole chain: npm publish (OIDC, 0.x refused) then the
  GH release object minted from the tag then the verify job.
- **R-U2 - verify asserts the published truth, not the publish act.** Registry
  `latest` must equal the caller tree's version; the served tarball's sha512
  must equal the registry's integrity metadata; provenance attestations must be
  present; then the full pack ladder runs on the served tarball.
- **R-U3 - the pack ladder is battery-held.** The same script runs over
  `npm pack` output every push: the positive ladder, the doctored-tar smuggle
  refused by name, the generic-core proof.
- **R-U4 - the verifier is one file the whole family copies, zero edits.**
  Nothing in it names a repo.
- **R-U5 - findings never hide in their own testimony.** Any refusal that lists
  names lists them through JSON-safe serialization.
- **R-U6 - github-context values reach run scripts through env, never inline
  interpolation.**

## 11. The pixel-tolerance lane (shipped 2026-10-29 as the T-T8 chain)

The request (khf-wp, eyestruct#11, receipted on a texture-heavy WordPress
install): Chrome's CDP paint is not byte-stable over photographic textures, so
the strict `Buffer.equals` canon cut rejects byte drift invisible at the pixel
level. The lane makes the comparison carry a named, bounded tolerance.

- **T-T1 - tolerance is a manifest-declared per-slot mode.** A route row MAY
  carry `tolerance:`: `strict` (default) or `channel:<0-255>,pixels:<0-1>,bbox:<px>`
  naming all three bounds. The parser jails the shape; an unknown token, an
  out-of-range bound, or a half-named profile refuses `MANIFEST_CORRUPT`.
- **T-T2 - the comparison math is named once.** A pixel is changed when any
  channel's abs delta exceeds `channel`; a slot passes when the changed-pixel
  fraction fits `pixels` AND the changed set's bbox span fits `bbox` (read
  orientation-free).
- **T-T3 - the canon cut stays byte-strict at the gate.** Tolerance relieves the
  capture comparison, not the gate's accounting. A canon cut under tolerance is
  a differently-named pledge: pixel-eq at bounded span, not byte-eq.
- **T-T4 - the counted-change surface is deliberately zero.** No new verb, tool,
  reason code, or env var.
- **T-T5 - the carrier cases ride eye-shapes first.** The lib refuses to land
  before its carrier cases are in the campaign.

## 12. Goals - the three altitudes

The product serves three consumers of the same committed memory, near to far:

- **G1 - CI, for devs and enterprise (shipping).** The committed visual memory
  plus named-code gates run in any pipeline.
- **G2 - adapters, for agent platforms and cloud builders (shipping in layers).**
  The MCP stdio surface is the first adapter, the programmatic surface the
  second, and platform adapters consume the contract without forking.
- **G3 - real-time, inside the chat session (the pinnacle; designed, not
  shipped).** Eyes that see everything the agent touches, live. The serve to
  spot instance loop is the seed (a pull model); the road is the push model.
  Until it ships with receipts, no surface may claim it works today.

## 13. State of build (2026-10-29)

**Shipped:** the repo is named and mounted; the CLI surface is live (every verb
above plus `ratify` and `lint-packs`); the engine seam is wired (pinned chrome
through puppeteer-core, one capture pass produces annotations plus an a11y map);
two-dispatch canon runs as a workflow; three self packs with 34 committed
verdicts, the crashtest leg firing 52 hostile attacks (52/52 REFUSED, 0
exploited); the MCP surface answers JSON-RPC with 10 tools; `labs/.eyes/` is the
default home; the docs rig plus web double; the raster gate in CI; the 1.0.0
bootstrap publish live; the adapter contract; the pixel-tolerance lane.

**Remaining, ordered:**

1. **The two first-person ship receipts, at scale.** The loop exists and got
   demonstrated; what remains is making it routine on real surfaces (the
   poststruct and monoforge adopting lanes).
2. **The capture-correctness pack.** Lands when the chromium lane becomes a
   default runner capability rather than an opt-in.
3. **Adapters, layer two.** The contract exists; the first platform consumer
   riding it is what remains.

## 14. Non-goals

- **No dashboard, no human approval queue.** The reviewer is the next agent
  session; the ledger is git.
- **No daemon.** Process-per-look is the shape; there is no lifecycle to
  babysit.
- **No local canon cuts.** Canon is CI-cut, always.
- **No video/TUI capture yet.** The blind-spot columns (video to keyframes,
  TUI to buffer) follow the same contract and land when their determinism
  receipt passes the battery, not before.
- **No real-time claims until receipts.** G3 stays designed until the accepted
  loop runs first-person with committed receipts.
