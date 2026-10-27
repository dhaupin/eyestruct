// eyestruct ledger list|show - read the memory (browserless, pure).

'use strict'

const fs = require('node:fs')
const ledgerMod = require('./ledger')
const { fail } = require('./reasons')

function run(ctx) {
  const sub = posArg(ctx.argv) || 'list'
  const file = ledgerMod.ledgerPath(ctx.cwd, ctx)
  // An explicit --ledger path STATES where the memory is; a missing file
  // is a stated resource that is not there - improvised-empty is the one
  // reading this reader must not do (the crashtest leg's receipt:
  // `ledger list --ledger /no/such/root-lab.json` answered [] with exit 0).
  // The DEFAULT home stays tolerant: a fresh tree legitimately has no
  // ledger yet, and gate catches that case through the UNRECORDED rules.
  if (ctx.ledger && !fs.existsSync(file)) {
    fail('LEDGER_MISSING', String(ctx.ledger))
  }
  const rows = ledgerMod.load(file)
  if (sub === 'list') {
    const route = posArg(ctx.argv.slice(1))
    const matchesRoute = (r) =>
      (r.artifact || '').startsWith(route) || (Array.isArray(r.artifacts) ? r.artifacts.some((a) => a.startsWith(route)) : false)
    const shown = route ? rows.filter(matchesRoute) : rows
    if (ctx.json) process.stdout.write(JSON.stringify(shown, null, 2) + '\n')
    else {
      if (!shown.length) process.stdout.write('(empty ledger)\n')
      for (const r of shown) {
        // Wave rows carry an artifacts array instead of a single artifact;
        // naming N slots folded with ' + ' beats printing 'undefined' (the
        // list must describe the row's real shape, not a missing field).
        const artifact = r.artifact || (Array.isArray(r.artifacts) ? r.artifacts.join(' + ') : '')
        process.stdout.write(`${r.id}  ${r.type}${r.ratified === false ? ' (unratified)' : ''}  ${artifact}${r.note ? '  # ' + String(r.note).slice(0, 60) : ''}\n`)
      }
    }
    return 0
  }
  if (sub === 'show') {
    const id = posArg(ctx.argv.slice(1))
    const row = rows.find((r) => r.id === id)
    if (!row) fail('DANGLING_ROW', `no ledger row ${id}`)
    if (ctx.json) process.stdout.write(JSON.stringify(row, null, 2) + '\n')
    else process.stdout.write(JSON.stringify(row, null, 2) + '\n')
    return 0
  }
  fail('UNKNOWN_COMMAND', `ledger subcommand "${sub}" (list|show)`)
}

// The flag-value guard adopt.js carries: a token AFTER a --flag is that
// flag's value (e.g. `--ledger labs/.eyes/ledger.json`), never a position
// argument. Without it, `ledger list --ledger <path>` read the path as a
// route filter and showed an empty ledger.
function posArg(argv) {
  return argv.find((a) => !a.startsWith('--') && !isFlagValue(argv, a))
}

function isFlagValue(argv, a) {
  const i = argv.indexOf(a)
  return i > 0 && argv[i - 1].startsWith('--') && !argv[i - 1].includes('=')
}

module.exports = { run }
