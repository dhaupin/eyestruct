'use strict'

// The contract clamp leg (the 1.0.0 interface audit, 2026-10-28): the
// stability law freezes more than verbs/codes/tools - it freezes the
// de-facto surfaces consumers already bind to. Four legs, one file:
//   1. the exports map (the deep-require clamp) - the adapter entries
//      resolve, an undocumented deep path refuses at the package level;
//   2. the env inventory - derived from the source and pinned, so a new
//      EYESTRUCT_* name fails CI until docs/env.md names it;
//   3. the --json machine-output shapes - key snapshots of every
//      browserless verb, so a field rename is a named failure, not a
//      silent 2.0-class break;
//   4. the schema jails - real corruption variants (manifest, ledger,
//      path escapes) refused by name, so "the schema is frozen" has a
//      test, not just prose.
// Behavior-only, temp dirs, no network, node >=18.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const cp = require('node:child_process')

const REPO = path.join(__dirname, '..')
const BIN = path.join(REPO, 'bin', 'eyestruct.js')
const PKG = require('../package.json')

function run(argv, cwd, env) {
  let out
  try {
    out = { stdout: cp.execFileSync(process.execPath, [BIN, ...argv], { cwd, encoding: 'utf8', env: { ...process.env, ...env } }), code: 0 }
  } catch (err) {
    out = { stdout: err.stdout || '', stderr: err.stderr || '', code: err.status }
  }
  return out
}

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix || 'eye-contract-'))
}

// ---- 1. the exports map ---------------------------------------------------

test('exports clamp: the adapter entries resolve and the documented mirror path keeps working', () => {
  // The in-repo adapters page froze `require('eyestruct/lib/index.js')`; the
  // map must keep that exact spelling alive (the zero-churn clamp).
  const entries = Object.keys(PKG.exports || {})
  assert.deepEqual(entries.sort(), ['.', './lib/index.js', './package.json'])
  // Self-resolution: node resolves `eyestruct` to lib/index.js through the
  // map (works in-repo at 0.x and in the installed tarball identically).
  const main = require.resolve('eyestruct')
  assert.equal(main, path.join(REPO, 'lib', 'index.js'))
  const api = require('eyestruct')
  assert.equal(api.ADAPTER_CONTRACT, 'eyestruct-adapter@1')
  assert.equal(api.SCHEMA_CARRIER, 'packs/public/eye-adapter')
  // The mirror entry is the same module, never a copy.
  assert.equal(require('eyestruct/lib/index.js'), api)
  // Undocumented deep paths refuse at the package level (ERR_PACKAGE_PATH_
  // NOT_EXPORTED): the clamp is what makes "lib/ layout is private" true.
  for (const deep of ['eyestruct/lib/ledger.js', 'eyestruct/lib/serve-dist.js', 'eyestruct/lib/reasons.js']) {
    assert.throws(() => require.resolve(deep), (err) => {
      assert.match(err.code, /ERR_PACKAGE_PATH_NOT_EXPORTED|ERR_INVALID_PACKAGE_TARGET/)
      return true
    }, deep)
  }
  // package.json is the frozen version truth.
  assert.equal(require('eyestruct/package.json').version, PKG.version)
})

// ---- 2. the env inventory -------------------------------------------------

test('env inventory: the live EYESTRUCT_* set is derived from source and pinned', () => {
  // Every captured surface that reads env inside the shipped package.
  const dirs = ['bin', 'lib'].map((d) => path.join(REPO, d))
  const live = new Set()
  const fsx = require('node:fs')
  for (const dir of dirs) {
    for (const f of fsx.readdirSync(dir)) {
      if (!f.endsWith('.js')) continue
      const src = fsx.readFileSync(path.join(dir, f), 'utf8')
      for (const m of src.matchAll(/EYESTRUCT_[A-Z_]+/g)) live.add(m[0])
    }
  }
  // The frozen naming: a new key must land here FIRST (docs/env.md row +
  // a battery note), never appear in code unannounced.
  const pinned = ['EYESTRUCT_AGENT', 'EYESTRUCT_BROWSER', 'EYESTRUCT_BUNDLE_CACHE', 'EYESTRUCT_COMMIT'].sort()
  assert.deepEqual([...live].sort(), pinned)
  // And each pinned key is a documented row on docs/env.md.
  const envPage = fsx.readFileSync(path.join(REPO, 'docs', 'env.md'), 'utf8')
  for (const key of pinned) assert.ok(envPage.includes(key), `docs/env.md must name ${key}`)
})

// ---- 3. the --json machine-output shapes ----------------------------------

