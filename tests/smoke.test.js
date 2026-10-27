// Behavior-only smoke for the browserless spine: exit contract, ledger
// semantics, gate rules, raster honesty. Fixtures are temp dirs; no network,
// no browser. Run: npm test

'use strict'

const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync, spawnSync } = require('node:child_process')

const BIN = path.join(__dirname, '..', 'bin', 'eyestruct.js')

function run(argv, cwd) {
  let out
  try {
    out = { stdout: execFileSync(process.execPath, [BIN, ...argv], { cwd, encoding: 'utf8' }), code: 0 }
  } catch (err) {
    out = { stdout: err.stdout || '', stderr: err.stderr || '', code: err.status }
  }
  return out
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'eyestruct-test-'))
}

test('unknown command exits 1 with a named reason, not a stack trace', () => {
  const dir = tmpdir()
  const r = run(['frobnicate'], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /eyestruct\[UNKNOWN_COMMAND\]/)
  assert.ok(!/at /.test(r.stderr), 'no stack trace')
})

test('gate refuses honestly without a manifest (exit 2)', () => {
  const dir = tmpdir()
  const r = run(['gate'], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /eyestruct\[MISSING_MANIFEST\]/)
})

test('seed the default repo state in the manifest + empty ledger', () => {
  const dir = tmpdir()
  const r = run(['init', '--browser-image', 'test-image:1', '--renderer', 'resvg@2.6.2'], dir)
  assert.strictEqual(r.code, 0)
  const text = fs.readFileSync(path.join(dir, 'labs/.eyes', 'manifest.yml'), 'utf8')
  assert.match(text, /browser-image: test-image:1/)
  assert.match(text, /routes:/)
  assert.strictEqual(fs.readFileSync(path.join(dir, 'labs/.eyes', 'ledger.json'), 'utf8').trim(), '[]')
})

test('the init flag trap: a flag cannot occupy the next flag\'s value slot (BAD_FLAG_VALUE, nothing written)', () => {
  const dir = tmpdir()
  const r = run(['init', '--browser-image', '--renderer', 'r:1'], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /eyestruct\[BAD_FLAG_VALUE\]/)
  assert.match(r.stderr, /--renderer/)
  assert.strictEqual(fs.existsSync(path.join(dir, 'labs/.eyes', 'manifest.yml')), false, 'the refusal must not leave a pin behind')
})

test('adopt refuses a flag occupying the --note slot (ADOPT_NOTE_REQUIRED, no row)', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const r = run(['adopt', 'home/c.png', '--note', '--wave'], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /ADOPT_NOTE_REQUIRED/)
  const rows = JSON.parse(fs.readFileSync(path.join(dir, 'labs/.eyes', 'ledger.json'), 'utf8'))
  assert.strictEqual(rows.length, 0, 'no row written with a flag as its note')
})

test('ledger show without an id is a shape refusal, and a wrong id is ROW_MISSING (not DANGLING_ROW)', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const noId = run(['ledger', 'show'], dir)
  assert.strictEqual(noId.code, 1)
  assert.match(noId.stderr, /UNKNOWN_COMMAND/)
  assert.match(noId.stderr, /row id/)
  const miss = run(['ledger', 'show', 'row-9999'], dir)
  assert.strictEqual(miss.code, 1)
  assert.match(miss.stderr, /eyestruct\[ROW_MISSING\]/)
  assert.ok(!/DANGLING_ROW/.test(miss.stderr), 'a lookup miss must not borrow the dangling-artifact name')
})

test('gate passes on a fully explained seeded tree', () => {
  const dir = tmpdir()
  run(['init', '--browser-image', 't:1', '--renderer', 'r:1'], dir)
  fs.mkdirSync(path.join(dir, 'labs/.eyes', 'home', 'desktop-1280'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'labs/.eyes', 'home', 'desktop-1280', 'current.png'), 'not-a-real-png-but-file-exists')
  const ledger = path.join(dir, 'labs/.eyes', 'ledger.json')
  fs.writeFileSync(
    ledger,
    JSON.stringify([{ id: 'row-0001', ts: 1, agent: 't', commit: 'c', artifact: 'home/desktop-1280/current.png', type: 'look', note: 'seed' }]) + '\n',
  )
  const r = run(['gate'], dir)
  assert.strictEqual(r.code, 0, 'should pass with rows - got: ' + r.stderr)
  assert.match(r.stdout, /all explained/)
})

