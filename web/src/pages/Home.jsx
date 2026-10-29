/**
 * pages/Home.jsx - eyestruct's landing. Shell conventions kept (see the
 * flowforge rig README): usePageMeta lives in the component BODY (calling it
 * inside another effect was an invalid hook call - React #321 tore the tree
 * down on the live crashtest site; transcribed fix, see labs/TASKS.md),
 * the .code pre carries the token classes the docs Rouge output shares
 * (.k/.cm), and CTAs compose .btn + a color modifier (the base class
 * carries geometry).
 *
 * Every number on this page is a receipt from the dev tree at the time of
 * writing and is re-checked against shipped output before any release post
 * cites it (the discussions-index claim inventory holds the same list):
 * 38 pack cases / 5 packs (packs/eye-ledger.json, scripts/run-packs.cjs;
 * eye-bundle covers the vendored checksummed browser lane),
 * the seeded 52/52 crashtest leg (labs/crashledger.json baseline),
 * 30 named reason-codes (lib/reasons.js), the two-dispatch canon lane
 * (.github/workflows/eyes-ratify.yml).
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://eyestruct.creadev.org'
const DOCS = 'https://docs.creadev.org/eyestruct'

export default function Home() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/',
    title: 'eyestruct - eyes for production agents',
    description: 'Deterministic look and look-diff with a committed visual memory (.eyes/) that CI can gate. Process-per-look: every command is one short invocation; the only surviving state is git state.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">eyestruct</p>
          <h1>
            Eyes for production agents, <span className="accent">gated like code.</span>
          </h1>
          <p className="lede">
            Look is one short process, never a daemon: capture into a committed
            .eyes/ memory, diff pixel drift under the ledger, and let CI refuse
            an unexplained change - the crashtest ledger pattern aimed at
            appearance instead of attackability.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="https://github.com/dhaupin/eyestruct">See the repo</a>
            <Link className="btn btn-ghost" to="/agents">Agent mode</Link>
            <a className="btn btn-ghost" href={DOCS + '/'}>Read the docs</a>
          </div>
          <pre className="code"><span className="cm"># every look is one short invocation; the surviving state is git state</span>{'\n'}<span className="k">eyestruct</span> <span className="k">look</span> http://localhost:4173/{'\n'}<span className="cm"># CI lane: canon baselines are CI-cut; unexplained drift is refused</span>{'\n'}<span className="k">eyestruct</span> <span className="k">diff</span>{'\n'}<span className="k">eyestruct</span> <span className="k">gate</span>{'\n'}<span className="cm"># instance lane: the agent reads its own work with its own vision</span>{'\n'}<span className="k">eyestruct</span> <span className="k">serve</span> web/dist &amp;{'\n'}<span className="k">eyestruct</span> <span className="k">spot</span> http://127.0.0.1:4173/</pre>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>One contract, two lanes</h2>
          <p className="sub">
            Every command is one short process - never a daemon. The only state
            that survives a look is labs/.eyes/, and it lives in git like
            everything else.
          </p>
          <div className="grid">
            <div className="card">
              <h3><span className="glyph">◉</span> look</h3>
              <p>One route x viewport x theme in, one candidate capture out.
              Missing the pinned browser? A named refusal with an exit class -
              never a fake pass.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">⇄</span> diff</h3>
              <p>Mask-invariant drift: text edges are masked, so a typo never
              hides a real visual change and a policy re-render never invents
              one. Pixels under the mask, not glyph counts.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">✓</span> gate</h3>
              <p>Every nonzero exit is a named reason-code (eyestruct[CODE]).
              Unexplained drift in labs/.eyes/ gets the artifact pointed at and
              exit 1; corruption is refused loudly, never guessed past.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">👁</span> instance</h3>
              <p>The agents-vision loop as a native verb pair: <code>serve</code>
              serves the baked tree with the same headers the host carries,
              <code> spot</code> captures one read-now PNG the coding agent opens
              with its own vision - candidate-only, canon stays CI-cut.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>From candidate to canon - the two-dispatch rule</h2>
          <p className="sub">
            Agents propose; CI disposes. A local adopt is an unratified
            proposal, and the deciding dispatch is never the one that proposed.
          </p>
          <div className="pipeline">
            <div className="pipe-step">
              <div className="pipe-n">01</div>
              <div><strong>look writes a candidate</strong> <span>- into
              labs/.eyes-candidates/ (gitignored, disposable). Baselines are
              never touched by a probe.</span></div>
            </div>
            <div className="pipe-step">
              <div className="pipe-n">02</div>
              <div><strong>adopt proposes, with a note</strong> <span>-
              --note is mandatory at write time (ADOPT_NOTE_REQUIRED). The
              ledger row is the human-readable receipt.</span></div>
            </div>
            <div className="pipe-step">
              <div className="pipe-n">03</div>
              <div><strong>gate reads the tree</strong> <span>- unexplained
              drift names the artifact and exits 1; the reader refuses past a
              corrupt row instead of improvising.</span></div>
            </div>
            <div className="pipe-step">
              <div className="pipe-n">04</div>
              <div><strong>CI cuts canon</strong> <span>- the pinned-image lane
              re-captures every manifest route; drift promotes the pinned-env
              captures as proposals and the NEXT dispatch cuts byte-identical
              rows. Self-certification is impossible by construction.</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="section section-split">
        <div className="split-card">
          <h3>The eye polices itself</h3>
          <p>38 adversarial pack cases over the real CLI, a second leg of 52
          hostile attacks (seeded, deterministic), and a committed verdict
          ledger: a NEW exploited case or any verdict regression fails CI.</p>
          <div className="cta-row">
            <Link className="btn btn-ghost" to="/packs">Packs</Link>
          </div>
        </div>
        <div className="split-card">
          <h3>Status: committed and live</h3>
          <p>The same exposure you get on /packs, read from the same committed
          ledgers fresh agents read - no server, no hidden state, no numbers
          fresher than the commits.</p>
          <div className="cta-row">
            <Link className="btn btn-ghost" to="/status">Live status</Link>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <h2>Install</h2>
          <p className="sub">
            A Node 18+ CLI, no daemons, no background services of any kind.
          </p>
          <pre className="code"><span className="cm"># consumer path</span>{'\n'}<span className="k">npm</span> install --save-dev eyestruct{'\n'}{'\n'}<span className="cm"># contributor path (same install, from source)</span>{'\n'}<span className="k">git</span> clone https://github.com/dhaupin/eyestruct.git{'\n'}<span className="k">cd</span> eyestruct {'\n&&'} <span className="k">npm</span> ci --no-audit --no-fund</pre>
          <p className="field-report">
            Also on the <a href="https://www.npmjs.com/package/eyestruct">npm
            package page</a> - same install, versions and registry metadata.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href={DOCS + '/start/'}>Getting started</a>
            <a className="btn btn-ghost" href={DOCS + '/playbooks/'}>Playbooks</a>
            <a className="btn btn-ghost" href={DOCS + '/reasons/'}>Reason codes</a>
            <a className="btn btn-ghost" href="https://github.com/dhaupin/eyestruct">See the repo</a>
          </div>
        </div>
      </section>
    </>
  )
}
