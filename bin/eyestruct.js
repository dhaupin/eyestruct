#!/usr/bin/env node
// eyestruct CLI dispatch - every command is one short process.
// Exit contract (lib/reasons.js): 0 green/explained, 1 drift/refusal with a
// named reason, 2 setup/capability. No bare stack traces ever.

'use strict'

const { flagValue } = require('../lib/flags')
const { fail, FailError } = require('../lib/reasons')
const { version } = require('../package.json')

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
  // The instance primitive: serve a baked tree with host-shaped _headers
  // (the ONE implementation, shared with the battery leg + chromium lane).
  // A starter like mcp - the process lives until the operator stops it.
  serve: require('../lib/serve'),
  // The agent-eyes verb: one capture saved to read with your own vision -
  // the serve -> spot -> read -> act -> re-spot loop.
  spot: require('../lib/look').runSpot,
  // The packstruct passthrough: the pack lint lane as a discoverable verb
  // (mirrors crashtest's lint-packs, issue #32) - the repo's own install,
  // never downloaded, pass-through exit codes, loud refusal when absent.
  'lint-packs': require('../lib/lint-packs'),
  // The MCP server owns the process lifetime until stdin closes - it reads
  // the transport stream directly, so it is a starter, not a per-call impl.
  // The MCP server runs until transport EOF; it owns the stream, the bin
  // owns the exit contract on its resolve value.
  mcp: (ctx) => require('../lib/mcp').startServer(ctx.cwd),
}

function usage() {
  // Version truth lives in package.json - a hardcoded string here would
  // drift on the next bump (same trap the manifest pin already killed).
  return `eyestruct v${version} - eyes for production agents

Commands (each is one short process; the only surviving state is labs/.eyes/):
  init [--browser-image TAG] [--renderer resvg@V] [--browser-bundle TARBALL]  seed labs/.eyes/ + the checksummed browser bundle lane
  look <url> [--viewport WxH] [--theme T] [--region SEL] [--browser-exec P] [--no-overlay] [--full-page] [--format png|webp] [--quality N]
  diff <url> [--against PATH]         fresh capture vs committed baseline (candidity: look then adopt)
  adopt <slot>/current.png --note "..."  propose a baseline change (canon is CI-cut; the row must name the capture, not the slot)
  adopt <capture...> --wave --note "and" one wave row over N changed captures (one note explains N image changes)
  ledger list [ROUTE] | show ID      read the memory
  gate                               CI job: exit 1 on unexplained labs/.eyes/ drift
  lint-packs [--deep] [--json] [--against <lib>] [dir]  packstruct passthrough over the repo's own install
  raster [file...]                   strict parse + render + byte-size sanity
  walk <base-url>                    every route x viewport x theme, one pass
  serve [dir] [--port N] [--headers FILE]  serve a baked tree with host-shaped _headers (the instance primitive)
  spot <url> [--viewport WxH] [--theme T] [--region SEL] [--browser-exec P] [--no-overlay] [--full-page] [--format png|webp] [--quality N]  one capture saved to read with your own vision (labs/.eyes-candidates/spot-*.png)
  ratify <base-url>                  canon cut: re-capture every manifest route in the pinned env; byte-identical slots ride append-only ratify rows
  mcp                                stdio MCP surface (same verbs as tools)

Flags: --ledger PATH --manifest PATH --json --version
`
}

// C1 carry (issue #3, from the retired gistory mount): global flags may
// ride in FRONT of the verb too (`eyestruct --manifest X gate` dispatches
// like `eyestruct gate --manifest X`). The leading window matches EXACTLY
// the flags the dispatch owns - --ledger PATH, --manifest PATH, the
// boolean --json, and --version (package.json is THE version truth, the
// manifest-pin lesson), separated form only - anything else leading still
// refuses UNKNOWN_COMMAND, so a typo can never silently reorder into a
// verb's positional.
const GLOBAL_VALUE_FLAGS = ['--ledger', '--manifest']
const GLOBAL_BOOL_FLAGS = ['--json', '--version']

function pullGlobalPrefix(argv) {
  const flags = []
  let i = 0
  while (i < argv.length && argv[i].startsWith('--')) {
    const t = argv[i]
    if (GLOBAL_VALUE_FLAGS.includes(t)) {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
        fail('UNKNOWN_COMMAND', `"${t}" expects a value before the verb`)
      }
      flags.push(t, argv[i + 1])
      i += 2
      continue
    }
    if (GLOBAL_BOOL_FLAGS.includes(t)) {
      flags.push(t)
      i += 1
      continue
    }
    break
  }
  return { verb: argv[i], flags, after: i + 1 }
}

