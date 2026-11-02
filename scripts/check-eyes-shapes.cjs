#!/usr/bin/env node
/**
 * scripts/check-eyes-shapes.cjs - the family-shared canon audit leg.
 *
 * poststruct's `eyestruct-shapes` pack (the family's shared rule set,
 * poststruct#19) audits THIS repo's canon tree through the `eyestructTree`
 * contract: manifest pin drift, ledger schema, dangling canon pointers,
 * receipt provenance, verdict-count drift, reason-table drift, note
 * unsafety. The in-tree re-implementation of the drift classes
 * (check-freshness.cjs step 4) retired in its favor - one audit runs on the
 * family, not one private copy per repo (eyestruct#5).
 *
 * The pack is loaded from the EXACT poststruct devDependency pin
 * (node_modules/poststruct/packs/public/eyestruct-shapes), never a private
 * copy - the same lane every other family verdict rides. No install = a
 * named setup refusal (exit 2), never a fake pass.
 *
 * Arm: EYESTRUCT_TREE (defaults to the repo root).
 * Run: node scripts/check-eyes-shapes.cjs
 * Exit 0 clean, 1 exploited finding(s), 2 setup.
 */
'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const ROOT = path.resolve(__dirname, '..')

// Walk OUT from `root` for the installed pack (a checkout finds its own
// install; a consumer finds the host's). Returns null when absent.
function resolvePack(root) {
  for (let dir = path.resolve(root); ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', 'poststruct', 'packs', 'public', 'eyestruct-shapes', 'index.mjs')
    if (fs.existsSync(candidate)) return candidate
    if (path.dirname(dir) === dir) return null
  }
}

// The repo-tree fsapi the pack's `eyestructTree` contract expects - the
// same shape poststruct's own runner arms (jailed reads, no escapes).
function treeFs(root) {
  const safe = (rel) => (typeof rel === 'string' && !rel.startsWith('/') && !rel.split(/[\\/]/).includes('..') ? rel : null)
  return {
    root,
    exists: (rel) => { const r = safe(rel); return r != null && fs.existsSync(path.join(root, r)) },
    read: (rel) => { const r = safe(rel); try { return r == null ? null : fs.readFileSync(path.join(root, r), 'utf8') } catch { return null } },
    readBuf: (rel) => { const r = safe(rel); try { return r == null ? null : fs.readFileSync(path.join(root, r)) } catch { return null } },
    readdir: (rel) => { const r = safe(rel); try { return r == null ? [] : fs.readdirSync(path.join(root, r)) } catch { return [] } },
  }
}

/** Drive the pack over one tree. Exported so tests exercise the real leg. */
async function runLeg({ root = ROOT, treeRoot } = {}) {
  const packPath = resolvePack(root)
  if (!packPath) {
    return {
      ok: false,
      code: 2,
      rows: [],
      error: 'poststruct is not installed - run `npm ci` (the exact devDependency pin carries packs/public/eyestruct-shapes)',
    }
  }
  const mod = await import(pathToFileURL(packPath).href)
  const pack = mod.default || mod
  const tree = treeRoot ? path.resolve(treeRoot) : path.resolve(root)
  const result = pack.run({ eyestructTree: treeFs(tree) })
  const rows = result.rows || []
  const exploited = rows.filter((r) => r.verdict === 'EXPLOITED')
  return { ok: exploited.length === 0, code: exploited.length ? 1 : 0, rows }
}

if (require.main === module) {
  runLeg({ treeRoot: process.env.EYESTRUCT_TREE }).then((r) => {
    if (r.error) {
      process.stderr.write(`EYES-SHAPES: ${r.error}\n`)
      process.exit(r.code)
    }
    for (const row of r.rows) {
      process.stdout.write(`  ${String(row.verdict).padEnd(9)} ${row.id} - ${row.detail || ''}\n`)
    }
    if (!r.ok) {
      process.stdout.write(`EYES-SHAPES: FAIL (${r.rows.filter((x) => x.verdict === 'EXPLOITED').length} exploited)\n`)
      process.exit(1)
    }
    process.stdout.write(`EYES-SHAPES: PASS (${r.rows.length} case(s), 0 exploited)\n`)
    process.exit(0)
  }).catch((err) => {
    process.stderr.write(`EYES-SHAPES: ${err.message}\n`)
    process.exit(2)
  })
}

module.exports = { runLeg, resolvePack, treeFs }
