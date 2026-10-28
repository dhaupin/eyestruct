/**
 * scripts/build-status.mjs - the family status contract emitter.
 *
 * Generates web/public/status.json from the repo's own COMMITTED ledger
 * files (packs/eye-ledger.json + labs/crashledger.json) and the pack
 * manifests under packs/public/. Zero deps, zero hand-editing: the file
 * is regenerated on every web build, so the served dialect can never
 * lag the ledgers (the stale-26 drift class, killed by construction -
 * the generator reads the same files the battery reconciles against).
 *
 * The dialect (family-status @1, the four-repo contract, docs/status.md):
 *   { schema:1, contract:"family-status@1", repo, site, docs, asOf,
 *     legs:[{leg, verdict, cases, counts, ledger}],
 *     packs:[{name, spec, manifest, cases}] }
 *
 * Verdict rule (additive-first): every case verdict is REFUSED, PASSED,
 * or BOUNDED -> "PASS". Anything else (EXPLOITED, FAILED, a verdict the
 * dialect has never met) -> "RED". The ordering a fresh agent session
 * needs: verdicts come from the ledger rows, never from prose.
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '..', '..')
const OUT_PATH = join(REPO_ROOT, 'web', 'public', 'status.json')

const REPO = 'dhaupin/eyestruct'
const SITE = 'https://eyestruct.creadev.org/status'
const DOCS = 'https://docs.creadev.org/eyestruct/ci/'

const PASS_VERDICTS = new Set(['REFUSED', 'PASSED', 'BOUNDED'])

function legOf(rows, { leg, ledger }) {
  const counts = {}
  let verdict = 'PASS'
  for (const row of rows) {
    const v = row.verdict
    if (v === undefined || v === null) {
      // A row without a verdict is a corruption the battery would refuse
      // elsewhere; here it degrades the leg honestly instead of guessing.
      verdict = 'RED'
      continue
    }
    if (!PASS_VERDICTS.has(v)) verdict = 'RED'
    counts[v] = (counts[v] || 0) + 1
  }
  return { leg, verdict, cases: rows.length, counts, ledger }
}

function packsOf(manifests) {
  return manifests.map((m) => ({
    name: m.name,
    spec: m.spec || 'packstruct@1',
    manifest: m.path,
    cases: m.cases,
  }))
}

/**
 * build({ root }) -> the status object. Exported for the battery test.
 * Throws (refusing, never guessing) when a mandated input is unreadable.
 */
export function build(root = REPO_ROOT) {
  const packLedger = JSON.parse(
    readFileSync(join(root, 'packs', 'eye-ledger.json'), 'utf8')
  )
  const crashLedger = JSON.parse(
    readFileSync(join(root, 'labs', 'crashledger.json'), 'utf8')
  )

  const rows = packLedger.rows
  const findings = crashLedger.findings

  // cases: count ledger rows per pack slug, then assert every committed
  // pack manifest is accounted for in the ledger (a manifest with zero
  // rows is a pack the campaign never fires - that is exactly the gap
  // the eye home refuses, so the emitter refuses too).
  const casesByPack = {}
  for (const row of rows) casesByPack[row.pack] = (casesByPack[row.pack] || 0) + 1

  const manifests = []
  const packsDir = join(root, 'packs', 'public')
  for (const entry of readdirSync(packsDir).sort()) {
    const manifestPath = join(packsDir, entry, 'pack.json')
    if (!statSync(join(packsDir, entry)).isDirectory()) continue
    let spec
    try {
      spec = JSON.parse(readFileSync(manifestPath, 'utf8'))
    } catch (err) {
      throw new Error(`pack ${entry}: pack.json unreadable (${err.message}) - the status contract refuses a pack the campaign cannot count`)
    }
    if (!(spec.name in casesByPack)) {
      throw new Error(`pack ${spec.name}: committed pack has zero ledger rows - run the campaign before serving a status for it`)
    }
    manifests.push({ name: spec.name, spec: 'packstruct@1', path: `packs/public/${entry}/pack.json`, cases: casesByPack[spec.name] })
    delete casesByPack[spec.name]
  }
  if (Object.keys(casesByPack).length) {
    throw new Error(`ledger rows reference unknown packs: ${Object.keys(casesByPack).join(', ')} - refuse, never guess`)
  }

  let asOf = 'worktree'
  try {
    asOf = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    // no git context (zip download): say worktree, never a fake sha
  }

  return {
    schema: 1,
    contract: 'family-status@1',
    repo: REPO,
    site: SITE,
    docs: DOCS,
    asOf,
    legs: [
      legOf(rows, { leg: 'packs', ledger: 'packs/eye-ledger.json' }),
      legOf(findings, { leg: 'crashtest', ledger: 'labs/crashledger.json' }),
    ],
    packs: packsOf(manifests),
  }
}

export function write(root = REPO_ROOT, outPath = OUT_PATH) {
  const status = build(root)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(status, null, 2) + '\n')
  return { status, outPath }
}

// CLI: node scripts/build-status.mjs -> writes web/public/status.json.
// Silent success (npm scripts), refusal prints and exits nonzero.
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { outPath } = write()
    console.log(`family status written: ${outPath}`)
  } catch (err) {
    console.error(`family status REFUSED: ${err.message}`)
    process.exit(1)
  }
}