test('gate fails on an unexplained artifact (exit 1, UNRECORDED)', () => {
  const dir = tmpdir()
  run(['init', '--browser-image', 't:1', '--renderer', 'r:1'], dir)
  fs.mkdirSync(path.join(dir, 'labs/.eyes', 'home', 'desktop-1280'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'labs/.eyes', 'home', 'desktop-1280', 'current.png'), 'x')
  const r = run(['gate'], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /eyestruct\[UNRECORDED\]/)
  assert.match(r.stderr, /current\.png/)
})

test('gate fails on a dangling ledger row (exit 1)', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const ledger = path.join(dir, 'labs/.eyes', 'ledger.json')
  fs.writeFileSync(
    ledger,
    JSON.stringify([{ id: 'row-0001', ts: 1, agent: 't', commit: 'c', artifact: 'ghost/current.png', type: 'look', note: 'x' }]) + '\n',
  )
  const r = run(['gate'], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /DANGLING_ROW/)
})

test('corrupt ledger is a capability error (exit 2), never guessed past', () => {
  const dir = tmpdir()
  run(['init'], dir)
  fs.writeFileSync(path.join(dir, 'labs/.eyes', 'ledger.json'), '{not json')
  const r = run(['gate'], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /eyestruct\[LEDGER_CORRUPT\]/)
})

test('adopt without --note is refused (ADOPT_NOTE_REQUIRED)', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const r = run(['adopt', 'home/desktop-1280/current.png'], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /ADOPT_NOTE_REQUIRED/)
})

test('adopt with --note writes an unratified proposal row', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const r = run(['adopt', 'home/desktop-1280/current.png', '--note', 'rebuilt nav'], dir)
  assert.strictEqual(r.code, 0)
  assert.match(r.stdout, /proposed .* \(ratified:false\)/)
  const rows = JSON.parse(fs.readFileSync(path.join(dir, 'labs/.eyes', 'ledger.json'), 'utf8'))
  assert.strictEqual(rows.length, 1)
  assert.strictEqual(rows[0].ratified, false)
  assert.strictEqual(rows[0].type, 'adopt')
})

test('adopt note content comes through in list', () => {
  const dir = tmpdir()
  run(['init'], dir)
  run(['adopt', 'r/c.png', '--note', 'font change semantics'], dir)
  const r = run(['ledger', 'list'], dir)
  assert.match(r.stdout, /font change semantics/)
})

test('adopt --wave writes ONE wave row over N slots, gate counts each artifact explained', () => {
  const dir = tmpdir()
  run(['init', '--browser-image', 't:1', '--renderer', 'r:1'], dir)
  for (const slot of ['home/desktop-1280/dark', 'settings/tablet-1024/light']) {
    fs.mkdirSync(path.join(dir, 'labs/.eyes', slot), { recursive: true })
    fs.writeFileSync(path.join(dir, 'labs/.eyes', slot, 'current.png'), 'x')
  }
  const r = run(['adopt', 'home/desktop-1280/dark/current.png', 'settings/tablet-1024/light/current.png', '--wave', '--note', 'font bump re-rendered both waves'], dir)
  assert.strictEqual(r.code, 0, 'wave adopt should pass - got: ' + r.stderr)
  const rows = JSON.parse(fs.readFileSync(path.join(dir, 'labs/.eyes', 'ledger.json'), 'utf8'))
  assert.strictEqual(rows.length, 1, 'one wave row, not an N-row echo')
  assert.strictEqual(rows[0].type, 'wave')
  assert.strictEqual(rows[0].artifacts.length, 2)
  const g = run(['gate'], dir)
  assert.strictEqual(g.code, 0, 'both wave artifacts explained - got: ' + g.stderr)
  const list = run(['ledger', 'list'], dir)
  assert.match(list.stdout, /font bump/)

  // The wave chasing rule: a wave row's artifacts must exist on disk.
  const ghost = structuredClone(rows)
  ghost[0].artifacts.push('ghost/current.png')
  fs.writeFileSync(path.join(dir, 'labs/.eyes', 'ledger.json'), JSON.stringify(ghost, null, 2) + '\n')
  const g2 = run(['gate'], dir)
  assert.strictEqual(g2.code, 1)
  assert.match(g2.stderr, /DANGLING_ROW/)
})

test('UNSAFE_PATH: a ledger row that escapes the eyes home is refused on read (exit 1, named)', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const ledger = path.join(dir, 'labs/.eyes', 'ledger.json')
  fs.writeFileSync(
    ledger,
    JSON.stringify([{ id: 'row-0001', ts: 1, agent: 't', commit: 'c', artifact: '../outside/steal.png', type: 'look', note: 'x' }]) + '\n',
  )
  const r = run(['gate'], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /eyestruct\[UNSAFE_PATH\]/)
  assert.match(r.stderr, /outside\/steal\.png/)
})

