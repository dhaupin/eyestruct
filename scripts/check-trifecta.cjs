#!/usr/bin/env node
/**
 * scripts/check-trifecta.cjs - the README / AGENTS / deploy-lane / CHANGELOG
 * freshness leg (the round-2 audit, made cheap and repeatable).
 *
 *   1. README's usage fence shows only verbs the real dispatch owns and
 *      only flags `usage()` offers (the round-1 catches: phantom `--route`).
 *   2. Every .yml lane README/AGENTS cite exists in .github/workflows/.
 *   3. Every `npm run <script>` README/AGENTS cite exists in package.json.
 *   4. AGENTS receipt inventory matches the tree LIVE (reason codes, pack
 *      verdicts, crashtest findings, pack count), whitespace-normalized -
 *      prose line breaks are cosmetic, claims are not.
 *   5. README docs deep links resolve on disk; Creadev.org named.
 *   6. CHANGELOG Unreleased block: every backticked path claim exists on
 *      disk and every backticked commit hash exists in history (hash check
 *      skipped without a .git dir). Historical release sections are
 *      receipts of their era and stay out of scope (round-2 ruling:
 *      docs/verbs.md was real at 0.9.0, folded into cli.md later) - but
 *      the block must still carry a dated Added heading.
 *
 * Run: node scripts/check-trifecta.cjs [--json] [--root <dir>]
 * Exit 0 green, 1 stale (named STALE lines; never a stack trace).
 * Behavior lives in runTri(); the CLI is a thin shell so tests can drive
 * the same checks against temp fixtures (behavior-only, temp dirs).
 */
'use strict'
const fs = require('fs')
const path = require('path')

function read(p) {
  try { return fs.readFileSync(p, 'utf8') } catch { return null }
}

/** parse the COMMANDS registry out of the bin source (names only) */
function dispatchVerbs(binText) {
  const m = binText.match(/const COMMANDS = \{([\s\S]*?)\n\}/)
  if (!m) return null
  const verbs = new Set()
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^\s*'([a-z-]+)':/) || line.match(/^\s*([a-z-]+):/)
    if (kv) verbs.add(kv[1])
  }
  return verbs.size ? verbs : null
}

/** `--flag` tokens bin's usage() offers */
function usageFlags(binText) {
  const m = binText.match(/function usage\(\) \{[\s\S]*?\n\}/)
  if (!m) return new Set()
  return new Set(m[0].match(/--[a-z][\w-]*/g) || [])
}

function fenceBlocks(text) {
  const blocks = []
  let inFence = false
  let cur = []
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) {
      if (inFence) blocks.push(cur.join('\n'))
      inFence = !inFence
      cur = []
    } else if (inFence) cur.push(line)
  }
  if (inFence) blocks.push(cur.join('\n'))
  return blocks
}

/** collapsed whitespace: prose claims match across line wraps */
const norm = (text) => text.replace(/\s+/g, ' ')

