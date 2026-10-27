/**
 * components/GateStatusIsland.jsx - the landing's live status island.
 *
 * Runs only in the browser (never prerendered - island contract: no props,
 * reads remote data, replaces the pre-island fallback after hydration).
 *
 * Honest-data rule: every number here is fetched at load from the repo's
 * COMMITTED ledgers on main - the same files a fresh agent session reads.
 * No server, no hidden state, no fabricated dashboards:
 *
 *   packs/eye-ledger.json  { schemaVersion, rows:  [{ pack, id, verdict, reason }] }
 *   labs/crashledger.json  { schemaVersion, findings: [{ id, verdict, detail }] }
 *
 * On fetch failure the island says so plainly and names the source files -
 * it never renders a guessed status.
 */
import { useEffect, useState } from 'react'

const RAW =
  'https://raw.githubusercontent.com/dhaupin/eyestruct/main/'

async function fetchJson(rel, signal) {
  const res = await fetch(RAW + rel, { signal })
  if (!res.ok) throw new Error(`${rel}: HTTP ${res.status}`)
  const data = await res.json()
  if (data.schemaVersion !== 1) throw new Error(`${rel}: unsupported schemaVersion ${data.schemaVersion}`)
  return data
}

function tally(rows) {
  const verdicts = { REFUSED: 0, PASSED: 0, BOUNDED: 0, EXPLOITED: 0 }
  const packs = new Set()
  for (const r of rows) {
    if (verdicts[r.verdict] === undefined) verdicts[r.verdict] = 0
    verdicts[r.verdict] += 1
    packs.add(r.pack)
  }
  return { verdicts, packs: packs.size }
}

export default function GateStatusIsland() {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const [packs, crash] = await Promise.all([
          fetchJson('packs/eye-ledger.json', ctrl.signal),
          fetchJson('labs/crashledger.json', ctrl.signal),
        ])
        const p = tally(packs.rows)
        const c = tally(crash.findings)
        const total = packs.rows.length + crash.findings.length
        const exploited = p.verdicts.EXPLOITED + c.verdicts.EXPLOITED
        const refused = p.verdicts.REFUSED + c.verdicts.REFUSED
        setState({
          status: 'ok',
          total,
          refused,
          passed: p.verdicts.PASSED,
          bounded: p.verdicts.BOUNDED,
          exploited,
          packRows: packs.rows.length,
          packCount: p.packs,
          crashFindings: crash.findings.length,
        })
      } catch (err) {
        if (ctrl.signal.aborted) return
        setState({ status: 'error', message: String(err.message || err) })
      }
    })()
    return () => ctrl.abort()
  }, [])

  if (state.status === 'loading') {
    return <p className="island-loading">Reading the committed ledgers on main (packs/eye-ledger.json, labs/crashledger.json)...</p>
  }

  if (state.status === 'error') {
    return (
      <div className="dash-error" role="status">
        Could not fetch the committed ledgers from main ({state.message}). The
        committed files are the source of truth:
        <code> packs/eye-ledger.json </code>and
        <code> labs/crashledger.json</code>.
      </div>
    )
  }

  const gateState = state.exploited === 0 ? 'is-pass' : 'is-fail'
  const gateChip = state.exploited === 0 ? 'PASS' : 'RED'

  return (
    <>
      <div className={`dash-gate ${gateState}`}>
        <div className="dash-gate-glyph" aria-hidden="true">{gateState === 'is-pass' ? '✓' : '!'}</div>
        <div>
          <div className="dash-gate-title">
            Adversarial status of the committed tree
            <span className="dash-gate-chip">{gateChip}</span>
          </div>
          <div className="dash-gate-sub">
            Fetched live from main's committed ledgers - the same files a fresh
            agent session owns. Verdict mix at fetch time:
            <code> {state.refused} refused</code>,
            <code> {state.passed} passed</code>,
            <code> {state.bounded} bounded</code>,
            <code> {state.exploited} exploited</code>.
          </div>
        </div>
      </div>
      <div className="dash-stats">
        <div className="dash-stat">
          <b>{state.total}</b>
          <span>verdicts on main</span>
        </div>
        <div className="dash-stat">
          <b>{state.packRows}</b>
          <span>pack cases / {state.packCount} packs</span>
        </div>
        <div className="dash-stat">
          <b>{state.crashFindings}</b>
          <span>hostile attacks, all refused</span>
        </div>
        <div className="dash-stat">
          <b className={state.exploited === 0 ? 'verdict-ok' : 'verdict-bad'}>
            {state.exploited}
          </b>
          <span>exploited, ever</span>
        </div>
      </div>
    </>
  )
}
