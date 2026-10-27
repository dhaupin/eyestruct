// eyestruct bundle - the vendored, checksummed browser lane (issue #4).
// THE SHAPE: `init --browser-bundle TARBALL` hashes the tarball once
// (sha256), unpacks it ONCE into the bundle cache under a directory named
// by the checksum prefix, marks the install with an integrity file, and
// records `bundle@<prefix>` in the manifest pin. The capture verbs then
// resolve that exec BEFORE the puppeteer cache and the refusal - offline
// captures inside the pin, no unvetted npm middleman, no resident daemon
// (one tar call at install, zero at capture).
//
// Trust chain: upstream chrome for testing -> tarball -> sha256 in the
// manifest -> integrity marker in the cache. A cache that does not match
// its manifest recording refuses by name (MISSING_PINNED_BROWSER) - the
// bundle is never trusted on presence alone.

'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { fail } = require('./reasons')

const MARKER = 'eyestruct-bundle.sha'

/** The bundle cache root (overridable for tests and CI sandboxes). */
function cacheRoot() {
  return process.env.EYESTRUCT_BUNDLE_CACHE ||
    path.join(os.homedir(), '.cache', 'eyestruct', 'bundles')
}

function sha256File(file) {
  const h = crypto.createHash('sha256')
  const fd = fs.openSync(file, 'r')
  const buf = Buffer.alloc(1024 * 1024)
  try {
    let n
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n))
  } finally {
    fs.closeSync(fd)
  }
  return h.digest('hex')
}

/**
 * Shallowest regular file named exactly "chrome" inside the unpacked
 * bundle. SYMLINKS NEVER QUALIFY: a supplied tarball must not aim the
 * executor at anything outside itself - a chrome symlink is an escape
 * hatch, refused by simply not being an executor (trust is receipt-based,
 * never presence-based).
 */
function findChromeExec(dir) {
  const hits = []
  ;(function walk(d) {
    let entries = []
    try {
      entries = fs.readdirSync(d, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.isFile() && e.name === 'chrome') hits.push(p)
    }
  })(dir)
  if (!hits.length) return null
  hits.sort((a, b) => a.length - b.length || a.localeCompare(b))
  return hits[0]
}

/**
 * Install (or reuse) a chrome bundle tarball. BROWSERLESS: one sha pass
 * plus one tar call - the process-per-look law is untouched.
 */
function install(tarball) {
  if (!tarball || typeof tarball !== 'string' || !tarball.trim()) {
    fail('UNKNOWN_COMMAND', 'bundle install needs a tarball path')
  }
  let sha
  try {
    sha = sha256File(tarball)
  } catch (err) {
    fail('MISSING_INPUT', `${tarball} (${err && err.code ? err.code : String(err)})`)
  }
  const prefix = sha.slice(0, 16)
  const dir = path.join(cacheRoot(), prefix)
  const marker = path.join(dir, MARKER)
  const exec = findChromeExec(dir)
  // Idempotent reuse: same checksum + intact marker + live exec = no
  // re-unpack. The marker is the anchor both at install and at use time.
  if (fs.existsSync(marker) && exec) {
    if (fs.readFileSync(marker, 'utf8').trim() !== sha) {
      fail('MISSING_PINNED_BROWSER', `the bundle cache at ${dir} does not match its integrity marker - clear the cache and re-run init --browser-bundle`)
    }
    fs.chmodSync(exec, 0o755)
    return { dir, exec, sha, prefix, reused: true }
  }
  // Fresh unpack: a partial or stale cache dir never half-survives.
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const tar = spawnSync('tar', ['-xzf', tarball, '-C', dir], { encoding: 'utf8' })
  if (tar.status !== 0) {
    fail('MISSING_INPUT', `${tarball} did not unpack as a gzip tarball (tar exit ${tar.status})`)
  }
  const fresh = findChromeExec(dir)
  if (!fresh) {
    fail('MISSING_PINNED_BROWSER', 'the bundle unpacked but carries no chrome exec - a chrome bundle must contain a chrome binary (e.g. chrome-linux64/chrome)')
  }
  fs.chmodSync(fresh, 0o755)
  fs.writeFileSync(marker, sha + '\n')
  return { dir, exec: fresh, sha, prefix, reused: false }
}

/**
 * The engine's resolution step: pin['browser-bundle'] -> the cache exec.
 * Verifies the marker against the manifest recording (prefix match) every
 * call: the bundle is trusted by receipt, not by existence.
 */
function execForPin(pin) {
  const recorded = pin && pin['browser-bundle']
  if (!recorded) return null
  const m = /^bundle@([0-9a-fA-F]{4,64})/.exec(String(recorded))
  if (!m) fail('MANIFEST_CORRUPT', `pin.browser-bundle must read bundle@<sha-prefix>, got "${recorded}"`)
  const prefix = m[1]
  const dir = path.join(cacheRoot(), prefix)
  const exec = findChromeExec(dir)
  if (!exec) {
    fail('MISSING_PINNED_BROWSER', `the manifest records bundle@${prefix} but the bundle cache has no exec - run \`init --browser-bundle <tarball>\` on this machine with the matching tarball`)
  }
  const marker = path.join(dir, MARKER)
  const anchor = fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8').trim() : null
  if (!anchor || !anchor.startsWith(prefix)) {
    fail('MISSING_PINNED_BROWSER', `the manifest recording bundle@${prefix} does not match the installed bundle's integrity marker - re-install with init --browser-bundle`)
  }
  return exec
}

module.exports = { cacheRoot, install, execForPin, findChromeExec, sha256File, MARKER }