test('UNSAFE_PATH: adopt refuses an escaping adopt target on write (exit 1, named)', () => {
  const dir = tmpdir()
  run(['init'], dir)
  for (const bad of ['../outside.png', '/etc/passwd']) {
    const r = run(['adopt', bad, '--note', 'escape attempt'], dir)
    assert.strictEqual(r.code, 1, `escaping artifact ${bad} must be refused`)
    assert.match(r.stderr, /eyestruct\[UNSAFE_PATH\]/)
    const rows = JSON.parse(fs.readFileSync(path.join(dir, 'labs/.eyes', 'ledger.json'), 'utf8'))
    assert.strictEqual(rows.length, 0, 'the refusal must not leave a row behind')
  }
})

test('UNSAFE_PATH: a wave row carrying an escaping artifact rides the same guard', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const ledger = path.join(dir, 'labs/.eyes', 'ledger.json')
  fs.writeFileSync(
    ledger,
    JSON.stringify([{ id: 'row-0001', ts: 1, agent: 't', commit: 'c', type: 'wave', note: 'x', artifacts: ['ok/current.png', '..//escape'] }]) + '\n',
  )
  const r = run(['gate'], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /UNSAFE_PATH/)
})

test('a wave row without a useable artifacts array is a corrupt ledger (exit 2)', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const ledger = path.join(dir, 'labs/.eyes', 'ledger.json')
  fs.writeFileSync(ledger, JSON.stringify([{ id: 'row-0001', ts: 1, agent: 't', commit: 'c', type: 'wave', note: 'x' }]) + '\n')
  const r = run(['gate'], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /LEDGER_CORRUPT/)
  const rJson = run(['gate', '--json'], dir)
  assert.strictEqual(rJson.code, 2)
})

test('raster refuses honestly without a renderer (exit 2), never fake-passes', () => {
  const dir = tmpdir()
  const stone = path.join(__dirname, '..', 'horcrux', 'magpie-p_mirror-eyes-2026.svg')
  const r = run(['raster', stone], dir)
  // Either a renderer is present (0) or the named refusal (2) - never
  // a silent pass or a stack trace.
  if (r.code === 0) assert.match(r.stdout, /raster OK/)
  else {
    assert.strictEqual(r.code, 2)
    assert.match(r.stderr, /MISSING_RENDER/)
  }
})

// The RASTER_BAD_XML receipt needs sight: the invalid-XML verdict is
// detected by the render attempt itself, so a renderer-less machine can
// only refuse MISSING_RENDER - asserting exit 1 there would be a guessed
// verdict, exactly what the battery refuses to do. Honest skip, same
// doctrine as the browser-class skips.
function rendererAvailable() {
  try {
    require.resolve('@resvg/resvg-js')
    return true
  } catch {
    return false
  }
}
const maybeRenderer = rendererAvailable() ? test : test.skip

maybeRenderer('raster catches invalid XML with a named code (the unrenderable-stone receipt)', () => {
  const dir = tmpdir()
  const bad = path.join(dir, 'bad.svg')
  fs.writeFileSync(bad, '<svg note="<in-attr>"></svg>not-xml')
  const r = run(['raster', bad], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /RASTER_BAD_XML/)
})

test('MISSING_INPUT: a stated input that does not exist is a named refusal (exit 2), not the internal-error fallback', () => {
  const dir = tmpdir()
  const r = run(['raster', path.join(dir, 'ghost.svg')], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /eyestruct\[MISSING_INPUT\]/)
  assert.match(r.stderr, /ghost\.svg/)
  assert.ok(!/internal error/.test(r.stderr), 'never the generic fallback anymore')
})

test('MISSING_INPUT: a stated input that is a directory refuses by name too', () => {
  const dir = tmpdir()
  const r = run(['raster', dir], dir)
  assert.strictEqual(r.code, 2)
  assert.match(r.stderr, /eyestruct\[MISSING_INPUT\]/)
})

test('--help prints usage and exits 0', () => {
  const r = run(['--help'], tmpdir())
  assert.strictEqual(r.code, 0)
  assert.match(r.stdout, /eyestruct v/)
})

