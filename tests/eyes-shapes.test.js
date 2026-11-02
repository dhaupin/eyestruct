// tests/eyes-shapes.test.js - behavior coverage for the family-shared canon
// leg (scripts/check-eyes-shapes.cjs). House style: node:test, behavior-only,
// temp dirs, no network. The pack is the EXACT poststruct devDependency pin,
// driven through the same `eyestructTree` contract the runner arms - so the
// leg is proven against the real module a consumer would load, never a copy.
//
//   the good canon   -> 0 exploited (exit 0)
//   a corrupt ledger -> the named EXPLOITED row (exit 1)
//   a canon-free tree-> the BOUNDED docket, never a fake pass (exit 0)
//   no pack on disk  -> a named setup refusal (exit 2)

const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const { runLeg, resolvePack } = require('../scripts/check-eyes-shapes.cjs')

// A miniature canon-carrying repo: the manifest + ledger + receipt hall the
// pack audits, all mutually honest.
function goodCanon() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eyes-shapes-'))
  const w = (rel, body) => {
    const p = path.join(root, rel)
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, body)
  }
  w('labs/.eyes/home/desktop-1280-dark/current.png', 'PLACEHOLDER-BASELINE-BYTES ')
  w('labs/.eyes/manifest.yml', [
    'pin:',
    '  browser-image: local-chrome@154.0.8037.57',
    '  renderer: resvg@2.6.2',
    'routes:',
    '  - path: /          view: desktop-1280-dark  theme: dark  viewport: 1280x800  slot: home',
    '',
  ].join('\n'))
  w('labs/.eyes/ledger.json', JSON.stringify([{
    type: 'adopt', agent: 'fixture-agent', commit: 'uncommitted',
    artifact: 'home/desktop-1280-dark/current.png',
    note: 'fixture baseline: one route, honest pointers',
    ratified: false, id: 'row-0001', ts: 1792955330979,
  }], null, 2) + '\n')
  w('labs/.eyes-receipt/caught.png', 'PLACEHOLDER-RECEIPT-FRAME ')
  w('labs/.eyes-receipt/ledger.json', JSON.stringify([{
    type: 'adopt', agent: 'fixture-agent', commit: 'uncommitted',
    artifact: 'caught.png',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    note: 'receipt frame with an honest digest',
    ratified: false, id: 'row-0001', ts: 1793099528549,
  }], null, 2) + '\n')
  return root
}

test('the good canon drives the shared pack clean (0 exploited)', async () => {
  const root = goodCanon()
  const r = await runLeg({ root: path.join(__dirname, '..'), treeRoot: root })
  assert.equal(r.code, 0, JSON.stringify(r.rows))
  assert.equal(r.ok, true)
  assert.ok(r.rows.length >= 7, 'the pack must emit its full row set')
  assert.ok(!r.rows.some((x) => x.verdict === 'EXPLOITED'), JSON.stringify(r.rows))
  assert.ok(r.rows.some((x) => x.id === 'eyes/reason-table-drift'))
  fs.rmSync(root, { recursive: true, force: true })
})

test('a corrupt canon ledger lands the named EXPLOITED row (exit 1)', async () => {
  const root = goodCanon()
  fs.writeFileSync(path.join(root, 'labs/.eyes/ledger.json'), 'not json at all')
  const r = await runLeg({ root: path.join(__dirname, '..'), treeRoot: root })
  assert.equal(r.code, 1)
  assert.equal(r.ok, false)
  assert.ok(r.rows.some((x) => x.id === 'eyes/ledger-corrupt' && x.verdict === 'EXPLOITED'))
  fs.rmSync(root, { recursive: true, force: true })
})

test('a canon-free tree dockets BOUNDED, never a fake pass', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eyes-shapes-free-'))
  fs.mkdirSync(path.join(root, 'src'), { recursive: true })
  const r = await runLeg({ root: path.join(__dirname, '..'), treeRoot: root })
  assert.equal(r.code, 0)
  assert.ok(r.rows.some((x) => x.id === 'eyes/canon-absent' && x.verdict === 'BOUNDED'))
  fs.rmSync(root, { recursive: true, force: true })
})

test('an absent pack is a named setup refusal, never a fake pass', async () => {
  // A root with no node_modules anywhere up the chain: the resolver walks
  // out and finds nothing, so the leg refuses by name.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eyes-shapes-nopack-'))
  const r = await runLeg({ root })
  assert.equal(r.code, 2)
  assert.equal(r.ok, false)
  assert.match(r.error, /poststruct is not installed/)
  fs.rmSync(root, { recursive: true, force: true })
})

test('the resolver finds the pack from the repo root', () => {
  assert.ok(resolvePack(path.join(__dirname, '..')), 'the exact devDependency pin must carry the pack')
})
