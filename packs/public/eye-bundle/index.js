// eye-bundle - the vendored checksummed browser lane as an adversarial
// pack. What it verifies about a target repo's `init --browser-bundle`:
//
//   1. a stated tarball that does not exist is MISSING_INPUT, exit 2 named
//   2. an archive without a chrome exec inside is a named capability
//      refusal (MISSING_PINNED_BROWSER) - never a resolved guess
//   3. a happy install records bundle@<sha16> in the manifest pin, and a
//      re-seed is IDEMPOTENT: the same tarball rides `reused`, the pin
//      and route matrix survive untouched (the bundle-seed CI step's live
//      need: seeding a bundle must not flatten a living manifest)
//   4. installs are checksum-isolated: two different tarballs own two
//      cache dirs; the second recording never clobbers the first install
//
// THE CONTRACT with the target (moduleCtx['eye-bundle']):
//   run(argv, cwdOption) -> { code, stdout, stderr } of the real CLI
//   tmpdir() / writeFile(dir, rel, text) / read(dir, rel) / dispose(dir)
//
// Bounds: the happy install writes the target repo's DEFAULT bundle cache
// (~/.cache/eyestruct/bundles/) with fake chrome text - nothing is ever
// executed (the installs are file receipts only); the decompression-bomb
// class is a documented, docketed bound (the runner's moduleCtx.bounds).

const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const PKG = 'packs/public/eye-bundle'
const REQUIRED_KEYS = ['run', 'tmpdir', 'writeFile', 'read']

function take(ctx, key) {
  const value = ctx?.[key]
  if (value == null) throw new TypeError(`${PKG}: moduleCtx['eye-bundle'].${key} is missing`)
  return value
}

