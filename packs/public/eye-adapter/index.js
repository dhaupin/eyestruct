// eye-adapter - the SCHEMA CARRIER for the adapter surface. The ruling it
// encodes (2026-10-28): adapters and connectors are STRICTLY bridges -
// they move calls, events, and artifacts between surfaces and may not
// define, author, or evolve schema. Whatever touches schema (row types,
// manifest fields, refusal codes, the adapter contract itself) needs a
// CARRIER in packs/public/ under the packstruct@1 grammar, so the pack
// campaign - not an import - is what gates it. This pack is that carrier:
// it reads the adapter contract as the CLI would (grammar, refusal
// speech, the never-exits law, the proposal-only canon rule) and refuses
// anything that crosses the bridge/carrier line.
//
// moduleCtx['eye-adapter'] - armed by scripts/run-packs.cjs:
//   api()                  -> the real lib/index.js surface (eyestruct-adapter@1)
//   run(argv, opts)        -> { code, stdout, stderr } of the real CLI
//   tmpdir() / dispose(dir)/ writeFile(dir, rel, text)/ read(dir, rel)

const PKG = 'packs/public/eye-adapter'

const BRIDGE_VERBS = ['init', 'gate', 'adopt', 'ledger', 'raster', 'lint-packs']

function take(ctx, key) {
  const value = ctx?.[key]
  if (value == null) throw new TypeError(`${PKG}: moduleCtx.${key} is missing - arm the adapter surface for the pack campaign`)
  return value
}

