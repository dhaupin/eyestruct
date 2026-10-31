// The release-verify leg (tests/release-verify.test.js): the pack ladder
// of scripts/verify-release.cjs exercised EVERY push - the same script the
// publish lane's verify job runs on the served tarball. This commissioned
// the 1.0.0 cut's honest gap: publish CAN go green while nothing asserts
// the tarball between proof-of-publish and proof-of-work (the walk-exit
// rule: the probe is now permanent).
//
// Case 1 (positive): npm pack of THIS tree -> the pack ladder -> everything
//   PASS. The consumer-install half depends on the npm registry (the packed
//   runtime deps); when offline, the script prints a named SKIP - the leg
//   asserts "no silent skip", not "always network".
// Case 2 (negative, fully offline): a doctored tarball carrying a file
//   under a forbidden prefix (labs/) is refused BY NAME, before any
//   install - a smuggled file can never ship as a mystery.

'use strict'

const test = require('node:test')
const assert = require('node:assert')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const script = path.join(root, 'scripts', 'verify-release.cjs')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

// Eyestruct's own rules arrive as flags, derived from source - the script
// carries none of them (the generic-core rule): the exports keys pin comes
// from the checkout's package.json, and the adapter-contract probe is the
// frozen consumer marker this repo's install must answer.
const exportsKeys = Object.keys(pkg.exports).join(',')
const eyeProbe = "const p=require('eyestruct');if(p.ADAPTER_CONTRACT!=='eyestruct-adapter@1')process.exit(1);if(!Array.isArray(p.reasonCodes)||!p.reasonCodes.length)process.exit(1)"

function packTree(dest) {
  // npm pack of the repo root: the same files npm publish will include
  // (prepublishOnly is NOT a pack hook - the pack list is judged as one).
  const r = spawnSync('npm', ['pack', '--pack-destination', dest], {
    cwd: root, encoding: 'utf8', timeout: 120000,
  })
  assert.equal(r.status, 0, `npm pack failed: ${r.stderr}`)
  const tgz = path.join(dest, `eyestruct-${pkg.version}.tgz`)
  assert.ok(fs.existsSync(tgz), `npm pack produced nothing at ${tgz}`)
  return tgz
}

function run(args) {
  return spawnSync('node', [script, ...args], { cwd: root, encoding: 'utf8', timeout: 300000 })
}

// The generic-core proof (walk WL-7 commissioned): the same script file,
// run from a FOREIGN repo's root against that repo's own tarball, must
// verify everything with ZERO edits to the script. The toy repo has its
// own name, version, main entry, and bin - none of which the script knows
// in advance; everything it asserts is derived from the caller's tree and
// the tarball's package.json.
test('the generic core verifies a foreign repo with zero edits to the script', () => {
  const toy = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-release-toy-'))
  fs.writeFileSync(path.join(toy, 'package.json'), JSON.stringify({
    name: 'toy-verify',
    version: '4.2.0',
    main: 'index.js',
    bin: { 'toy-verify': 'bin.js' },
    files: ['index.js', 'bin.js'],
  }, null, 2))
  fs.writeFileSync(path.join(toy, 'index.js'), "module.exports = { marker: 'toy-verify@1' }\n")
  fs.writeFileSync(path.join(toy, 'bin.js'), '#!/usr/bin/env node\nconsole.log(process.argv.includes(\'--version\') ? \'4.2.0\' : \'4.2.0\')\n')
  const r = spawnSync('npm', ['pack', '--pack-destination', toy], { cwd: toy, encoding: 'utf8', timeout: 120000 })
  assert.equal(r.status, 0, `toy npm pack failed: ${r.stderr}`)
  const tgz = path.join(toy, 'toy-verify-4.2.0.tgz')
  // cwd is the TOY repo: the caller's tree is the one judged.
  const rv = spawnSync('node', [script, '--pack', tgz, '--version', '4.2.0'], { cwd: toy, encoding: 'utf8', timeout: 300000 })
  const out = `${rv.stdout}\n${rv.stderr}`
  assert.equal(rv.status, 0, `generic ladder failed on the toy repo (${rv.status}):\n${out}`)
  assert.ok(out.includes('PASS identity: toy-verify@4.2.0'), `toy identity missing:\n${out}`)
  assert.ok(out.includes('PASS consumer probes (1)'), `the toy's version probe never ran:\n${out}`)
  assert.ok(out.includes('PASS installed bin toy-verify --version -> 4.2.0'), `the toy's bin was never probed:\n${out}`)
  fs.rmSync(toy, { recursive: true, force: true })
})