test("C1 carry: leading global flags dispatch the verb (issue #3's probe receipts, as tests)", () => {
  const dir = tmpdir()
  run(['init'], dir)
  const manifest = path.join(dir, 'labs/.eyes', 'manifest.yml')

  const frontGate = run(['--manifest', manifest, 'gate'], dir)
  assert.strictEqual(frontGate.code, 0, 'leading --manifest dispatches gate - got: ' + frontGate.stderr)
  assert.match(frontGate.stdout, /gate:/)

  const jsonFront = run(['--json', 'ledger', 'list'], dir)
  assert.strictEqual(jsonFront.code, 0, 'leading --json dispatches ledger list - got: ' + jsonFront.stderr)

  const missing = run(['--manifest', '/no/such/c1-probe.yml', 'gate'], dir)
  assert.strictEqual(missing.code, 2, 'leading flags resolve the manifest by name, same exit class as the postfix shape')
  assert.match(missing.stderr, /eyestruct\[MISSING_MANIFEST\]/)

  const bogus = run(['--bogus', 'gate'], dir)
  assert.strictEqual(bogus.code, 1)
  assert.match(bogus.stderr, /eyestruct\[UNKNOWN_COMMAND\]/)

  const noVerb = run(['--manifest', 'gate'], dir)
  assert.strictEqual(noVerb.code, 1)
  assert.match(noVerb.stderr, /no verb followed the leading flags/)

  const joinedEmpty = run(['--ledger=', 'gate'], dir)
  assert.strictEqual(joinedEmpty.code, 1)
  assert.match(joinedEmpty.stderr, /eyestruct\[UNKNOWN_COMMAND\]/)

  const helpAfter = run(['--json', '--help'], dir)
  assert.strictEqual(helpAfter.code, 0)
  assert.match(helpAfter.stdout, /eyestruct v/)
})

test('--version is a leading global: package.json stays the single version truth', () => {
  const dir = tmpdir()
  run(['init'], dir)

  const bare = run(['--version'], dir)
  assert.strictEqual(bare.code, 0, 'got: ' + bare.stderr)
  assert.match(bare.stdout.trim(), /^\d+\.\d+\.\d+$/, 'a bare dotted semver, nothing else - got: ' + JSON.stringify(bare.stdout))

  const pkg = require('../package.json')
  assert.strictEqual(bare.stdout.trim(), pkg.version, 'the printed version equals package.json exactly (the manifest-pin lesson, one truth source)')

  // A trailing verb after --version is fine, like --help passthrough.
  const withVerb = run(['--version', 'gate'], dir)
  assert.strictEqual(withVerb.code, 0)
  assert.match(withVerb.stdout.trim(), /^\d+\.\d+\.\d+$/)

  // The hostile leading-token window still refuses everything else.
  const bogus = run(['--bogus-version', 'gate'], dir)
  assert.strictEqual(bogus.code, 1)
  assert.match(bogus.stderr, /eyestruct\[UNKNOWN_COMMAND\]/)
})

// -- Wired engine seam (the pinned browser landed). These use the exec the
// machine already has cached; if it is absent the tests skip honestly.

const engine = require('../lib/engine')

function browserAvailable() {
  try {
    engine.findExec({ argv: [], pin: {} })
    return true
  } catch {
    return false
  }
}

const FIXTURE = 'file://' + path.join(__dirname, 'fixtures', 'look-fixture.html')

const maybeBrowser = browserAvailable() ? test : test.skip

maybeBrowser('look captures real pixels + element map from ONE pass', async () => {
  const cap = await engine.capture({ url: FIXTURE, argv: [], pin: {}, viewport: '800x600' })
  assert.ok(cap.png.length > 1024, 'non-skeletal frame')
  assert.strictEqual(Buffer.from(cap.png).toString('ascii', 1, 4), 'PNG')
  const ids = cap.map.map((e) => e.id).sort()
  assert.deepStrictEqual(ids, ['hero', 'ledger-card', 'search'])
  for (const e of cap.map) {
    assert.ok(e.rect.w > 0 && e.rect.h > 0, `#rect on ${e.id}`)
  }
})

maybeBrowser('region crop returns the cheap layer only', async () => {
  const cap = await engine.capture({ url: FIXTURE, argv: [], pin: {}, viewport: '800x600', region: '#search' })
  const ids = cap.map.map((e) => e.id)
  assert.ok(ids.includes('search'))
  assert.ok(!ids.includes('hero'), 'full-frame artifacts do not flood a region look')
})