test('json shapes: every browserless verb emits exactly the documented key set', () => {
  // Seeded eye home through the real init verb; each shape is snapshot as
  // a SORTED KEY LIST (shape, never values) - a field rename is a named
  // failure here, not a silent consumer break.
  const dir = tmpdir()
  run(['init', '--browser-image', 'contract:1', '--renderer', 'resvg@2.6.2'], dir)
  const eyes = path.join(dir, 'labs', '.eyes')
  fs.writeFileSync(path.join(eyes, 'ledger.json'), '[]')

  const shapes = {}
  shapes['ledger list'] = JSON.parse(run(['ledger', 'list', '--json'], dir).stdout || '[]')
  shapes['gate'] = JSON.parse(run(['gate', '--json', '--ledger', path.join(dir, 'labs', '.eyes', 'ledger.json'), '--manifest', path.join(dir, 'labs', '.eyes', 'manifest.yml')], dir).stdout)
  shapes['gate missing manifest'] = JSON.stringify(run(['gate', '--json', '--manifest', '/no/such/contract-m.yml'], dir).stderr || '')

  assert.equal(shapes['ledger list'].length, 0)
  // gate ok-shape keys, snapshot:
  const gateKeys = Object.keys(shapes['gate']).sort()
  assert.deepEqual(gateKeys, ['artifacts', 'ok', 'pin', 'rows', 'verdict'])
  // Refusals via --json keep the named line, not a json body: the output
  // contract says json rides SUCCESS shapes, stderr carries refusals.
  assert.match(shapes['gate missing manifest'], /eyestruct\[MISSING_MANIFEST\]/)

  // adopt --json returns the row it wrote (id, ts, agent, commit, type,
  // artifact, note, ratified) - the writer's row IS the machine answer.
  const row = JSON.parse(run(['adopt', 'home/current.png', '--note', 'shape leg', '--json'], dir).stdout)
  assert.deepEqual(Object.keys(row).sort(), ['agent', 'artifact', 'commit', 'id', 'note', 'ratified', 'ts', 'type'].sort())
  fs.rmSync(dir, { recursive: true, force: true })
})

// ---- 4. the schema jails --------------------------------------------------

test('manifest jail: a pin row / route row that breaks the subset refuses MANIFEST_CORRUPT', () => {
  const dir = tmpdir()
  run(['init', '--browser-image', 'jail:1', '--renderer', 'resvg@2.6.2'], dir)
  const mfile = path.join(dir, 'labs', '.eyes', 'manifest.yml')
  const original = fs.readFileSync(mfile, 'utf8')

  // A pin row that is not `key: value` (the parser's named shape error).
  fs.writeFileSync(mfile, original.replace('renderer: resvg@2.6.2', 'renderer resvg@2.6.2'))
  let r = run(['gate'], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /eyestruct\[MANIFEST_CORRUPT\]/)
  assert.match(r.stderr, /pin row not key: value/)

  // Missing pin key: the required-field refusal by name.
  fs.writeFileSync(mfile, original.replace('  renderer: resvg@2.6.2\n', ''))
  r = run(['gate'], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /pin\.renderer is required/)

  // A route row missing a required field names the fields it wants.
  fs.writeFileSync(mfile, original.replace('theme: dark', 'theme: '))
  r = run(['gate'], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /route row needs path\/view\/theme\/viewport/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('ledger jail: unreadable / non-array / missing-field / wave-shape / path-escape rows all refuse by name', () => {
  const dir = tmpdir()
  run(['init', '--browser-image', 'jail:1', '--renderer', 'resvg@2.6.2'], dir)
  const lfile = path.join(dir, 'labs', '.eyes', 'ledger.json')
  const row = { id: 'row-0001', ts: 1, agent: 'a', commit: 'c', artifact: 'home/current.png', type: 'adopt', note: 'n', ratified: false }

  // Unreadable JSON.
  fs.writeFileSync(lfile, '{not json')
  let r = run(['gate'], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /eyestruct\[LEDGER_CORRUPT\]/)

  // Not an array of rows.
  fs.writeFileSync(lfile, JSON.stringify({ rows: [] }))
  r = run(['gate'], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /not an array/)

  // A row missing a required field names the field.
  const { artifact, ...noArtifact } = row
  fs.writeFileSync(lfile, JSON.stringify([noArtifact]))
  r = run(['gate'], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /row row-0001 missing artifact/)

  // A wave without a useable artifacts array refuses its own way.
  const wave = { id: 'row-0002', ts: 2, agent: 'a', commit: 'c', type: 'wave', note: 'n', ratified: false, artifacts: [] }
  fs.writeFileSync(lfile, JSON.stringify([row, wave]))
  r = run(['gate'], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /wave without a useable artifacts array/)

  // A hand-edited absolute artifact path escapes the eyes home.
  fs.writeFileSync(lfile, JSON.stringify([{ ...row, artifact: '/etc/passwd' }]))
  r = run(['gate'], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /eyestruct\[UNSAFE_PATH\]/)
  fs.rmSync(dir, { recursive: true, force: true })
})
