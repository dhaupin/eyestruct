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

// The one ESM emitter, dynamically imported - the same reason the
// served-contract leg does it this way: node 18 (the consumer floor this
// battery re-receipts) cannot require(esm), and a top-level require would
// kill the whole file before any fixture ran. Each test awaits it.
async function emitter() {
  return import('../web/scripts/build-status.mjs')
}

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

test('status: the dialect fields and leg rows derive from the committed ledgers', async () => {
  const { build } = await emitter()
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

test('status: any case verdict outside the pass set degrades the leg to RED (never a fake PASS)', async () => {
  const { build } = await emitter()
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

test('status: the emitter refuses the intersection cases loudly (manifest without rows, rows without manifest)', async () => {
  const { build } = await emitter()
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

test('status: write() lands a parseable file at the requested path and returns receipts', async () => {
  const { write } = await emitter()
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

test('status: the real tree serves counts that agree with the live committed ledgers', async () => {
  const { build } = await emitter()
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

// The reader clause (docs/status.md, eyestruct#25): CSP connect-src governs
// fetch() BEFORE any CORS header is consulted, so every origin the island
// fetches must be in the page's own connect-src. A sibling missing here is a
// dark row at the reader with a correct server behind it - the exact shape
// that kept the whole grid dark while every /status.json answered 200.
// This leg fails at the cause: the two halves (the island's table and the
// served CSP) can never drift apart silently again.
test('status: the page CSP connect-src covers every sibling origin the island fetches', () => {
  const island = fs.readFileSync(path.join('web', 'src', 'components', 'FamilyStatusIsland.jsx'), 'utf8')
  const siblings = [...island.matchAll(/origin:\s*'([^']+)'/g)].map((m) => m[1])
  assert.ok(siblings.length >= 4, `island declares its siblings (found ${siblings.length})`)

  const headers = fs.readFileSync(path.join('web', 'public', '_headers'), 'utf8')
  const csp = headers.split('\n').find((l) => l.includes('Content-Security-Policy:'))
  assert.ok(csp, 'the served _headers carries a CSP')
  const connectSrc = csp.slice(csp.indexOf('connect-src'), csp.indexOf(';', csp.indexOf('connect-src')))

  // Every sibling origin except this site's own (served by 'self') must be
  // reachable. A new member's row without its origin here is the drift this
  // leg exists to catch.
  const self = 'https://eyestruct.creadev.org'
  for (const origin of siblings) {
    if (origin === self) continue
    assert.ok(
      connectSrc.includes(origin),
      `connect-src must carry ${origin} (the island fetches it); add it in web/public/_headers`
    )
  }
})