// The caller's own forbidden list is a flag, not an edit: a prefix the
// family defaults don't name must still be refused BY NAME when the
// adopting repo states it.
test('a caller-stated --forbidden prefix refuses a smuggle the defaults miss', () => {
  const toy = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-release-toy2-'))
  fs.writeFileSync(path.join(toy, 'package.json'), JSON.stringify({
    name: 'toy-verify',
    version: '4.2.0',
    main: 'index.js',
    files: ['index.js'],
  }, null, 2))
  fs.writeFileSync(path.join(toy, 'index.js'), "module.exports = 1\n")
  const r = spawnSync('npm', ['pack', '--pack-destination', toy], { cwd: toy, encoding: 'utf8', timeout: 120000 })
  assert.equal(r.status, 0, `toy npm pack failed: ${r.stderr}`)
  fs.mkdirSync(path.join(toy, 'secrets'), { recursive: true })
  fs.writeFileSync(path.join(toy, 'secrets', 'private.txt'), 'must never ship\n')
  // Manually splice the smuggle into the tarball (npm pack would exclude
  // it via the files field) - the threat is a file, not a broken archive.
  const ex = path.join(toy, 'extracted')
  fs.mkdirSync(ex, { recursive: true })
  const unt = spawnSync('tar', ['-xzf', path.join(toy, 'toy-verify-4.2.0.tgz'), '-C', ex], { encoding: 'utf8' })
  assert.equal(unt.status, 0, `unpack failed: ${unt.stderr}`)
  fs.mkdirSync(path.join(ex, 'package', 'secrets'), { recursive: true })
  fs.writeFileSync(path.join(ex, 'package', 'secrets', 'private.txt'), 'must never ship\n')
  const doctored = path.join(toy, 'doctored.tgz')
  const repack = spawnSync('tar', ['-czf', doctored, '-C', path.join(ex, 'package'), '.'], { encoding: 'utf8' })
  assert.equal(repack.status, 0, `repack failed: ${repack.stderr}`)
  // The default list does NOT name secrets/ - without the flag it passes
  // the scan (and only trips the expected-set mismatch); WITH the caller's
  // flag it is refused by name.
  const withFlag = spawnSync('node', [script, '--pack', doctored, '--version', '4.2.0', '--forbidden', 'secrets/'], { cwd: toy, encoding: 'utf8', timeout: 300000 })
  const flaggedOut = `${withFlag.stdout}\n${withFlag.stderr}`
  assert.equal(withFlag.status, 1, `the caller's forbidden flag did not bite (${withFlag.status}):\n${flaggedOut}`)
  assert.ok(flaggedOut.includes('secrets/private.txt'), `the refusal does not name the smuggle:\n${flaggedOut}`)
  fs.rmSync(toy, { recursive: true, force: true })
})

