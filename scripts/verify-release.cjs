'use strict'
// verify-release - the post-publish trust ladder (the gap the 1.0.0 cut
// personally proved: publish CAN go green while the registry result is
// wrong, because nothing asserted the tarball between proof-of-publish
// and proof-of-work). This script is the reusable core; publish.yml's
// verify job runs it two ways on every cut:
//
//   --npm                 registry ladder: dist-tags.latest == this tree's
//                         package version, the published sha512 matches the
//                         metadata integrity, provenance attestations are
//                         present, then the FULL pack ladder below on the
//                         tarball that is actually served.
//   --gh --tag v1.2.3     release ladder: the GH release object exists for
//                         the tag, its target commit == `git rev-parse
//                         TAG^{commit}`, and the source tarball's file
//                         list diffs clean against `git archive` of that
//                         commit (zero drift).
//
// The battery leg (tests/release-verify.test.js) runs the same script over
// `npm pack` output - THE PACK LADDER EVERY PUSH, offline-first:
//
//   verify-release --pack <tgz>            (the contents ladder, below)
//
// The pack ladder (audience: the 24-file tar, not the 201-file source tar):
//   1. LIST: tar -tzf; every entry minus its package/ prefix.
//   2. FORBIDDEN scan: labs/ web/ docs/ models/ packs/ tests/ .github/
//      node_modules/, source maps, .env*, never ship. Named refusal.
//   3. EXPECTED SET: `npm pack --dry-run --json` on the checkout is the
//      same-algorithm authority for what publish would include - the
//      served set must equal it EXACTLY (no stragglers, no omissions).
//   4. IDENTITY: package/package.json name + version == expected version.
//   5. CONSUMER INSTALL: a scratch tree `npm install <tgz>`, then
//      require('eyestruct') -> ADAPTER_CONTRACT, version, reasonCodes,
//      and the installed bin answering --version as a child process.
//      Honest SKIP (named) when the registry is unreachable - the verify
//      job and CI always have network; a laptop, sometimes not, and the
//      skip is printed rather than swallowed.
//
// Exit contract (tooling, not the frozen reason surface): 0 verified,
// 1 verification failure (named), 2 capability gap (tar/npm/git/gh absent).

'use strict'

const { execFileSync, spawnSync } = require('child_process')
const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..')
const FORBIDDEN_PREFIXES = [
  'labs/', 'web/', 'docs/', 'models/', 'packs/', 'tests/',
  'examples/', 'scripts/', 'node_modules/', '.github/',
]
const FORBIDDEN_SUFFIXES = ['.map', '.env', '.log', '.tgz']

function say(line) { process.stdout.write(line + '\n') }
function die(code, line) {
  process.stderr.write(`[verify-release] FAIL: ${line}\n`)
  process.exit(code)
}
function fail(line) { die(1, line) }
function cap(line) { die(2, line) }

function sh(cmd, args, opts) {
  return spawnSync(cmd, args, { encoding: 'utf8', ...opts })
}

function readVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'))
  if (pkg.name !== 'eyestruct') fail(`checkout package.json is not eyestruct (name: ${pkg.name})`)
  return pkg.version
}

// --- the pack ladder ----------------------------------------------------