maybeBrowser('look verb writes a candidate and leaves the ledger untouched', async () => {
  const dir = tmpdir()
  run(['init'], dir)
  const r = run(['look', FIXTURE, '--viewport', '800x600'], dir)
  assert.strictEqual(r.code, 0)
  const cands = fs.readdirSync(path.join(dir, 'labs/.eyes-candidates')).filter((f) => f.endsWith('.png'))
  assert.strictEqual(cands.length, 1)
  assert.deepStrictEqual(fs.readFileSync(path.join(dir, 'labs/.eyes', 'ledger.json'), 'utf8').trim(), '[]')
})

maybeBrowser('diff without a baseline refuses with a named code (exit 1)', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const r = run(['diff', FIXTURE], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /eyestruct\[NO_BASELINE\]/)
})

test('engine refuses honestly when the exec resolution finds nothing', () => {
  assert.throws(() => engine.findExec({ argv: ['--browser-exec', '/no/such/chrome'], pin: {} }), (err) => {
    return /MISSING_PINNED_BROWSER|browser exec not found/.test(err.message)
  })
})

// -- The bundle lane (issue #4): sha256-anchored, one unpack, verified on use.

const bundleLib = require('../lib/bundle')

function makeBundleTarball(fixtures) {
  const dir = tmpdir()
  const name = Object.keys(fixtures)[0]
  fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
  for (const [rel, body] of Object.entries(fixtures)) {
    fs.writeFileSync(path.join(dir, rel), body)
  }
  const gz = path.join(dir, 'bundle.tgz')
  const t = spawnSync('tar', ['-czf', gz, '-C', dir, name], { encoding: 'utf8' })
  assert.strictEqual(t.status, 0, 'tar must pack the fixture bundle: ' + t.stderr)
  return gz
}

test('bundle lane: install records bundle@<sha16>, the engine resolves it before the cache, and reuse is receipted', () => {
  const cache = tmpdir()
  const gz = makeBundleTarball({ 'chrome-linux64/chrome': '#!/bin/sh\necho fake-chrome', 'chrome-linux64/chrome2': 'not-an-exec' })
  const prev = process.env.EYESTRUCT_BUNDLE_CACHE
  process.env.EYESTRUCT_BUNDLE_CACHE = cache
  try {
    const dir = tmpdir()
    const r = run(['init', '--browser-bundle', gz], dir)
    assert.strictEqual(r.code, 0, 'got: ' + r.stderr)
    assert.match(r.stdout, /installed bundle\.tgz/)
    assert.match(r.stdout, /exec.*chrome-linux64\/chrome/, 'the shallowest chrome is the receipt')
    const manifest = fs.readFileSync(path.join(dir, 'labs/.eyes', 'manifest.yml'), 'utf8')
    const mm = /browser-bundle: bundle@([0-9a-f]{16})/.exec(manifest)
    assert.ok(mm, 'the pin carries bundle@<sha16>:\n' + manifest)

    const exec = engine.findExec({ argv: [], pin: { 'browser-bundle': 'bundle@' + mm[1] } })
    assert.strictEqual(fs.existsSync(exec), true, 'the resolved exec exists')
    assert.ok(exec.includes(path.join(cache, mm[1])), 'the exec resolves inside the checksummed cache dir')

    // Idempotent: a second install with the same tarball reuses the cache
    // dir (receipt says so) and never re-unpacks - and init preserves the
    // route matrix it did not seed (the bundle-seed CI step's live need).
    const beforeManifest = fs.readFileSync(path.join(dir, 'labs/.eyes', 'manifest.yml'), 'utf8')
    const r2 = run(['init', '--browser-bundle', gz], dir)
    assert.strictEqual(r2.code, 0, 'got: ' + r2.stderr)
    assert.match(r2.stdout, /reused bundle\.tgz/)
    const afterManifest = fs.readFileSync(path.join(dir, 'labs/.eyes', 'manifest.yml'), 'utf8')
    assert.match(afterManifest, /^pin:\n  browser-image: UNSET-edit-me/m, 'the pin is preserved, not reset to nothing')
    assert.match(afterManifest, /^routes:/m, 'the route matrix survives a bundle-only re-seed')
    assert.strictEqual(
      afterManifest.slice(0, afterManifest.indexOf('browser-bundle:')),
      beforeManifest.slice(0, beforeManifest.indexOf('browser-bundle:')),
      'everything before the bundle row is byte-identical through a bundle-only re-init',
    )
  } finally {
    if (prev === undefined) delete process.env.EYESTRUCT_BUNDLE_CACHE
    else process.env.EYESTRUCT_BUNDLE_CACHE = prev
  }
})