/** A fixture tarball: an inner entry name -> its bytes. Returns the .tgz path. */
function packFixture(ctx, dir, fixtures) {
  const staged = take(ctx, 'tmpdir')()
  fs.mkdirSync(path.join(staged, ...Object.keys(fixtures)[0].split('/').slice(0, -1)), { recursive: true })
  for (const [rel, body] of Object.entries(fixtures)) {
    fs.mkdirSync(path.dirname(path.join(staged, rel)), { recursive: true })
    fs.writeFileSync(path.join(staged, rel), body)
  }
  const gz = path.join(dir, 'fixture.tgz')
  const t = spawnSync('tar', ['-czf', gz, '-C', staged, Object.keys(fixtures)[0]], { encoding: 'utf8' })
  if (t.status !== 0) throw new Error(`fixture tar failed: ${t.stderr}`)
  return gz
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function cacheDirFor(tgz) {
  return path.join(bundleCacheRoot(), sha256(tgz).slice(0, 16))
}

function bundleCacheRoot() {
  return path.join(os.homedir(), '.cache', 'eyestruct', 'bundles')
}

function seedRepo(ctx, dir) {
  take(ctx, 'run')(['init', '--browser-image', 'bundle-fixture:1', '--renderer', 'resvg@2.6.2'], { cwd: dir })
}

const CASES = [
  {
    id: 'bundle-tarball-missing-refused',
    claim: { verdict: 'REFUSED', reason: 'MISSING_INPUT', code: 2 },
    run(ctx, dir) {
      return take(ctx, 'run')(['init', '--browser-bundle', path.join(dir, 'ghost.tgz')], { cwd: dir })
    },
  },
  {
    id: 'chrome-less-archive-refused',
    claim: { verdict: 'REFUSED', reason: 'MISSING_PINNED_BROWSER', code: 2 },
    run(ctx, dir) {
      const gz = packFixture(ctx, dir, { 'not-chrome.txt': 'no executor in here' })
      return take(ctx, 'run')(['init', '--browser-bundle', gz], { cwd: dir })
    },
  },
  {
    id: 'bundle-installs-then-idempotently-reuses',
    claim: { verdict: 'PASSED' },
    checks(ctx, dir) {
      const runFn = take(ctx, 'run')
      const readFn = take(ctx, 'read')
      seedRepo(ctx, dir)
      const gz = packFixture(ctx, dir, { 'chrome-linux64/chrome': '#!/bin/sh\necho fixture-chrome' })
      const first = runFn(['init', '--browser-bundle', gz], { cwd: dir })
      if (first.code !== 0) return `bundle install failed (code ${first.code}): ${String(first.stderr).slice(0, 160)}`
      if (!/installed fixture\.tgz/.test(String(first.stdout))) return 'the install receipt does not say installed'
      const manifest1 = readFn(dir, 'labs/.eyes/manifest.yml')
      if (!manifest1) return 'manifest missing after the bundle install'
      const mm = /browser-bundle: bundle@([0-9a-f]{16})/.exec(manifest1)
      if (!mm) return `the pin carries no bundle@<sha16> recording:\n${manifest1}`
      if (mm[1] !== sha256(gz).slice(0, 16)) return 'the recording prefix does not match the tarball sha256'
      if (!/^routes:/m.test(manifest1)) return 'the route matrix vanished on a seeded repo'
      // IDEMPOTENT re-seed: same tarball, same repo, routes + pin preserved.
      const second = runFn(['init', '--browser-bundle', gz], { cwd: dir })
      if (second.code !== 0) return `the bundle-only re-seed failed (code ${second.code}): ${String(second.stderr).slice(0, 160)}`
      if (!/reused fixture\.tgz/.test(String(second.stdout))) return 'the re-seed did not ride the reuse path'
      const manifest2 = readFn(dir, 'labs/.eyes/manifest.yml')
      const sameBefore = manifest1.slice(0, manifest1.indexOf('browser-bundle:'))
      const sameAfter = manifest2.slice(0, manifest2.indexOf('browser-bundle:'))
      if (sameBefore !== sameAfter) return 'the re-seed drifted the manifest outside the bundle row'
      return null
    },
  },
  {
    id: 'bundle-installs-are-checksum-isolated',
    claim: { verdict: 'PASSED' },
    checks(ctx, dir) {
      const runFn = take(ctx, 'run')
      const readFn = take(ctx, 'read')
      seedRepo(ctx, dir)
      const gzA = packFixture(ctx, dir, { 'chrome-linux64/chrome': 'bundle A' })
      const gzB = packFixture(ctx, dir, { 'chrome-linux/chrome': 'bundle B' })
      const ra = runFn(['init', '--browser-bundle', gzA], { cwd: dir })
      if (ra.code !== 0) return `install A failed: ${String(ra.stderr).slice(0, 160)}`
      const rb = runFn(['init', '--browser-bundle', gzB], { cwd: dir })
      if (rb.code !== 0) return `install B failed: ${String(rb.stderr).slice(0, 160)}`
      const manifest = readFn(dir, 'labs/.eyes/manifest.yml')
      const mm = /browser-bundle: bundle@([0-9a-f]{16})/.exec(manifest)
      if (!mm) return 'the second install left no recording'
      if (mm[1] !== sha256(gzB).slice(0, 16)) return 'the manifest records a stale checksum - installs are not isolated'
      const firstDir = path.join(bundleCacheRoot(), sha256(gzA).slice(0, 16))
      const firstMarker = path.join(firstDir, 'eyestruct-bundle.sha')
      if (!fs.existsSync(firstMarker)) return 'the second install clobbered the first checksum dir'
      const anchor = fs.readFileSync(firstMarker, 'utf8').trim()
      if (!anchor.startsWith(sha256(gzA).slice(0, 16))) return 'the first install integrity marker was tampered by the second install'
      return null
    },
  },
]

function run(ctx) {
  let ok = true
  const rows = []
  for (const tc of CASES) {
    const dir = take(ctx, 'tmpdir')()
    try {
      if (tc.checks) {
        const problem = tc.checks(ctx, dir)
        if (problem) {
          ok = false
          rows.push({ pack: 'eye-bundle', id: tc.id, verdict: 'EXPLOITED', error: problem })
        } else {
          rows.push({ pack: 'eye-bundle', id: tc.id, verdict: 'PASSED' })
        }
      } else {
        const out = tc.run(ctx, dir)
        const stderr = String(out.stderr || '')
        if (out.code === tc.claim.code && stderr.includes(`eyestruct[${tc.claim.reason}]`)) {
          rows.push({ pack: 'eye-bundle', id: tc.id, verdict: 'REFUSED', reason: tc.claim.reason })
        } else {
          ok = false
          rows.push({ pack: 'eye-bundle', id: tc.id, verdict: 'EXPLOITED', expected: tc.claim, got: { code: out.code, stderr: stderr.slice(0, 200) } })
        }
      }
    } catch (err) {
      ok = false
      rows.push({ pack: 'eye-bundle', id: tc.id, verdict: 'EXPLOITED', error: String(err && err.message).slice(0, 200) })
    }
    if (ctx.dispose) ctx.dispose(dir)
  }
  return { ok, rows }
}

module.exports = { run, CASES, PKG, REQUIRED_KEYS }
