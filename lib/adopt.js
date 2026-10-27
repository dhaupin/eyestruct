// eyestruct adopt - propose a baseline change. LOCAL ADOPT IS A PROPOSAL:
// canon is CI-cut, so the row carries ratified:false until the CI lane
// reproduces the capture inside the pinned image. --note is REQUIRED
// (ADOPT_NOTE_REQUIRED): a diff that ships without a ledger row explaining
// it fails the pass, enforced at write time.
//
// --wave fans the note across N targets as ONE wave row: `animates
// <route/view> [route/view...]; --wave` writes a single type:'wave' row
// whose artifacts array names every changed slot - the churn-wave ruling
// (one note explains N image changes in the same commit), so a wave of
// captures does not degenerate into N identical notes.

'use strict'

const ledgerMod = require('./ledger')
const identity = require('./identity')
const { fail } = require('./reasons')

function run(ctx) {
  const wave = ctx.argv.includes('--wave')
  const targets = posArgs(ctx.argv)
  if (!targets.length) fail('UNKNOWN_COMMAND', 'adopt needs <route/view>')
  // flagValue hands back the next token even when it is another flag -
  // `adopt <t> --note --wave` used to land --wave IN the note (and trip
  // the wave branch from the same token). A flag occupying the slot is
  // a missing note, refused by the adopt-specific code.
  const note = flagValue(ctx.argv, '--note')
  if (!note || !note.trim() || note.startsWith('--')) fail('ADOPT_NOTE_REQUIRED')
  const file = ledgerMod.ledgerPath(ctx.cwd, ctx)
  const row = ledgerMod.append(file, wave
    ? {
        type: 'wave',
        agent: identity.agent(),
        commit: identity.commit(),
        artifacts: targets,
        note,
        ratified: false,
      }
    : {
        type: 'adopt',
        agent: identity.agent(),
        commit: identity.commit(),
        artifact: targets[0],
        note,
        ratified: false,
      })
  if (ctx.json) process.stdout.write(JSON.stringify(row, null, 2) + '\n')
  else if (wave) process.stdout.write(`proposed ${row.id} for ${targets.length} slot(s): ${targets.join(', ')} (ratified:false)\n`)
  else process.stdout.write(`proposed ${row.id} for ${targets[0]} (ratified:false)\n`)
  return 0
}

function posArgs(argv) {
  return argv.filter((a, i) => !a.startsWith('--') && !isFlagValue(argv, a, i))
}

function isFlagValue(argv, a, i) {
  return i > 0 && argv[i - 1].startsWith('--') && !argv[i - 1].includes('=')
}

function flagValue(argv, flag) {
  const i = argv.indexOf(flag)
  return i === -1 ? null : argv[i + 1]
}

module.exports = { run }
