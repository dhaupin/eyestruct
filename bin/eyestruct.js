#!/usr/bin/env node
// eyestruct CLI dispatch - every command is one short process.
// Exit contract (lib/reasons.js): 0 green/explained, 1 drift/refusal with a
// named reason, 2 setup/capability. No bare stack traces ever.

'use strict'

const { fail, FailError } = require('../lib/reasons')

const COMMANDS = {
  init: require('../lib/init'),
  look: require('../lib/look').runLook,
  diff: require('../lib/look').runDiff,
  adopt: require('../lib/adopt'),
  ledger: require('../lib/ledger-cli'),
  gate: require('../lib/gate'),
  raster: require('../lib/raster'),
  ratify: require('../lib/ratify'),
  walk: require('../lib/walk'),
  // The MCP server owns the process lifetime until stdin closes - it reads
  // the transport stream directly, so it is a starter, not a per-call impl.
  // The MCP server runs until transport EOF; it owns the stream, the bin
  // owns the exit contract on its resolve value.
  mcp: (ctx) => require('../lib/mcp').startServer(ctx.cwd),
}

function usage() {
  return `eyestruct v0.9.0 - eyes for production agents

Commands (each is one short process; the only surviving state is labs/.eyes/):
  init [--browser-image TAG] [--renderer resvg@V]   write labs/.eyes/manifest.yml + empty ledger
  look <url> [--viewport WxH] [--theme T] [--region SEL] [--browser-exec P]
  diff <url> [--against PATH]         fresh capture vs committed baseline (candidity: look then adopt)
  adopt <route/view> --note "..."    propose a baseline change (canon is CI-cut)
  ledger list [ROUTE] | show ID      read the memory
  gate                               CI job: exit 1 on unexplained labs/.eyes/ drift
  raster [file...]                   strict parse + render + byte-size sanity
  walk <base-url>                    every route x viewport x theme, one pass
  ratify <base-url>                  canon cut: re-capture every manifest route in the pinned env; byte-identical slots ride append-only ratify rows
  mcp                                stdio MCP surface (same verbs as tools)

Flags: --ledger PATH --manifest PATH --json
`
}

function posArg(argv) {
  return argv.find((a) => !a.startsWith('--'))
}

async function main() {
  const argv = process.argv.slice(2)
  const cmd = argv[0]
  // An empty-string verb is hostild input, not "no verb": it gets the
  // named refusal like any other bad verb (the crashtest leg's receipt -
  // "eyestruct \"\"" used to print usage and exit 0, improvising). Bare
  // invocation keeps printing help.
  if (cmd === '') {
    fail('UNKNOWN_COMMAND', 'the command name is empty - an empty-string verb is not a command')
  }
  if (!cmd || cmd === '--help' || cmd === '-h') {
    process.stdout.write(usage())
    process.exit(0)
  }
  const impl0 = COMMANDS[cmd]
  if (!impl0) fail('UNKNOWN_COMMAND', `"${cmd}" is not an eyestruct command`)
  const impl = typeof impl0 === 'function' ? impl0 : impl0.run
  const args = argv.slice(1)
  // A flag that is present but EMPTY (`--ledger=`) is a bad flag value,
  // never a "use the default": the falsy-empty fallback would silently
  // point the verb at the tree home instead of the stated one (the
  // crashtest leg's receipt - `--ledger=` used to exit 0 reading nothing).
  for (const flag of ['--manifest', '--ledger']) {
    // Both spellings: the separated form (--ledger PATH) and the joined
    // form (--ledger=PATH) - the crashtest flood used the joined form and
    // the first guard missed it entirely (same batch, same improvisation).
    const joined = args.find((a) => a.startsWith(flag + '='))
    if (joined && joined.slice((flag + '=').length) === '') {
      fail('BAD_FLAG_VALUE', `${flag} carries an empty value - give it a path or drop the flag`)
    }
    const i = args.indexOf(flag)
    if (i !== -1 && (args[i + 1] == null || args[i + 1] === '')) {
      fail('BAD_FLAG_VALUE', `${flag} is present but carries an empty value - give it a path or drop the flag`)
    }
  }
  // The host-owned locations, now one shape: eyestruct keeps its own eyes at
  // labs/.eyes (beside the PRD and the coming crash-harness state - the
  // gistory shape: labs/.eyes next to crashledger.json), because that IS
  // the tool default; hosts that want the root pass --manifest/--ledger or
  // change the two lib defaults. usage() promised
  // these flags; they were parsed nowhere before - the defaults were the
  // only honored path. flags objects are READ here once and travel inside
  // ctx, so every verb resolves the same two files the dispatch named.
  const code = await impl({
    argv: args,
    cwd: process.cwd(),
    json: argv.includes('--json'),
    manifest: flagValue(args, '--manifest'),
    ledger: flagValue(args, '--ledger'),
  })
  process.exit(code === true || code === undefined ? 0 : code)
}

function flagValue(argv, flag) {
  const i = argv.indexOf(flag)
  return i === -1 ? null : argv[i + 1]
}

main().catch((err) => {
  if (err instanceof FailError) {
    // The exit contract, applied at the boundary. A refusal here is the
    // product working as specified, not a crash.
    process.stderr.write(err.message + '\n')
    process.exit(err.exit)
  }
  process.stderr.write(`eyestruct: internal error: ${err && err.message}\n`)
  process.exit(2)
})
