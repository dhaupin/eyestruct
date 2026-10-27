/**
 * pages/Status.jsx - the live committed-ledger dashboard, promoted from the
 * landing's "the committed memory, live" section. Same honest-data rule: the
 * island fetches at load from the repo's committed ledgers on main, no
 * server, no guessed numbers. Refresh to re-read.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const DOCS = 'https://docs.creadev.org/eyestruct'
const RAW_LEDGERS = 'https://github.com/dhaupin/eyestruct/blob/main'

export default function Status() {
  usePageMeta({
    path: '/status',
    title: 'Live status | eyestruct',
    description:
      'The adversarial verdicts on main, read straight from the committed ledgers - the same files a fresh agent session owns. No server, no hidden state.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">status</p>
          <h1>
            The committed memory, <span className="accent">live.</span>
          </h1>
          <p className="lede">
            This page reads eyestruct's own memory from main the way a fresh
            agent session would: the committed ledger files in git, fetched at
            load - no server, no hidden state, and no numbers fresher than the
            commits. Refresh to re-read.
          </p>
          <div className="cta-row">
            <a className="btn btn-ghost" href={`${RAW_LEDGERS}/packs/eye-ledger.json`}>packs/eye-ledger.json</a>
            <a className="btn btn-ghost" href={`${RAW_LEDGERS}/labs/crashledger.json`}>labs/crashledger.json</a>
            <a className="btn btn-ghost" href="https://github.com/dhaupin/eyestruct/actions/workflows/test.yml">CI runs</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <pre-island data-pre-island="gate-status" data-pre-load="idle">
            <span className="island-loading">Reading the committed ledgers on main (packs/eye-ledger.json, labs/crashledger.json)...</span>
          </pre-island>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What you are looking at</h2>
          <p className="sub">
            Each number is a receipt from a CI leg, not a marketing claim.
          </p>
          <div className="grid">
            <div className="card">
              <h3><span className="glyph">◉</span> verdicts on main</h3>
              <p>Total verdict rows in both committed ledgers - the pack
              campaign and the hostile-attack leg combined. These are the
              files the CI battery reconciles against on every push.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">⇄</span> pack cases</h3>
              <p>Scenarios in the committed packledger, across all packs:
              ledger tampering, manifest corruption, note-free adopts, and
              the self-leg (the canon gates itself).</p>
            </div>
            <div className="card">
              <h3><span className="glyph">✗</span> hostile attacks</h3>
              <p>The crashtest leg: hostile argv batches, MCP stdio frames,
              and ledger file variants. Seeded and deterministic - the same
              commit always fires the same attacks.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">✓</span> exploited, ever</h3>
              <p>The only number that should always read 0. If it does not,
              the next CI run is red and the fix comes before any release
              post cites these ledgers again.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>When it goes red</h2>
          <p className="sub">
            A red gate names its artifact and reason-code. The triage map
            lives in the docs: which leg failed, what the row means, and the
            mechanical fix.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href={`${DOCS}/ci/`}>CI guide</a>
            <a className="btn btn-ghost" href={`${DOCS}/reasons/`}>Reason codes</a>
            <Link className="btn btn-ghost" to="/packs">Packs</Link>
          </div>
        </div>
      </section>
    </>
  )
}