test('bundle lane: tampered integrity marker refuses by name; a chrome-less bundle is a capability truth', () => {
  const cache = tmpdir()
  const gz = makeBundleTarball({ 'chrome-linux/chrome': 'fake twice' })
  const prev = process.env.EYESTRUCT_BUNDLE_CACHE
  process.env.EYESTRUCT_BUNDLE_CACHE = cache
  try {
    const dir = tmpdir()
    const r = run(['init', '--browser-bundle', gz], dir)
    assert.strictEqual(r.code, 0, 'got: ' + r.stderr)
    const prefix = /browser-bundle: bundle@([0-9a-f]{16})/.exec(
      fs.readFileSync(path.join(dir, 'labs/.eyes', 'manifest.yml'), 'utf8'))[1]

    // The cache is tampered: marker now disagrees with the recording.
    fs.writeFileSync(path.join(cache, prefix, bundleLib.MARKER), 'f'.repeat(64) + '\n')
    assert.throws(
      () => engine.findExec({ argv: [], pin: { 'browser-bundle': 'bundle@' + prefix } }),
      (err) => /MISSING_PINNED_BROWSER|integrity marker/.test(err.message),
    )

    // A malformed pin recording is a manifest truth, never a guessed exec.
    assert.throws(() => engine.findExec({ argv: [], pin: { 'browser-bundle': 'nonsense' } }), (err) => /MANIFEST_CORRUPT/.test(err.message))
  } finally {
    if (prev === undefined) delete process.env.EYESTRUCT_BUNDLE_CACHE
    else process.env.EYESTRUCT_BUNDLE_CACHE = prev
  }
})

test('bundle lane: a chrome SYMLINK in the archive is refused - the executor can only be a regular file', () => {
  const prev = process.env.EYESTRUCT_BUNDLE_CACHE
  process.env.EYESTRUCT_BUNDLE_CACHE = tmpdir()
  try {
    const dir = tmpdir()
    fs.mkdirSync(path.join(dir, 'chrome-linux64'), { recursive: true })
    fs.symlinkSync('/bin/true', path.join(dir, 'chrome-linux64', 'chrome'), 'file')
    fs.writeFileSync(path.join(dir, 'chrome-linux64', 'wrapper.sh'), 'placeholder')
    const gz = path.join(dir, 'symlink-bundle.tgz')
    const t = spawnSync('tar', ['-czf', gz, '-C', dir, 'chrome-linux64'], { encoding: 'utf8' })
    assert.strictEqual(t.status, 0)
    const r = run(['init', '--browser-bundle', gz], dir)
    assert.strictEqual(r.code, 2, 'got: ' + r.stderr)
    assert.match(r.stderr, /eyestruct\[MISSING_PINNED_BROWSER\]/)
    assert.match(r.stderr, /no chrome exec/)
  } finally {
    if (prev === undefined) delete process.env.EYESTRUCT_BUNDLE_CACHE
    else process.env.EYESTRUCT_BUNDLE_CACHE = prev
  }
})

test('bundle lane: a missing tarball is MISSING_INPUT, a chrome-less archive is a named capability refusal', () => {
  const prev = process.env.EYESTRUCT_BUNDLE_CACHE
  process.env.EYESTRUCT_BUNDLE_CACHE = tmpdir()
  try {
    const dir = tmpdir()
    const r = run(['init', '--browser-bundle', '/no/such/bundle.tgz'], dir)
    assert.strictEqual(r.code, 2)
    assert.match(r.stderr, /eyestruct\[MISSING_INPUT\]/)

    const plain = tmpdir()
    fs.writeFileSync(path.join(plain, 'not-chrome.txt'), 'x')
    const gz = path.join(plain, 'plain.tgz')
    spawnSync('tar', ['-czf', gz, '-C', plain, 'not-chrome.txt'], { encoding: 'utf8' })
    const r2 = run(['init', '--browser-bundle', gz], plain)
    assert.strictEqual(r2.code, 2)
    assert.match(r2.stderr, /eyestruct\[MISSING_PINNED_BROWSER\]/)
    assert.match(r2.stderr, /no chrome exec/)
  } finally {
    if (prev === undefined) delete process.env.EYESTRUCT_BUNDLE_CACHE
    else process.env.EYESTRUCT_BUNDLE_CACHE = prev
  }
})