test('--allowed de-asserts a default-forbidden prefix (vant ships web/ as product)', () => {
  const toy = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-release-toy3-'))
  fs.writeFileSync(path.join(toy, 'package.json'), JSON.stringify({
    name: 'toy-verify',
    version: '4.2.0',
    main: 'index.js',
    files: ['index.js'],
  }, null, 2))
  fs.writeFileSync(path.join(toy, 'index.js'), "module.exports = 1\n")
  const r = spawnSync('npm', ['pack', '--pack-destination', toy], { cwd: toy, encoding: 'utf8', timeout: 120000 })
  assert.equal(r.status, 0, `toy npm pack failed: ${r.stderr}`)
  // Splice a file under web/ (a family default) into the tarball. This is
  // the vant shape: web/ legitimately rides the runtime tarball there.
  const ex = path.join(toy, 'extracted')
  fs.mkdirSync(ex, { recursive: true })
  const unt = spawnSync('tar', ['-xzf', path.join(toy, 'toy-verify-4.2.0.tgz'), '-C', ex], { encoding: 'utf8' })
  assert.equal(unt.status, 0, `unpack failed: ${unt.stderr}`)
  fs.mkdirSync(path.join(ex, 'package', 'web'), { recursive: true })
  fs.writeFileSync(path.join(ex, 'package', 'web', 'app.js'), '// ships as product\n')
  const doctored = path.join(toy, 'doctored.tgz')
  const repack = spawnSync('tar', ['-czf', doctored, '-C', path.join(ex, 'package'), '.'], { encoding: 'utf8' })
  assert.equal(repack.status, 0, `repack failed: ${repack.stderr}`)
  // WITHOUT the flag, web/ is refused by name (the default still bites).
  const without = spawnSync('node', [script, '--pack', doctored, '--version', '4.2.0'], { cwd: toy, encoding: 'utf8', timeout: 300000 })
  const withoutOut = `${without.stdout}\n${without.stderr}`
  assert.equal(without.status, 1, `web/ was not refused without the flag:\n${withoutOut}`)
  assert.ok(withoutOut.includes('web/app.js') && withoutOut.includes('forbidden path prefix web/'), `the default refusal does not name web/:\n${withoutOut}`)
  // WITH --allowed web/ the forbidden scan passes (the rest of the ladder
  // then judges the served set, which is where this doctored tar fails).
  const withFlag = spawnSync('node', [script, '--pack', doctored, '--version', '4.2.0', '--allowed', 'web/'], { cwd: toy, encoding: 'utf8', timeout: 300000 })
  const withOut = `${withFlag.stdout}\n${withFlag.stderr}`
  assert.ok(withOut.includes('PASS forbidden scan'), `--allowed did not clear the forbidden scan:\n${withOut}`)
  assert.ok(!withOut.includes('forbidden path prefix web/'), `--allowed left web/ forbidden:\n${withOut}`)
  // The `--allow` alias (the spelling the two forked copies shipped) works too.
  const withAlias = spawnSync('node', [script, '--pack', doctored, '--version', '4.2.0', '--allow', 'web/'], { cwd: toy, encoding: 'utf8', timeout: 300000 })
  assert.ok(`${withAlias.stdout}\n${withAlias.stderr}`.includes('PASS forbidden scan'), 'the --allow alias did not clear the forbidden scan')
  // The exemption is PREFIX-SCOPED: a default-forbidden dir the caller did
  // NOT name is still refused by name (only web/ was de-asserted here).
  fs.mkdirSync(path.join(ex, 'package', 'labs'), { recursive: true })
  fs.writeFileSync(path.join(ex, 'package', 'labs', 'secret.json'), '{}')
  const doctored2 = path.join(toy, 'doctored2.tgz')
  spawnSync('tar', ['-czf', doctored2, '-C', path.join(ex, 'package'), '.'], { encoding: 'utf8' })
  const labsRun = spawnSync('node', [script, '--pack', doctored2, '--version', '4.2.0', '--allowed', 'web/'], { cwd: toy, encoding: 'utf8', timeout: 300000 })
  const labsOut = `${labsRun.stdout}\n${labsRun.stderr}`
  assert.equal(labsRun.status, 1, `labs/ slipped through an unrelated --allowed web/:\n${labsOut}`)
  assert.ok(labsOut.includes('forbidden path prefix labs/'), `the refusal does not name labs/:\n${labsOut}`)
  fs.rmSync(toy, { recursive: true, force: true })
})

