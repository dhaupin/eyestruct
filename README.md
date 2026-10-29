# eyestruct

Eyes for production agents. Deterministic capture (`look`), pixel-level change comparison (`diff`), and a committed visual memory (`labs/.eyes/`) that CI can gate - the crashtest ledger pattern aimed at appearance instead of attackability.

Process-per-look: every command is one short invocation; the only state that survives between looks is git state.

```text
eyestruct init                                       # labs/.eyes/manifest.yml + empty ledger
eyestruct look <url> [--region SEL]                  # one crop + element-id map, candidate artifact
eyestruct diff <url> [--against PATH]                # fresh capture vs committed baseline
eyestruct adopt <slot>/current.png [--wave] --note "why"  # proposal (canon is CI-cut); rows name captures, never slots
eyestruct gate                                       # CI: exit 1 on unexplained labs/.eyes/ drift
eyestruct serve <dir> [--port N]                     # the instance primitive: serve a baked tree, host-shaped headers
eyestruct spot <url> [--viewport WxH] [--theme T]    # one capture to READ WITH YOUR OWN VISION (agent eyes)
eyestruct mcp                                        # stdio MCP surface, same calls as tools
```

## Install

```sh
npm i -g eyestruct            # the CLI on your PATH
# or in a repo whose battery calls the bin directly:
npm i -D eyestruct@^1.0.0
```

The capture verbs (`look`, `diff`, `walk`, `ratify`) need a pinned chrome (`--browser-exec`, `EYESTRUCT_BROWSER`, the manifest pin, or the puppeteer cache this machine already fetched); the browserless lanes (`init`, `ledger`, `gate`, `adopt`, `raster`) never do. Runners that cannot fetch chrome on demand carry it instead: a checksummed tarball rides `init --browser-bundle TARBALL` (the executor resolution verifies its sha256 receipt at every use) and the captures run offline - the recipe lives in [docs/ci.md](docs/ci.md). `init` is idempotent: re-running it with only the bundle flag preserves the pin + route matrix.

## The spine

| Layer | What it is |
|---|---|
| `labs/.eyes/manifest.yml` | pin (browser image + renderer) + route x viewport x theme matrix |
| `labs/.eyes/<route-slug>/<view>/current.png` | committed baseline (canon is CI-cut) |
| `labs/.eyes/ledger.json` | append-only rows (adopt proposals + ratify canon + wave rows); unexplained drift fails the pass |
| `eyestruct gate` | the CI job: read-only crashledger semantics over `labs/.eyes/` |
| packs | 5 adversarial packs under `packs/public/` + the committed verdict ledger (`eye-adapter` is the adapter surface's schema carrier) |

## Two lanes, one eye

- **The CI lane (canon).** Baselines are CI-cut: a local `adopt` is an unratified proposal, and the pinned-image lane (`eyes-ratify.yml`) is the only writer of official rows. This is the regression-catching lane - [the CI guide](docs/ci.md).
- **The instance lane (sight).** A coding agent can watch its own work while it builds: `eyestruct serve` eats the baked tree, `eyestruct spot` hands back one PNG + element map, the agent reads the pixels with its own vision, fixes what it saw, and re-spots. Candidate-only - the canon stays CI-cut even here. The mechanical recipe lives in the [agents-vision playbook](https://docs.creadev.org/eyestruct/playbooks/agents-vision/), with the feature tour at `eyestruct.creadev.org/agents`.

## The three altitudes

The same committed memory serves three consumers, near to far:

1. **CI, for devs and enterprise** (shipping). The committed visual memory plus named-code gates run in any pipeline: hermetic install, no daemons, refusals that name their fix. Regression sight at merge time.
2. **Adapters, for agent platforms and cloud builders** (shipping in layers). The same verbs exposed where agents already work: the MCP stdio surface is the first adapter, the adapter API (`lib/index.js`, `eyestruct-adapter@1`, schema-carried by the `eye-adapter` pack) is the second, and platform adapters (a Vant-shaped brain, hosted builder environments) consume the contract - no forking, no re-parsing. Bridges never author schema: anything schema-touching lands as a pack carrier first.
3. **Real-time, inside the chat session (the pinnacle)** (designed future, not shipped). Seeing everything the agent works on, live, through bridges/connectors - the serve-spot instance loop today, event-driven eyes tomorrow.

The design rulings for all three live in [labs/prd-eyes.md](labs/prd-eyes.md) - receipts rule every claim, including the ones not built yet.

Full product definition: [labs/prd-eyes.md](labs/prd-eyes.md). If you are an agent, start at [AGENTS.md](AGENTS.md) - the working policies and the map of where things live. The deep surfaces live in the docs ([getting started](https://docs.creadev.org/eyestruct/start), [CLI](https://docs.creadev.org/eyestruct/cli), [MCP](https://docs.creadev.org/eyestruct/mcp), [adapter API](https://docs.creadev.org/eyestruct/adapters), [reason codes](https://docs.creadev.org/eyestruct/reasons), [packs](https://docs.creadev.org/eyestruct/packs), [CI guide](https://docs.creadev.org/eyestruct/ci), [family status](https://docs.creadev.org/eyestruct/status), [agents-vision playbook](https://docs.creadev.org/eyestruct/playbooks/agents-vision/)), and the deploy rig is `.github/workflows/` (battery `test.yml`, the tag-driven release lane `publish.yml` - publish, release, verify, docs lane `docs.yml`, canon lane `eyes-ratify.yml`).

Status: **1.1.0, capture wired and exercised, interfaces frozen.** The full verb line is live (init/look/diff/adopt/ledger/gate/raster/walk/ratify/serve/spot/mcp/lint-packs); both PRD ship receipts ran first-person - a pixels-broken/DOM-clean edit gets caught by `diff` (DIFFERS, named), and a fresh session reads what a surface looks like from `labs/.eyes/` with no browser - see `labs/.eyes-receipt/` and `labs/TASKS.md`. Canon stays CI-cut: committed proposals ride `ratified:false` until the pinned-image lane reproduces them.

## Surfaces

- **The landing** -> [eyestruct.creadev.org](https://eyestruct.creadev.org)
- **The docs** -> [docs.creadev.org/eyestruct](https://docs.creadev.org/eyestruct)
- **The npm package** -> [npmjs.com/package/eyestruct](https://www.npmjs.com/package/eyestruct)
- **The workshop** -> [Creadev.org](https://creadev.org) (eyestruct is made by dhaupin @ Creadev.org - the same home as the landing and docs surfaces above)
