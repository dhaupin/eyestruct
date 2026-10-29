// eyestruct gate - the CI job. Crashledger semantics:
//   exit 0  every committed labs/.eyes/ artifact is explained by a ledger row,
//           and every row references a live artifact on disk
//   exit 1  DANGLING_ROW (row references a missing artifact) or UNRECORDED
//           (artifact without a row) - explained drift is fine, unexplained is not
//   exit 2  capability problems (no manifest, corrupt ledger)
// Pure and browserless: the gate reasons over git state + the ledger, which
// is why it runs in CI with zero captures.

'use strict'

const fs = require('fs')
const path = require('path')
const manifest = require('./manifest')
const ledgerMod = require('./ledger')
const { fail } = require('./reasons')

function run(ctx) {
  const m = manifest.read(ctx.cwd, ctx)
  const ledgerFile = ledgerMod.ledgerPath(ctx.cwd, ctx)
  const rows = ledgerMod.load(ledgerFile)

  const eyesDir = path.dirname(m.file)
  const artifacts = []
  collect(eyesDir, artifacts)
  const visual = artifacts.filter((f) => /\.(png|webp)$/.test(f))

  const byArtifact = ledgerMod.byArtifact(rows)
  const unexplained = visual.filter((f) => !(byArtifact.get(rel(eyesDir, f)) || []).length)
  // Every artifact reference a row makes - `artifact` on normal rows and
  // every entry of a wave row's `artifacts` - must exist AS A FILE on disk.
  // lstat, not existsSync: a row whose target resolves to a DIRECTORY was
  // the creadev bootstrap bite (adopter took `adopt <slot>`, the check was
  // true-for-directories, and the real capture stayed UNRECORDED behind a
  // row that lived while explaining nothing) - a slot is not a live
  // artifact, and the gate neither follows symlinks nor guesses past one.
  const refs = []
  for (const r of rows) {
    if (r.artifact) refs.push({ id: r.id, p: r.artifact })
    if (Array.isArray(r.artifacts)) for (const a of r.artifacts) refs.push({ id: r.id, p: a })
  }
  const dangling = refs.filter(({ id, p }) => {
    let st = null
    try { st = fs.lstatSync(path.join(eyesDir, p)) } catch { st = null }
    return !st || !st.isFile()
  })

  // Dangling first: canon pointing at nothing is the worse lie.
  // Enumeration is capped: a wide drift on a big ledger must not funnel a
  // megabyte of names into one CI log line. The count stays exact; the
  // ledger_id list is where the rest live (self-checkable, not hidden).
  if (dangling.length) {
    const CAP = 20
    const shown = dangling.slice(0, CAP).map((r) => `${r.id} (${r.p})`).join(', ')
    fail('DANGLING_ROW', `dangling row(s) [${dangling.length}, showing first ${Math.min(CAP, dangling.length)}]: ${shown}`)
  }
  if (unexplained.length) {
    const names = unexplained.map((f) => rel(eyesDir, f))
    const CAP = 20
    fail('UNRECORDED', `artifact(s) with no ledger row [${names.length}, showing first ${Math.min(CAP, names.length)}]: ${names.slice(0, CAP).join(', ')}`)
  }

  const verdict = `gate: ${visual.length} visual artifact(s) all explained by ${rows.length} ledger row(s); pin ${m.pin['browser-image']}`
  if (ctx.json) process.stdout.write(JSON.stringify({ ok: true, verdict, artifacts: visual.length, rows: rows.length, pin: m.pin }, null, 2) + '\n')
  else process.stdout.write(verdict + '\n')
  return 0
}

function collect(dir, out) {
  let entries = []
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) collect(p, out)
    else out.push(p)
  }
}

function rel(eyesDir, f) {
  return path.relative(eyesDir, f).split(path.sep).join('/')
}

module.exports = { run }