test('bundle lane: the fd pin - a path swap after open cannot change the bytes the install receipts', () => {
  const prev = process.env.EYESTRUCT_BUNDLE_CACHE
  process.env.EYESTRUCT_BUNDLE_CACHE = tmpdir()
  try {
    const gzA = makeBundleTarball({ 'chrome-linux64/chrome': 'fake-chrome-from-the-opened-tarball' })

    // A genuine second tarball: same shape, genuinely different bytes.
    const other = tmpdir()
    fs.mkdirSync(path.join(other, 'chrome-linux64'), { recursive: true })
    fs.writeFileSync(path.join(other, 'chrome-linux64', 'chrome'), 'evil-chrome-never-extracted')
    const gzB = path.join(other, 'b.tgz')
    const tb = spawnSync('tar', ['-czf', gzB, '-C', other, 'chrome-linux64'], { encoding: 'utf8' })
    assert.strictEqual(tb.status, 0)
    assert.notStrictEqual(fs.readFileSync(gzA).toString('hex'), fs.readFileSync(gzB).toString('hex'),
      'the two tarballs must differ - otherwise the leg proves nothing (sanity)')

    // The classic hash-then-extract race panel, staged deterministically:
    // open A once, THEN swap the directory entry to B's inode. The old order
    // would hash A and extract B; the fd pin feeds tar the A file description
    // end to end, so the cache can only ever carry A's bytes.
    const fd = fs.openSync(gzA, 'r')
    fs.renameSync(gzB, gzA)
    const r = bundleLib.installOpen(fd, gzA)
    assert.strictEqual(path.basename(r.exec), 'chrome', 'the install receipt points at the exec')
    assert.strictEqual(fs.readFileSync(r.exec, 'utf8'), 'fake-chrome-from-the-opened-tarball',
      'the extracted bytes are the OPENED tarball, not the swapped one')
    assert.match(r.sha, /^[0-9a-f]{64}$/)

    // The swapped-in tarball installs under ITS OWN checksum when installed
    // from its new path (the rename moved it there) - the cache dirs stay
    // checksum-isolated (the same isolation the pack ledgers verify), so no
    // mixed receipt can exist.
    const rb = bundleLib.install(gzA)
    assert.notStrictEqual(rb.sha, r.sha, 'the swapped-in bytes hash differently from the opened ones')
    assert.strictEqual(fs.readFileSync(rb.exec, 'utf8'), 'evil-chrome-never-extracted')
  } finally {
    if (prev === undefined) delete process.env.EYESTRUCT_BUNDLE_CACHE
    else process.env.EYESTRUCT_BUNDLE_CACHE = prev
  }
})

test('bundle lane: sha256Fd lives on positioned reads - one fd can hash, then extract, without an offset jump', () => {
  const gz = makeBundleTarball({ 'chrome-linux64/chrome': 'offset-invariant-fixture' })
  const fd = fs.openSync(gz, 'r')
  try {
    const h1 = bundleLib.sha256Fd(fd)
    const h2 = bundleLib.sha256Fd(fd)
    assert.strictEqual(h2, h1, 'a second pass over the fd sees byte 0 again - the shared offset never advanced')
    assert.strictEqual(bundleLib.sha256File(gz), h1, 'the fd hash matches the path hash byte for byte')
  } finally {
    fs.closeSync(fd)
  }
})

test('engine rejects a malformed viewport with a named code', () => {
  assert.throws(() => engine.parseViewport('wide'), /BAD_VIEWPORT/)
  assert.throws(() => engine.parseViewport('10x10'), /BAD_VIEWPORT/)
})

test('sandbox policy: root keeps --no-sandbox, non-root tries chrome\'s own sandbox first with one named retry', () => {
  assert.deepStrictEqual(engine.launchAttempts(true), [true], 'root: flag on from the start')
  assert.deepStrictEqual(engine.launchAttempts(false), [false, true], 'non-root: sandbox live first, flag as the fallback')
})

test('mcp: a bare null frame is refused by a named -32600 reply, and the server keeps answering', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const { responses } = callMcp(dir, [
    null,
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  ])
  const refusal = responses.find((m) => m.error)
  assert.ok(refusal, 'the null frame gets a JSON-RPC error reply, not a dead server')
  assert.strictEqual(refusal.error.code, -32600)
  const census = responses.find((m) => m.id === 2)
  assert.ok(census && census.result.tools.length > 0, 'the server is still alive after the hostile frame')
})