function tarList(file) {
  const r = sh('tar', ['-tzf', file])
  if (r.status !== 0) cap(`tar failed to list ${file}: ${r.stderr.trim()}`)
  return r.stdout.trim().split('\n').filter(Boolean).map((n) => n.replace(/^\.{1,2}\//, '')).map((n) => n.replace(/^package\//, '').replace(/^package$/, ''))
}

function forbidden(scan) {
  const hits = []
  for (const name of scan) {
    if (FORBIDDEN_PREFIXES.some((p) => name.startsWith(p))) hits.push(`${name} (forbidden path prefix)`)
    for (const s of FORBIDDEN_SUFFIXES) {
      if (name.endsWith(s)) hits.push(`${name} (forbidden suffix ${s})`)
    }
    if (/(^|\/)\.[\w-]+/.test(name) && !name.startsWith('package/')) hits.push(`${name} (dotfile)`)
  }
  return hits
}

function packLadder(tgz, expectedVersion) {
  say(`[verify-release] pack ladder: ${tgz}`)

  // 2. forbidden scan before anything else - a file that must not ship is
  // refused BY NAME, fast (the doctored-tar battery case relies on this).
  const names = tarList(tgz)
  if (!names.length) fail('the tarball lists zero files')
  const bad = forbidden(names)
  if (bad.length) fail(`FORBIDDEN contents in the tarball: ${bad.join('; ')}`)
  say(`[verify-release] PASS forbidden scan (${names.length} entries, 0 forbidden)`)

  // 3. expected set from the same tree, same algorithm.
  const packRun = sh('npm', ['pack', '--dry-run', '--json'], { cwd: REPO_ROOT })
  let expected = null
  try {
    const packJson = JSON.parse(packRun.stdout)
    expected = (Array.isArray(packJson) ? packJson[0] : packJson).files.map((f) => f.path)
  } catch {
    cap(`npm pack --dry-run --json failed: ${packRun.stderr.trim()}`)
  }
  const gotSet = [...names].sort()
  const want = [...new Set([...expected, 'package.json'])].sort()
  const missing = want.filter((n) => !gotSet.includes(n))
  const extra = gotSet.filter((n) => !want.includes(n))
  if (missing.length || extra.length) {
    fail(`served set != pack set of the release commit - missing: [${missing}] extra: [${extra}]`)
  }
  say(`[verify-release] PASS served set == npm pack of this tree (${want.length} files)`)

  // 4. identity.
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'eyestruct-verify-'))
  const ex = sh('tar', ['-xzf', tgz, '-C', dest])
  if (ex.status !== 0) cap(`tar failed to extract ${tgz}: ${ex.stderr.trim()}`)
  const pkg = JSON.parse(fs.readFileSync(path.join(dest, 'package', 'package.json'), 'utf8'))
  if (pkg.name !== 'eyestruct') fail(`tarball package name is ${pkg.name}`)
  if (pkg.version !== expectedVersion) fail(`tarball version ${pkg.version} != expected ${expectedVersion}`)
  const exportKeys = Object.keys(pkg.exports || {})
  if (exportKeys.join(',') !== '.,./lib/index.js,./package.json') {
    fail(`tarball exports map drifted: [${exportKeys.join(', ')}] - the frozen exports row moved without the mirror`)
  }
  say(`[verify-release] PASS identity: eyestruct@${pkg.version}, exports map held`)

  // 5. consumer install. Network-honest: a named SKIP beats a silent one.
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'eyestruct-consumer-'))
  fs.writeFileSync(path.join(home, 'package.json'), JSON.stringify({ name: 'verify-release', version: '0.0.0', private: true }, null, 2))
  const inst = sh('npm', ['install', '--no-fund', '--no-audit', '--ignore-scripts', tgz], { cwd: home, timeout: 180000 })
  const stderr = `${inst.stderr || ''}`
  if (inst.status !== 0) {
    if (/ENOTFOUND|ECONNREFUSED|EAI_AGAIN|ETIMEDOUT|network/i.test(stderr)) {
      say('[verify-release] SKIP consumer install (registry unreachable - named, not swallowed; the verify job always has network)')
    } else {
      fail(`consumer install failed: ${stderr.trim().slice(-400)}`)
    }
    return
  }
  const probe = spawnSync('node', ['-e', `const e=require('eyestruct');if(e.ADAPTER_CONTRACT!=='eyestruct-adapter@1')process.exit(1);if(e.version!=='${expectedVersion}')process.exit(1);if(!Array.isArray(e.reasonCodes)||!e.reasonCodes.length)process.exit(1)`], { cwd: home, encoding: 'utf8' })
  if (probe.status !== 0) fail(`adapter surface probe failed on the installed tarball (exit ${probe.status})`)
  const binProbe = spawnSync('node', [path.join(home, 'node_modules', 'eyestruct', 'bin', 'eyestruct.js'), '--version'], { cwd: home, encoding: 'utf8' })
  if (binProbe.status !== 0 || binProbe.stdout.trim() !== expectedVersion) {
    fail(`installed bin --version answered "${(binProbe.stdout || '').trim()}" (wanted ${expectedVersion})`)
  }
  say(`[verify-release] PASS consumer install: adapter surface loads (eyestruct-adapter@1), bin --version -> ${binProbe.stdout.trim()}`)
  fs.rmSync(dest, { recursive: true, force: true })
  fs.rmSync(home, { recursive: true, force: true })
}

