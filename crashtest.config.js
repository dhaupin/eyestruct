// crashtest.config.js - eyestruct's crashtest leg (dogfood).
//
// The attacked surfaces are the CLI's argv contract and the stdio MCP
// transport - driven as subprocesses of the real bin (deterministic,
// in-process adjacency, zero network). labs/scenarios/ is AUTO-SCANNED by
// crashtest run - declaring it in scenarioDirs would load the same modules
// twice (name collision, receipts: the first run refused loudly). The dir
// is committed in-tree, so the optional auto-scan is config enough.
//
// packs: false - eyestruct's own pack campaign is a separate runner
// (scripts/run-packs.cjs) with its own committed ledger
// (packs/eye-ledger.json); stacking it into this run would double-count
// the same rows under a second gate. The crashtest leg answers what the
// packs deliberately do not: hostile parse frames against the stdin/JSON
// transport and argv floods beyond the shape battery.
//
// Run:
//   npx crashtest run            (from the repo root)
module.exports = {
  packs: false,
  seed: 0xE1E5,
}