function unreleasedSlice(text) {
  const start = text.indexOf('## [Unreleased]')
  // No Unreleased header = nothing is unreleased (the release-cut shape,
  // receipts stay in their dated sections): the audit slice is EMPTY, not
  // the whole file - the whole-file fallback made a folded CHANGELOG audit
  // every historical path citation as a fresh claim (the GHOST_PATH/
  // NO_DATED_ADDED false rows the fold exposed, fixed here).
  if (start === -1) return ''
  const rest = text.slice(start)
  const afterHeading = /^## \[Unreleased\][^\n]*\n/.exec(rest)
  const body = afterHeading ? rest.slice(afterHeading[0].length) : rest
  const next = body.search(/^## \[/m)
  return next === -1 ? body : body.slice(0, next)
}

function runTri({ root }) {
  const rootPath = path.resolve(root)
  const lines = []
  const stale = []
  const pass = (n) => lines.push(`ok ${n}`)

  const readme = read(path.join(rootPath, 'README.md'))
  const agents = read(path.join(rootPath, 'AGENTS.md'))
  const changelog = read(path.join(rootPath, 'CHANGELOG.md'))
  const bintext = read(path.join(rootPath, 'bin', 'eyestruct.js'))
  const pkgText = read(path.join(rootPath, 'package.json'))
  for (const [name, text] of [['README.md', readme], ['AGENTS.md', agents], ['CHANGELOG.md', changelog]]) {
    if (text == null) stale.push(`STALE (MISSING_TRIFECTA_FILE) ${name} is absent from the root`)
  }
  if (bintext == null) {
    stale.push('STALE (MISSING_DISPATCH) bin/eyestruct.js is absent - no dispatch to check claims against')
  }
  const hasAll = readme != null && agents != null && changelog != null && bintext != null

  // 1. dispatch <-> README usage fence
  if (hasAll) {
    const verbs = dispatchVerbs(bintext)
    if (!verbs) {
      stale.push('STALE (DISPATCH_UNPARSEABLE) the COMMANDS registry could not be read - fix the checker, never guess')
    } else {
      const flags = usageFlags(bintext)
      let phantom = 0
      for (const block of fenceBlocks(readme)) {
        for (const m of block.matchAll(/eyestruct\s+([a-z-]+)/g)) {
          if (!verbs.has(m[1])) {
            stale.push(`STALE (PHANTOM_VERB) README shows "eyestruct ${m[1]}" - not a real command`)
            phantom++
          }
        }
        for (const m of block.matchAll(/--[a-z][\w-]*/g)) {
          if (!flags.has(m[0])) {
            stale.push(`STALE (PHANTOM_FLAG) README shows "${m[0]}" - usage() does not offer it`)
            phantom++
          }
        }
      }
      if (!phantom) pass(`dispatch census: README fence verbs + flags all real (${verbs.size} commands in bin)`)
    }
  }

  // 2. workflows cited exist
  if (hasAll) {
    const flows = new Set()
    for (const text of [readme, agents]) {
      for (const m of text.matchAll(/`([a-z0-9-]+\.yml)`/g)) flows.add(m[1])
    }
    let missing = 0
    for (const f of flows) {
      if (!fs.existsSync(path.join(rootPath, '.github', 'workflows', f))) {
        stale.push(`STALE (GHOST_WORKFLOW) ${f} is cited but .github/workflows/${f} does not exist`)
        missing++
      }
    }
    if (!missing) pass(`workflow map: ${flows.size} cited lane(s) exist on disk`)
  }

  // 3. npm scripts cited exist
  if (hasAll && pkgText != null) {
    let pkgScripts = {}
    try {
      pkgScripts = JSON.parse(pkgText).scripts || {}
    } catch {
      stale.push('STALE (BAD_PACKAGE_JSON) package.json does not parse')
    }
    const cited = new Set()
    for (const text of [readme, agents]) {
      for (const m of text.matchAll(/npm run ([a-z][\w:.-]*)/g)) cited.add(m[1])
      for (const m of text.matchAll(/npm test/g)) cited.add('test')
    }
    let missing = 0
    for (const s of cited) {
      if (!pkgScripts[s]) {
        stale.push(`STALE (GHOST_SCRIPT) "npm run ${s}" is cited but package.json has no such script`)
        missing++
      }
    }
    if (!missing) pass(`npm scripts: ${cited.size} cited script(s) exist`)
  }

  // 4. AGENTS receipt inventory vs the tree
  if (agents != null) {
    const claims = norm(agents)
    okReceipts(claims, rootPath, stale, () => pass('receipt inventory: AGENTS counts match the tree'))
  }

  // 5. README docs deep links + Creadev.org
  if (readme != null) {
    let missing = 0
    for (const m of readme.matchAll(/docs\.creadev\.org\/eyestruct\/([a-z-]+)/g)) {
      const page = m[1]
      if (!fs.existsSync(path.join(rootPath, 'docs', `${page}.md`)) &&
          !fs.existsSync(path.join(rootPath, 'docs', page, 'index.md'))) {
        stale.push(`STALE (GHOST_DOC_PAGE) README links /eyestruct/${page} - no docs/${page}.md on disk`)
        missing++
      }
    }
    if (!/creadev\.org/.test(readme)) stale.push('STALE (NO_WORKSHOP_LINK) README never names Creadev.org')
    if (!missing && readme.includes('creadev.org')) pass('README surfaces: docs deep links resolve; Creadev.org named')
  }

  // 6. CHANGELOG Unreleased claims exist + dated heading
  if (changelog != null) {
    const current = unreleasedSlice(changelog)
    let missing = 0
    for (const m of current.matchAll(/`((?:lib|bin|docs|web|packs|labs|scripts|\.github)\/[\w./-]+)`/g)) {
      const p = m[1].replace(/[.,;]$/, '')
      if (!fs.existsSync(path.join(rootPath, p))) {
        stale.push(`STALE (GHOST_PATH) CHANGELOG Unreleased cites ${p} - not on disk`)
        missing++
      }
    }
    if (/## \[Unreleased\]/.test(changelog)) {
      // The header's own contract: present = it must carry a dated Added
      // heading (REAL futures only). Absent = the release-cut shape, receipts
      // live in their dated sections - nothing unreleased is a PASS here too
      // (the whole-file fallback was the bug the 0.9.0 fold exposed).
      if (/### Added \(\d{4}-\d{2}-\d{2}\)/.test(changelog)) {
        pass('CHANGELOG: Unreleased carries a dated Added heading')
      } else {
        stale.push('STALE (NO_DATED_ADDED) CHANGELOG Unreleased block lost its dated Added heading')
      }
      if (!missing) pass('CHANGELOG paths: every Unreleased-cited artifact exists on disk')
    } else {
      pass('CHANGELOG: no Unreleased block - the release-cut shape, receipts live in their dated sections')
    }
  }

  // 7. cited commit hashes exist in history (skipped without .git).
  // Clone-depth contract (eyestruct#6): a depth-1 consumer clone answers
  // every history probe falsely (GHOST_COMMIT for real commits), so a
  // shallow checkout self-deepens ONCE before verifying. A refused deepen
  // is a NAMED stale row - never a silent skip, never a fake pass.
  if (fs.existsSync(path.join(rootPath, '.git')) && changelog != null) {
    let unstated = false
    if (fs.existsSync(path.join(rootPath, '.git', 'shallow'))) {
      const deepen = require('node:child_process').spawnSync('git', ['fetch', '--unshallow', 'origin'], { cwd: rootPath, encoding: 'utf8' })
      if (deepen.status !== 0) {
        stale.push('STALE (SHALLOW_CLONE) .git is shallow and auto-unshallow refused; receipt hashes unverifiable')
        // Skip the per-hash probes: a depth-1 history answers every probe
        // falsely, so running them would only stack noisy GHOST_COMMIT rows
        // under the one row that names the real cause.
        unstated = true
      }
    }
    const hashes = new Set()
    for (const m of unreleasedSlice(changelog).matchAll(/`([0-9a-f]{7,40})`/g)) hashes.add(m[1])
    let missing = 0
    for (const h of unstated ? new Set() : hashes) {
      const r = require('node:child_process').spawnSync('git', ['cat-file', '-e', `${h}^{commit}`], { cwd: rootPath })
      if (r.status !== 0) {
        stale.push(`STALE (GHOST_COMMIT) cited hash ${h} is not in this repo's history`)
        missing++
      }
    }
    if (!missing && hashes.size) pass(`change receipts: ${hashes.size} cited commit hash(es) exist in history`)
  }

  return { ok: stale.length === 0, lines, stale }
}

/** AGENTS counts vs the tree; each mismatch is one named STALE row */
function okReceipts(claims, rootPath, stale, onOk) {
  let ok = true
  try {
    const mod = require(path.join(rootPath, 'lib', 'reasons.js'))
    const rc = Object.keys(mod.CODES || mod.reasons || {}).length
    if (!new RegExp(`${rc} reason-codes`).test(claims)) {
      stale.push(`STALE (RECEIPT_DRIFT) AGENTS claims a different reason-code count than lib/reasons.js exports (${rc})`)
      ok = false
    }
  } catch { /* the reasons module is the 0-1-2 contract's own; its absence fails elsewhere */ }
  try {
    const rows = JSON.parse(fs.readFileSync(path.join(rootPath, 'packs', 'eye-ledger.json'), 'utf8')).rows.length
    if (!new RegExp(`${rows} pack verdicts`).test(claims)) {
      stale.push(`STALE (RECEIPT_DRIFT) AGENTS claims a different pack-verdict count than packs/eye-ledger.json holds (${rows})`)
      ok = false
    }
  } catch { /* the pack lane refuses loudly elsewhere */ }
  try {
    const f = JSON.parse(fs.readFileSync(path.join(rootPath, 'labs', 'crashledger.json'), 'utf8')).findings.length
    if (!new RegExp(`${f}/${f} hostile`).test(claims)) {
      stale.push(`STALE (RECEIPT_DRIFT) AGENTS claims a different hostile-leg count than labs/crashledger.json holds (${f}/${f})`)
      ok = false
    }
  } catch { /* the crashtest leg owns that ledger's refusal */ }
  try {
    const pc = fs.readdirSync(path.join(rootPath, 'packs', 'public'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(rootPath, 'packs', 'public', d.name, 'pack.json'))).length
    if (!new RegExp(`${pc} adversarial packs`).test(claims)) {
      stale.push(`STALE (RECEIPT_DRIFT) AGENTS claims a different pack count than packs/public holds (${pc})`)
      ok = false
    }
  } catch { /* packs/public missing: the pack lane owns that refusal */ }
  if (ok) onOk()
}

if (require.main === module) {
  const argv = process.argv.slice(2)
  const rootIdx = argv.indexOf('--root')
  const root = rootIdx !== -1 ? argv[rootIdx + 1] : path.resolve(__dirname, '..')
  const { ok, lines, stale } = runTri({ root })
  if (argv.includes('--json')) {
    process.stdout.write(JSON.stringify({ ok, lines, stale }, null, 2) + '\n')
  } else {
    for (const l of [...lines, ...stale]) process.stdout.write(l + '\n')
    process.stdout.write((ok ? 'TRIFECTA: PASS' : 'TRIFECTA: FAIL') + '\n')
  }
  process.exit(ok ? 0 : 1)
}

module.exports = { runTri, dispatchVerbs, usageFlags, unreleasedSlice }