// --- the registry ladder -------------------------------------------------

function httpsJson(url) {
  return new Promise((resolve, reject) => {
    require('https').get(url, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)) }
      let d = ''
      res.on('data', (c) => { d += c })
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}

function httpsBuffer(url) {
  return new Promise((resolve, reject) => {
    require('https').get(url, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)) }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

async function npmLadder(expectedVersion) {
  say('[verify-release] npm ladder: https://registry.npmjs.org/eyestruct')
  let meta
  try {
    meta = await httpsJson('https://registry.npmjs.org/eyestruct')
  } catch (e) {
    say(`[verify-release] SKIP npm ladder (registry unreachable: ${e.message})`)
    return false
  }
  const latest = meta['dist-tags'] && meta['dist-tags'].latest
  if (latest !== expectedVersion) fail(`registry latest is ${latest}, expected ${expectedVersion} - either the cut did not land or a hand-moved dist-tag sits on a different version`)
  const ver = meta.versions[expectedVersion]
  if (!ver) fail(`registry serves no ${expectedVersion} at all`)
  const att = (ver.dist && (ver.dist.attestations || ver.dist.provenance)) || null
  if (!att) fail(`published ${expectedVersion} carries no provenance attestations - the OIDC trust chain did not stamp this cut`)
  say(`[verify-release] PASS registry latest == ${expectedVersion}, provenance attestations present`)

  const tarball = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'eyestruct-registry-')), 'served.tgz')
  let buf
  try { buf = await httpsBuffer(ver.dist.tarball) } catch (e) {
    say(`[verify-release] SKIP tarball download (${e.message})`)
    return false
  }
  fs.writeFileSync(tarball, buf)
  const got = crypto.createHash('sha512').update(buf).digest('base64')
  const wantIntegrity = (ver.dist.integrity || '').replace(/^sha512-/, '')
  if (!wantIntegrity || got !== wantIntegrity) {
    fail(`served tarball integrity ${got ? got.slice(0, 12) + '...' : '(empty)'} != registry metadata ${wantIntegrity ? wantIntegrity.slice(0, 12) + '...' : '(empty)'}`)
  }
  say('[verify-release] PASS served tarball sha512 == registry integrity metadata')
  packLadder(tarball, expectedVersion)
  return true
}

// --- the release ladder --------------------------------------------------