async function main() {
  const argv = process.argv.slice(2)
  const prefix = argv.length && argv[0].startsWith('--') ? pullGlobalPrefix(argv) : null
  const cmd = prefix ? prefix.verb : argv[0]
  // A leading run of unknown leading tokens is hostile input, not a verb:
  // it refuses by name (the issue #3 receipts - `--bogus gate` and the
  // joined-empty `--ledger= gate` never reorder into a verb positional).
  if (prefix && !prefix.flags.length && typeof cmd === 'string' && cmd.startsWith('--') && !(cmd === '--help' || cmd === '-h' || cmd === '--version')) {
    fail('UNKNOWN_COMMAND', `"${cmd}" is not a leading flag eyestruct knows`)
  }
  if (prefix && prefix.flags.includes('--version')) {
    // --version is a leading global: the version truth lives in package.json
    // (the manifest-pin lesson - usage() and MCP SERVER_INFO already read
    // it). A trailing verb after --version is fine, like --help
    // passthrough, so the check rides BEFORE the no-verb refusal.
    process.stdout.write(require('../package.json').version + '\n')
    process.exit(0)
  }
  // A leading run that consumed the whole argv without leaving a verb is
  // also hostile (`--manifest gate`): never improvise into usage()+exit 0.
  if (prefix && !cmd) {
    fail('UNKNOWN_COMMAND', `"${prefix.flags[prefix.flags.length - 1]}" was accepted but no verb followed the leading flags`)
  }
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
  // Leading globals re-enter the args stream so every verb sees the same
  // flags no matter which side of the verb they rode in on.
  const args = prefix ? [...prefix.flags, ...argv.slice(prefix.after)] : argv.slice(1)
  // The interface-honesty gate (the 2026-10-28 walk round, UNKNOWN_FLAG
  // joined as the 29th code): per-verb flags live in ONE ledger in this
  // file (the machine mirror of usage()'s lines), and a trailing token
  // a verb does not know refuses BY NAME - `gate --freeze` used to exit 0
  // silently running without its typo (the lie class). Joined forms
  // (--flag=VALUE) normalize to the bare flag before the membership test;
  // bools must be bare (a joined --json never turned json mode on).
  // `--help`/`-h` after any verb prints usage (they do something now, not
  // nothing); a trailing `--version` prints the package.json truth the
  // same way the leading shape does. Repeated tokens refuse - say it once.
  const GLOBAL_FLAGS = ['--ledger', '--manifest', '--json', '--version', '--help', '-h']
  const VERB_FLAGS = {
    init: ['--browser-image', '--renderer', '--browser-bundle'],
    look: ['--viewport', '--theme', '--region', '--browser-exec', '--no-overlay', '--full-page', '--format', '--quality'],
    diff: ['--viewport', '--theme', '--region', '--browser-exec', '--against'],
    spot: ['--viewport', '--theme', '--region', '--browser-exec', '--no-overlay', '--full-page', '--format', '--quality'],
    walk: ['--viewport', '--theme', '--region', '--browser-exec'],
    ratify: ['--viewport', '--theme', '--region', '--browser-exec'],
    adopt: ['--note', '--wave'],
    ledger: [],
    gate: [],
    raster: [],
    'lint-packs': ['--deep', '--against'],
    serve: ['--port', '--headers'],
    mcp: [],
  }
  const seen = new Set()
  for (const t of args) {
    if (!t.startsWith('-')) continue
    const i = t.indexOf('=')
    const norm = i === -1 ? t : t.slice(0, i)
    if (norm === '-h' || norm === '--help') {
      if (i !== -1) fail('BAD_FLAG_VALUE', `${norm} takes no value - use it bare`)
      process.stdout.write(usage())
      process.exit(0)
    }
    if (norm === '--version') {
      if (i !== -1) fail('BAD_FLAG_VALUE', '--version takes no value - use it bare')
      process.stdout.write(require('../package.json').version + '\n')
      process.exit(0)
    }
    if (norm === '--json' && i !== -1) fail('BAD_FLAG_VALUE', '--json takes no value - use it bare')
    if (seen.has(norm)) fail('BAD_FLAG_VALUE', `${norm} is stated more than once - say it once`)
    seen.add(norm)
    const allowed = GLOBAL_FLAGS.includes(norm) || (VERB_FLAGS[cmd] || []).includes(norm)
    if (!allowed) {
      fail('UNKNOWN_FLAG', `"${norm}" is not a flag the ${cmd} verb knows (allowed: ${[...GLOBAL_FLAGS, ...(VERB_FLAGS[cmd] || [])].join(' ')})`)
    }
  }
  // A flag that is present but EMPTY (`--ledger=`) is a bad flag value,
  // never a "use the default": the falsy-empty fallback would silently
  // point the verb at the tree home instead of the stated one (the
  // crashtest leg's receipt - `--ledger=` used to exit 0 reading nothing).
  const VALUE_FLAGS = ['--manifest', '--ledger', '--browser-image', '--renderer', '--browser-bundle', '--format', '--quality']
  for (const flag of VALUE_FLAGS) {
    // Both spellings: the separated form (--ledger PATH) and the joined
    // form (--ledger=PATH) - the crashtest flood used the joined form and
    // the first guard missed it entirely (same batch, same improvisation).
    const joined = args.find((a) => a.startsWith(flag + '='))
    if (joined && joined.slice((flag + '=').length) === '') {
      fail('BAD_FLAG_VALUE', `${flag} carries an empty value - give it a value or drop the flag`)
    }
    const i = args.indexOf(flag)
    if (i !== -1) {
      const v = args[i + 1]
      if (v == null || v === '') {
        fail('BAD_FLAG_VALUE', `${flag} is present but carries an empty value - give it a value or drop the flag`)
      }
      // A flag cannot occupy the next flag's value slot: `init
      // --browser-image --renderer r:1` used to write the PIN as
      // "--renderer" (the hardening round-2 receipt). The init-only flags
      // get the strict rule here; elsewhere (--viewport/--theme/--region)
      // a flag-looking value already fails later by name (BAD_VIEWPORT,
      // BAD_THEME, NO_BASELINE...).
      if (v === true || String(v).startsWith('--')) {
        fail('BAD_FLAG_VALUE', `${flag} needs a value - the next token is the flag "${v}"`)
      }
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
