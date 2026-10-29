// eyestruct ratify - CI-CUT CANON. A local adopt is only ever a proposal
// (ratified:false). Canon becomes real when the SAME capture is reproduced
// in the PINNED environment: ratify re-runs every manifest route through
// the pinned exec and, for every slot whose fresh capture is byte-identical
// to the committed baseline, appends an APPEND-ONLY ratify row proving the
// reproduction. Nothing is edited or rewritten - the proof rides the ledger
// like every other fact.
//
// Exit contract: 0 every manifested slot reproduced byte-identical ·
// 1 at least one slot DIFFERS (UNVERIFIED reasons, next action: diff/adopt)
// 2 capability (pinned browser, manifest). Never a bare stack trace.

'use strict'

const fs = require('fs')
const path = require('path')
const manifest = require('./manifest')
const ledgerMod = require('./ledger')
const tolerance = require('./tolerance')
const { fail } = require('./reasons')

// The canon-slot naming, THE shared reader (the walk-lap drift round,
// 2026-11-01): this exact expression was hand-copied in THREE places
// (look.js routeSlot, mcp.js slotOfFirst, and here) - three owners of one
// truth, so a future naming change moved silently in one lane and not the
// others. ratify is the named source (the eyes-ratify bootstrap reads this
// export); look and mcp arrive at canon-slot names THROUGH it. Candidates
// (labs/.eyes-candidates/) use walk.candidateName instead - a DIFFERENT
// naming with a different default ('root' for / by the khf-wp contract),
// deliberately not this function.
function slotDir(route) {
  const slug = (route.path === '/' ? 'home' : route.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')) || 'page'
  return `${slug}/${route.view}`
}

function run(ctx) {
  const m = manifest.read(ctx.cwd, ctx)
  if (!m.routes.length) fail('WALK_EMPTY', 'ratify has nothing to reproduce: the manifest declares no routes')
  const urlArg = ctx.argv.find((a) => /^(https?:\/\/|file:\/\/)/.test(a))
  if (!urlArg) fail('UNKNOWN_COMMAND', 'ratify needs a <base-url> serving the pinned surface')
  let engine
  try {
    engine = require('./engine')
  } catch {
    fail('MISSING_PINNED_BROWSER')
  }

  const file = ledgerMod.ledgerPath(ctx.cwd, ctx)
  const verified = []
  const unverified = []
  let idx = 0
  const next = () => {
    if (idx >= m.routes.length) return Promise.resolve()
    const route = m.routes[idx++]
    const slot = slotDir(route)
    const baseline = path.join(path.dirname(m.file), slot, 'current.png')
    if (!fs.existsSync(baseline)) {
      // Canon pointing at nothing is verified nowhere; report by slot, keep walking.
      unverified.push({ slot, reason: 'NO_BASELINE' })
      return next()
    }
    return engine
      .capture({
        url: (urlArg.endsWith('/') ? urlArg.slice(0, -1) : urlArg) + route.path,
        argv: ctx.argv,
        pin: m.pin,
        viewport: route.viewport,
        theme: route.theme,
      })
      .then((cap) => {
        const baseBytes = fs.statSync(baseline).size
        const fresh = Buffer.from(cap.png)
        const tol = tolerance.profileOf(route)
        if (cap.png.length !== baseBytes || !fresh.equals(fs.readFileSync(baseline))) {
          if (tol.mode === 'profile') {
            // T-T3: the canon cut under a tolerant slot is a DIFFERENT,
            // clearly-named pledge - pixel-eq at bounded span, decided by
            // the profile the row is about to receipt. Gate is untouched
            // (ledger accounting, T-T3's first half).
            const meas = tolerance.compare(fs.readFileSync(baseline), cap.png, tol)
            if (meas === null) {
              unverified.push({
                slot,
                reason: 'DIFFERS',
                note: 'tolerance compare needs RGBA8 PNG on both sides (or equal sizes); the bytes ride unverified',
                bytes: { baseline: baseBytes, fresh: cap.png.length },
              })
              return
            }
            if (!meas.pass) {
              unverified.push({
                slot,
                reason: 'DIFFERS',
                note: meas.fail === 'fraction'
                  ? `out of profile: changed-pixel fraction ${meas.measured.fraction} exceeds pixel cap ${tol.pixels}`
                  : `out of profile: changed-set span ${meas.measured.bw}x${meas.measured.bh} exceeds bbox cap ${tol.bw}x${tol.bh}`,
                bytes: { baseline: baseBytes, fresh: cap.png.length },
                measured: meas.measured,
              })
              return
            }
            const v = meas.measured
            const row = ledgerMod.append(file, {
              type: 'ratify',
              agent: require('./identity').agent(),
              commit: require('./identity').commit(),
              artifact: `${slot}/current.png`,
              note: `reproduced pixel-eq under tolerance (${route.tolerance}) in the pinned environment via ${urlArg} - measured: maxDelta ${v.maxDelta}, ${v.changed} changed px (fraction ${v.fraction}), span ${v.bw}x${v.bh}`,
              pin: m.pin['browser-image'],
              tolerance: route.tolerance,
              verified: true,
            })
            verified.push({ slot, row: row.id, tolerance: route.tolerance })
            return
          }
          unverified.push({ slot, reason: 'DIFFERS', bytes: { baseline: baseBytes, fresh: cap.png.length } })
          return
        }
        const row = ledgerMod.append(file, {
          type: 'ratify',
          agent: require('./identity').agent(),
          commit: require('./identity').commit(),
          artifact: `${slot}/current.png`,
          note: `reproduced byte-identical (${baseBytes}B) in the pinned environment via ${urlArg}`,
          pin: m.pin['browser-image'],
          verified: true,
        })
        verified.push({ slot, row: row.id })
      })
      .then(next)
  }
  return next().then(() => {
    if (ctx.json) {
      process.stdout.write(JSON.stringify({ verified: verified.length, unverified }, null, 2) + '\n')
      return unverified.length ? 1 : 0
    }
    for (const v of verified) process.stdout.write(`ratified ${v.slot} (row ${v.row}${v.tolerance ? `, tolerance ${v.tolerance}` : ', byte-identical'})\n`)
    for (const u of unverified) {
      process.stdout.write(`UNVERIFIED ${u.slot} (${u.reason}${u.bytes ? ' - ' + JSON.stringify(u.bytes) : ''}${u.note ? ' - ' + u.note : ''}${u.measured ? ' - ' + JSON.stringify(u.measured) : ''})\n`)
    }
    if (unverified.length) {
      process.stdout.write('ratify: canon is NOT yet reproducible for every slot; run look/diff and adopt the change first\n')
    } else {
      process.stdout.write(`ratify: ${verified.length} slot(s) reproduced byte-identical in the pinned environment\n`)
    }
    return unverified.length ? 1 : 0
  })
}

module.exports = { run, slotDir }
