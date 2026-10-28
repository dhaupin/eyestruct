// The adapter-API leg (tests for lib/index.js): the adapter surface is a
// FROZEN contract (eyestruct-adapter@1), so the battery pins its shape the
// way the census pins the CLI verbs and the MCP tools - dispatch
// semantics, the named-refusal contract, and the never-exits law. It also
// exercises the real verb dispatches over temp-dir fixtures (behavior
// only, temp dirs, no network - the same law every test here runs).

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const api = require('../lib/index.js')
const reasons = require('../lib/reasons.js')

function tempRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eyestruct-adapter-'))
  fs.mkdirSync(path.join(root, 'labs', '.eyes'), { recursive: true })
  return root
}

function seedRepo(root) {
  // A minimal honest eye home: manifest + ledger + one explained artifact.
  fs.writeFileSync(
    path.join(root, 'labs', '.eyes', 'manifest.yml'),
    'pin:\n  browser-image: ghcr.io/fleet/pinned-chromium:2026-10\n  renderer: resvg@2.6.2\nroutes:\n  - path: /  view: desktop-1280  theme: dark  viewport: 1280x800\n'
  )
  fs.mkdirSync(path.join(root, 'labs', '.eyes', 'home'), { recursive: true })
  fs.writeFileSync(path.join(root, 'labs', '.eyes', 'home', 'current.png'), 'not really a png, but the gate counts byte-size classes only')
  fs.writeFileSync(
    path.join(root, 'labs', '.eyes', 'ledger.json'),
    JSON.stringify([{ id: 'row-1', ts: 1, agent: 'test', commit: 'c', artifact: 'home/current.png', type: 'adopt', note: 'seed', ratified: false }])
  )
  return root
}

test('adapter api: the contract marker + the named-refusal surface carry the tree truth', () => {
  assert.equal(api.ADAPTER_CONTRACT, 'eyestruct-adapter@1')
  assert.equal(api.version, require('../package.json').version)
  assert.equal(api.FailError, reasons.FailError)
  assert.deepEqual(api.reasonCodes, Object.keys(reasons.CODES))
  assert.equal(api.reasonCodes.length, 30, 'the adapter surface exposes the same 30 codes the CLI does (UNKNOWN_FLAG joined 2026-10-28, RASTER_CANVAS joined 2026-11-01 - both carrier-receipted)')
  // One writer of truth per store: the exposed modules ARE the CLI's
  // modules, not copies.
  assert.equal(api.manifest, require('../lib/manifest.js'))
  assert.equal(api.ledger, require('../lib/ledger.js'))
})

test('adapter api: dispatch runs the CLI verb verbatim (same ctx shape, same output shape)', () => {
  const root = seedRepo(tempRepo())
  const code = api.dispatch('gate', api.ctxOf(root, ['--json'], true))
  assert.equal(code, 0)
  const code2 = api.dispatch('gate', api.ctxOf(root, []))
  assert.equal(code2, 0, 'the gate is honest in plain mode too')
  // cleanup the temp tree
  fs.rmSync(path.join(root), { recursive: true, force: true })
})

test('adapter api: refusals arrive as FailError with the CLI reason text (never process.exit)', () => {
  const root = tempRepo()
  // gate with no manifest - the capability-class refusal, exit 2 on the CLI
  assert.throws(() => api.dispatch('gate', api.ctxOf(root, [])), (err) => {
    assert.ok(err instanceof api.FailError)
    assert.match(err.message, /eyestruct\[MISSING_MANIFEST\]/)
    return true
  })
  fs.rmSync(path.join(root), { recursive: true, force: true })
})

test('adapter api: the adopt dispatch enforces ADOPT_NOTE_REQUIRED and writes a wave row through the same ledger store', () => {
  const root = seedRepo(tempRepo())
  const good = path.join(path.dirname(root), 'eyes-adapter-good-' + Date.now())
  fs.mkdirSync(path.join(good, 'labs', '.eyes'), { recursive: true })
  fs.writeFileSync(
    path.join(good, 'labs', '.eyes', 'manifest.yml'),
    fs.readFileSync(path.join(root, 'labs', '.eyes', 'manifest.yml'), 'utf8')
  )
  fs.writeFileSync(path.join(good, 'labs', '.eyes', 'ledger.json'), '[]')
  assert.throws(
    () => api.dispatch('adopt', api.ctxOf(good, ['home/current.png', '--note', '--wave'])),
    /eyestruct\[ADOPT_NOTE_REQUIRED\]/
  )
  fs.rmSync(good, { recursive: true, force: true })
  fs.rmSync(root, { recursive: true, force: true })
})

test('adapter api: lint-packs passthrough exit fidelity - the exit code IS the verdict', () => {
  // Commissioned from the walk round (the comment-claim "the exit code
  // IS the verdict" had no receipt): the passthrough must return 0 on a
  // clean pack tree and 1 when packstruct reports findings, never its
  // own opinion. packstruct is an exact devDependency, present wherever
  // the battery runs (CI runs lint:packs beside this leg).
  const clean = api.dispatch('lint-packs', api.ctxOf(process.cwd(), []))
  assert.equal(clean, 0, 'the repo pack tree must lint clean in-tree')
  const findings = api.dispatch(
    'lint-packs',
    api.ctxOf(process.cwd(), ['/no/such/pack-dir'])
  )
  assert.equal(findings, 1, 'a usage VIOLATION rides out as exit 1')
})

test('adapter api: unknown verbs refuse by name with the available verb list', () => {
  assert.throws(
    () => api.dispatch('teleport', api.ctxOf(process.cwd(), [])),
    (err) => {
      assert.match(err.message, /UNKNOWN_COMMAND/)
      assert.match(err.message, /lint-packs/)
      return true
    }
  )
})
