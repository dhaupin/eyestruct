/**
 * pages/What.jsx - the concrete surface: the verbs, the spine, and the two
 * lanes. Deep reference lives in docs/cli.md and docs/mcp.md.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const DOCS = 'https://docs.creadev.org/eyestruct'

export default function What() {
  usePageMeta({
    path: '/what',
    title: 'What | eyestruct',
    description:
      'One CLI: deterministic look, pixel-level diff, a committed visual memory, and a CI gate. Process-per-look - the only state that survives between looks is git state.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">what</p>
          <h1>
            Eyes, a diff, <span className="accent">and a memory in git.</span>
          </h1>
          <p className="lede">
            eyestruct is a zero-runtime-dependency CLI. Every command is one
            short invocation; the only state that survives between looks is git
            state.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/packs">The pack surface</Link>
            <a className="btn btn-ghost" href={`${DOCS}/cli/`}>CLI reference</a>
            <a className="btn btn-ghost" href={`${DOCS}/mcp/`}>MCP reference</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">The verbs</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            Capture, compare, remember, gate.
          </p>
          <pre className="code"><span className="cm"># the committed memory: manifest + empty ledger</span>{'\n'}eyestruct <span className="k">init</span>{'\n'}{'\n'}<span className="cm"># one crop + element-id map, candidate artifact</span>{'\n'}eyestruct <span className="k">look</span> &lt;url&gt; [--region SEL]{'\n'}{'\n'}<span className="cm"># fresh capture vs the committed baseline</span>{'\n'}eyestruct <span className="k">diff</span> &lt;url&gt; [--against PATH]{'\n'}{'\n'}<span className="cm"># CI: exit 1 on unexplained labs/.eyes/ drift</span>{'\n'}eyestruct <span className="k">gate</span>{'\n'}</pre>
          <p className="lede" style={{ marginTop: 8 }}>
            Plus the agent lane: <code>serve</code> (bake and serve a tree),
            <code>spot</code> (one capture for your own vision), and{' '}
            <code>mcp</code> (the same calls as stdio tools).
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">The spine</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            <code>labs/.eyes/manifest.yml</code> holds the pin (browser image +
            renderer) and the route x viewport x theme matrix.{' '}
            <code>labs/.eyes/&lt;route-slug&gt;/&lt;view&gt;/current.png</code>{' '}
            is the committed baseline. <code>labs/.eyes/ledger.json</code> is
            the append-only row log, and <code>eyestruct gate</code> is the CI
            job that reads it with crashledger semantics.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">Two lanes, one eye</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            The CI lane is the canon: baselines are CI-cut, and a local{' '}
            <code>adopt</code> is an unratified proposal. The instance lane is
            sight: a coding agent serves the baked tree, spots it, reads the
            pixels with its own vision, and re-spots. Candidate-only - the canon
            stays CI-cut even here.
          </p>
          <p style={{ marginTop: 22 }}>
            <Link to="/about" className="btn btn-ghost">Next: about the project</Link>
          </p>
        </div>
      </section>
    </>
  )
}
