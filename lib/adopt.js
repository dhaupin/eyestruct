// eyestruct adopt - propose a baseline change. LOCAL ADOPT IS A PROPOSAL:
// canon is CI-cut, so the row carries ratified:false until the CI lane
// reproduces the capture inside the pinned image. --note is REQUIRED
// (ADOPT_NOTE_REQUIRED): a diff that ships without a ledger row explaining
// it fails the pass, enforced at write time.
//
// Targets name ARTIFACTS, never slots (ADOPT_TARGET_NOT_ARTIFACT, the
// creadev bootstrap receipt): the first consumer's drift-bootstrap wrote
// `adopt <route/view>` rows because the help said so - the row landed
// naming a DIRECTORY, `fs.existsSync` told the gate it was live, and the
// real capture stayed UNRECORDED behind a row that explained nothing. The
// gate can only match capture files (`<slot>/current.png`), so the write
// side refuses anything that lacks the raster shape or resolves to a
// directory under the eyes home: the mistake costs one line at write time,
// not a red gate at merge time.
//
// --wave fans the note across N targets as ONE wave row: every target is
// the same artifact-path shape, and the row's artifacts array names the
// N captures - the churn-wave ruling (one note explains N image changes
// in the same commit), so a wave of captures does not degenerate into N
// identical notes.

'use strict'

const fs = require('fs')
const path = require('path')
const { flagValue } = require('./flags')
const ledgerMod = require('./ledger')
const identity = require('./identity')
const { fail } = require('./reasons')

// The same raster shape the gate's artifact scan honors - one truth, two
// readers (drop this line and the write side and the gate disagree about
// what an artifact is).
const RASTER = /\.(png|webp)$/

function run(ctx) {
  const wave = ctx.argv.includes('--wave')
  const targets = posArgs(ctx.argv)
  if (!targets.length) fail('UNKNOWN_COMMAND', 'adopt needs <slot>/current.png (the capture path - a slot name can never be explained by a row)')
  // flagValue hands back the next token even when it is another flag -
  // `adopt <t> --note --wave` used to land --wave IN the note (and trip
  // the wave branch from the same token). A flag occupying the slot is
  // a missing note, refused by the adopt-specific code.
  const note = flagValue(ctx.argv, '--note')
  if (!note || !note.trim() || note.startsWith('--')) fail('ADOPT_NOTE_REQUIRED')
  // Order matters: the path-ESCAPE truth outranks the shape truth - an
  // absolute or .. -carrying target is UNSAFE_PATH (the ledger's contract,
  // shared export), never a benign shape miss. Then the artifact shape:
  // the raster extension a slot can never carry, and - for targets that
  // PASS the shape - the lstat check that a png-named directory cannot
  // ride through.
  for (const t of targets) {
    if (ledgerMod.artifactEscapes(t)) {
      fail('UNSAFE_PATH', `adopt target escapes the eyes home ("${t}") - paths are eyes-relative, never absolute, never carrying .. segments`)
    }
  }
  const eyesFile = ledgerMod.ledgerPath(ctx.cwd, ctx)
  const eyesDir = path.dirname(eyesFile)
  for (const t of targets) {
    if (!RASTER.test(t)) {
      fail('ADOPT_TARGET_NOT_ARTIFACT', `"${t}" - a slot name is a directory the gate can never match; adopt needs the capture path ("${t}/current.png")`)
    }
    let st = null
    try { st = fs.lstatSync(path.join(eyesDir, t)) } catch { st = null }
    if (st && !st.isFile()) {
      fail('ADOPT_TARGET_NOT_ARTIFACT', `"${t}" resolves to a directory under the eyes home - rows must name the capture ("${t}/current.png")`)
    }
  }
  const row = ledgerMod.append(eyesFile, wave
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

module.exports = { run }
