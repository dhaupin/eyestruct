'use strict'

// The family status dialect test (docs/status.md): the emitter's behavior
// is pinned with temp-dir fixtures, and the real tree's emitted counts are
// re-derived against the live ledgers so the dialect itself sits under CI
// the same way every other count in this repo does.
// Behavior-only, temp dirs, no network - the same law every test here runs.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const { build, write } = require('../web/scripts/build-status.mjs')

function fixtureRepo({ packRows, findings, manifestPacks }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eyestruct-status-'))
  fs.mkdirSync(path.join(root, 'labs'), { recursive: true })
  for (const p of manifestPacks) {
    fs.mkdirSync(path.join(root, 'packs', 'public', p.dir), { recursive: true })
  }
  fs.writeFileSync(
    path.join(root, 'packs', 'eye-ledger.json'),
    JSON.stringify({ schemaVersion: 1, rows: packRows })
  )
  fs.writeFileSync(
    path.join(root, 'labs', 'crashledger.json'),
    JSON.stringify({ schemaVersion: 1, findings })
  )
  for (const p of manifestPacks) {
    fs.writeFileSync(
      path.join(root, 'packs', 'public', p.dir, 'pack.json'),
      JSON.stringify(p.manifest)
    )
  }
  return root
}

const PASS_ROW = { pack: 'eye-x', id: 'case-a', verdict: 'REFUSED' }

test('status: the dialect fields and leg rows derive from the committed ledgers', () => {
  const root = fixtureRepo({
    packRows: [PASS_ROW, { pack: 'eye-x', id: 'case-b', verdict: 'PASSED' }],
    findings: [{ id: 'f1', verdict: 'REFUSED', detail: 'x' }],
    manifestPacks: [
      { dir: 'eye-x', manifest: { name: 'eye-x', schemaVersion: 1, version: '1.0.0', description: 'd', entry: 'index.js' } },
    ],
  })
  const s = build(root)
  assert.equal(s.schema, 1)
  assert.equal(s.contract, 'family-status@1')
  assert.equal(s.repo, 'dhaupin/eyestruct')
  assert.equal(s.site, 'https://eyestruct.creadev.org/status')
  assert.ok(s.docs.startsWith('https://docs.creadev.org/eyestruct'))
  const packsLeg = s.legs.find((l) => l.leg === 'packs')
  const crashLeg = s.legs.find((l) => l.leg === 'crashtest')
  assert.deepEqual(packsLeg, { leg: 'packs', verdict: 'PASS', cases: 2, counts: { REFUSED: 1, PASSED: 1 }, ledger: 'packs/eye-ledger.json' })
  assert.deepEqual(crashLeg, { leg: 'crashtest', verdict: 'PASS', cases: 1, counts: { REFUSED: 1 }, ledger: 'labs/crashledger.json' })
  assert.deepEqual(s.packs, [{ name: 'eye-x', spec: 'packstruct@1', manifest: 'packs/public/eye-x/pack.json', cases: 2 }])
})

test('status: any case verdict outside the pass set degrades the leg to RED (never a fake PASS)', () => {
  const root = fixtureRepo({
    packRows: [PASS_ROW, { pack: 'eye-x', id: 'case-b', verdict: 'EXPLOITED' }],
    findings: [],
    manifestPacks: [
      { dir: 'eye-x', manifest: { name: 'eye-x', schemaVersion: 1, version: '1.0.0', description: 'd', entry: 'index.js' } },
    ],
  })
  const s = build(root)
  assert.equal(s.legs.find((l) => l.leg === 'packs').verdict, 'RED')
  // An unknown verdict is the same refusal - the dialect degrades, not guesses
  const root2 = fixtureRepo({
    packRows: [{ pack: 'eye-x', id: 'case-a', verdict: 'MEANWHILE' }],
    findings: [],
    manifestPacks: [
      { dir: 'eye-x', manifest: { name: 'eye-x', schemaVersion: 1, version: '1.0.0', description: 'd', entry: 'index.js' } },
    ],
  })
  assert.equal(build(root2).legs.find((l) => l.leg === 'packs').verdict, 'RED')
})

test('status: the emitter refuses the intersection cases loudly (manifest without rows, rows without manifest)', () => {
  assert.throws(
    () => build(fixtureRepo({
      packRows: [PASS_ROW],
      findings: [],
      manifestPacks: [
        { dir: 'eye-x', manifest: { name: 'eye-x', schemaVersion: 1, version: '1.0.0', description: 'd', entry: 'index.js' } },
        { dir: 'eye-y', manifest: { name: 'eye-y', schemaVersion: 1, version: '1.0.0', description: 'd', entry: 'index.js' } },
      ],
    })),
    /eye-y.*zero ledger rows/
  )
  assert.throws(
    () => build(fixtureRepo({
      // eye-x consumes its row and gets deleted from the pack map, so the
      // remaining eye-ghost row is the case this assertion exists for.
      packRows: [PASS_ROW, { pack: 'eye-ghost', id: 'x', verdict: 'REFUSED' }],
      findings: [],
      manifestPacks: [
        { dir: 'eye-x', manifest: { name: 'eye-x', schemaVersion: 1, version: '1.0.0', description: 'd', entry: 'index.js' } },
      ],
    })),
    /unknown packs.*eye-ghost/
  )
})

test('status: write() lands a parseable file at the requested path and returns receipts', () => {
  const root = fixtureRepo({
    packRows: [PASS_ROW],
    findings: [],
    manifestPacks: [
      { dir: 'eye-x', manifest: { name: 'eye-x', schemaVersion: 1, version: '1.0.0', description: 'd', entry: 'index.js' } },
    ],
  })
  const outPath = path.join(root, 'out', 'status.json')
  const { status, outPath: written } = write(root, outPath)
  assert.equal(written, outPath)
  const parsed = JSON.parse(fs.readFileSync(outPath, 'utf8'))
  assert.deepEqual(parsed, status)
})

test('status: the real tree serves counts that agree with the live committed ledgers', () => {
  const s = build()
  const packRows = require('../packs/eye-ledger.json').rows.length
  const findings = fs.readFileSync(path.join('labs', 'crashledger.json'), 'utf8')
  const cases = JSON.parse(findings).findings.length
  const packsLeg = s.legs.find((l) => l.leg === 'packs')
  const crashLeg = s.legs.find((l) => l.leg === 'crashtest')
  assert.equal(packsLeg.cases, packRows)
  assert.equal(crashLeg.cases, cases)
  assert.equal(s.packs.reduce((n, p) => n + p.cases, 0), packRows)
  // The asOf receipt names the real HEAD the generator saw (or worktree
  // only when git is truly absent - never something invented).
  if (s.asOf !== 'worktree') {
    const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
    assert.equal(s.asOf, head)
  }
})