function ghLadder(tag) {
  const repo = process.env.GITHUB_REPOSITORY
  if (!repo) cap('--gh needs GITHUB_REPOSITORY (it runs inside publish.yml)')
  if (sh('gh', ['--version']).status !== 0) cap('gh CLI not available for the release ladder')
  say(`[verify-release] gh ladder: ${repo} @ ${tag}`)

  const rel = sh('gh', ['api', `repos/${repo}/releases/tags/${tag}`])
  if (rel.status !== 0) fail(`gh ladder: no release object for ${tag} - the tag pushed, the release did not: ${rel.stderr.trim().slice(0, 300)}`)
  let obj
  try { obj = JSON.parse(rel.stdout) } catch { cap(`gh api returned non-JSON: ${rel.stdout.slice(0, 200)}`) }
  const revParse = sh('git', ['rev-parse', `${tag}^{commit}`])
  if (revParse.status !== 0) cap(`git rev-parse ${tag} failed: ${revParse.stderr.trim()}`)
  const commit = revParse.stdout.trim()
  const target = String(obj.target_commitish || '')
  if (target && target !== commit) fail(`release ${tag} pinpoints ${target}, but the tag resolves to ${commit} - the release object and the tag disagree`)
  say(`[verify-release] PASS release object exists, targets the tag's commit ${commit.slice(0, 12)}`)

  // Source tarball == git archive of the release commit.
  const arch = spawnSync('git', ['archive', '--format=tar.gz', commit], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })
  if (arch.status !== 0) cap(`git archive ${commit} failed`)
  const src = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'eyestruct-gh-')), 'src.tgz')
  fs.writeFileSync(src, arch.stdout)
  const archList = tarList(src) // named 'release-commit.tar' style: prefix casers
  const tarFile = path.join(path.dirname(src), 'ghsrc.tgz')
  const dl = spawnSync('gh', ['api', `repos/${repo}/tarball/${tag}`, '-H', 'Accept: application/vnd.github+json'], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })
  if (dl.status !== 0) cap(`gh api tarball download failed`)
  fs.writeFileSync(tarFile, dl.stdout)
  // The GH source tar carries ONE entry git archive never does: its root
  // directory ('owner-repo-sha/'). It is a directory, not a file - a
  // prefix-strip turns it into the empty string, which must be DROPPED,
  // never compared (a name that lost its identity to normalization is
  // not drift; one that kept a wrong identity is). Same rule both sides:
  // strip the top segment, drop what became empty.
  const ghEntries = sh('tar', ['-tzf', tarFile]).stdout.trim().split('\n').filter(Boolean)
  const ghNames = new Set(ghEntries.map((n) => n.replace(/^[^/]+\//, '')).filter(Boolean))
  const archNames = new Set(archList.filter(Boolean))
  const missing = [...archNames].filter((n) => !ghNames.has(n))
  const extra = [...ghNames].filter((n) => !archNames.has(n))
  if (missing.length || extra.length) {
    // JSON.stringify on purpose: an empty string must stay visible - a
    // bare [${list}] interpolates [''] into [] and hides the finding.
    fail(`GH source tarball drifts from the release commit tree - missing: ${JSON.stringify(missing.slice(0, 10))} extra: ${JSON.stringify(extra.slice(0, 10))}`)
  }
  say(`[verify-release] PASS GH source tarball == git archive of ${commit.slice(0, 12)} (${archNames.size} files, zero drift)`)
  fs.rmSync(path.dirname(src), { recursive: true, force: true })
}

// ------------------------------------------------------------------------- 

function main() {
  const a = process.argv.slice(2)
  const wantPack = a.includes('--pack')
  const wantNpm = a.includes('--npm')
  const wantGh = a.includes('--gh')
  if (!wantPack && !wantNpm && !wantGh) {
    say('usage: verify-release [--pack <tgz>] [--npm] [--gh --tag vX.Y.Z] [--version X.Y.Z]')
    process.exit(2)
  }
  const versionArgIdx = a.indexOf('--version')
  const version = versionArgIdx !== -1 ? a[versionArgIdx + 1] : readVersion()

  const tagIdx = a.indexOf('--tag')
  if (wantGh && (tagIdx === -1 || !a[tagIdx + 1])) cap('--gh needs --tag vX.Y.Z')

  ;(async () => {
    let packTarget = null
    if (wantPack) {
      const i = a.indexOf('--pack')
      packTarget = a[i + 1]
      if (!packTarget) cap('--pack needs a tarball path')
    }
    if (wantNpm) {
      const served = await npmLadder(version)
      if (served) packTarget = null // the registry ladder already ran the pack ladder on the SERVED tarball
      if (!served && !wantPack) {
        say('[verify-release] registry unreachable and no --pack target given; nothing verified')
        process.exit(1)
      }
    }
    if (wantPack && packTarget) packLadder(packTarget, version)
    if (wantGh) {
      const gitOk = sh('git', ['rev-parse', '--git-dir'])
      if (gitOk.status !== 0) cap('not a git worktree; the gh ladder needs the release commit')
      ghLadder(a[tagIdx + 1])
    }
    say('[verify-release] VERIFIED: everything it checked is checked.')
  })().catch((e) => cap(e.message))
}

main()
