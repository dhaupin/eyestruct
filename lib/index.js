// lib/index.js - the ADAPTER API (the programmatic surface the adapters
// altitude rides, the same modules the CLI itself dispatches). A platform
// consumer - an agent brain, a hosted builder, a pipeline runner - imports
// THIS instead of shelling the CI contract; the MCP stdio server stays the
// first adapter (wire-level), this module the second (process-level), and
// both decode the SAME CLI contract.
//
// The rules that hold the surface honest:
//   - Same failures: any refusal arrives as FailError carrying the same
//     `eyestruct[CODE]: explanation` text the shell gets - never a stack
//     trace, never a guessed parse.
//   - Same state rule: nothing here keeps process state; persistence
//     stays git state (labs/.eyes/ + the ledger are the only survive).
//   - Canon is CI-cut from the adapter side too: a local adapt is a
//     proposal (ratified:false); ONLY the pinned CI lane writes official
//     rows. The API cannot cut canon - that is a feature, not a gap.
//   - Frozen surface: eyestruct-adapter@1 holds within 1.x like the CLI
//     verbs and MCP tools - additions are minor bumps mirrored in
//     docs/adapters.md in the same commit; removals/semantic changes
//     ride 2.0. The count census keeps the reason-code claims equal.
//
// One difference from the CLI is deliberate: dispatch RETURNS the exit
// code (never process.exits the caller). 0 = ran; a refusal throws.

'use strict'

const pkg = require('../package.json')
const reasons = require('./reasons')
const manifest = require('./manifest')
const ledger = require('./ledger')
const bundle = require('./bundle')
const engine = require('./engine')
const serveDist = require('./serve-dist')
const gate = require('./gate')
const adopt = require('./adopt')
const ledgerCli = require('./ledger-cli')
const raster = require('./raster')
const lintPacks = require('./lint-packs')

// The adapter contract, frozen at 1 (same additive-only law as the CLI
// verbs + the MCP tools). Never rename; only ADD with a minor bump.
const ADAPTER_CONTRACT = 'eyestruct-adapter@1'

// The verbs an adapter can dispatch (the browserless set - the same verbs
// that run in CI with zero captures). ctx: { cwd, argv, json } - the exact
// shape bin/eyestruct.js dispatches, so adapter calls and CLI calls take
// one path and drift is impossible by construction.
const VERBS = {
  init: require('./init').run,
  gate: gate.run,
  adopt: adopt.run,
  ledger: ledgerCli.run,
  raster: raster.run,
  'lint-packs': lintPacks.run,
}

function dispatch(verb, ctx) {
  const run = VERBS[verb]
  if (!run) {
    reasons.fail(
      'UNKNOWN_COMMAND',
      `not an eyestruct command - ${verb || '(empty)'} is not one of: ${Object.keys(VERBS).join(', ')}`
    )
  }
  return run(ctx)
}

// Multicast build context: the shape { cwd, argv, json } assembled here so
// adapter code never has to hand-quote shell argv manually. opts pairs
// { cwd, args: ['--note', 'why'], json: true }.
function ctxOf(cwd, args, json) {
  return { cwd: cwd || process.cwd(), argv: (args || []).slice(), json: !!json }
}

module.exports = {
  ADAPTER_CONTRACT,
  version: pkg.version,
  // The named-refusal contract, shared verbatim: adapters catch FailError,
  // read .code, and print .message - never re-derive an exit code table.
  FailError: reasons.FailError,
  reasonCodes: Object.keys(reasons.CODES),
  // The stores and the pure pieces, the same modules the verbs use - a
  // consumer wiring CI or status reads/writes through these, never a
  // private copy (one writer of truth per store holds at every altitude).
  manifest,
  ledger,
  bundle,
  engine,
  serveDist,
  // The browserless verbs, dispatched under the CLI's own semantics.
  verbs: VERBS,
  dispatch,
  ctxOf,
}
