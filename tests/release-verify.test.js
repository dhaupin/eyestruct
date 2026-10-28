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

test('the pack ladder verifies real npm pack output (contents + identity + consumer install)', () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'release-verify-'))
  const tgz = packTree(work)
  const r = run(['--pack', tgz, '--version', pkg.version])
  const out = `${r.stdout}\n${r.stderr}`
  assert.equal(r.status, 0, `pack ladder failed (${r.status}):\n${out}`)
  assert.ok(out.includes('PASS forbidden scan'), 'forbidden scan never ran')
  assert.ok(out.includes('PASS served set == npm pack of this tree'), 'expected-set equality never asserted')
  assert.ok(out.includes('PASS identity: eyestruct@'), 'identity line missing')
  // The consumer-install half needs the registry; either a real PASS or a
  // NAMED SKIP is acceptable - a silent absence is not.
  if (!out.includes('PASS consumer install')) {
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
