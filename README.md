# eyestruct

Eyes for production agents. Deterministic capture (`look`), pixel-level
change comparison (`diff`), and a committed visual memory (`labs/.eyes/`) that
CI can gate - the crashtest ledger pattern aimed at appearance instead of
attackability.

Process-per-look: every command is one short invocation; the only state
that survives between looks is git state.

```text
eyestruct init                                       # labs/.eyes/manifest.yml + empty ledger
eyestruct look <url> [--region SEL]                  # one crop + element-id map, candidate artifact
eyestruct diff <url> [--against PATH]                # fresh capture vs committed baseline
eyestruct adopt <path...> [--wave] --note "why"      # proposal (canon is CI-cut)
eyestruct gate                                       # CI: exit 1 on unexplained labs/.eyes/ drift
eyestruct mcp                                        # stdio MCP surface, same calls as tools
```

## The spine

| Layer | What it is |
|---|---|
| `labs/.eyes/manifest.yml` | pin (browser image + renderer) + route x viewport x theme matrix |
| `labs/.eyes/<route-slug>/<view>/current.png` | committed baseline (canon is CI-cut) |
| `labs/.eyes/ledger.json` | append-only rows (adopt proposals + ratify canon + wave rows); unexplained drift fails the pass |
| `eyestruct gate` | the CI job: read-only crashledger semantics over `labs/.eyes/` |
| packs | 3 adversarial packs under `packs/public/` + the committed verdict ledger |

Full product definition: [labs/prd-eyes.md](labs/prd-eyes.md). If you are an
agent, start at [AGENTS.md](AGENTS.md) - the working policies and the map of
where things live. The deep surfaces live in the docs
([getting started](https://docs.creadev.org/eyestruct/start),
[CLI](https://docs.creadev.org/eyestruct/cli),
[MCP](https://docs.creadev.org/eyestruct/mcp),
[packs](https://docs.creadev.org/eyestruct/packs),
[CI guide](https://docs.creadev.org/eyestruct/ci)), and the deploy rig is
`.github/workflows/` (battery `test.yml`, docs lane `docs.yml`, canon lane
`eyes-ratify.yml`).

Status: **0.9.0, capture wired and exercised.** The full verb line is live
(look/diff/adopt/ledger/gate/raster/walk/ratify/mcp/lint-packs); both
PRD ship receipts ran first-person - a pixels-broken/DOM-clean edit gets
caught by `diff` (DIFFERS, named), and a fresh session reads what a
surface looks like from `labs/.eyes/` with no browser - see
`labs/.eyes-receipt/` and `labs/TASKS.md`. Canon stays CI-cut: committed
proposals ride `ratified:false` until the pinned-image lane reproduces
them.

## Surfaces

- **The landing** -> [eyestruct.creadev.org](https://eyestruct.creadev.org)
- **The docs** -> [docs.creadev.org/eyestruct](https://docs.creadev.org/eyestruct)
- **The npm package** -> [npmjs.com/package/eyestruct](https://www.npmjs.com/package/eyestruct)
- **The workshop** -> [Creadev.org](https://creadev.org) (eyestruct is made by
dhaupin @ Creadev.org - the same home as the landing and docs surfaces above)