test('mcp: tools/call without a params object is a named -32602 refusal, not a crash', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const { responses } = callMcp(dir, [
    { jsonrpc: '2.0', id: 9, method: 'tools/call' },
    { jsonrpc: '2.0', id: 10, method: 'tools/list', params: {} },
  ])
  const refusal = responses.find((m) => m.id === 9)
  assert.strictEqual(refusal.result.isError, true)
  assert.match(refusal.result.content[0].text, /params object/)
  const census = responses.find((m) => m.id === 10)
  assert.ok(census && census.result.tools.length > 0, 'the server survived the paramless call')
})

maybeBrowser('look refuses a theme outside dark|light with a named code', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const r = run(['look', FIXTURE, '--theme', 'sepia'], dir)
  assert.strictEqual(r.code, 1)
  assert.match(r.stderr, /BAD_THEME/)
})

// -- MCP surface: same call surface, JSON-RPC over stdio. Framing tests,
// not transport worship: handshake, tool census, silent notifications,
// named reasons as tool errors, and stdout capture (a CLI print inside the
// transport would arrive as a parse error on the client).

function callMcp(cwd, messages) {
  const { spawnSync } = require('node:child_process')
  const stdin = messages.map((m) => JSON.stringify(m) + '\n').join('')
  const r = spawnSync(process.execPath, [BIN, 'mcp'], { cwd, input: stdin, encoding: 'utf8' })
  const responses = []
  for (const line of String(r.stdout || '').trim().split('\n')) {
    if (!line) continue
    responses.push(JSON.parse(line))
  }
  return { responses, code: r.status }
}

maybeBrowser('mcp: handshake + tool census + named reason as tool error', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const { responses } = callMcp(dir, [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'adopt', arguments: { artifact: 'home/x.png' } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'ledger_list', arguments: {} } },
  ])
  const init = responses.find((m) => m.id === 1)
  assert.strictEqual(init.result.serverInfo.name, 'eyestruct')
  assert.ok(init.result.capabilities.tools)
  const census = responses.find((m) => m.id === 2)
  const names = census.result.tools.map((t) => t.name)
  for (const expected of ['look', 'diff', 'adopt', 'ratify', 'gate', 'raster', 'walk', 'ledger_list', 'ledger_show']) {
    assert.ok(names.includes(expected), `tool ${expected} missing from census`)
  }
  const adoptNoNote = responses.find((m) => m.id === 3)
  assert.strictEqual(adoptNoNote.result.isError, true)
  assert.match(adoptNoNote.result.content[0].text, /ADOPT_NOTE_REQUIRED/)
  const ledger = responses.find((m) => m.id === 4)
  assert.ok(!ledger.result.isError, 'happy-path tool calls never set isError')
  assert.strictEqual(JSON.parse(ledger.result.content[0].text).length, 0)
})

maybeBrowser('mcp: gate output is captured, never written raw into the transport', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const { responses } = callMcp(dir, [
    { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'gate', arguments: {} } },
  ])
  const gate = responses.find((m) => m.id === 7)
  assert.ok(!gate.result.isError)
  const text = JSON.parse(gate.result.content[0].text)
  assert.strictEqual(text.code, 0)
  assert.match(String(text.gate.verdict || ''), /all explained/)
})

maybeBrowser('ratify: byte-identical slots ride append-only rows; drift is named, never edited', () => {
  const dir = tmpdir()
  run(['init'], dir)
  const r1 = run(['look', FIXTURE, '--viewport', '800x600'], dir)
  assert.strictEqual(r1.code, 0)
  const cand = fs.readdirSync(path.join(dir, 'labs/.eyes-candidates')).find((f) => f.endsWith('.png'))
  const slotDir = path.join(dir, 'labs/.eyes')
  // tamper: a DIFFERENT baseline must be un-verifiable, not auto-adopted
  fs.writeFileSync(path.join(slotDir, 'hand-write-tampered.png'), Buffer.alloc(2048, 7))
  run(['adopt', 'hand-write-tampered.png', '--note', 'a tampered canon row the pinned env cannot reproduce'], dir)
  const r = run(['ratify', 'file:///nowhere.anchor'], dir)
  // The manifest's seeded route path (/) does not resolve on file:// ->
  // capture fails per-surface; what must hold is that NOTHING was ratified
  // and the exit contract named the drift, with the ledger append-only.
  assert.ok([0, 1].includes(r.code))
  const ledger = JSON.parse(fs.readFileSync(path.join(dir, 'labs/.eyes', 'ledger.json'), 'utf8'))
  assert.ok(!ledger.some((row) => row.type === 'ratify'), 'ratify must not forge proof rows for drifted canon')
})