test('a package with no main/exports/bin SKIPs the load probe by name, never silently', () => {
  const toy = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-release-toy4-'))
  // A shell/factory shape: tool files + templates, no root module to load.
  fs.writeFileSync(path.join(toy, 'package.json'), JSON.stringify({
    name: 'toy-shell',
    version: '4.2.0',
    files: ['tool.cjs'],
  }, null, 2))
  fs.writeFileSync(path.join(toy, 'tool.cjs'), 'module.exports = 1\n')
  const r = spawnSync('npm', ['pack', '--pack-destination', toy], { cwd: toy, encoding: 'utf8', timeout: 120000 })
  assert.equal(r.status, 0, `toy npm pack failed: ${r.stderr}`)
  const tgz = path.join(toy, 'toy-shell-4.2.0.tgz')
  const run = spawnSync('node', [script, '--pack', tgz, '--version', '4.2.0'], { cwd: toy, encoding: 'utf8', timeout: 300000 })
  const out = `${run.stdout}\n${run.stderr}`
  assert.equal(run.status, 0, `the no-entry shape failed the ladder (${run.status}):\n${out}`)
  assert.ok(out.includes('SKIP consumer load probe'), `the skip was not named:\n${out}`)
  fs.rmSync(toy, { recursive: true, force: true })
})

test('the pack ladder verifies real npm pack output (contents + identity + consumer install)', () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'release-verify-'))
  const tgz = packTree(work)
  const r = run(['--pack', tgz, '--version', pkg.version, '--exports', exportsKeys, '--probe', eyeProbe])
  const out = `${r.stdout}\n${r.stderr}`
  assert.equal(r.status, 0, `pack ladder failed (${r.status}):\n${out}`)
  assert.ok(out.includes('PASS forbidden scan'), 'forbidden scan never ran')
  assert.ok(out.includes('PASS served set == npm pack of this tree'), 'expected-set equality never asserted')
  assert.ok(out.includes('PASS identity: eyestruct@'), 'identity line missing')
  assert.ok(out.includes('PASS exports map held'), 'the exports pin never ran')
  if (out.includes('PASS consumer probes')) {
    assert.ok(out.includes('PASS installed bin'), 'the installed bin probe never ran when the install landed')
  }
  // The consumer-install half needs the registry; either a real PASS or a
  // NAMED SKIP is acceptable - a silent absence is not. The message names:
  // 'PASS consumer probes' (+ 'PASS installed bin') on the happy path,
  // 'SKIP consumer install' when the registry is unreachable.
  if (!out.includes('PASS consumer probes')) {
    assert.ok(out.includes('SKIP consumer install'), `no PASS and no named SKIP for the consumer install:\n${out}`)
  }
  fs.rmSync(work, { recursive: true, force: true })
})

test('a forbidden file smuggled into the tarball is refused BY NAME before any install', () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'release-verify-bad-'))
  const tgz = packTree(work)

  // Unpack the honest pack, splice in one labs/ file, re-pack gz. The
  // doctored shell passes tar -tzf and gzip -t like any real tarball,
  // because the threat is a file, not a broken archive.
  const ex = path.join(work, 'extracted')
  fs.mkdirSync(ex, { recursive: true })
  const unt = spawnSync('tar', ['-xzf', tgz, '-C', ex], { encoding: 'utf8' })
  assert.equal(unt.status, 0, `unpack failed: ${unt.stderr}`)
  fs.mkdirSync(path.join(ex, 'package', 'labs'), { recursive: true })
  fs.writeFileSync(path.join(ex, 'package', 'labs', 'evil.txt'), 'DO NOT SHIP: smuggled\n')

  const doctored = path.join(work, 'doctored.tgz')
  // repack from the extracted tree's package/ root so entry names keep the
  // 'package/...' shape the ladder strips - the threat under test is a
  // smuggled FILE, not a renamed root.
  const repack = spawnSync('tar', ['-czf', doctored, '-C', path.join(ex, 'package'), '.'], { encoding: 'utf8' })
  assert.equal(repack.status, 0, `repack failed: ${repack.stderr}`)

  const r = run(['--pack', doctored, '--version', pkg.version])
  const out = `${r.stdout}\n${r.stderr}`
  assert.equal(r.status, 1, `doctored tar PASSED the ladder (${r.status}) - the forbidden scan did not bite:\n${out}`)
  assert.ok(out.includes('labs/evil.txt'), `the refusal does not name the smuggled file:\n${out}`)
  assert.ok(out.includes('FORBIDDEN'), `the refusal does not say why:\n${out}`)
  fs.rmSync(work, { recursive: true, force: true })
})