const CASES = [
  {
    id: 'adapter-surface-is-bridge-only',
    claim: { verdict: 'PASSED' },
    checks(ctx) {
      const api = take(ctx, 'api')()
      if (api.ADAPTER_CONTRACT !== 'eyestruct-adapter@1') return 'the bridge marker drifted from the frozen contract'
      if (api.SCHEMA_CARRIER !== PKG) return 'SCHEMA_CARRIER must name THIS pack - an adapter with no pack carrier is defining schema on its own'
      // The bridge carries THE VERBS, not authorship: no schema-defining
      // surface may appear in the dispatch list without landing here first.
      const exported = Object.keys(api.verbs || {}).sort()
      if (JSON.stringify(exported) !== JSON.stringify(BRIDGE_VERBS.slice().sort())) {
        return `the dispatch surface changed (${exported.join(', ')}) without riding its carrier - add the case here FIRST, then the bridge`
      }
      // One writer of truth per store: the surface must be pass-through to
      // the CLI's own modules, never a private copy with its own rules.
      const reasons = require('../../../lib/reasons.js')
      if (api.FailError !== reasons.FailError) return 'the refusal contract was copied, not shared'
      return null
    },
  },
  {
    id: 'adapter-refusals-speak-the-family-grammar',
    claim: { verdict: 'REFUSED', reason: 'UNKNOWN_COMMAND', code: 1 },
    run(ctx, dir) {
      const api = take(ctx, 'api')()
      try {
        api.dispatch('teleport', api.ctxOf(dir, []))
        return { code: 0, stderr: '(no refusal - the bridge invented a verb)' }
      } catch (err) {
        return { code: err instanceof api.FailError ? 1 : 2, stderr: String(err && err.message) }
      }
    },
  },
  {
    id: 'adapter-never-exits-its-caller',
    claim: { verdict: 'PASSED' },
    run(ctx, dir) {
      const api = take(ctx, 'api')()
      let alive = 'dead'
      try {
        api.dispatch('gate', api.ctxOf(dir, [])) // no manifest -> must throw, not exit
      } catch {
        alive = 'alive'
      }
      if (alive !== 'alive') return { code: 1, stderr: 'the adapter surface exited (or failed to throw) on a refusal - a hosted caller would lose its process' }
      return { code: 0, stderr: '' }
    },
  },
  {
    // ADOPT_TARGET_NOT_ARTIFACT rides the carrier (2026-10-29, the creadev
    // consumer receipt): `adopt <route/view>` landed rows naming slot
    // DIRECTORIES - fs.existsSync called them live, the real capture stayed
    // UNRECORDED behind a row explaining nothing. The write side now
    // refuses the slot shape; this case pins the refusal's speech and its
    // exit class (drift/refusal = 1, the UNKNOWN_FLAG/RASTER_CANVAS shape).
    id: 'adopt-slot-directory-refused',
    claim: { verdict: 'REFUSED', reason: 'ADOPT_TARGET_NOT_ARTIFACT', code: 1 },
    run(ctx, dir) {
      const cli = take(ctx, 'run')
      const seeded = cli(['init', '--browser-image', 'adapter-fixture:1', '--renderer', 'resvg@2.6.2'], { cwd: dir })
      if (seeded.code !== 0) return { code: seeded.code || 1, stderr: `seed failed: ${String(seeded.stderr).slice(0, 160)}` }
      // The documented-broken form (the old help line): a slot, no capture.
      return cli(['adopt', 'home/desktop-1280-dark', '--note', 'the form the old help taught'], { cwd: dir })
    },
  },
  {
    id: 'refusal-grammar-additions-land-in-the-carrier-first',
    claim: { verdict: 'PASSED' },
    checks(ctx, dir) {
      // The interface-honesty code (UNKNOWN_FLAG, joined 2026-10-28 as the
      // 29th): refusal codes are schema, so a registry addition must ride
      // this case FIRST. This case is that receipt - and it pins the new
      // code's exit class (drift/refusal = 1, never a setup class).
      const reasons = require('../../../lib/reasons.js')
      if (!reasons.CODES.UNKNOWN_FLAG) return 'the refusal registry gained a grammar rule without riding its carrier - add the case here FIRST, then the code'
      if (reasons.CODES.UNKNOWN_FLAG !== 1) return 'UNKNOWN_FLAG must keep exit class 1 (drift/refusal), never a setup class'
      if (reasons.CODES.UNKNOWN_COMMAND !== 1) return 'UNKNOWN_COMMAND must keep exit class 1'
      // RASTER_CANVAS joined 2026-11-01 (the canvas-bomb walk round): same
      // carrier-first receipt, same class pin - an allocation-bomb refusal
      // on committed SVGs is a drift/refusal, never a setup error.
      if (!reasons.CODES.RASTER_CANVAS) return 'RASTER_CANVAS landed in the raster gate without its carrier receipt - the case rides here first'
      if (reasons.CODES.RASTER_CANVAS !== 1) return 'RASTER_CANVAS must keep exit class 1 (drift/refusal)'
      // ADOPT_TARGET_NOT_ARTIFACT joined 2026-10-29 (creadev receipt): a
      // slot-vs-capture write-time refusal is drift/refusal, never setup.
      if (!reasons.CODES.ADOPT_TARGET_NOT_ARTIFACT) return 'ADOPT_TARGET_NOT_ARTIFACT landed without its carrier receipt - the case rides here first'
      if (reasons.CODES.ADOPT_TARGET_NOT_ARTIFACT !== 1) return 'ADOPT_TARGET_NOT_ARTIFACT must keep exit class 1 (drift/refusal)'
      return null
    },
  },
  {
    id: 'adapter-canon-is-proposal-only',
    claim: { verdict: 'PASSED' },
    run(ctx, dir) {
      const api = take(ctx, 'api')()
      const cli = take(ctx, 'run')
      // Seed an eye home through the CLI, then adopt THROUGH THE BRIDGE:
      // the row must land as an unratified proposal, and the ratify verb
      // (the canon cutter) must stay OUT of the adapter's dispatch list.
      const seeded = cli(['init', '--browser-image', 'adapter-fixture:1', '--renderer', 'resvg@2.6.2'], { cwd: dir })
      if (seeded.code !== 0) return { code: seeded.code || 1, stderr: `seed failed: ${String(seeded.stderr).slice(0, 160)}` }
      api.dispatch('adopt', api.ctxOf(dir, ['home/desktop-1280/dark/current.png', '--note', 'adapter-side adopt stays a proposal'], true))
      const ledgerRows = JSON.parse(take(ctx, 'read')(dir, 'labs/.eyes/ledger.json'))
      const row = ledgerRows[ledgerRows.length - 1]
      if (row.ratified !== false) return { code: 1, stderr: `an adapter-side adopt wrote ratified:${JSON.stringify(row.ratified)} - the bridge cut canon` }
      if (Object.keys(api.verbs).includes('ratify')) return { code: 1, stderr: 'the bridge exposes ratify - canon is CI-cut; the adapter surface must not carry it' }
      return { code: 0, stderr: '' }
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
          rows.push({ pack: 'eye-adapter', id: tc.id, verdict: 'EXPLOITED', error: problem })
        } else {
          rows.push({ pack: 'eye-adapter', id: tc.id, verdict: 'PASSED' })
        }
      } else {
        const out = tc.run(ctx, dir)
        const stderr = String(out.stderr || '')
        if (out.code === tc.claim.code && stderr.includes(`eyestruct[${tc.claim.reason}]`)) {
          rows.push({ pack: 'eye-adapter', id: tc.id, verdict: 'REFUSED', reason: tc.claim.reason })
        } else if (tc.claim.verdict === 'PASSED') {
          rows.push({ pack: 'eye-adapter', id: tc.id, verdict: out.code === 0 ? 'PASSED' : 'EXPLOITED', error: out.code === 0 ? undefined : stderr.slice(0, 200) })
          if (out.code !== 0) ok = false
        } else {
          ok = false
          rows.push({ pack: 'eye-adapter', id: tc.id, verdict: 'EXPLOITED', expected: tc.claim, got: { code: out.code, stderr: stderr.slice(0, 200) } })
        }
      }
    } catch (err) {
      ok = false
      rows.push({ pack: 'eye-adapter', id: tc.id, verdict: 'EXPLOITED', error: String(err && err.message).slice(0, 200) })
    }
    if (ctx.dispose) ctx.dispose(dir)
  }
  return { ok, rows }
}

module.exports = { run, CASES, PKG }
