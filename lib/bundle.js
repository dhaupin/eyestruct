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
// bundle is never trusted on presence alone. And the receipt cannot lie
// about the bytes either: install hashes and extracts through ONE open
// file description (the fd pin below), so a directory-entry swap between
// the hash and the extract has nothing left to race with.

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

/**
 * sha256 from an OPEN fd using positioned reads only. The shared file
 * offset never advances, so the same fd can then be handed to the tar
 * extractor without it reading from EOF - this is the fd pin below.
 */
function sha256Fd(fd) {
  const h = crypto.createHash('sha256')
  const buf = Buffer.alloc(1024 * 1024)
  let pos = 0
  for (;;) {
    const n = fs.readSync(fd, buf, 0, buf.length, pos)
    if (n === 0) break
    h.update(buf.subarray(0, n))
    pos += n
  }
  return h.digest('hex')
}

function sha256File(file) {
  const fd = fs.openSync(file, 'r')
  try {
    return sha256Fd(fd)
  } finally {
    fs.closeSync(fd)
  }
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
/**
 * The fd pin: the tarball is hashed and extracted through ONE open file
 * description, so the bytes tar unpacks are the bytes that were hashed -
 * a directory-entry swap between the two operations cannot close the gap
 * (the old hash-then-extract race, closed, not docketed). /dev/fd must
 * exist for the fd path (Linux procfs alias / macOS); a platform without
 * it degrades to the raw path - the race argument stays named in the
 * TASKS docket so the degraded case is never silent.
 */
const FD_DIR = '/dev/fd'
// The parent's fd NUMBER and the child's fd NUMBER are not the same thing:
// passing the fd as stdio entry index 3 hands it to tar AS fd 3, so the
// path the extractor opens is /dev/fd/3 no matter what number the parent
// got from openSync (the staged-swap battery leg pins this beside the
// race receipt). Platforms without /dev/fd mount degrade to the raw
// extract path, named in the docket - never silently.
const CHILD_FD_PATH = '/dev/fd/3'

function fdPath() {
  try {
    fs.readdirSync(FD_DIR)
    return CHILD_FD_PATH
  } catch {
    return null
  }
}

/**
 * Install (or reuse) a chrome bundle from an ALREADY-OPEN tarball fd.
 * BROWSERLESS: one sha pass over the fd plus one tar call through the
 * same fd - the process-per-look law is untouched, and no second source
 * exists for the extractor to be lied to about.
 */
function installOpen(tarballFd, source) {
  let sha
  try {
    sha = sha256Fd(tarballFd)
  } catch (err) {
    fail('MISSING_INPUT', `${source} (${err && err.code ? err.code : String(err)})`)
  }
  const prefix = sha.slice(0, 16)
  const dir = path.join(cacheRoot(), prefix)
  const marker = path.join(dir, MARKER)
  const exec = findChromeExec(dir)
  try {
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
    const src = fdPath() || source
    const tar = spawnSync('tar', ['-xzf', src, '-C', dir], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe', tarballFd] })
    if (tar.status !== 0) {
      fail('MISSING_INPUT', `${source} did not unpack as a gzip tarball (tar exit ${tar.status})`)
    }
    const fresh = findChromeExec(dir)
    if (!fresh) {
      fail('MISSING_PINNED_BROWSER', 'the bundle unpacked but carries no chrome exec - a chrome bundle must contain a chrome binary (e.g. chrome-linux64/chrome)')
    }
    // Post-verify: re-hash the SAME file description after the extract. The
    // fd pin already killed the rename-over swap; this closes the in-place
    // writer that modifies the tarball's bytes during the extract window -
    // the extracted cache can no longer carry bytes the hash does not
    // vouch for. Residual after this: an attacker who restores the original
    // bytes immediately before the re-hash (an adversarial restore race);
    // named in the TASKS docket, never silently passed.
    if (sha256Fd(tarballFd) !== sha) {
      fail('MISSING_PINNED_BROWSER', `${source} changed while the bundle was being installed (a swap raced the extract) - re-run init --browser-bundle with one immutable tarball`)
    }
    fs.chmodSync(fresh, 0o755)
    fs.writeFileSync(marker, sha + '\n')
    return { dir, exec: fresh, sha, prefix, reused: false }
  } finally {
    fs.closeSync(tarballFd)
  }
}

/**
 * Install (or reuse) a chrome bundle tarball. Opens the tarball ONCE and
 * passes the fd to installOpen: hash and extract share one file
 * description, so the receipt and the unpacked bytes cannot diverge.
 */
function install(tarball) {
  if (!tarball || typeof tarball !== 'string' || !tarball.trim()) {
    fail('UNKNOWN_COMMAND', 'bundle install needs a tarball path')
  }
  let fd
  try {
    fd = fs.openSync(tarball, 'r')
  } catch (err) {
    fail('MISSING_INPUT', `${tarball} (${err && err.code ? err.code : String(err)})`)
  }
  return installOpen(fd, tarball)
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

module.exports = { cacheRoot, install, installOpen, execForPin, findChromeExec, sha256File, sha256Fd, fdPath, CHILD_FD_PATH, MARKER }
